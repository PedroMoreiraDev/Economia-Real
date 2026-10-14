package com.finance.ai.application.financial.recurring;

import com.finance.ai.domain.financial.TransactionRepository;
import com.finance.ai.domain.financial.recurring.RecurringBillRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class DeleteRecurringBillUseCase {

    private final RecurringBillRepository recurringBillRepository;
    private final TransactionRepository transactionRepository;

    public DeleteRecurringBillUseCase(RecurringBillRepository recurringBillRepository,
                                      TransactionRepository transactionRepository) {
        this.recurringBillRepository = recurringBillRepository;
        this.transactionRepository = transactionRepository;
    }

    @Transactional
    public void execute(UUID authenticatedUserId, UUID billId) {
        var existing = recurringBillRepository.findByIdAndUserId(billId, authenticatedUserId)
                .orElseThrow(() -> new IllegalArgumentException("Despesa recorrente não encontrada ou não pertence ao usuário."));

        // Remove todas as movimentações geradas por esta despesa fixa no extrato (mês atual e meses futuros)
        String prefix = "RECURRING_BILL:" + existing.getId();
        transactionRepository.deleteAllByUserIdAndNotesStartingWith(authenticatedUserId, prefix);

        // Remove o registro da despesa fixa
        recurringBillRepository.deleteByIdAndUserId(existing.getId(), authenticatedUserId);
    }
}
