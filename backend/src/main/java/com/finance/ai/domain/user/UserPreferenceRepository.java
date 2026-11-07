package com.finance.ai.domain.user;

import java.util.Optional;
import java.util.UUID;

public interface UserPreferenceRepository {
    Optional<UserPreference> findByUserId(UUID userId);
    UserPreference save(UserPreference preference);
}
