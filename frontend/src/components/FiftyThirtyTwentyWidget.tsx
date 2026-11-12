import React, { useMemo } from 'react';
import { Target, Sparkles } from 'lucide-react';
import { Transaction } from '../types/financial';

interface FiftyThirtyTwentyWidgetProps {
  transactions: Transaction[];
  totalIncome: number;
  privacyMode?: boolean;
}

function formatBRL(val: number | undefined, privacyMode?: boolean): string {
  if (privacyMode) return '••••••';
  if (val === undefined || isNaN(val)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

// Classificação canônica das categorias do sistema
const NEEDS_KEYWORDS = [
  'moradia', 'aluguel', 'condominio', 'condomínio', 'luz', 'energia', 'agua', 'água',
  'gas', 'gás', 'internet', 'supermercado', 'mercado', 'alimentação', 'alimentacao',
  'saude', 'saúde', 'farmacia', 'farmácia', 'medico', 'médico', 'educação', 'educacao',
  'transporte', 'combustivel', 'combustível', 'posto', 'contas', 'fixas', 'escola'
];

const WANTS_KEYWORDS = [
  'delivery', 'ifood', 'rappi', 'restaurante', 'bar', 'bares', 'lazer', 'viagem',
  'compras', 'shopping', 'roupa', 'vestuário', 'streaming', 'netflix', 'spotify',
  'jogos', 'games', 'cinema', 'eletrônicos', 'estilo', 'beleza', 'salao', 'salão'
];

export const FiftyThirtyTwentyWidget: React.FC<FiftyThirtyTwentyWidgetProps> = ({
  transactions,
  totalIncome,
  privacyMode,
}) => {
  const analysis = useMemo(() => {
    let needsTotal = 0;
    let wantsTotal = 0;
    let savingsTotal = 0;

    // 1. Analisa as despesas do mês corrente
    transactions.forEach((tx) => {
      if (tx.type !== 'EXPENSE') return;
      const desc = (tx.description || '').toLowerCase();

      if (NEEDS_KEYWORDS.some((kw) => desc.includes(kw))) {
        needsTotal += tx.amount;
      } else if (WANTS_KEYWORDS.some((kw) => desc.includes(kw))) {
        wantsTotal += tx.amount;
      } else {
        // Se não identificado com certeza, pondera como 50% necessidades e 50% desejos
        needsTotal += tx.amount * 0.6;
        wantsTotal += tx.amount * 0.4;
      }
    });

    // 2. Futuro: sobra de renda no mês
    const remainingIncome = Math.max(0, totalIncome - (needsTotal + wantsTotal));
    savingsTotal = remainingIncome;

    const baseIncome = totalIncome > 0 ? totalIncome : (needsTotal + wantsTotal);
    const needsPct = baseIncome > 0 ? (needsTotal / baseIncome) * 100 : 0;
    const wantsPct = baseIncome > 0 ? (wantsTotal / baseIncome) * 100 : 0;
    const savingsPct = baseIncome > 0 ? (savingsTotal / baseIncome) * 100 : 0;

    return {
      needsTotal,
      wantsTotal,
      savingsTotal,
      needsPct,
      wantsPct,
      savingsPct,
    };
  }, [transactions, totalIncome]);

  const { needsTotal, wantsTotal, savingsTotal, needsPct, wantsPct, savingsPct } = analysis;

  return (
    <div className="card-duo-green p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1C4939]/20 dark:border-[#214E3E] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[#1C4939] dark:bg-[#102D25] text-[#D4A94F] border border-[#D4A94F]/40 shadow-xs">
            <Target className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-extrabold text-[#102D25] dark:text-[#E8E4D9]">
                Regra 50 / 30 / 20
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#FAF8F4] dark:bg-[#16382E] text-[#1C4939] dark:text-[#78C6A3] border border-[#1C4939]/30">
                Padrão Financeiro
              </span>
            </div>
            <p className="text-xs font-semibold text-[#526B61] dark:text-[#9AB3A8]">
              Equilíbrio recomendado: 50% Necessidades, 30% Desejos e 20% Futuro
            </p>
          </div>
        </div>
      </div>

      {/* Grid com os 3 Pilares */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* 1. Necessidades (50%) */}
        <div className="p-5 rounded-2xl bg-white/90 dark:bg-[#102D25]/90 border border-[#1C4939]/20 dark:border-[#214E3E] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#026CD6]" />
              <h4 className="text-sm font-black text-[#102D25] dark:text-[#E8E4D9]">Necessidades</h4>
            </div>
            <span className="text-[11px] font-black text-[#026CD6] bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900">
              Ideal: 50%
            </span>
          </div>

          <div>
            <p className="text-2xl font-black text-[#102D25] dark:text-[#E8E4D9]">
              {formatBRL(needsTotal, privacyMode)}
            </p>
            <div className="flex items-center justify-between text-xs mt-1 font-bold text-[#526B61] dark:text-[#9AB3A8]">
              <span>Realizado: {needsPct.toFixed(1)}%</span>
              <span className={needsPct <= 55 ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-amber-600 dark:text-amber-400 font-extrabold'}>
                {needsPct <= 50 ? 'No Alvo' : needsPct <= 60 ? 'Atenção' : 'Alto'}
              </span>
            </div>
          </div>

          <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                needsPct <= 55 ? 'bg-[#026CD6]' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, needsPct)}%` }}
            />
          </div>

          <p className="text-[11px] text-[#526B61] dark:text-[#9AB3A8] leading-relaxed">
            Moradia, contas básicas, mercado, saúde e transporte essencial.
          </p>
        </div>

        {/* 2. Desejos (30%) */}
        <div className="p-5 rounded-2xl bg-white/90 dark:bg-[#102D25]/90 border border-[#1C4939]/20 dark:border-[#214E3E] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#D4A94F]" />
              <h4 className="text-sm font-black text-[#102D25] dark:text-[#E8E4D9]">Desejos & Lazer</h4>
            </div>
            <span className="text-[11px] font-black text-[#9A7220] dark:text-[#D4A94F] bg-[#FAF8F4] dark:bg-[#16382E] px-2 py-0.5 rounded-md border border-[#D4A94F]/40">
              Ideal: 30%
            </span>
          </div>

          <div>
            <p className="text-2xl font-black text-[#102D25] dark:text-[#E8E4D9]">
              {formatBRL(wantsTotal, privacyMode)}
            </p>
            <div className="flex items-center justify-between text-xs mt-1 font-bold text-[#526B61] dark:text-[#9AB3A8]">
              <span>Realizado: {wantsPct.toFixed(1)}%</span>
              <span className={wantsPct <= 35 ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-rose-600 dark:text-rose-400 font-extrabold'}>
                {wantsPct <= 30 ? 'Equilibrado' : wantsPct <= 40 ? 'Atenção' : 'Excedido'}
              </span>
            </div>
          </div>

          <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                wantsPct <= 35 ? 'bg-[#D4A94F]' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, wantsPct)}%` }}
            />
          </div>

          <p className="text-[11px] text-[#526B61] dark:text-[#9AB3A8] leading-relaxed">
            Delivery, restaurantes, passeios, streaming e compras pessoais.
          </p>
        </div>

        {/* 3. Futuro (20%) */}
        <div className="p-5 rounded-2xl bg-white/90 dark:bg-[#102D25]/90 border border-[#1C4939]/20 dark:border-[#214E3E] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#1C4939] dark:bg-[#78C6A3]" />
              <h4 className="text-sm font-black text-[#102D25] dark:text-[#E8E4D9]">Futuro & Metas</h4>
            </div>
            <span className="text-[11px] font-black text-[#1C4939] dark:text-[#78C6A3] bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
              Ideal: 20%
            </span>
          </div>

          <div>
            <p className="text-2xl font-black text-[#102D25] dark:text-[#E8E4D9]">
              {formatBRL(savingsTotal, privacyMode)}
            </p>
            <div className="flex items-center justify-between text-xs mt-1 font-bold text-[#526B61] dark:text-[#9AB3A8]">
              <span>Realizado: {savingsPct.toFixed(1)}%</span>
              <span className={savingsPct >= 20 ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-amber-600 dark:text-amber-400 font-extrabold'}>
                {savingsPct >= 20 ? 'Excelente' : 'Construindo'}
              </span>
            </div>
          </div>

          <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                savingsPct >= 20 ? 'bg-[#1C4939] dark:bg-[#78C6A3]' : 'bg-amber-400'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, savingsPct))}%` }}
            />
          </div>

          <p className="text-[11px] text-[#526B61] dark:text-[#9AB3A8] leading-relaxed">
            Metas de economia, reserva de emergência e investimentos.
          </p>
        </div>

      </div>

      {/* Dica da Inteligência Artificial */}
      <div className="p-4 rounded-xl bg-white/70 dark:bg-[#16382E]/80 border border-[#1C4939]/15 dark:border-[#214E3E] flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-[#D4A94F] shrink-0 mt-0.5" />
        <p className="text-xs font-semibold text-[#102D25] dark:text-[#E8E4D9]">
          {wantsPct > 35 ? (
            <>
              Seus gastos com <strong>Desejos & Lazer</strong> estão em {wantsPct.toFixed(0)}% (acima do ideal de 30%).
              Reduzir pedidos por impulso e renegociar assinaturas liberará fôlego imediato para acelerar suas metas de economia!
            </>
          ) : savingsPct >= 20 ? (
            <>
              Parabéns! Você está reservando <strong>{savingsPct.toFixed(0)}%</strong> da sua renda para o seu futuro,
              atingindo com perfeição o padrão ouro de saúde financeira!
            </>
          ) : (
            <>
              Você está com boa gestão! Para alcançar o alvo de <strong>20% de economia mensal</strong>,
              experimente direcionar os excedentes de caixa diretamente para suas Metas de Economia.
            </>
          )}
        </p>
      </div>
    </div>
  );
};
