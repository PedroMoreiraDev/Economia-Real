package com.finance.ai.domain.financial;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AccountRepository {
    List<Account> findAllByUserId(UUID userId);
    Optional<Account> findByIdAndUserId(UUID id, UUID userId);
    Account save(Account account);
}
