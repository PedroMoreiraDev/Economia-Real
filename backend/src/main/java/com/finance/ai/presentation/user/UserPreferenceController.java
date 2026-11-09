package com.finance.ai.presentation.user;

import com.finance.ai.application.user.GetUserPreferenceUseCase;
import com.finance.ai.application.user.UpdateUserPreferenceUseCase;
import com.finance.ai.infrastructure.security.AuthenticatedUser;
import com.finance.ai.presentation.user.dto.UpdateUserPreferenceRequest;
import com.finance.ai.presentation.user.dto.UserPreferenceResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users/preferences")
@Tag(name = "Preferências do Usuário", description = "Preferências personalizadas de experiência e onboarding sincronizadas entre dispositivos")
@SecurityRequirement(name = "bearerAuth")
public class UserPreferenceController {

    private final GetUserPreferenceUseCase getUserPreferenceUseCase;
    private final UpdateUserPreferenceUseCase updateUserPreferenceUseCase;

    public UserPreferenceController(GetUserPreferenceUseCase getUserPreferenceUseCase,
                                    UpdateUserPreferenceUseCase updateUserPreferenceUseCase) {
        this.getUserPreferenceUseCase = getUserPreferenceUseCase;
        this.updateUserPreferenceUseCase = updateUserPreferenceUseCase;
    }

    @GetMapping
    @Operation(summary = "Obtém as preferências do usuário autenticado")
    public ResponseEntity<UserPreferenceResponse> getPreferences(
            @AuthenticationPrincipal AuthenticatedUser user) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        var pref = getUserPreferenceUseCase.execute(user.userId());
        return ResponseEntity.ok(new UserPreferenceResponse(pref.isOnboardingCompleted()));
    }

    @PatchMapping
    @Operation(summary = "Atualiza preferências específicas do usuário (ex: conclusão de tutorial)")
    public ResponseEntity<UserPreferenceResponse> updatePreferences(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestBody UpdateUserPreferenceRequest request) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        var pref = updateUserPreferenceUseCase.execute(user.userId(), request.onboardingCompleted());
        return ResponseEntity.ok(new UserPreferenceResponse(pref.isOnboardingCompleted()));
    }
}

