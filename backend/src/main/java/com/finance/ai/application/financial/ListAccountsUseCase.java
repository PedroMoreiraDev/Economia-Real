package com.finance.ai.application.financial;

import com.finance.ai.domain.financial.Account;
import com.finance.ai.domain.financial.AccountRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ListAccountsUseCase {

    private final AccountRepository accountRepository;

    public ListAccountsUseCase(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    @Transactional(readOnly = true)
    public List<Account> execute(UUID userId) {
        return accountRepository.findAllByUserId(userId);
    }
}
