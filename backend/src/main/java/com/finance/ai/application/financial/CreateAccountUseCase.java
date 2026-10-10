package com.finance.ai.application.financial;

import com.finance.ai.domain.financial.Account;
import com.finance.ai.domain.financial.AccountRepository;
import com.finance.ai.domain.financial.AccountType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
public class CreateAccountUseCase {

    private final AccountRepository accountRepository;

    public CreateAccountUseCase(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    @Transactional
    public Account execute(UUID userId, String name, AccountType type, BigDecimal initialBalance) {
        var account = Account.create(userId, name, type, initialBalance);
        return accountRepository.save(account);
    }
}
