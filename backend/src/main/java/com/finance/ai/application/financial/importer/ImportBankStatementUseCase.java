package com.finance.ai.application.financial.importer;

import com.finance.ai.domain.financial.Account;
import com.finance.ai.domain.financial.AccountRepository;
import com.finance.ai.domain.financial.AccountType;
import com.finance.ai.domain.financial.Transaction;
import com.finance.ai.domain.financial.TransactionOrigin;
import com.finance.ai.domain.financial.TransactionRepository;
import com.finance.ai.domain.financial.TransactionType;
import com.finance.ai.domain.financial.importer.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class ImportBankStatementUseCase {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final ImportBatchRepository importBatchRepository;
    private final MerchantCategoryClassifier merchantCategoryClassifier;
    private final OfxParser ofxParser = new OfxParser();
    private final CsvParser csvParser = new CsvParser();
    private final ExcelParser excelParser = new ExcelParser();
    private final InstallmentDetector installmentDetector = new InstallmentDetector();

    public ImportBankStatementUseCase(AccountRepository accountRepository,
                                     TransactionRepository transactionRepository,
                                     ImportBatchRepository importBatchRepository,
                                     MerchantCategoryClassifier merchantCategoryClassifier) {
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.importBatchRepository = importBatchRepository;
        this.merchantCategoryClassifier = merchantCategoryClassifier;
    }

    @Transactional
    public ImportStatementResult execute(UUID userId, UUID accountId, String fileName, byte[] fileBytes) throws IOException {
        return execute(userId, accountId, fileName, fileBytes, null);
    }

    @Transactional
    public ImportStatementResult execute(UUID userId, UUID accountId, String fileName, byte[] fileBytes, Boolean isCreditCard) throws IOException {
        UUID targetAccountId = accountId;
        if (targetAccountId == null) {
            var userAccounts = accountRepository.findAllByUserId(userId);
            if (!userAccounts.isEmpty()) {
                targetAccountId = userAccounts.get(0).getId();
            } else {
                var defaultAccount = Account.create(userId, "Conta Principal", AccountType.CHECKING, BigDecimal.ZERO);
                targetAccountId = accountRepository.save(defaultAccount).getId();
            }
        } else {
            accountRepository.findByIdAndUserId(targetAccountId, userId)
                    .orElseThrow(() -> new IllegalArgumentException("Conta de destino não encontrada ou não pertence ao usuário."));
        }

        String cleanName = (fileName != null ? fileName : "extrato.csv").toLowerCase().trim();
        String fileType;
        if (cleanName.endsWith(".ofx")) {
            fileType = "OFX";
        } else if (cleanName.endsWith(".xlsx") || cleanName.endsWith(".xls")) {
            fileType = "EXCEL";
        } else {
            fileType = "CSV";
        }

        boolean detectedCard = Boolean.TRUE.equals(isCreditCard) || (isCreditCard == null && isCardFileName(cleanName));

        List<ParsedTransactionItem> parsedItems;
        try (InputStream is = new ByteArrayInputStream(fileBytes)) {
            parsedItems = switch (fileType) {
                case "OFX" -> ofxParser.parse(is, detectedCard);
                case "EXCEL" -> excelParser.parse(is, detectedCard);
                default -> csvParser.parse(is, detectedCard);
            };
        }

        if (parsedItems.isEmpty()) {
            return new ImportStatementResult(
                    UUID.randomUUID(),
                    cleanName,
                    fileType,
                    0,
                    0,
                    "Nenhum lançamento identificado no arquivo."
            );
        }

        // Carrega transações existentes do usuário para deduplicação inteligente e conciliação de parcelas
        var existingTransactions = transactionRepository.findAllByUserId(userId);
        Set<String> existingSignatures = new HashSet<>();
        java.util.Map<String, Transaction> existingInstallmentMap = new java.util.HashMap<>();

        for (var tx : existingTransactions) {
            if (targetAccountId.equals(tx.getAccountId()) || tx.getAccountId() == null) {
                // Assinatura exata: data|valor|descrição simplificada
                String sig = tx.getAccrualDate() + "|" + tx.getAmount() + "|" + tx.getDescription().toLowerCase().trim();
                existingSignatures.add(sig);

                // Assinatura canônica de parcela: ano-mês|valor|cleanMerchant|parcela/total
                var matchOpt = installmentDetector.detect(tx.getDescription());
                if (matchOpt.isPresent()) {
                    var m = matchOpt.get();
                    var ym = java.time.YearMonth.from(tx.getAccrualDate());
                    String canonicalSig = ym + "|" + tx.getAmount() + "|" + m.cleanMerchant() + "|" + m.current() + "/" + m.total();
                    existingInstallmentMap.put(canonicalSig, tx);
                }
            }
        }

        int importedCount = 0;
        int skippedCount = 0;
        var batchId = UUID.randomUUID();
        java.util.Map<String, UUID> batchRecurringGroupIds = new java.util.HashMap<>();

        for (var item : parsedItems) {
            String itemSig = item.date() + "|" + item.amount() + "|" + item.description().toLowerCase().trim();

            TransactionType type;
            if (item.isExpense()) {
                type = TransactionType.EXPENSE;
            } else {
                // Se for pagamento de fatura, registra como INVOICE_PAYMENT para prevenir distorção e dupla contagem
                if (isInvoicePaymentDescription(item.description())) {
                    type = TransactionType.INVOICE_PAYMENT;
                } else {
                    type = TransactionType.INCOME;
                }
            }

            var origin = switch (fileType) {
                case "OFX" -> TransactionOrigin.OFX_IMPORT;
                case "EXCEL" -> TransactionOrigin.EXCEL_IMPORT;
                default -> TransactionOrigin.CSV_IMPORT;
            };

            UUID categoryId = null;
            if (type == TransactionType.EXPENSE || type == TransactionType.INCOME) {
                categoryId = merchantCategoryClassifier.resolveCategoryId(userId, item.description());
            }

            // Identifica se este item é uma compra parcelada (ex: Havan 3/5 ou Parcela 5/6)
            var itemMatchOpt = (detectedCard || type == TransactionType.EXPENSE)
                    ? installmentDetector.detect(item.description())
                    : java.util.Optional.<InstallmentDetector.InstallmentMatch>empty();

            String canonicalSig = null;
            UUID recurringGroupId = null;
            if (itemMatchOpt.isPresent()) {
                var m = itemMatchOpt.get();
                var ym = java.time.YearMonth.from(item.date());
                canonicalSig = ym + "|" + item.amount() + "|" + m.cleanMerchant() + "|" + m.current() + "/" + m.total();
                if (m.total() > 1 && type == TransactionType.EXPENSE) {
                    String groupKey = m.cleanMerchant() + "|" + m.total() + "|" + item.amount();
                    recurringGroupId = batchRecurringGroupIds.computeIfAbsent(
                            groupKey,
                            k -> resolveRecurringGroupId(existingTransactions, m, item.amount(), UUID.randomUUID())
                    );
                }
            }

            boolean isExactDuplicate = existingSignatures.contains(itemSig);
            boolean isInstallmentDuplicate = canonicalSig != null && existingInstallmentMap.containsKey(canonicalSig);

            if (isExactDuplicate || isInstallmentDuplicate) {
                // Lançamento já existe no banco de dados para este mês!
                skippedCount++;

                // Se era uma projeção automática prévia do mês anterior, atualiza para lançamento oficial com a data exata da fatura
                if (isInstallmentDuplicate) {
                    var existingTx = existingInstallmentMap.get(canonicalSig);
                    if (existingTx.getNotes() != null && existingTx.getNotes().contains("projetada automaticamente")) {
                        String notesPrefix = (recurringGroupId != null)
                                ? "RECURRING_EXPENSE:" + recurringGroupId + " (" + itemMatchOpt.get().current() + "/" + itemMatchOpt.get().total() + ") | "
                                : "";
                        var updated = existingTx.withUpdates(
                                existingTx.getType(),
                                existingTx.getAmount(),
                                item.date(),
                                item.date(),
                                item.description(),
                                existingTx.getAccountId(),
                                existingTx.getDestinationAccountId(),
                                existingTx.getCategoryId(),
                                notesPrefix + "Importado via " + fileType + (item.externalId() != null ? " [ID: " + item.externalId() + "]" : "") + " [Conciliado com fatura]"
                        );
                        transactionRepository.save(updated);
                        existingInstallmentMap.put(canonicalSig, updated);
                    }
                }
            } else {
                // Cria o lançamento atual no mês da fatura
                String notesPrefix = (recurringGroupId != null)
                        ? "RECURRING_EXPENSE:" + recurringGroupId + " (" + itemMatchOpt.get().current() + "/" + itemMatchOpt.get().total() + ") | "
                        : "";

                var transaction = Transaction.create(
                        userId,
                        type,
                        item.amount(),
                        item.date(),
                        item.date(),
                        item.description(),
                        targetAccountId,
                        null,
                        categoryId,
                        origin,
                        notesPrefix + "Importado via " + fileType + (item.externalId() != null ? " [ID: " + item.externalId() + "]" : "")
                );

                transactionRepository.save(transaction);
                existingSignatures.add(itemSig);
                if (canonicalSig != null) {
                    existingInstallmentMap.put(canonicalSig, transaction);
                }
                importedCount++;
            }

            // PROJEÇÃO DE PARCELAS FUTURAS:
            // Se for compra parcelada (ex: Havan 3/5 ou Parcela 5/6), já lança nos meses seguintes como recorrente
            // as parcelas que faltam para pagar por completo se elas ainda não existirem no banco de dados!
            if (itemMatchOpt.isPresent() && type == TransactionType.EXPENSE) {
                var m = itemMatchOpt.get();
                if (m.current() < m.total()) {
                    for (int p = m.current() + 1; p <= m.total(); p++) {
                        int monthsAhead = p - m.current();
                        java.time.LocalDate futureDate = item.date().plusMonths(monthsAhead);
                        String futureDesc = installmentDetector.generateNextInstallmentDescription(item.description(), m, p);
                        var futureYm = java.time.YearMonth.from(futureDate);
                        String futureCanonicalSig = futureYm + "|" + item.amount() + "|" + m.cleanMerchant() + "|" + p + "/" + m.total();
                        String futureExactSig = futureDate + "|" + item.amount() + "|" + futureDesc.toLowerCase().trim();

                        // Prevenção de duplicidade: só projeta se a parcela daquele mês futuro ainda NÃO existir!
                        if (!existingInstallmentMap.containsKey(futureCanonicalSig) && !existingSignatures.contains(futureExactSig)) {
                            String futureNotesPrefix = (recurringGroupId != null)
                                    ? "RECURRING_EXPENSE:" + recurringGroupId + " (" + p + "/" + m.total() + ") | "
                                    : "";

                            var futureTx = Transaction.create(
                                    userId,
                                    TransactionType.EXPENSE,
                                    item.amount(),
                                    futureDate,
                                    futureDate,
                                    futureDesc,
                                    targetAccountId,
                                    null,
                                    categoryId,
                                    origin,
                                    futureNotesPrefix + "Importado via " + fileType + " [Parcela futura " + p + "/" + m.total() + " projetada automaticamente]"
                            );

                            transactionRepository.save(futureTx);
                            existingSignatures.add(futureExactSig);
                            existingInstallmentMap.put(futureCanonicalSig, futureTx);
                            importedCount++;
                        }
                    }
                }
            }
        }

        // Registra o lote para auditoria
        var batch = new ImportBatch(
                batchId,
                userId,
                targetAccountId,
                cleanName,
                fileType,
                importedCount,
                skippedCount,
                "COMPLETED",
                java.time.Instant.now()
        );
        importBatchRepository.save(batch);

        // Calcula o mês de referência predominante nos registros do arquivo
        String referenceMonth = null;
        String referenceMonthDisplay = null;
        if (!parsedItems.isEmpty()) {
            var monthCounts = parsedItems.stream()
                    .filter(item -> item.date() != null)
                    .map(item -> java.time.YearMonth.from(item.date()))
                    .collect(java.util.stream.Collectors.groupingBy(ym -> ym, java.util.stream.Collectors.counting()));

            if (!monthCounts.isEmpty()) {
                java.time.YearMonth predominantMonth = monthCounts.entrySet().stream()
                        .max(java.util.Map.Entry.<java.time.YearMonth, Long>comparingByValue()
                                .thenComparing(java.util.Map.Entry.comparingByKey()))
                        .map(java.util.Map.Entry::getKey)
                        .orElse(java.time.YearMonth.now());

                referenceMonth = predominantMonth.toString();
                String monthName = switch (predominantMonth.getMonthValue()) {
                    case 1 -> "Janeiro";
                    case 2 -> "Fevereiro";
                    case 3 -> "Março";
                    case 4 -> "Abril";
                    case 5 -> "Maio";
                    case 6 -> "Junho";
                    case 7 -> "Julho";
                    case 8 -> "Agosto";
                    case 9 -> "Setembro";
                    case 10 -> "Outubro";
                    case 11 -> "Novembro";
                    case 12 -> "Dezembro";
                    default -> "";
                };
                referenceMonthDisplay = monthName + " de " + predominantMonth.getYear();
            }
        }

        String message = referenceMonthDisplay != null
                ? String.format("Importação concluída: %d novos lançamentos em %s, %d duplicados ignorados.",
                        importedCount, referenceMonthDisplay, skippedCount)
                : String.format("Importação concluída: %d novos lançamentos importados, %d duplicados ignorados.",
                        importedCount, skippedCount);

        return new ImportStatementResult(
                batchId,
                cleanName,
                fileType,
                importedCount,
                skippedCount,
                message,
                referenceMonth,
                referenceMonthDisplay
        );
    }

    private boolean isCardFileName(String name) {
        String lower = name.toLowerCase();
        return lower.contains("fatura")
                || lower.contains("cartao")
                || lower.contains("cartão")
                || lower.contains("card")
                || lower.contains("nubank")
                || lower.contains("credito")
                || lower.contains("crédito")
                || lower.contains("invoice");
    }

    private boolean isInvoicePaymentDescription(String desc) {
        if (desc == null) return false;
        String lower = desc.toLowerCase();
        return lower.contains("pagamento de fatura")
                || lower.contains("pagamento recebido")
                || lower.contains("pagamento efetuado")
                || lower.contains("pgto fatura")
                || lower.contains("fatura paga");
    }

    private UUID resolveRecurringGroupId(
            List<Transaction> existingTransactions,
            InstallmentDetector.InstallmentMatch match,
            BigDecimal amount,
            UUID fallbackId) {
        if (existingTransactions == null || existingTransactions.isEmpty()) {
            return fallbackId;
        }
        for (Transaction tx : existingTransactions) {
            if (tx.getNotes() != null && tx.getNotes().contains("RECURRING_EXPENSE:")) {
                var existingMatch = installmentDetector.detect(tx.getDescription());
                if (existingMatch.isPresent()) {
                    var em = existingMatch.get();
                    if (em.cleanMerchant().equalsIgnoreCase(match.cleanMerchant()) && em.total() == match.total()) {
                        String prefix = com.finance.ai.application.financial.UpdateTransactionUseCase.extractRecurringPrefix(tx.getNotes());
                        if (prefix != null && prefix.startsWith("RECURRING_EXPENSE:")) {
                            try {
                                String idStr = prefix.substring("RECURRING_EXPENSE:".length()).trim();
                                return UUID.fromString(idStr);
                            } catch (Exception ignored) {}
                        }
                    }
                }
            }
        }
        return fallbackId;
    }
}
