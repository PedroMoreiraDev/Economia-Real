import React, { useState } from 'react';
import { Landmark, X, AlertCircle } from 'lucide-react';
import { AccountType, CreateAccountPayload } from '../types/financial';
import { createAccountApi } from '../services/financialApi';
import { useAuth } from '../context/AuthContext';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountCreated: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  onAccountCreated,
}) => {
  const { token } = useAuth();
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('CHECKING');
  const [initialBalance, setInitialBalance] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setLoading(true);

    try {
      const payload: CreateAccountPayload = {
        name: name.trim(),
        type,
        initialBalance: initialBalance ? parseFloat(initialBalance) : 0,
      };
      await createAccountApi(token, payload);
      setName('');
      setInitialBalance('');
      setType('CHECKING');
      onAccountCreated();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Falha ao cadastrar conta.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md rounded-3xl bg-white border-2 border-slate-200 shadow-2xl p-6 sm:p-8 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="Fechar"
        >
          <X className="h-5 w-5 stroke-[2.5]" />
        </button>

        <div className="flex items-center gap-3.5 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-[#EBF7FF] border-2 border-[#1CB0F6] text-[#1CB0F6] flex items-center justify-center shadow-[0_3px_0_0_#1CB0F6]">
            <Landmark className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800">Nova Conta</h2>
            <p className="text-xs sm:text-sm font-bold text-slate-400">Cadastre conta corrente, poupança ou investimentos</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border-2 border-[#FF4B4B] flex items-center gap-2 text-xs sm:text-sm font-bold text-[#EA2B2B]">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500">Nome da Conta</label>
            <input
              type="text"
              required
              placeholder="Ex: Nubank, Itaú Corrente, Carteira Física"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1CB0F6] focus:bg-white transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500">Tipo de Conta</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AccountType)}
              className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:border-[#1CB0F6] focus:bg-white transition-all"
            >
              <option value="CHECKING">Conta Corrente</option>
              <option value="SAVINGS">Conta Poupança</option>
              <option value="INVESTMENT">Investimentos</option>
              <option value="CASH">Dinheiro em Espécie / Carteira</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500">Saldo Inicial (R$)</label>
            <input
              type="number"
              step="0.01"
              placeholder="0,00"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-black text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1CB0F6] focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="btn-duo btn-duo-white px-5 py-2.5 text-xs sm:text-sm font-black"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-duo btn-duo-blue px-5 py-2.5 text-xs sm:text-sm font-black disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Cadastrar Conta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
