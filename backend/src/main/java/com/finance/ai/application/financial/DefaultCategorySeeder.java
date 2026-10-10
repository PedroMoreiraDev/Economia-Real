package com.finance.ai.application.financial;

import com.finance.ai.domain.financial.Category;
import com.finance.ai.domain.financial.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Serviço responsável por semear as categorias pré-definidas (padrão) para os usuários.
 */
@Service
public class DefaultCategorySeeder {

    private final CategoryRepository categoryRepository;

    public record DefaultCategoryDefinition(String name, String icon, String colorHex) {}

    public static final List<DefaultCategoryDefinition> DEFAULT_CATEGORIES = List.of(
            new DefaultCategoryDefinition("Alimentação", "utensils", "#EF4444"),
            new DefaultCategoryDefinition("Delivery", "bike", "#EA1D2C"),
            new DefaultCategoryDefinition("Aplicativo de Transporte", "car-taxi-front", "#F59E0B"),
            new DefaultCategoryDefinition("Moradia", "home", "#3B82F6"),
            new DefaultCategoryDefinition("Transporte", "car", "#0284C7"),
            new DefaultCategoryDefinition("Saúde", "heart-pulse", "#10B981"),
            new DefaultCategoryDefinition("Educação", "graduation-cap", "#8B5CF6"),
            new DefaultCategoryDefinition("Lazer", "gamepad-2", "#EC4899"),
            new DefaultCategoryDefinition("Compras", "shopping-bag", "#F97316"),
            new DefaultCategoryDefinition("Salário & Renda", "wallet", "#16A34A"),
            new DefaultCategoryDefinition("Investimentos", "trending-up", "#6366F1"),
            new DefaultCategoryDefinition("Serviços & Contas", "receipt", "#06B6D4"),
            new DefaultCategoryDefinition("Outros", "tag", "#64748B")
    );

    public DefaultCategorySeeder(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Transactional
    public List<Category> seedDefaultsForUser(UUID userId) {
        var existing = categoryRepository.findAllByUserIdOrSystemDefault(userId);
        java.util.Set<String> existingNames = existing.stream()
                .map(c -> c.getName().trim().toLowerCase())
                .collect(java.util.stream.Collectors.toSet());

        List<Category> savedList = new ArrayList<>(existing);
        for (DefaultCategoryDefinition def : DEFAULT_CATEGORIES) {
            if (!existingNames.contains(def.name().trim().toLowerCase())) {
                Category category = Category.createSystemDefault(userId, def.name(), def.icon(), def.colorHex());
                savedList.add(categoryRepository.save(category));
                existingNames.add(def.name().trim().toLowerCase());
            }
        }
        return savedList;
    }
}
