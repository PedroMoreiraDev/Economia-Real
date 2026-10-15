package com.finance.ai.application.financial.budget;

import com.finance.ai.domain.financial.budget.Budget;
import com.finance.ai.domain.financial.budget.BudgetRepository;
import com.finance.ai.presentation.financial.budget.dto.CreateBudgetRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Caso de uso para criação ou atualização em lote de orçamentos por categoria.
 */
@Service
public class BatchCreateBudgetsUseCase {

    private final CreateOrUpdateBudgetUseCase createOrUpdateBudgetUseCase;

    public BatchCreateBudgetsUseCase(CreateOrUpdateBudgetUseCase createOrUpdateBudgetUseCase) {
        this.createOrUpdateBudgetUseCase = createOrUpdateBudgetUseCase;
    }

    @Transactional
    public List<Budget> execute(UUID userId, List<CreateBudgetRequest> requests) {
        List<Budget> results = new ArrayList<>();
        if (requests == null || requests.isEmpty()) {
            return results;
        }
        if (requests.size() > 50) {
            throw new IllegalArgumentException("O lote de orçamentos não pode conter mais de 50 categorias por operação.");
        }

        for (var req : requests) {
            Budget budget = createOrUpdateBudgetUseCase.execute(
                    userId,
                    req.categoryId(),
                    req.monthReference(),
                    req.monthlyLimit(),
                    req.alertThresholdPercentage()
            );
            results.add(budget);
        }
        return results;
    }
}
