import React, { useState } from 'react';
import { CreditCard as CardIcon, X, AlertCircle } from 'lucide-react';
import { CreateCardPayload } from '../types/card';
import { createCreditCardApi } from '../services/cardApi';
import { useAuth } from '../context/AuthContext';
import { CurrencyInput } from './CurrencyInput';

interface CreditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCardCreated: () => void;
}

export const CreditCardModal: React.FC<CreditCardModalProps> = ({
  isOpen,
  onClose,
  onCardCreated,
}) => {
  const { token } = useAuth();
  const [name, setName] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [closingDay, setClosingDay] = useState('10');
  const [dueDay, setDueDay] = useState('17');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setLoading(true);

    try {
      const payload: CreateCardPayload = {
        name: name.trim(),
        creditLimit: parseFloat(creditLimit),
        closingDay: parseInt(closingDay, 10),
        dueDay: parseInt(dueDay, 10),
      };
      await createCreditCardApi(token, payload);
      setName('');
      setCreditLimit('');
      onCardCreated();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Falha ao cadastrar cartão.');
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
          <div className="h-12 w-12 rounded-2xl bg-purple-50 border-2 border-[#CE82FF] text-[#A64BFF] flex items-center justify-center shadow-[0_3px_0_0_#A64BFF]">
            <CardIcon className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800">Novo Cartão</h2>
            <p className="text-xs sm:text-sm font-bold text-slate-400">Configure limite, dia de fechamento e vencimento</p>
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
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500">Nome do Cartão</label>
            <input
              type="text"
              required
              placeholder="Ex: Nubank Ultravioleta, XP Visa Infinite"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#CE82FF] focus:bg-white transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500">Limite Total (R$)</label>
            <CurrencyInput
              value={creditLimit}
              onChangeValue={(val) => setCreditLimit(val > 0 ? val.toString() : '')}
              placeholder="0,00"
              className="py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-black text-slate-800 placeholder-slate-400 focus:border-[#CE82FF] focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500">Dia Fechamento</label>
              <input
                type="number"
                min="1"
                max="31"
                required
                value={closingDay}
                onChange={(e) => setClosingDay(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:border-[#CE82FF] focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500">Dia Vencimento</label>
              <input
                type="number"
                min="1"
                max="31"
                required
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:border-[#CE82FF] focus:bg-white transition-all"
              />
            </div>
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
              className="btn-duo btn-duo-purple px-5 py-2.5 text-xs sm:text-sm font-black disabled:opacity-50"
            >
              {loading ? 'Cadastrando...' : 'Salvar Cartão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
