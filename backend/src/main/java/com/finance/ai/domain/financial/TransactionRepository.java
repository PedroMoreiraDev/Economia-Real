package com.finance.ai.domain.financial;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TransactionRepository {
    List<Transaction> findAllByUserId(UUID userId);
    List<Transaction> findAllByUserIdAndPeriod(UUID userId, LocalDate startDate, LocalDate endDate);
    List<Transaction> findAllByUserIdAndNotesStartingWith(UUID userId, String notesPrefix);
    Optional<Transaction> findByIdAndUserId(UUID id, UUID userId);
    Transaction save(Transaction transaction);
    void deleteByIdAndUserId(UUID id, UUID userId);
    void deleteAllByUserIdAndNotesStartingWith(UUID userId, String notesPrefix);
}
