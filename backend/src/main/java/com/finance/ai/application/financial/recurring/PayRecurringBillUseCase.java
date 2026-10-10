package com.finance.ai.application.financial.recurring;

import com.finance.ai.application.financial.CreateTransactionUseCase;
import com.finance.ai.application.financial.card.CreateCreditCardPurchaseUseCase;
import com.finance.ai.application.financial.recurring.dto.PayRecurringBillCommand;
import com.finance.ai.domain.financial.TransactionType;
import com.finance.ai.domain.financial.recurring.RecurringBillRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Service
public class PayRecurringBillUseCase {

    private final RecurringBillRepository recurringBillRepository;
    private final CreateTransactionUseCase createTransactionUseCase;
    private final CreateCreditCardPurchaseUseCase createCreditCardPurchaseUseCase;

    public PayRecurringBillUseCase(RecurringBillRepository recurringBillRepository,
                                  CreateTransactionUseCase createTransactionUseCase,
                                  CreateCreditCardPurchaseUseCase createCreditCardPurchaseUseCase) {
        this.recurringBillRepository = recurringBillRepository;
        this.createTransactionUseCase = createTransactionUseCase;
        this.createCreditCardPurchaseUseCase = createCreditCardPurchaseUseCase;
    }

    @Transactional
    public void execute(UUID authenticatedUserId, UUID billId, PayRecurringBillCommand cmd) {
        var bill = recurringBillRepository.findByIdAndUserId(billId, authenticatedUserId)
                .orElseThrow(() -> new IllegalArgumentException("Despesa recorrente não encontrada ou não pertence ao usuário."));

        LocalDate basePaymentDate = (cmd != null && cmd.paymentDate() != null)
                ? cmd.paymentDate()
                : bill.calculateDueDate(LocalDate.now());

        UUID targetCardId = (cmd != null && cmd.creditCardId() != null)
                ? cmd.creditCardId()
                : bill.getCreditCardId();

        UUID targetAccountId = (cmd != null && cmd.accountId() != null)
                ? cmd.accountId()
                : bill.getAccountId();

        int monthsToLaunch = (cmd != null && cmd.replicateMonths() != null && cmd.replicateMonths() > 0)
                ? cmd.replicateMonths()
                : 1;

        String notes = "RECURRING_BILL:" + bill.getId() + " - Lançamento da despesa fixa: " + bill.getDescription();

        for (int i = 0; i < monthsToLaunch; i++) {
            LocalDate targetMonthDate = basePaymentDate.plusMonths(i);
            int maxDay = targetMonthDate.lengthOfMonth();
            int targetDay = Math.min(bill.getDayOfMonth(), maxDay);
            LocalDate paymentDate = targetMonthDate.withDayOfMonth(targetDay);

            if (targetCardId != null) {
                createCreditCardPurchaseUseCase.execute(
                        authenticatedUserId,
                        targetCardId,
                        bill.getDescription(),
                        bill.getAmount(),
                        1,
                        paymentDate,
                        bill.getCategoryId(),
                        notes
                );
            } else {
                createTransactionUseCase.execute(
                        authenticatedUserId,
                        TransactionType.EXPENSE,
                        bill.getAmount(),
                        paymentDate,
                        paymentDate,
                        bill.getDescription(),
                        targetAccountId,
                        null,
                        bill.getCategoryId(),
                        notes
                );
            }
        }
    }
}
