package com.finance.ai.infrastructure.persistence.user;

import com.finance.ai.domain.user.User;
import com.finance.ai.domain.user.UserRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Adaptador JPA da porta UserRepository.
 * Traduz entre entidade de domínio (User) e entidade de persistência (UserJpaEntity).
 */
@Repository
class UserRepositoryAdapter implements UserRepository {

    private final UserSpringDataRepository jpa;

    UserRepositoryAdapter(UserSpringDataRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return jpa.findByEmail(email).map(this::toDomain);
    }

    @Override
    public Optional<User> findById(UUID id) {
        return jpa.findById(id).map(this::toDomain);
    }

    @Override
    public boolean existsByEmail(String email) {
        return jpa.existsByEmail(email);
    }

    @Override
    public User save(User user) {
        var entity = toJpaEntity(user);
        var saved = jpa.save(entity);
        return toDomain(saved);
    }

    @Override
    public void deleteById(UUID id) {
        jpa.deleteById(id);
    }

    private User toDomain(UserJpaEntity e) {
        return new User(e.getId(), e.getEmail(), e.getFullName(), e.getPasswordHash(), e.getCreatedAt());
    }

    private UserJpaEntity toJpaEntity(User u) {
        return new UserJpaEntity(u.getId(), u.getEmail(), u.getPasswordHash(), u.getFullName(),
                u.getCreatedAt(), u.getUpdatedAt());
    }
}
