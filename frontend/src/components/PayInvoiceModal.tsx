import React, { useState } from 'react';
import { DollarSign, X, AlertCircle } from 'lucide-react';
import { CreditCardInvoice, PayInvoicePayload } from '../types/card';
import { Account } from '../types/financial';
import { payInvoiceApi } from '../services/cardApi';
import { useAuth } from '../context/AuthContext';

interface PayInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: CreditCardInvoice | null;
  cardName: string;
  accounts: Account[];
  onInvoicePaid: () => void;
}

export const PayInvoiceModal: React.FC<PayInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  cardName,
  accounts,
  onInvoicePaid,
}) => {
  const { token } = useAuth();
  const [accountId, setAccountId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !invoice) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !accountId) return;
    setError(null);
    setLoading(true);

    try {
      const parsedAmount = parseFloat(paymentAmount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error('Valor deve ser maior que zero.');
      }

      const payload: PayInvoicePayload = {
        accountId,
        paymentAmount: parsedAmount,
      };

      await payInvoiceApi(token, invoice.id, payload);
      onInvoicePaid();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Falha ao processar pagamento da fatura.');
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
          <div className="h-12 w-12 rounded-2xl bg-blue-50 border-2 border-blue-200 text-[#026CD6] flex items-center justify-center shadow-[0_3px_0_0_#BFDBFE]">
            <DollarSign className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800">Pagar Fatura</h2>
            <p className="text-xs sm:text-sm font-bold text-slate-400">
              {cardName} • Ref. {invoice.referenceMonth}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border-2 border-[#FF4B4B] flex items-center gap-2 text-xs sm:text-sm font-bold text-[#EA2B2B]">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 rounded-2xl bg-blue-50/50 border-2 border-blue-200 text-xs font-bold text-slate-600 space-y-1.5">
            <div className="flex justify-between items-center">
              <span>Vencimento da Fatura:</span>
              <span className="font-black text-slate-800">{invoice.dueDate}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Status Atual:</span>
              <span className="font-black px-2 py-0.5 rounded-full bg-amber-100 text-[#FF9600] border border-[#FFC800] text-[11px]">{invoice.status}</span>
            </div>
            <p className="text-[11px] font-semibold text-slate-400 pt-2 border-t border-blue-200">
              * Liquidação de passivo financeiro. Previne dupla contagem contábil de compras.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500">Conta para Débito</label>
            <select
              required
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:border-[#026CD6] focus:bg-white transition-all"
            >
              <option value="">Selecione uma conta bancária...</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500">Valor do Pagamento (R$)</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0,00"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-black text-slate-800 focus:outline-none focus:border-[#026CD6] focus:bg-white transition-all"
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
              disabled={loading || accounts.length === 0}
              className="btn-duo btn-duo-green px-5 py-2.5 text-xs sm:text-sm font-black disabled:opacity-50"
            >
              {loading ? 'Processando...' : 'Confirmar Pagamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
