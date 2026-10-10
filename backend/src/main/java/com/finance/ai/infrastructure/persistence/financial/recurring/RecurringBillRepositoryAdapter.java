package com.finance.ai.infrastructure.persistence.financial.recurring;

import com.finance.ai.domain.financial.recurring.RecurringBill;
import com.finance.ai.domain.financial.recurring.RecurringBillRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class RecurringBillRepositoryAdapter implements RecurringBillRepository {

    private final SpringDataRecurringBillRepository repository;

    public RecurringBillRepositoryAdapter(SpringDataRecurringBillRepository repository) {
        this.repository = repository;
    }

    @Override
    public RecurringBill save(RecurringBill recurringBill) {
        var entity = RecurringBillJpaEntity.fromDomain(recurringBill);
        var saved = repository.save(entity);
        return saved.toDomain();
    }

    @Override
    public Optional<RecurringBill> findByIdAndUserId(UUID id, UUID userId) {
        return repository.findByIdAndUserId(id, userId)
                .map(RecurringBillJpaEntity::toDomain);
    }

    @Override
    public List<RecurringBill> findByUserId(UUID userId) {
        return repository.findByUserIdOrderByDayOfMonthAsc(userId).stream()
                .map(RecurringBillJpaEntity::toDomain)
                .toList();
    }

    @Override
    public List<RecurringBill> findByUserIdAndActive(UUID userId, boolean active) {
        return repository.findByUserIdAndActiveOrderByDayOfMonthAsc(userId, active).stream()
                .map(RecurringBillJpaEntity::toDomain)
                .toList();
    }

    @Override
    public void deleteByIdAndUserId(UUID id, UUID userId) {
        repository.deleteByIdAndUserId(id, userId);
    }
}
