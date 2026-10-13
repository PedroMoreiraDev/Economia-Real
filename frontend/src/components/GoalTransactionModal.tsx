import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, X, AlertCircle, CheckCircle2, Building2 } from 'lucide-react';
import { SavingsGoal } from '../types/goal';
import { Account } from '../types/financial';
import { depositToSavingsGoalApi, withdrawFromSavingsGoalApi } from '../services/goalApi';
import { useAuth } from '../context/AuthContext';
import { CurrencyInput } from './CurrencyInput';

interface GoalTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: SavingsGoal | null;
  accounts: Account[];
  initialMode?: 'deposit' | 'withdraw';
  onSuccess: () => void;
}

export const GoalTransactionModal: React.FC<GoalTransactionModalProps> = ({
  isOpen,
  onClose,
  goal,
  accounts,
  initialMode = 'deposit',
  onSuccess,
}) => {
  const { token } = useAuth();
  const [mode, setMode] = useState<'deposit' | 'withdraw'>(initialMode);
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    setMode(initialMode);
    setAmount('');
    setAccountId(accounts.length > 0 ? accounts[0].id : '');
    setError(null);
  }, [goal, isOpen, initialMode, accounts]);

  if (!isOpen || !goal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setError(null);
    setLoading(true);

    try {
      const numAmount = parseFloat(amount.replace(',', '.'));
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error('Informe um valor numérico positivo.');
      }

      const targetAccountId = accountId ? accountId : null;

      if (mode === 'deposit') {
        await depositToSavingsGoalApi(token, goal.id, {
          amount: numAmount,
          sourceAccountId: targetAccountId,
        });
      } else {
        await withdrawFromSavingsGoalApi(token, goal.id, {
          amount: numAmount,
          destinationAccountId: targetAccountId,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao processar movimentação.');
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
          <div className={`p-3 rounded-2xl border-2 ${
            mode === 'deposit' 
              ? 'bg-blue-50 text-[#026CD6] border-blue-200' 
              : 'bg-amber-50 text-[#FF9600] border-[#FFC800]'
          }`}>
            {mode === 'deposit' ? <ArrowUpRight className="w-6 h-6 stroke-[2.5]" /> : <ArrowDownLeft className="w-6 h-6 stroke-[2.5]" />}
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800">
              {mode === 'deposit' ? 'Guardar Dinheiro' : 'Resgatar Dinheiro'}
            </h2>
            <p className="text-xs sm:text-sm font-bold text-slate-400">
              Meta: <strong className="text-slate-700">{goal.title}</strong>
            </p>
          </div>
        </div>

        {/* Abas Aporte vs Resgate */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6 border-2 border-slate-200/80 gap-1.5">
          <button
            type="button"
            onClick={() => setMode('deposit')}
            className={`flex-1 py-2 text-xs sm:text-sm font-black rounded-xl transition-all ${
              mode === 'deposit'
                ? 'bg-[#026CD6] text-white shadow-[0_3px_0_0_#0153AB]'
                : 'text-slate-600 hover:text-slate-800 hover:bg-white/60'
            }`}
          >
            Aporte (+)
          </button>
          <button
            type="button"
            onClick={() => setMode('withdraw')}
            className={`flex-1 py-2 text-xs sm:text-sm font-black rounded-xl transition-all ${
              mode === 'withdraw'
                ? 'bg-[#FF9600] text-white shadow-[0_3px_0_0_#E58600]'
                : 'text-slate-600 hover:text-slate-800 hover:bg-white/60'
            }`}
          >
            Resgate (-)
          </button>
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
              Valor (R$)
            </label>
            <CurrencyInput
              value={amount}
              onChangeValue={(val) => setAmount(val > 0 ? val.toString() : '')}
              placeholder="0,00"
              className="py-2.5 rounded-2xl bg-slate-50 border-2 border-slate-200 text-slate-800 font-black placeholder-slate-400 focus:border-[#026CD6] focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5 flex items-center justify-between">
              <span>{mode === 'deposit' ? 'Debitar da Conta (Opcional)' : 'Creditar na Conta (Opcional)'}</span>
              <Building2 className="w-4 h-4 text-slate-400" />
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border-2 border-slate-200 text-slate-800 font-bold focus:outline-none focus:border-[#026CD6] focus:bg-white transition-all text-xs sm:text-sm"
            >
              <option value="">Não movimentar saldo de conta bancária</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} (Saldo: R$ {acc.initialBalance.toFixed(2)})
                </option>
              ))}
            </select>
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
              className={`btn-duo flex-1 py-3 text-xs sm:text-sm font-black flex items-center justify-center space-x-2 disabled:opacity-50 ${
                mode === 'deposit' ? 'btn-duo-green' : 'btn-duo-yellow'
              }`}
            >
              {loading ? (
                <span>Processando...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>{mode === 'deposit' ? 'Confirmar Aporte' : 'Confirmar Resgate'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
