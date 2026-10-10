package com.finance.ai.application.financial;

import com.finance.ai.domain.financial.Category;
import com.finance.ai.domain.financial.CategoryRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes Unitários: DefaultCategorySeeder")
class DefaultCategorySeederTest {

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private DefaultCategorySeeder defaultCategorySeeder;

    @Test
    @DisplayName("Deve semear categorias padrão do sistema vinculadas ao usuário")
    void shouldSeedDefaultCategoriesSuccessfully() {
        UUID userId = UUID.randomUUID();
        when(categoryRepository.findAllByUserIdOrSystemDefault(userId)).thenReturn(List.of());
        when(categoryRepository.save(any(Category.class))).thenAnswer(inv -> inv.getArgument(0));

        List<Category> seeded = defaultCategorySeeder.seedDefaultsForUser(userId);

        assertThat(seeded).isNotEmpty();
        assertThat(seeded).hasSize(DefaultCategorySeeder.DEFAULT_CATEGORIES.size());

        ArgumentCaptor<Category> captor = ArgumentCaptor.forClass(Category.class);
        verify(categoryRepository, times(DefaultCategorySeeder.DEFAULT_CATEGORIES.size())).save(captor.capture());

        List<Category> capturedList = captor.getAllValues();
        assertThat(capturedList).allMatch(c -> c.getUserId().equals(userId));
        assertThat(capturedList).allMatch(Category::isSystemDefault);
        assertThat(capturedList).anyMatch(c -> c.getName().equals("Alimentação"));
        assertThat(capturedList).anyMatch(c -> c.getName().equals("Moradia"));
        assertThat(capturedList).anyMatch(c -> c.getName().equals("Transporte"));
        assertThat(capturedList).anyMatch(c -> c.getName().equals("Salário & Renda"));
    }
}
