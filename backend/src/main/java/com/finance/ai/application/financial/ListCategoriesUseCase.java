package com.finance.ai.application.financial;

import com.finance.ai.domain.financial.Category;
import com.finance.ai.domain.financial.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ListCategoriesUseCase {

    private final CategoryRepository categoryRepository;
    private final DefaultCategorySeeder defaultCategorySeeder;

    public ListCategoriesUseCase(CategoryRepository categoryRepository,
                                 DefaultCategorySeeder defaultCategorySeeder) {
        this.categoryRepository = categoryRepository;
        this.defaultCategorySeeder = defaultCategorySeeder;
    }

    @Transactional
    public List<Category> execute(UUID userId) {
        var existing = categoryRepository.findAllByUserIdOrSystemDefault(userId);
        if (existing.isEmpty()) {
            return defaultCategorySeeder.seedDefaultsForUser(userId);
        }
        return existing;
    }
}
