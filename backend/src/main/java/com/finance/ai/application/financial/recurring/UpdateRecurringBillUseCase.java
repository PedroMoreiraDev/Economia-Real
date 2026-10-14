package com.finance.ai.application.financial.recurring;

import com.finance.ai.application.financial.recurring.dto.RecurringBillResponse;
import com.finance.ai.application.financial.recurring.dto.UpdateRecurringBillCommand;
import com.finance.ai.domain.financial.AccountRepository;
import com.finance.ai.domain.financial.CategoryRepository;
import com.finance.ai.domain.financial.Transaction;
import com.finance.ai.domain.financial.TransactionRepository;
import com.finance.ai.domain.financial.card.CreditCardRepository;
import com.finance.ai.domain.financial.recurring.RecurringBillRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class UpdateRecurringBillUseCase {

    private final RecurringBillRepository recurringBillRepository;
    private final CategoryRepository categoryRepository;
    private final AccountRepository accountRepository;
    private final CreditCardRepository creditCardRepository;
    private final TransactionRepository transactionRepository;

    public UpdateRecurringBillUseCase(RecurringBillRepository recurringBillRepository,
                                      CategoryRepository categoryRepository,
                                      AccountRepository accountRepository,
                                      CreditCardRepository creditCardRepository,
                                      TransactionRepository transactionRepository) {
        this.recurringBillRepository = recurringBillRepository;
        this.categoryRepository = categoryRepository;
        this.accountRepository = accountRepository;
        this.creditCardRepository = creditCardRepository;
        this.transactionRepository = transactionRepository;
    }

    @Transactional
    public RecurringBillResponse execute(UUID authenticatedUserId, UUID billId, UpdateRecurringBillCommand cmd) {
        var existing = recurringBillRepository.findByIdAndUserId(billId, authenticatedUserId)
                .orElseThrow(() -> new IllegalArgumentException("Despesa recorrente não encontrada ou não pertence ao usuário."));

        if (cmd.categoryId() != null) {
            categoryRepository.findByIdAndUserId(cmd.categoryId(), authenticatedUserId)
                    .orElseThrow(() -> new IllegalArgumentException("Categoria não encontrada ou não pertence ao usuário."));
        }
        if (cmd.accountId() != null) {
            accountRepository.findByIdAndUserId(cmd.accountId(), authenticatedUserId)
                    .orElseThrow(() -> new IllegalArgumentException("Conta não encontrada ou não pertence ao usuário."));
        }
        if (cmd.creditCardId() != null) {
            creditCardRepository.findByIdAndUserId(cmd.creditCardId(), authenticatedUserId)
                    .orElseThrow(() -> new IllegalArgumentException("Cartão de crédito não encontrado ou não pertence ao usuário."));
        }

        var updated = existing.update(
                cmd.categoryId(),
                cmd.accountId(),
                cmd.creditCardId(),
                cmd.description(),
                cmd.amount(),
                cmd.frequency(),
                cmd.dayOfMonth(),
                cmd.active()
        );

        var saved = recurringBillRepository.save(updated);

        // Sincroniza todas as movimentações existentes no extrato (mês atual e meses futuros) geradas por esta despesa fixa
        String prefix = "RECURRING_BILL:" + existing.getId();
        List<Transaction> linkedTransactions = transactionRepository.findAllByUserIdAndNotesStartingWith(authenticatedUserId, prefix);

        for (Transaction tx : linkedTransactions) {
            LocalDate currentAccrual = tx.getAccrualDate();
            LocalDate newAccrualDate = currentAccrual;

            if (cmd.dayOfMonth() > 0) {
                int maxDaysInMonth = currentAccrual.lengthOfMonth();
                int targetDay = Math.min(cmd.dayOfMonth(), maxDaysInMonth);
                newAccrualDate = currentAccrual.withDayOfMonth(targetDay);
            }

            LocalDate newSettlementDate = tx.getSettlementDate() != null ? newAccrualDate : null;
            UUID targetAccountId = cmd.creditCardId() != null ? null : cmd.accountId();
            String newNotes = "RECURRING_BILL:" + existing.getId() + " - Lançamento da despesa fixa: " + cmd.description().trim();

            Transaction updatedTx = tx.withUpdates(
                    tx.getType(),
                    cmd.amount(),
                    newAccrualDate,
                    newSettlementDate,
                    cmd.description().trim(),
                    targetAccountId,
                    tx.getDestinationAccountId(),
                    cmd.categoryId(),
                    newNotes
            );

            transactionRepository.save(updatedTx);
        }

        LocalDate today = LocalDate.now();
        LocalDate dueDate = saved.calculateDueDate(today);
        boolean isDueSoon = saved.isDueWithinDays(today, 7);

        return new RecurringBillResponse(
                saved.getId(),
                saved.getUserId(),
                saved.getDescription(),
                saved.getAmount(),
                saved.getFrequency(),
                saved.getDayOfMonth(),
                saved.getCategoryId(),
                null,
                saved.getAccountId(),
                null,
                saved.getCreditCardId(),
                null,
                saved.isActive(),
                dueDate,
                isDueSoon,
                false,
                saved.getCreatedAt(),
                saved.getUpdatedAt()
        );
    }
}
