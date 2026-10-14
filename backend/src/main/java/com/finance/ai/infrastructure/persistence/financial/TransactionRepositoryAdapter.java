package com.finance.ai.infrastructure.persistence.financial;

import com.finance.ai.domain.financial.Transaction;
import com.finance.ai.domain.financial.TransactionRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
class TransactionRepositoryAdapter implements TransactionRepository {

    private final TransactionSpringDataRepository jpa;

    TransactionRepositoryAdapter(TransactionSpringDataRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public List<Transaction> findAllByUserId(UUID userId) {
        return jpa.findAllByUserIdOrderByAccrualDateDescCreatedAtDesc(userId)
                .stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public List<Transaction> findAllByUserIdAndPeriod(UUID userId, LocalDate startDate, LocalDate endDate) {
        return jpa.findAllByUserIdAndPeriod(userId, startDate, endDate)
                .stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public Optional<Transaction> findByIdAndUserId(UUID id, UUID userId) {
        return jpa.findByIdAndUserId(id, userId).map(this::toDomain);
    }

    @Override
    public List<Transaction> findAllByUserIdAndNotesStartingWith(UUID userId, String notesPrefix) {
        return jpa.findAllByUserIdAndNotesStartingWith(userId, notesPrefix)
                .stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public Transaction save(Transaction transaction) {
        var entity = toJpaEntity(transaction);
        var saved = jpa.save(entity);
        return toDomain(saved);
    }

    @Override
    public void deleteByIdAndUserId(UUID id, UUID userId) {
        jpa.deleteByIdAndUserId(id, userId);
    }

    @Override
    public void deleteAllByUserIdAndNotesStartingWith(UUID userId, String notesPrefix) {
        jpa.deleteAllByUserIdAndNotesStartingWith(userId, notesPrefix);
    }

    private Transaction toDomain(TransactionJpaEntity e) {
        return new Transaction(
                e.getId(),
                e.getUserId(),
                e.getType(),
                e.getAmount(),
                e.getAccrualDate(),
                e.getSettlementDate(),
                e.getDescription(),
                e.getAccountId(),
                e.getDestinationAccountId(),
                e.getCategoryId(),
                e.getStatus(),
                e.getOrigin(),
                e.getNotes(),
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }

    private TransactionJpaEntity toJpaEntity(Transaction t) {
        return new TransactionJpaEntity(
                t.getId(),
                t.getUserId(),
                t.getType(),
                t.getAmount(),
                t.getAccrualDate(),
                t.getSettlementDate(),
                t.getDescription(),
                t.getAccountId(),
                t.getDestinationAccountId(),
                t.getCategoryId(),
                t.getStatus(),
                t.getOrigin(),
                t.getNotes(),
                t.getCreatedAt(),
                t.getUpdatedAt()
        );
    }
}
