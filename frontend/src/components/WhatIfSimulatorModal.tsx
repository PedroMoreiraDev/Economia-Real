import React, { useState, useMemo } from 'react';
import { X, Sliders, Target, CheckCircle2 } from 'lucide-react';
import { SavingsGoal } from '../types/goal';

interface WhatIfSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  savingsGoals?: SavingsGoal[];
  initialDeliveryCut?: number;
  initialCancelBills?: number;
  privacyMode?: boolean;
}

function formatBRL(val: number | undefined, privacyMode?: boolean): string {
  if (privacyMode) return '••••••';
  if (val === undefined || isNaN(val)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

export const WhatIfSimulatorModal: React.FC<WhatIfSimulatorModalProps> = ({
  isOpen,
  onClose,
  savingsGoals = [],
  initialDeliveryCut = 30,
  initialCancelBills = 40,
  privacyMode,
}) => {
  const [deliveryCutPct, setDeliveryCutPct] = useState<number>(initialDeliveryCut);
  const [cancelBillsAmount, setCancelBillsAmount] = useState<number>(initialCancelBills);
  const [extraDirectSavings, setExtraDirectSavings] = useState<number>(100);

  // Estimativa base de delivery mensal média
  const baseMonthlyDelivery = 450;

  const results = useMemo(() => {
    const deliverySavings = (deliveryCutPct / 100) * baseMonthlyDelivery;
    const monthlyTotalSaved = deliverySavings + cancelBillsAmount + extraDirectSavings;
    const annualTotal = monthlyTotalSaved * 12;

    // Projeção em 5 anos (60 meses) com CDI de 10% a.a. (~0.797% ao mês)
    const monthlyRate = 0.007974;
    const months = 60;
    const compoundFiveYears =
      monthlyTotalSaved * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);

    // Impacto nas metas de economia ativas
    const goalsAcceleration = savingsGoals.map((goal) => {
      const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
      // Supõe um aporte atual de R$ 200/mês para estimativa
      const currentMonthlyContribution = 200;
      const normalMonths = Math.ceil(remaining / currentMonthlyContribution);

      const acceleratedContribution = currentMonthlyContribution + monthlyTotalSaved;
      const acceleratedMonths = Math.ceil(remaining / acceleratedContribution);
      const monthsSaved = Math.max(0, normalMonths - acceleratedMonths);

      return {
        ...goal,
        normalMonths,
        acceleratedMonths,
        monthsSaved,
      };
    });

    return {
      monthlyTotalSaved,
      annualTotal,
      compoundFiveYears,
      goalsAcceleration,
    };
  }, [deliveryCutPct, cancelBillsAmount, extraDirectSavings, savingsGoals]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="card-duo bg-white dark:!bg-[#102D25] border-2 border-slate-200/90 dark:!border-[#214E3E] max-w-2xl w-full p-6 sm:p-8 rounded-3xl shadow-2xl relative space-y-6 my-auto">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#214E3E] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#1C4939] dark:bg-[#16382E] text-[#D4A94F] border border-[#D4A94F]/40 shadow-xs">
              <Sliders className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-[#102D25] dark:text-[#E8E4D9]">
                Simulador de "E se...?"
              </h3>
              <p className="text-xs font-semibold text-[#526B61] dark:text-[#9AB3A8]">
                Descubra o impacto de pequenos cortes na sua liberdade financeira
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-[#E8E4D9] hover:bg-slate-100 dark:hover:bg-[#1C4939] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sliders Interativos */}
        <div className="space-y-5 bg-[#FAF8F4] dark:bg-[#16382E]/60 p-5 rounded-2xl border border-[#1C4939]/15 dark:border-[#214E3E]">
          
          {/* Slider 1: Redução de Delivery */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-[#102D25] dark:text-[#E8E4D9]">
              <span>Reduzir pedidos de Delivery / Restaurante:</span>
              <span className="font-black text-[#1C4939] dark:text-[#78C6A3]">
                {deliveryCutPct}% (- {formatBRL((deliveryCutPct / 100) * baseMonthlyDelivery, privacyMode)}/mês)
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={80}
              step={5}
              value={deliveryCutPct}
              onChange={(e) => setDeliveryCutPct(Number(e.target.value))}
              className="w-full accent-[#1C4939] dark:accent-[#D4A94F] cursor-pointer"
            />
          </div>

          {/* Slider 2: Assinaturas */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-[#102D25] dark:text-[#E8E4D9]">
              <span>Cancelar ou alternar assinaturas supérfluas:</span>
              <span className="font-black text-[#1C4939] dark:text-[#78C6A3]">
                - {formatBRL(cancelBillsAmount, privacyMode)}/mês
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={250}
              step={10}
              value={cancelBillsAmount}
              onChange={(e) => setCancelBillsAmount(Number(e.target.value))}
              className="w-full accent-[#1C4939] dark:accent-[#D4A94F] cursor-pointer"
            />
          </div>

          {/* Slider 3: Poupança Direta Adicional */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-[#102D25] dark:text-[#E8E4D9]">
              <span>Poupar diretamente a mais todo mês:</span>
              <span className="font-black text-[#1C4939] dark:text-[#78C6A3]">
                + {formatBRL(extraDirectSavings, privacyMode)}/mês
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={800}
              step={50}
              value={extraDirectSavings}
              onChange={(e) => setExtraDirectSavings(Number(e.target.value))}
              className="w-full accent-[#1C4939] dark:accent-[#D4A94F] cursor-pointer"
            />
          </div>

        </div>

        {/* Resultados Calculados */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#16382E] border border-[#1C4939]/20 dark:border-[#214E3E]">
            <span className="text-[10px] font-black uppercase text-[#526B61] dark:text-[#9AB3A8] block">
              Economia Extra Mensal
            </span>
            <p className="text-xl font-black text-[#1C4939] dark:text-[#78C6A3] mt-1">
              +{formatBRL(results.monthlyTotalSaved, privacyMode)}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#16382E] border border-[#1C4939]/20 dark:border-[#214E3E]">
            <span className="text-[10px] font-black uppercase text-[#526B61] dark:text-[#9AB3A8] block">
              Total em 1 Ano
            </span>
            <p className="text-xl font-black text-[#102D25] dark:text-[#E8E4D9] mt-1">
              {formatBRL(results.annualTotal, privacyMode)}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#1C4939] text-[#FAF8F4] border border-[#D4A94F]/40 shadow-sm">
            <span className="text-[10px] font-black uppercase text-[#D4A94F] block">
              Em 5 Anos (com Rendimento)
            </span>
            <p className="text-xl font-black text-[#FAF8F4] mt-1">
              {formatBRL(results.compoundFiveYears, privacyMode)}
            </p>
          </div>
        </div>

        {/* Aceleração nas Metas Ativas */}
        {results.goalsAcceleration.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-wider text-[#526B61] dark:text-[#9AB3A8]">
              Aceleração das Suas Metas de Poupança
            </p>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {results.goalsAcceleration.map((goal) => (
                <div
                  key={goal.id}
                  className="p-3 rounded-xl bg-white/80 dark:bg-[#16382E]/50 border border-slate-200 dark:border-[#214E3E] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#D4A94F]" />
                    <span className="font-extrabold text-[#102D25] dark:text-[#E8E4D9]">{goal.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Concluída {goal.monthsSaved} meses mais rápido!</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rodapé do Modal */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#214E3E]">
          <button
            type="button"
            onClick={onClose}
            className="btn-duo btn-duo-green px-6 py-2.5 text-xs sm:text-sm font-black"
          >
            Fechar Simulador
          </button>
        </div>

      </div>
    </div>
  );
};
