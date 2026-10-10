package com.finance.ai.application.auth;

import com.finance.ai.domain.user.User;
import com.finance.ai.domain.user.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Caso de Uso: Exclusão de Conta (LGPD - Direito ao Esquecimento)")
class DeleteAccountUseCaseTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private DeleteAccountUseCase deleteAccountUseCase;

    @Test
    @DisplayName("Deve excluir a conta com sucesso quando o usuário existir")
    void shouldDeleteAccountWhenUserExists() {
        UUID userId = UUID.randomUUID();
        User user = new User(userId, "usuario@teste.com", "Usuário Teste", "hash", Instant.now());

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        deleteAccountUseCase.execute(userId);

        verify(userRepository, times(1)).deleteById(userId);
    }

    @Test
    @DisplayName("Não deve chamar deleteById se o usuário não for encontrado")
    void shouldNotDeleteWhenUserNotFound() {
        UUID userId = UUID.randomUUID();
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        deleteAccountUseCase.execute(userId);

        verify(userRepository, never()).deleteById(userId);
    }

    @Test
    @DisplayName("Deve lançar exceção quando o ID do usuário for nulo")
    void shouldThrowExceptionWhenUserIdIsNull() {
        assertThatThrownBy(() -> deleteAccountUseCase.execute(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("ID do usuário não pode ser nulo");
    }
}
