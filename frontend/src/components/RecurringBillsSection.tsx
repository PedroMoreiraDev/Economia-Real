import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Calendar, 
  Plus, 
  AlertTriangle, 
  CheckCircle, 
  CreditCard as CardIcon, 
  Trash2, 
  Edit2, 
  Check, 
  Clock,
  X,
  Sparkles,
  Layers
} from 'lucide-react';
import { RecurringBill } from '../types/recurring';
import { Category, Account } from '../types/financial';
import { CreditCard } from '../types/card';
import { fetchRecurringBillsApi, deleteRecurringBillApi, payRecurringBillApi } from '../services/recurringApi';
import { RecurringBillModal } from './RecurringBillModal';
import { useAuth } from '../context/AuthContext';

function getCurrentMonthStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function formatMonthDisplay(monthStr?: string): string {
  if (!monthStr) return '';
  const [y, m] = monthStr.split('-');
  const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
  const raw = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

interface RecurringBillsSectionProps {
  categories: Category[];
  accounts: Account[];
  creditCards: CreditCard[];
  selectedMonth?: string;
  onDataChanged?: () => void;
}

export const RecurringBillsSection: React.FC<RecurringBillsSectionProps> = ({
  categories,
  accounts,
  creditCards,
  selectedMonth,
  onDataChanged,
}) => {
  const { token } = useAuth();
  const [bills, setBills] = useState<RecurringBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<RecurringBill | null>(null);

  const [billToLaunch, setBillToLaunch] = useState<RecurringBill | null>(null);
  const [launchMonth, setLaunchMonth] = useState<string>(() => selectedMonth || getCurrentMonthStr());
  const [replicateMonths, setReplicateMonths] = useState<number>(1);
  const [isLaunching, setIsLaunching] = useState<boolean>(false);

  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadBills = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await fetchRecurringBillsApi(
        token,
        selectedMonth ? `${selectedMonth}-01` : undefined
      );
      setBills(data);
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Erro ao carregar despesas recorrentes.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBills();
    if (selectedMonth) {
      setLaunchMonth(selectedMonth);
    }
  }, [token, selectedMonth]);

  const handleOpenLaunchModal = (bill: RecurringBill) => {
    setBillToLaunch(bill);
    setLaunchMonth(selectedMonth || getCurrentMonthStr());
    setReplicateMonths(1);
  };

  const handleConfirmLaunch = async () => {
    if (!token || !billToLaunch) return;
    setIsLaunching(true);
    try {
      const [launchY, launchM] = launchMonth.split('-');
      const maxDays = new Date(parseInt(launchY, 10), parseInt(launchM, 10), 0).getDate();
      const validDay = Math.min(billToLaunch.dayOfMonth, maxDays);
      const formattedDate = `${launchMonth}-${String(validDay).padStart(2, '0')}`;

      await payRecurringBillApi(token, billToLaunch.id, {
        paymentDate: formattedDate,
        creditCardId: billToLaunch.creditCardId || undefined,
        replicateMonths: replicateMonths > 1 ? replicateMonths : 1,
      });

      const monthName = formatMonthDisplay(launchMonth);
      const msg = replicateMonths > 1
        ? `Despesa "${billToLaunch.description}" lançada para os próximos ${replicateMonths} meses a partir de ${monthName}!`
        : `Despesa "${billToLaunch.description}" lançada com sucesso no mês de ${monthName}!`;

      setFeedbackMessage({ type: 'success', text: msg });
      setBillToLaunch(null);
      await loadBills();
      if (onDataChanged) onDataChanged();
      setTimeout(() => setFeedbackMessage(null), 5000);
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Erro ao lançar despesa.' });
    } finally {
      setIsLaunching(false);
    }
  };

  const handleDelete = async (bill: RecurringBill) => {
    if (!token) return;
    if (!window.confirm(`Deseja realmente remover a despesa fixa "${bill.description}" e todos os seus lançamentos no extrato (inclusive meses futuros)?`)) {
      return;
    }
    try {
      await deleteRecurringBillApi(token, bill.id);
      setFeedbackMessage({ type: 'success', text: `"${bill.description}" e seus lançamentos no extrato foram removidos com sucesso.` });
      await loadBills();
      if (onDataChanged) onDataChanged();
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Erro ao remover.' });
    }
  };

  const totalMonthlyCommitment = bills
    .filter((b) => b.active)
    .reduce((sum, b) => {
      if (b.frequency === 'YEARLY') return sum + b.amount / 12;
      if (b.frequency === 'WEEKLY') return sum + b.amount * 4;
      return sum + b.amount;
    }, 0);

  const dueSoonCount = bills.filter((b) => b.active && b.isDueSoon && !b.isPaidThisMonth).length;
  const paidThisMonthCount = bills.filter((b) => b.isPaidThisMonth).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#102D25] dark:text-[#E8E4D9] flex items-center space-x-2.5">
            <span className="p-2.5 rounded-xl bg-[#102D25] text-[#D4A94F] border border-[#D4A94F]/40">
              <Calendar className="w-5 h-5" />
            </span>
            <span>Assinaturas & Custos Fixos</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#526B61] dark:text-[#9AB3A8] font-semibold mt-1">
            Previsão sem surpresas: controle cada despesa recorrente com precisão
          </p>
        </div>

        <button
          onClick={() => {
            setEditingBill(null);
            setIsModalOpen(true);
          }}
          className="btn-duo btn-duo-purple px-4 py-2.5 text-xs flex items-center space-x-2"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nova Assinatura / Fixa</span>
        </button>
      </div>

      {feedbackMessage && (
        <div
          className={`flex items-center space-x-2.5 p-3.5 rounded-xl text-xs sm:text-sm font-bold border ${
            feedbackMessage.type === 'success'
              ? 'bg-[#E6EFEA] dark:bg-[#16382E] border-[#1C4939] text-[#102D25] dark:text-[#E8E4D9]'
              : 'bg-rose-50 border-[#B93838] text-[#B93838]'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5 shrink-0 text-[#1C4939] dark:text-[#D4A94F]" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-duo p-5 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#526B61] dark:text-[#9AB3A8]">
              Comprometimento Fixo
            </span>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#102D25] dark:text-[#E8E4D9] font-numeric">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalMonthlyCommitment)}
              </span>
            </div>
          </div>
          <span className="text-xs font-semibold text-[#526B61] dark:text-[#9AB3A8] mt-2 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#1C4939] dark:bg-[#D4A94F]"></span>
            <span>{bills.filter((b) => b.active).length} assinatura(s) ativas</span>
          </span>
        </div>

        <div className="card-duo p-5 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#526B61] dark:text-[#9AB3A8]">
              Vencendo em 7 Dias
            </span>
            <div className="mt-2 flex items-baseline space-x-2 font-numeric">
              <span
                className={`text-2xl sm:text-3xl font-extrabold ${
                  dueSoonCount > 0 ? 'text-[#D4A94F]' : 'text-[#102D25] dark:text-[#E8E4D9]'
                }`}
              >
                {dueSoonCount}
              </span>
              <span className="text-xs font-semibold text-[#526B61] dark:text-[#9AB3A8]">pendente(s)</span>
            </div>
          </div>
          <span className="text-xs font-semibold text-[#526B61] dark:text-[#9AB3A8] mt-2 flex items-center space-x-1.5">
            <span className={`w-2 h-2 rounded-full ${dueSoonCount > 0 ? 'bg-[#D4A94F] animate-pulse' : 'bg-[#829A90]'}`}></span>
            <span>{dueSoonCount > 0 ? 'Atenção ao prazo de vencimento' : 'Tudo em dia nesta semana'}</span>
          </span>
        </div>

        <div className="card-duo p-5 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#526B61] dark:text-[#9AB3A8]">
              Lançadas no Mês {selectedMonth ? `(${formatMonthDisplay(selectedMonth)})` : 'Atual'}
            </span>
            <div className="mt-2 flex items-baseline space-x-2 font-numeric">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#1C4939] dark:text-[#78C6A3]">
                {paidThisMonthCount}
              </span>
              <span className="text-xs font-semibold text-[#526B61] dark:text-[#9AB3A8]">de {bills.length} total</span>
            </div>
          </div>
          <span className="text-xs font-semibold text-[#1C4939] dark:text-[#78C6A3] mt-2 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#1C4939] dark:bg-[#78C6A3]"></span>
            <span>Sem risco de dupla contagem</span>
          </span>
        </div>
      </div>

      {/* Lista de Contas */}
      {loading ? (
        <div className="p-12 text-center text-[#526B61] dark:text-[#9AB3A8] font-bold text-sm card-duo">
          Carregando contas recorrentes...
        </div>
      ) : bills.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#FAF8F4] dark:bg-[#102D25] border border-dashed border-[#D5CFC0] dark:border-[#214E3E] text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#102D25] text-[#D4A94F] border border-[#D4A94F]/40 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-[#102D25] dark:text-[#E8E4D9] mb-1">Nenhuma conta recorrente cadastrada</h3>
          <p className="text-xs sm:text-sm font-medium text-[#526B61] dark:text-[#9AB3A8] max-w-sm mx-auto mb-6">
            Cadastre aluguel, internet, streaming ou academia para prever seus gastos sem surpresas.
          </p>
          <button
            onClick={() => {
              setEditingBill(null);
              setIsModalOpen(true);
            }}
            className="btn-duo btn-duo-purple px-5 py-2.5 text-xs inline-flex items-center space-x-2"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Cadastrar Primeira Conta Fixa</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bills.map((bill) => {
            const isDueSoon = bill.isDueSoon && !bill.isPaidThisMonth;
            return (
              <div
                key={bill.id}
                className={`card-duo p-5 relative flex flex-col justify-between transition-all duration-200 ${
                  !bill.active
                    ? 'opacity-60'
                    : isDueSoon
                    ? 'border-[#D4A94F] ring-1 ring-[#D4A94F]/30'
                    : bill.isPaidThisMonth
                    ? 'border-[#1C4939]/40 bg-[#E6EFEA]/40 dark:bg-[#16382E]/50'
                    : ''
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-base font-extrabold text-[#102D25] dark:text-[#E8E4D9] tracking-tight">{bill.description}</h4>
                        {!bill.active && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E2DDD0] text-[#526B61]">
                            Inativa
                          </span>
                        )}
                      </div>
                      <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
                        {bill.categoryName && (
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[#E6EFEA] dark:bg-[#16382E] text-[#1C4939] dark:text-[#78C6A3] border border-[#1C4939]/25">
                            {bill.categoryName}
                          </span>
                        )}
                        <span className="text-[11px] font-semibold text-[#526B61] dark:text-[#9AB3A8] flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>Dia {bill.dayOfMonth}</span>
                        </span>
                      </div>
                    </div>

                    <div className="text-right font-numeric">
                      <span className="text-lg font-extrabold text-[#102D25] dark:text-[#E8E4D9] block">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bill.amount)}
                      </span>
                      <span className="text-[10px] text-[#526B61] dark:text-[#9AB3A8] uppercase tracking-wider font-bold">
                        {bill.frequency === 'MONTHLY'
                          ? 'Mensal'
                          : bill.frequency === 'WEEKLY'
                          ? 'Semanal'
                          : 'Anual'}
                      </span>
                    </div>
                  </div>

                  {/* Meio de Pagamento */}
                  <div className="flex items-center space-x-2 text-xs font-semibold text-[#355248] dark:text-[#B8C7C0] mb-4 bg-[#EFECE3]/70 dark:bg-[#0D241D] border border-[#E2DDD0] dark:border-[#214E3E] p-2.5 rounded-xl">
                    {bill.creditCardName ? (
                      <>
                        <CardIcon className="w-4 h-4 text-[#D4A94F] shrink-0" />
                        <span className="truncate">Cartão: {bill.creditCardName}</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-[#1C4939] dark:bg-[#D4A94F] shrink-0"></span>
                        <span className="truncate">À Vista / Pix / Boleto</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Status no Mês e Ações */}
                <div className="pt-3 border-t border-[#E2DDD0] dark:border-[#214E3E] flex items-center justify-between gap-2">
                  <div>
                    {bill.isPaidThisMonth ? (
                      <span className="inline-flex items-center space-x-1 text-xs font-bold text-[#1C4939] dark:text-[#78C6A3]">
                        <CheckCircle className="w-4 h-4" />
                        <span>Lançado</span>
                      </span>
                    ) : isDueSoon ? (
                      <span className="inline-flex items-center space-x-1 text-xs font-bold text-[#9A7220] dark:text-[#D4A94F]">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Vence logo</span>
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-[#526B61] dark:text-[#9AB3A8]">
                        Vence {new Date(bill.nextDueDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {!bill.isPaidThisMonth && bill.active && (
                      <button
                        onClick={() => handleOpenLaunchModal(bill)}
                        title="Lançar no extrato financeiro"
                        className="btn-duo btn-duo-green px-2.5 py-1 text-xs flex items-center space-x-1"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Lançar</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditingBill(bill);
                        setIsModalOpen(true);
                      }}
                      title="Editar"
                      className="p-2 rounded-lg text-[#526B61] dark:text-[#9AB3A8] hover:text-[#102D25] dark:hover:text-[#E8E4D9] hover:bg-[#EFECE3] dark:hover:bg-[#16382E] transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(bill)}
                      title="Excluir"
                      className="p-2 rounded-lg text-[#526B61] dark:text-[#9AB3A8] hover:text-[#B93838] hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Confirmação de Lançamento com Replicação */}
      {billToLaunch && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-[#071511]/70 backdrop-blur-sm animate-fade-in overflow-y-auto"
          onClick={() => setBillToLaunch(null)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-[#FAF8F4] dark:bg-[#102D25] border border-[#D5CFC0] dark:border-[#214E3E] p-6 sm:p-7 shadow-2xl max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setBillToLaunch(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-[#526B61] hover:text-[#102D25] dark:text-[#9AB3A8] dark:hover:text-[#E8E4D9] transition-colors"
            >
              <X className="w-5 h-5 stroke-[2.3]" />
            </button>

            <div className="flex items-center space-x-3 mb-5">
              <div className="p-3 rounded-xl bg-[#102D25] text-[#D4A94F] border border-[#D4A94F]/40">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-[#102D25] dark:text-[#E8E4D9]">Lançar Despesa Fixa</h3>
                <p className="text-xs font-semibold text-[#526B61] dark:text-[#9AB3A8] font-numeric">
                  {billToLaunch.description} • {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(billToLaunch.amount)}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#526B61] dark:text-[#9AB3A8] mb-1.5">
                  Qual mês deseja lançar?
                </label>
                <input
                  type="month"
                  value={launchMonth}
                  onChange={(e) => setLaunchMonth(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#EFECE3] dark:bg-[#0D241D] border border-[#D5CFC0] dark:border-[#214E3E] text-[#102D25] dark:text-[#E8E4D9] font-bold focus:outline-none focus:border-[#1C4939] transition-all text-sm"
                />
                <span className="text-[11px] font-semibold text-[#526B61] dark:text-[#9AB3A8] mt-1 block">
                  Vencimento configurado para o dia {billToLaunch.dayOfMonth}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#526B61] dark:text-[#9AB3A8] mb-1.5">
                  Replicar para os meses seguintes?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Apenas neste mês (1 mês)', value: 1 },
                    { label: 'Próximos 3 meses', value: 3 },
                    { label: 'Próximos 6 meses', value: 6 },
                    { label: 'Próximos 12 meses (1 ano)', value: 12 },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setReplicateMonths(opt.value)}
                      className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition-all text-center ${
                        replicateMonths === opt.value
                          ? 'bg-[#102D25] text-[#D4A94F] border-[#D4A94F]/50'
                          : 'bg-[#EFECE3] dark:bg-[#0D241D] border-[#D5CFC0] dark:border-[#214E3E] text-[#526B61] dark:text-[#9AB3A8]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#EFECE3] dark:bg-[#16382E] border border-[#D5CFC0] dark:border-[#285C49] text-xs font-semibold text-[#102D25] dark:text-[#E8E4D9] flex items-start space-x-2">
                <Layers className="w-4 h-4 text-[#1C4939] dark:text-[#D4A94F] shrink-0 mt-0.5" />
                <span>
                  {replicateMonths === 1
                    ? `Será gerado 1 lançamento no extrato financeiro para ${formatMonthDisplay(launchMonth)}.`
                    : `Serão gerados ${replicateMonths} lançamentos no extrato (${formatMonthDisplay(launchMonth)} e os ${replicateMonths - 1} meses subsequentes).`}
                </span>
              </div>

              <div className="pt-2 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setBillToLaunch(null)}
                  disabled={isLaunching}
                  className="btn-duo btn-duo-white flex-1 py-3 text-xs sm:text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLaunch}
                  disabled={isLaunching}
                  className="btn-duo btn-duo-green flex-1 py-3 text-xs sm:text-sm flex items-center justify-center space-x-1.5"
                >
                  {isLaunching ? (
                    <span>Lançando...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>Confirmar Lançamento</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal */}
      <RecurringBillModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categories={categories}
        accounts={accounts}
        creditCards={creditCards}
        billToEdit={editingBill}
        defaultMonth={selectedMonth}
        onSuccess={() => {
          loadBills();
          if (onDataChanged) onDataChanged();
        }}
      />
    </div>
  );
};
