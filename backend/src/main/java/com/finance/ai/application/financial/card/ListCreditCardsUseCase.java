package com.finance.ai.application.financial.card;

import com.finance.ai.domain.financial.card.CreditCard;
import com.finance.ai.domain.financial.card.CreditCardRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ListCreditCardsUseCase {

    private final CreditCardRepository creditCardRepository;

    public ListCreditCardsUseCase(CreditCardRepository creditCardRepository) {
        this.creditCardRepository = creditCardRepository;
    }

    @Transactional(readOnly = true)
    public List<CreditCard> execute(UUID userId) {
        return creditCardRepository.findAllByUserId(userId);
    }
}
