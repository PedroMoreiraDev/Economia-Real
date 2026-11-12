import React, { useState, useMemo } from 'react';
import { 
  X, 
  Sliders, 
  Target, 
  CheckCircle2, 
  Coffee, 
  Rocket, 
  ShieldCheck, 
  Sparkles,
  TrendingUp,
  PlusCircle
} from 'lucide-react';
import { SavingsGoal } from '../types/goal';
import { CategoryDistributionItem } from '../types/analytics';
import { createSavingsGoalApi } from '../services/goalApi';

interface WhatIfSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  savingsGoals?: SavingsGoal[];
  categoryDistribution?: CategoryDistributionItem[];
  initialDeliveryCut?: number;
  initialCancelBills?: number;
  token?: string | null;
  onGoalCreated?: () => void;
  privacyMode?: boolean;
}

function formatBRL(val: number | undefined, privacyMode?: boolean): string {
  if (privacyMode) return '••••••';
  if (val === undefined || isNaN(val)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

type PresetMode = 'coffee' | 'focus' | 'freedom' | 'custom';

export const WhatIfSimulatorModal: React.FC<WhatIfSimulatorModalProps> = ({
  isOpen,
  onClose,
  savingsGoals = [],
  categoryDistribution = [],
  initialDeliveryCut = 25,
  initialCancelBills = 35,
  token,
  onGoalCreated,
  privacyMode,
}) => {
  // Puxa o gasto real em Alimentação/Delivery do usuário neste mês se existir
  const realFoodExpense = useMemo(() => {
    const foodCat = categoryDistribution.find((c) => {
      const name = c.categoryName.toLowerCase();
      return name.includes('aliment') || name.includes('restauran') || name.includes('refei') || name.includes('delivery');
    });
    return foodCat && foodCat.totalAmount > 0 ? foodCat.totalAmount : 350;
  }, [categoryDistribution]);

  const [preset, setPreset] = useState<PresetMode>('coffee');
  const [deliveryCutPct, setDeliveryCutPct] = useState<number>(initialDeliveryCut);
  const [cancelBillsAmount, setCancelBillsAmount] = useState<number>(initialCancelBills);
  const [extraDirectSavings, setExtraDirectSavings] = useState<number>(100);

  // Estado para criar a meta diretamente da simulação
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);
  const [goalTitle, setGoalTitle] = useState('Reserva Criada no Simulador');
  const [goalTargetAmount, setGoalTargetAmount] = useState<number>(0);
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const [goalFeedback, setGoalFeedback] = useState<string | null>(null);

  // Aplica cenários rápidos pré-configurados
  const applyPreset = (mode: PresetMode) => {
    setPreset(mode);
    if (mode === 'coffee') {
      setDeliveryCutPct(15);
      setCancelBillsAmount(25);
      setExtraDirectSavings(60);
    } else if (mode === 'focus') {
      setDeliveryCutPct(30);
      setCancelBillsAmount(60);
      setExtraDirectSavings(150);
    } else if (mode === 'freedom') {
      setDeliveryCutPct(50);
      setCancelBillsAmount(120);
      setExtraDirectSavings(300);
    }
  };

  const results = useMemo(() => {
    const deliverySavings = (deliveryCutPct / 100) * realFoodExpense;
    const monthlyTotalSaved = Math.round(deliverySavings + cancelBillsAmount + extraDirectSavings);
    const annualTotal = monthlyTotalSaved * 12;

    // Projeção em 5 anos (60 meses) com CDI conservador de 10% a.a. (~0.797% ao mês)
    const monthlyRate = 0.007974;
    const months = 60;
    const compoundFiveYears = Math.round(
      monthlyTotalSaved * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
    );
    const pureDepositedFiveYears = monthlyTotalSaved * 60;
    const interestEarnedFiveYears = Math.max(0, compoundFiveYears - pureDepositedFiveYears);

    // Impacto nas metas ativas
    const goalsAcceleration = savingsGoals.map((goal) => {
      const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
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
      pureDepositedFiveYears,
      interestEarnedFiveYears,
      goalsAcceleration,
    };
  }, [deliveryCutPct, realFoodExpense, cancelBillsAmount, extraDirectSavings, savingsGoals]);

  // Atualiza valor padrão do objetivo quando a simulação muda
  useMemo(() => {
    setGoalTargetAmount(results.annualTotal);
  }, [results.annualTotal]);

  const handleSaveGoal = async () => {
    if (!token) {
      setGoalFeedback('Faça login para salvar esta meta.');
      return;
    }
    try {
      setIsSavingGoal(true);
      setGoalFeedback(null);
      await createSavingsGoalApi(token, {
        title: goalTitle,
        targetAmount: goalTargetAmount,
      });
      setGoalFeedback('Meta criada com sucesso! Você pode acompanhá-la na aba de Metas.');
      setIsCreatingGoal(false);
      if (onGoalCreated) onGoalCreated();
    } catch (err: any) {
      setGoalFeedback(err.message || 'Erro ao criar meta.');
    } finally {
      setIsSavingGoal(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="card-duo bg-white dark:!bg-[#102D25] border-2 border-slate-200/90 dark:!border-[#214E3E] max-w-2xl w-full p-6 sm:p-8 rounded-3xl shadow-2xl relative space-y-6 my-auto max-h-[90vh] overflow-y-auto">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#214E3E] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#1C4939] dark:bg-[#16382E] text-[#D4A94F] border border-[#D4A94F]/40 shadow-xs">
              <Sliders className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-[#102D25] dark:text-[#E8E4D9]">
                  Simulador de "E se...?"
                </h3>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#FAF8F4] dark:bg-[#16382E] text-[#1C4939] dark:text-[#78C6A3] border border-[#1C4939]/30">
                  Base Real
                </span>
              </div>
              <p className="text-xs font-semibold text-[#526B61] dark:text-[#9AB3A8]">
                Descubra o impacto real de pequenas escolhas no seu patrimônio
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

        {/* Barra de Cenários Prontos (Presets em 1 clique) */}
        <div className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-[#526B61] dark:text-[#9AB3A8] block">
            Escolha um Cenário Rápido ou Ajuste Livremente:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => applyPreset('coffee')}
              className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center gap-2 ${
                preset === 'coffee'
                  ? 'bg-[#1C4939] text-white border-[#1C4939] shadow-xs'
                  : 'bg-white/80 dark:bg-[#16382E]/60 text-[#102D25] dark:text-[#E8E4D9] border-slate-200 dark:border-[#214E3E] hover:border-[#1C4939]'
              }`}
            >
              <Coffee className="w-4 h-4 shrink-0 text-[#D4A94F]" />
              <div>
                <span className="block font-black">Corte Leve</span>
                <span className="text-[10px] opacity-80 font-normal">Pequenos hábitos</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('focus')}
              className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center gap-2 ${
                preset === 'focus'
                  ? 'bg-[#1C4939] text-white border-[#1C4939] shadow-xs'
                  : 'bg-white/80 dark:bg-[#16382E]/60 text-[#102D25] dark:text-[#E8E4D9] border-slate-200 dark:border-[#214E3E] hover:border-[#1C4939]'
              }`}
            >
              <Rocket className="w-4 h-4 shrink-0 text-[#D4A94F]" />
              <div>
                <span className="block font-black">Foco Total</span>
                <span className="text-[10px] opacity-80 font-normal">Modo aceleração</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('freedom')}
              className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center gap-2 ${
                preset === 'freedom'
                  ? 'bg-[#1C4939] text-white border-[#1C4939] shadow-xs'
                  : 'bg-white/80 dark:bg-[#16382E]/60 text-[#102D25] dark:text-[#E8E4D9] border-slate-200 dark:border-[#214E3E] hover:border-[#1C4939]'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0 text-[#D4A94F]" />
              <div>
                <span className="block font-black">Investidor</span>
                <span className="text-[10px] opacity-80 font-normal">Independência</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPreset('custom')}
              className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center gap-2 ${
                preset === 'custom'
                  ? 'bg-[#1C4939] text-white border-[#1C4939] shadow-xs'
                  : 'bg-white/80 dark:bg-[#16382E]/60 text-[#102D25] dark:text-[#E8E4D9] border-slate-200 dark:border-[#214E3E] hover:border-[#1C4939]'
              }`}
            >
              <Sliders className="w-4 h-4 shrink-0 text-[#D4A94F]" />
              <div>
                <span className="block font-black">Manual</span>
                <span className="text-[10px] opacity-80 font-normal">Personalizado</span>
              </div>
            </button>
          </div>
        </div>

        {/* Sliders Interativos Conectados à Realidade */}
        <div className="space-y-4 bg-[#FAF8F4] dark:bg-[#16382E]/60 p-5 rounded-2xl border border-[#1C4939]/15 dark:border-[#214E3E]">
          
          {/* Slider 1: Alimentação / Delivery Real */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-[#102D25] dark:text-[#E8E4D9]">
              <div>
                <span>Otimizar Alimentação & Restaurantes:</span>
                <span className="block text-[10px] text-[#526B61] dark:text-[#9AB3A8] font-normal">
                  Gasto atual do mês: {formatBRL(realFoodExpense, privacyMode)}
                </span>
              </div>
              <span className="font-black text-[#1C4939] dark:text-[#78C6A3] font-mono tabular-nums text-right">
                {deliveryCutPct}% (- {formatBRL((deliveryCutPct / 100) * realFoodExpense, privacyMode)}/mês)
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={60}
              step={5}
              value={deliveryCutPct}
              onChange={(e) => {
                setDeliveryCutPct(Number(e.target.value));
                setPreset('custom');
              }}
              className="w-full accent-[#1C4939] dark:accent-[#D4A94F] cursor-pointer"
            />
          </div>

          {/* Slider 2: Assinaturas Supérfluas */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-[#102D25] dark:text-[#E8E4D9]">
              <div>
                <span>Rever Assinaturas & Serviços Recorrentes:</span>
                <span className="block text-[10px] text-[#526B61] dark:text-[#9AB3A8] font-normal">
                  Streamings, apps ou mensalidades esquecidas
                </span>
              </div>
              <span className="font-black text-[#1C4939] dark:text-[#78C6A3] font-mono tabular-nums">
                - {formatBRL(cancelBillsAmount, privacyMode)}/mês
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={200}
              step={10}
              value={cancelBillsAmount}
              onChange={(e) => {
                setCancelBillsAmount(Number(e.target.value));
                setPreset('custom');
              }}
              className="w-full accent-[#1C4939] dark:accent-[#D4A94F] cursor-pointer"
            />
          </div>

          {/* Slider 3: Poupança Direta */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-[#102D25] dark:text-[#E8E4D9]">
              <div>
                <span>Aporte Mensal Direto para Investir:</span>
                <span className="block text-[10px] text-[#526B61] dark:text-[#9AB3A8] font-normal">
                  Valor transferido direto para a reserva
                </span>
              </div>
              <span className="font-black text-[#1C4939] dark:text-[#78C6A3] font-mono tabular-nums">
                + {formatBRL(extraDirectSavings, privacyMode)}/mês
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={500}
              step={25}
              value={extraDirectSavings}
              onChange={(e) => {
                setExtraDirectSavings(Number(e.target.value));
                setPreset('custom');
              }}
              className="w-full accent-[#1C4939] dark:accent-[#D4A94F] cursor-pointer"
            />
          </div>

        </div>

        {/* Resultados em 3 Tempos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#16382E] border border-[#1C4939]/20 dark:border-[#214E3E]">
            <span className="text-[10px] font-black uppercase text-[#526B61] dark:text-[#9AB3A8] block">
              Mais Dinheiro no Mês
            </span>
            <p className="text-xl font-black text-[#1C4939] dark:text-[#78C6A3] mt-1 font-mono tabular-nums">
              +{formatBRL(results.monthlyTotalSaved, privacyMode)}
            </p>
            <span className="text-[10px] text-[#526B61] dark:text-[#9AB3A8] block mt-0.5">
              todo mês na sua conta
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#16382E] border border-[#1C4939]/20 dark:border-[#214E3E]">
            <span className="text-[10px] font-black uppercase text-[#526B61] dark:text-[#9AB3A8] block">
              Acumulado em 1 Ano
            </span>
            <p className="text-xl font-black text-[#102D25] dark:text-[#E8E4D9] mt-1 font-mono tabular-nums">
              {formatBRL(results.annualTotal, privacyMode)}
            </p>
            <span className="text-[10px] text-[#526B61] dark:text-[#9AB3A8] block mt-0.5">
              12 meses de economia
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#1C4939] text-[#FAF8F4] border border-[#D4A94F]/40 shadow-sm">
            <span className="text-[10px] font-black uppercase text-[#D4A94F] block">
              Em 5 Anos com Rendimento
            </span>
            <p className="text-xl font-black text-[#FAF8F4] mt-1 font-mono tabular-nums">
              {formatBRL(results.compoundFiveYears, privacyMode)}
            </p>
            <span className="text-[10px] text-[#78C6A3] block mt-0.5">
              + {formatBRL(results.interestEarnedFiveYears, privacyMode)} só de juros
            </span>
          </div>
        </div>

        {/* Barra Visual dos Juros Compostos (Depósito vs Juros) */}
        <div className="p-4 rounded-2xl bg-[#FAF8F4] dark:bg-[#16382E]/50 border border-[#1C4939]/15 dark:border-[#214E3E] space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-[#102D25] dark:text-[#E8E4D9] flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#D4A94F]" />
              Como esse patrimônio é formado em 5 anos:
            </span>
            <span className="text-[10px] text-[#526B61] dark:text-[#9AB3A8]">
              Taxa de 10% a.a. (100% CDI)
            </span>
          </div>

          {/* Barra segmentada */}
          <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-200 dark:bg-slate-800">
            <div 
              style={{ width: `${(results.pureDepositedFiveYears / results.compoundFiveYears) * 100}%` }}
              className="bg-[#1C4939] h-full"
              title="Total depositado do seu bolso"
            />
            <div 
              style={{ width: `${(results.interestEarnedFiveYears / results.compoundFiveYears) * 100}%` }}
              className="bg-[#D4A94F] h-full"
              title="Rendimento gerado pelos juros compostos"
            />
          </div>

          <div className="flex justify-between items-center text-[11px] font-bold">
            <span className="text-[#1C4939] dark:text-[#78C6A3] flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1C4939] inline-block" />
              Do seu bolso: <strong>{formatBRL(results.pureDepositedFiveYears, privacyMode)}</strong>
            </span>
            <span className="text-[#9A7220] dark:text-[#D4A94F] flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D4A94F] inline-block" />
              Lucro dos juros: <strong>+{formatBRL(results.interestEarnedFiveYears, privacyMode)}</strong>
            </span>
          </div>
        </div>

        {/* O que esse dinheiro realiza na vida real? */}
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-wider text-[#526B61] dark:text-[#9AB3A8]">
            O que essa economia realiza para você:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-white/90 dark:bg-[#16382E]/80 border border-slate-200 dark:border-[#214E3E] flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-[#102D25] dark:text-[#E8E4D9] block">
                  Reserva de Emergência
                </span>
                <span className="text-[10px] text-[#526B61] dark:text-[#9AB3A8]">
                  Montada em cerca de 6 a 8 meses
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/90 dark:bg-[#16382E]/80 border border-slate-200 dark:border-[#214E3E] flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-[#102D25] dark:text-[#E8E4D9] block">
                  Viagem ou Conquista
                </span>
                <span className="text-[10px] text-[#526B61] dark:text-[#9AB3A8]">
                  {formatBRL(results.annualTotal, privacyMode)} pagos à vista em 1 ano
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Aceleração nas Metas Ativas do Usuário (se existirem) */}
        {results.goalsAcceleration.length > 0 && (
          <div className="space-y-2 pt-1">
            <p className="text-[11px] font-black uppercase tracking-wider text-[#526B61] dark:text-[#9AB3A8]">
              Aceleração das Suas Metas de Poupança
            </p>
            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {results.goalsAcceleration.map((goal) => (
                <div
                  key={goal.id}
                  className="p-2.5 rounded-xl bg-white/80 dark:bg-[#16382E]/50 border border-slate-200 dark:border-[#214E3E] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#D4A94F]" />
                    <span className="font-extrabold text-[#102D25] dark:text-[#E8E4D9]">{goal.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Concluída {goal.monthsSaved} meses antes!</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Formulário Inline para Criar Meta com a Simulação */}
        {isCreatingGoal ? (
          <div className="p-4 rounded-2xl bg-[#FAF8F4] dark:bg-[#16382E] border border-[#D4A94F]/50 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#102D25] dark:text-[#E8E4D9] flex items-center gap-1.5">
                <Target className="w-4 h-4 text-[#D4A94F]" />
                Criar Meta com a Economia Simulada
              </span>
              <button
                type="button"
                onClick={() => setIsCreatingGoal(false)}
                className="text-[11px] text-slate-400 hover:text-slate-600"
              >
                Cancelar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-[#526B61] dark:text-[#9AB3A8] uppercase mb-1">
                  Nome da Meta:
                </label>
                <input
                  type="text"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="input-duo text-xs w-full"
                  placeholder="Ex: Reserva Criada no Simulador"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#526B61] dark:text-[#9AB3A8] uppercase mb-1">
                  Objetivo em 1 Ano (R$):
                </label>
                <input
                  type="number"
                  value={goalTargetAmount}
                  onChange={(e) => setGoalTargetAmount(Number(e.target.value))}
                  className="input-duo text-xs w-full font-mono tabular-nums"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={isSavingGoal}
                onClick={handleSaveGoal}
                className="btn-duo btn-duo-yellow px-4 py-2 text-xs font-black flex items-center gap-1.5"
              >
                {isSavingGoal ? 'Salvando...' : 'Confirmar e Salvar Meta'}
              </button>
            </div>
          </div>
        ) : null}

        {goalFeedback && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 text-xs font-bold text-emerald-800 dark:text-emerald-300">
            {goalFeedback}
          </div>
        )}

        {/* Rodapé com Botão Acionável */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-[#214E3E]">
          <button
            type="button"
            onClick={() => setIsCreatingGoal(!isCreatingGoal)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black bg-[#FAF8F4] dark:bg-[#16382E] text-[#1C4939] dark:text-[#78C6A3] border border-[#1C4939]/30 hover:border-[#D4A94F] shadow-xs transition-all"
          >
            <PlusCircle className="w-4 h-4 text-[#D4A94F]" />
            <span>Transformar essa Economia em Meta Real</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto btn-duo btn-duo-green px-6 py-2.5 text-xs font-black"
          >
            Fechar Simulador
          </button>
        </div>

      </div>
    </div>
  );
};