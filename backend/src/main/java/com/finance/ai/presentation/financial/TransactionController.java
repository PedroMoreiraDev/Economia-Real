package com.finance.ai.presentation.financial;

import com.finance.ai.application.financial.CreateTransactionUseCase;
import com.finance.ai.application.financial.UpdateTransactionUseCase;
import com.finance.ai.application.financial.DeleteTransactionUseCase;
import com.finance.ai.application.financial.FinancialSummaryResult;
import com.finance.ai.application.financial.GetFinancialSummaryUseCase;
import com.finance.ai.application.financial.ListTransactionsUseCase;
import com.finance.ai.domain.financial.Transaction;
import com.finance.ai.domain.financial.TransactionType;
import com.finance.ai.infrastructure.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/transactions")
@Tag(name = "Transações", description = "Lançamentos financeiros de receitas, despesas e transferências")
@SecurityRequirement(name = "bearerAuth")
public class TransactionController {

    private final CreateTransactionUseCase createTransactionUseCase;
    private final UpdateTransactionUseCase updateTransactionUseCase;
    private final DeleteTransactionUseCase deleteTransactionUseCase;
    private final ListTransactionsUseCase listTransactionsUseCase;
    private final GetFinancialSummaryUseCase getFinancialSummaryUseCase;

    public TransactionController(CreateTransactionUseCase createTransactionUseCase,
                                 UpdateTransactionUseCase updateTransactionUseCase,
                                 DeleteTransactionUseCase deleteTransactionUseCase,
                                 ListTransactionsUseCase listTransactionsUseCase,
                                 GetFinancialSummaryUseCase getFinancialSummaryUseCase) {
        this.createTransactionUseCase = createTransactionUseCase;
        this.updateTransactionUseCase = updateTransactionUseCase;
        this.deleteTransactionUseCase = deleteTransactionUseCase;
        this.listTransactionsUseCase = listTransactionsUseCase;
        this.getFinancialSummaryUseCase = getFinancialSummaryUseCase;
    }

    @PostMapping
    @Operation(summary = "Registra uma nova transação financeira para o usuário")
    public ResponseEntity<TransactionResponse> create(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CreateTransactionRequest request) {

        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        var transaction = createTransactionUseCase.execute(
                user.userId(),
                request.type(),
                request.amount(),
                request.accrualDate(),
                request.settlementDate(),
                request.description(),
                request.accountId(),
                request.destinationAccountId(),
                request.categoryId(),
                request.notes()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(transaction));
    }

    @GetMapping
    @Operation(summary = "Lista transações do usuário autenticado com filtro opcional por data")
    public ResponseEntity<List<TransactionResponse>> list(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        var transactions = listTransactionsUseCase.execute(user.userId(), startDate, endDate);
        var response = transactions.stream().map(this::toResponse).toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/summary")
    @Operation(summary = "Obtém métricas determinísticas consolidadas (receitas, despesas e saldos)")
    public ResponseEntity<FinancialSummaryResult> getSummary(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        var summary = getFinancialSummaryUseCase.execute(user.userId(), startDate, endDate);
        return ResponseEntity.ok(summary);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualiza os dados de uma movimentação existente do usuário")
    public ResponseEntity<TransactionResponse> update(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTransactionRequest request) {

        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        var updated = updateTransactionUseCase.execute(
                user.userId(),
                id,
                request.type(),
                request.amount(),
                request.accrualDate(),
                request.settlementDate(),
                request.description(),
                request.accountId(),
                request.destinationAccountId(),
                request.categoryId(),
                request.notes()
        );

        return ResponseEntity.ok(toResponse(updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Exclui uma movimentação financeira do usuário")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id) {

        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        deleteTransactionUseCase.execute(user.userId(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/batch-delete")
    @Operation(summary = "Exclui múltiplas movimentações financeiras do usuário em lote")
    public ResponseEntity<Void> deleteBatch(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestBody List<UUID> transactionIds) {

        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        deleteTransactionUseCase.executeBatch(user.userId(), transactionIds);
        return ResponseEntity.noContent().build();
    }

    private TransactionResponse toResponse(Transaction t) {
        return new TransactionResponse(
                t.getId().toString(),
                t.getType().name(),
                t.getAmount(),
                t.getAccrualDate().toString(),
                t.getSettlementDate() != null ? t.getSettlementDate().toString() : null,
                t.getDescription(),
                t.getAccountId() != null ? t.getAccountId().toString() : null,
                t.getDestinationAccountId() != null ? t.getDestinationAccountId().toString() : null,
                t.getCategoryId() != null ? t.getCategoryId().toString() : null,
                t.getStatus().name(),
                t.getOrigin().name(),
                t.getNotes(),
                t.getCreatedAt().toString()
        );
    }

    public record CreateTransactionRequest(
            @NotNull TransactionType type,
            @NotNull @Positive BigDecimal amount,
            @NotNull LocalDate accrualDate,
            LocalDate settlementDate,
            @NotBlank String description,
            UUID accountId,
            UUID destinationAccountId,
            UUID categoryId,
            String notes
    ) {}

    public record UpdateTransactionRequest(
            @NotNull TransactionType type,
            @NotNull @Positive BigDecimal amount,
            @NotNull LocalDate accrualDate,
            LocalDate settlementDate,
            @NotBlank String description,
            UUID accountId,
            UUID destinationAccountId,
            UUID categoryId,
            String notes
    ) {}

    public record TransactionResponse(
            String id,
            String type,
            BigDecimal amount,
            String accrualDate,
            String settlementDate,
            String description,
            String accountId,
            String destinationAccountId,
            String categoryId,
            String status,
            String origin,
            String notes,
            String createdAt
    ) {}
}
