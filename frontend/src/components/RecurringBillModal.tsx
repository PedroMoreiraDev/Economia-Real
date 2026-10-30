import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, X, AlertCircle, CheckCircle2, CreditCard as CardIcon, Sparkles, Repeat } from 'lucide-react';
import { Category, Account } from '../types/financial';
import { CreditCard } from '../types/card';
import { RecurringBill, RecurringFrequency, CreateRecurringBillPayload, UpdateRecurringBillPayload } from '../types/recurring';
import { createRecurringBillApi, updateRecurringBillApi, payRecurringBillApi } from '../services/recurringApi';
import { createCategoryApi } from '../services/financialApi';
import { CategoryCombobox } from './CategoryCombobox';
import { CurrencyInput } from './CurrencyInput';
import { RecurringMonthsPicker } from './RecurringMonthsPicker';
import { useAuth } from '../context/AuthContext';

function getCurrentMonthStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

interface RecurringBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  accounts?: Account[];
  creditCards: CreditCard[];
  billToEdit?: RecurringBill | null;
  onSuccess: () => void;
  defaultMonth?: string;
}

export const RecurringBillModal: React.FC<RecurringBillModalProps> = ({
  isOpen,
  onClose,
  categories,
  accounts = [],
  creditCards,
  billToEdit,
  onSuccess,
  defaultMonth,
}) => {
  const { token } = useAuth();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('MONTHLY');
  const [dayOfMonth, setDayOfMonth] = useState('10');
  const [categoryId, setCategoryId] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [paymentSourceType, setPaymentSourceType] = useState<'direct' | 'card'>('direct');
  const [creditCardId, setCreditCardId] = useState('');
  const [active, setActive] = useState(true);

  // Lançamento imediato e replicação para meses subsequentes
  const [autoLaunch, setAutoLaunch] = useState(false);
  const [launchMonth, setLaunchMonth] = useState(() => defaultMonth || getCurrentMonthStr());
  const [replicateMonths, setReplicateMonths] = useState<number>(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (billToEdit) {
      setDescription(billToEdit.description);
      setAmount(billToEdit.amount.toString());
      setFrequency(billToEdit.frequency);
      setDayOfMonth(billToEdit.dayOfMonth.toString());
      setCategoryId(billToEdit.categoryId || '');
      const matched = categories.find((c) => c.id === billToEdit.categoryId);
      setCategoryName(matched ? matched.name : '');
      setActive(billToEdit.active);

      if (billToEdit.creditCardId) {
        setPaymentSourceType('card');
        setCreditCardId(billToEdit.creditCardId);
      } else {
        setPaymentSourceType('direct');
        setCreditCardId('');
      }
      setAutoLaunch(false);
    } else {
      setDescription('');
      setAmount('');
      setFrequency('MONTHLY');
      setDayOfMonth('10');
      setCategoryId('');
      setCategoryName('');
      setActive(true);
      setPaymentSourceType('direct');
      setCreditCardId(creditCards[0]?.id || '');
      setAutoLaunch(false);
      setLaunchMonth(defaultMonth || getCurrentMonthStr());
      setReplicateMonths(1);
    }
    setError(null);
  }, [billToEdit, isOpen, categories, creditCards, defaultMonth]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setError(null);
    setLoading(true);

    try {
      if (!description.trim()) {
        throw new Error('Informe o nome ou descrição da despesa/assinatura.');
      }

      const numAmount = parseFloat(amount.replace(',', '.'));
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error('O valor deve ser um número positivo.');
      }

      const numDay = parseInt(dayOfMonth, 10);
      if (isNaN(numDay) || numDay < 1 || numDay > 31) {
        throw new Error('O dia do vencimento deve estar entre 1 e 31.');
      }

      const targetAccountId = paymentSourceType === 'direct' && accounts.length > 0 ? accounts[0].id : null;
      const targetCardId = paymentSourceType === 'card' && creditCardId ? creditCardId : null;

      let finalCategoryId = categoryId;
      if (!finalCategoryId && categoryName.trim()) {
        const matched = categories.find(
          (c) => c.name.toLowerCase() === categoryName.trim().toLowerCase()
        );
        if (matched) {
          finalCategoryId = matched.id;
        } else {
          const newCat = await createCategoryApi(token, {
            name: categoryName.trim(),
          });
          finalCategoryId = newCat.id;
        }
      }

      if (billToEdit) {
        const payload: UpdateRecurringBillPayload = {
          description: description.trim(),
          amount: numAmount,
          frequency,
          dayOfMonth: numDay,
          categoryId: finalCategoryId || null,
          accountId: targetAccountId,
          creditCardId: targetCardId,
          active,
        };
        await updateRecurringBillApi(token, billToEdit.id, payload);
      } else {
        const payload: CreateRecurringBillPayload = {
          description: description.trim(),
          amount: numAmount,
          frequency,
          dayOfMonth: numDay,
          categoryId: finalCategoryId || null,
          accountId: targetAccountId,
          creditCardId: targetCardId,
        };
        const createdBill = await createRecurringBillApi(token, payload);

        // Se o usuário optou por já lançar no extrato financeiro agora
        if (autoLaunch && createdBill?.id) {
          const [launchY, launchM] = launchMonth.split('-');
          // Garantir dia válido para o mês selecionado
          const maxDays = new Date(parseInt(launchY, 10), parseInt(launchM, 10), 0).getDate();
          const validDay = Math.min(numDay, maxDays);
          const formattedDate = `${launchMonth}-${String(validDay).padStart(2, '0')}`;

          await payRecurringBillApi(token, createdBill.id, {
            paymentDate: formattedDate,
            creditCardId: targetCardId || undefined,
            replicateMonths: replicateMonths > 1 ? replicateMonths : 1,
          });
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar despesa recorrente.');
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 p-4 sm:p-8 shadow-2xl max-h-[90dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 sm:top-5 right-4 sm:right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        <div className="flex items-center space-x-3.5 mb-5 sm:mb-6">
          <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#026CD6] dark:text-sky-400 border-2 border-blue-200 dark:border-blue-800 shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-2xl font-black text-slate-800 dark:text-white">
              {billToEdit ? 'Editar Assinatura / Conta' : 'Nova Assinatura / Conta Fixa'}
            </h2>
            <p className="text-xs sm:text-sm font-bold text-slate-400 dark:text-slate-400">
              Automatize a previsão de despesas fixas recorrentes
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 sm:mb-5 flex items-center space-x-2.5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border-2 border-[#FF4B4B] dark:border-rose-800 text-[#EA2B2B] dark:text-rose-300 text-xs sm:text-sm font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {billToEdit && (
          <div className="mb-4 sm:mb-5 flex items-start space-x-2.5 p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border-2 border-blue-200 dark:border-blue-800 text-[#026CD6] dark:text-sky-300 text-xs sm:text-sm font-bold">
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Ao atualizar, todos os lançamentos desta despesa no extrato (mês atual e meses futuros) serão atualizados automaticamente com os novos dados.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Descrição / Serviço
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Netflix, Aluguel, Internet, Academia"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold placeholder-slate-400 focus:outline-none focus:border-[#58CC02] focus:bg-white dark:focus:bg-slate-800 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Valor Recorrente (R$)
              </label>
              <CurrencyInput
                required
                placeholder="0,00"
                value={amount}
                onChangeValue={(val) => setAmount(val > 0 ? val.toString() : '')}
                className="py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold placeholder-slate-400 focus:border-[#026CD6] focus:bg-white dark:focus:bg-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Dia do Vencimento
              </label>
              <input
                type="number"
                min="1"
                max="31"
                required
                placeholder="1 a 31"
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold placeholder-slate-400 focus:outline-none focus:border-[#58CC02] focus:bg-white dark:focus:bg-slate-800 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Frequência
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold focus:outline-none focus:border-[#58CC02] focus:bg-white dark:focus:bg-slate-800 transition-all"
              >
                <option value="MONTHLY">Mensal</option>
                <option value="WEEKLY">Semanal</option>
                <option value="YEARLY">Anual</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Categoria
              </label>
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
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Forma de Pagamento
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
              <button
                type="button"
                onClick={() => setPaymentSourceType('direct')}
                className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-2xl border-2 text-xs font-black transition-all ${
                  paymentSourceType === 'direct'
                    ? 'bg-[#EBF7FF] dark:bg-blue-950/60 border-[#1CB0F6] dark:border-blue-700 text-[#1899D6] dark:text-sky-300 shadow-[0_3px_0_0_#1899D6] dark:shadow-none'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span>À Vista / Pix / Boleto</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentSourceType('card')}
                className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-2xl border-2 text-xs font-black transition-all ${
                  paymentSourceType === 'card'
                    ? 'bg-purple-50 dark:bg-purple-950/60 border-[#CE82FF] dark:border-purple-700 text-[#A64BFF] dark:text-purple-300 shadow-[0_3px_0_0_#A64BFF] dark:shadow-none'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <CardIcon className="w-3.5 h-3.5" />
                <span>Cartão de Crédito</span>
              </button>
            </div>

            {paymentSourceType === 'card' && (
              <select
                value={creditCardId}
                onChange={(e) => setCreditCardId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold focus:outline-none focus:border-[#58CC02] focus:bg-white dark:focus:bg-slate-800 transition-all"
              >
                <option value="">Selecione um cartão cadastrado...</option>
                {creditCards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.name} (Fecha dia {card.closingDay})
                  </option>
                ))}
              </select>
            )}
          </div>

          {!billToEdit && (
            <div className={`p-3.5 rounded-2xl transition-all space-y-3 ${
              autoLaunch
                ? 'bg-blue-50/80 dark:!bg-[#0F172A] border-2 border-blue-200/90 dark:!border-blue-800'
                : 'bg-slate-50 dark:!bg-[#0F172A] border-2 border-slate-200 dark:!border-slate-800'
            }`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl shrink-0 transition-colors ${
                    autoLaunch ? 'bg-blue-100 dark:!bg-[#1E293B] text-[#026CD6] dark:!text-sky-300' : 'bg-slate-200 dark:!bg-slate-800 text-slate-500 dark:!text-slate-400'
                  }`}>
                    <Repeat className="h-4 w-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-black text-slate-800 dark:!text-white block">
                      Custo Fixo Recorrente
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 dark:!text-slate-400 block">
                      Repetir automaticamente nos meses seguintes (assinatura, mensalidade, conta fixa)
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoLaunch(!autoLaunch)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    autoLaunch ? 'bg-[#026CD6]' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                  role="switch"
                  aria-checked={autoLaunch}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      autoLaunch ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {autoLaunch && (
                <div className="space-y-3 pt-3 border-t border-blue-200/70 dark:!border-slate-800 animate-fade-in">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:!text-slate-400 mb-1">
                      Mês de Início da Repetição
                    </label>
                    <input
                      type="month"
                      value={launchMonth}
                      onChange={(e) => setLaunchMonth(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:!bg-slate-900 border-2 border-slate-200 dark:!border-slate-700 text-xs sm:text-sm font-bold text-slate-800 dark:!text-white focus:outline-none focus:border-[#026CD6]"
                    />
                  </div>

                  <div className="pt-1">
                    <RecurringMonthsPicker
                      months={replicateMonths}
                      onChangeMonths={setReplicateMonths}
                      startDateStr={`${launchMonth}-01`}
                      theme="bill"
                      label="Quantidade de meses a projetar este custo fixo"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {billToEdit && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs sm:text-sm font-black text-slate-800 block">
                  Status da Assinatura
                </span>
                <span className="text-[11px] font-bold text-slate-500 block">
                  {active ? 'Assinatura ativa e computada nas previsões' : 'Assinatura pausada / inativa'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActive(!active)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  active ? 'bg-[#58CC02]' : 'bg-slate-300'
                }`}
                role="switch"
                aria-checked={active}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    active ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}

          <div className="pt-3 flex space-x-3">
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
              className="btn-duo btn-duo-purple flex-1 py-3 text-xs sm:text-sm font-black flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span>Salvando...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>{billToEdit ? 'Atualizar' : 'Salvar Assinatura'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
