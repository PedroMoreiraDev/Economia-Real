package com.finance.ai.application.ai;

import com.finance.ai.domain.ai.AiExtractionPort;
import com.finance.ai.domain.ai.ExtractedTransaction;
import com.finance.ai.domain.financial.Category;
import com.finance.ai.domain.financial.CategoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

/**
 * Caso de uso para extração estruturada de transação financeira a partir de texto em linguagem natural.
 */
@Service
public class ExtractTransactionFromTextUseCase {

    private final AiExtractionPort aiExtractionPort;
    private final CategoryRepository categoryRepository;

    public ExtractTransactionFromTextUseCase(AiExtractionPort aiExtractionPort,
                                            CategoryRepository categoryRepository) {
        this.aiExtractionPort = aiExtractionPort;
        this.categoryRepository = categoryRepository;
    }

    public ExtractedTransaction execute(UUID userId, String naturalText) {
        if (naturalText == null || naturalText.isBlank()) {
            throw new IllegalArgumentException("O texto para análise não pode estar vazio.");
        }

        List<Category> userCategories = categoryRepository.findAllByUserIdOrSystemDefault(userId);
        List<String> categoryNames = userCategories.stream()
                .map(Category::getName)
                .toList();

        ExtractedTransaction extracted = aiExtractionPort.extractFromText(naturalText, categoryNames);

        // Associar o UUID da categoria se houver correspondência exata ou aproximada
        String categoryName = extracted.suggestedCategoryName();
        if (categoryName != null) {
            String lowerCatName = categoryName.toLowerCase();
            UUID matchedId = userCategories.stream()
                    .filter(c -> c.getName().equalsIgnoreCase(categoryName)
                            || lowerCatName.contains(c.getName().toLowerCase()))
                    .map(Category::getId)
                    .findFirst()
                    .orElse(null);

            if (matchedId != null) {
                extracted = extracted.withCategoryId(matchedId);
            }
        }

        return extracted;
    }
}
