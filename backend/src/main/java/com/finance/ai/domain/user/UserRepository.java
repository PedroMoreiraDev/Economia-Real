package com.finance.ai.domain.user;

import java.util.Optional;
import java.util.UUID;

/**
 * Porta de domínio para persistência de usuários.
 * Implementada na camada de infraestrutura (JPA).
 */
public interface UserRepository {
    Optional<User> findByEmail(String email);
    Optional<User> findById(UUID id);
    boolean existsByEmail(String email);
    User save(User user);
    void deleteById(UUID id);
}
