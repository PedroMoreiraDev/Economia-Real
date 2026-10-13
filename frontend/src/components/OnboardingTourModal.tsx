import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  UploadCloud,
  Plus,
  Tag,
  CalendarDays,
  Target,
  Mic,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  X,
  CreditCard,
  TrendingUp,
  Compass,
  ArrowRight,
  Check,
  Eye,
  ArrowLeftRight
} from 'lucide-react';

export type TourTabType = 'overview' | 'analytics' | 'recurring' | 'goals';
type CornerPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

interface OnboardingTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: TourTabType;
  onSelectTab: (tab: TourTabType) => void;
  userId?: string;
  onOpenImportModal?: () => void;
  onOpenTransactionModal?: () => void;
  onOpenAiModal?: () => void;
  onOpenAiBudgetModal?: () => void;
}

export const OnboardingTourModal: React.FC<OnboardingTourModalProps> = ({
  isOpen,
  onClose,
  currentTab,
  onSelectTab,
  userId,
  onOpenImportModal,
  onOpenTransactionModal,
  onOpenAiModal,
  onOpenAiBudgetModal,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [cornerPosition, setCornerPosition] = useState<CornerPosition>('bottom-right');
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(() => {
    if (!userId) return false;
    return localStorage.getItem(`economia_real_tutorial_disabled_${userId}`) === 'true';
  });

  const activeHighlightedElRef = useRef<HTMLElement | null>(null);

  // Definição dos 7 passos didáticos
  const steps = [
    {
      id: 1,
      badge: 'Passo 1 • Sem Digitação Manual',
      badgeColor: 'bg-blue-100 text-[#026CD6] border-blue-200',
      title: 'Importe sua Fatura de Cartão',
      targetName: 'Botão "Importar Extrato"',
      shortText:
        'Baixe a fatura do seu banco em arquivo CSV ou OFX e suba aqui. O sistema lê cada compra e organiza suas despesas automaticamente sem você precisar digitar nada!',
      tip: 'Funciona com Nubank, Inter, Itaú, C6, Bradesco e qualquer banco que exporte extrato.',
      targetId: 'tour-import-btn',
      requiredTab: 'overview' as TourTabType,
      actionBtn: onOpenImportModal
        ? {
            label: 'Importar Fatura Agora',
            icon: UploadCloud,
            action: () => {
              onClose();
              onOpenImportModal();
            },
          }
        : null,
      preview: (
        <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-inner space-y-2 border border-slate-800">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
            <span className="flex items-center gap-1.5 text-blue-400">
              <CreditCard className="w-3.5 h-3.5" /> Cartão de Crédito
            </span>
            <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full text-[10px]">
              OFX & CSV
            </span>
          </div>
          <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black">
                ✓
              </div>
              <div className="text-left">
                <p className="text-[11px] font-black text-slate-200">fatura_nubank.csv</p>
                <p className="text-[10px] text-slate-400 font-bold">42 compras classificadas</p>
              </div>
            </div>
            <span className="text-[11px] font-black text-emerald-400">100% Importado</span>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      badge: 'Passo 2 • Salário e Renda',
      badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      title: 'Adicione suas Receitas & Extras',
      targetName: 'Botão "Novo Lançamento"',
      shortText:
        'Clique em "Novo Lançamento" para cadastrar seu salário mensal, rendimentos de freelas ou compras avulsas no dinheiro/PIX. Assim você vê exatamente se o mês está no azul!',
      tip: 'Cadastre suas entradas primeiro para ter a base de quanto pode gastar no mês.',
      targetId: 'tour-add-btn',
      requiredTab: 'overview' as TourTabType,
      actionBtn: onOpenTransactionModal
        ? {
            label: 'Novo Lançamento',
            icon: Plus,
            action: () => {
              onClose();
              onOpenTransactionModal();
            },
          }
        : null,
      preview: (
        <div className="bg-emerald-50/90 border-2 border-emerald-200 p-3 rounded-2xl space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-emerald-800">
              Entradas do Mês
            </span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
              Receita Ativa
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-black p-1.5 rounded-xl bg-white shadow-2xs border border-emerald-100">
              <span className="text-slate-800">Salário CLT</span>
              <span className="text-emerald-600">+ R$ 5.500,00</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-black p-1.5 rounded-xl bg-white shadow-2xs border border-emerald-100">
              <span className="text-slate-800">Rendimentos</span>
              <span className="text-emerald-600">+ R$ 380,00</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      badge: 'Passo 3 • Organização com 1 Clique',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      title: 'Revise as Categorias da Fatura',
      targetName: 'Extrato de Movimentações',
      shortText:
        'No Extrato de Movimentações, encontre as compras com o alerta "⚠️ Sem Categoria". Basta clicar na tag para escolher a categoria diretamente na tabela com um toque!',
      tip: 'Conforme você ajusta, nossa inteligência aprende seus hábitos para as próximas importações.',
      targetId: 'tour-statement-section',
      requiredTab: 'overview' as TourTabType,
      actionBtn: null,
      preview: (
        <div className="bg-slate-50 border-2 border-slate-200 p-3 rounded-2xl space-y-1.5 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-black text-slate-600">
            <Tag className="w-3.5 h-3.5 text-amber-500" />
            <span>Classificação Direta com 1 Clique</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-black flex items-center gap-1 line-through opacity-70">
              ⚠️ Sem Categoria
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 stroke-[3]" />
            <div className="px-2.5 py-1 rounded-xl bg-blue-50 border border-blue-200 text-[#026CD6] text-[11px] font-black flex items-center gap-1 shadow-sm">
              🛒 Supermercado
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-500">
            Clique na tag na tabela e mude na hora!
          </p>
        </div>
      ),
    },
    {
      id: 4,
      badge: 'Passo 4 • Previsibilidade',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      title: 'Cadastre suas Despesas Fixas',
      targetName: 'Aba "Despesas Fixas"',
      shortText:
        'Aluguel, condomínio, luz, internet, escola particular ou assinaturas: cadastre na aba "Despesas Fixas" para ter provisionamento antecipado de tudo o que você paga todo mês.',
      tip: 'Você consegue acompanhar quais contas já foram pagas e quais estão pendentes no mês.',
      targetId: 'tour-recurring-tab-content',
      requiredTab: 'recurring' as TourTabType,
      actionBtn: null,
      preview: (
        <div className="bg-purple-50/70 border-2 border-purple-200 p-3 rounded-2xl space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-black text-purple-900">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-purple-600" /> Contas Fixas
            </span>
            <span className="bg-purple-200 text-purple-900 px-2 py-0.5 rounded-full text-[10px]">
              Recorrência
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-black p-1.5 rounded-xl bg-white border border-purple-100 shadow-2xs">
              <span className="text-slate-800">Aluguel (Dia 05)</span>
              <span className="text-rose-600">R$ 1.800,00</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-black p-1.5 rounded-xl bg-white border border-purple-100 shadow-2xs">
              <span className="text-slate-800">Internet Fibra (Dia 10)</span>
              <span className="text-rose-600">R$ 129,90</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 5,
      badge: 'Passo 5 • Orçamento com I.A',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      title: 'Defina seu Teto e Metas com I.A',
      targetName: 'Card "Teto Máximo de Gastos"',
      shortText:
        'Estipule o máximo que deseja gastar no mês e clique em "Distribuir Tetos com I.A ✨". A inteligência artificial divide as metas ideais para cada categoria sem complicar.',
      tip: 'A barra de progresso avisa se você está no ritmo seguro ou prestes a estourar a meta.',
      targetId: 'tour-spending-limit-card',
      requiredTab: 'overview' as TourTabType,
      actionBtn: onOpenAiBudgetModal
        ? {
            label: 'Distribuir com I.A ✨',
            icon: Sparkles,
            action: () => {
              onClose();
              onOpenAiBudgetModal();
            },
          }
        : null,
      preview: (
        <div className="bg-blue-50/80 border-2 border-blue-200 p-3 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-[11px] font-black text-slate-800">
            <span className="flex items-center gap-1.5 text-[#026CD6]">
              <Target className="w-3.5 h-3.5" /> Teto Mensal Definido
            </span>
            <span className="text-slate-900 font-numeric">R$ 3.500,00</span>
          </div>
          <div className="space-y-1">
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '48%' }} />
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
              <span className="text-emerald-700 font-black">Restam R$ 1.820,00</span>
              <span>48% gasto</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 6,
      badge: 'Passo 6 • Rapidez Total',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      title: 'Lance Despesas Falando com a I.A',
      targetName: 'Botão "Falar com a IA (Voz/Texto)"',
      shortText:
        'Gastou na rua? Clique no botão "Falar com a IA" e envie áudio ou texto como "Ifood 49,90" ou "Gasolina 100". A I.A identifica valor, categoria e data em segundos!',
      tip: 'Prático para usar no dia a dia pelo celular ou computador sem perder nenhum gasto.',
      targetId: 'tour-ai-btn',
      requiredTab: 'overview' as TourTabType,
      actionBtn: onOpenAiModal
        ? {
            label: 'Testar com I.A Agora',
            icon: Mic,
            action: () => {
              onClose();
              onOpenAiModal();
            },
          }
        : null,
      preview: (
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-3 rounded-2xl space-y-2 shadow-inner">
          <div className="flex items-center justify-between text-[11px] font-black text-purple-200">
            <span className="flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-purple-300" /> Comando por Voz
            </span>
            <span className="bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full text-[10px]">
              Gemini I.A
            </span>
          </div>
          <div className="p-2 rounded-xl bg-white/10 border border-white/15 space-y-0.5">
            <p className="text-[11px] font-black text-purple-100 italic">"Almoço 48 reais"</p>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-300">
              <CheckCircle2 className="w-3 h-3" />
              <span>R$ 48,00 em Alimentação</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 7,
      badge: 'Passo 7 • Visão do Futuro',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      title: 'Acompanhe Metas & Perspectiva Anual',
      targetName: 'Aba "Gráficos & Orçamento"',
      shortText:
        'Acesse a aba "Gráficos & Orçamento" para analisar o raio-X dos seus gastos por categoria, ver a evolução patrimonial dos últimos meses e acompanhar suas Metas de Economia!',
      tip: 'Compare seus resultados mês a mês e celebre sua independência financeira!',
      targetId: 'tour-analytics-tab-content',
      requiredTab: 'analytics' as TourTabType,
      actionBtn: null,
      preview: (
        <div className="bg-slate-900 text-white p-3 rounded-2xl space-y-2 shadow-inner">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" /> Evolução Patrimonial
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full text-[10px]">
              Visão Anual
            </span>
          </div>
          <div className="flex items-end justify-between gap-1.5 h-12 pt-1 px-1">
            <div className="flex-1 bg-blue-500/40 rounded-t-md h-5" />
            <div className="flex-1 bg-blue-500/50 rounded-t-md h-7" />
            <div className="flex-1 bg-blue-500/70 rounded-t-md h-9" />
            <div className="flex-1 bg-emerald-500 rounded-t-md h-12" />
          </div>
          <p className="text-[10px] font-black text-center text-emerald-400">
            Evolução crescente e patrimônio em alta! 📈
          </p>
        </div>
      ),
    },
  ];

  const currentStepData = steps[currentStep];

  // Efeito para navegar, destacar o elemento e posicionar o card no canto oposto anti-colisão
  useEffect(() => {
    if (!isOpen) {
      if (activeHighlightedElRef.current) {
        activeHighlightedElRef.current.classList.remove('tour-target-highlight');
        activeHighlightedElRef.current = null;
      }
      return;
    }

    const step = steps[currentStep];

    // Se o passo exige outra aba, altera suavemente
    if (step.requiredTab !== currentTab) {
      onSelectTab(step.requiredTab);
    }

    const timer = setTimeout(() => {
      if (activeHighlightedElRef.current) {
        activeHighlightedElRef.current.classList.remove('tour-target-highlight');
        activeHighlightedElRef.current = null;
      }

      const targetEl = document.getElementById(step.targetId);
      if (targetEl) {
        targetEl.classList.add('tour-target-highlight');
        activeHighlightedElRef.current = targetEl;
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Calcula a posição do elemento após o scroll para posicionar o card fora do caminho
        setTimeout(() => {
          const rect = targetEl.getBoundingClientRect();
          const windowWidth = window.innerWidth;
          const windowHeight = window.innerHeight;

          // Se o elemento estiver no lado direito da tela -> card vai para a esquerda
          const isRight = rect.left + rect.width / 2 > windowWidth / 2;
          // Se o elemento estiver muito embaixo (na metade inferior da viewport) -> card sobe para o topo
          const isBottom = rect.top + rect.height / 2 > windowHeight * 0.6;

          if (isBottom) {
            setCornerPosition(isRight ? 'top-left' : 'top-right');
          } else {
            setCornerPosition(isRight ? 'bottom-left' : 'bottom-right');
          }
        }, 320);
      }
    }, 180);

    return () => {
      clearTimeout(timer);
    };
  }, [isOpen, currentStep, currentTab, onSelectTab]);

  // Limpeza ao desmontar
  useEffect(() => {
    return () => {
      if (activeHighlightedElRef.current) {
        activeHighlightedElRef.current.classList.remove('tour-target-highlight');
      }
    };
  }, []);

  const handleToggleDontShowAgain = () => {
    const nextVal = !dontShowAgain;
    setDontShowAgain(nextVal);
    if (userId) {
      if (nextVal) {
        localStorage.setItem(`economia_real_tutorial_disabled_${userId}`, 'true');
      } else {
        localStorage.removeItem(`economia_real_tutorial_disabled_${userId}`);
      }
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleToggleCornerManual = () => {
    setCornerPosition((prev) => {
      if (prev === 'bottom-right') return 'bottom-left';
      if (prev === 'bottom-left') return 'top-left';
      if (prev === 'top-left') return 'top-right';
      return 'bottom-right';
    });
  };

  if (!isOpen) return null;

  return (
    // Camada transparente e desimpedida: NÃO BLOQUEIA A TELA! O centro e os elementos ficam 100% visíveis
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Card Flutuante Inteligente (Smart Corner Dock) - Fica no canto oposto ao elemento focado */}
      <div
        className={`absolute pointer-events-auto transition-all duration-300 ease-out w-[92vw] sm:w-[410px] max-h-[88vh] overflow-y-auto card-duo p-4 sm:p-5 shadow-2xl border-2 border-slate-300 bg-white/98 backdrop-blur-md space-y-3.5 ${
          cornerPosition === 'bottom-right'
            ? 'bottom-5 right-4 sm:right-6'
            : cornerPosition === 'bottom-left'
            ? 'bottom-5 left-4 sm:left-6'
            : cornerPosition === 'top-right'
            ? 'top-20 right-4 sm:right-6'
            : 'top-20 left-4 sm:left-6'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Card */}
        <div className="flex items-center justify-between border-b-2 border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 shadow-2xs">
              <Compass className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-slate-800">
                  Guia do App
                </h3>
                <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-blue-50 text-[#026CD6] border border-blue-200">
                  {currentStep + 1} de {steps.length}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleToggleCornerManual}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Mover card para o outro canto da tela"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Fechar guia"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Indicador Chamativo de Foco Visual na Tela */}
        <div className="p-2 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex items-center gap-2 text-xs font-black text-[#026CD6]">
          <Eye className="w-4 h-4 animate-bounce shrink-0" />
          <span className="truncate">
            Destaque em foco: <strong className="text-slate-900">{currentStepData.targetName}</strong>
          </span>
        </div>

        {/* Barra de Progresso com 7 Pílulas Interativas */}
        <div className="flex items-center gap-1.5">
          {steps.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setCurrentStep(idx)}
              className={`flex-1 h-1.5 rounded-full transition-all cursor-pointer ${
                idx === currentStep
                  ? 'bg-[#026CD6] ring-2 ring-blue-200'
                  : idx < currentStep
                  ? 'bg-emerald-400'
                  : 'bg-slate-200 hover:bg-slate-300'
              }`}
              title={`Ir para o passo ${idx + 1}: ${s.title}`}
            />
          ))}
        </div>

        {/* Conteúdo do Passo */}
        <div className="space-y-2.5 pt-0.5">
          <div>
            <span
              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border tracking-wider inline-block mb-1 ${currentStepData.badgeColor}`}
            >
              {currentStepData.badge}
            </span>
            <h4 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
              {currentStepData.title}
            </h4>
          </div>

          <p className="text-xs sm:text-sm font-bold text-slate-600 leading-relaxed">
            {currentStepData.shortText}
          </p>

          {/* Mini Preview Ilustrado */}
          <div className="pt-0.5">{currentStepData.preview}</div>

          {/* Dica de Ouro */}
          <div className="p-2 rounded-xl bg-blue-50/80 border border-blue-100 flex items-start gap-1.5 text-[11px] font-bold text-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-[#026CD6] shrink-0 mt-0.5" />
            <span>{currentStepData.tip}</span>
          </div>

          {currentStepData.actionBtn && (
            <div className="pt-0.5">
              <button
                type="button"
                onClick={currentStepData.actionBtn.action}
                className="w-full btn-duo btn-duo-blue text-xs py-2 flex items-center justify-center gap-2 shadow-xs"
              >
                <currentStepData.actionBtn.icon className="w-4 h-4 stroke-[2.5]" />
                <span>{currentStepData.actionBtn.label}</span>
              </button>
            </div>
          )}
        </div>

        {/* Rodapé com Navegação */}
        <div className="pt-2 border-t-2 border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 cursor-pointer select-none order-2 sm:order-1">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={handleToggleDontShowAgain}
              className="w-3.5 h-3.5 rounded text-[#026CD6] border-slate-300 focus:ring-blue-200 cursor-pointer"
            />
            <span>Não exibir ao entrar</span>
          </label>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end order-1 sm:order-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="btn-duo btn-duo-white text-xs px-3 py-1.5 flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Voltar</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="btn-duo btn-duo-green text-xs px-4 py-1.5 flex items-center gap-1.5 shadow-sm"
            >
              <span>{currentStep === steps.length - 1 ? 'Concluir' : 'Próximo'}</span>
              {currentStep === steps.length - 1 ? (
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
