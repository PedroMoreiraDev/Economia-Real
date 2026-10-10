package com.finance.ai.application.financial.card;

import com.finance.ai.domain.financial.AccountRepository;
import com.finance.ai.domain.financial.Transaction;
import com.finance.ai.domain.financial.TransactionRepository;
import com.finance.ai.domain.financial.TransactionType;
import com.finance.ai.domain.financial.card.CreditCardInvoice;
import com.finance.ai.domain.financial.card.CreditCardInvoiceRepository;
import com.finance.ai.domain.financial.card.CreditCardRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Service
public class PayInvoiceUseCase {

    private final CreditCardInvoiceRepository invoiceRepository;
    private final CreditCardRepository creditCardRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;

    public PayInvoiceUseCase(CreditCardInvoiceRepository invoiceRepository,
                             CreditCardRepository creditCardRepository,
                             AccountRepository accountRepository,
                             TransactionRepository transactionRepository) {
        this.invoiceRepository = invoiceRepository;
        this.creditCardRepository = creditCardRepository;
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
    }

    @Transactional
    public CreditCardInvoice execute(UUID userId, UUID invoiceId, UUID accountId,
                                     BigDecimal paymentAmount, LocalDate paymentDate) {

        var invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Fatura não encontrada."));

        var card = creditCardRepository.findByIdAndUserId(invoice.getCreditCardId(), userId)
                .orElseThrow(() -> new IllegalArgumentException("Cartão da fatura não pertence ao usuário."));

        var account = accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Conta de pagamento não encontrada ou não pertence ao usuário."));

        // Registra o pagamento na fatura
        invoice.registerPayment(paymentAmount, Instant.now());
        var updatedInvoice = invoiceRepository.save(invoice);

        // Registro de liquidação de passivo (INVOICE_PAYMENT)
        // ATENÇÃO: INVOICE_PAYMENT não é despesa de consumo primário, prevenindo dupla contagem!
        var paymentTransaction = Transaction.create(
                userId,
                TransactionType.INVOICE_PAYMENT,
                paymentAmount,
                paymentDate != null ? paymentDate : LocalDate.now(),
                paymentDate != null ? paymentDate : LocalDate.now(),
                String.format("Pagamento Fatura %s - Ref. %s", card.getName(), invoice.getReferenceMonth()),
                account.getId(),
                null,
                null,
                "Liquidação de fatura de cartão de crédito"
        );

        transactionRepository.save(paymentTransaction);

        return updatedInvoice;
    }
}
