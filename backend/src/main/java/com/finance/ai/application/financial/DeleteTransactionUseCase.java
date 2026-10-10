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
        transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Transação não encontrada ou não pertence ao usuário."));

        transactionRepository.deleteByIdAndUserId(transactionId, userId);
    }

    @Transactional
    public void executeBatch(UUID userId, java.util.List<UUID> transactionIds) {
        if (transactionIds == null || transactionIds.isEmpty()) return;
        for (UUID id : transactionIds) {
            transactionRepository.deleteByIdAndUserId(id, userId);
        }
    }
}
