import React, { useState, useEffect } from 'react';
import { Target, X, AlertCircle, Trash2, CheckCircle2, Globe } from 'lucide-react';
import { Category } from '../types/financial';
import { BudgetProgressDto, CreateBudgetPayload } from '../types/budget';
import { 
  createOrUpdateBudgetApi, 
  deleteBudgetApi, 
  updateGlobalAlertThresholdApi, 
  getStoredGlobalAlertThreshold, 
  setStoredGlobalAlertThreshold 
} from '../services/budgetApi';
import { useAuth } from '../context/AuthContext';
import { CurrencyInput } from './CurrencyInput';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  existingBudgets: BudgetProgressDto[];
  onBudgetUpdated: () => void;
  monthReference?: string;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  categories,
  existingBudgets,
  onBudgetUpdated,
  monthReference,
}) => {
  const { token, user } = useAuth();
  const [categoryId, setCategoryId] = useState('');
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [alertThreshold, setAlertThreshold] = useState(() => {
    const stored = getStoredGlobalAlertThreshold(user?.id);
    if (stored) return stored.toString();
    if (existingBudgets.length > 0 && existingBudgets[0].alertThresholdPercentage) {
      return existingBudgets[0].alertThresholdPercentage.toString();
    }
    return '80';
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredGlobalAlertThreshold(user?.id);
      if (stored) {
        setAlertThreshold(stored.toString());
      } else if (existingBudgets.length > 0 && existingBudgets[0].alertThresholdPercentage) {
        setAlertThreshold(existingBudgets[0].alertThresholdPercentage.toString());
      }
    }
  }, [isOpen, user?.id, existingBudgets]);

  if (!isOpen) return null;

  // Quando o usuário seleciona uma categoria, se já houver orçamento, pré-preenche o limite
  const handleCategoryChange = (catId: string) => {
    setCategoryId(catId);
    const existing = existingBudgets.find(b => b.categoryId === catId);
    if (existing) {
      setMonthlyLimit(existing.monthlyLimit.toString());
    } else {
      setMonthlyLimit('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setError(null);
    setLoading(true);

    try {
      const thresholdVal = parseInt(alertThreshold, 10);
      if (isNaN(thresholdVal) || thresholdVal < 1 || thresholdVal > 100) {
        throw new Error('O percentual de alerta deve estar entre 1 e 100%.');
      }

      // Se o usuário selecionou uma categoria, valida e salva a meta individual
      if (categoryId) {
        const limitVal = parseFloat(monthlyLimit);
        if (isNaN(limitVal) || limitVal <= 0) {
          throw new Error('O limite mensal deve ser maior que zero.');
        }

        const payload: CreateBudgetPayload = {
          categoryId,
          monthReference: monthReference || undefined,
          monthlyLimit: limitVal,
          alertThresholdPercentage: thresholdVal,
        };

        await createOrUpdateBudgetApi(token, payload);
      }

      // Aplica o percentual de alerta de consumo próximo para todas as categorias existentes no mês
      await updateGlobalAlertThresholdApi(token, thresholdVal, monthReference);

      // Persiste nas preferências locais do usuário para futuras metas e I.A
      setStoredGlobalAlertThreshold(user?.id, thresholdVal);

      onBudgetUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar configurações.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (budgetId: string) => {
    if (!token) return;
    if (!window.confirm('Tem certeza que deseja remover a meta desta categoria?')) return;

    setLoading(true);
    try {
      await deleteBudgetApi(token, budgetId);
      onBudgetUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao remover orçamento.');
    } finally {
      setLoading(false);
    }
  };

  const selectedBudget = existingBudgets.find(b => b.categoryId === categoryId);
  const isCategorySelected = Boolean(categoryId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border-2 border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        
        {/* Cabeçalho */}
        <div className="p-6 border-b-2 border-slate-100 flex items-center justify-between bg-blue-50/70">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-[#026CD6] text-white shadow-[0_3px_0_0_#0153AB]">
              <Target className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800">Meta de Orçamento</h2>
              <p className="text-xs sm:text-sm font-bold text-slate-400">Estabeleça limites e alertas de monitoramento</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 border-2 border-[#FF4B4B] rounded-2xl flex items-center gap-2.5 text-xs sm:text-sm font-bold text-[#EA2B2B]">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Selecionar Categoria */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5 flex items-center justify-between">
              <span>Categoria de Despesa</span>
              {!isCategorySelected && (
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                  Opcional p/ alerta geral
                </span>
              )}
            </label>
            <select
              value={categoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-[#026CD6] focus:bg-white transition-all"
            >
              <option value="">Nenhuma selecionada (Apenas definir alerta geral)</option>
              {categories.map((cat) => {
                const hasBudget = existingBudgets.some(b => b.categoryId === cat.id);
                return (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} {hasBudget ? '• (Com meta configurada)' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Limite Mensal */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
              Limite Mensal Máximo (R$)
            </label>
            <CurrencyInput
              disabled={!isCategorySelected}
              value={monthlyLimit}
              onChangeValue={(val) => setMonthlyLimit(val > 0 ? val.toString() : '')}
              placeholder={isCategorySelected ? "0,00" : "Selecione uma categoria"}
              className="bg-slate-50 border-2 border-slate-200 rounded-2xl py-2.5 text-sm font-black text-slate-800 focus:border-[#026CD6] focus:bg-white disabled:opacity-50 disabled:bg-slate-100"
            />
          </div>

          {/* Limite de Alerta Percentual (Global para todas as categorias) */}
          <div className="p-3.5 bg-blue-50/60 border-2 border-blue-100/80 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#026CD6]" />
                <span>Alerta de Consumo Próximo</span>
              </label>
              <span className="text-[#026CD6] font-black text-xs px-2 py-0.5 bg-blue-100 rounded-lg">
                {alertThreshold}% (Todas as Categorias)
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(e.target.value)}
              className="w-full accent-[#026CD6] cursor-pointer"
            />
            <p className="text-[11px] font-bold text-slate-500 leading-snug">
              Configuração geral: aplica-se a todas as categorias do mês e também às metas geradas por I.A. A interface mudará para estado de aviso amarelo ao atingir este percentual.
            </p>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-3 pt-4 border-t-2 border-slate-100">
            {selectedBudget && (
              <button
                type="button"
                onClick={() => handleDelete(selectedBudget.id)}
                disabled={loading}
                className="p-3 rounded-2xl border-2 border-rose-200 text-[#FF4B4B] hover:bg-rose-50 transition-colors"
                title="Excluir meta desta categoria"
              >
                <Trash2 className="w-5 h-5 stroke-[2.5]" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="btn-duo btn-duo-white flex-1 py-3 text-xs sm:text-sm font-black"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || (isCategorySelected && (!monthlyLimit || parseFloat(monthlyLimit) <= 0))}
              className="btn-duo btn-duo-green flex-1 py-3 text-xs sm:text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>{isCategorySelected ? 'Salvar Meta' : 'Aplicar Alerta Geral'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

