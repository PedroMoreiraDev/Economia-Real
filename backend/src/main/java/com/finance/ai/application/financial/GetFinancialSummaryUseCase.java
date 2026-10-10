package com.finance.ai.application.financial;

import com.finance.ai.domain.financial.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Caso de uso determinístico para sumarização financeira de um usuário.
 * NUNCA utiliza float/double e NUNCA delega contas para inteligência artificial.
 */
@Service
public class GetFinancialSummaryUseCase {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;

    public GetFinancialSummaryUseCase(TransactionRepository transactionRepository,
                                     AccountRepository accountRepository) {
        this.transactionRepository = transactionRepository;
        this.accountRepository = accountRepository;
    }

    @Transactional(readOnly = true)
    public FinancialSummaryResult execute(UUID userId, LocalDate startDate, LocalDate endDate) {
        var transactions = (startDate != null && endDate != null)
                ? transactionRepository.findAllByUserIdAndPeriod(userId, startDate, endDate)
                : transactionRepository.findAllByUserId(userId);

        var totalIncome = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_EVEN);
        var totalExpense = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_EVEN);

        for (var t : transactions) {
            if (t.getStatus() == TransactionStatus.COMPLETED) {
                if (t.getType() == TransactionType.INCOME) {
                    totalIncome = totalIncome.add(t.getAmount());
                } else if (t.getType() == TransactionType.EXPENSE) {
                    totalExpense = totalExpense.add(t.getAmount());
                }
                // Prevenção de dupla contagem: TRANSFER e INVOICE_PAYMENT não distorcem o total de consumo.
            }
        }

        var netSavings = totalIncome.subtract(totalExpense).setScale(2, RoundingMode.HALF_EVEN);

        // Saldo consolidado das contas
        var accounts = accountRepository.findAllByUserId(userId);
        var totalAccounts = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_EVEN);
        for (var a : accounts) {
            if (a.isActive()) {
                totalAccounts = totalAccounts.add(a.getInitialBalance());
            }
        }

        return new FinancialSummaryResult(
                totalIncome,
                totalExpense,
                netSavings,
                totalAccounts,
                transactions.size()
        );
    }
}
