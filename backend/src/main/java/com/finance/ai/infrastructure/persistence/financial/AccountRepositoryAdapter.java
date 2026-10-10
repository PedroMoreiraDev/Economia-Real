package com.finance.ai.infrastructure.persistence.financial;

import com.finance.ai.domain.financial.Account;
import com.finance.ai.domain.financial.AccountRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
class AccountRepositoryAdapter implements AccountRepository {

    private final AccountSpringDataRepository jpa;

    AccountRepositoryAdapter(AccountSpringDataRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public List<Account> findAllByUserId(UUID userId) {
        return jpa.findAllByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public Optional<Account> findByIdAndUserId(UUID id, UUID userId) {
        return jpa.findByIdAndUserId(id, userId).map(this::toDomain);
    }

    @Override
    public Account save(Account account) {
        var entity = toJpaEntity(account);
        var saved = jpa.save(entity);
        return toDomain(saved);
    }

    private Account toDomain(AccountJpaEntity e) {
        return new Account(
                e.getId(),
                e.getUserId(),
                e.getName(),
                e.getType(),
                e.getInitialBalance(),
                e.getCurrency(),
                e.isActive(),
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }

    private AccountJpaEntity toJpaEntity(Account a) {
        return new AccountJpaEntity(
                a.getId(),
                a.getUserId(),
                a.getName(),
                a.getType(),
                a.getInitialBalance(),
                a.getCurrency(),
                a.isActive(),
                a.getCreatedAt(),
                a.getUpdatedAt()
        );
    }
}
