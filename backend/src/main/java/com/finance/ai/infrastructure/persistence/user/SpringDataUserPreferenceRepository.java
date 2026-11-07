package com.finance.ai.infrastructure.persistence.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface SpringDataUserPreferenceRepository extends JpaRepository<UserPreferenceJpaEntity, UUID> {
}
