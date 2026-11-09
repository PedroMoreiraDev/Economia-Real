package com.finance.ai.application.financial.budget;

import com.finance.ai.domain.financial.budget.BudgetCategoryLock;
import com.finance.ai.domain.financial.budget.BudgetCategoryLockRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class SaveBudgetCategoryLocksUseCase {

    private final BudgetCategoryLockRepository repository;
    private final GetBudgetCategoryLocksUseCase getLocksUseCase;

    public SaveBudgetCategoryLocksUseCase(BudgetCategoryLockRepository repository,
                                          GetBudgetCategoryLocksUseCase getLocksUseCase) {
        this.repository = repository;
        this.getLocksUseCase = getLocksUseCase;
    }

    @Transactional
    public Map<UUID, BigDecimal> execute(UUID userId, String monthStr, Map<UUID, BigDecimal> locksMap) {
        LocalDate monthRef = parseMonth(monthStr);

        List<BudgetCategoryLock> locks = new ArrayList<>();
        if (locksMap != null) {
            for (Map.Entry<UUID, BigDecimal> entry : locksMap.entrySet()) {
                if (entry.getKey() != null && entry.getValue() != null) {
                    locks.add(BudgetCategoryLock.create(userId, entry.getKey(), monthRef, entry.getValue()));
                }
            }
        }

        repository.replaceLocks(userId, monthRef, locks);
        return getLocksUseCase.execute(userId, monthStr);
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

