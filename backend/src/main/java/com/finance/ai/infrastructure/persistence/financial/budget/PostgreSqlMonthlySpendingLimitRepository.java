package com.finance.ai.infrastructure.persistence.financial.budget;

import com.finance.ai.domain.financial.budget.MonthlySpendingLimit;
import com.finance.ai.domain.financial.budget.MonthlySpendingLimitRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class PostgreSqlMonthlySpendingLimitRepository implements MonthlySpendingLimitRepository {

    private final SpringDataMonthlySpendingLimitRepository repository;

    public PostgreSqlMonthlySpendingLimitRepository(SpringDataMonthlySpendingLimitRepository repository) {
        this.repository = repository;
    }

    @Override
    public Optional<MonthlySpendingLimit> findByUserIdAndMonthReference(UUID userId, LocalDate monthReference) {
        return repository.findByUserIdAndMonthReference(userId, monthReference)
                .map(MonthlySpendingLimitJpaEntity::toDomain);
    }

    @Override
    public List<MonthlySpendingLimit> findAllByUserId(UUID userId) {
        return repository.findAllByUserId(userId).stream()
                .map(MonthlySpendingLimitJpaEntity::toDomain)
                .toList();
    }

    @Override
    public MonthlySpendingLimit save(MonthlySpendingLimit limit) {
        var entity = MonthlySpendingLimitJpaEntity.fromDomain(limit);
        return repository.save(entity).toDomain();
    }

    @Override
    public void deleteByUserIdAndMonthReference(UUID userId, LocalDate monthReference) {
        repository.deleteByUserIdAndMonthReference(userId, monthReference);
    }
}

