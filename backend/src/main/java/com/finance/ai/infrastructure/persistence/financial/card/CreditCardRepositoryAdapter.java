package com.finance.ai.infrastructure.persistence.financial.card;

import com.finance.ai.domain.financial.card.CreditCard;
import com.finance.ai.domain.financial.card.CreditCardRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
class CreditCardRepositoryAdapter implements CreditCardRepository {

    private final CreditCardSpringDataRepository jpa;

    CreditCardRepositoryAdapter(CreditCardSpringDataRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public List<CreditCard> findAllByUserId(UUID userId) {
        return jpa.findAllByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public Optional<CreditCard> findByIdAndUserId(UUID id, UUID userId) {
        return jpa.findByIdAndUserId(id, userId).map(this::toDomain);
    }

    @Override
    public CreditCard save(CreditCard card) {
        var entity = toJpaEntity(card);
        var saved = jpa.save(entity);
        return toDomain(saved);
    }

    private CreditCard toDomain(CreditCardJpaEntity e) {
        return new CreditCard(
                e.getId(),
                e.getUserId(),
                e.getName(),
                e.getCreditLimit(),
                e.getClosingDay(),
                e.getDueDay(),
                e.isActive(),
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }

    private CreditCardJpaEntity toJpaEntity(CreditCard c) {
        return new CreditCardJpaEntity(
                c.getId(),
                c.getUserId(),
                c.getName(),
                c.getCreditLimit(),
                c.getClosingDay(),
                c.getDueDay(),
                c.isActive(),
                c.getCreatedAt(),
                c.getUpdatedAt()
        );
    }
}
