package com.finance.ai.infrastructure.persistence.financial.budget;

import com.finance.ai.domain.financial.budget.Budget;
import com.finance.ai.domain.financial.budget.BudgetRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class PostgreSqlBudgetRepository implements BudgetRepository {

    private final SpringDataBudgetRepository springDataRepo;

    public PostgreSqlBudgetRepository(SpringDataBudgetRepository springDataRepo) {
        this.springDataRepo = springDataRepo;
    }

    @Override
    public Optional<Budget> findByIdAndUserId(UUID id, UUID userId) {
        return springDataRepo.findByIdAndUserId(id, userId).map(BudgetJpaEntity::toDomain);
    }

    @Override
    public Optional<Budget> findByUserIdAndCategoryIdAndMonthReference(UUID userId, UUID categoryId, LocalDate monthReference) {
        return springDataRepo.findByUserIdAndCategoryIdAndMonthReference(userId, categoryId, monthReference)
                .map(BudgetJpaEntity::toDomain);
    }

    @Override
    public List<Budget> findAllByUserIdAndMonthReference(UUID userId, LocalDate monthReference) {
        return springDataRepo.findAllByUserIdAndMonthReference(userId, monthReference).stream()
                .map(BudgetJpaEntity::toDomain)
                .toList();
    }

    @Override
    public List<Budget> findAllByUserId(UUID userId) {
        return springDataRepo.findAllByUserId(userId).stream()
                .map(BudgetJpaEntity::toDomain)
                .toList();
    }

    @Override
    public Budget save(Budget budget) {
        var entity = BudgetJpaEntity.fromDomain(budget);
        return springDataRepo.save(entity).toDomain();
    }

    @Override
    public void deleteByIdAndUserId(UUID id, UUID userId) {
        springDataRepo.deleteByIdAndUserId(id, userId);
    }
}
