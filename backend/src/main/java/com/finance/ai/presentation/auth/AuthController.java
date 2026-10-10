package com.finance.ai.presentation.auth;

import com.finance.ai.application.auth.AuthResult;
import com.finance.ai.application.auth.DeleteAccountUseCase;
import com.finance.ai.application.auth.LoginUserUseCase;
import com.finance.ai.application.auth.RegisterUserUseCase;
import com.finance.ai.domain.user.UserRepository;
import com.finance.ai.infrastructure.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Autenticação", description = "Registro, login e perfil de usuários")
public class AuthController {

    private final RegisterUserUseCase registerUseCase;
    private final LoginUserUseCase loginUseCase;
    private final DeleteAccountUseCase deleteAccountUseCase;
    private final UserRepository userRepository;

    public AuthController(RegisterUserUseCase registerUseCase,
                          LoginUserUseCase loginUseCase,
                          DeleteAccountUseCase deleteAccountUseCase,
                          UserRepository userRepository) {
        this.registerUseCase = registerUseCase;
        this.loginUseCase = loginUseCase;
        this.deleteAccountUseCase = deleteAccountUseCase;
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    @Operation(summary = "Cadastra um novo usuário e retorna token de acesso JWT")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        var result = registerUseCase.execute(request.email(), request.fullName(), request.password());
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(result));
    }

    @PostMapping("/login")
    @Operation(summary = "Autentica o usuário e retorna token de acesso JWT")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        var result = loginUseCase.execute(request.email(), request.password());
        return ResponseEntity.ok(toResponse(result));
    }

    @GetMapping("/me")
    @Operation(summary = "Obtém dados do usuário autenticado no token JWT", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<UserProfileResponse> me(@AuthenticationPrincipal AuthenticatedUser authenticatedUser) {
        if (authenticatedUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return userRepository.findById(authenticatedUser.userId())
                .map(u -> ResponseEntity.ok(new UserProfileResponse(
                        u.getId().toString(),
                        u.getEmail(),
                        u.getFullName(),
                        u.getCreatedAt().toString()
                )))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @DeleteMapping("/me")
    @Operation(summary = "Exclui a conta do usuário e todos os dados associados (LGPD - Direito ao Esquecimento)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Void> deleteMe(@AuthenticationPrincipal AuthenticatedUser authenticatedUser) {
        if (authenticatedUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        deleteAccountUseCase.execute(authenticatedUser.userId());
        return ResponseEntity.noContent().build();
    }

    private AuthResponse toResponse(AuthResult r) {
        return new AuthResponse(r.userId(), r.email(), r.fullName(), r.accessToken(), "Bearer");
    }

    // DTOs de entrada e saída (Records Java 21)

    public record RegisterRequest(
            @Email(message = "E-mail inválido.") @NotBlank String email,
            @NotBlank @Size(min = 2, max = 150) String fullName,
            @NotBlank @Size(min = 8, max = 100, message = "A senha deve ter entre 8 e 100 caracteres.") String password
    ) {}

    public record LoginRequest(
            @Email(message = "E-mail inválido.") @NotBlank String email,
            @NotBlank String password
    ) {}

    public record AuthResponse(
            String userId, String email, String fullName, String accessToken, String tokenType
    ) {}

    public record UserProfileResponse(
            String id, String email, String fullName, String createdAt
    ) {}
}
