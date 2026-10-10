package com.finance.ai.application.financial.recurring;

import com.finance.ai.domain.financial.recurring.RecurringBillRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class DeleteRecurringBillUseCase {

    private final RecurringBillRepository recurringBillRepository;

    public DeleteRecurringBillUseCase(RecurringBillRepository recurringBillRepository) {
        this.recurringBillRepository = recurringBillRepository;
    }

    @Transactional
    public void execute(UUID authenticatedUserId, UUID billId) {
        var existing = recurringBillRepository.findByIdAndUserId(billId, authenticatedUserId)
                .orElseThrow(() -> new IllegalArgumentException("Despesa recorrente não encontrada ou não pertence ao usuário."));

        recurringBillRepository.deleteByIdAndUserId(existing.getId(), authenticatedUserId);
    }
}
