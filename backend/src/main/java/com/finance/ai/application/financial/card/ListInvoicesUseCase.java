package com.finance.ai.application.financial.card;

import com.finance.ai.domain.financial.card.CreditCardInvoice;
import com.finance.ai.domain.financial.card.CreditCardInvoiceRepository;
import com.finance.ai.domain.financial.card.CreditCardRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ListInvoicesUseCase {

    private final CreditCardRepository creditCardRepository;
    private final CreditCardInvoiceRepository invoiceRepository;

    public ListInvoicesUseCase(CreditCardRepository creditCardRepository,
                               CreditCardInvoiceRepository invoiceRepository) {
        this.creditCardRepository = creditCardRepository;
        this.invoiceRepository = invoiceRepository;
    }

    @Transactional(readOnly = true)
    public List<CreditCardInvoice> execute(UUID userId, UUID creditCardId) {
        creditCardRepository.findByIdAndUserId(creditCardId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Cartão de crédito não encontrado ou não pertence ao usuário."));

        return invoiceRepository.findAllByCreditCardId(creditCardId);
    }
}
