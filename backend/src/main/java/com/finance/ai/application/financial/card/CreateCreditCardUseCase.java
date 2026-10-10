package com.finance.ai.application.financial.card;

import com.finance.ai.domain.financial.card.CreditCard;
import com.finance.ai.domain.financial.card.CreditCardRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
public class CreateCreditCardUseCase {

    private final CreditCardRepository creditCardRepository;

    public CreateCreditCardUseCase(CreditCardRepository creditCardRepository) {
        this.creditCardRepository = creditCardRepository;
    }

    @Transactional
    public CreditCard execute(UUID userId, String name, BigDecimal creditLimit, int closingDay, int dueDay) {
        var card = CreditCard.create(userId, name, creditLimit, closingDay, dueDay);
        return creditCardRepository.save(card);
    }
}
