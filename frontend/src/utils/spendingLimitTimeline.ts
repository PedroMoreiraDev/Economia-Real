export interface SpendingLimitResolution {
  limit: number;
  isInherited: boolean;
  inheritedFromMonth?: string;
  isExplicitZero: boolean;
}

export type SpendingLimitsTimeline = Record<string, number>;

const STORAGE_PREFIX = 'economia_real_spending_limits_timeline_';
const LEGACY_KEY_PREFIX = 'economia_real_spending_limit_';

/**
 * Resolve o teto de gastos para o mês selecionado seguindo a linha do tempo histórica contábil:
 * 1. Se o mês selecionado possui uma definição explícita (inclusive 0 para removido), usa ela.
 * 2. Se não possuir, busca a definição mais recente cadastrada até o mês consultado (m <= selectedMonth).
 * 3. Se for anterior a qualquer definição já cadastrada, retorna 0 (sem meta definida no período).
 */
export function resolveTimelineLimit(
  timeline: Record<string, number>,
  selectedMonth: string
): SpendingLimitResolution {
  if (!timeline || Object.keys(timeline).length === 0) {
    return { limit: 0, isInherited: false, isExplicitZero: false };
  }

  // 1. Definição explícita no mês consultado
  if (Object.prototype.hasOwnProperty.call(timeline, selectedMonth)) {
    const val = timeline[selectedMonth] || 0;
    return {
      limit: val,
      isInherited: false,
      isExplicitZero: val === 0,
    };
  }

  // 2. Busca o mês mais recente anterior ou igual ao consultado (m <= selectedMonth)
  const pastMonths = Object.keys(timeline)
    .filter((m) => m <= selectedMonth)
    .sort((a, b) => b.localeCompare(a));

  if (pastMonths.length > 0) {
    const latestPastMonth = pastMonths[0];
    const val = timeline[latestPastMonth] || 0;
    return {
      limit: val,
      isInherited: true,
      inheritedFromMonth: latestPastMonth,
      isExplicitZero: val === 0,
    };
  }

  // 3. Meses anteriores à primeira definição histórica não herdam valores futuros
  return { limit: 0, isInherited: false, isExplicitZero: false };
}

export function getSpendingLimitsTimeline(userId: string): Record<string, number> {
  if (!userId) return {};
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (raw) {
      return JSON.parse(raw);
    }

    // Migração transparente de chave legada se existir
    const legacy = localStorage.getItem(`${LEGACY_KEY_PREFIX}${userId}`);
    if (legacy) {
      const parsed = parseFloat(legacy);
      if (!isNaN(parsed) && parsed > 0) {
        const currentMonth = new Date().toISOString().substring(0, 7);
        const migrated: Record<string, number> = { [currentMonth]: parsed };
        localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(migrated));
        localStorage.removeItem(`${LEGACY_KEY_PREFIX}${userId}`);
        return migrated;
      }
    }
  } catch (err) {
    console.error('Erro ao ler timeline de limites:', err);
  }
  return {};
}

export function saveSpendingLimitForMonth(
  userId: string,
  month: string,
  limit: number
): Record<string, number> {
  if (!userId) return {};
  const timeline = getSpendingLimitsTimeline(userId);
  timeline[month] = limit;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(timeline));
    localStorage.removeItem(`economia_real_spending_limit_disabled_${userId}`);
  } catch (err) {
    console.error('Erro ao salvar limite no timeline:', err);
  }
  return timeline;
}

export function removeSpendingLimitForMonth(
  userId: string,
  month: string
): Record<string, number> {
  if (!userId) return {};
  const timeline = getSpendingLimitsTimeline(userId);
  // Definir como 0 indica expressamente que a partir deste mês o teto manual foi desativado
  timeline[month] = 0;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(timeline));
  } catch (err) {
    console.error('Erro ao remover limite no timeline:', err);
  }
  return timeline;
}
