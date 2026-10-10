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

    public UpdateTransactionUseCase(TransactionRepository transactionRepository,
                                  AccountRepository accountRepository) {
        this.transactionRepository = transactionRepository;
        this.accountRepository = accountRepository;
    }

    @Transactional
    public Transaction execute(UUID userId, UUID transactionId, TransactionType type, BigDecimal amount,
                               LocalDate accrualDate, LocalDate settlementDate,
                               String description, UUID accountId, UUID destinationAccountId,
                               UUID categoryId, String notes) {

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

        var updated = existing.withUpdates(
                type,
                amount,
                accrualDate,
                settlementDate,
                description,
                accountId,
                destinationAccountId,
                categoryId,
                notes
        );

        return transactionRepository.save(updated);
    }
}
