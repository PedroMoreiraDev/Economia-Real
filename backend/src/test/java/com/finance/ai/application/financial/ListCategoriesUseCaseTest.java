package com.finance.ai.application.financial;

import com.finance.ai.domain.financial.Category;
import com.finance.ai.domain.financial.CategoryRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes Unitários: ListCategoriesUseCase")
class ListCategoriesUseCaseTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private DefaultCategorySeeder defaultCategorySeeder;

    @InjectMocks
    private ListCategoriesUseCase listCategoriesUseCase;

    @Test
    @DisplayName("Deve retornar categorias existentes do usuário se já existirem")
    void shouldReturnExistingCategoriesWhenNotEmpty() {
        UUID userId = UUID.randomUUID();
        Category existingCategory = Category.create(userId, "Alimentação", "utensils", "#EF4444");

        when(categoryRepository.findAllByUserIdOrSystemDefault(userId)).thenReturn(List.of(existingCategory));

        List<Category> result = listCategoriesUseCase.execute(userId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Alimentação");
        verify(categoryRepository).findAllByUserIdOrSystemDefault(userId);
        verifyNoInteractions(defaultCategorySeeder);
    }

    @Test
    @DisplayName("Deve semear e retornar categorias padrão se o usuário ainda não tiver nenhuma")
    void shouldSeedDefaultCategoriesWhenEmpty() {
        UUID userId = UUID.randomUUID();
        Category seededCategory = Category.createSystemDefault(userId, "Alimentação", "utensils", "#EF4444");

        when(categoryRepository.findAllByUserIdOrSystemDefault(userId)).thenReturn(List.of());
        when(defaultCategorySeeder.seedDefaultsForUser(userId)).thenReturn(List.of(seededCategory));

        List<Category> result = listCategoriesUseCase.execute(userId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Alimentação");
        verify(defaultCategorySeeder).seedDefaultsForUser(userId);
    }
}
