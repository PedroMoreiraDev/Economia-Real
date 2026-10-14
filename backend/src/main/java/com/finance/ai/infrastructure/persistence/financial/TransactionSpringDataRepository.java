package com.finance.ai.infrastructure.persistence.financial;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

interface TransactionSpringDataRepository extends JpaRepository<TransactionJpaEntity, UUID> {

    List<TransactionJpaEntity> findAllByUserIdOrderByAccrualDateDescCreatedAtDesc(UUID userId);

    @Query("SELECT t FROM TransactionJpaEntity t WHERE t.userId = :userId AND t.accrualDate >= :startDate AND t.accrualDate <= :endDate ORDER BY t.accrualDate DESC, t.createdAt DESC")
    List<TransactionJpaEntity> findAllByUserIdAndPeriod(@Param("userId") UUID userId,
                                                        @Param("startDate") LocalDate startDate,
                                                        @Param("endDate") LocalDate endDate);

    @Query("SELECT t FROM TransactionJpaEntity t WHERE t.userId = :userId AND t.notes LIKE CONCAT(:prefix, '%')")
    List<TransactionJpaEntity> findAllByUserIdAndNotesStartingWith(@Param("userId") UUID userId, @Param("prefix") String prefix);

    Optional<TransactionJpaEntity> findByIdAndUserId(UUID id, UUID userId);

    void deleteByIdAndUserId(UUID id, UUID userId);

    @Modifying
    @Query("DELETE FROM TransactionJpaEntity t WHERE t.userId = :userId AND t.notes LIKE CONCAT(:prefix, '%')")
    void deleteAllByUserIdAndNotesStartingWith(@Param("userId") UUID userId, @Param("prefix") String prefix);
}
