package com.finance.ai.infrastructure.persistence.financial.goal;

import com.finance.ai.domain.financial.goal.SavingsGoal;
import com.finance.ai.domain.financial.goal.SavingsGoalRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class SavingsGoalRepositoryAdapter implements SavingsGoalRepository {

    private final SpringDataSavingsGoalRepository repository;

    public SavingsGoalRepositoryAdapter(SpringDataSavingsGoalRepository repository) {
        this.repository = repository;
    }

    @Override
    public SavingsGoal save(SavingsGoal goal) {
        var entity = SavingsGoalJpaEntity.fromDomain(goal);
        var saved = repository.save(entity);
        return saved.toDomain();
    }

    @Override
    public Optional<SavingsGoal> findByIdAndUserId(UUID id, UUID userId) {
        return repository.findByIdAndUserId(id, userId)
                .map(SavingsGoalJpaEntity::toDomain);
    }

    @Override
    public List<SavingsGoal> findByUserId(UUID userId) {
        return repository.findByUserIdOrderByCreatedAtAsc(userId).stream()
                .map(SavingsGoalJpaEntity::toDomain)
                .toList();
    }

    @Override
    public void deleteByIdAndUserId(UUID id, UUID userId) {
        repository.deleteByIdAndUserId(id, userId);
    }
}
