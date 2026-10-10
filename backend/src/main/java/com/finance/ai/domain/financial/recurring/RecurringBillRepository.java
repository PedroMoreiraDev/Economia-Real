package com.finance.ai.domain.financial.recurring;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Porta de persistência de domínio para despesas e assinaturas recorrentes.
 */
public interface RecurringBillRepository {

    RecurringBill save(RecurringBill recurringBill);

    Optional<RecurringBill> findByIdAndUserId(UUID id, UUID userId);

    List<RecurringBill> findByUserId(UUID userId);

    List<RecurringBill> findByUserIdAndActive(UUID userId, boolean active);

    void deleteByIdAndUserId(UUID id, UUID userId);
}
