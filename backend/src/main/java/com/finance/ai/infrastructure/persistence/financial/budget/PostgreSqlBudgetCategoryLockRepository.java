package com.finance.ai.infrastructure.persistence.financial.budget;

import com.finance.ai.domain.financial.budget.BudgetCategoryLock;
import com.finance.ai.domain.financial.budget.BudgetCategoryLockRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Component
public class PostgreSqlBudgetCategoryLockRepository implements BudgetCategoryLockRepository {

    private final SpringDataBudgetCategoryLockRepository repository;

    public PostgreSqlBudgetCategoryLockRepository(SpringDataBudgetCategoryLockRepository repository) {
        this.repository = repository;
    }

    @Override
    public List<BudgetCategoryLock> findAllByUserIdAndMonthReference(UUID userId, LocalDate monthReference) {
        return repository.findAllByUserIdAndMonthReference(userId, monthReference).stream()
                .map(BudgetCategoryLockJpaEntity::toDomain)
                .toList();
    }

    @Override
    @Transactional
    public void replaceLocks(UUID userId, LocalDate monthReference, List<BudgetCategoryLock> locks) {
        repository.deleteAllByUserIdAndMonthReference(userId, monthReference);
        if (locks != null && !locks.isEmpty()) {
            var entities = locks.stream()
                    .map(BudgetCategoryLockJpaEntity::fromDomain)
                    .toList();
            repository.saveAll(entities);
        }
    }
}
