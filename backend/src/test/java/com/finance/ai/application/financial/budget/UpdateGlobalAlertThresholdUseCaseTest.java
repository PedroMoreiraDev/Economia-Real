package com.finance.ai.application.financial.budget;

import com.finance.ai.domain.financial.budget.Budget;
import com.finance.ai.domain.financial.budget.BudgetRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes de Unidade: UpdateGlobalAlertThresholdUseCase")
class UpdateGlobalAlertThresholdUseCaseTest {

    @Mock
    private BudgetRepository budgetRepository;

    @InjectMocks
    private UpdateGlobalAlertThresholdUseCase useCase;

    @Test
    @DisplayName("Deve atualizar o percentual de alerta de todas as categorias do mês especificado")
    void deveAtualizarPercentualAlertaDeTodasCategorias() {
        UUID userId = UUID.randomUUID();
        LocalDate month = LocalDate.of(2026, 10, 1);

        Budget b1 = Budget.create(userId, UUID.randomUUID(), month, new BigDecimal("1000.00"), 80);
        Budget b2 = Budget.create(userId, UUID.randomUUID(), month, new BigDecimal("2000.00"), 80);

        when(budgetRepository.findAllByUserIdAndMonthReference(eq(userId), eq(month)))
                .thenReturn(List.of(b1, b2));
        when(budgetRepository.save(any(Budget.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        List<Budget> result = useCase.execute(userId, month, 90);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getAlertThresholdPercentage()).isEqualTo(90);
        assertThat(result.get(1).getAlertThresholdPercentage()).isEqualTo(90);

        verify(budgetRepository, times(2)).save(any(Budget.class));
    }
}
