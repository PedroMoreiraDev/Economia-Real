import React, { useState } from 'react';
import { Target, X, AlertCircle, Trash2, CheckCircle2 } from 'lucide-react';
import { Category } from '../types/financial';
import { BudgetProgressDto, CreateBudgetPayload } from '../types/budget';
import { createOrUpdateBudgetApi, deleteBudgetApi } from '../services/budgetApi';
import { useAuth } from '../context/AuthContext';

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
  const { token } = useAuth();
  const [categoryId, setCategoryId] = useState('');
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [alertThreshold, setAlertThreshold] = useState('80');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Quando o usuário seleciona uma categoria, se já houver orçamento, pré-preenche
  const handleCategoryChange = (catId: string) => {
    setCategoryId(catId);
    const existing = existingBudgets.find(b => b.categoryId === catId);
    if (existing) {
      setMonthlyLimit(existing.monthlyLimit.toString());
      setAlertThreshold(existing.alertThresholdPercentage.toString());
    } else {
      setMonthlyLimit('');
      setAlertThreshold('80');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setError(null);
    setLoading(true);

    try {
      const limitVal = parseFloat(monthlyLimit);
      if (isNaN(limitVal) || limitVal <= 0) {
        throw new Error('O limite mensal deve ser maior que zero.');
      }

      const thresholdVal = parseInt(alertThreshold, 10);
      if (isNaN(thresholdVal) || thresholdVal < 1 || thresholdVal > 100) {
        throw new Error('O percentual de alerta deve estar entre 1 e 100%.');
      }

      const payload: CreateBudgetPayload = {
        categoryId,
        monthReference: monthReference || undefined,
        monthlyLimit: limitVal,
        alertThresholdPercentage: thresholdVal,
      };

      await createOrUpdateBudgetApi(token, payload);
      onBudgetUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar orçamento.');
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
              <p className="text-xs sm:text-sm font-bold text-slate-400">Estabeleça limites para monitorar gastos</p>
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
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
              Categoria de Despesa
            </label>
            <select
              required
              value={categoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-[#026CD6] focus:bg-white transition-all"
            >
              <option value="">Selecione uma categoria...</option>
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
            <input
              type="number"
              step="0.01"
              required
              value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(e.target.value)}
              placeholder="Ex: 1200.00"
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-black text-slate-800 focus:outline-none focus:border-[#026CD6] focus:bg-white transition-all"
            />
          </div>

          {/* Limite de Alerta Percentual */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5 flex items-center justify-between">
              <span>Alerta de Consumo Próximo</span>
              <span className="text-[#026CD6] font-black">{alertThreshold}%</span>
            </label>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(e.target.value)}
              className="w-full accent-[#026CD6] cursor-pointer"
            />
            <p className="text-xs font-bold text-slate-400 mt-1.5">
              A interface mudará para estado de aviso quando os gastos atingirem este percentual do limite.
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
                title="Excluir meta"
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
              disabled={loading || !categoryId}
              className="btn-duo btn-duo-green flex-1 py-3 text-xs sm:text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>Salvar Meta</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
