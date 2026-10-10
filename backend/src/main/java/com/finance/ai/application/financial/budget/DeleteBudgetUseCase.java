package com.finance.ai.application.financial.budget;

import com.finance.ai.domain.financial.budget.BudgetRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class DeleteBudgetUseCase {

    private final BudgetRepository budgetRepository;

    public DeleteBudgetUseCase(BudgetRepository budgetRepository) {
        this.budgetRepository = budgetRepository;
    }

    @Transactional
    public void execute(UUID userId, UUID budgetId) {
        budgetRepository.deleteByIdAndUserId(budgetId, userId);
    }
}
