package com.finance.ai.application.financial;

import com.finance.ai.domain.financial.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Service
public class CreateTransactionUseCase {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;

    public CreateTransactionUseCase(TransactionRepository transactionRepository,
                                    AccountRepository accountRepository) {
        this.transactionRepository = transactionRepository;
        this.accountRepository = accountRepository;
    }

    @Transactional
    public Transaction execute(UUID userId, TransactionType type, BigDecimal amount,
                               LocalDate accrualDate, LocalDate settlementDate,
                               String description, UUID accountId, UUID destinationAccountId,
                               UUID categoryId, String notes) {

        if (accountId != null) {
            accountRepository.findByIdAndUserId(accountId, userId)
                    .orElseThrow(() -> new IllegalArgumentException("Conta de origem não encontrada ou não pertence ao usuário."));
        }

        if (type == TransactionType.TRANSFER && destinationAccountId != null) {
            accountRepository.findByIdAndUserId(destinationAccountId, userId)
                    .orElseThrow(() -> new IllegalArgumentException("Conta de destino não encontrada ou não pertence ao usuário."));
        }

        var transaction = Transaction.create(
                userId,
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

        return transactionRepository.save(transaction);
    }
}
