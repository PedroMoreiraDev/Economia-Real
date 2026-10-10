import React, { useState, useEffect } from 'react';
import { Sparkles, X, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAiBudgetSuggestionsApi, saveBatchBudgetsApi } from '../services/budgetApi';
import { AiBudgetSuggestionResponse, CategoryBudgetSuggestion, CreateBudgetPayload } from '../types/budget';

interface AiBudgetSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGlobalLimit?: number;
  onApplied: () => void;
  monthReference?: string;
}

function formatBRL(val: number | undefined): string {
  if (val === undefined || isNaN(val)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

export const AiBudgetSuggestionModal: React.FC<AiBudgetSuggestionModalProps> = ({
  isOpen,
  onClose,
  initialGlobalLimit = 3000,
  onApplied,
  monthReference,
}) => {
  const { token } = useAuth();
  const [globalLimitInput, setGlobalLimitInput] = useState(initialGlobalLimit > 0 ? initialGlobalLimit.toString() : '3000');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiData, setAiData] = useState<AiBudgetSuggestionResponse | null>(null);
  const [editableSuggestions, setEditableSuggestions] = useState<CategoryBudgetSuggestion[]>([]);

  useEffect(() => {
    if (isOpen) {
      const startLimit = initialGlobalLimit > 0 ? initialGlobalLimit : 3000;
      setGlobalLimitInput(startLimit.toString());
      fetchSuggestions(startLimit);
    } else {
      setAiData(null);
      setEditableSuggestions([]);
      setError(null);
    }
  }, [isOpen, initialGlobalLimit]);

  const fetchSuggestions = async (limitVal: number) => {
    if (!token) return;
    setError(null);
    setLoading(true);
    try {
      const res = await getAiBudgetSuggestionsApi(token, limitVal, monthReference);
      setAiData(res);
      setEditableSuggestions(res.suggestions);
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
    fetchSuggestions(parsed);
  };

  const handleLimitChange = (index: number, newLimitStr: string) => {
    const val = parseFloat(newLimitStr) || 0;
    const updated = [...editableSuggestions];
    updated[index] = {
      ...updated[index],
      suggestedLimit: val,
    };
    setEditableSuggestions(updated);
  };

  const handleApply = async () => {
    if (!token || editableSuggestions.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const requests: CreateBudgetPayload[] = editableSuggestions.map((s) => ({
        categoryId: s.categoryId,
        monthlyLimit: s.suggestedLimit,
        alertThresholdPercentage: 80,
        monthReference,
      }));

      await saveBatchBudgetsApi(token, requests);
      onApplied();
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

  const currentTotal = editableSuggestions.reduce((acc, s) => acc + (s.suggestedLimit || 0), 0);
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
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Recalcular com IA</span>
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
                  <span>Teto Sugerido (R$)</span>
                </div>

                {editableSuggestions.map((item, idx) => (
                  <div
                    key={item.categoryId}
                    className="p-3 rounded-2xl bg-slate-50 border-2 border-slate-200/80 hover:border-blue-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <span
                        className="w-3.5 h-3.5 rounded-full mt-0.5 shrink-0 shadow-xs"
                        style={{ backgroundColor: item.colorHex || '#3b82f6' }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-800 truncate">
                            {item.categoryName}
                          </span>
                          <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-800">
                            {item.percentageOfTotal}%
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-500 leading-snug mt-0.5">
                          {item.recommendationReason}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className="text-xs font-bold text-slate-400">R$</span>
                      <input
                        type="number"
                        step="1"
                        value={item.suggestedLimit}
                        onChange={(e) => handleLimitChange(idx, e.target.value)}
                        className="w-24 px-2.5 py-1.5 bg-white border-2 border-slate-200 rounded-xl text-right font-black text-xs text-slate-900 focus:outline-none focus:border-[#026CD6]"
                      />
                    </div>
                  </div>
                ))}
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
