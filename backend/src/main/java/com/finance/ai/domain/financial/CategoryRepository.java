package com.finance.ai.domain.financial;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoryRepository {
    List<Category> findAllByUserIdOrSystemDefault(UUID userId);
    Optional<Category> findByIdAndUserId(UUID id, UUID userId);
    Category save(Category category);
}
