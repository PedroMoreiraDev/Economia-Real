package com.finance.ai.infrastructure.persistence.financial;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

interface AccountSpringDataRepository extends JpaRepository<AccountJpaEntity, UUID> {
    List<AccountJpaEntity> findAllByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<AccountJpaEntity> findByIdAndUserId(UUID id, UUID userId);
}
