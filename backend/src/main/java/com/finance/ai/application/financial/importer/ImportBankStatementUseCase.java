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
        String fileType = cleanName.endsWith(".ofx") ? "OFX" : "CSV";

        boolean detectedCard = Boolean.TRUE.equals(isCreditCard) || (isCreditCard == null && isCardFileName(cleanName));

        List<ParsedTransactionItem> parsedItems;
        try (InputStream is = new ByteArrayInputStream(fileBytes)) {
            parsedItems = fileType.equals("OFX") ? ofxParser.parse(is, detectedCard) : csvParser.parse(is, detectedCard);
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

        // Carrega transações existentes do usuário para deduplicação
        var existingTransactions = transactionRepository.findAllByUserId(userId);
        Set<String> existingSignatures = new HashSet<>();
        for (var tx : existingTransactions) {
            if (targetAccountId.equals(tx.getAccountId()) || tx.getAccountId() == null) {
                // Assinatura: data|valor|descrição simplificada
                String sig = tx.getAccrualDate() + "|" + tx.getAmount() + "|" + tx.getDescription().toLowerCase().trim();
                existingSignatures.add(sig);
            }
        }

        int importedCount = 0;
        int skippedCount = 0;
        var batchId = UUID.randomUUID();

        for (var item : parsedItems) {
            String itemSig = item.date() + "|" + item.amount() + "|" + item.description().toLowerCase().trim();

            // Deduplicação inteligente
            if (existingSignatures.contains(itemSig)) {
                skippedCount++;
                continue;
            }

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

            var origin = fileType.equals("OFX") ? TransactionOrigin.OFX_IMPORT : TransactionOrigin.CSV_IMPORT;
            UUID categoryId = null;
            if (type == TransactionType.EXPENSE || type == TransactionType.INCOME) {
                categoryId = merchantCategoryClassifier.resolveCategoryId(userId, item.description());
            }

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
                    "Importado via " + fileType + (item.externalId() != null ? " [ID: " + item.externalId() + "]" : "")
            );

            transactionRepository.save(transaction);
            existingSignatures.add(itemSig);
            importedCount++;
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

        String message = String.format("Importação concluída: %d novos lançamentos importados, %d duplicados ignorados.",
                importedCount, skippedCount);

        return new ImportStatementResult(
                batchId,
                cleanName,
                fileType,
                importedCount,
                skippedCount,
                message
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
}
