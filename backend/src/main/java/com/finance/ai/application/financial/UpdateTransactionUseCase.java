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

        // Se for uma entrada recorrente e o usuário optou por atualizar os meses futuros
        if (Boolean.TRUE.equals(updateFutureRecurring) && existingPrefix != null) {
            String prefix = existingPrefix;
            if (prefix != null) {
                var linked = transactionRepository.findAllByUserIdAndNotesStartingWith(userId, prefix);
                int newDay = accrualDate.getDayOfMonth();
                Integer newSettlementDay = settlementDate != null ? settlementDate.getDayOfMonth() : null;

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
                        String futureNotes = prefix + " - Entrada recorrente: " + description.trim();

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
