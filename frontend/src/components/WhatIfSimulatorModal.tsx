import React, { useState, useMemo } from 'react';
import { 
  X, 
  Target, 
  CheckCircle2, 
  Rocket, 
  ShieldCheck, 
  Sparkles,
  TrendingUp,
  Coins,
  Crown,
  Zap
} from 'lucide-react';
import { SavingsGoal } from '../types/goal';
import { CategoryDistributionItem } from '../types/analytics';
import { createSavingsGoalApi } from '../services/goalApi';

interface WhatIfSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  savingsGoals?: SavingsGoal[];
  categoryDistribution?: CategoryDistributionItem[];
  totalIncome?: number;
  totalExpense?: number;
  initialCapital?: number;
  token?: string | null;
  onGoalCreated?: () => void;
  privacyMode?: boolean;
}

function formatBRL(val: number | undefined, privacyMode?: boolean): string {
  if (privacyMode) return '••••••';
  if (val === undefined || isNaN(val)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

type HorizonYears = 1 | 3 | 5 | 10 | 20 | 30;

export const WhatIfSimulatorModal: React.FC<WhatIfSimulatorModalProps> = ({
  isOpen,
  onClose,
  savingsGoals = [],
  totalIncome = 0,
  totalExpense = 0,
  initialCapital = 0,
  token,
  onGoalCreated,
  privacyMode,
}) => {
  // Ponto de partida sugerido para o aporte mensal
  const defaultMonthlySaving = useMemo(() => {
    if (totalIncome > 0) {
      // 20% da renda é a referência de ouro
      return Math.max(300, Math.round(totalIncome * 0.2));
    }
    return 500;
  }, [totalIncome]);

  const [monthlyContribution, setMonthlyContribution] = useState<number>(defaultMonthlySaving);
  const [startingCapital, setStartingCapital] = useState<number>(Math.max(0, initialCapital));
  const [horizon, setHorizon] = useState<HorizonYears>(5);
  const [expectedRateAnnual] = useState<number>(10.5); // 10.5% a.a. (~100% CDI / Tesouro Selic)

  // Estado para criar a meta de liberdade diretamente da simulação
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);
  const [goalTitle, setGoalTitle] = useState('Projeto de Liberdade Financeira');
  const [goalTargetAmount, setGoalTargetAmount] = useState<number>(0);
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const [goalFeedback, setGoalFeedback] = useState<string | null>(null);

  // Cálculos de juros compostos em tempo real
  const projection = useMemo(() => {
    const monthlyRate = Math.pow(1 + expectedRateAnnual / 100, 1 / 12) - 1;
    const months = horizon * 12;

    // Valor futuro do capital inicial
    const fvStartingCapital = startingCapital * Math.pow(1 + monthlyRate, months);

    // Valor futuro dos aportes mensais: PMT * (((1 + i)^n - 1) / i)
    const fvContributions =
      monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);

    const totalAccumulated = Math.round(fvStartingCapital + fvContributions);
    const totalDeposited = Math.round(startingCapital + monthlyContribution * months);
    const totalInterestEarned = Math.max(0, totalAccumulated - totalDeposited);

    // Estimativa de Renda Passiva Mensal gerada por esse patrimônio (sem gastar o principal!)
    // Rendimento mensal conservador de ~0.75% a 0.8% ao mês
    const passiveMonthlyIncome = Math.round(totalAccumulated * monthlyRate);

    // Marcos de vida real destravados com esse patrimônio
    const monthlyCost = totalExpense > 0 ? totalExpense : 3000;
    const monthsOfEmergency = (totalAccumulated / monthlyCost).toFixed(1);

    return {
      totalAccumulated,
      totalDeposited,
      totalInterestEarned,
      passiveMonthlyIncome,
      monthsOfEmergency,
      months,
    };
  }, [monthlyContribution, startingCapital, horizon, expectedRateAnnual, totalExpense]);

  // Atualiza valor padrão do objetivo quando a projeção muda
  useMemo(() => {
    setGoalTargetAmount(projection.totalAccumulated);
  }, [projection.totalAccumulated]);

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
      setGoalFeedback('🎉 Meta de Liberdade Financeira cadastrada com sucesso! Acompanhe o progresso na aba de Metas.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="card-duo bg-white dark:!bg-[#102D25] border-2 border-slate-200/90 dark:!border-[#214E3E] max-w-3xl w-full p-6 sm:p-8 rounded-3xl shadow-2xl relative space-y-6 my-auto max-h-[92vh] overflow-y-auto">
        
        {/* Cabeçalho de Alto Impacto */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#214E3E] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#1C4939] dark:bg-[#16382E] text-[#D4A94F] border border-[#D4A94F]/40 shadow-xs">
              <Rocket className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-black text-[#102D25] dark:text-[#E8E4D9] tracking-tight">
                  Simulador de Liberdade Financeira
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#FAF8F4] dark:bg-[#16382E] text-[#1C4939] dark:text-[#78C6A3] border border-[#1C4939]/30">
                  <Sparkles className="w-3 h-3 text-[#D4A94F]" />
                  Efeito Bola de Neve
                </span>
              </div>
              <p className="text-xs font-semibold text-[#526B61] dark:text-[#9AB3A8] mt-0.5">
                Veja o potencial multiplicador da sua grana e quanto ela renderá de salário passivo
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

        {/* 1. SELETOR DE HORIZONTE DE TEMPO (Onde a mágica acontece) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#FAF8F4] dark:bg-[#16382E]/60 border border-[#1C4939]/15 dark:border-[#214E3E]">
          <span className="text-xs font-extrabold text-[#102D25] dark:text-[#E8E4D9] flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-[#D4A94F]" />
            Em quanto tempo você quer ver o resultado?
          </span>

          <div className="flex items-center gap-1.5 flex-wrap">
            {([1, 3, 5, 10, 20, 30] as HorizonYears[]).map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setHorizon(y)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  horizon === y
                    ? 'bg-[#1C4939] text-[#E8E4D9] shadow-xs scale-105 border border-[#1C4939]'
                    : 'bg-white/80 dark:bg-[#102D25] text-[#526B61] dark:text-[#9AB3A8] border border-slate-200 dark:border-[#214E3E] hover:border-[#1C4939]'
                }`}
              >
                {y} {y === 1 ? 'Ano' : 'Anos'}
              </button>
            ))}
          </div>
        </div>

        {/* 2. GRANDES NÚMEROS DE IMPACTO (O QUE FAZ O OLHO BRILHAR!) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Card de Patrimônio Total Projetado */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#102D25] to-[#1C4939] text-[#FAF8F4] border-2 border-[#D4A94F]/50 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-4 opacity-15">
              <Coins className="w-24 h-24 text-[#D4A94F]" />
            </div>

            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-[#D4A94F] flex items-center gap-1.5">
                <Crown className="w-4 h-4" />
                Seu Patrimônio em {horizon} {horizon === 1 ? 'Ano' : 'Anos'}:
              </span>
              <p className="text-3xl sm:text-4xl font-black text-white mt-1.5 font-mono tabular-nums tracking-tight">
                {formatBRL(projection.totalAccumulated, privacyMode)}
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-[#9AB3A8]">
                Com aportes de <strong>{formatBRL(monthlyContribution, privacyMode)}/mês</strong>
              </span>
              <span className="font-bold text-[#78C6A3]">
                Taxa de 10,5% a.a. (CDI)
              </span>
            </div>
          </div>

          {/* Card de Salário Passivo Mensal (Viver de Renda!) */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#16382E] border-2 border-[#1C4939]/25 dark:border-[#214E3E] shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-[#1C4939] dark:text-[#78C6A3] flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#D4A94F]" />
                Renda Passiva Mensal Estimada:
              </span>
              <p className="text-3xl sm:text-4xl font-black text-[#102D25] dark:text-[#E8E4D9] mt-1.5 font-mono tabular-nums tracking-tight">
                +{formatBRL(projection.passiveMonthlyIncome, privacyMode)}
                <span className="text-sm font-bold text-[#526B61] dark:text-[#9AB3A8]"> /mês</span>
              </p>
              <p className="text-xs text-[#526B61] dark:text-[#9AB3A8] mt-1">
                Dinheiro caindo na sua conta todo mês sem você mexer no valor principal!
              </p>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-[#214E3E] flex items-center gap-2 text-xs font-semibold text-[#1C4939] dark:text-[#78C6A3]">
              <ShieldCheck className="w-4 h-4 shrink-0 text-[#D4A94F]" />
              <span>Garante <strong>{projection.monthsOfEmergency} meses</strong> do seu padrão de vida pago</span>
            </div>
          </div>

        </div>

        {/* 3. A BOLA DE NEVE DOS JUROS (SEU BOLSO vs LUCRO DOS JUROS) */}
        <div className="p-5 rounded-2xl bg-[#FAF8F4] dark:bg-[#16382E]/50 border border-[#1C4939]/15 dark:border-[#214E3E] space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-[#102D25] dark:text-[#E8E4D9] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#D4A94F]" />
              Composição desse Patrimônio (O Efeito Bola de Neve):
            </span>
            <span className="text-[11px] font-bold text-[#526B61] dark:text-[#9AB3A8]">
              {Math.round((projection.totalInterestEarned / projection.totalAccumulated) * 100)}% gerado só por juros!
            </span>
          </div>

          {/* Barra Visual Dividida */}
          <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-200 dark:bg-slate-800 shadow-inner">
            <div 
              style={{ width: `${(projection.totalDeposited / projection.totalAccumulated) * 100}%` }}
              className="bg-[#1C4939] h-full transition-all duration-300"
              title="Total depositado do seu bolso"
            />
            <div 
              style={{ width: `${(projection.totalInterestEarned / projection.totalAccumulated) * 100}%` }}
              className="bg-[#D4A94F] h-full transition-all duration-300"
              title="Lucro acumulado gerado pelos juros compostos"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs font-bold pt-1">
            <div className="flex items-center gap-1.5 text-[#1C4939] dark:text-[#78C6A3]">
              <span className="w-3 h-3 rounded-full bg-[#1C4939] shrink-0 inline-block" />
              <span>O que saiu do seu bolso: <strong>{formatBRL(projection.totalDeposited, privacyMode)}</strong></span>
            </div>

            <div className="flex items-center gap-1.5 text-[#9A7220] dark:text-[#D4A94F]">
              <span className="w-3 h-3 rounded-full bg-[#D4A94F] shrink-0 inline-block" />
              <span>Lucro que o dinheiro gerou sozinho: <strong>+{formatBRL(projection.totalInterestEarned, privacyMode)}</strong></span>
            </div>
          </div>
        </div>

        {/* 4. CONTROLES DE PODER (APORTE MENSAL E PATRIMÔNIO ATUAL) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#102D25] border border-[#1C4939]/20 dark:border-[#214E3E] space-y-5">
          
          {/* Controle do Aporte Mensal */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-black uppercase text-[#102D25] dark:text-[#E8E4D9] block">
                  Quanto você vai aportar por mês?
                </label>
                <span className="text-[11px] text-[#526B61] dark:text-[#9AB3A8]">
                  O motor principal do seu crescimento financeiro
                </span>
              </div>

              <div className="text-right">
                <span className="text-xl sm:text-2xl font-black text-[#1C4939] dark:text-[#78C6A3] font-mono tabular-nums">
                  {formatBRL(monthlyContribution, privacyMode)}
                </span>
                <span className="text-xs font-semibold text-[#526B61] dark:text-[#9AB3A8]"> /mês</span>
              </div>
            </div>

            {/* Slider de Aporte */}
            <input
              type="range"
              min={100}
              max={5000}
              step={50}
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(Number(e.target.value))}
              className="w-full accent-[#1C4939] dark:accent-[#D4A94F] cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
            />

            {/* Atalhos de Alto Impacto baseados na Renda Real ou Valores Fortes */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#526B61] dark:text-[#9AB3A8]">
                Atalhos de Aporte:
              </span>

              {totalIncome > 0 ? (
                // Se o usuário tiver renda cadastrada, sugere % da renda real
                [15, 25, 35, 50].map((pct) => {
                  const val = Math.round(totalIncome * (pct / 100));
                  return (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setMonthlyContribution(val)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        monthlyContribution === val
                          ? 'bg-[#1C4939] text-[#E8E4D9] shadow-xs'
                          : 'bg-[#FAF8F4] dark:bg-[#16382E] text-[#102D25] dark:text-[#E8E4D9] border border-slate-200 dark:border-[#214E3E] hover:border-[#D4A94F]'
                      }`}
                    >
                      {pct}% da renda ({formatBRL(val, privacyMode)})
                    </button>
                  );
                })
              ) : (
                // Se não tiver renda cadastrada, usa valores padrão de impacto
                [300, 600, 1200, 2500].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setMonthlyContribution(val)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      monthlyContribution === val
                        ? 'bg-[#1C4939] text-[#E8E4D9] shadow-xs'
                        : 'bg-[#FAF8F4] dark:bg-[#16382E] text-[#102D25] dark:text-[#E8E4D9] border border-slate-200 dark:border-[#214E3E] hover:border-[#D4A94F]'
                    }`}
                  >
                    {formatBRL(val, privacyMode)}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Capital Inicial (Se já tiver dinheiro guardado) */}
          <div className="pt-4 border-t border-slate-100 dark:border-[#214E3E] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-extrabold text-[#102D25] dark:text-[#E8E4D9] block">
                Já tem algum valor guardado para começar?
              </span>
              <span className="text-[11px] text-[#526B61] dark:text-[#9AB3A8]">
                O dinheiro inicial potencializa ainda mais a velocidade dos juros
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#526B61] dark:text-[#9AB3A8]">R$</span>
              <input
                type="number"
                min={0}
                step={500}
                value={startingCapital}
                onChange={(e) => setStartingCapital(Math.max(0, Number(e.target.value)))}
                className="input-duo text-xs py-1.5 px-3 w-32 font-mono tabular-nums font-bold"
                placeholder="0,00"
              />
            </div>
          </div>

        </div>

        {/* 5. METAS ATIVAS ACELERADAS */}
        {savingsGoals.length > 0 && (
          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#526B61] dark:text-[#9AB3A8] block">
              Impacto Direto nas Suas Metas Ativas:
            </span>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {savingsGoals.map((g) => {
                const remaining = Math.max(0, g.targetAmount - g.currentAmount);
                const monthsToFinish = Math.ceil(remaining / Math.max(1, monthlyContribution));
                return (
                  <div
                    key={g.id}
                    className="p-3 rounded-xl bg-[#FAF8F4] dark:bg-[#16382E]/50 border border-slate-200 dark:border-[#214E3E] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-[#D4A94F]" />
                      <div>
                        <span className="font-extrabold text-[#102D25] dark:text-[#E8E4D9]">{g.title}</span>
                        <span className="text-[10px] text-[#526B61] dark:text-[#9AB3A8] block">
                          Faltam {formatBRL(remaining, privacyMode)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Alcançada em apenas <strong>{monthsToFinish} {monthsToFinish === 1 ? 'mês' : 'meses'}</strong>!</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. FORMULÁRIO DE COMPROMISSO INLINE (TRANSFORMAR EM META) */}
        {isCreatingGoal ? (
          <div className="p-5 rounded-2xl bg-[#FAF8F4] dark:bg-[#16382E] border-2 border-[#D4A94F] shadow-sm space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-[#102D25] dark:text-[#E8E4D9] flex items-center gap-2">
                <Crown className="w-4 h-4 text-[#D4A94F]" />
                Registrar Minha Meta de Liberdade Financeira
              </span>
              <button
                type="button"
                onClick={() => setIsCreatingGoal(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                Cancelar
              </button>
            </div>

            <p className="text-xs text-[#526B61] dark:text-[#9AB3A8]">
              Isso vai criar uma meta oficial no seu painel para você acompanhar os aportes e ver sua bola de neve crescer mês a mês.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-black text-[#526B61] dark:text-[#9AB3A8] uppercase mb-1">
                  Nome da Meta:
                </label>
                <input
                  type="text"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="input-duo text-xs w-full font-bold"
                  placeholder="Ex: Minha Independência em 5 Anos"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#526B61] dark:text-[#9AB3A8] uppercase mb-1">
                  Patrimônio Alvo em {horizon} {horizon === 1 ? 'Ano' : 'Anos'} (R$):
                </label>
                <input
                  type="number"
                  value={goalTargetAmount}
                  onChange={(e) => setGoalTargetAmount(Number(e.target.value))}
                  className="input-duo text-xs w-full font-mono tabular-nums font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={isSavingGoal}
                onClick={handleSaveGoal}
                className="btn-duo btn-duo-yellow px-5 py-2.5 text-xs font-black flex items-center gap-1.5 shadow-sm"
              >
                {isSavingGoal ? 'Salvando Meta...' : 'Confirmar e Iniciar Minha Jornada'}
              </button>
            </div>
          </div>
        ) : null}

        {goalFeedback && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{goalFeedback}</span>
          </div>
        )}

        {/* 7. RODAPÉ COM CHAMADA PARA AÇÃO INSPIRADORA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-[#214E3E]">
          <button
            type="button"
            onClick={() => setIsCreatingGoal(!isCreatingGoal)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-black bg-[#D4A94F] hover:bg-[#C3963B] text-[#102D25] shadow-md transition-all active:scale-95"
          >
            <Rocket className="w-4 h-4 stroke-[2.5]" />
            <span>Transformar essa Simulação em Meta Real</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto btn-duo btn-duo-green px-6 py-2.5 text-xs sm:text-sm font-black"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};