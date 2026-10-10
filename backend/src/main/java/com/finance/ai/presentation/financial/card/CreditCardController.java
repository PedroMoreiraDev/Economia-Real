package com.finance.ai.presentation.financial.card;

import com.finance.ai.application.financial.card.*;
import com.finance.ai.domain.financial.card.CreditCard;
import com.finance.ai.domain.financial.card.CreditCardInvoice;
import com.finance.ai.infrastructure.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/credit-cards")
@Tag(name = "Cartões de Crédito", description = "Gestão de cartões, compras parceladas e liquidação de faturas")
@SecurityRequirement(name = "bearerAuth")
public class CreditCardController {

    private final CreateCreditCardUseCase createCreditCardUseCase;
    private final ListCreditCardsUseCase listCreditCardsUseCase;
    private final CreateCreditCardPurchaseUseCase createPurchaseUseCase;
    private final ListInvoicesUseCase listInvoicesUseCase;
    private final PayInvoiceUseCase payInvoiceUseCase;

    public CreditCardController(CreateCreditCardUseCase createCreditCardUseCase,
                                ListCreditCardsUseCase listCreditCardsUseCase,
                                CreateCreditCardPurchaseUseCase createPurchaseUseCase,
                                ListInvoicesUseCase listInvoicesUseCase,
                                PayInvoiceUseCase payInvoiceUseCase) {
        this.createCreditCardUseCase = createCreditCardUseCase;
        this.listCreditCardsUseCase = listCreditCardsUseCase;
        this.createPurchaseUseCase = createPurchaseUseCase;
        this.listInvoicesUseCase = listInvoicesUseCase;
        this.payInvoiceUseCase = payInvoiceUseCase;
    }

    @PostMapping
    @Operation(summary = "Cadastra um novo cartão de crédito para o usuário")
    public ResponseEntity<CreditCardResponse> create(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CreateCardRequest request) {

        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        var card = createCreditCardUseCase.execute(
                user.userId(),
                request.name(),
                request.creditLimit(),
                request.closingDay(),
                request.dueDay()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(card));
    }

    @GetMapping
    @Operation(summary = "Lista todos os cartões de crédito do usuário autenticado")
    public ResponseEntity<List<CreditCardResponse>> list(@AuthenticationPrincipal AuthenticatedUser user) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        var cards = listCreditCardsUseCase.execute(user.userId());
        var response = cards.stream().map(this::toResponse).toList();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/purchases")
    @Operation(summary = "Registra uma compra (à vista ou parcelada) no cartão de crédito")
    public ResponseEntity<CreditCardPurchaseResult> createPurchase(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id,
            @Valid @RequestBody CreatePurchaseRequest request) {

        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        var result = createPurchaseUseCase.execute(
                user.userId(),
                id,
                request.description(),
                request.totalAmount(),
                request.installments() != null ? request.installments() : 1,
                request.purchaseDate() != null ? request.purchaseDate() : LocalDate.now(),
                request.categoryId(),
                request.notes()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @GetMapping("/{id}/invoices")
    @Operation(summary = "Lista as faturas geradas de um cartão do usuário")
    public ResponseEntity<List<InvoiceResponse>> listInvoices(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id) {

        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        var invoices = listInvoicesUseCase.execute(user.userId(), id);
        var response = invoices.stream().map(this::toInvoiceResponse).toList();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/invoices/{invoiceId}/pay")
    @Operation(summary = "Registra o pagamento da fatura com débito em conta bancária (sem dupla contagem)")
    public ResponseEntity<InvoiceResponse> payInvoice(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID invoiceId,
            @Valid @RequestBody PayInvoiceRequest request) {

        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        var invoice = payInvoiceUseCase.execute(
                user.userId(),
                invoiceId,
                request.accountId(),
                request.paymentAmount(),
                request.paymentDate() != null ? request.paymentDate() : LocalDate.now()
        );

        return ResponseEntity.ok(toInvoiceResponse(invoice));
    }

    private CreditCardResponse toResponse(CreditCard c) {
        return new CreditCardResponse(
                c.getId().toString(),
                c.getName(),
                c.getCreditLimit(),
                c.getClosingDay(),
                c.getDueDay(),
                c.isActive(),
                c.getCreatedAt().toString()
        );
    }

    private InvoiceResponse toInvoiceResponse(CreditCardInvoice i) {
        return new InvoiceResponse(
                i.getId().toString(),
                i.getCreditCardId().toString(),
                i.getReferenceMonth().toString(),
                i.getClosingDate().toString(),
                i.getDueDate().toString(),
                i.getStatus().name(),
                i.getPaidAmount(),
                i.getPaidAt() != null ? i.getPaidAt().toString() : null
        );
    }

    public record CreateCardRequest(
            @NotBlank String name,
            @NotNull @Positive BigDecimal creditLimit,
            @NotNull @Min(1) @Max(31) Integer closingDay,
            @NotNull @Min(1) @Max(31) Integer dueDay
    ) {}

    public record CreatePurchaseRequest(
            @NotBlank String description,
            @NotNull @Positive BigDecimal totalAmount,
            @Min(1) @Max(48) Integer installments,
            LocalDate purchaseDate,
            UUID categoryId,
            String notes
    ) {}

    public record PayInvoiceRequest(
            @NotNull UUID accountId,
            @NotNull @Positive BigDecimal paymentAmount,
            LocalDate paymentDate
    ) {}

    public record CreditCardResponse(
            String id,
            String name,
            BigDecimal creditLimit,
            int closingDay,
            int dueDay,
            boolean active,
            String createdAt
    ) {}

    public record InvoiceResponse(
            String id,
            String creditCardId,
            String referenceMonth,
            String closingDate,
            String dueDate,
            String status,
            BigDecimal paidAmount,
            String paidAt
    ) {}
}
