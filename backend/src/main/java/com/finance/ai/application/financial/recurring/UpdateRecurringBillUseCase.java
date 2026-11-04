package com.finance.ai.application.financial.recurring;

import com.finance.ai.application.financial.CreateTransactionUseCase;
import com.finance.ai.application.financial.card.CreateCreditCardPurchaseUseCase;
import com.finance.ai.application.financial.recurring.dto.RecurringBillResponse;
import com.finance.ai.application.financial.recurring.dto.UpdateRecurringBillCommand;
import com.finance.ai.domain.financial.AccountRepository;
import com.finance.ai.domain.financial.CategoryRepository;
import com.finance.ai.domain.financial.Transaction;
import com.finance.ai.domain.financial.TransactionRepository;
import com.finance.ai.domain.financial.TransactionType;
import com.finance.ai.domain.financial.card.CreditCardRepository;
import com.finance.ai.domain.financial.recurring.RecurringBillRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;

@Service
public class UpdateRecurringBillUseCase {

    private final RecurringBillRepository recurringBillRepository;
    private final CategoryRepository categoryRepository;
    private final AccountRepository accountRepository;
    private final CreditCardRepository creditCardRepository;
    private final TransactionRepository transactionRepository;
    private final CreateTransactionUseCase createTransactionUseCase;
    private final CreateCreditCardPurchaseUseCase createCreditCardPurchaseUseCase;

    @org.springframework.beans.factory.annotation.Autowired
    public UpdateRecurringBillUseCase(RecurringBillRepository recurringBillRepository,
                                      CategoryRepository categoryRepository,
                                      AccountRepository accountRepository,
                                      CreditCardRepository creditCardRepository,
                                      TransactionRepository transactionRepository,
                                      CreateTransactionUseCase createTransactionUseCase,
                                      CreateCreditCardPurchaseUseCase createCreditCardPurchaseUseCase) {
        this.recurringBillRepository = recurringBillRepository;
        this.categoryRepository = categoryRepository;
        this.accountRepository = accountRepository;
        this.creditCardRepository = creditCardRepository;
        this.transactionRepository = transactionRepository;
        this.createTransactionUseCase = createTransactionUseCase;
        this.createCreditCardPurchaseUseCase = createCreditCardPurchaseUseCase;
    }

    public UpdateRecurringBillUseCase(RecurringBillRepository recurringBillRepository,
                                      CategoryRepository categoryRepository,
                                      AccountRepository accountRepository,
                                      CreditCardRepository creditCardRepository,
                                      TransactionRepository transactionRepository) {
        this(recurringBillRepository, categoryRepository, accountRepository, creditCardRepository, transactionRepository, null, null);
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

        if (cmd.replicateMonths() != null && cmd.replicateMonths() > 0 && createTransactionUseCase != null) {
            LocalDate baseDate = cmd.startDate() != null ? cmd.startDate() : existing.calculateDueDate(LocalDate.now());
            int monthsToProject = Math.min(cmd.replicateMonths(), 60);

            Map<YearMonth, Transaction> existingByYearMonth = new HashMap<>();
            for (Transaction tx : linkedTransactions) {
                existingByYearMonth.put(YearMonth.from(tx.getAccrualDate()), tx);
            }

            Set<YearMonth> targetYearMonths = new HashSet<>();

            for (int i = 0; i < monthsToProject; i++) {
                LocalDate monthDate = baseDate.plusMonths(i);
                YearMonth ym = YearMonth.from(monthDate);
                targetYearMonths.add(ym);

                int maxDay = monthDate.lengthOfMonth();
                int targetDay = Math.min(cmd.dayOfMonth(), maxDay);
                LocalDate paymentDate = monthDate.withDayOfMonth(targetDay);
                String counter = monthsToProject > 1 ? " (" + (i + 1) + "/" + monthsToProject + ")" : "";
                String notes = "RECURRING_BILL:" + existing.getId() + counter + " | Lançamento do custo fixo: " + cmd.description().trim();

                Transaction existingTx = existingByYearMonth.get(ym);
                if (existingTx != null) {
                    LocalDate newSettlementDate = existingTx.getSettlementDate() != null ? paymentDate : null;
                    UUID targetAccountId = cmd.creditCardId() != null ? null : cmd.accountId();
                    Transaction updatedTx = existingTx.withUpdates(
                            existingTx.getType(),
                            cmd.amount(),
                            paymentDate,
                            newSettlementDate,
                            cmd.description().trim(),
                            targetAccountId,
                            existingTx.getDestinationAccountId(),
                            cmd.categoryId(),
                            notes
                    );
                    transactionRepository.save(updatedTx);
                } else {
                    if (cmd.creditCardId() != null && createCreditCardPurchaseUseCase != null) {
                        createCreditCardPurchaseUseCase.execute(
                                authenticatedUserId,
                                cmd.creditCardId(),
                                cmd.description().trim(),
                                cmd.amount(),
                                1,
                                paymentDate,
                                cmd.categoryId(),
                                notes
                        );
                    } else {
                        createTransactionUseCase.execute(
                                authenticatedUserId,
                                TransactionType.EXPENSE,
                                cmd.amount(),
                                paymentDate,
                                paymentDate,
                                cmd.description().trim(),
                                cmd.accountId(),
                                null,
                                cmd.categoryId(),
                                notes
                        );
                    }
                }
            }

            // Remove transações futuras vinculadas a esta despesa que ultrapassem o novo limite de meses projetados
            for (Transaction tx : linkedTransactions) {
                YearMonth ym = YearMonth.from(tx.getAccrualDate());
                if (!tx.getAccrualDate().isBefore(baseDate) && !targetYearMonths.contains(ym)) {
                    transactionRepository.deleteByIdAndUserId(tx.getId(), authenticatedUserId);
                }
            }
        } else {
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
                String newNotes = "RECURRING_BILL:" + existing.getId() + " | Lançamento do custo fixo: " + cmd.description().trim();

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
