package com.finance.ai.application.financial.card;

import com.finance.ai.domain.financial.Transaction;
import com.finance.ai.domain.financial.TransactionRepository;
import com.finance.ai.domain.financial.TransactionType;
import com.finance.ai.domain.financial.card.CreditCardInvoice;
import com.finance.ai.domain.financial.card.CreditCardInvoiceRepository;
import com.finance.ai.domain.financial.card.CreditCardRepository;
import com.finance.ai.domain.financial.card.InstallmentSplitter;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class CreateCreditCardPurchaseUseCase {

    private final CreditCardRepository creditCardRepository;
    private final CreditCardInvoiceRepository invoiceRepository;
    private final TransactionRepository transactionRepository;
    private final com.finance.ai.domain.financial.CategoryRepository categoryRepository;

    public CreateCreditCardPurchaseUseCase(CreditCardRepository creditCardRepository,
                                           CreditCardInvoiceRepository invoiceRepository,
                                           TransactionRepository transactionRepository) {
        this(creditCardRepository, invoiceRepository, transactionRepository, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public CreateCreditCardPurchaseUseCase(CreditCardRepository creditCardRepository,
                                           CreditCardInvoiceRepository invoiceRepository,
                                           TransactionRepository transactionRepository,
                                           @org.springframework.beans.factory.annotation.Autowired(required = false) com.finance.ai.domain.financial.CategoryRepository categoryRepository) {
        this.creditCardRepository = creditCardRepository;
        this.invoiceRepository = invoiceRepository;
        this.transactionRepository = transactionRepository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional
    public CreditCardPurchaseResult execute(UUID userId, UUID creditCardId, String description,
                                            BigDecimal totalAmount, int installmentsCount,
                                            LocalDate purchaseDate, UUID categoryId, String notes) {

        var card = creditCardRepository.findByIdAndUserId(creditCardId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Cartão de crédito não encontrado ou não pertence ao usuário."));

        if (!card.isActive()) {
            throw new IllegalStateException("O cartão de crédito está inativo.");
        }

        // Prevenção contra IDOR: validação de pertencimento da categoria ao usuário
        if (categoryId != null && categoryRepository != null) {
            categoryRepository.findByIdAndUserId(categoryId, userId)
                    .orElseThrow(() -> new IllegalArgumentException("Categoria informada não existe ou não pertence ao usuário."));
        }

        var installmentAmounts = InstallmentSplitter.split(totalAmount, installmentsCount);

        // Determinação do mês da primeira fatura
        LocalDate firstInvoiceMonth;
        if (purchaseDate.getDayOfMonth() <= card.getClosingDay()) {
            firstInvoiceMonth = purchaseDate.withDayOfMonth(1);
        } else {
            firstInvoiceMonth = purchaseDate.plusMonths(1).withDayOfMonth(1);
        }

        List<CreditCardPurchaseResult.InstallmentInfo> installmentInfos = new ArrayList<>();
        UUID parentPurchaseId = UUID.randomUUID();

        for (int i = 0; i < installmentsCount; i++) {
            int installmentNumber = i + 1;
            BigDecimal amount = installmentAmounts.get(i);
            LocalDate invoiceMonth = firstInvoiceMonth.plusMonths(i);

            // Obtém ou cria a fatura para o mês
            var invoice = getOrCreateInvoice(card.getId(), card.getClosingDay(), card.getDueDay(), invoiceMonth);

            String desc = installmentsCount > 1
                    ? String.format("%s (%d/%d)", description.trim(), installmentNumber, installmentsCount)
                    : description.trim();

            var transaction = Transaction.create(
                    userId,
                    TransactionType.EXPENSE,
                    amount,
                    purchaseDate,
                    invoice.getDueDate(),
                    desc,
                    null, // Compras no cartão não debitam conta corrente imediatamente
                    null,
                    categoryId,
                    notes
            );

            transactionRepository.save(transaction);
            installmentInfos.add(new CreditCardPurchaseResult.InstallmentInfo(
                    installmentNumber,
                    amount,
                    invoiceMonth,
                    invoice.getId()
            ));
        }

        return new CreditCardPurchaseResult(
                parentPurchaseId,
                description,
                totalAmount,
                installmentsCount,
                installmentInfos
        );
    }

    private CreditCardInvoice getOrCreateInvoice(UUID cardId, int closingDay, int dueDay, LocalDate invoiceMonth) {
        return invoiceRepository.findByCreditCardIdAndReferenceMonth(cardId, invoiceMonth)
                .orElseGet(() -> {
                    int lastDayOfMonth = invoiceMonth.lengthOfMonth();
                    int effectiveClosing = Math.min(closingDay, lastDayOfMonth);
                    LocalDate closingDate = invoiceMonth.withDayOfMonth(effectiveClosing);

                    // Se dueDay < closingDay, o vencimento é no mês seguinte
                    LocalDate dueDate;
                    if (dueDay < closingDay) {
                        LocalDate nextMonth = invoiceMonth.plusMonths(1);
                        int effectiveDue = Math.min(dueDay, nextMonth.lengthOfMonth());
                        dueDate = nextMonth.withDayOfMonth(effectiveDue);
                    } else {
                        int effectiveDue = Math.min(dueDay, lastDayOfMonth);
                        dueDate = invoiceMonth.withDayOfMonth(effectiveDue);
                    }

                    var newInvoice = CreditCardInvoice.create(cardId, invoiceMonth, closingDate, dueDate);
                    return invoiceRepository.save(newInvoice);
                });
    }
}
