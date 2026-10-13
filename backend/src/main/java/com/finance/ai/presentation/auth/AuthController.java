package com.finance.ai.presentation.auth;

import com.finance.ai.application.auth.*;
import com.finance.ai.domain.user.UserRepository;
import com.finance.ai.infrastructure.security.AuthenticatedUser;
import com.finance.ai.infrastructure.security.CaptchaService;
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

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Autenticação", description = "Registro, login, verificação de e-mail e CAPTCHA")
public class AuthController {

    private final RegisterUserUseCase registerUseCase;
    private final LoginUserUseCase loginUseCase;
    private final DeleteAccountUseCase deleteAccountUseCase;
    private final VerifyEmailUseCase verifyEmailUseCase;
    private final ResendVerificationCodeUseCase resendVerificationCodeUseCase;
    private final ForgotPasswordUseCase forgotPasswordUseCase;
    private final ResetPasswordUseCase resetPasswordUseCase;
    private final CaptchaService captchaService;
    private final UserRepository userRepository;

    public AuthController(
            RegisterUserUseCase registerUseCase,
            LoginUserUseCase loginUseCase,
            DeleteAccountUseCase deleteAccountUseCase,
            VerifyEmailUseCase verifyEmailUseCase,
            ResendVerificationCodeUseCase resendVerificationCodeUseCase,
            ForgotPasswordUseCase forgotPasswordUseCase,
            ResetPasswordUseCase resetPasswordUseCase,
            CaptchaService captchaService,
            UserRepository userRepository) {
        this.registerUseCase = registerUseCase;
        this.loginUseCase = loginUseCase;
        this.deleteAccountUseCase = deleteAccountUseCase;
        this.verifyEmailUseCase = verifyEmailUseCase;
        this.resendVerificationCodeUseCase = resendVerificationCodeUseCase;
        this.forgotPasswordUseCase = forgotPasswordUseCase;
        this.resetPasswordUseCase = resetPasswordUseCase;
        this.captchaService = captchaService;
        this.userRepository = userRepository;
    }

    @GetMapping("/captcha")
    @Operation(summary = "Obtém novo desafio CAPTCHA para prevenção de bots")
    public ResponseEntity<CaptchaService.CaptchaChallenge> getCaptcha() {
        return ResponseEntity.ok(captchaService.generateChallenge());
    }

    @PostMapping("/register")
    @Operation(summary = "Cadastra um novo usuário com validação DNS de e-mail e envia código de 6 dígitos")
    public ResponseEntity<RegistrationResponse> register(@Valid @RequestBody RegisterRequest request) {
        var result = registerUseCase.executeWithVerification(
                request.email(),
                request.fullName(),
                request.password(),
                request.captchaToken(),
                request.captchaAnswer()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(new RegistrationResponse(
                result.userId(),
                result.email(),
                result.fullName(),
                result.requiresVerification(),
                result.message()
        ));
    }

    @PostMapping("/verify-email")
    @Operation(summary = "Valida o código de 6 dígitos enviado por e-mail e ativa a conta retornando token JWT")
    public ResponseEntity<AuthResponse> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        var result = verifyEmailUseCase.execute(request.email(), request.code());
        return ResponseEntity.ok(toResponse(result));
    }

    @PostMapping("/resend-code")
    @Operation(summary = "Reenvia um novo código de 6 dígitos para o e-mail informado")
    public ResponseEntity<Map<String, String>> resendCode(@Valid @RequestBody ResendCodeRequest request) {
        resendVerificationCodeUseCase.execute(request.email());
        return ResponseEntity.ok(Map.of("message", "Novo código de verificação enviado com sucesso para seu e-mail."));
    }

    @PostMapping("/login")
    @Operation(summary = "Autentica o usuário com proteção CAPTCHA e validação de conta ativada")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        var result = loginUseCase.execute(
                request.email(),
                request.password(),
                request.captchaToken(),
                request.captchaAnswer()
        );
        return ResponseEntity.ok(toResponse(result));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Solicita envio de código de 6 dígitos para recuperação de senha")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        forgotPasswordUseCase.execute(request.email(), request.captchaToken(), request.captchaAnswer());
        return ResponseEntity.ok(Map.of("message", "Se o e-mail informado estiver cadastrado, enviamos o código de recuperação para sua caixa de entrada."));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Redefine a senha utilizando o código de 6 dígitos")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        resetPasswordUseCase.execute(request.email(), request.code(), request.newPassword());
        return ResponseEntity.ok(Map.of("message", "Senha redefinida com sucesso! Você já pode entrar com sua nova senha."));
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
            @NotBlank @Size(min = 8, max = 100, message = "A senha deve ter entre 8 e 100 caracteres.") String password,
            String captchaToken,
            String captchaAnswer
    ) {
        public RegisterRequest(String email, String fullName, String password) {
            this(email, fullName, password, null, null);
        }
    }

    public record LoginRequest(
            @Email(message = "E-mail inválido.") @NotBlank String email,
            @NotBlank String password,
            String captchaToken,
            String captchaAnswer
    ) {
        public LoginRequest(String email, String password) {
            this(email, password, null, null);
        }
    }

    public record VerifyEmailRequest(
            @Email(message = "E-mail inválido.") @NotBlank String email,
            @NotBlank @Size(min = 6, max = 6, message = "O código deve ter 6 dígitos.") String code
    ) {}

    public record ResendCodeRequest(
            @Email(message = "E-mail inválido.") @NotBlank String email
    ) {}

    public record RegistrationResponse(
            String userId, String email, String fullName, boolean requiresVerification, String message
    ) {}

    public record AuthResponse(
            String userId, String email, String fullName, String accessToken, String tokenType
    ) {}

    public record UserProfileResponse(
            String id, String email, String fullName, String createdAt
    ) {}

    public record ForgotPasswordRequest(
            @Email(message = "E-mail inválido.") @NotBlank String email,
            String captchaToken,
            String captchaAnswer
    ) {}

    public record ResetPasswordRequest(
            @Email(message = "E-mail inválido.") @NotBlank String email,
            @NotBlank @Size(min = 6, max = 6, message = "O código deve ter 6 dígitos.") String code,
            @NotBlank @Size(min = 8, max = 100, message = "A nova senha deve ter entre 8 e 100 caracteres.") String newPassword
    ) {}
}
