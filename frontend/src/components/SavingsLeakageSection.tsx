import React, { useMemo } from 'react';
import { Search, Sparkles, ArrowRight } from 'lucide-react';
import { Transaction } from '../types/financial';
import { RecurringBill } from '../types/recurring';
import { ReductionFocusMode } from './RealExpenseReductionModal';

interface SavingsLeakageSectionProps {
  transactions: Transaction[];
  recurringBills: RecurringBill[];
  onOpenWhatIfSimulator?: (prefillData?: { deliveryCut?: number; cancelBills?: number }) => void;
  onOpenExpenseReductionModal?: (mode: ReductionFocusMode) => void;
  privacyMode?: boolean;
}

function formatBRL(val: number | undefined, privacyMode?: boolean): string {
  if (privacyMode) return '••••••';
  if (val === undefined || isNaN(val)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

export const SavingsLeakageSection: React.FC<SavingsLeakageSectionProps> = ({
  transactions,
  recurringBills,
  onOpenWhatIfSimulator,
  onOpenExpenseReductionModal,
  privacyMode,
}) => {
  const leakages = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      category: string;
      severity: 'HIGH' | 'MEDIUM' | 'INFO';
      monthlyAmount: number;
      annualPotential: number;
      description: string;
      actionLabel: string;
      onAction: () => void;
    }> = [];

    // Helper para acionar o modal específico de redução de despesas
    const triggerSimulation = (mode: ReductionFocusMode, prefillData?: { deliveryCut?: number; cancelBills?: number }) => {
      if (onOpenExpenseReductionModal) {
        onOpenExpenseReductionModal(mode);
      } else if (onOpenWhatIfSimulator) {
        onOpenWhatIfSimulator(prefillData);
      }
    };

    // 1. Detecção de Múltiplas Assinaturas de Streaming / Lazer
    const streamingKeywords = ['netflix', 'spotify', 'prime', 'disney', 'max', 'hbo', 'globoplay', 'youtube', 'deezer', 'apple'];
    const streamingsFound = recurringBills.filter((bill) => {
      const desc = bill.description.toLowerCase();
      return streamingKeywords.some((kw) => desc.includes(kw));
    });

    if (streamingsFound.length >= 2) {
      const monthlySum = streamingsFound.reduce((sum, b) => sum + b.amount, 0);
      list.push({
        id: 'streaming-duplication',
        title: `${streamingsFound.length} Assinaturas de Entretenimento Concorrentes`,
        category: 'Assinaturas',
        severity: 'MEDIUM',
        monthlyAmount: monthlySum,
        annualPotential: monthlySum * 12,
        description: `Você possui ${streamingsFound.map((s) => s.description).join(', ')}. Alternar entre os serviços quando não estiver assistindo pode economizar até 50% deste valor.`,
        actionLabel: 'Simular Corte de Assinaturas',
        onAction: () => triggerSimulation('SUBSCRIPTIONS', { cancelBills: Math.round(monthlySum * 0.5) }),
      });
    }

    // 2. Detecção de Frequência de Delivery
    const deliveryKeywords = ['delivery', 'ifood', 'rappi', 'zé delivery', 'ze delivery', 'ai que fome'];
    const deliveryTx = transactions.filter((t) => {
      const desc = (t.description || '').toLowerCase();
      return t.type === 'EXPENSE' && deliveryKeywords.some((kw) => desc.includes(kw));
    });

    if (deliveryTx.length >= 5) {
      const totalDelivery = deliveryTx.reduce((sum, t) => sum + t.amount, 0);
      const potentialMonthlySavings = totalDelivery * 0.35; // 35% de redução
      list.push({
        id: 'delivery-frequency',
        title: `Frequência Elevada de Delivery (${deliveryTx.length} pedidos este mês)`,
        category: 'Alimentação & Delivery',
        severity: 'HIGH',
        monthlyAmount: totalDelivery,
        annualPotential: potentialMonthlySavings * 12,
        description: `Você gastou ${formatBRL(totalDelivery, privacyMode)} em delivery. Reduzir 1 a 2 pedidos por semana economizaria ${formatBRL(potentialMonthlySavings * 12, privacyMode)} em 1 ano!`,
        actionLabel: 'Simular Redução de Delivery',
        onAction: () => triggerSimulation('DELIVERY', { deliveryCut: 35 }),
      });
    }

    // 3. Efeito Formiguinha (Lançamentos menores de R$ 30 frequentes)
    const smallExpenses = transactions.filter((t) => t.type === 'EXPENSE' && t.amount <= 30 && t.amount > 0);
    if (smallExpenses.length >= 10) {
      const totalSmall = smallExpenses.reduce((sum, t) => sum + t.amount, 0);
      list.push({
        id: 'small-expenses-leakage',
        title: `Efeito Formiguinha (${smallExpenses.length} pequenos gastos < R$ 30)`,
        category: 'Gastos Invisíveis',
        severity: 'MEDIUM',
        monthlyAmount: totalSmall,
        annualPotential: totalSmall * 0.4 * 12,
        description: `Pequenas compras diárias somaram ${formatBRL(totalSmall, privacyMode)} no mês. Ter um teto semanal para micro-gastos estanca até 40% dessa sangria invisível.`,
        actionLabel: 'Simular Economia Geral',
        onAction: () => triggerSimulation('SMALL_EXPENSES'),
      });
    }

    // 4. Caso tudo esteja em ordem, insere dica de ouro de otimização
    if (list.length === 0) {
      list.push({
        id: 'no-leakages',
        title: 'Nenhum Vazamento Crítico Detectado!',
        category: 'Saúde Blindada',
        severity: 'INFO',
        monthlyAmount: 0,
        annualPotential: 0,
        description: 'Sua disciplina financeira está excelente! Não encontramos cobranças duplicadas ou gastos compulsivos fora da curva este mês.',
        actionLabel: 'Simular Sobra do Mês',
        onAction: () => triggerSimulation('ALL_EXPENSES'),
      });
    }

    return list;
  }, [transactions, recurringBills, onOpenWhatIfSimulator, onOpenExpenseReductionModal, privacyMode]);

  return (
    <div className="card-duo-green p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1C4939]/20 dark:border-[#214E3E] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[#1C4939] dark:bg-[#102D25] text-[#D4A94F] border border-[#D4A94F]/40 shadow-xs">
            <Search className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-extrabold text-[#102D25] dark:text-[#E8E4D9]">
                Detetive de Economia Real (Auditoria de Gastos)
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#FAF8F4] dark:bg-[#16382E] text-[#1C4939] dark:text-[#78C6A3] border border-[#1C4939]/30">
                I.A Antidesperdício
              </span>
            </div>
            <p className="text-xs font-semibold text-[#526B61] dark:text-[#9AB3A8]">
              Identificação inteligente de assinaturas esquecidas e gastos invisíveis
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {leakages.map((leak) => (
          <div
            key={leak.id}
            className="p-5 rounded-2xl bg-white/90 dark:bg-[#102D25]/90 border border-[#1C4939]/20 dark:border-[#214E3E] shadow-sm flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#526B61] dark:text-[#9AB3A8]">
                  {leak.category}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                  leak.severity === 'HIGH'
                    ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300'
                    : leak.severity === 'MEDIUM'
                    ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300'
                    : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                }`}>
                  {leak.severity === 'HIGH' ? 'Atenção Alta' : leak.severity === 'MEDIUM' ? 'Oportunidade' : 'Saudável'}
                </span>
              </div>

              <h4 className="text-sm sm:text-base font-black text-[#102D25] dark:text-[#E8E4D9]">
                {leak.title}
              </h4>

              <p className="text-xs font-medium text-[#526B61] dark:text-[#9AB3A8] leading-relaxed">
                {leak.description}
              </p>
            </div>

            {leak.annualPotential > 0 && (
              <div className="p-3 rounded-xl bg-[#FAF8F4] dark:bg-[#16382E]/80 border border-[#D4A94F]/30 flex items-center justify-between text-xs">
                <span className="font-bold text-[#526B61] dark:text-[#9AB3A8]">
                  Potencial em 1 ano:
                </span>
                <span className="font-black text-[#1C4939] dark:text-[#78C6A3]">
                  + {formatBRL(leak.annualPotential, privacyMode)}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={leak.onAction}
              className="btn-duo btn-duo-yellow w-full py-2.5 text-xs font-black flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{leak.actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
