package com.finance.ai.application.financial;

import com.finance.ai.domain.financial.Category;
import com.finance.ai.domain.financial.CategoryRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes Unitários: CreateCategoryUseCase")
class CreateCategoryUseCaseTest {

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private CreateCategoryUseCase createCategoryUseCase;

    @Test
    @DisplayName("Deve criar categoria personalizada para o usuário com sucesso")
    void shouldCreateCustomCategorySuccessfully() {
        UUID userId = UUID.randomUUID();
        String name = "Cursos Online";
        String icon = "book";
        String colorHex = "#8B5CF6";

        when(categoryRepository.findAllByUserIdOrSystemDefault(userId)).thenReturn(java.util.List.of());
        when(categoryRepository.save(any(Category.class))).thenAnswer(inv -> inv.getArgument(0));

        Category created = createCategoryUseCase.execute(userId, name, icon, colorHex);

        assertThat(created).isNotNull();
        assertThat(created.getUserId()).isEqualTo(userId);
        assertThat(created.getName()).isEqualTo(name);
        assertThat(created.getIcon()).isEqualTo(icon);
        assertThat(created.getColorHex()).isEqualTo(colorHex);
        assertThat(created.isSystemDefault()).isFalse();

        verify(categoryRepository).save(any(Category.class));
    }

    @Test
    @DisplayName("Deve reaproveitar categoria existente sem duplicar se o nome coincidir")
    void shouldReuseExistingCategoryWhenNameMatches() {
        UUID userId = UUID.randomUUID();
        Category existingCat = Category.createSystemDefault(userId, "Alimentação", "utensils", "#EF4444");

        when(categoryRepository.findAllByUserIdOrSystemDefault(userId)).thenReturn(java.util.List.of(existingCat));

        Category result = createCategoryUseCase.execute(userId, "alimentação", "tag", "#000000");

        assertThat(result.getId()).isEqualTo(existingCat.getId());
        assertThat(result.getName()).isEqualTo("Alimentação");
        verify(categoryRepository, never()).save(any(Category.class));
    }
}
