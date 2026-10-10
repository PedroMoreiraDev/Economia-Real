package com.finance.ai.application.auth;

import com.finance.ai.domain.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Caso de uso: Exclusão total da conta do usuário (LGPD - Direito ao Esquecimento).
 * Remove o cadastro do usuário, provocando a limpeza relacional em cascata de todos
 * os dados sensíveis e transações associadas.
 */
@Service
public class DeleteAccountUseCase {

    private static final Logger log = LoggerFactory.getLogger(DeleteAccountUseCase.class);
    private final UserRepository userRepository;

    public DeleteAccountUseCase(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public void execute(UUID userId) {
        if (userId == null) {
            throw new IllegalArgumentException("ID do usuário não pode ser nulo.");
        }

        userRepository.findById(userId).ifPresentOrElse(
                user -> {
                    userRepository.deleteById(userId);
                    log.info("Conta de usuário excluída com sucesso em conformidade com a LGPD. userId: {}", userId);
                },
                () -> log.warn("Tentativa de exclusão de usuário inexistente: {}", userId)
        );
    }
}
