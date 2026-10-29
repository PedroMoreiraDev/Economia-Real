package com.finance.ai.application.financial;

import com.finance.ai.domain.financial.CategoryRepository;
import com.finance.ai.domain.financial.Transaction;
import com.finance.ai.domain.financial.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Caso de uso para atualização de categoria em lote de múltiplas transações.
 * Garante estritamente o isolamento de dados do usuário (anti-IDOR).
 */
@Service
public class BatchUpdateTransactionCategoryUseCase {

    private static final Logger log = LoggerFactory.getLogger(BatchUpdateTransactionCategoryUseCase.class);

    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;

    public BatchUpdateTransactionCategoryUseCase(TransactionRepository transactionRepository,
                                                CategoryRepository categoryRepository) {
        this.transactionRepository = transactionRepository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional
    public int execute(UUID userId, List<UUID> transactionIds, UUID categoryId) {
        if (userId == null) {
            throw new IllegalArgumentException("Identificador do usuário é obrigatório.");
        }
        if (transactionIds == null || transactionIds.isEmpty()) {
            return 0;
        }
        if (categoryId == null) {
            throw new IllegalArgumentException("Categoria de destino é obrigatória.");
        }

        // Valida se a categoria existe e pertence ao usuário ou é categoria canônica do sistema
        var accessibleCategories = categoryRepository.findAllByUserIdOrSystemDefault(userId);
        boolean categoryExists = accessibleCategories.stream()
                .anyMatch(c -> c.getId().equals(categoryId));

        if (!categoryExists) {
            throw new IllegalArgumentException("Categoria informada não existe ou não está acessível ao usuário.");
        }

        int updatedCount = 0;
        for (UUID txId : transactionIds) {
            var txOptional = transactionRepository.findByIdAndUserId(txId, userId);
            if (txOptional.isPresent()) {
                Transaction tx = txOptional.get();
                Transaction updatedTx = tx.withCategory(categoryId);
                transactionRepository.save(updatedTx);
                updatedCount++;
            }
        }

        log.info("Atualizadas {} transações com nova categoria {} para o usuário {}", updatedCount, categoryId, userId);
        return updatedCount;
    }
}
