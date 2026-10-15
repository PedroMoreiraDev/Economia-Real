package com.finance.ai.application.financial;

import com.finance.ai.domain.financial.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Caso de uso para exclusão segura de uma transação financeira do usuário.
 */
@Service
public class DeleteTransactionUseCase {

    private final TransactionRepository transactionRepository;

    public DeleteTransactionUseCase(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    @Transactional
    public void execute(UUID userId, UUID transactionId) {
        execute(userId, transactionId, false);
    }

    @Transactional
    public void execute(UUID userId, UUID transactionId, boolean deleteFutureRecurring) {
        com.finance.ai.domain.financial.Transaction current = transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Transação não encontrada ou não pertence ao usuário."));

        if (deleteFutureRecurring && current.getNotes() != null && current.getNotes().contains("RECURRING_INCOME:")) {
            String recurringPrefix = UpdateTransactionUseCase.extractRecurringPrefix(current.getNotes());
            if (recurringPrefix != null) {
                java.util.List<com.finance.ai.domain.financial.Transaction> all = transactionRepository.findAllByUserIdAndNotesStartingWith(userId, recurringPrefix);
                java.util.List<UUID> toDelete = all.stream()
                        .filter(t -> !t.getAccrualDate().isBefore(current.getAccrualDate()))
                        .map(com.finance.ai.domain.financial.Transaction::getId)
                        .toList();
                executeBatch(userId, toDelete);
                return;
            }
        }

        transactionRepository.deleteByIdAndUserId(transactionId, userId);
    }

    @Transactional
    public void executeBatch(UUID userId, java.util.List<UUID> transactionIds) {
        if (transactionIds == null || transactionIds.isEmpty()) return;
        if (transactionIds.size() > 200) {
            throw new IllegalArgumentException("O lote de exclusão não pode exceder 200 movimentações por operação.");
        }
        for (UUID id : transactionIds) {
            transactionRepository.deleteByIdAndUserId(id, userId);
        }
    }
}
