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
public class RemoveSpendingLimitUseCase {

    private final MonthlySpendingLimitRepository repository;
    private final GetSpendingLimitsTimelineUseCase getTimelineUseCase;

    public RemoveSpendingLimitUseCase(MonthlySpendingLimitRepository repository,
                                      GetSpendingLimitsTimelineUseCase getTimelineUseCase) {
        this.repository = repository;
        this.getTimelineUseCase = getTimelineUseCase;
    }

    @Transactional
    public Map<String, BigDecimal> execute(UUID userId, String monthStr) {
        LocalDate monthRef = parseMonth(monthStr);
        var existing = repository.findByUserIdAndMonthReference(userId, monthRef);
        if (existing.isPresent()) {
            repository.save(existing.get().updateAmount(BigDecimal.ZERO));
        } else {
            repository.save(MonthlySpendingLimit.create(userId, monthRef, BigDecimal.ZERO));
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
