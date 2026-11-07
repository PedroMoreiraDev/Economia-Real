package com.finance.ai.application.financial.budget;

import com.finance.ai.domain.financial.budget.MonthlySpendingLimit;
import com.finance.ai.domain.financial.budget.MonthlySpendingLimitRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class GetSpendingLimitsTimelineUseCase {

    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");
    private final MonthlySpendingLimitRepository repository;

    public GetSpendingLimitsTimelineUseCase(MonthlySpendingLimitRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public Map<String, BigDecimal> execute(UUID userId) {
        List<MonthlySpendingLimit> limits = repository.findAllByUserId(userId);
        Map<String, BigDecimal> timeline = new HashMap<>();
        for (MonthlySpendingLimit limit : limits) {
            String monthKey = limit.getMonthReference().format(MONTH_FORMATTER);
            timeline.put(monthKey, limit.getAmount());
        }
        return timeline;
    }
}
