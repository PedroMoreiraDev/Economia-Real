import React, { useState, useEffect } from 'react';
import { Sparkles, X, Check, AlertCircle, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAiBudgetSuggestionsApi, saveBatchBudgetsApi, getStoredGlobalAlertThreshold } from '../services/budgetApi';
import { AiBudgetSuggestionResponse, CategoryBudgetSuggestion, CreateBudgetPayload, BudgetProgressDto } from '../types/budget';

interface AiBudgetSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGlobalLimit?: number;
  existingBudgets?: BudgetProgressDto[];
  onApplied: (newGlobalLimit?: number) => void;
  monthReference?: string;
}

function formatBRL(val: number | undefined): string {
  if (val === undefined || isNaN(val)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

/**
 * Rebalanceia proporcionalmente apenas as categorias AUTOMÁTICAS (não personalizadas).
 * As categorias fixadas pelo usuário mantêm seus valores intactos.
 */
function rebalanceCategoryBudgetsWithLocks(
  suggestions: CategoryBudgetSuggestion[],
  targetTotal: number,
  changedCategoryId: string,
  newVal: number,
  lockedCategoryIds: Set<string>
): CategoryBudgetSuggestion[] {
  if (suggestions.length === 0 || targetTotal <= 0) {
    return suggestions;
  }

  const updated = suggestions.map((item) => ({ ...item }));
  const changedIndex = updated.findIndex((item) => item.categoryId === changedCategoryId);
  if (changedIndex === -1) {
    return suggestions;
  }

  const changedItem = updated[changedIndex];

  // Índices das outras categorias que também estão personalizadas (locked)
  const otherLockedIndices: number[] = [];
  // Índices das categorias automáticas (não locked)
  const automaticIndices: number[] = [];

  updated.forEach((item, idx) => {
    if (idx === changedIndex) return;
    if (lockedCategoryIds.has(item.categoryId)) {
      otherLockedIndices.push(idx);
    } else {
      automaticIndices.push(idx);
    }
  });

  const otherLockedSum = otherLockedIndices.reduce(
    (acc, idx) => acc + (updated[idx].suggestedLimit || 0),
    0
  );

  // Valor máximo permitido para a categoria em edição (não pode estourar targetTotal junto com as outras fixadas)
  const maxAllowedForChanged = Math.max(0, targetTotal - otherLockedSum);
  const clampedVal = Math.max(0, Math.min(newVal, maxAllowedForChanged));

  // Atualiza a categoria em edição
  updated[changedIndex] = {
    ...changedItem,
    suggestedLimit: clampedVal,
    percentageOfTotal: targetTotal > 0 ? Math.round((clampedVal / targetTotal) * 100) : 0,
  };

  // As outras categorias personalizadas mantêm seus valores rigorosamente intocados
  for (const idx of otherLockedIndices) {
    const val = updated[idx].suggestedLimit || 0;
    updated[idx] = {
      ...updated[idx],
      percentageOfTotal: targetTotal > 0 ? Math.round((val / targetTotal) * 100) : 0,
    };
  }

  // Saldo restante que deve ser absorvido exclusivamente pelas categorias automáticas
  const remainingForAutomatic = Math.max(0, targetTotal - (clampedVal + otherLockedSum));

  if (automaticIndices.length === 0) {
    // Todas as categorias estão personalizadas
    return updated;
  }

  if (remainingForAutomatic === 0) {
    for (const idx of automaticIndices) {
      updated[idx] = {
        ...updated[idx],
        suggestedLimit: 0,
        percentageOfTotal: 0,
      };
    }
    return updated;
  }

  // Soma anterior das categorias automáticas
  const currentAutomaticSum = automaticIndices.reduce(
    (acc, idx) => acc + (updated[idx].suggestedLimit || 0),
    0
  );

  let distributedSum = 0;
  for (const idx of automaticIndices) {
    let allocated = 0;
    if (currentAutomaticSum > 0) {
      const proportion = (updated[idx].suggestedLimit || 0) / currentAutomaticSum;
      allocated = Math.round(proportion * remainingForAutomatic * 100) / 100;
    } else {
      allocated = Math.round((remainingForAutomatic / automaticIndices.length) * 100) / 100;
    }

    updated[idx] = {
      ...updated[idx],
      suggestedLimit: allocated,
      percentageOfTotal: targetTotal > 0 ? Math.round((allocated / targetTotal) * 100) : 0,
    };
    distributedSum += allocated;
  }

  // Ajuste fino de resíduo de centavos
  const diff = Math.round((remainingForAutomatic - distributedSum) * 100) / 100;
  if (Math.abs(diff) > 0.0001 && automaticIndices.length > 0) {
    let targetIdx = automaticIndices[0];
    for (const idx of automaticIndices) {
      if ((updated[idx].suggestedLimit || 0) > (updated[targetIdx].suggestedLimit || 0)) {
        targetIdx = idx;
      }
    }
    const adjusted = Math.max(0, Math.round(((updated[targetIdx].suggestedLimit || 0) + diff) * 100) / 100);
    updated[targetIdx] = {
      ...updated[targetIdx],
      suggestedLimit: adjusted,
      percentageOfTotal: targetTotal > 0 ? Math.round((adjusted / targetTotal) * 100) : 0,
    };
  }

  return updated;
}

/**
 * Remove a trava de uma categoria e redistribui o saldo restante entre as automáticas
 */
function resetCategoryToAutomatic(
  suggestions: CategoryBudgetSuggestion[],
  targetTotal: number,
  remainingLockedIds: Set<string>
): CategoryBudgetSuggestion[] {
  const otherLockedIndices: number[] = [];
  const automaticIndices: number[] = [];

  suggestions.forEach((item, idx) => {
    if (remainingLockedIds.has(item.categoryId)) {
      otherLockedIndices.push(idx);
    } else {
      automaticIndices.push(idx);
    }
  });

  const lockedSum = otherLockedIndices.reduce(
    (acc, idx) => acc + (suggestions[idx].suggestedLimit || 0),
    0
  );

  const remainingForAutomatic = Math.max(0, targetTotal - lockedSum);
  const updated = suggestions.map((item) => ({ ...item }));

  if (automaticIndices.length === 0) return updated;

  const currentAutomaticSum = automaticIndices.reduce(
    (acc, idx) => acc + (updated[idx].suggestedLimit || 0),
    0
  );

  let distributedSum = 0;
  for (const idx of automaticIndices) {
    let allocated = 0;
    if (currentAutomaticSum > 0) {
      const proportion = (updated[idx].suggestedLimit || 0) / currentAutomaticSum;
      allocated = Math.round(proportion * remainingForAutomatic * 100) / 100;
    } else {
      allocated = Math.round((remainingForAutomatic / automaticIndices.length) * 100) / 100;
    }
    updated[idx] = {
      ...updated[idx],
      suggestedLimit: allocated,
      percentageOfTotal: targetTotal > 0 ? Math.round((allocated / targetTotal) * 100) : 0,
    };
    distributedSum += allocated;
  }

  const diff = Math.round((remainingForAutomatic - distributedSum) * 100) / 100;
  if (Math.abs(diff) > 0.0001 && automaticIndices.length > 0) {
    let targetIdx = automaticIndices[0];
    for (const idx of automaticIndices) {
      if ((updated[idx].suggestedLimit || 0) > (updated[targetIdx].suggestedLimit || 0)) {
        targetIdx = idx;
      }
    }
    const adjusted = Math.max(0, Math.round(((updated[targetIdx].suggestedLimit || 0) + diff) * 100) / 100);
    updated[targetIdx] = {
      ...updated[targetIdx],
      suggestedLimit: adjusted,
      percentageOfTotal: targetTotal > 0 ? Math.round((adjusted / targetTotal) * 100) : 0,
    };
  }

  return updated;
}

/**
 * Aplica os valores fixados/personalizados sobre uma lista de sugestões da IA
 * e redistribui proporcionalmente o saldo restante entre as categorias automáticas.
 */
function applyLockedCategoriesAndRebalance(
  baseSuggestions: CategoryBudgetSuggestion[],
  targetTotal: number,
  lockedCategoryIds: Set<string>,
  customLimitsMap: Map<string, number>,
  existingBudgets?: BudgetProgressDto[]
): CategoryBudgetSuggestion[] {
  if (baseSuggestions.length === 0 || targetTotal <= 0) return baseSuggestions;

  const updated: CategoryBudgetSuggestion[] = baseSuggestions.map((item) => {
    if (lockedCategoryIds.has(item.categoryId)) {
      let customVal = customLimitsMap.get(item.categoryId);
      if ((customVal === undefined || isNaN(customVal) || customVal <= 0) && existingBudgets) {
        const found = existingBudgets.find((b) => b.categoryId === item.categoryId);
        if (found && found.monthlyLimit > 0) {
          customVal = found.monthlyLimit;
        }
      }
      if (customVal === undefined || isNaN(customVal) || customVal <= 0) {
        customVal = item.suggestedLimit || 0;
      }
      if (customVal > targetTotal) {
        customVal = targetTotal;
      }
      return {
        ...item,
        suggestedLimit: customVal,
        percentageOfTotal: targetTotal > 0 ? Math.round((customVal / targetTotal) * 100) : 0,
      };
    }
    return { ...item };
  });

  const lockedIndices: number[] = [];
  const automaticIndices: number[] = [];

  updated.forEach((item, idx) => {
    if (lockedCategoryIds.has(item.categoryId)) {
      lockedIndices.push(idx);
    } else {
      automaticIndices.push(idx);
    }
  });

  const lockedSum = lockedIndices.reduce(
    (acc, idx) => acc + (updated[idx].suggestedLimit || 0),
    0
  );

  const remainingForAutomatic = Math.max(0, targetTotal - lockedSum);

  if (automaticIndices.length === 0) return updated;

  if (remainingForAutomatic === 0) {
    for (const idx of automaticIndices) {
      updated[idx] = {
        ...updated[idx],
        suggestedLimit: 0,
        percentageOfTotal: 0,
      };
    }
    return updated;
  }

  const currentAutomaticSum = automaticIndices.reduce(
    (acc, idx) => acc + (updated[idx].suggestedLimit || 0),
    0
  );

  let distributedSum = 0;
  for (const idx of automaticIndices) {
    let allocated = 0;
    if (currentAutomaticSum > 0) {
      const proportion = (updated[idx].suggestedLimit || 0) / currentAutomaticSum;
      allocated = Math.round(proportion * remainingForAutomatic * 100) / 100;
    } else {
      allocated = Math.round((remainingForAutomatic / automaticIndices.length) * 100) / 100;
    }
    updated[idx] = {
      ...updated[idx],
      suggestedLimit: allocated,
      percentageOfTotal: targetTotal > 0 ? Math.round((allocated / targetTotal) * 100) : 0,
    };
    distributedSum += allocated;
  }

  // Ajuste do resíduo de centavos
  const diff = Math.round((remainingForAutomatic - distributedSum) * 100) / 100;
  if (Math.abs(diff) > 0.0001 && automaticIndices.length > 0) {
    let targetIdx = automaticIndices[0];
    for (const idx of automaticIndices) {
      if ((updated[idx].suggestedLimit || 0) > (updated[targetIdx].suggestedLimit || 0)) {
        targetIdx = idx;
      }
    }
    const adjusted = Math.max(0, Math.round(((updated[targetIdx].suggestedLimit || 0) + diff) * 100) / 100);
    updated[targetIdx] = {
      ...updated[targetIdx],
      suggestedLimit: adjusted,
      percentageOfTotal: targetTotal > 0 ? Math.round((adjusted / targetTotal) * 100) : 0,
    };
  }

  return updated;
}

function getManualLocksStorageKey(userId?: string, month?: string): string {
  return `ai_budget_manual_locks_${userId || 'anon'}_${month || 'current'}`;
}

function loadManualLocks(userId?: string, month?: string): Map<string, number> {
  try {
    const raw = localStorage.getItem(getManualLocksStorageKey(userId, month));
    if (!raw) return new Map();
    const parsed = JSON.parse(raw);
    const map = new Map<string, number>();
    Object.entries(parsed).forEach(([catId, val]) => {
      if (typeof val === 'number') {
        map.set(catId, val);
      }
    });
    return map;
  } catch {
    return new Map();
  }
}

function saveManualLocks(userId: string | undefined, month: string | undefined, map: Map<string, number>) {
  try {
    const obj: Record<string, number> = {};
    map.forEach((val, catId) => {
      obj[catId] = val;
    });
    localStorage.setItem(getManualLocksStorageKey(userId, month), JSON.stringify(obj));
  } catch {
    // ignora
  }
}

export const AiBudgetSuggestionModal: React.FC<AiBudgetSuggestionModalProps> = ({
  isOpen,
  onClose,
  initialGlobalLimit = 3000,
  existingBudgets,
  onApplied,
  monthReference,
}) => {
  const { token, user } = useAuth();
  const [globalLimitInput, setGlobalLimitInput] = useState(initialGlobalLimit > 0 ? initialGlobalLimit.toString() : '3000');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiData, setAiData] = useState<AiBudgetSuggestionResponse | null>(null);
  const [editableSuggestions, setEditableSuggestions] = useState<CategoryBudgetSuggestion[]>([]);
  const [customizedCategoryIds, setCustomizedCategoryIds] = useState<Set<string>>(new Set());
  const [categoryInputs, setCategoryInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      const startLimit = initialGlobalLimit > 0 ? initialGlobalLimit : 3000;
      setGlobalLimitInput(startLimit.toString());

      // Carrega APENAS as categorias que o usuário ativou o toggle manualmente e personalizou
      const manualLocksMap = loadManualLocks(user?.id, monthReference);
      const manualLockedIds = new Set(manualLocksMap.keys());

      fetchSuggestions(startLimit, manualLockedIds, manualLocksMap);
    } else {
      setAiData(null);
      setEditableSuggestions([]);
      setCustomizedCategoryIds(new Set());
      setCategoryInputs({});
      setError(null);
    }
  }, [isOpen, initialGlobalLimit, user?.id, monthReference]);

  const fetchSuggestions = async (
    limitVal: number,
    lockedIds?: Set<string>,
    customLimitsMap?: Map<string, number>
  ) => {
    if (!token) return;
    setError(null);
    setLoading(true);
    try {
      const res = await getAiBudgetSuggestionsApi(token, limitVal, monthReference);
      setAiData(res);

      const activeLocked = lockedIds || new Set<string>();
      const activeCustomLimits = customLimitsMap || new Map<string, number>();

      let finalSuggestions: CategoryBudgetSuggestion[];
      if (activeLocked.size > 0) {
        finalSuggestions = applyLockedCategoriesAndRebalance(
          res.suggestions,
          limitVal,
          activeLocked,
          activeCustomLimits,
          existingBudgets
        );
        setCustomizedCategoryIds(new Set(activeLocked));
      } else {
        finalSuggestions = res.suggestions;
        setCustomizedCategoryIds(new Set());
      }

      setEditableSuggestions(finalSuggestions);

      // Sincroniza categoryInputs para todas as categorias
      const nextInputs: Record<string, string> = {};
      finalSuggestions.forEach((item) => {
        nextInputs[item.categoryId] = item.suggestedLimit !== undefined
          ? (Number.isInteger(item.suggestedLimit) ? item.suggestedLimit.toString() : item.suggestedLimit.toFixed(2))
          : '0';
      });
      setCategoryInputs(nextInputs);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Falha ao obter sugestões de orçamento da IA.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(globalLimitInput);
    if (isNaN(parsed) || parsed <= 0) {
      setError('Informe um valor de teto válido maior que zero.');
      return;
    }

    // Preserva apenas a(s) categoria(s) que o usuário ativou o toggle e personalizou
    const currentCustomLimits = new Map<string, number>();
    editableSuggestions.forEach((item) => {
      if (customizedCategoryIds.has(item.categoryId)) {
        const inputStr = categoryInputs[item.categoryId];
        const parsedVal = inputStr !== undefined ? parseFloat(inputStr) : NaN;
        const val = (!isNaN(parsedVal) && parsedVal >= 0)
          ? parsedVal
          : (item.suggestedLimit || 0);
        currentCustomLimits.set(item.categoryId, val);
      }
    });

    saveManualLocks(user?.id, monthReference, currentCustomLimits);
    fetchSuggestions(parsed, customizedCategoryIds, currentCustomLimits);
  };

  const handleEnableCustomization = (categoryId: string) => {
    const nextLocked = new Set(customizedCategoryIds);
    nextLocked.add(categoryId);
    setCustomizedCategoryIds(nextLocked);

    const item = editableSuggestions.find((s) => s.categoryId === categoryId);
    const curr = item?.suggestedLimit !== undefined ? item.suggestedLimit : 0;
    const valStr = Number.isInteger(curr) ? curr.toString() : curr.toFixed(2);

    setCategoryInputs((prev) => ({
      ...prev,
      [categoryId]: valStr,
    }));

    const manualMap = loadManualLocks(user?.id, monthReference);
    manualMap.set(categoryId, curr);
    saveManualLocks(user?.id, monthReference, manualMap);
  };

  const handleResetCustomization = (categoryId: string) => {
    const nextLocked = new Set(customizedCategoryIds);
    nextLocked.delete(categoryId);
    setCustomizedCategoryIds(nextLocked);

    const manualMap = loadManualLocks(user?.id, monthReference);
    manualMap.delete(categoryId);
    saveManualLocks(user?.id, monthReference, manualMap);

    const targetTotal = parseFloat(globalLimitInput) || 0;
    if (targetTotal > 0) {
      const rebalanced = resetCategoryToAutomatic(editableSuggestions, targetTotal, nextLocked);
      setEditableSuggestions(rebalanced);

      const nextInputs: Record<string, string> = {};
      rebalanced.forEach((item) => {
        nextInputs[item.categoryId] = item.suggestedLimit !== undefined
          ? (Number.isInteger(item.suggestedLimit) ? item.suggestedLimit.toString() : item.suggestedLimit.toFixed(2))
          : '0';
      });
      setCategoryInputs(nextInputs);
    }
  };

  const handleLimitChange = (categoryId: string, newLimitStr: string) => {
    // 1. Permite digitação livre de texto imediatamente no input da categoria
    setCategoryInputs((prev) => ({
      ...prev,
      [categoryId]: newLimitStr,
    }));

    const parsed = parseFloat(newLimitStr);
    const targetTotal = parseFloat(globalLimitInput) || 0;

    // 2. Só rebalanceia se for um número válido não negativo
    if (!isNaN(parsed) && parsed >= 0 && targetTotal > 0) {
      const manualMap = loadManualLocks(user?.id, monthReference);
      manualMap.set(categoryId, parsed);
      saveManualLocks(user?.id, monthReference, manualMap);

      const rebalanced = rebalanceCategoryBudgetsWithLocks(
        editableSuggestions,
        targetTotal,
        categoryId,
        parsed,
        customizedCategoryIds
      );
      setEditableSuggestions(rebalanced);

      // Sincroniza apenas as categorias automáticas para que a UI mostre o rebalanceamento em tempo real
      setCategoryInputs((prev) => {
        const next = { ...prev, [categoryId]: newLimitStr };
        rebalanced.forEach((item) => {
          if (!customizedCategoryIds.has(item.categoryId)) {
            next[item.categoryId] = item.suggestedLimit !== undefined
              ? (Number.isInteger(item.suggestedLimit) ? item.suggestedLimit.toString() : item.suggestedLimit.toFixed(2))
              : '0';
          }
        });
        return next;
      });
    }
  };

  const handleLimitBlur = (categoryId: string) => {
    const targetTotal = parseFloat(globalLimitInput) || 0;
    const currentStr = categoryInputs[categoryId];
    const parsed = parseFloat(currentStr);

    // Se o usuário deixou vazio ou inválido, restaura o último valor válido não-zero
    if (isNaN(parsed) || parsed < 0) {
      const item = editableSuggestions.find((s) => s.categoryId === categoryId);
      const fallbackVal = item?.suggestedLimit || 0;
      setCategoryInputs((prev) => ({
        ...prev,
        [categoryId]: Number.isInteger(fallbackVal) ? fallbackVal.toString() : fallbackVal.toFixed(2),
      }));
      return;
    }

    if (targetTotal > 0) {
      const manualMap = loadManualLocks(user?.id, monthReference);
      manualMap.set(categoryId, parsed);
      saveManualLocks(user?.id, monthReference, manualMap);

      const rebalanced = rebalanceCategoryBudgetsWithLocks(
        editableSuggestions,
        targetTotal,
        categoryId,
        parsed,
        customizedCategoryIds
      );
      setEditableSuggestions(rebalanced);

      setCategoryInputs((prev) => {
        const next = { ...prev };
        rebalanced.forEach((item) => {
          next[item.categoryId] = item.suggestedLimit !== undefined
            ? (Number.isInteger(item.suggestedLimit) ? item.suggestedLimit.toString() : item.suggestedLimit.toFixed(2))
            : '0';
        });
        return next;
      });
    }
  };

  const handleApply = async () => {
    if (!token || editableSuggestions.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      // Garante que o valor de categoryInputs se reflita em finalSuggestions
      const finalSuggestions = editableSuggestions.map((item) => {
        if (customizedCategoryIds.has(item.categoryId)) {
          const str = categoryInputs[item.categoryId];
          const parsed = str !== undefined ? parseFloat(str) : NaN;
          if (!isNaN(parsed) && parsed >= 0) {
            return {
              ...item,
              suggestedLimit: parsed,
            };
          }
        }
        return item;
      });

      const parsedGlobalLimit = parseFloat(globalLimitInput);
      const targetMonthRef = monthReference || `${new Date().toISOString().slice(0, 7)}-01`;
      const globalAlertThreshold = getStoredGlobalAlertThreshold(user?.id);

      const requests: CreateBudgetPayload[] = finalSuggestions.map((s) => ({
        categoryId: s.categoryId,
        monthlyLimit: Math.max(0, Math.round((s.suggestedLimit || 0) * 100) / 100),
        alertThresholdPercentage: globalAlertThreshold,
        monthReference: targetMonthRef,
      }));

      await saveBatchBudgetsApi(token, requests);

      const finalCustomLimits = new Map<string, number>();
      finalSuggestions.forEach((item) => {
        if (customizedCategoryIds.has(item.categoryId)) {
          finalCustomLimits.set(item.categoryId, item.suggestedLimit || 0);
        }
      });
      saveManualLocks(user?.id, monthReference, finalCustomLimits);

      onApplied(!isNaN(parsedGlobalLimit) && parsedGlobalLimit > 0 ? parsedGlobalLimit : undefined);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Falha ao aplicar tetos nas categorias.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const currentTotal = Math.round(editableSuggestions.reduce((acc, s) => acc + (s.suggestedLimit || 0), 0) * 100) / 100;
  const targetTotal = parseFloat(globalLimitInput) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-2xl max-h-[90vh] rounded-3xl bg-white border-2 border-slate-200 shadow-2xl p-6 sm:p-8 flex flex-col relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="Fechar"
        >
          <X className="h-5 w-5 stroke-[2.5]" />
        </button>

        {/* Cabeçalho */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-[#026CD6] to-[#0153AB] rounded-2xl text-white shadow-md">
            <Sparkles className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800">
              Distribuição Inteligente com I.A
            </h2>
            <p className="text-xs sm:text-sm font-bold text-slate-400">
              Análise dos seus lançamentos para sugerir metas ideais por categoria
            </p>
          </div>
        </div>

        {/* Input de Teto Global */}
        <form onSubmit={handleRecalculate} className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-200/80 mb-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full">
            <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider block mb-1">
              Teto Máximo de Gastos Mensal (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="10"
              value={globalLimitInput}
              onChange={(e) => setGlobalLimitInput(e.target.value)}
              placeholder="Ex: 3500.00"
              className="w-full px-4 py-2 bg-white border-2 border-slate-200 rounded-xl text-base font-black text-slate-800 focus:outline-none focus:border-[#026CD6]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-duo btn-duo-green text-xs px-4 py-2.5 flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto justify-center"
          >
            <Sparkles className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Distribuir com I.A</span>
          </button>
        </form>

        {error && (
          <div className="p-3 mb-4 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Conteúdo com Scroll */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-4 border-[#026CD6] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-black text-slate-600">
                A IA está analisando seus hábitos e faturas...
              </p>
            </div>
          ) : aiData ? (
            <>
              {/* Insight da IA */}
              <div className="p-4 rounded-2xl bg-blue-50/80 border-2 border-blue-200/80 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#026CD6] shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-blue-950 leading-relaxed">
                  {aiData.aiInsight}
                </p>
              </div>

              {/* Lista de Sugestões por Categoria */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-black text-slate-400 uppercase tracking-wider px-1">
                  <span>Categoria & Justificativa</span>
                  <div className="flex items-center gap-6 pr-1">
                    <span>Teto (R$)</span>
                    <span>Personalizar</span>
                  </div>
                </div>

                {customizedCategoryIds.size > 0 && (
                  <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-900 text-[11px] font-bold flex items-center justify-between animate-fadeIn">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#026CD6] shrink-0" />
                      <span>{customizedCategoryIds.size} categoria(s) fixada(s). As demais se adaptam automaticamente para manter a soma em {formatBRL(targetTotal)}.</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomizedCategoryIds(new Set());
                        saveManualLocks(user?.id, monthReference, new Map());
                        if (targetTotal > 0) {
                          const rebalanced = resetCategoryToAutomatic(editableSuggestions, targetTotal, new Set());
                          setEditableSuggestions(rebalanced);
                        }
                      }}
                      className="text-[10px] font-black text-[#026CD6] hover:text-blue-900 underline ml-2 shrink-0 cursor-pointer"
                      title="Voltar todas as categorias para a distribuição da IA"
                    >
                      Liberar todas
                    </button>
                  </div>
                )}

                {editableSuggestions.map((item) => {
                  const isCustomized = customizedCategoryIds.has(item.categoryId);
                  const displayValue = categoryInputs[item.categoryId] ?? (
                    item.suggestedLimit !== undefined
                      ? (Number.isInteger(item.suggestedLimit)
                          ? item.suggestedLimit.toString()
                          : item.suggestedLimit.toFixed(2))
                      : '0'
                  );
                  const percentOfTotal = targetTotal > 0
                    ? Math.round(((item.suggestedLimit || 0) / targetTotal) * 100)
                    : 0;

                  return (
                    <div
                      key={item.categoryId}
                      className={`p-3 rounded-2xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isCustomized
                          ? 'bg-blue-50/30 border-blue-300 shadow-xs'
                          : 'bg-slate-50 border-slate-200/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full mt-0.5 shrink-0 shadow-sm"
                          style={{ backgroundColor: item.colorHex || '#3b82f6' }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-slate-800 truncate">
                              {item.categoryName}
                            </span>
                            <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-800">
                              {percentOfTotal}%
                            </span>
                            {isCustomized && (
                              <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-blue-100 text-[#026CD6] border border-blue-200 flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" />
                                Fixado
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-medium text-slate-500 leading-snug mt-0.5">
                            {item.recommendationReason}
                          </p>
                        </div>
                      </div>

                      {/* Lado Direito: Campo de Valor + Toggle Switch */}
                      <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-400">R$</span>
                          {isCustomized ? (
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={displayValue}
                              onChange={(e) => handleLimitChange(item.categoryId, e.target.value)}
                              onBlur={() => handleLimitBlur(item.categoryId)}
                              className="w-24 px-2.5 py-1.5 bg-white border-2 border-[#026CD6] rounded-xl text-right font-black text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all shadow-xs"
                            />
                          ) : (
                            <span className="w-24 px-2.5 py-1.5 bg-white border-2 border-slate-200 rounded-xl text-right font-black text-xs text-slate-700 select-none shadow-xs">
                              {item.suggestedLimit !== undefined
                                ? (Number.isInteger(item.suggestedLimit)
                                    ? item.suggestedLimit.toString()
                                    : item.suggestedLimit.toFixed(2))
                                : '0.00'}
                            </span>
                          )}
                        </div>

                        {/* Toggle Button */}
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isCustomized}
                          onClick={() => {
                            if (isCustomized) {
                              handleResetCustomization(item.categoryId);
                            } else {
                              handleEnableCustomization(item.categoryId);
                            }
                          }}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            isCustomized ? 'bg-[#026CD6]' : 'bg-slate-300 hover:bg-slate-400'
                          }`}
                          title={
                            isCustomized
                              ? 'Personalização ativada (clique para voltar ao automático)'
                              : 'Clique para permitir alteração manual desta categoria'
                          }
                        >
                          <span className="sr-only">Permitir alteração manual</span>
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              isCustomized ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>

        {/* Rodapé e Botões */}
        <div className="mt-4 pt-4 border-t-2 border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs">
            <span className="font-bold text-slate-500">Soma das metas: </span>
            <strong className={`font-black ${Math.abs(currentTotal - targetTotal) < 1 ? 'text-[#46A302]' : 'text-amber-600'}`}>
              {formatBRL(currentTotal)}
            </strong>
            <span className="text-slate-400"> de {formatBRL(targetTotal)}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn-duo btn-duo-white text-xs px-4 py-2.5 flex-1 sm:flex-initial"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={saving || loading || editableSuggestions.length === 0}
              className="btn-duo btn-duo-green text-xs px-5 py-2.5 flex items-center justify-center gap-2 flex-1 sm:flex-initial shadow-md"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{saving ? 'Aplicando...' : 'Aplicar Metas nas Categorias'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
