package com.finance.ai.application.financial;

import com.finance.ai.domain.financial.Category;
import com.finance.ai.domain.financial.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class CreateCategoryUseCase {

    private final CategoryRepository categoryRepository;

    public CreateCategoryUseCase(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Transactional
    public Category execute(UUID userId, String name, String icon, String colorHex) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Nome da categoria não pode ser vazio.");
        }
        String trimmed = name.trim();
        var existing = categoryRepository.findAllByUserIdOrSystemDefault(userId);
        for (var cat : existing) {
            if (cat.getName().equalsIgnoreCase(trimmed)) {
                return cat;
            }
        }
        var category = Category.create(userId, trimmed, icon != null && !icon.isBlank() ? icon : "tag", colorHex != null && !colorHex.isBlank() ? colorHex : "#3B82F6");
        return categoryRepository.save(category);
    }
}
