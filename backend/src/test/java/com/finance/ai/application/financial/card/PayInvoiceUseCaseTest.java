package com.finance.ai.application.financial.card;

import com.finance.ai.domain.financial.Account;
import com.finance.ai.domain.financial.AccountRepository;
import com.finance.ai.domain.financial.AccountType;
import com.finance.ai.domain.financial.Transaction;
import com.finance.ai.domain.financial.TransactionRepository;
import com.finance.ai.domain.financial.TransactionType;
import com.finance.ai.domain.financial.card.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes de Caso de Uso: PayInvoiceUseCase (Anti-Dupla Contagem)")
class PayInvoiceUseCaseTest {

    @Mock
    private CreditCardInvoiceRepository invoiceRepository;

    @Mock
    private CreditCardRepository creditCardRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @InjectMocks
    private PayInvoiceUseCase payInvoiceUseCase;

    @Test
    @DisplayName("Deve registrar pagamento da fatura com tipo INVOICE_PAYMENT e liquidar passivo sem dupla contagem")
    void shouldPayInvoiceAndCreateInvoicePaymentTransaction() {
        UUID userId = UUID.randomUUID();
        UUID cardId = UUID.randomUUID();
        UUID invoiceId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();

        var card = new CreditCard(cardId, userId, "Cartão Master", new BigDecimal("5000.00"), 10, 20, true, java.time.Instant.now(), java.time.Instant.now());
        var invoice = CreditCardInvoice.create(cardId, LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 10), LocalDate.of(2026, 10, 20));
        var account = Account.create(userId, "Nubank Corrente", AccountType.CHECKING, new BigDecimal("3000.00"));

        when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));
        when(creditCardRepository.findByIdAndUserId(cardId, userId)).thenReturn(Optional.of(card));
        when(accountRepository.findByIdAndUserId(accountId, userId)).thenReturn(Optional.of(account));
        when(invoiceRepository.save(any(CreditCardInvoice.class))).thenAnswer(inv -> inv.getArgument(0));

        var paymentAmount = new BigDecimal("850.50");
        var result = payInvoiceUseCase.execute(userId, invoiceId, accountId, paymentAmount, LocalDate.of(2026, 10, 15));

        assertThat(result.getStatus()).isEqualTo(InvoiceStatus.PAID);
        assertThat(result.getPaidAmount()).isEqualByComparingTo(paymentAmount);

        // Verifica transação gerada
        var captor = ArgumentCaptor.forClass(Transaction.class);
        verify(transactionRepository).save(captor.capture());
        var savedTx = captor.getValue();

        // INVARIANTE: tipo DEVE ser INVOICE_PAYMENT (não despesa de consumo!)
        assertThat(savedTx.getType()).isEqualTo(TransactionType.INVOICE_PAYMENT);
        assertThat(savedTx.getAmount()).isEqualByComparingTo(paymentAmount);
        assertThat(savedTx.getAccountId()).isEqualTo(account.getId());
        assertThat(savedTx.getDestinationAccountId()).isNull();
    }
}
