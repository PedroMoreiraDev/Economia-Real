package com.finance.ai.application.user;

import com.finance.ai.domain.user.UserPreference;
import com.finance.ai.domain.user.UserPreferenceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class GetUserPreferenceUseCase {

    private final UserPreferenceRepository repository;

    public GetUserPreferenceUseCase(UserPreferenceRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public UserPreference execute(UUID userId) {
        return repository.findByUserId(userId)
                .orElseGet(() -> UserPreference.createDefault(userId));
    }
}

