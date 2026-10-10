package com.finance.ai.presentation.financial.goal;

import com.finance.ai.application.financial.goal.CreateSavingsGoalUseCase;
import com.finance.ai.application.financial.goal.DeleteSavingsGoalUseCase;
import com.finance.ai.application.financial.goal.DepositToSavingsGoalUseCase;
import com.finance.ai.application.financial.goal.ListSavingsGoalsUseCase;
import com.finance.ai.application.financial.goal.UpdateSavingsGoalUseCase;
import com.finance.ai.application.financial.goal.WithdrawFromSavingsGoalUseCase;
import com.finance.ai.application.financial.goal.dto.CreateSavingsGoalCommand;
import com.finance.ai.application.financial.goal.dto.DepositGoalCommand;
import com.finance.ai.application.financial.goal.dto.SavingsGoalResponse;
import com.finance.ai.application.financial.goal.dto.UpdateSavingsGoalCommand;
import com.finance.ai.application.financial.goal.dto.WithdrawGoalCommand;
import com.finance.ai.infrastructure.security.AuthenticatedUser;
import com.finance.ai.presentation.financial.goal.dto.CreateSavingsGoalRequest;
import com.finance.ai.presentation.financial.goal.dto.DepositGoalRequest;
import com.finance.ai.presentation.financial.goal.dto.UpdateSavingsGoalRequest;
import com.finance.ai.presentation.financial.goal.dto.WithdrawGoalRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/savings-goals")
@Tag(name = "Metas de Economia", description = "Gestão de metas financeiras, reserva de emergência e histórico de aportes e resgates")
@SecurityRequirement(name = "bearerAuth")
public class SavingsGoalController {

    private final CreateSavingsGoalUseCase createSavingsGoalUseCase;
    private final ListSavingsGoalsUseCase listSavingsGoalsUseCase;
    private final UpdateSavingsGoalUseCase updateSavingsGoalUseCase;
    private final DeleteSavingsGoalUseCase deleteSavingsGoalUseCase;
    private final DepositToSavingsGoalUseCase depositToSavingsGoalUseCase;
    private final WithdrawFromSavingsGoalUseCase withdrawFromSavingsGoalUseCase;

    public SavingsGoalController(CreateSavingsGoalUseCase createSavingsGoalUseCase,
                                 ListSavingsGoalsUseCase listSavingsGoalsUseCase,
                                 UpdateSavingsGoalUseCase updateSavingsGoalUseCase,
                                 DeleteSavingsGoalUseCase deleteSavingsGoalUseCase,
                                 DepositToSavingsGoalUseCase depositToSavingsGoalUseCase,
                                 WithdrawFromSavingsGoalUseCase withdrawFromSavingsGoalUseCase) {
        this.createSavingsGoalUseCase = createSavingsGoalUseCase;
        this.listSavingsGoalsUseCase = listSavingsGoalsUseCase;
        this.updateSavingsGoalUseCase = updateSavingsGoalUseCase;
        this.deleteSavingsGoalUseCase = deleteSavingsGoalUseCase;
        this.depositToSavingsGoalUseCase = depositToSavingsGoalUseCase;
        this.withdrawFromSavingsGoalUseCase = withdrawFromSavingsGoalUseCase;
    }

    @GetMapping
    @Operation(summary = "Lista todas as metas de economia do usuário autenticado")
    public ResponseEntity<List<SavingsGoalResponse>> list(@AuthenticationPrincipal AuthenticatedUser user) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(listSavingsGoalsUseCase.execute(user.userId()));
    }

    @PostMapping
    @Operation(summary = "Cadastra uma nova meta de economia")
    public ResponseEntity<SavingsGoalResponse> create(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CreateSavingsGoalRequest request) {

        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        var cmd = new CreateSavingsGoalCommand(request.title(), request.targetAmount(), request.targetDate());
        var created = createSavingsGoalUseCase.execute(user.userId(), cmd);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualiza os parâmetros de uma meta de economia")
    public ResponseEntity<SavingsGoalResponse> update(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateSavingsGoalRequest request) {

        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        var cmd = new UpdateSavingsGoalCommand(request.title(), request.targetAmount(), request.targetDate());
        var updated = updateSavingsGoalUseCase.execute(user.userId(), id, cmd);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Exclui uma meta de economia")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id) {

        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        deleteSavingsGoalUseCase.execute(user.userId(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/deposit")
    @Operation(summary = "Realiza um aporte financeiro na meta com débito opcional em conta bancária")
    public ResponseEntity<SavingsGoalResponse> deposit(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id,
            @Valid @RequestBody DepositGoalRequest request) {

        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        var cmd = new DepositGoalCommand(request.amount(), request.sourceAccountId());
        var updated = depositToSavingsGoalUseCase.execute(user.userId(), id, cmd);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/withdraw")
    @Operation(summary = "Realiza um resgate financeiro da meta com crédito opcional em conta bancária")
    public ResponseEntity<SavingsGoalResponse> withdraw(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id,
            @Valid @RequestBody WithdrawGoalRequest request) {

        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        var cmd = new WithdrawGoalCommand(request.amount(), request.destinationAccountId());
        var updated = withdrawFromSavingsGoalUseCase.execute(user.userId(), id, cmd);
        return ResponseEntity.ok(updated);
    }
}
