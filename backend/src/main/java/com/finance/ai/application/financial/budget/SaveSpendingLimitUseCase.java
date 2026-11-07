package com.finance.ai.application.financial.budget;

import com.finance.ai.domain.financial.budget.MonthlySpendingLimit;
import com.finance.ai.domain.financial.budget.MonthlySpendingLimitRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Map;
import java.util.UUID;

@Service
public class SaveSpendingLimitUseCase {

    private final MonthlySpendingLimitRepository repository;
    private final GetSpendingLimitsTimelineUseCase getTimelineUseCase;

    public SaveSpendingLimitUseCase(MonthlySpendingLimitRepository repository,
                                    GetSpendingLimitsTimelineUseCase getTimelineUseCase) {
        this.repository = repository;
        this.getTimelineUseCase = getTimelineUseCase;
    }

    @Transactional
    public Map<String, BigDecimal> execute(UUID userId, String monthStr, BigDecimal amount) {
        LocalDate monthRef = parseMonth(monthStr);
        var existing = repository.findByUserIdAndMonthReference(userId, monthRef);

        if (existing.isPresent()) {
            var updated = existing.get().updateAmount(amount);
            repository.save(updated);
        } else {
            var created = MonthlySpendingLimit.create(userId, monthRef, amount);
            repository.save(created);
        }

        return getTimelineUseCase.execute(userId);
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

