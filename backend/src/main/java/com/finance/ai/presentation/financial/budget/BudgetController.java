package com.finance.ai.presentation.financial.budget;

import com.finance.ai.application.financial.budget.BatchCreateBudgetsUseCase;
import com.finance.ai.application.financial.budget.CreateOrUpdateBudgetUseCase;
import com.finance.ai.application.financial.budget.DeleteBudgetUseCase;
import com.finance.ai.application.financial.budget.ListBudgetsUseCase;
import com.finance.ai.application.financial.budget.SuggestBudgetsWithAiUseCase;
import com.finance.ai.application.financial.budget.dto.AiBudgetSuggestionResult;
import com.finance.ai.application.financial.budget.dto.BudgetProgressDto;
import com.finance.ai.domain.financial.budget.Budget;
import com.finance.ai.infrastructure.security.AuthenticatedUser;
import com.finance.ai.presentation.financial.budget.dto.CreateBudgetRequest;
import com.finance.ai.presentation.financial.budget.dto.SuggestBudgetsRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/budgets")
@Tag(name = "Orçamentos Mensais", description = "Definição de metas de gastos por categoria e acompanhamento em tempo real")
@SecurityRequirement(name = "bearerAuth")
public class BudgetController {

    private final CreateOrUpdateBudgetUseCase createOrUpdateBudgetUseCase;
    private final ListBudgetsUseCase listBudgetsUseCase;
    private final DeleteBudgetUseCase deleteBudgetUseCase;
    private final SuggestBudgetsWithAiUseCase suggestBudgetsWithAiUseCase;
    private final BatchCreateBudgetsUseCase batchCreateBudgetsUseCase;

    public BudgetController(CreateOrUpdateBudgetUseCase createOrUpdateBudgetUseCase,
                            ListBudgetsUseCase listBudgetsUseCase,
                            DeleteBudgetUseCase deleteBudgetUseCase,
                            SuggestBudgetsWithAiUseCase suggestBudgetsWithAiUseCase,
                            BatchCreateBudgetsUseCase batchCreateBudgetsUseCase) {
        this.createOrUpdateBudgetUseCase = createOrUpdateBudgetUseCase;
        this.listBudgetsUseCase = listBudgetsUseCase;
        this.deleteBudgetUseCase = deleteBudgetUseCase;
        this.suggestBudgetsWithAiUseCase = suggestBudgetsWithAiUseCase;
        this.batchCreateBudgetsUseCase = batchCreateBudgetsUseCase;
    }

    @GetMapping
    @Operation(summary = "Lista os orçamentos e o progresso de gastos do mês para o usuário autenticado")
    public ResponseEntity<List<BudgetProgressDto>> listBudgets(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(value = "month", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate month) {

        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        LocalDate targetMonth = month != null ? month : LocalDate.now();
        var progressList = listBudgetsUseCase.execute(user.userId(), targetMonth);
        return ResponseEntity.ok(progressList);
    }

    @PostMapping
    @Operation(summary = "Cria ou atualiza um orçamento por categoria para o mês especificado")
    public ResponseEntity<Budget> createOrUpdateBudget(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CreateBudgetRequest request) {

        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        LocalDate targetMonth = request.monthReference() != null ? request.monthReference() : LocalDate.now();
        var budget = createOrUpdateBudgetUseCase.execute(
                user.userId(),
                request.categoryId(),
                targetMonth,
                request.monthlyLimit(),
                request.alertThresholdPercentage()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(budget);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Exclui um orçamento configurado")
    public ResponseEntity<Void> deleteBudget(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id) {

        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        deleteBudgetUseCase.execute(user.userId(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/ai-suggest")
    @Operation(summary = "Gera sugestões de distribuição do teto global de gastos entre as categorias usando análise inteligente")
    public ResponseEntity<AiBudgetSuggestionResult> suggestBudgetsWithAi(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody SuggestBudgetsRequest request) {

        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        var result = suggestBudgetsWithAiUseCase.execute(
                user.userId(),
                request.globalLimit(),
                request.monthReference()
        );
        return ResponseEntity.ok(result);
    }

    @PostMapping("/batch")
    @Operation(summary = "Salva ou atualiza múltiplos orçamentos por categoria em uma única operação atômica")
    public ResponseEntity<List<Budget>> batchCreateBudgets(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody List<CreateBudgetRequest> requests) {

        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        var saved = batchCreateBudgetsUseCase.execute(user.userId(), requests);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}
