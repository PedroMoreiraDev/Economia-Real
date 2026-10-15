package com.finance.ai.presentation.financial;

import com.finance.ai.application.financial.CreateAccountUseCase;
import com.finance.ai.application.financial.ListAccountsUseCase;
import com.finance.ai.domain.financial.Account;
import com.finance.ai.domain.financial.AccountType;
import com.finance.ai.infrastructure.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/accounts")
@Tag(name = "Contas", description = "Gerenciamento de contas bancárias e carteiras do usuário")
@SecurityRequirement(name = "bearerAuth")
public class AccountController {

    private final CreateAccountUseCase createAccountUseCase;
    private final ListAccountsUseCase listAccountsUseCase;

    public AccountController(CreateAccountUseCase createAccountUseCase,
                             ListAccountsUseCase listAccountsUseCase) {
        this.createAccountUseCase = createAccountUseCase;
        this.listAccountsUseCase = listAccountsUseCase;
    }

    @PostMapping
    @Operation(summary = "Cadastra uma nova conta para o usuário autenticado")
    public ResponseEntity<AccountResponse> create(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CreateAccountRequest request) {

        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        var account = createAccountUseCase.execute(
                user.userId(),
                request.name(),
                request.type(),
                request.initialBalance() != null ? request.initialBalance() : BigDecimal.ZERO
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(account));
    }

    @GetMapping
    @Operation(summary = "Lista todas as contas do usuário autenticado")
    public ResponseEntity<List<AccountResponse>> list(@AuthenticationPrincipal AuthenticatedUser user) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        var accounts = listAccountsUseCase.execute(user.userId());
        var response = accounts.stream().map(this::toResponse).toList();
        return ResponseEntity.ok(response);
    }

    private AccountResponse toResponse(Account a) {
        return new AccountResponse(
                a.getId().toString(),
                a.getName(),
                a.getType().name(),
                a.getInitialBalance(),
                a.getCurrency(),
                a.isActive(),
                a.getCreatedAt().toString()
        );
    }

    public record CreateAccountRequest(
            @NotBlank @jakarta.validation.constraints.Size(min = 1, max = 100, message = "O nome da conta deve ter no máximo 100 caracteres.") String name,
            @NotNull AccountType type,
            BigDecimal initialBalance
    ) {}

    public record AccountResponse(
            String id,
            String name,
            String type,
            BigDecimal initialBalance,
            String currency,
            boolean active,
            String createdAt
    ) {}
}
