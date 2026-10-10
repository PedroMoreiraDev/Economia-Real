package com.finance.ai.application.financial.recurring;

import com.finance.ai.application.financial.recurring.dto.CreateRecurringBillCommand;
import com.finance.ai.application.financial.recurring.dto.RecurringBillResponse;
import com.finance.ai.domain.financial.AccountRepository;
import com.finance.ai.domain.financial.CategoryRepository;
import com.finance.ai.domain.financial.card.CreditCardRepository;
import com.finance.ai.domain.financial.recurring.RecurringBill;
import com.finance.ai.domain.financial.recurring.RecurringBillRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Service
public class CreateRecurringBillUseCase {

    private final RecurringBillRepository recurringBillRepository;
    private final CategoryRepository categoryRepository;
    private final AccountRepository accountRepository;
    private final CreditCardRepository creditCardRepository;

    public CreateRecurringBillUseCase(RecurringBillRepository recurringBillRepository,
                                      CategoryRepository categoryRepository,
                                      AccountRepository accountRepository,
                                      CreditCardRepository creditCardRepository) {
        this.recurringBillRepository = recurringBillRepository;
        this.categoryRepository = categoryRepository;
        this.accountRepository = accountRepository;
        this.creditCardRepository = creditCardRepository;
    }

    @Transactional
    public RecurringBillResponse execute(UUID authenticatedUserId, CreateRecurringBillCommand cmd) {
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

        var bill = RecurringBill.create(
                authenticatedUserId,
                cmd.categoryId(),
                cmd.accountId(),
                cmd.creditCardId(),
                cmd.description(),
                cmd.amount(),
                cmd.frequency(),
                cmd.dayOfMonth()
        );

        var saved = recurringBillRepository.save(bill);

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
