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
public class SyncSpendingLimitsTimelineUseCase {

    private final MonthlySpendingLimitRepository repository;
    private final GetSpendingLimitsTimelineUseCase getTimelineUseCase;

    public SyncSpendingLimitsTimelineUseCase(MonthlySpendingLimitRepository repository,
                                             GetSpendingLimitsTimelineUseCase getTimelineUseCase) {
        this.repository = repository;
        this.getTimelineUseCase = getTimelineUseCase;
    }

    @Transactional
    public Map<String, BigDecimal> execute(UUID userId, Map<String, BigDecimal> localTimeline) {
        if (localTimeline != null && !localTimeline.isEmpty()) {
            for (Map.Entry<String, BigDecimal> entry : localTimeline.entrySet()) {
                if (entry.getKey() == null || entry.getValue() == null) continue;
                try {
                    LocalDate monthRef = entry.getKey().length() == 7
                            ? YearMonth.parse(entry.getKey()).atDay(1)
                            : LocalDate.parse(entry.getKey()).withDayOfMonth(1);

                    var existing = repository.findByUserIdAndMonthReference(userId, monthRef);
                    if (existing.isEmpty()) {
                        repository.save(MonthlySpendingLimit.create(userId, monthRef, entry.getValue()));
                    }
                } catch (Exception ignored) {
                    // Ignora formatos de data inválidos
                }
            }
        }
        return getTimelineUseCase.execute(userId);
    }
}

