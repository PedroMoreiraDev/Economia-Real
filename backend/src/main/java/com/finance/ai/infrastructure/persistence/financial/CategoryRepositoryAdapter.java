package com.finance.ai.infrastructure.persistence.financial;

import com.finance.ai.domain.financial.Category;
import com.finance.ai.domain.financial.CategoryRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
class CategoryRepositoryAdapter implements CategoryRepository {

    private final CategorySpringDataRepository jpa;

    CategoryRepositoryAdapter(CategorySpringDataRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public List<Category> findAllByUserIdOrSystemDefault(UUID userId) {
        return jpa.findAllByUserIdOrSystemDefault(userId)
                .stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public Optional<Category> findByIdAndUserId(UUID id, UUID userId) {
        return jpa.findByIdAndUserId(id, userId).map(this::toDomain);
    }

    @Override
    public Category save(Category category) {
        var entity = toJpaEntity(category);
        var saved = jpa.save(entity);
        return toDomain(saved);
    }

    private Category toDomain(CategoryJpaEntity e) {
        return new Category(
                e.getId(),
                e.getUserId(),
                e.getParentId(),
                e.getName(),
                e.getIcon(),
                e.getColorHex(),
                e.isSystemDefault(),
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }

    private CategoryJpaEntity toJpaEntity(Category c) {
        return new CategoryJpaEntity(
                c.getId(),
                c.getUserId(),
                c.getParentId(),
                c.getName(),
                c.getIcon(),
                c.getColorHex(),
                c.isSystemDefault(),
                c.getCreatedAt(),
                c.getUpdatedAt()
        );
    }
}
