package com.finance.ai.domain.financial.card;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CreditCardRepository {
    List<CreditCard> findAllByUserId(UUID userId);
    Optional<CreditCard> findByIdAndUserId(UUID id, UUID userId);
    CreditCard save(CreditCard creditCard);
}
