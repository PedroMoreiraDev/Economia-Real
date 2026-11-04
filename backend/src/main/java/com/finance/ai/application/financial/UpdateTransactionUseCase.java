package com.finance.ai.application.financial;

import com.finance.ai.domain.financial.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Caso de uso para edição de uma transação existente do usuário.
 * Garante estritamente o isolamento de dados do usuário (anti-IDOR) e a integridade de contas.
 */
@Service
public class UpdateTransactionUseCase {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;

    public UpdateTransactionUseCase(TransactionRepository transactionRepository,
                                  AccountRepository accountRepository) {
        this(transactionRepository, accountRepository, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public UpdateTransactionUseCase(TransactionRepository transactionRepository,
                                  AccountRepository accountRepository,
                                  @org.springframework.beans.factory.annotation.Autowired(required = false) CategoryRepository categoryRepository) {
        this.transactionRepository = transactionRepository;
        this.accountRepository = accountRepository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional
    public Transaction execute(UUID userId, UUID transactionId, TransactionType type, BigDecimal amount,
                               LocalDate accrualDate, LocalDate settlementDate,
                               String description, UUID accountId, UUID destinationAccountId,
                               UUID categoryId, String notes) {
        return execute(userId, transactionId, type, amount, accrualDate, settlementDate,
                description, accountId, destinationAccountId, categoryId, notes, true);
    }

    @Transactional
    public Transaction execute(UUID userId, UUID transactionId, TransactionType type, BigDecimal amount,
                               LocalDate accrualDate, LocalDate settlementDate,
                               String description, UUID accountId, UUID destinationAccountId,
                               UUID categoryId, String notes, Boolean updateFutureRecurring) {
        return execute(userId, transactionId, type, amount, accrualDate, settlementDate,
                description, accountId, destinationAccountId, categoryId, notes, updateFutureRecurring, null);
    }

    @Transactional
    public Transaction execute(UUID userId, UUID transactionId, TransactionType type, BigDecimal amount,
                               LocalDate accrualDate, LocalDate settlementDate,
                               String description, UUID accountId, UUID destinationAccountId,
                               UUID categoryId, String notes, Boolean updateFutureRecurring,
                               Integer replicateMonths) {

        var existing = transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Transação não encontrada ou não pertence ao usuário."));

        if (accountId != null) {
            accountRepository.findByIdAndUserId(accountId, userId)
                    .orElseThrow(() -> new IllegalArgumentException("Conta de origem não encontrada ou não pertence ao usuário."));
        }

        if (type == TransactionType.TRANSFER && destinationAccountId != null) {
            accountRepository.findByIdAndUserId(destinationAccountId, userId)
                    .orElseThrow(() -> new IllegalArgumentException("Conta de destino não encontrada ou não pertence ao usuário."));
        }

        // Prevenção contra IDOR: validação de pertencimento da categoria ao usuário
        if (categoryId != null && categoryRepository != null) {
            categoryRepository.findByIdAndUserId(categoryId, userId)
                    .orElseThrow(() -> new IllegalArgumentException("Categoria informada não existe ou não pertence ao usuário."));
        }

        String existingPrefix = extractRecurringPrefix(existing.getNotes());
        String finalNotes = notes;
        if (existingPrefix != null && (type == TransactionType.INCOME || existing.getType() == TransactionType.INCOME)) {
            if (notes == null || notes.isBlank() || !notes.contains(existingPrefix)) {
                String userPart = (notes != null && !notes.isBlank()) ? " | " + notes.trim() : "";
                finalNotes = existingPrefix + " - Entrada recorrente: " + description.trim() + userPart;
            }
        }

        var updated = existing.withUpdates(
                type,
                amount,
                accrualDate,
                settlementDate,
                description,
                accountId,
                destinationAccountId,
                categoryId,
                finalNotes
        );

        var saved = transactionRepository.save(updated);

        // Se for uma movimentação recorrente e o usuário optou por atualizar os meses futuros
        if (Boolean.TRUE.equals(updateFutureRecurring) && existingPrefix != null) {
            String prefix = existingPrefix;
            var linked = transactionRepository.findAllByUserIdAndNotesStartingWith(userId, prefix);
            int newDay = accrualDate.getDayOfMonth();
            Integer newSettlementDay = settlementDate != null ? settlementDate.getDayOfMonth() : null;

            if (replicateMonths != null && replicateMonths > 0) {
                int monthsToProject = Math.min(replicateMonths, 60);
                java.util.Map<java.time.YearMonth, Transaction> existingByYearMonth = new java.util.HashMap<>();
                for (Transaction linkedTx : linked) {
                    existingByYearMonth.put(java.time.YearMonth.from(linkedTx.getAccrualDate()), linkedTx);
                }

                java.util.Set<java.time.YearMonth> targetYearMonths = new java.util.HashSet<>();

                for (int i = 0; i < monthsToProject; i++) {
                    LocalDate monthDate = accrualDate.plusMonths(i);
                    java.time.YearMonth ym = java.time.YearMonth.from(monthDate);
                    targetYearMonths.add(ym);

                    int maxDays = monthDate.lengthOfMonth();
                    int targetDay = Math.min(newDay, maxDays);
                    LocalDate futureAccrual = monthDate.withDayOfMonth(targetDay);

                    LocalDate futureSettlement = null;
                    if (settlementDate != null) {
                        int maxSettlementDays = monthDate.lengthOfMonth();
                        int sDay = newSettlementDay != null ? newSettlementDay : targetDay;
                        futureSettlement = monthDate.withDayOfMonth(Math.min(sDay, maxSettlementDays));
                    }

                    String counter = monthsToProject > 1 ? " (" + (i + 1) + "/" + monthsToProject + ")" : "";
                    String typeLabel = prefix.startsWith("RECURRING_EXPENSE:") ? "Despesa recorrente: " : (prefix.startsWith("RECURRING_BILL:") ? "Lançamento do custo fixo: " : "Entrada recorrente: ");
                    String futureNotes = prefix + counter + " | " + typeLabel + description.trim();

                    Transaction linkedTx = existingByYearMonth.get(ym);
                    if (linkedTx != null) {
                        var updatedFuture = linkedTx.withUpdates(
                                type,
                                amount,
                                futureAccrual,
                                futureSettlement,
                                description.trim(),
                                accountId,
                                destinationAccountId,
                                categoryId,
                                futureNotes
                        );
                        transactionRepository.save(updatedFuture);
                    } else {
                        var newTx = Transaction.create(
                                userId,
                                type,
                                amount,
                                futureAccrual,
                                futureSettlement,
                                description.trim(),
                                accountId,
                                destinationAccountId,
                                categoryId,
                                futureNotes
                        );
                        transactionRepository.save(newTx);
                    }
                }

                // Remove transações futuras vinculadas que ultrapassem o novo limite projetado
                for (Transaction linkedTx : linked) {
                    java.time.YearMonth ym = java.time.YearMonth.from(linkedTx.getAccrualDate());
                    if (linkedTx.getAccrualDate().isAfter(accrualDate) && !targetYearMonths.contains(ym)) {
                        transactionRepository.deleteByIdAndUserId(linkedTx.getId(), userId);
                    }
                }
            } else {
                for (Transaction linkedTx : linked) {
                    // Sincroniza apenas as transações futuras (ou da mesma data se outro id)
                    if (!linkedTx.getId().equals(existing.getId()) && (linkedTx.getAccrualDate().isAfter(existing.getAccrualDate()) || linkedTx.getAccrualDate().isEqual(existing.getAccrualDate()))) {
                        LocalDate currentAccrual = linkedTx.getAccrualDate();
                        int maxDays = currentAccrual.lengthOfMonth();
                        LocalDate futureAccrual = currentAccrual.withDayOfMonth(Math.min(newDay, maxDays));

                        LocalDate futureSettlement = null;
                        if (linkedTx.getSettlementDate() != null) {
                            int maxSettlementDays = linkedTx.getSettlementDate().lengthOfMonth();
                            int sDay = newSettlementDay != null ? newSettlementDay : newDay;
                            futureSettlement = linkedTx.getSettlementDate().withDayOfMonth(Math.min(sDay, maxSettlementDays));
                        }

                        // Preserva a chave da recorrência nas notas
                        String typeLabel = prefix.startsWith("RECURRING_EXPENSE:") ? "Despesa recorrente: " : "Entrada recorrente: ";
                        String futureNotes = prefix + " - " + typeLabel + description.trim();

                        var updatedFuture = linkedTx.withUpdates(
                                type,
                                amount,
                                futureAccrual,
                                futureSettlement,
                                description.trim(),
                                accountId,
                                destinationAccountId,
                                categoryId,
                                futureNotes
                        );
                        transactionRepository.save(updatedFuture);
                    }
                }
            }
        }

        return saved;
    }

    public static String extractRecurringPrefix(String notes) {
        if (notes == null) {
            return null;
        }
        int idx = notes.indexOf("RECURRING_INCOME:");
        if (idx < 0) {
            idx = notes.indexOf("RECURRING_EXPENSE:");
        }
        if (idx < 0) {
            idx = notes.indexOf("RECURRING_BILL:");
        }
        if (idx < 0) {
            return null;
        }
        String sub = notes.substring(idx);
        int spaceIdx = sub.indexOf(' ');
        int pipeIdx = sub.indexOf('|');
        int endIdx = sub.length();
        if (spaceIdx > 0 && spaceIdx < endIdx) endIdx = spaceIdx;
        if (pipeIdx > 0 && pipeIdx < endIdx) endIdx = pipeIdx;
        return sub.substring(0, endIdx).trim();
    }
}
