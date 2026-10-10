package com.finance.ai.application.financial.budget;

import com.finance.ai.domain.financial.CategoryRepository;
import com.finance.ai.domain.financial.budget.Budget;
import com.finance.ai.domain.financial.budget.BudgetRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Service
public class CreateOrUpdateBudgetUseCase {

    private final BudgetRepository budgetRepository;
    private final CategoryRepository categoryRepository;

    public CreateOrUpdateBudgetUseCase(BudgetRepository budgetRepository,
                                       CategoryRepository categoryRepository) {
        this.budgetRepository = budgetRepository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional
    public Budget execute(UUID userId, UUID categoryId, LocalDate monthReference,
                          BigDecimal monthlyLimit, Integer alertThresholdPercentage) {

        categoryRepository.findByIdAndUserId(categoryId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Categoria não encontrada ou não pertence ao usuário."));

        LocalDate normalizedMonth = (monthReference != null ? monthReference : LocalDate.now()).withDayOfMonth(1);

        var existingBudget = budgetRepository.findByUserIdAndCategoryIdAndMonthReference(userId, categoryId, normalizedMonth);

        Budget budgetToSave;
        if (existingBudget.isPresent()) {
            budgetToSave = existingBudget.get().updateLimit(monthlyLimit, alertThresholdPercentage);
        } else {
            budgetToSave = Budget.create(userId, categoryId, normalizedMonth, monthlyLimit, alertThresholdPercentage);
        }

        return budgetRepository.save(budgetToSave);
    }
}
