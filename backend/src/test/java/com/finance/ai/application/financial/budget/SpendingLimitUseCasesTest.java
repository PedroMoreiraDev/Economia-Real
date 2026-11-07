package com.finance.ai.application.financial.budget;

import com.finance.ai.domain.financial.budget.MonthlySpendingLimit;
import com.finance.ai.domain.financial.budget.MonthlySpendingLimitRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes Unitários: Use Cases de Teto Global de Gastos (Spending Limits)")
class SpendingLimitUseCasesTest {

    @Mock
    private MonthlySpendingLimitRepository repository;

    private GetSpendingLimitsTimelineUseCase getTimelineUseCase;
    private SaveSpendingLimitUseCase saveUseCase;
    private RemoveSpendingLimitUseCase removeUseCase;
    private SyncSpendingLimitsTimelineUseCase syncUseCase;

    private final UUID userId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        getTimelineUseCase = new GetSpendingLimitsTimelineUseCase(repository);
        saveUseCase = new SaveSpendingLimitUseCase(repository, getTimelineUseCase);
        removeUseCase = new RemoveSpendingLimitUseCase(repository, getTimelineUseCase);
        syncUseCase = new SyncSpendingLimitsTimelineUseCase(repository, getTimelineUseCase);
    }

    @Test
    @DisplayName("Deve salvar novo teto com precisão monetária de 2 casas decimais")
    void deveSalvarNovoTetoComSucesso() {
        LocalDate monthRef = LocalDate.of(2026, 11, 1);
        when(repository.findByUserIdAndMonthReference(userId, monthRef)).thenReturn(Optional.empty());

        MonthlySpendingLimit savedLimit = MonthlySpendingLimit.create(userId, monthRef, new BigDecimal("3100.00"));
        when(repository.findAllByUserId(userId)).thenReturn(List.of(savedLimit));

        Map<String, BigDecimal> result = saveUseCase.execute(userId, "2026-11", new BigDecimal("3100.00"));

        ArgumentCaptor<MonthlySpendingLimit> captor = ArgumentCaptor.forClass(MonthlySpendingLimit.class);
        verify(repository).save(captor.capture());

        MonthlySpendingLimit captured = captor.getValue();
        assertThat(captured.getUserId()).isEqualTo(userId);
        assertThat(captured.getMonthReference()).isEqualTo(monthRef);
        assertThat(captured.getAmount()).isEqualByComparingTo(new BigDecimal("3100.00"));

        assertThat(result).containsEntry("2026-11", new BigDecimal("3100.00"));
    }

    @Test
    @DisplayName("Deve atualizar teto existente mantendo integridade de arredondamento")
    void deveAtualizarTetoExistente() {
        LocalDate monthRef = LocalDate.of(2026, 11, 1);
        MonthlySpendingLimit existing = MonthlySpendingLimit.create(userId, monthRef, new BigDecimal("2500.00"));
        when(repository.findByUserIdAndMonthReference(userId, monthRef)).thenReturn(Optional.of(existing));

        MonthlySpendingLimit updatedLimit = existing.updateAmount(new BigDecimal("3100.50"));
        when(repository.findAllByUserId(userId)).thenReturn(List.of(updatedLimit));

        Map<String, BigDecimal> result = saveUseCase.execute(userId, "2026-11", new BigDecimal("3100.50"));

        ArgumentCaptor<MonthlySpendingLimit> captor = ArgumentCaptor.forClass(MonthlySpendingLimit.class);
        verify(repository).save(captor.capture());

        assertThat(captor.getValue().getAmount()).isEqualByComparingTo(new BigDecimal("3100.50"));
        assertThat(result).containsEntry("2026-11", new BigDecimal("3100.50"));
    }

    @Test
    @DisplayName("Deve remover teto marcando como zero para interromper herança histórica contábil")
    void deveRemoverTetoMarcandoZero() {
        LocalDate monthRef = LocalDate.of(2026, 11, 1);
        MonthlySpendingLimit existing = MonthlySpendingLimit.create(userId, monthRef, new BigDecimal("3100.00"));
        when(repository.findByUserIdAndMonthReference(userId, monthRef)).thenReturn(Optional.of(existing));

        MonthlySpendingLimit zeroed = existing.updateAmount(BigDecimal.ZERO);
        when(repository.findAllByUserId(userId)).thenReturn(List.of(zeroed));

        Map<String, BigDecimal> result = removeUseCase.execute(userId, "2026-11");

        ArgumentCaptor<MonthlySpendingLimit> captor = ArgumentCaptor.forClass(MonthlySpendingLimit.class);
        verify(repository).save(captor.capture());

        assertThat(captor.getValue().getAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(result.get("2026-11")).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("Deve sincronizar timeline do dispositivo salvando apenas entradas inexistentes")
    void deveSincronizarTimelineDoDispositivo() {
        LocalDate monthNov = LocalDate.of(2026, 11, 1);
        when(repository.findByUserIdAndMonthReference(userId, monthNov)).thenReturn(Optional.empty());

        MonthlySpendingLimit limitNov = MonthlySpendingLimit.create(userId, monthNov, new BigDecimal("3100.00"));
        when(repository.findAllByUserId(userId)).thenReturn(List.of(limitNov));

        Map<String, BigDecimal> deviceTimeline = Map.of("2026-11", new BigDecimal("3100.00"));
        Map<String, BigDecimal> result = syncUseCase.execute(userId, deviceTimeline);

        verify(repository, times(1)).save(any(MonthlySpendingLimit.class));
        assertThat(result).containsEntry("2026-11", new BigDecimal("3100.00"));
    }
}
