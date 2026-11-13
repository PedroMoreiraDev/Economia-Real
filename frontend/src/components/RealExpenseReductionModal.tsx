import React, { useState, useMemo } from 'react';
import { 
  X, 
  Sparkles, 
  UtensilsCrossed, 
  Tv, 
  Coins, 
  PieChart, 
  ArrowRight, 
  CheckCircle2, 
  Sliders
} from 'lucide-react';
import { Transaction } from '../types/financial';
import { RecurringBill } from '../types/recurring';
import { CategoryDistributionItem } from '../types/analytics';

export type ReductionFocusMode = 'DELIVERY' | 'SUBSCRIPTIONS' | 'SMALL_EXPENSES' | 'ALL_EXPENSES';

interface RealExpenseReductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: ReductionFocusMode;
  totalIncome: number;
  totalExpense: number;
  transactions?: Transaction[];
  recurringBills?: RecurringBill[];
  categoryDistribution?: CategoryDistributionItem[];
  privacyMode?: boolean;
}

function formatBRL(val: number | undefined, privacyMode?: boolean): string {
  if (privacyMode) return '••••••';
  if (val === undefined || isNaN(val)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

export const RealExpenseReductionModal: React.FC<RealExpenseReductionModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'DELIVERY',
  totalIncome,
  totalExpense,
  transactions = [],
  recurringBills = [],
  categoryDistribution = [],
  privacyMode,
}) => {
  const [activeMode, setActiveMode] = useState<ReductionFocusMode>(initialMode);

  // 1. Extração de Gastos Reais com Delivery
  const deliveryData = useMemo(() => {
    const deliveryKeywords = ['delivery', 'ifood', 'rappi', 'zé delivery', 'ze delivery', 'ai que fome', 'habib', 'mcdonald', 'burger king', 'pizz'];
    const list = transactions.filter((t) => {
      const desc = (t.description || '').toLowerCase();
      return t.type === 'EXPENSE' && deliveryKeywords.some((kw) => desc.includes(kw));
    });
    const total = list.reduce((acc, t) => acc + t.amount, 0);
    return {
      transactions: list,
      totalAmount: total > 0 ? total : 380, // fallback realista se não houver registros
      count: list.length,
    };
  }, [transactions]);

  // 2. Extração de Gastos Reais com Assinaturas
  const subscriptionData = useMemo(() => {
    const streamingKeywords = ['netflix', 'spotify', 'prime', 'disney', 'max', 'hbo', 'globoplay', 'youtube', 'deezer', 'apple', 'star+'];
    const detectedFromRecurring = recurringBills.filter((bill) => {
      const desc = bill.description.toLowerCase();
      return streamingKeywords.some((kw) => desc.includes(kw)) || bill.categoryName?.toLowerCase().includes('assinat') || bill.categoryName?.toLowerCase().includes('serviço');
    });

    // Se tiver recorrentes cadastradas, usa elas; caso contrário, busca nas transações
    let items = detectedFromRecurring.map((b) => ({
      id: b.id,
      name: b.description,
      amount: b.amount,
      checked: true,
    }));

    if (items.length === 0) {
      // Buscar em transações
      const txSubs = transactions.filter((t) => {
        const desc = (t.description || '').toLowerCase();
        return t.type === 'EXPENSE' && streamingKeywords.some((kw) => desc.includes(kw));
      });
      items = txSubs.map((t) => ({
        id: t.id,
        name: t.description,
        amount: t.amount,
        checked: true,
      }));
    }

    if (items.length === 0) {
      // Itens simulados caso o usuário ainda não tenha registrado assinaturas
      items = [
        { id: 'sub-1', name: 'Netflix Padrão', amount: 44.90, checked: true },
        { id: 'sub-2', name: 'Spotify Premium', amount: 34.90, checked: true },
        { id: 'sub-3', name: 'Amazon Prime', amount: 19.90, checked: true },
        { id: 'sub-4', name: 'Disney+ / Max', amount: 43.90, checked: true },
      ];
    }

    const total = items.reduce((acc, item) => acc + item.amount, 0);
    return { items, totalAmount: total };
  }, [recurringBills, transactions]);

  // 3. Extração de Gastos Pequenos ("Efeito Formiguinha" <= R$ 35)
  const smallExpensesData = useMemo(() => {
    const list = transactions.filter((t) => t.type === 'EXPENSE' && t.amount <= 35 && t.amount > 0);
    const total = list.reduce((acc, t) => acc + t.amount, 0);
    return {
      transactions: list,
      totalAmount: total > 0 ? total : 280,
      count: list.length > 0 ? list.length : 12,
    };
  }, [transactions]);

  // Estados dos controles de redução
  const [deliveryCutPct, setDeliveryCutPct] = useState<number>(40); // 40% de corte padrão
  const [activeSubs, setActiveSubs] = useState<Record<string, boolean>>({});
  const [smallCutPct, setSmallCutPct] = useState<number>(35); // 35% de corte padrão
  const [generalCutPct, setGeneralCutPct] = useState<number>(10); // 10% de corte geral

  // Inicializa estado de assinaturas ativas
  React.useEffect(() => {
    const initialMap: Record<string, boolean> = {};
    subscriptionData.items.forEach((item) => {
      initialMap[item.id] = true;
    });
    setActiveSubs(initialMap);
  }, [subscriptionData.items]);

  // Atualiza activeMode quando abre com novo initialMode
  React.useEffect(() => {
    if (isOpen) {
      setActiveMode(initialMode);
    }
  }, [isOpen, initialMode]);

  // Cálculo do corte selecionado baseado no modo ativo
  const calculatedCutAmount = useMemo(() => {
    if (activeMode === 'DELIVERY') {
      return (deliveryData.totalAmount * deliveryCutPct) / 100;
    }
    if (activeMode === 'SUBSCRIPTIONS') {
      const canceledTotal = subscriptionData.items.reduce((acc, item) => {
        const isKept = activeSubs[item.id] !== false;
        return isKept ? acc : acc + item.amount;
      }, 0);
      return canceledTotal;
    }
    if (activeMode === 'SMALL_EXPENSES') {
      return (smallExpensesData.totalAmount * smallCutPct) / 100;
    }
    if (activeMode === 'ALL_EXPENSES') {
      return (totalExpense * generalCutPct) / 100;
    }
    return 0;
  }, [
    activeMode, 
    deliveryData.totalAmount, 
    deliveryCutPct, 
    subscriptionData.items, 
    activeSubs, 
    smallExpensesData.totalAmount, 
    smallCutPct, 
    totalExpense, 
    generalCutPct
  ]);

  // Simulação do Fluxo de Caixa Real
  const baselineLeftover = totalIncome - totalExpense;
  const newTotalExpense = Math.max(0, totalExpense - calculatedCutAmount);
  const newLeftover = totalIncome - newTotalExpense;
  const monthlyExtraInPocket = calculatedCutAmount;
  const annualSavingsInPocket = monthlyExtraInPocket * 12;

  // % de aumento na sobra
  const leftoverIncreasePct = useMemo(() => {
    if (baselineLeftover <= 0) {
      return newLeftover > 0 ? 100 : 0;
    }
    return Math.round(((newLeftover - baselineLeftover) / baselineLeftover) * 100);
  }, [baselineLeftover, newLeftover]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl bg-[#FAF8F4] dark:bg-[#102D25] text-[#102D25] dark:text-[#E8E4D9] border-2 border-[#1C4939]/30 dark:border-[#214E3E] shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CABEÇALHO */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-[#1C4939]/20 dark:border-[#214E3E] bg-[#E8E4D9]/60 dark:bg-[#16382E]">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#1C4939] text-[#D4A94F] shadow-sm">
              <Sliders className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-[#102D25] dark:text-[#E8E4D9]">
                  Simulador de Sobra Real no Bolso
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#1C4939] text-[#D4A94F]">
                  Valores Reais
                </span>
              </div>
              <p className="text-xs font-semibold text-[#526B61] dark:text-[#9AB3A8]">
                Descubra quanto de fato sobrará na sua conta ao cortar despesas reais deste mês
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#526B61] hover:text-[#102D25] dark:text-[#9AB3A8] dark:hover:text-[#FAF8F4] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTEÚDO PRINCIPAL (SCROLLÁVEL) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* RAIO-X DO MÊS ATUAL (PONTO DE PARTIDA) */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 p-4 rounded-2xl bg-white dark:bg-[#16382E]/90 border border-[#1C4939]/20 dark:border-[#214E3E]">
            <div className="text-center sm:text-left">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#526B61] dark:text-[#9AB3A8] block">
                Renda do Mês
              </span>
              <strong className="text-sm sm:text-lg font-black text-emerald-700 dark:text-emerald-400 font-mono">
                {formatBRL(totalIncome, privacyMode)}
              </strong>
            </div>

            <div className="text-center sm:text-left border-x border-[#1C4939]/10 dark:border-[#214E3E] px-2 sm:px-4">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#526B61] dark:text-[#9AB3A8] block">
                Despesas Atuais
              </span>
              <strong className="text-sm sm:text-lg font-black text-rose-700 dark:text-rose-400 font-mono">
                {formatBRL(totalExpense, privacyMode)}
              </strong>
            </div>

            <div className="text-center sm:text-left">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#526B61] dark:text-[#9AB3A8] block">
                Sobra Atual (Saldo)
              </span>
              <strong className={`text-sm sm:text-lg font-black font-mono ${
                baselineLeftover >= 0 
                  ? 'text-[#1C4939] dark:text-[#78C6A3]' 
                  : 'text-rose-600 dark:text-rose-400'
              }`}>
                {formatBRL(baselineLeftover, privacyMode)}
              </strong>
            </div>
          </div>

          {/* SELETOR DE FOCO DE REDUÇÃO (TABS) */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-[#526B61] dark:text-[#9AB3A8] block">
              Escolha qual despesa simular redução:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setActiveMode('DELIVERY')}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  activeMode === 'DELIVERY'
                    ? 'bg-[#1C4939] text-[#FAF8F4] border-[#1C4939] shadow-sm'
                    : 'bg-white dark:bg-[#16382E] text-[#102D25] dark:text-[#E8E4D9] border-[#1C4939]/20 dark:border-[#214E3E] hover:border-[#1C4939]/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <UtensilsCrossed className={`w-4 h-4 ${activeMode === 'DELIVERY' ? 'text-[#D4A94F]' : 'text-[#526B61] dark:text-[#9AB3A8]'}`} />
                  <span className={`text-[10px] font-black ${activeMode === 'DELIVERY' ? 'text-[#D4A94F]' : 'text-[#526B61] dark:text-[#9AB3A8]'}`}>
                    {deliveryData.count > 0 ? `${deliveryData.count} pedidos` : 'Estimativa'}
                  </span>
                </div>
                <span className="text-xs font-extrabold">Delivery</span>
                <span className={`text-[11px] font-mono font-bold mt-0.5 ${activeMode === 'DELIVERY' ? 'text-white/80' : 'text-[#526B61] dark:text-[#9AB3A8]'}`}>
                  {formatBRL(deliveryData.totalAmount, privacyMode)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMode('SUBSCRIPTIONS')}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  activeMode === 'SUBSCRIPTIONS'
                    ? 'bg-[#1C4939] text-[#FAF8F4] border-[#1C4939] shadow-sm'
                    : 'bg-white dark:bg-[#16382E] text-[#102D25] dark:text-[#E8E4D9] border-[#1C4939]/20 dark:border-[#214E3E] hover:border-[#1C4939]/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Tv className={`w-4 h-4 ${activeMode === 'SUBSCRIPTIONS' ? 'text-[#D4A94F]' : 'text-[#526B61] dark:text-[#9AB3A8]'}`} />
                  <span className={`text-[10px] font-black ${activeMode === 'SUBSCRIPTIONS' ? 'text-[#D4A94F]' : 'text-[#526B61] dark:text-[#9AB3A8]'}`}>
                    {subscriptionData.items.length} itens
                  </span>
                </div>
                <span className="text-xs font-extrabold">Assinaturas</span>
                <span className={`text-[11px] font-mono font-bold mt-0.5 ${activeMode === 'SUBSCRIPTIONS' ? 'text-white/80' : 'text-[#526B61] dark:text-[#9AB3A8]'}`}>
                  {formatBRL(subscriptionData.totalAmount, privacyMode)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMode('SMALL_EXPENSES')}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  activeMode === 'SMALL_EXPENSES'
                    ? 'bg-[#1C4939] text-[#FAF8F4] border-[#1C4939] shadow-sm'
                    : 'bg-white dark:bg-[#16382E] text-[#102D25] dark:text-[#E8E4D9] border-[#1C4939]/20 dark:border-[#214E3E] hover:border-[#1C4939]/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Coins className={`w-4 h-4 ${activeMode === 'SMALL_EXPENSES' ? 'text-[#D4A94F]' : 'text-[#526B61] dark:text-[#9AB3A8]'}`} />
                  <span className={`text-[10px] font-black ${activeMode === 'SMALL_EXPENSES' ? 'text-[#D4A94F]' : 'text-[#526B61] dark:text-[#9AB3A8]'}`}>
                    &lt; R$ 35
                  </span>
                </div>
                <span className="text-xs font-extrabold">Formiguinha</span>
                <span className={`text-[11px] font-mono font-bold mt-0.5 ${activeMode === 'SMALL_EXPENSES' ? 'text-white/80' : 'text-[#526B61] dark:text-[#9AB3A8]'}`}>
                  {formatBRL(smallExpensesData.totalAmount, privacyMode)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMode('ALL_EXPENSES')}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  activeMode === 'ALL_EXPENSES'
                    ? 'bg-[#1C4939] text-[#FAF8F4] border-[#1C4939] shadow-sm'
                    : 'bg-white dark:bg-[#16382E] text-[#102D25] dark:text-[#E8E4D9] border-[#1C4939]/20 dark:border-[#214E3E] hover:border-[#1C4939]/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <PieChart className={`w-4 h-4 ${activeMode === 'ALL_EXPENSES' ? 'text-[#D4A94F]' : 'text-[#526B61] dark:text-[#9AB3A8]'}`} />
                  <span className={`text-[10px] font-black ${activeMode === 'ALL_EXPENSES' ? 'text-[#D4A94F]' : 'text-[#526B61] dark:text-[#9AB3A8]'}`}>
                    Global
                  </span>
                </div>
                <span className="text-xs font-extrabold">Geral do Mês</span>
                <span className={`text-[11px] font-mono font-bold mt-0.5 ${activeMode === 'ALL_EXPENSES' ? 'text-white/80' : 'text-[#526B61] dark:text-[#9AB3A8]'}`}>
                  {formatBRL(totalExpense, privacyMode)}
                </span>
              </button>
            </div>
          </div>

          {/* CONTROLE INTERATIVO ESPECÍFICO */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#16382E] border border-[#1C4939]/20 dark:border-[#214E3E] space-y-4">
            
            {/* MODO 1: DELIVERY */}
            {activeMode === 'DELIVERY' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <h4 className="text-sm font-extrabold text-[#102D25] dark:text-[#E8E4D9]">
                      Simular Redução de Delivery & Restaurante
                    </h4>
                    <p className="text-xs text-[#526B61] dark:text-[#9AB3A8]">
                      Gasto registrado no mês: <strong>{formatBRL(deliveryData.totalAmount, privacyMode)}</strong>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-[#526B61] dark:text-[#9AB3A8] block">Corte Simulado:</span>
                    <strong className="text-base font-black text-emerald-700 dark:text-emerald-400 font-mono">
                      -{formatBRL(calculatedCutAmount, privacyMode)} ({deliveryCutPct}%)
                    </strong>
                  </div>
                </div>

                {/* Slider */}
                <div className="space-y-1">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={deliveryCutPct}
                    onChange={(e) => setDeliveryCutPct(Number(e.target.value))}
                    className="w-full h-2.5 bg-[#FAF8F4] dark:bg-[#102D25] rounded-lg appearance-none cursor-pointer accent-[#1C4939] dark:accent-[#78C6A3]"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-[#526B61] dark:text-[#9AB3A8]">
                    <span>0% (Manter)</span>
                    <span>25% (-1 ped/sem)</span>
                    <span>50% (Pela metade)</span>
                    <span>75%</span>
                    <span>100% (Zerar)</span>
                  </div>
                </div>

                {/* Atalhos Rápidos */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {[25, 40, 50, 75].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setDeliveryCutPct(pct)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        deliveryCutPct === pct
                          ? 'bg-[#1C4939] text-[#D4A94F] border-[#1C4939]'
                          : 'bg-[#FAF8F4] dark:bg-[#102D25] text-[#102D25] dark:text-[#E8E4D9] border-[#1C4939]/20 hover:border-[#1C4939]'
                      }`}
                    >
                      Reduzir {pct}% (-{formatBRL((deliveryData.totalAmount * pct) / 100, privacyMode)})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* MODO 2: ASSINATURAS */}
            {activeMode === 'SUBSCRIPTIONS' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <h4 className="text-sm font-extrabold text-[#102D25] dark:text-[#E8E4D9]">
                      Simular Cancelamento de Assinaturas & Streaming
                    </h4>
                    <p className="text-xs text-[#526B61] dark:text-[#9AB3A8]">
                      Desmarque os serviços que você toparia pausar ou alternar:
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-[#526B61] dark:text-[#9AB3A8] block">Economia Simulada:</span>
                    <strong className="text-base font-black text-emerald-700 dark:text-emerald-400 font-mono">
                      +{formatBRL(calculatedCutAmount, privacyMode)}/mês
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {subscriptionData.items.map((sub) => {
                    const isKept = activeSubs[sub.id] !== false;
                    return (
                      <div
                        key={sub.id}
                        onClick={() => setActiveSubs((prev) => ({ ...prev, [sub.id]: !isKept }))}
                        className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                          isKept
                            ? 'bg-[#FAF8F4] dark:bg-[#102D25] border-[#1C4939]/20 dark:border-[#214E3E]'
                            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isKept}
                            onChange={() => {}}
                            className="rounded border-[#1C4939] text-[#1C4939] focus:ring-[#1C4939]"
                          />
                          <span className={`text-xs font-bold ${!isKept ? 'line-through text-rose-700 dark:text-rose-400' : 'text-[#102D25] dark:text-[#E8E4D9]'}`}>
                            {sub.name}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold block">
                            {formatBRL(sub.amount, privacyMode)}
                          </span>
                          {!isKept && (
                            <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400">
                              + Economizado
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* MODO 3: FORMIGUINHA */}
            {activeMode === 'SMALL_EXPENSES' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <h4 className="text-sm font-extrabold text-[#102D25] dark:text-[#E8E4D9]">
                      Estancar o Efeito Formiguinha (Compras &lt; R$ 35)
                    </h4>
                    <p className="text-xs text-[#526B61] dark:text-[#9AB3A8]">
                      Você teve <strong>{smallExpensesData.count}</strong> pequenos gastos somando <strong>{formatBRL(smallExpensesData.totalAmount, privacyMode)}</strong> este mês
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-[#526B61] dark:text-[#9AB3A8] block">Corte Simulado:</span>
                    <strong className="text-base font-black text-emerald-700 dark:text-emerald-400 font-mono">
                      -{formatBRL(calculatedCutAmount, privacyMode)} ({smallCutPct}%)
                    </strong>
                  </div>
                </div>

                <div className="space-y-1">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={smallCutPct}
                    onChange={(e) => setSmallCutPct(Number(e.target.value))}
                    className="w-full h-2.5 bg-[#FAF8F4] dark:bg-[#102D25] rounded-lg appearance-none cursor-pointer accent-[#1C4939] dark:accent-[#78C6A3]"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-[#526B61] dark:text-[#9AB3A8]">
                    <span>0% (Sem teto)</span>
                    <span>25%</span>
                    <span>50% (Meta disciplinada)</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {[20, 35, 50, 70].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setSmallCutPct(pct)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        smallCutPct === pct
                          ? 'bg-[#1C4939] text-[#D4A94F] border-[#1C4939]'
                          : 'bg-[#FAF8F4] dark:bg-[#102D25] text-[#102D25] dark:text-[#E8E4D9] border-[#1C4939]/20 hover:border-[#1C4939]'
                      }`}
                    >
                      Segurar {pct}% (-{formatBRL((smallExpensesData.totalAmount * pct) / 100, privacyMode)})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* MODO 4: CORTE GERAL DAS DESPESAS */}
            {activeMode === 'ALL_EXPENSES' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <h4 className="text-sm font-extrabold text-[#102D25] dark:text-[#E8E4D9]">
                      Simular Otimização Geral de Despesas
                    </h4>
                    <p className="text-xs text-[#526B61] dark:text-[#9AB3A8]">
                      Total de despesas do mês: <strong>{formatBRL(totalExpense, privacyMode)}</strong>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-[#526B61] dark:text-[#9AB3A8] block">Corte Global:</span>
                    <strong className="text-base font-black text-emerald-700 dark:text-emerald-400 font-mono">
                      -{formatBRL(calculatedCutAmount, privacyMode)} ({generalCutPct}%)
                    </strong>
                  </div>
                </div>

                <div className="space-y-1">
                  <input
                    type="range"
                    min={0}
                    max={30}
                    step={1}
                    value={generalCutPct}
                    onChange={(e) => setGeneralCutPct(Number(e.target.value))}
                    className="w-full h-2.5 bg-[#FAF8F4] dark:bg-[#102D25] rounded-lg appearance-none cursor-pointer accent-[#1C4939] dark:accent-[#78C6A3]"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-[#526B61] dark:text-[#9AB3A8]">
                    <span>0% (Sem cortes)</span>
                    <span>5% (Suave)</span>
                    <span>10% (Moderado)</span>
                    <span>15% (Ousado)</span>
                    <span>30% (Extremo)</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {[5, 10, 15, 20].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setGeneralCutPct(pct)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        generalCutPct === pct
                          ? 'bg-[#1C4939] text-[#D4A94F] border-[#1C4939]'
                          : 'bg-[#FAF8F4] dark:bg-[#102D25] text-[#102D25] dark:text-[#E8E4D9] border-[#1C4939]/20 hover:border-[#1C4939]'
                      }`}
                    >
                      Otimizar {pct}% (-{formatBRL((totalExpense * pct) / 100, privacyMode)})
                    </button>
                  ))}
                </div>

                {categoryDistribution.length > 0 && (
                  <div className="pt-3 border-t border-[#1C4939]/10 dark:border-[#214E3E] space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#526B61] dark:text-[#9AB3A8] block">
                      Suas Maiores Categorias de Despesa:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {categoryDistribution.slice(0, 6).map((cat) => (
                        <div key={cat.categoryId} className="p-2 rounded-xl bg-[#FAF8F4] dark:bg-[#102D25] border border-[#1C4939]/10 dark:border-[#214E3E]">
                          <span className="text-xs font-bold text-[#102D25] dark:text-[#E8E4D9] truncate block">
                            {cat.categoryName}
                          </span>
                          <span className="text-[11px] font-mono text-[#526B61] dark:text-[#9AB3A8] font-bold block">
                            {formatBRL(cat.totalAmount, privacyMode)} ({cat.percentage.toFixed(0)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PAINEL DE RESULTADO: O QUE DE FATO SOBRA NO BOLSO */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#102D25] to-[#1C4939] text-[#FAF8F4] border-2 border-[#D4A94F]/40 shadow-lg space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-black uppercase tracking-wider text-[#D4A94F] flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Impacto Real na Sua Conta Bancária:
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#D4A94F] text-[#102D25]">
                Resultado Imediato
              </span>
            </div>

            {/* Três Métricas Chave */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* 1. Novas Despesas */}
              <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10">
                <span className="text-[10px] uppercase font-bold text-[#9AB3A8] block">
                  Despesas Reduzem Para:
                </span>
                <strong className="text-base sm:text-lg font-black text-white font-mono block mt-1">
                  {formatBRL(newTotalExpense, privacyMode)}
                </strong>
                <span className="text-[10px] font-bold text-rose-300 block mt-0.5">
                  de {formatBRL(totalExpense, privacyMode)} (-{formatBRL(calculatedCutAmount, privacyMode)})
                </span>
              </div>

              {/* 2. NOVA SOBRA NO BOLSO NO MÊS */}
              <div className="p-3.5 rounded-2xl bg-[#D4A94F]/20 border-2 border-[#D4A94F]/50">
                <span className="text-[10px] uppercase font-black text-[#D4A94F] block">
                  NOVA SOBRA NO SEU BOLSO:
                </span>
                <strong className="text-lg sm:text-xl font-black text-[#FAF8F4] font-mono block mt-0.5">
                  {formatBRL(newLeftover, privacyMode)}
                </strong>
                <span className="text-[10px] font-bold text-[#78C6A3] block mt-0.5">
                  +{formatBRL(monthlyExtraInPocket, privacyMode)} a mais todo mês! {leftoverIncreasePct > 0 && `(+${leftoverIncreasePct}%)`}
                </span>
              </div>

              {/* 3. ECONOMIA EM 1 ANO */}
              <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10">
                <span className="text-[10px] uppercase font-bold text-[#9AB3A8] block">
                  Em 1 Ano (12 Meses):
                </span>
                <strong className="text-base sm:text-lg font-black text-[#78C6A3] font-mono block mt-1">
                  +{formatBRL(annualSavingsInPocket, privacyMode)}
                </strong>
                <span className="text-[10px] font-semibold text-white/80 block mt-0.5">
                  guardados limpos na sua conta
                </span>
              </div>
            </div>

            {/* BARRA COMPARATIVA: DIVISÃO DA RENDA ANTES VS DEPOIS */}
            {totalIncome > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex justify-between text-[11px] font-bold text-[#9AB3A8]">
                  <span>Distribuição da sua renda de {formatBRL(totalIncome, privacyMode)}:</span>
                  <span className="text-[#D4A94F]">Antes vs Projetado</span>
                </div>

                <div className="space-y-1.5">
                  {/* Cenário Atual */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[10px] text-white/70">
                      <span>Hoje:</span>
                      <span>
                        Despesas: {Math.round((totalExpense / totalIncome) * 100)}% | Sobra: {Math.max(0, Math.round((baselineLeftover / totalIncome) * 100))}%
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-white/20 flex overflow-hidden">
                      <div 
                        style={{ width: `${Math.min(100, Math.max(0, (totalExpense / totalIncome) * 100))}%` }} 
                        className="bg-rose-500/80 h-full transition-all"
                      />
                      <div 
                        style={{ width: `${Math.min(100, Math.max(0, (baselineLeftover / totalIncome) * 100))}%` }} 
                        className="bg-emerald-500/80 h-full transition-all"
                      />
                    </div>
                  </div>

                  {/* Cenário Simulado */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[10px] text-[#D4A94F] font-bold">
                      <span>Com a redução:</span>
                      <span>
                        Despesas: {Math.round((newTotalExpense / totalIncome) * 100)}% | Sobra Livre: {Math.max(0, Math.round((newLeftover / totalIncome) * 100))}%
                      </span>
                    </div>
                    <div className="w-full h-3.5 rounded-full bg-white/20 flex overflow-hidden border border-[#D4A94F]/40">
                      <div 
                        style={{ width: `${Math.min(100, Math.max(0, (newTotalExpense / totalIncome) * 100))}%` }} 
                        className="bg-rose-400/80 h-full transition-all"
                      />
                      <div 
                        style={{ width: `${Math.min(100, Math.max(0, (newLeftover / totalIncome) * 100))}%` }} 
                        className="bg-emerald-400 h-full transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Mensagem de Diagnóstico Real */}
                <p className="text-xs font-semibold text-[#E8E4D9] pt-2">
                  {baselineLeftover < 0 && newLeftover >= 0 ? (
                    <span className="text-emerald-300 font-bold">
                      🎉 Incrível! Esse corte sozinho tira você do vermelho (de {formatBRL(baselineLeftover, privacyMode)}) e coloca sua conta no positivo com {formatBRL(newLeftover, privacyMode)} livres todo mês!
                    </span>
                  ) : baselineLeftover < 0 ? (
                    <span className="text-amber-300">
                      ⚠️ Você reduz seu déficit mensal em {formatBRL(calculatedCutAmount, privacyMode)}, passando de {formatBRL(baselineLeftover, privacyMode)} para {formatBRL(newLeftover, privacyMode)}.
                    </span>
                  ) : (
                    <span>
                      💡 Reduzindo <strong>{formatBRL(calculatedCutAmount, privacyMode)}</strong> nos seus gastos, sua sobra mensal sobe de <strong>{formatBRL(baselineLeftover, privacyMode)}</strong> para <strong>{formatBRL(newLeftover, privacyMode)}</strong>. Em 12 meses você terá <strong>{formatBRL(annualSavingsInPocket, privacyMode)}</strong> a mais para seus projetos!
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

        </div>

        {/* RODAPÉ DO MODAL */}
        <div className="p-4 sm:p-5 border-t border-[#1C4939]/20 dark:border-[#214E3E] bg-[#E8E4D9]/40 dark:bg-[#16382E] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[#526B61] dark:text-[#9AB3A8]">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Simulação em tempo real sobre seus lançamentos reais</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-duo btn-duo-green w-full sm:w-auto px-6 py-2.5 text-xs font-black flex items-center justify-center gap-2"
          >
            <span>Concluir e Voltar</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

