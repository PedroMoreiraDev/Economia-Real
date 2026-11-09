package com.finance.ai.application.user;

import com.finance.ai.domain.user.UserPreference;
import com.finance.ai.domain.user.UserPreferenceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class UpdateUserPreferenceUseCase {

    private final UserPreferenceRepository repository;

    public UpdateUserPreferenceUseCase(UserPreferenceRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public UserPreference execute(UUID userId, Boolean onboardingCompleted) {
        var preference = repository.findByUserId(userId)
                .orElseGet(() -> UserPreference.createDefault(userId));

        if (onboardingCompleted != null) {
            preference = preference.withOnboardingCompleted(onboardingCompleted);
        }

        return repository.save(preference);
    }
}

