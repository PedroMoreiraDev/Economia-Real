package com.finance.ai.application.auth;

import com.finance.ai.domain.user.User;
import com.finance.ai.domain.user.UserRepository;
import com.finance.ai.infrastructure.security.TokenProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes Unitários: RegisterUserUseCase")
class RegisterUserUseCaseTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private TokenProvider tokenProvider;

    @Mock
    private com.finance.ai.application.financial.DefaultCategorySeeder defaultCategorySeeder;

    @InjectMocks
    private RegisterUserUseCase registerUserUseCase;

    @Test
    @DisplayName("Deve registrar novo usuário com sucesso e retornar token")
    void shouldRegisterUserSuccessfully() {
        String email = "novo@finance.com";
        String fullName = "Novo Usuário";
        String rawPassword = "Password@123";
        String encodedHash = "$2a$12$hashedpassword";
        String fakeToken = "jwt.token.mock";

        when(userRepository.existsByEmail(email)).thenReturn(false);
        when(passwordEncoder.encode(rawPassword)).thenReturn(encodedHash);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(tokenProvider.generateAccessToken(any(UUID.class), eq(email))).thenReturn(fakeToken);

        AuthResult result = registerUserUseCase.execute(email, fullName, rawPassword);

        assertThat(result).isNotNull();
        assertThat(result.email()).isEqualTo(email);
        assertThat(result.fullName()).isEqualTo(fullName);
        assertThat(result.accessToken()).isEqualTo(fakeToken);

        verify(userRepository).save(any(User.class));
        verify(passwordEncoder).encode(rawPassword);
        verify(defaultCategorySeeder).seedDefaultsForUser(any(UUID.class));
    }

    @Test
    @DisplayName("Deve lançar EmailAlreadyRegisteredException quando e-mail já existe")
    void shouldThrowWhenEmailAlreadyRegistered() {
        String email = "existente@finance.com";
        when(userRepository.existsByEmail(email)).thenReturn(true);

        assertThatThrownBy(() -> registerUserUseCase.execute(email, "Pedro", "Senha123!"))
                .isInstanceOf(EmailAlreadyRegisteredException.class)
                .hasMessageContaining("E-mail já cadastrado");

        verify(userRepository, never()).save(any());
    }
}
