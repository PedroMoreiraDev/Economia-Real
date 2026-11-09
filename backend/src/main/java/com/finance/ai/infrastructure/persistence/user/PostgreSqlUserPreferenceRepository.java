package com.finance.ai.infrastructure.persistence.user;

import com.finance.ai.domain.user.UserPreference;
import com.finance.ai.domain.user.UserPreferenceRepository;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
public class PostgreSqlUserPreferenceRepository implements UserPreferenceRepository {

    private final SpringDataUserPreferenceRepository repository;

    public PostgreSqlUserPreferenceRepository(SpringDataUserPreferenceRepository repository) {
        this.repository = repository;
    }

    @Override
    public Optional<UserPreference> findByUserId(UUID userId) {
        return repository.findById(userId).map(UserPreferenceJpaEntity::toDomain);
    }

    @Override
    public UserPreference save(UserPreference preference) {
        var entity = UserPreferenceJpaEntity.fromDomain(preference);
        return repository.save(entity).toDomain();
    }
}

