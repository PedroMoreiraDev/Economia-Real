package com.finance.ai.application.financial.budget;

import com.finance.ai.domain.financial.budget.BudgetCategoryLock;
import com.finance.ai.domain.financial.budget.BudgetCategoryLockRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class GetBudgetCategoryLocksUseCase {

    private final BudgetCategoryLockRepository repository;

    public GetBudgetCategoryLocksUseCase(BudgetCategoryLockRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public Map<UUID, BigDecimal> execute(UUID userId, String monthStr) {
        LocalDate monthRef = parseMonth(monthStr);
        List<BudgetCategoryLock> locks = repository.findAllByUserIdAndMonthReference(userId, monthRef);
        Map<UUID, BigDecimal> result = new HashMap<>();
        for (BudgetCategoryLock lock : locks) {
            result.put(lock.getCategoryId(), lock.getLockedAmount());
        }
        return result;
    }

    private LocalDate parseMonth(String monthStr) {
        if (monthStr == null || monthStr.isBlank()) {
            return LocalDate.now().withDayOfMonth(1);
        }
        if (monthStr.length() == 7) {
            return YearMonth.parse(monthStr).atDay(1);
        }
        return LocalDate.parse(monthStr).withDayOfMonth(1);
    }
}

