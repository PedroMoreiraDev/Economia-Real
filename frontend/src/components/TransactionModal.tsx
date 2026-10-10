import React, { useState, useEffect } from 'react';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, X, AlertCircle } from 'lucide-react';
import { Account, Category, CreateTransactionPayload, UpdateTransactionPayload, Transaction, TransactionType } from '../types/financial';
import { createTransactionApi, updateTransactionApi, createCategoryApi } from '../services/financialApi';
import { CategoryCombobox } from './CategoryCombobox';
import { useAuth } from '../context/AuthContext';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: Category[];
  onTransactionCreated: () => void;
  transactionToEdit?: Transaction | null;
  initialType?: TransactionType;
  defaultDate?: string;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  accounts,
  categories,
  onTransactionCreated,
  transactionToEdit,
  initialType = 'EXPENSE',
  defaultDate,
}) => {
  const { token } = useAuth();
  const [type, setType] = useState<TransactionType>(initialType);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [accrualDate, setAccrualDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState('');
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type === 'INVOICE_PAYMENT' ? 'EXPENSE' : transactionToEdit.type);
      setDescription(transactionToEdit.description);
      setAmount(transactionToEdit.amount.toString());
      setAccrualDate(transactionToEdit.accrualDate);
      setAccountId(transactionToEdit.accountId || (accounts.length > 0 ? accounts[0].id : ''));
      setDestinationAccountId(transactionToEdit.destinationAccountId || '');
      setCategoryId(transactionToEdit.categoryId || '');
      if (transactionToEdit.categoryId) {
        const cat = categories.find(c => c.id === transactionToEdit.categoryId);
        setCategoryName(cat ? cat.name : '');
      } else {
        setCategoryName('');
      }
      setNotes(transactionToEdit.notes || '');
    } else {
      const startType = initialType || 'EXPENSE';
      setType(startType);
      setDescription('');
      setAmount('');
      setAccrualDate(defaultDate || new Date().toISOString().split('T')[0]);
      setAccountId(accounts.length > 0 ? accounts[0].id : '');
      setDestinationAccountId('');
      
      if (startType === 'INCOME') {
        const incomeCat = categories.find(c => 
          c.name.toLowerCase().includes('salário') || 
          c.name.toLowerCase().includes('renda')
        );
        if (incomeCat) {
          setCategoryId(incomeCat.id);
          setCategoryName(incomeCat.name);
        } else {
          setCategoryId('');
          setCategoryName('');
        }
      } else {
        setCategoryId('');
        setCategoryName('');
      }
      setNotes('');
    }
  }, [transactionToEdit, isOpen, categories, initialType, accounts, defaultDate]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setLoading(true);

    try {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error('O valor deve ser maior que zero.');
      }

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

      const payload: CreateTransactionPayload = {
        type,
        amount: parsedAmount,
        accrualDate,
        description: description.trim(),
        accountId: accountId || undefined,
        destinationAccountId: type === 'TRANSFER' ? (destinationAccountId || undefined) : undefined,
        categoryId: finalCategoryId || undefined,
        notes: notes.trim() || undefined,
      };

      if (transactionToEdit) {
        await updateTransactionApi(token, transactionToEdit.id, payload as UpdateTransactionPayload);
      } else {
        await createTransactionApi(token, payload);
      }

      setDescription('');
      setAmount('');
      setCategoryId('');
      setCategoryName('');
      setNotes('');
      onTransactionCreated();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Falha ao registrar movimentação.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg rounded-3xl bg-white border-2 border-slate-200 shadow-2xl p-6 sm:p-8 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="Fechar"
        >
          <X className="h-5 w-5 stroke-[2.5]" />
        </button>

        <div className="mb-5">
          <h2 className="text-xl sm:text-2xl font-black text-slate-800">
            {transactionToEdit ? 'Editar Movimentação' : 'Nova Movimentação'}
          </h2>
          <p className="text-xs sm:text-sm font-bold text-slate-400">
            {transactionToEdit ? 'Altere descrição, categoria, valor ou datas do lançamento' : 'Registre entradas, saídas ou transferências entre contas'}
          </p>
        </div>

        {/* Abas de Tipo Estilo Duolingo */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6 border-2 border-slate-200/80 gap-1.5">
          <button
            type="button"
            onClick={() => { setType('EXPENSE'); setError(null); }}
            className={`flex-1 py-2 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              type === 'EXPENSE'
                ? 'bg-[#FF4B4B] text-white shadow-[0_3px_0_0_#EA2B2B]'
                : 'text-slate-600 hover:text-slate-800 hover:bg-white/60'
            }`}
          >
            <ArrowDownLeft className="h-4 w-4 stroke-[3]" />
            Despesa
          </button>
          <button
            type="button"
            onClick={() => { setType('INCOME'); setError(null); }}
            className={`flex-1 py-2 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              type === 'INCOME'
                ? 'bg-[#58CC02] text-white shadow-[0_3px_0_0_#46A302]'
                : 'text-slate-600 hover:text-slate-800 hover:bg-white/60'
            }`}
          >
            <ArrowUpRight className="h-4 w-4 stroke-[3]" />
            Receita
          </button>
          {accounts.length > 1 && (
            <button
              type="button"
              onClick={() => { setType('TRANSFER'); setError(null); }}
              className={`flex-1 py-2 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                type === 'TRANSFER'
                  ? 'bg-[#1CB0F6] text-white shadow-[0_3px_0_0_#1899D6]'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-white/60'
              }`}
            >
              <ArrowLeftRight className="h-4 w-4 stroke-[3]" />
              Transferência
            </button>
          )}
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border-2 border-[#FF4B4B] flex items-center gap-2 text-xs sm:text-sm font-bold text-[#EA2B2B]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-base font-black text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#58CC02] focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500">Data de Competência</label>
              <input
                type="date"
                required
                value={accrualDate}
                onChange={(e) => setAccrualDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:border-[#58CC02] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500">Descrição</label>
            <input
              type="text"
              required
              placeholder="Ex: Almoço de negócios, Salário mensal, Supermercado"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#58CC02] focus:bg-white transition-all"
            />
          </div>

          {type === 'TRANSFER' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500">Conta de Origem</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:border-[#58CC02] focus:bg-white transition-all"
                >
                  <option value="">Selecione uma conta...</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500">Conta de Destino</label>
                <select
                  required
                  value={destinationAccountId}
                  onChange={(e) => setDestinationAccountId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:border-[#58CC02] focus:bg-white transition-all"
                >
                  <option value="">Selecione a conta destino...</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500">Categoria</label>
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
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500">Observações (Opcional)</label>
            <input
              type="text"
              placeholder="Anotações adicionais"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#58CC02] focus:bg-white transition-all"
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
              className={`btn-duo px-5 py-2.5 text-xs sm:text-sm font-black disabled:opacity-50 ${
                type === 'EXPENSE'
                  ? 'btn-duo-red'
                  : type === 'INCOME'
                  ? 'btn-duo-green'
                  : 'btn-duo-blue'
              }`}
            >
              {loading ? 'Processando...' : transactionToEdit ? 'Salvar Alterações' : 'Salvar Lançamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
