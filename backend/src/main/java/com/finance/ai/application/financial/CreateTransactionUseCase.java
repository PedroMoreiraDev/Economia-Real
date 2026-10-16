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
            throw new IllegalArgumentException("O período máximo de replicação de movimentações é de 60 meses.");
        }

        boolean canReplicate = (type == TransactionType.INCOME || type == TransactionType.EXPENSE);
        int months = (replicateMonths != null && replicateMonths > 1 && canReplicate) ? replicateMonths : 1;
        UUID recurringGroupId = months > 1 ? UUID.randomUUID() : null;

        String firstNotes = notes;
        if (recurringGroupId != null) {
            String prefixTag = type == TransactionType.INCOME ? "RECURRING_INCOME:" : "RECURRING_EXPENSE:";
            String typeLabel = type == TransactionType.INCOME ? "Entrada recorrente: " : "Despesa recorrente: ";
            String userNotes = (notes != null && !notes.isBlank()) ? " | " + notes.trim() : "";
            String counter = " (1/" + months + ")";
            firstNotes = prefixTag + recurringGroupId + " - " + typeLabel + description.trim() + counter + userNotes;
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
                firstNotes
        );

        var savedFirst = transactionRepository.save(firstTransaction);

        // Se for receita ou despesa recorrente para múltiplos meses, projeta os meses subsequentes
        if (months > 1) {
            int originalDay = accrualDate.getDayOfMonth();
            Integer originalSettlementDay = settlementDate != null ? settlementDate.getDayOfMonth() : null;

            String prefixTag = type == TransactionType.INCOME ? "RECURRING_INCOME:" : "RECURRING_EXPENSE:";
            String typeLabel = type == TransactionType.INCOME ? "Entrada recorrente: " : "Despesa recorrente: ";
            String userNotes = (notes != null && !notes.isBlank()) ? " | " + notes.trim() : "";

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

                String futureNotes = prefixTag + recurringGroupId + " - " + typeLabel + description.trim() + " (" + (i + 1) + "/" + months + ")" + userNotes;

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
                        futureNotes
                );
                transactionRepository.save(futureTx);
            }
        }

        return savedFirst;
    }
}
