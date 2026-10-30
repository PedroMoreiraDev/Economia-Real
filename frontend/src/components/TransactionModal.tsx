import React, { useState, useEffect } from 'react';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, X, AlertCircle, Repeat } from 'lucide-react';
import { Account, Category, CreateTransactionPayload, UpdateTransactionPayload, Transaction, TransactionType } from '../types/financial';
import { createTransactionApi, updateTransactionApi, createCategoryApi } from '../services/financialApi';
import { CategoryCombobox } from './CategoryCombobox';
import { CurrencyInput } from './CurrencyInput';
import { RecurringMonthsPicker } from './RecurringMonthsPicker';
import { useAuth } from '../context/AuthContext';
import { cleanTransactionNotes } from '../utils/recurringNotes';

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

const extractCleanNotes = (rawNotes?: string, description?: string) => {
  return cleanTransactionNotes(rawNotes, description);
};

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
  const [isRecurring, setIsRecurring] = useState(false);
  const [replicateMonths, setReplicateMonths] = useState(12);
  const [updateFutureRecurring, setUpdateFutureRecurring] = useState(true);
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
      setNotes(extractCleanNotes(transactionToEdit.notes, transactionToEdit.description));
      const isRec = !!(transactionToEdit.notes && (
        transactionToEdit.notes.includes('RECURRING_INCOME:') ||
        transactionToEdit.notes.includes('RECURRING_EXPENSE:') ||
        transactionToEdit.notes.includes('RECURRING_BILL:')
      ));
      setIsRecurring(isRec);
      setUpdateFutureRecurring(true);
    } else {
      const startType = initialType || 'INCOME';
      setType(startType);
      setDescription('');
      setAmount('');
      setAccrualDate(defaultDate || new Date().toISOString().split('T')[0]);
      setAccountId(accounts.length > 0 ? accounts[0].id : '');
      setDestinationAccountId('');
      setIsRecurring(false);
      setReplicateMonths(12);
      setUpdateFutureRecurring(true);
      
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
        replicateMonths: (!transactionToEdit && isRecurring && (type === 'INCOME' || type === 'EXPENSE')) ? replicateMonths : undefined,
      };

      if (transactionToEdit) {
        const isRec = !!(transactionToEdit.notes && (
          transactionToEdit.notes.includes('RECURRING_INCOME:') ||
          transactionToEdit.notes.includes('RECURRING_EXPENSE:') ||
          transactionToEdit.notes.includes('RECURRING_BILL:')
        ));
        const updatePayload: UpdateTransactionPayload = {
          ...payload,
          updateFutureRecurring: isRec ? updateFutureRecurring : undefined,
        };
        await updateTransactionApi(token, transactionToEdit.id, updatePayload);
      } else {
        await createTransactionApi(token, payload);
      }

      setDescription('');
      setAmount('');
      setCategoryId('');
      setCategoryName('');
      setNotes('');
      setIsRecurring(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        className="w-full max-w-lg rounded-3xl bg-white dark:!bg-[#0F172A] border-2 border-slate-200 dark:!border-slate-800 shadow-2xl p-5 sm:p-8 relative max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Fechar"
        >
          <X className="h-5 w-5 stroke-[2.5]" />
        </button>

        <div className="mb-5">
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:!text-white">
            {transactionToEdit ? 'Editar Movimentação' : 'Nova Movimentação'}
          </h2>
          <p className="text-xs sm:text-sm font-bold text-slate-400">
            {transactionToEdit ? 'Altere descrição, categoria, valor ou datas do lançamento' : 'Registre entradas, saídas ou transferências entre contas'}
          </p>
        </div>

        {/* Abas de Tipo Estilo Duolingo */}
        <div className="flex bg-slate-100 dark:!bg-slate-800/80 p-1.5 rounded-2xl mb-6 border-2 border-slate-200/80 dark:!border-slate-700 gap-1.5">
          <button
            type="button"
            onClick={() => {
              setType('INCOME');
              setError(null);
              if (!categoryId && !categoryName) {
                const incomeCat = categories.find(c =>
                  c.name.toLowerCase().includes('salário') ||
                  c.name.toLowerCase().includes('renda')
                );
                if (incomeCat) {
                  setCategoryId(incomeCat.id);
                  setCategoryName(incomeCat.name);
                }
              }
            }}
            className={`flex-1 py-2 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              type === 'INCOME'
                ? 'bg-[#58CC02] text-white shadow-[0_3px_0_0_#46A302]'
                : 'text-slate-600 dark:!text-slate-300 hover:text-slate-800 dark:hover:!text-white hover:bg-white/60 dark:hover:!bg-slate-700/60'
            }`}
          >
            <ArrowUpRight className="h-4 w-4 stroke-[3]" />
            Receita
          </button>
          <button
            type="button"
            onClick={() => {
              setType('EXPENSE');
              setError(null);
              if (categoryName.toLowerCase().includes('salário') || categoryName.toLowerCase().includes('renda')) {
                setCategoryId('');
                setCategoryName('');
              }
            }}
            className={`flex-1 py-2 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              type === 'EXPENSE'
                ? 'bg-[#FF4B4B] text-white shadow-[0_3px_0_0_#EA2B2B]'
                : 'text-slate-600 dark:!text-slate-300 hover:text-slate-800 dark:hover:!text-white hover:bg-white/60 dark:hover:!bg-slate-700/60'
            }`}
          >
            <ArrowDownLeft className="h-4 w-4 stroke-[3]" />
            Despesa
          </button>
          {accounts.length > 1 && (
            <button
              type="button"
              onClick={() => { setType('TRANSFER'); setError(null); }}
              className={`flex-1 py-2 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                type === 'TRANSFER'
                  ? 'bg-[#1CB0F6] text-white shadow-[0_3px_0_0_#1899D6]'
                  : 'text-slate-600 dark:!text-slate-300 hover:text-slate-800 dark:hover:!text-white hover:bg-white/60 dark:hover:!bg-slate-700/60'
              }`}
            >
              <ArrowLeftRight className="h-4 w-4 stroke-[3]" />
              Transferência
            </button>
          )}
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:!bg-[#0F172A] border-2 border-[#FF4B4B] flex items-center gap-2 text-xs sm:text-sm font-bold text-[#EA2B2B] dark:!text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:!text-slate-400">Valor (R$)</label>
              <CurrencyInput
                required
                placeholder="0,00"
                value={amount}
                onChangeValue={(val) => setAmount(val > 0 ? val.toString() : '')}
                className="py-2.5 bg-slate-50 dark:!bg-slate-900 border-2 border-slate-200 dark:!border-slate-700 rounded-2xl text-base font-black text-slate-800 dark:!text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-[#026CD6] focus:bg-white dark:focus:!bg-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:!text-slate-400">
                {type === 'INCOME'
                  ? 'Data do Recebimento'
                  : type === 'EXPENSE'
                  ? 'Data da Compra ou Pagamento'
                  : 'Data da Transferência'}
              </label>
              <input
                type="date"
                required
                value={accrualDate}
                onChange={(e) => setAccrualDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:!bg-slate-900 border-2 border-slate-200 dark:!border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:!text-white focus:outline-none focus:border-[#58CC02] focus:bg-white dark:focus:!bg-slate-900 transition-all"
              />
              <span className="block text-[11px] font-bold text-slate-400">
                Data em que o valor realmente entrou ou saiu da sua conta.
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:!text-slate-400">Descrição</label>
            <input
              type="text"
              required
              placeholder="Ex: Almoço de negócios, Salário mensal, Supermercado"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:!bg-slate-900 border-2 border-slate-200 dark:!border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:!text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#58CC02] focus:bg-white dark:focus:!bg-slate-900 transition-all"
            />
          </div>

          {/* Seletor de Recorrência (Receitas e Despesas) ao Adicionar */}
          {(type === 'INCOME' || type === 'EXPENSE') && !transactionToEdit && (
            <div className={`p-3.5 rounded-2xl transition-all space-y-3 ${
              type === 'INCOME'
                ? 'bg-emerald-50/80 dark:!bg-[#0F172A] border-2 border-emerald-200/90 dark:!border-emerald-800'
                : 'bg-rose-50/80 dark:!bg-[#0F172A] border-2 border-rose-200/90 dark:!border-rose-800'
            }`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl shrink-0 ${
                    type === 'INCOME'
                      ? 'bg-emerald-100 dark:!bg-[#1E293B] text-emerald-700 dark:!text-emerald-400'
                      : 'bg-rose-100 dark:!bg-[#1E293B] text-rose-700 dark:!text-rose-400'
                  }`}>
                    <Repeat className="h-4 w-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-black text-slate-800 dark:!text-white block">
                      {type === 'INCOME' ? 'Renda Recorrente' : 'Despesa Recorrente'}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 dark:!text-slate-400 block">
                      {type === 'INCOME'
                        ? 'Repetir automaticamente nos meses seguintes (salário, aluguel, pró-labore)'
                        : 'Repetir automaticamente nos meses seguintes (mensalidade, condomínio, internet)'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRecurring(!isRecurring)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isRecurring
                      ? (type === 'INCOME' ? 'bg-[#58CC02]' : 'bg-[#FF4B4B]')
                      : 'bg-slate-300 dark:!bg-slate-700'
                  }`}
                  role="switch"
                  aria-checked={isRecurring}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      isRecurring ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {isRecurring && (
                <div className="pt-2 border-t border-slate-200/70 dark:!border-slate-800">
                  <RecurringMonthsPicker
                    months={replicateMonths}
                    onChangeMonths={setReplicateMonths}
                    startDateStr={accrualDate}
                    theme={type === 'INCOME' ? 'income' : 'expense'}
                    label={`Quantidade de meses a projetar esta ${type === 'INCOME' ? 'receita' : 'despesa'}`}
                  />
                </div>
              )}
            </div>
          )}

          {/* Opção ao Editar Transação Recorrente (Receita ou Despesa) */}
          {transactionToEdit && transactionToEdit.notes && (
            transactionToEdit.notes.includes('RECURRING_INCOME:') ||
            transactionToEdit.notes.includes('RECURRING_EXPENSE:') ||
            transactionToEdit.notes.includes('RECURRING_BILL:')
          ) && (
            <div className="p-3.5 bg-amber-50/90 dark:!bg-[#0F172A] border-2 border-amber-300 dark:!border-amber-800 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:!text-amber-400">
                <Repeat className="h-4 w-4 shrink-0 stroke-[2.5]" />
                <span className="text-xs font-black uppercase tracking-wider">
                  {transactionToEdit.notes.includes('RECURRING_INCOME:')
                    ? 'Renda Recorrente Vinculada'
                    : (transactionToEdit.notes.includes('RECURRING_BILL:') ? 'Custo Fixo Recorrente Vinculado' : 'Despesa Recorrente Vinculada')}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-600 dark:!text-slate-300">
                Este lançamento pertence a uma {transactionToEdit.notes.includes('RECURRING_INCOME:') ? 'receita' : 'despesa'} recorrente projetada nos meses futuros.
              </p>
              <label className="flex items-start gap-2.5 cursor-pointer pt-1 bg-white/70 dark:!bg-[#1E293B] p-2.5 rounded-xl border border-amber-200/80 dark:!border-amber-900/60">
                <input
                  type="checkbox"
                  checked={updateFutureRecurring}
                  onChange={(e) => setUpdateFutureRecurring(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                />
                <span className="text-xs font-bold text-slate-800 dark:!text-slate-200 leading-tight">
                  Atualizar <strong>esta e todas as {transactionToEdit.notes.includes('RECURRING_INCOME:') ? 'receitas' : 'despesas'} futuras</strong> deste grupo
                  <span className="block text-[11px] font-medium text-slate-500 dark:!text-slate-400 mt-0.5">
                    O histórico dos meses passados será mantido intacto.
                  </span>
                </span>
              </label>
            </div>
          )}

          {type === 'TRANSFER' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:!text-slate-400">Conta de Origem</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:!bg-slate-900 border-2 border-slate-200 dark:!border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:!text-white focus:outline-none focus:border-[#58CC02] focus:bg-white dark:focus:!bg-slate-900 transition-all"
                >
                  <option value="">Selecione uma conta...</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:!text-slate-400">Conta de Destino</label>
                <select
                  required
                  value={destinationAccountId}
                  onChange={(e) => setDestinationAccountId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:!bg-slate-900 border-2 border-slate-200 dark:!border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:!text-white focus:outline-none focus:border-[#58CC02] focus:bg-white dark:focus:!bg-slate-900 transition-all"
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
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:!text-slate-400">Categoria</label>
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
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:!text-slate-400">Observações (Opcional)</label>
            <input
              type="text"
              placeholder="Anotações adicionais"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:!bg-slate-900 border-2 border-slate-200 dark:!border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:!text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#58CC02] focus:bg-white dark:focus:!bg-slate-900 transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-slate-100 dark:!border-slate-800">
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
