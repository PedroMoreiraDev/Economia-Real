package com.finance.ai.infrastructure.persistence.financial;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

interface CategorySpringDataRepository extends JpaRepository<CategoryJpaEntity, UUID> {

    @Query("SELECT c FROM CategoryJpaEntity c WHERE c.userId = :userId ORDER BY c.name ASC")
    List<CategoryJpaEntity> findAllByUserIdOrSystemDefault(@Param("userId") UUID userId);

    Optional<CategoryJpaEntity> findByIdAndUserId(UUID id, UUID userId);
}
