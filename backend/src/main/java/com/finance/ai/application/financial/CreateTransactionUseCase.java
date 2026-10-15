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
    private final CategoryRepository categoryRepository;

    public CreateTransactionUseCase(TransactionRepository transactionRepository,
                                    AccountRepository accountRepository) {
        this(transactionRepository, accountRepository, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public CreateTransactionUseCase(TransactionRepository transactionRepository,
                                    AccountRepository accountRepository,
                                    @org.springframework.beans.factory.annotation.Autowired(required = false) CategoryRepository categoryRepository) {
        this.transactionRepository = transactionRepository;
        this.accountRepository = accountRepository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional
    public Transaction execute(UUID userId, TransactionType type, BigDecimal amount,
                               LocalDate accrualDate, LocalDate settlementDate,
                               String description, UUID accountId, UUID destinationAccountId,
                               UUID categoryId, String notes) {
        return execute(userId, type, amount, accrualDate, settlementDate, description,
                accountId, destinationAccountId, categoryId, notes, 1);
    }

    @Transactional
    public Transaction execute(UUID userId, TransactionType type, BigDecimal amount,
                               LocalDate accrualDate, LocalDate settlementDate,
                               String description, UUID accountId, UUID destinationAccountId,
                               UUID categoryId, String notes, Integer replicateMonths) {

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

        // Prevenção contra DoS / Exaustão de Recursos
        if (replicateMonths != null && replicateMonths > 60) {
            throw new IllegalArgumentException("O período máximo de replicação de entradas é de 60 meses.");
        }

        int months = (replicateMonths != null && replicateMonths > 1) ? replicateMonths : 1;
        UUID recurringGroupId = months > 1 ? UUID.randomUUID() : null;

        String finalNotes = notes;
        if (recurringGroupId != null && type == TransactionType.INCOME) {
            String userNotes = (notes != null && !notes.isBlank()) ? " | " + notes.trim() : "";
            finalNotes = "RECURRING_INCOME:" + recurringGroupId + " - Entrada recorrente: " + description.trim() + userNotes;
        }

        var firstTransaction = Transaction.create(
                userId,
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

        var savedFirst = transactionRepository.save(firstTransaction);

        // Se for receita recorrente para múltiplos meses, projeta os meses subsequentes
        if (months > 1 && type == TransactionType.INCOME) {
            int originalDay = accrualDate.getDayOfMonth();
            Integer originalSettlementDay = settlementDate != null ? settlementDate.getDayOfMonth() : null;

            for (int i = 1; i < months; i++) {
                LocalDate targetAccrualMonth = accrualDate.plusMonths(i);
                int maxAccrualDay = targetAccrualMonth.lengthOfMonth();
                LocalDate futureAccrualDate = targetAccrualMonth.withDayOfMonth(Math.min(originalDay, maxAccrualDay));

                LocalDate futureSettlementDate = null;
                if (settlementDate != null) {
                    LocalDate targetSettlementMonth = settlementDate.plusMonths(i);
                    int maxSettlementDay = targetSettlementMonth.lengthOfMonth();
                    futureSettlementDate = targetSettlementMonth.withDayOfMonth(Math.min(originalSettlementDay, maxSettlementDay));
                }

                var futureTx = Transaction.create(
                        userId,
                        type,
                        amount,
                        futureAccrualDate,
                        futureSettlementDate,
                        description,
                        accountId,
                        destinationAccountId,
                        categoryId,
                        finalNotes
                );
                transactionRepository.save(futureTx);
            }
        }

        return savedFirst;
    }
}
