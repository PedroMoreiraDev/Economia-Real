import React, { useState } from 'react';
import { ShoppingBag, X, AlertCircle } from 'lucide-react';
import { CreditCard, CreatePurchasePayload } from '../types/card';
import { Category } from '../types/financial';
import { createPurchaseApi } from '../services/cardApi';
import { createCategoryApi } from '../services/financialApi';
import { CategoryCombobox } from './CategoryCombobox';
import { CurrencyInput } from './CurrencyInput';
import { useAuth } from '../context/AuthContext';

interface CreditCardPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: CreditCard[];
  categories: Category[];
  onPurchaseCreated: () => void;
}

export const CreditCardPurchaseModal: React.FC<CreditCardPurchaseModalProps> = ({
  isOpen,
  onClose,
  cards,
  categories,
  onPurchaseCreated,
}) => {
  const { token } = useAuth();
  const [cardId, setCardId] = useState('');
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [installments, setInstallments] = useState('1');
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !cardId) return;
    setError(null);
    setLoading(true);

    try {
      let finalCategoryId = categoryId;
      if (!finalCategoryId && categoryName.trim()) {
        const matched = categories.find(
          (c) => c.name.toLowerCase() === categoryName.trim().toLowerCase()
        );
        if (matched) {
          finalCategoryId = matched.id;
        } else {
          const newCategory = await createCategoryApi(token, {
            name: categoryName.trim(),
          });
          finalCategoryId = newCategory.id;
        }
      }

      const payload: CreatePurchasePayload = {
        description: description.trim(),
        totalAmount: parseFloat(totalAmount),
        installments: parseInt(installments, 10),
        purchaseDate,
        categoryId: finalCategoryId || undefined,
        notes: notes.trim() || undefined,
      };

      await createPurchaseApi(token, cardId, payload);
      setDescription('');
      setTotalAmount('');
      setInstallments('1');
      setCategoryId('');
      setCategoryName('');
      setNotes('');
      onPurchaseCreated();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Falha ao registrar compra no cartão.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-2xl p-4 sm:p-8 relative max-h-[90dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 sm:top-5 right-4 sm:right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Fechar"
        >
          <X className="h-5 w-5 stroke-[2.5]" />
        </button>

        <div className="flex items-center gap-3 sm:gap-3.5 mb-5 sm:mb-6">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border-2 border-[#CE82FF] dark:border-purple-800 text-[#A64BFF] dark:text-purple-400 flex items-center justify-center shadow-[0_3px_0_0_#A64BFF] dark:shadow-none shrink-0">
            <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-lg sm:text-2xl font-black text-slate-800 dark:text-white">Compra no Cartão</h2>
            <p className="text-xs sm:text-sm font-bold text-slate-400 dark:text-slate-400">À vista ou parcelada com cálculo exato de centavos</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 sm:mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border-2 border-[#FF4B4B] dark:border-rose-800 flex items-center gap-2 text-xs sm:text-sm font-bold text-[#EA2B2B] dark:text-rose-300">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Selecione o Cartão</label>
            <select
              required
              value={cardId}
              onChange={(e) => setCardId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#CE82FF] focus:bg-white dark:focus:bg-slate-800 transition-all"
            >
              <option value="">Selecione...</option>
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (Fecha dia {c.closingDay} • Vence dia {c.dueDay})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Valor Total (R$)</label>
              <CurrencyInput
                required
                placeholder="0,00"
                value={totalAmount}
                onChangeValue={(val) => setTotalAmount(val > 0 ? val.toString() : '')}
                className="py-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-black text-slate-800 dark:text-white focus:border-[#026CD6] focus:bg-white dark:focus:bg-slate-800"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Parcelas</label>
              <select
                value={installments}
                onChange={(e) => setInstallments(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#CE82FF] focus:bg-white dark:focus:bg-slate-800 transition-all"
              >
                {[...Array(48)].map((_, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {idx + 1}x {idx === 0 ? '(À vista)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Descrição</label>
              <input
                type="text"
                required
                placeholder="Ex: Notebook, Supermercado"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#CE82FF] focus:bg-white dark:focus:bg-slate-800 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Data da Compra</label>
              <input
                type="date"
                required
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#CE82FF] focus:bg-white dark:focus:bg-slate-800 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Categoria</label>
            <CategoryCombobox
              value={categoryId}
              categoryName={categoryName}
              onChange={(selectedId, selectedName) => {
                setCategoryId(selectedId);
                setCategoryName(selectedName);
              }}
              categories={categories}
              placeholder="Escreva ou escolha uma categoria..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="btn-duo btn-duo-white px-5 py-2.5 text-xs sm:text-sm font-black"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || cards.length === 0}
              className="btn-duo btn-duo-purple px-5 py-2.5 text-xs sm:text-sm font-black disabled:opacity-50"
            >
              {loading ? 'Processando...' : 'Lançar Compra'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
