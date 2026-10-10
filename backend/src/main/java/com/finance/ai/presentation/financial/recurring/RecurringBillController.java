package com.finance.ai.presentation.financial.recurring;

import com.finance.ai.application.financial.recurring.CreateRecurringBillUseCase;
import com.finance.ai.application.financial.recurring.DeleteRecurringBillUseCase;
import com.finance.ai.application.financial.recurring.ListRecurringBillsUseCase;
import com.finance.ai.application.financial.recurring.PayRecurringBillUseCase;
import com.finance.ai.application.financial.recurring.UpdateRecurringBillUseCase;
import com.finance.ai.application.financial.recurring.dto.CreateRecurringBillCommand;
import com.finance.ai.application.financial.recurring.dto.PayRecurringBillCommand;
import com.finance.ai.application.financial.recurring.dto.RecurringBillResponse;
import com.finance.ai.application.financial.recurring.dto.UpdateRecurringBillCommand;
import com.finance.ai.infrastructure.security.AuthenticatedUser;
import com.finance.ai.presentation.financial.recurring.dto.CreateRecurringBillRequest;
import com.finance.ai.presentation.financial.recurring.dto.PayRecurringBillRequest;
import com.finance.ai.presentation.financial.recurring.dto.UpdateRecurringBillRequest;
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
@RequestMapping("/api/v1/recurring-bills")
@Tag(name = "Despesas Recorrentes e Assinaturas", description = "Gestão de compromissos financeiros fixos, assinaturas e previsão de vencimentos")
@SecurityRequirement(name = "bearerAuth")
public class RecurringBillController {

    private final CreateRecurringBillUseCase createRecurringBillUseCase;
    private final ListRecurringBillsUseCase listRecurringBillsUseCase;
    private final UpdateRecurringBillUseCase updateRecurringBillUseCase;
    private final DeleteRecurringBillUseCase deleteRecurringBillUseCase;
    private final PayRecurringBillUseCase payRecurringBillUseCase;

    public RecurringBillController(CreateRecurringBillUseCase createRecurringBillUseCase,
                                   ListRecurringBillsUseCase listRecurringBillsUseCase,
                                   UpdateRecurringBillUseCase updateRecurringBillUseCase,
                                   DeleteRecurringBillUseCase deleteRecurringBillUseCase,
                                   PayRecurringBillUseCase payRecurringBillUseCase) {
        this.createRecurringBillUseCase = createRecurringBillUseCase;
        this.listRecurringBillsUseCase = listRecurringBillsUseCase;
        this.updateRecurringBillUseCase = updateRecurringBillUseCase;
        this.deleteRecurringBillUseCase = deleteRecurringBillUseCase;
        this.payRecurringBillUseCase = payRecurringBillUseCase;
    }

    @GetMapping
    @Operation(summary = "Lista as despesas recorrentes do usuário autenticado para o mês de referência")
    public ResponseEntity<List<RecurringBillResponse>> list(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(value = "month", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate month) {

        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        LocalDate targetMonth = month != null ? month : LocalDate.now();
        var bills = listRecurringBillsUseCase.execute(user.userId(), targetMonth);
        return ResponseEntity.ok(bills);
    }

    @PostMapping
    @Operation(summary = "Cadastra uma nova despesa recorrente ou assinatura")
    public ResponseEntity<RecurringBillResponse> create(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CreateRecurringBillRequest request) {

        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        var cmd = new CreateRecurringBillCommand(
                request.description(),
                request.amount(),
                request.frequency(),
                request.dayOfMonth(),
                request.categoryId(),
                request.accountId(),
                request.creditCardId()
        );

        var created = createRecurringBillUseCase.execute(user.userId(), cmd);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualiza os dados de uma despesa recorrente")
    public ResponseEntity<RecurringBillResponse> update(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateRecurringBillRequest request) {

        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        var cmd = new UpdateRecurringBillCommand(
                request.description(),
                request.amount(),
                request.frequency(),
                request.dayOfMonth(),
                request.categoryId(),
                request.accountId(),
                request.creditCardId(),
                request.active()
        );

        var updated = updateRecurringBillUseCase.execute(user.userId(), id, cmd);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Remove uma despesa recorrente do usuário")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id) {

        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        deleteRecurringBillUseCase.execute(user.userId(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/pay")
    @Operation(summary = "Efetiva o lançamento da despesa recorrente no mês gerando a transação financeira")
    public ResponseEntity<Void> pay(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id,
            @RequestBody(required = false) PayRecurringBillRequest request) {

        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        var cmd = new PayRecurringBillCommand(
                request != null ? request.paymentDate() : null,
                request != null ? request.accountId() : null,
                request != null ? request.creditCardId() : null,
                request != null ? request.replicateMonths() : 1
        );

        payRecurringBillUseCase.execute(user.userId(), id, cmd);
        return ResponseEntity.ok().build();
    }
}
