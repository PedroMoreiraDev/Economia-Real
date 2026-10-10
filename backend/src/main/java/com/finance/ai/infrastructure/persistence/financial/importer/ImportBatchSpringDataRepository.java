package com.finance.ai.infrastructure.persistence.financial.importer;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

interface ImportBatchSpringDataRepository extends JpaRepository<ImportBatchJpaEntity, UUID> {
    List<ImportBatchJpaEntity> findAllByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<ImportBatchJpaEntity> findByIdAndUserId(UUID id, UUID userId);
}
