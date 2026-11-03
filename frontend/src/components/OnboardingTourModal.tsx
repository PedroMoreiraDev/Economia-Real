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
  ArrowLeftRight,
  ChevronUp,
  ChevronDown
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
  const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth < 1024);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(() => {
    if (!userId) return false;
    return localStorage.getItem(`economia_real_tutorial_disabled_${userId}`) === 'true';
  });

  const activeHighlightedElRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const badgeStyle =
    'bg-[#102D25] dark:bg-[#16382E] text-[#D4A94F] border-[#D4A94F]/40';

  // Definição dos 7 passos didáticos com paleta Fintech (#102D25, #1C4939, #E8E4D9, #D4A94F)
  const steps = [
    {
      id: 1,
      badge: 'Passo 1 • Sem Digitação Manual',
      badgeColor: badgeStyle,
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
        <div className="bg-[#102D25] dark:bg-[#0D241D] text-[#E8E4D9] p-3.5 rounded-2xl space-y-2.5 border border-[#285E4B]">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="flex items-center gap-1.5 text-[#D4A94F]">
              <CreditCard className="w-3.5 h-3.5" /> Cartão de Crédito
            </span>
            <span className="bg-[#1C4939] text-[#D4A94F] border border-[#D4A94F]/30 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
              OFX & CSV
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#16382E] border border-[#285E4B] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-[#1C4939] text-[#D4A94F] border border-[#D4A94F]/40 flex items-center justify-center text-xs font-extrabold">
                ✓
              </div>
              <div className="text-left">
                <p className="text-[11px] font-extrabold text-[#E8E4D9]">fatura_nubank.csv</p>
                <p className="text-[10px] text-[#9AB3A8] font-semibold">42 compras classificadas</p>
              </div>
            </div>
            <span className="text-[11px] font-extrabold text-[#D4A94F]">100% Importado</span>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      badge: 'Passo 2 • Salário e Renda',
      badgeColor: badgeStyle,
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
        <div className="bg-[#EFECE3] dark:bg-[#0D241D] border border-[#D5CFC0] dark:border-[#285E4B] p-3.5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#102D25] dark:text-[#E8E4D9]">
              Entradas do Mês
            </span>
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#102D25] text-[#D4A94F] border border-[#D4A94F]/40">
              Receita Ativa
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-extrabold p-2 rounded-xl bg-[#FAF8F4] dark:bg-[#16382E] border border-[#D5CFC0] dark:border-[#285E4B]">
              <span className="text-[#102D25] dark:text-[#E8E4D9]">Salário CLT</span>
              <span className="text-[#1C4939] dark:text-[#D4A94F] font-numeric">+ R$ 5.500,00</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-extrabold p-2 rounded-xl bg-[#FAF8F4] dark:bg-[#16382E] border border-[#D5CFC0] dark:border-[#285E4B]">
              <span className="text-[#102D25] dark:text-[#E8E4D9]">Rendimentos</span>
              <span className="text-[#1C4939] dark:text-[#D4A94F] font-numeric">+ R$ 380,00</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      badge: 'Passo 3 • Organização com 1 Clique',
      badgeColor: badgeStyle,
      title: 'Revise as Categorias da Fatura',
      targetName: 'Extrato de Movimentações',
      shortText:
        'No Extrato de Movimentações, encontre as compras com o alerta "⚠️ Sem Categoria". Basta clicar na tag para escolher a categoria diretamente na tabela com um toque!',
      tip: 'Conforme você ajusta, nossa inteligência aprende seus hábitos para as próximas importações.',
      targetId: 'tour-statement-section',
      requiredTab: 'overview' as TourTabType,
      actionBtn: null,
      preview: (
        <div className="bg-[#EFECE3] dark:bg-[#0D241D] border border-[#D5CFC0] dark:border-[#285E4B] p-3.5 rounded-2xl space-y-2 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-extrabold text-[#102D25] dark:text-[#E8E4D9]">
            <Tag className="w-3.5 h-3.5 text-[#D4A94F]" />
            <span>Classificação Direta com 1 Clique</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="px-2.5 py-1 rounded-xl bg-[#FAF8F4] dark:bg-[#16382E] border border-[#D5CFC0] dark:border-[#285E4B] text-[#526B61] dark:text-[#9AB3A8] text-[11px] font-bold flex items-center gap-1 line-through">
              ⚠️ Sem Categoria
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-[#D4A94F] stroke-[3]" />
            <div className="px-2.5 py-1 rounded-xl bg-[#102D25] border border-[#D4A94F]/40 text-[#D4A94F] text-[11px] font-extrabold flex items-center gap-1 shadow-xs">
              🛒 Supermercado
            </div>
          </div>
          <p className="text-[10px] font-semibold text-[#526B61] dark:text-[#9AB3A8]">
            Clique na tag na tabela e mude na hora!
          </p>
        </div>
      ),
    },
    {
      id: 4,
      badge: 'Passo 4 • Previsibilidade',
      badgeColor: badgeStyle,
      title: 'Cadastre suas Despesas Fixas',
      targetName: 'Aba "Despesas Fixas"',
      shortText:
        'Aluguel, condomínio, luz, internet, escola particular ou assinaturas: cadastre na aba "Despesas Fixas" para ter provisionamento antecipado de tudo o que você paga todo mês.',
      tip: 'Você consegue acompanhar quais contas já foram pagas e quais estão pendentes no mês.',
      targetId: 'tour-recurring-tab-content',
      requiredTab: 'recurring' as TourTabType,
      actionBtn: null,
      preview: (
        <div className="bg-[#EFECE3] dark:bg-[#0D241D] border border-[#D5CFC0] dark:border-[#285E4B] p-3.5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-[11px] font-extrabold text-[#102D25] dark:text-[#E8E4D9]">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-[#D4A94F]" /> Contas Fixas
            </span>
            <span className="bg-[#102D25] text-[#D4A94F] border border-[#D4A94F]/40 px-2.5 py-0.5 rounded-full text-[10px]">
              Recorrência
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-extrabold p-2 rounded-xl bg-[#FAF8F4] dark:bg-[#16382E] border border-[#D5CFC0] dark:border-[#285E4B]">
              <span className="text-[#102D25] dark:text-[#E8E4D9]">Aluguel (Dia 05)</span>
              <span className="text-[#B93838] dark:text-[#F28B82] font-numeric">R$ 1.800,00</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-extrabold p-2 rounded-xl bg-[#FAF8F4] dark:bg-[#16382E] border border-[#D5CFC0] dark:border-[#285E4B]">
              <span className="text-[#102D25] dark:text-[#E8E4D9]">Internet Fibra (Dia 10)</span>
              <span className="text-[#B93838] dark:text-[#F28B82] font-numeric">R$ 129,90</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 5,
      badge: 'Passo 5 • Orçamento com I.A',
      badgeColor: badgeStyle,
      title: 'Defina seu Teto e Metas com I.A',
      targetName: 'Card "Teto Máximo de Gastos"',
      shortText:
        'Estipule o máximo que deseja gastar no mês e clique em "Distribuir Tetos com I.A". A inteligência artificial divide as metas ideais para cada categoria sem complicar.',
      tip: 'A barra de progresso avisa se você está no ritmo seguro ou prestes a estourar a meta.',
      targetId: 'tour-spending-limit-card',
      requiredTab: 'overview' as TourTabType,
      actionBtn: onOpenAiBudgetModal
        ? {
            label: 'Distribuir com I.A',
            icon: Sparkles,
            action: () => {
              onClose();
              onOpenAiBudgetModal();
            },
          }
        : null,
      preview: (
        <div className="bg-[#EFECE3] dark:bg-[#0D241D] border border-[#D5CFC0] dark:border-[#285E4B] p-3.5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-[11px] font-extrabold text-[#102D25] dark:text-[#E8E4D9]">
            <span className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[#D4A94F]" /> Teto Mensal Definido
            </span>
            <span className="text-[#102D25] dark:text-[#D4A94F] font-numeric">R$ 3.500,00</span>
          </div>
          <div className="space-y-1.5">
            <div className="w-full h-2.5 bg-[#D5CFC0] dark:bg-[#16382E] rounded-full overflow-hidden">
              <div className="h-full bg-[#1C4939] dark:bg-[#D4A94F] rounded-full" style={{ width: '48%' }} />
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold text-[#526B61] dark:text-[#9AB3A8]">
              <span className="text-[#1C4939] dark:text-[#D4A94F] font-extrabold">Restam R$ 1.820,00</span>
              <span>48% utilizado</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 6,
      badge: 'Passo 6 • Rapidez Total',
      badgeColor: badgeStyle,
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
        <div className="bg-[#102D25] dark:bg-[#0D241D] text-[#E8E4D9] p-3.5 rounded-2xl space-y-2 border border-[#D4A94F]/40">
          <div className="flex items-center justify-between text-[11px] font-extrabold text-[#D4A94F]">
            <span className="flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-[#D4A94F]" /> Comando por Voz
            </span>
            <span className="bg-[#1C4939] text-[#D4A94F] border border-[#D4A94F]/30 px-2 py-0.5 rounded-full text-[10px]">
              Gemini I.A
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#16382E] border border-[#285E4B] space-y-1">
            <p className="text-[11px] font-extrabold text-[#E8E4D9] italic">"Almoço 48 reais"</p>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#D4A94F]">
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
      badgeColor: badgeStyle,
      title: 'Acompanhe Metas & Perspectiva Anual',
      targetName: 'Aba "Gráficos & Orçamento"',
      shortText:
        'Acesse a aba "Gráficos & Orçamento" para analisar o raio-X dos seus gastos por categoria, ver a evolução financeira dos últimos meses e acompanhar suas Metas de Economia!',
      tip: 'Compare seus resultados mês a mês e celebre sua independência financeira!',
      targetId: 'tour-analytics-tab-content',
      requiredTab: 'analytics' as TourTabType,
      actionBtn: null,
      preview: (
        <div className="bg-[#102D25] dark:bg-[#0D241D] text-[#E8E4D9] p-3.5 rounded-2xl space-y-2 border border-[#285E4B]">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="flex items-center gap-1.5 text-[#D4A94F]">
              <TrendingUp className="w-3.5 h-3.5" /> Evolução Financeira
            </span>
            <span className="bg-[#1C4939] text-[#D4A94F] border border-[#D4A94F]/30 px-2 py-0.5 rounded-full text-[10px]">
              Visão Anual
            </span>
          </div>
          <div className="flex items-end justify-between gap-1.5 h-12 pt-1 px-1">
            <div className="flex-1 bg-[#1C4939]/60 rounded-t-md h-5" />
            <div className="flex-1 bg-[#1C4939]/80 rounded-t-md h-7" />
            <div className="flex-1 bg-[#1C4939] rounded-t-md h-9" />
            <div className="flex-1 bg-[#D4A94F] rounded-t-md h-12" />
          </div>
          <p className="text-[10px] font-extrabold text-center text-[#D4A94F]">
            Evolução crescente e economia em alta!
          </p>
        </div>
      ),
    },
  ];

  const currentStepData = steps[currentStep];

  useEffect(() => {
    if (!isOpen) {
      if (activeHighlightedElRef.current) {
        activeHighlightedElRef.current.classList.remove('tour-target-highlight');
        activeHighlightedElRef.current = null;
      }
      return;
    }

    const step = steps[currentStep];

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

        const isSmallScreen = window.innerWidth < 1024;
        if (isSmallScreen) {
          const rect = targetEl.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const targetY = scrollTop + rect.top - (window.innerHeight < 700 ? 55 : 85);
          window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
        } else {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

          setTimeout(() => {
            const rect = targetEl.getBoundingClientRect();
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            const isRight = rect.left + rect.width / 2 > windowWidth / 2;
            const isBottom = rect.top + rect.height / 2 > windowHeight * 0.6;

            if (isBottom) {
              setCornerPosition(isRight ? 'top-left' : 'top-right');
            } else {
              setCornerPosition(isRight ? 'bottom-left' : 'bottom-right');
            }
          }, 320);
        }
      }
    }, 180);

    return () => {
      clearTimeout(timer);
    };
  }, [isOpen, currentStep, currentTab, onSelectTab]);

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
    <div className="fixed inset-0 z-[10000] pointer-events-none">
      <div
        className={`pointer-events-auto transition-all duration-300 ease-out ${
          isMobile
            ? 'fixed bottom-0 inset-x-0 sm:bottom-3 sm:inset-x-3 max-w-lg mx-auto'
            : `absolute w-[410px] max-h-[88vh] ${
                cornerPosition === 'bottom-right'
                  ? 'bottom-5 right-6'
                  : cornerPosition === 'bottom-left'
                  ? 'bottom-5 left-6'
                  : cornerPosition === 'top-right'
                  ? 'top-20 right-6'
                  : 'top-20 left-6'
              }`
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {isMobile && isMinimized ? (
          /* MODO MINIMIZADO EXCLUSIVO PARA MOBILE E TABLET */
          <div className="bg-[#FAF8F4] dark:bg-[#102D25] border-t-2 sm:border-2 border-[#D5CFC0] dark:border-[#285E4B] shadow-2xl rounded-t-2xl sm:rounded-2xl p-2.5 px-3.5 flex items-center justify-between gap-2 animate-fadeIn">
            <div
              className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
              onClick={() => setIsMinimized(false)}
            >
              <div className="p-1.5 rounded-xl bg-[#102D25] dark:bg-[#16382E] text-[#D4A94F] border border-[#D4A94F]/40 shrink-0 shadow-2xs">
                <Compass className="w-4 h-4 stroke-[2.3]" />
              </div>
              <div className="truncate">
                <span className="text-xs font-extrabold text-[#102D25] dark:text-[#E8E4D9] truncate block">
                  Passo {currentStep + 1}/{steps.length} • {currentStepData.title}
                </span>
                <span className="text-[10px] text-[#1C4939] dark:text-[#D4A94F] font-bold flex items-center gap-1">
                  Toque para expandir <ChevronUp className="w-3 h-3 stroke-[3]" />
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="p-1.5 rounded-xl text-[#102D25] dark:text-[#E8E4D9] bg-[#EFECE3] dark:bg-[#16382E] hover:border-[#D4A94F] transition-colors"
                  title="Passo anterior"
                >
                  <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                className="p-1.5 rounded-xl text-[#E8E4D9] bg-[#1C4939] hover:bg-[#102D25] shadow-sm transition-colors flex items-center justify-center min-w-[34px]"
                title="Próximo passo"
              >
                {currentStep === steps.length - 1 ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  <ChevronRight className="w-4 h-4 stroke-[3]" />
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-[#526B61] dark:text-[#9AB3A8] hover:text-[#102D25] dark:hover:text-[#E8E4D9] hover:bg-[#EFECE3] dark:hover:bg-[#16382E] transition-colors"
                title="Fechar guia"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        ) : (
          /* MODO EXPANDIDO / PADRÃO */
          <div
            className={`card-duo shadow-2xl border-2 border-[#D5CFC0] dark:border-[#285E4B] bg-[#FAF8F4] dark:bg-[#102D25] overflow-y-auto space-y-3 ${
              isMobile
                ? 'rounded-t-3xl sm:rounded-3xl p-4 sm:p-5 max-h-[62vh] sm:max-h-[70vh]'
                : 'rounded-3xl p-4 sm:p-5 max-h-[88vh]'
            }`}
          >
            {isMobile && (
              <div
                className="w-12 h-1.5 rounded-full bg-[#C8C1B0] dark:bg-[#285E4B] mx-auto -mt-1 mb-1 cursor-pointer transition-colors"
                onClick={() => setIsMinimized(true)}
                title="Toque para minimizar"
              />
            )}

            {/* Cabeçalho do Card */}
            <div className="flex items-center justify-between border-b border-[#D5CFC0] dark:border-[#214E3E] pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#102D25] dark:bg-[#16382E] text-[#D4A94F] border border-[#D4A94F]/40 shadow-2xs">
                  <Compass className="w-4 h-4 stroke-[2.3]" />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-extrabold text-[#102D25] dark:text-[#E8E4D9]">
                    Guia do App
                  </h3>
                  <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#102D25] dark:bg-[#16382E] text-[#D4A94F] border border-[#D4A94F]/40">
                    {currentStep + 1} de {steps.length}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {isMobile ? (
                  <button
                    type="button"
                    onClick={() => setIsMinimized(true)}
                    className="p-1.5 rounded-xl text-[#526B61] dark:text-[#9AB3A8] hover:text-[#102D25] dark:hover:text-[#E8E4D9] hover:bg-[#EFECE3] dark:hover:bg-[#16382E] transition-colors flex items-center gap-1 text-xs font-bold"
                    title="Minimizar guia"
                  >
                    <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                    <span className="text-[11px] font-bold hidden sm:inline">Minimizar</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleToggleCornerManual}
                    className="p-1.5 rounded-xl text-[#526B61] dark:text-[#9AB3A8] hover:text-[#102D25] dark:hover:text-[#D4A94F] hover:bg-[#EFECE3] dark:hover:bg-[#16382E] transition-colors"
                    title="Mover card para o outro canto da tela"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-xl text-[#526B61] dark:text-[#9AB3A8] hover:text-[#102D25] dark:hover:text-[#D4A94F] hover:bg-[#EFECE3] dark:hover:bg-[#16382E] transition-colors"
                  title="Fechar guia"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Indicador de Foco Visual na Tela (Alto contraste garantido) */}
            <div className="p-2.5 rounded-xl bg-[#EFECE3] dark:bg-[#16382E] border border-[#D5CFC0] dark:border-[#D4A94F]/40 flex items-center gap-2 text-xs font-extrabold text-[#102D25] dark:text-[#D4A94F]">
              <Eye className="w-4 h-4 text-[#1C4939] dark:text-[#D4A94F] shrink-0" />
              <span className="truncate">
                Destaque em foco: <strong className="text-[#102D25] dark:text-[#E8E4D9]">{currentStepData.targetName}</strong>
              </span>
            </div>

            {/* Barra de Progresso com 7 Pílulas Interativas */}
            <div className="flex items-center gap-1.5 py-0.5">
              {steps.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setCurrentStep(idx)}
                  className={`flex-1 h-2 rounded-full transition-all cursor-pointer ${
                    idx === currentStep
                      ? 'bg-[#D4A94F] ring-2 ring-[#D4A94F]/40'
                      : idx < currentStep
                      ? 'bg-[#1C4939] dark:bg-[#2E8B62]'
                      : 'bg-[#D5CFC0] dark:bg-[#16382E] hover:bg-[#B8B09E] dark:hover:bg-[#214E3E]'
                  }`}
                  title={`Ir para o passo ${idx + 1}: ${s.title}`}
                />
              ))}
            </div>

            {/* Conteúdo do Passo */}
            <div className="space-y-2.5 pt-0.5">
              <div>
                <span
                  className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md border tracking-wider inline-block mb-1.5 ${currentStepData.badgeColor}`}
                >
                  {currentStepData.badge}
                </span>
                <h4 className="text-base sm:text-lg font-extrabold text-[#102D25] dark:text-[#E8E4D9] leading-snug">
                  {currentStepData.title}
                </h4>
              </div>

              <p className="text-xs sm:text-sm font-semibold text-[#355248] dark:text-[#B8C7C0] leading-relaxed">
                {currentStepData.shortText}
              </p>

              {/* Mini Preview Ilustrado */}
              <div className="pt-0.5">{currentStepData.preview}</div>

              {/* Dica de Ouro */}
              <div className="p-2.5 rounded-xl bg-[#EFECE3] dark:bg-[#16382E] border border-[#D5CFC0] dark:border-[#285E4B] flex items-start gap-2 text-[11px] font-semibold text-[#102D25] dark:text-[#E8E4D9]">
                <Sparkles className="w-3.5 h-3.5 text-[#D4A94F] shrink-0 mt-0.5" />
                <span>{currentStepData.tip}</span>
              </div>

              {currentStepData.actionBtn && (
                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={currentStepData.actionBtn.action}
                    className="w-full btn-duo btn-duo-blue text-xs py-2.5 flex items-center justify-center gap-2 shadow-xs min-h-[42px]"
                  >
                    <currentStepData.actionBtn.icon className="w-4 h-4 stroke-[2.5]" />
                    <span>{currentStepData.actionBtn.label}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Rodapé com Navegação */}
            <div className="pt-2.5 border-t border-[#D5CFC0] dark:border-[#214E3E] flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#526B61] dark:text-[#9AB3A8] cursor-pointer select-none order-2 sm:order-1">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={handleToggleDontShowAgain}
                  className="w-3.5 h-3.5 rounded text-[#1C4939] border-[#C8C1B0] dark:border-[#285E4B] focus:ring-[#D4A94F] cursor-pointer"
                />
                <span>Não exibir ao entrar</span>
              </label>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end order-1 sm:order-2">
                {currentStep > 0 && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="btn-duo btn-duo-white text-xs px-3.5 py-2 flex items-center justify-center gap-1 flex-1 sm:flex-none min-h-[40px]"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Voltar</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-duo btn-duo-green text-xs px-5 py-2 flex items-center justify-center gap-1.5 shadow-sm flex-1 sm:flex-none min-h-[40px]"
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
        )}
      </div>
    </div>
  );
};
