package com.finance.ai.application.financial.recurring;

import com.finance.ai.application.financial.recurring.dto.RecurringBillResponse;
import com.finance.ai.domain.financial.Account;
import com.finance.ai.domain.financial.AccountRepository;
import com.finance.ai.domain.financial.Category;
import com.finance.ai.domain.financial.CategoryRepository;
import com.finance.ai.domain.financial.Transaction;
import com.finance.ai.domain.financial.TransactionRepository;
import com.finance.ai.domain.financial.card.CreditCard;
import com.finance.ai.domain.financial.card.CreditCardRepository;
import com.finance.ai.domain.financial.recurring.RecurringBill;
import com.finance.ai.domain.financial.recurring.RecurringBillRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ListRecurringBillsUseCase {

    private final RecurringBillRepository recurringBillRepository;
    private final CategoryRepository categoryRepository;
    private final AccountRepository accountRepository;
    private final CreditCardRepository creditCardRepository;
    private final TransactionRepository transactionRepository;

    public ListRecurringBillsUseCase(RecurringBillRepository recurringBillRepository,
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

    @Transactional(readOnly = true)
    public List<RecurringBillResponse> execute(UUID authenticatedUserId, LocalDate referenceMonth) {
        LocalDate ref = referenceMonth != null ? referenceMonth : LocalDate.now();
        LocalDate startOfMonth = ref.withDayOfMonth(1);
        LocalDate endOfMonth = ref.withDayOfMonth(ref.lengthOfMonth());
        LocalDate today = LocalDate.now();

        List<RecurringBill> bills = recurringBillRepository.findByUserId(authenticatedUserId);
        if (bills.isEmpty()) {
            return List.of();
        }

        // Pré-carrega mapas auxiliares para performance O(1)
        Map<UUID, String> categories = categoryRepository.findAllByUserIdOrSystemDefault(authenticatedUserId).stream()
                .collect(Collectors.toMap(Category::getId, Category::getName, (a, b) -> a));

        Map<UUID, String> accounts = accountRepository.findAllByUserId(authenticatedUserId).stream()
                .collect(Collectors.toMap(Account::getId, Account::getName, (a, b) -> a));

        Map<UUID, String> cards = creditCardRepository.findAllByUserId(authenticatedUserId).stream()
                .collect(Collectors.toMap(CreditCard::getId, CreditCard::getName, (a, b) -> a));

        // Transações do usuário no mês
        List<Transaction> monthTransactions = transactionRepository.findAllByUserIdAndPeriod(
                authenticatedUserId, startOfMonth, endOfMonth);

        Set<String> paidBillMarkers = monthTransactions.stream()
                .filter(t -> t.getNotes() != null && t.getNotes().contains("RECURRING_BILL:"))
                .map(Transaction::getNotes)
                .collect(Collectors.toSet());

        return bills.stream().map(bill -> {
            LocalDate dueDate = bill.calculateDueDate(ref);
            boolean isDueSoon = bill.isDueWithinDays(today, 7);
            String marker = "RECURRING_BILL:" + bill.getId();
            boolean isPaidThisMonth = paidBillMarkers.stream().anyMatch(m -> m.contains(marker));

            return new RecurringBillResponse(
                    bill.getId(),
                    bill.getUserId(),
                    bill.getDescription(),
                    bill.getAmount(),
                    bill.getFrequency(),
                    bill.getDayOfMonth(),
                    bill.getCategoryId(),
                    bill.getCategoryId() != null ? categories.get(bill.getCategoryId()) : null,
                    bill.getAccountId(),
                    bill.getAccountId() != null ? accounts.get(bill.getAccountId()) : null,
                    bill.getCreditCardId(),
                    bill.getCreditCardId() != null ? cards.get(bill.getCreditCardId()) : null,
                    bill.isActive(),
                    dueDate,
                    isDueSoon,
                    isPaidThisMonth,
                    bill.getCreatedAt(),
                    bill.getUpdatedAt()
            );
        }).toList();
    }
}
