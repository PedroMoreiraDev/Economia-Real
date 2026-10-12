package com.finance.ai.application.financial.budget;

import com.finance.ai.domain.financial.budget.Budget;
import com.finance.ai.domain.financial.budget.BudgetRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Caso de uso para atualizar o percentual de alerta de consumo próximo
 * para todas as categorias com orçamento no mês indicado.
 */
@Service
public class UpdateGlobalAlertThresholdUseCase {

    private final BudgetRepository budgetRepository;

    public UpdateGlobalAlertThresholdUseCase(BudgetRepository budgetRepository) {
        this.budgetRepository = budgetRepository;
    }

    @Transactional
    public List<Budget> execute(UUID userId, LocalDate monthReference, int newThreshold) {
        LocalDate normalizedMonth = (monthReference != null ? monthReference : LocalDate.now()).withDayOfMonth(1);
        List<Budget> budgets = budgetRepository.findAllByUserIdAndMonthReference(userId, normalizedMonth);
        List<Budget> updated = new ArrayList<>();

        for (Budget b : budgets) {
            Budget newB = b.updateLimit(b.getMonthlyLimit(), newThreshold);
            updated.add(budgetRepository.save(newB));
        }

        return updated;
    }
}
