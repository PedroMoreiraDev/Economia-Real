package com.finance.ai.infrastructure.persistence.financial.card;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

interface CreditCardSpringDataRepository extends JpaRepository<CreditCardJpaEntity, UUID> {
    List<CreditCardJpaEntity> findAllByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<CreditCardJpaEntity> findByIdAndUserId(UUID id, UUID userId);
}
