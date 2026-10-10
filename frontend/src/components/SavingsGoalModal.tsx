import React, { useState, useEffect } from 'react';
import { Target, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { SavingsGoal, CreateSavingsGoalPayload, UpdateSavingsGoalPayload } from '../types/goal';
import { createSavingsGoalApi, updateSavingsGoalApi } from '../services/goalApi';
import { useAuth } from '../context/AuthContext';

interface SavingsGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalToEdit?: SavingsGoal | null;
  onSuccess: () => void;
}

export const SavingsGoalModal: React.FC<SavingsGoalModalProps> = ({
  isOpen,
  onClose,
  goalToEdit,
  onSuccess,
}) => {
  const { token } = useAuth();
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (goalToEdit) {
      setTitle(goalToEdit.title);
      setTargetAmount(goalToEdit.targetAmount.toString());
      setTargetDate(goalToEdit.targetDate || '');
    } else {
      setTitle('');
      setTargetAmount('');
      setTargetDate('');
    }
    setError(null);
  }, [goalToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setError(null);
    setLoading(true);

    try {
      if (!title.trim()) {
        throw new Error('Informe o título da meta.');
      }

      const numAmount = parseFloat(targetAmount.replace(',', '.'));
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error('O valor alvo deve ser um número positivo.');
      }

      if (goalToEdit) {
        const payload: UpdateSavingsGoalPayload = {
          title: title.trim(),
          targetAmount: numAmount,
          targetDate: targetDate || null,
        };
        await updateSavingsGoalApi(token, goalToEdit.id, payload);
      } else {
        const payload: CreateSavingsGoalPayload = {
          title: title.trim(),
          targetAmount: numAmount,
          targetDate: targetDate || null,
        };
        await createSavingsGoalApi(token, payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar meta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-white border-2 border-slate-200 p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        <div className="flex items-center space-x-3.5 mb-6">
          <div className="p-3 rounded-2xl bg-[#E8F8E8] text-[#58CC02] border-2 border-[#D7FFB8]">
            <Target className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800">
              {goalToEdit ? 'Editar Meta' : 'Nova Meta de Economia'}
            </h2>
            <p className="text-xs sm:text-sm font-bold text-slate-400">
              Defina seu objetivo e acompanhe seu patrimônio crescer
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 flex items-center space-x-2.5 p-3.5 rounded-2xl bg-rose-50 border-2 border-[#FF4B4B] text-[#EA2B2B] text-xs sm:text-sm font-bold">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
              Título da Meta
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Reserva de Emergência, Carro Novo, Férias"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border-2 border-slate-200 text-slate-800 font-bold placeholder-slate-400 focus:outline-none focus:border-[#58CC02] focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
              Valor Alvo (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0,00"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border-2 border-slate-200 text-slate-800 font-black placeholder-slate-400 focus:outline-none focus:border-[#58CC02] focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
              Data Limite Prevista (Opcional)
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border-2 border-slate-200 text-slate-800 font-bold focus:outline-none focus:border-[#58CC02] focus:bg-white transition-all"
            />
          </div>

          <div className="pt-4 flex space-x-3 border-t-2 border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="btn-duo btn-duo-white flex-1 py-3 text-xs sm:text-sm font-black"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-duo btn-duo-green flex-1 py-3 text-xs sm:text-sm font-black flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Salvando...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>{goalToEdit ? 'Atualizar' : 'Criar Meta'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
