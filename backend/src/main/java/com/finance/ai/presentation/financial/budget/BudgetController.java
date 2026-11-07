package com.finance.ai.presentation.financial.budget;

import com.finance.ai.application.financial.budget.BatchCreateBudgetsUseCase;
import com.finance.ai.application.financial.budget.CreateOrUpdateBudgetUseCase;
import com.finance.ai.application.financial.budget.DeleteBudgetUseCase;
import com.finance.ai.application.financial.budget.GetBudgetCategoryLocksUseCase;
import com.finance.ai.application.financial.budget.GetSpendingLimitsTimelineUseCase;
import com.finance.ai.application.financial.budget.ListBudgetsUseCase;
import com.finance.ai.application.financial.budget.RemoveSpendingLimitUseCase;
import com.finance.ai.application.financial.budget.SaveBudgetCategoryLocksUseCase;
import com.finance.ai.application.financial.budget.SaveSpendingLimitUseCase;
import com.finance.ai.application.financial.budget.SuggestBudgetsWithAiUseCase;
import com.finance.ai.application.financial.budget.SyncSpendingLimitsTimelineUseCase;
import com.finance.ai.application.financial.budget.UpdateGlobalAlertThresholdUseCase;
import com.finance.ai.application.financial.budget.dto.AiBudgetSuggestionResult;
import com.finance.ai.application.financial.budget.dto.BudgetProgressDto;
import com.finance.ai.domain.financial.budget.Budget;
import com.finance.ai.infrastructure.security.AuthenticatedUser;
import com.finance.ai.presentation.financial.budget.dto.CreateBudgetRequest;
import com.finance.ai.presentation.financial.budget.dto.SaveBudgetLocksRequest;
import com.finance.ai.presentation.financial.budget.dto.SaveSpendingLimitRequest;
import com.finance.ai.presentation.financial.budget.dto.SuggestBudgetsRequest;
import com.finance.ai.presentation.financial.budget.dto.SyncSpendingLimitsRequest;
import com.finance.ai.presentation.financial.budget.dto.UpdateAlertThresholdRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
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
    private final UpdateGlobalAlertThresholdUseCase updateGlobalAlertThresholdUseCase;
    private final GetSpendingLimitsTimelineUseCase getSpendingLimitsTimelineUseCase;
    private final SaveSpendingLimitUseCase saveSpendingLimitUseCase;
    private final RemoveSpendingLimitUseCase removeSpendingLimitUseCase;
    private final SyncSpendingLimitsTimelineUseCase syncSpendingLimitsTimelineUseCase;
    private final GetBudgetCategoryLocksUseCase getBudgetCategoryLocksUseCase;
    private final SaveBudgetCategoryLocksUseCase saveBudgetCategoryLocksUseCase;

    public BudgetController(CreateOrUpdateBudgetUseCase createOrUpdateBudgetUseCase,
                            ListBudgetsUseCase listBudgetsUseCase,
                            DeleteBudgetUseCase deleteBudgetUseCase,
                            SuggestBudgetsWithAiUseCase suggestBudgetsWithAiUseCase,
                            BatchCreateBudgetsUseCase batchCreateBudgetsUseCase,
                            UpdateGlobalAlertThresholdUseCase updateGlobalAlertThresholdUseCase,
                            GetSpendingLimitsTimelineUseCase getSpendingLimitsTimelineUseCase,
                            SaveSpendingLimitUseCase saveSpendingLimitUseCase,
                            RemoveSpendingLimitUseCase removeSpendingLimitUseCase,
                            SyncSpendingLimitsTimelineUseCase syncSpendingLimitsTimelineUseCase,
                            GetBudgetCategoryLocksUseCase getBudgetCategoryLocksUseCase,
                            SaveBudgetCategoryLocksUseCase saveBudgetCategoryLocksUseCase) {
        this.createOrUpdateBudgetUseCase = createOrUpdateBudgetUseCase;
        this.listBudgetsUseCase = listBudgetsUseCase;
        this.deleteBudgetUseCase = deleteBudgetUseCase;
        this.suggestBudgetsWithAiUseCase = suggestBudgetsWithAiUseCase;
        this.batchCreateBudgetsUseCase = batchCreateBudgetsUseCase;
        this.updateGlobalAlertThresholdUseCase = updateGlobalAlertThresholdUseCase;
        this.getSpendingLimitsTimelineUseCase = getSpendingLimitsTimelineUseCase;
        this.saveSpendingLimitUseCase = saveSpendingLimitUseCase;
        this.removeSpendingLimitUseCase = removeSpendingLimitUseCase;
        this.syncSpendingLimitsTimelineUseCase = syncSpendingLimitsTimelineUseCase;
        this.getBudgetCategoryLocksUseCase = getBudgetCategoryLocksUseCase;
        this.saveBudgetCategoryLocksUseCase = saveBudgetCategoryLocksUseCase;
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

    @PatchMapping("/alert-threshold")
    @Operation(summary = "Atualiza o percentual de alerta de consumo próximo para todas as categorias no mês")
    public ResponseEntity<List<Budget>> updateGlobalAlertThreshold(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody UpdateAlertThresholdRequest request) {

        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        LocalDate targetMonth = request.monthReference() != null ? request.monthReference() : LocalDate.now();
        var updated = updateGlobalAlertThresholdUseCase.execute(
                user.userId(),
                targetMonth,
                request.alertThresholdPercentage()
        );
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/spending-limits")
    @Operation(summary = "Obtém a timeline completa de tetos de gastos globais do usuário")
    public ResponseEntity<Map<String, BigDecimal>> getSpendingLimits(
            @AuthenticationPrincipal AuthenticatedUser user) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(getSpendingLimitsTimelineUseCase.execute(user.userId()));
    }

    @PostMapping("/spending-limits")
    @Operation(summary = "Salva ou atualiza o teto global de gastos para um determinado mês")
    public ResponseEntity<Map<String, BigDecimal>> saveSpendingLimit(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody SaveSpendingLimitRequest request) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        var updated = saveSpendingLimitUseCase.execute(user.userId(), request.month(), request.amount());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/spending-limits/{month}")
    @Operation(summary = "Remove o teto global de gastos de um determinado mês (interrompendo a herança contábil)")
    public ResponseEntity<Map<String, BigDecimal>> removeSpendingLimit(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable String month) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        var updated = removeSpendingLimitUseCase.execute(user.userId(), month);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/spending-limits/sync")
    @Operation(summary = "Sincroniza a timeline local do dispositivo com a nuvem no banco de dados")
    public ResponseEntity<Map<String, BigDecimal>> syncSpendingLimits(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestBody SyncSpendingLimitsRequest request) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        var merged = syncSpendingLimitsTimelineUseCase.execute(user.userId(), request.timeline());
        return ResponseEntity.ok(merged);
    }

    @GetMapping("/locks")
    @Operation(summary = "Obtém as categorias com travas manuais fixadas na distribuição de IA para o mês")
    public ResponseEntity<Map<UUID, BigDecimal>> getBudgetCategoryLocks(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(value = "month", required = false) String month) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        var locks = getBudgetCategoryLocksUseCase.execute(user.userId(), month);
        return ResponseEntity.ok(locks);
    }

    @PutMapping("/locks")
    @Operation(summary = "Salva ou atualiza as travas manuais de categorias na distribuição de IA para o mês")
    public ResponseEntity<Map<UUID, BigDecimal>> saveBudgetCategoryLocks(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestBody SaveBudgetLocksRequest request) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        var locks = saveBudgetCategoryLocksUseCase.execute(user.userId(), request.month(), request.locks());
        return ResponseEntity.ok(locks);
    }
}
