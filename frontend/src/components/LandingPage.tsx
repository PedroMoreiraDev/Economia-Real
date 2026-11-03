import React, { useState } from 'react';
import {
  Mic,
  UploadCloud,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sliders,
  ChevronDown,
  Zap,
  PieChart,
  Volume2,
  FileSpreadsheet,
  Check,
  AlertTriangle,
  ShieldCheck,
  Lock,
  FileText,
  Mail
} from 'lucide-react';
import { warmUpBackend } from '../services/authApi';
import { trackCtaClick } from '../services/telemetryService';

interface LandingPageProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
  onOpenSecurity?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenLogin,
  onOpenRegister,
  onOpenPrivacy,
  onOpenTerms,
  onOpenSecurity
}) => {
  // Estado para a aba ativa no Mockup interativo da Hero
  const [activeHeroTab, setActiveHeroTab] = useState<'voice' | 'statement' | 'goals'>('voice');

  // Estado para acordeom de FAQ
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="space-y-20 sm:space-y-28 py-4 sm:py-6">

      {/* =========================================================================
          1. HERO SECTION COM ESTÉTICA FINTECH MODERNA DE FINANÇAS PESSOAIS
          ========================================================================= */}
      <section className="relative overflow-hidden pt-2 pb-6 sm:py-8">
        
        {/* Glows atmosféricos sutis (Verde Escuro, Verde Esmeralda, Dourado) */}
        <div className="absolute top-12 left-10 w-96 h-96 bg-[#1C4939]/12 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute top-20 right-10 w-96 h-96 bg-[#D4A94F]/15 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-[#102D25]/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* Lado Esquerdo: Argumentação Executiva de Alta Conversão */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Tag / Badge Prestige Fintech */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#102D25] text-[#D4A94F] border border-[#D4A94F]/40 text-xs font-extrabold shadow-sm uppercase tracking-wider">
              <Sparkles className="h-4 w-4 text-[#D4A94F]" />
              <span>Gestão Financeira Inteligente • Sem Planilhas</span>
            </div>

            {/* Título Principal com Destaques Institucionais */}
            <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-extrabold text-[#102D25] dark:text-[#E8E4D9] tracking-tight leading-[1.12]">
              Controle suas finanças sem o sofrimento de{' '}
              <span className="text-[#1C4939] dark:text-[#D4A94F] underline decoration-[#D4A94F] decoration-2 underline-offset-8">
                anotar tudo na mão
              </span>.
            </h1>

            {/* Subtítulo Persuasivo */}
            <p className="text-base sm:text-lg font-medium text-[#355248] dark:text-[#B8C7C0] leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Fale no microfone ou suba a fatura do seu banco. A I.A categoriza tudo em segundos, define seus limites ideais e{' '}
              <span className="text-[#102D25] dark:text-[#D4A94F] bg-[#D4A94F]/25 dark:bg-[#16382E] px-2 py-0.5 rounded-lg font-extrabold border border-[#D4A94F]/50">
                te avisa antes de você estourar o orçamento
              </span>.
            </p>

            {/* Botões de Ação Imediata */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={() => {
                  trackCtaClick('hero_register_btn', 'landing_hero');
                  onOpenRegister();
                }}
                onMouseEnter={warmUpBackend}
                onTouchStart={warmUpBackend}
                className="btn-duo btn-duo-green w-full sm:w-auto text-base sm:text-lg px-8 py-4 flex items-center justify-center gap-3 shadow-lg"
              >
                <Zap className="h-5 w-5 text-[#D4A94F] stroke-[2.5]" />
                <span>Criar Conta Grátis Agora</span>
                <ArrowRight className="h-5 w-5 stroke-[2.5]" />
              </button>

              <button
                onClick={() => {
                  trackCtaClick('hero_login_btn', 'landing_hero');
                  onOpenLogin();
                }}
                onMouseEnter={warmUpBackend}
                onTouchStart={warmUpBackend}
                className="btn-duo btn-duo-white w-full sm:w-auto text-base px-6 py-4 flex items-center justify-center gap-2"
              >
                Já tenho conta cadastrada
              </button>
            </div>

            {/* Micro-provas de Confiança com Selos Sóbrios */}
            <div className="pt-3 flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-4 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-[#1C4939] dark:text-[#78C6A3] bg-[#E6EFEA] dark:bg-[#16382E] px-3 py-1 rounded-full border border-[#1C4939]/25 dark:border-[#2B6B54]">
                <CheckCircle2 className="h-4 w-4 text-[#1C4939] dark:text-[#D4A94F] stroke-[2.5]" />
                100% Gratuito
              </span>
              <span className="flex items-center gap-1.5 text-[#102D25] dark:text-[#E8E4D9] bg-[#F7EFE0] dark:bg-[#16382E] px-3 py-1 rounded-full border border-[#D4A94F]/45">
                <CheckCircle2 className="h-4 w-4 text-[#9A7220] dark:text-[#D4A94F] stroke-[2.5]" />
                Sem pedir cartão de crédito
              </span>
              <span className="flex items-center gap-1.5 text-[#102D25] dark:text-[#E8E4D9] bg-[#FAF8F4] dark:bg-[#16382E] px-3 py-1 rounded-full border border-[#D5CFC0] dark:border-[#285C49]">
                <CheckCircle2 className="h-4 w-4 text-[#1C4939] dark:text-[#D4A94F] stroke-[2.5]" />
                Sem conectar senha bancária
              </span>
            </div>
          </div>

          {/* Lado Direito: Simulador com Moldura Verde Escuro (#102D25) & Dourado (#D4A94F) */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl p-5 sm:p-6 bg-gradient-to-b from-[#102D25] via-[#0E2820] to-[#0A1D17] border border-[#285E4B] shadow-2xl text-[#E8E4D9] relative overflow-hidden">
              
              {/* Efeito Glow Interno */}
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#D4A94F]/15 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[#1C4939]/30 rounded-full blur-2xl pointer-events-none" />

              {/* Topo do Mockup: Terminal Executivo */}
              <div className="flex items-center justify-between pb-4 border-b border-[#214E3E] relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#D4A94F]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#5E8E7A]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#1C4939]" />
                  <span className="text-[11px] font-bold text-[#9AB3A8] ml-1.5">Simulador em Tempo Real</span>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#16382E] text-[#D4A94F] border border-[#D4A94F]/40 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4A94F] animate-pulse" />
                  Motor IA Ativo
                </span>
              </div>

              {/* Botões de Alternância das Demonstrações */}
              <div className="grid grid-cols-3 gap-1.5 my-4 p-1.5 bg-[#0A1D17] rounded-xl border border-[#214E3E] relative z-10">
                <button
                  onClick={() => setActiveHeroTab('voice')}
                  className={`py-2 px-1 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    activeHeroTab === 'voice'
                      ? 'bg-[#D4A94F] text-[#102D25] shadow-xs'
                      : 'text-[#9AB3A8] hover:text-[#E8E4D9]'
                  }`}
                >
                  <Mic className="h-3.5 w-3.5" />
                  Voz
                </button>
                <button
                  onClick={() => setActiveHeroTab('statement')}
                  className={`py-2 px-1 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    activeHeroTab === 'statement'
                      ? 'bg-[#D4A94F] text-[#102D25] shadow-xs'
                      : 'text-[#9AB3A8] hover:text-[#E8E4D9]'
                  }`}
                >
                  <UploadCloud className="h-3.5 w-3.5" />
                  Fatura
                </button>
                <button
                  onClick={() => setActiveHeroTab('goals')}
                  className={`py-2 px-1 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    activeHeroTab === 'goals'
                      ? 'bg-[#D4A94F] text-[#102D25] shadow-xs'
                      : 'text-[#9AB3A8] hover:text-[#E8E4D9]'
                  }`}
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Metas
                </button>
              </div>

              {/* Conteúdo Dinâmico do Mockup */}
              <div className="min-h-[260px] flex flex-col justify-center relative z-10">
                
                {/* 1. MOCKUP DE VOZ COM IA */}
                {activeHeroTab === 'voice' && (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-xl bg-[#16382E] border border-[#285E4B] space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-[#D4A94F]">
                        <span className="flex items-center gap-1.5">
                          <Volume2 className="h-4 w-4 text-[#D4A94F] animate-pulse" />
                          Você fala com o celular:
                        </span>
                        <span className="text-[10px] bg-[#102D25] text-[#D4A94F] px-2 py-0.5 rounded font-mono border border-[#D4A94F]/30">Microfone Ativo</span>
                      </div>
                      <p className="text-sm font-bold text-[#E8E4D9] italic bg-[#0A1D17] p-3 rounded-xl border border-[#214E3E]">
                        "Ifood 49 e 19 no crédito ontem à noite"
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-[#D4A94F] text-xs font-bold">
                      <Sparkles className="h-4 w-4 text-[#D4A94F]" />
                      <span>Processamento Instantâneo</span>
                    </div>

                    {/* Resultado estruturado pela I.A */}
                    <div className="p-3.5 rounded-xl bg-[#14352B] border border-[#D4A94F]/40 shadow-md space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#D4A94F] uppercase tracking-wider">Transação Criada</span>
                        <span className="text-[10px] font-extrabold bg-[#D4A94F] text-[#102D25] px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="h-3 w-3 stroke-[3]" /> 1.2s
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-extrabold text-[#E8E4D9]">Alimentação (iFood)</p>
                          <p className="text-xs font-semibold text-[#9AB3A8]">Cartão de Crédito • Ontem</p>
                        </div>
                        <p className="text-base font-extrabold text-[#E8E4D9] font-numeric">- R$ 49,19</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. MOCKUP DE FATURA COM IA */}
                {activeHeroTab === 'statement' && (
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-[#16382E] border border-[#285E4B] space-y-2 text-center">
                      <UploadCloud className="h-8 w-8 text-[#D4A94F] mx-auto" />
                      <div>
                        <p className="text-xs font-extrabold text-[#E8E4D9]">fatura_nubank_outubro.csv</p>
                        <p className="text-[11px] font-semibold text-[#D4A94F]">54 transações categorizadas</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="p-2.5 rounded-xl bg-[#0A1D17] border border-[#214E3E] flex items-center justify-between text-xs font-bold">
                        <span className="text-[#E8E4D9]">UBER *TRIP RIO</span>
                        <span className="text-[#D4A94F] bg-[#16382E] px-2 py-0.5 rounded border border-[#D4A94F]/30 font-bold">Transporte</span>
                        <span className="font-extrabold text-[#E8E4D9] font-numeric">- R$ 24,90</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#0A1D17] border border-[#214E3E] flex items-center justify-between text-xs font-bold">
                        <span className="text-[#E8E4D9]">POSTO SHELL COMBUSTIVEL</span>
                        <span className="text-[#78C6A3] bg-[#16382E] px-2 py-0.5 rounded border border-[#2B6B54] font-bold">Veículo</span>
                        <span className="font-extrabold text-[#E8E4D9] font-numeric">- R$ 150,00</span>
                      </div>
                    </div>
                    <p className="text-[11px] font-bold text-center text-[#D4A94F]">
                      ✓ Sem duplicar pagamentos de cartão de crédito
                    </p>
                  </div>
                )}

                {/* 3. MOCKUP DE METAS COM ALERTA PREVENTIVO */}
                {activeHeroTab === 'goals' && (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-[#16382E] border border-[#D4A94F]/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-[#D4A94F] flex items-center gap-1.5">
                          <AlertTriangle className="h-4 w-4 text-[#D4A94F]" />
                          Alerta de Consumo Próximo (80%)
                        </span>
                        <span className="text-[10px] font-extrabold bg-[#D4A94F] text-[#102D25] px-2 py-0.5 rounded">Ativo</span>
                      </div>
                      <p className="text-xs font-medium text-[#E8E4D9]/90 leading-snug">
                        Você já consumiu <strong>82%</strong> da meta de Alimentação. Faltam 12 dias para virar o mês.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#0A1D17] border border-[#214E3E] space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-[#E8E4D9]">Alimentação</span>
                        <span className="text-[#D4A94F] font-extrabold font-numeric">R$ 820,00 / R$ 1.000,00</span>
                      </div>
                      <div className="h-2.5 w-full bg-[#102D25] rounded-full overflow-hidden border border-[#214E3E]">
                        <div className="h-full bg-gradient-to-r from-[#1C4939] to-[#D4A94F] rounded-full" style={{ width: '82%' }}></div>
                      </div>
                      <div className="flex justify-between text-[11px] font-semibold">
                        <span className="text-[#9AB3A8]">Teto máximo</span>
                        <span className="text-[#78C6A3] font-bold font-numeric">R$ 180,00 restantes</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Botão de Rodapé do Mockup */}
              <div className="pt-4 border-t border-[#214E3E] relative z-10">
                <button
                  onClick={onOpenRegister}
                  className="w-full btn-duo btn-duo-purple text-xs sm:text-sm py-3 flex items-center justify-center gap-2"
                >
                  <Sparkles className="h-4 w-4 text-[#102D25]" />
                  <span>Experimentar Gratuitamente Agora</span>
                </button>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          2. A DOR VS A SOLUÇÃO: BLOCOS EXECUTIVOS
          ========================================================================= */}
      <section className="space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#1C4939]/12 dark:bg-[#16382E] text-[#1C4939] dark:text-[#D4A94F] border border-[#1C4939]/25 dark:border-[#D4A94F]/30 text-xs font-bold uppercase tracking-wider">
            Diagnóstico de Gestão
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#102D25] dark:text-[#E8E4D9]">
            Por que 9 em cada 10 pessoas desistem de controlar os gastos?
          </h2>
          <p className="text-[#355248] dark:text-[#B8C7C0] text-sm sm:text-base font-medium">
            O problema não é sua força de vontade. É o atrito absurdo das ferramentas convencionais.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          
          {/* Card 1: Planilhas (A Dor) */}
          <div className="card-duo p-6 sm:p-7 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-[#B93838] dark:text-rose-400">
                  <FileSpreadsheet className="h-6 w-6 stroke-[2.2]" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-[#B93838] dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 text-xs font-bold uppercase tracking-wider">
                  <XCircle className="h-3.5 w-3.5 stroke-[2.3]" /> Manual
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-[#102D25] dark:text-[#E8E4D9]">
                Planilhas de Excel
              </h3>
              <p className="text-sm font-medium text-[#355248] dark:text-[#B8C7C0] leading-relaxed">
                Você precisa ligar o computador no domingo, caçar comprovantes antigos, brigar com fórmulas que quebram e, na segunda semana, já desistiu de tudo.
              </p>
            </div>
            <div className="pt-3 border-t border-[#E2DDD0] dark:border-[#214E3E] flex items-center gap-2 text-xs font-bold text-[#B93838] dark:text-rose-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>92% das pessoas abandonam em 15 dias</span>
            </div>
          </div>

          {/* Card 2: Outros Apps (A Frustração) */}
          <div className="card-duo p-6 sm:p-7 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-xl bg-[#F7EFE0] dark:bg-[#16382E] border border-[#D4A94F]/40 flex items-center justify-center text-[#9A7220] dark:text-[#D4A94F]">
                  <Sliders className="h-6 w-6 stroke-[2.2]" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F7EFE0] dark:bg-[#16382E] text-[#9A7220] dark:text-[#D4A94F] border border-[#D4A94F]/40 text-xs font-bold uppercase tracking-wider">
                  <XCircle className="h-3.5 w-3.5 stroke-[2.3]" /> Complexo
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-[#102D25] dark:text-[#E8E4D9]">
                Apps Tradicionais
              </h3>
              <p className="text-sm font-medium text-[#355248] dark:text-[#B8C7C0] leading-relaxed">
                Exigem preencher 8 campos manuais para cada cafezinho de R$ 6,00. E pior: cobram mensalidade cara e duplicam o pagamento da sua fatura nos relatórios.
              </p>
            </div>
            <div className="pt-3 border-t border-[#E2DDD0] dark:border-[#214E3E] flex items-center gap-2 text-xs font-bold text-[#9A7220] dark:text-[#D4A94F]">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Planos pagos & erros contábeis</span>
            </div>
          </div>

          {/* Card 3: Economia Real com I.A (Destaque Institucional #102D25 + #1C4939 + #D4A94F) */}
          <div className="rounded-2xl p-6 sm:p-7 space-y-4 border border-[#D4A94F]/60 bg-gradient-to-b from-[#102D25] to-[#1C4939] text-[#E8E4D9] shadow-duo-lg md:-translate-y-2 hover:-translate-y-3 transition-all flex flex-col justify-between relative overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-xl bg-[#D4A94F]/15 border border-[#D4A94F]/40 flex items-center justify-center text-[#D4A94F]">
                  <Zap className="h-6 w-6 stroke-[2.3]" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4A94F] text-[#102D25] text-xs font-extrabold uppercase tracking-wider shadow-xs">
                  <Sparkles className="h-3.5 w-3.5" /> Padrão Institucional
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-[#E8E4D9] flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-[#D4A94F] shrink-0" />
                Economia Real com I.A
              </h3>
              <p className="text-sm font-medium text-[#E8E4D9]/85 leading-relaxed">
                Fale 1 áudio de 2 segundos enquanto entra no carro ou arraste o extrato no final do mês. A inteligência artificial organiza tudo e te avisa antes de você estourar.
              </p>
            </div>
            <div className="pt-3 border-t border-[#285E4B] flex items-center gap-2 text-xs font-bold text-[#D4A94F]">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>100% Gratuito & Lançamento em 2 segundos</span>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          3. OS 4 PILARES TECNOLÓGICOS COM ESTÉTICA FINTECH
          ========================================================================= */}
      <section className="space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#102D25] text-[#D4A94F] border border-[#D4A94F]/40 text-xs font-bold uppercase tracking-wider">
            Arquitetura da Plataforma
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#102D25] dark:text-[#E8E4D9]">
            A inteligência artificial trabalhando pelo seu patrimônio
          </h2>
          <p className="text-[#355248] dark:text-[#B8C7C0] text-sm sm:text-base font-medium">
            Feito sob medida para quem não quer perder tempo e exige saber exatamente para onde vai cada centavo.
          </p>
        </div>

        <div className="space-y-8">
          
          {/* Card 1: Lançamento por Voz */}
          <div className="card-duo p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#102D25] text-[#D4A94F] border border-[#D4A94F]/30 text-xs font-bold">
                  <Mic className="h-4 w-4" />
                  Lançamento por Voz Nativo
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#102D25] dark:text-[#E8E4D9]">
                  Diga o que gastou e pronto. A I.A faz o resto.
                </h3>
                <p className="text-sm sm:text-base font-medium text-[#355248] dark:text-[#B8C7C0] leading-relaxed">
                  Basta apertar o microfone e falar naturalmente: <strong className="text-[#102D25] dark:text-[#D4A94F] bg-[#F7EFE0] dark:bg-[#16382E] px-1.5 py-0.5 rounded border border-[#D4A94F]/40">"Almoço 45 reais no débito"</strong> ou <strong className="text-[#102D25] dark:text-[#D4A94F] bg-[#F7EFE0] dark:bg-[#16382E] px-1.5 py-0.5 rounded border border-[#D4A94F]/40">"Farmácia 89,90 parcelado em 2x"</strong>.
                </p>
                <ul className="space-y-2.5 text-xs sm:text-sm font-semibold text-[#355248] dark:text-[#B8C7C0]">
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#E6EFEA] dark:bg-[#16382E] text-[#1C4939] dark:text-[#D4A94F] border border-[#1C4939]/30 flex items-center justify-center shrink-0">✓</div>
                    Reconhecimento de voz em tempo real no navegador do PC ou no celular
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#E6EFEA] dark:bg-[#16382E] text-[#1C4939] dark:text-[#D4A94F] border border-[#1C4939]/30 flex items-center justify-center shrink-0">✓</div>
                    Identifica categoria, valor numérico exato, data e conta correspondente
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#E6EFEA] dark:bg-[#16382E] text-[#1C4939] dark:text-[#D4A94F] border border-[#1C4939]/30 flex items-center justify-center shrink-0">✓</div>
                    Nunca mais gaste 2 minutos preenchendo formulários para um cafezinho
                  </li>
                </ul>
              </div>

              <div className="lg:col-span-5 bg-[#102D25] p-6 rounded-2xl border border-[#285E4B] text-[#E8E4D9] shadow-xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#D4A94F] text-[#102D25] flex items-center justify-center shadow-sm">
                    <Volume2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[#D4A94F] uppercase tracking-wider">Comando Falado</p>
                    <p className="text-sm font-extrabold text-[#E8E4D9]">"Ifood 49,19 no cartão"</p>
                  </div>
                </div>
                <div className="p-3.5 bg-[#0A1D17] rounded-xl border border-[#214E3E] space-y-2 text-xs">
                  <div className="flex justify-between font-bold">
                    <span className="text-[#9AB3A8]">Categoria Detectada:</span>
                    <span className="text-[#D4A94F] font-extrabold">Alimentação</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-[#9AB3A8]">Método de Pagamento:</span>
                    <span className="text-[#E8E4D9]">Cartão de Crédito</span>
                  </div>
                  <div className="flex justify-between font-bold pt-1 border-t border-[#214E3E]">
                    <span className="text-[#9AB3A8]">Valor exato:</span>
                    <span className="text-[#E8E4D9] font-extrabold text-sm font-numeric">- R$ 49,19</span>
                  </div>
                </div>
                <div className="text-[11px] font-bold text-center text-[#D4A94F] flex items-center justify-center gap-1">
                  <Check className="h-3.5 w-3.5 stroke-[3]" /> Registrado com precisão em 1.2 segundos
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Importação de Fatura e Extrato */}
          <div className="card-duo p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              <div className="lg:col-span-5 order-2 lg:order-1 bg-[#102D25] p-6 rounded-2xl border border-[#285E4B] text-[#E8E4D9] shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-[#1C4939] text-[#E8E4D9] border border-[#2B6B54] font-extrabold text-xs">
                      OFX
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-[#D4A94F] text-[#102D25] font-extrabold text-xs">
                      CSV / PDF
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-[#D4A94F] bg-[#16382E] px-2.5 py-0.5 rounded-full border border-[#D4A94F]/30">
                    Nubank, Inter, Itaú, C6...
                  </span>
                </div>
                <div className="p-3 bg-[#0A1D17] rounded-xl border border-[#214E3E] space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-[#E8E4D9]">54 transações lidas</span>
                    <span className="text-[#78C6A3] bg-[#16382E] px-2 py-0.5 rounded font-bold">100% Conciliado</span>
                  </div>
                  <div className="space-y-1.5 pt-1 text-[11px] font-semibold">
                    <div className="flex justify-between text-[#B8C7C0]">
                      <span>Uber do Brasil</span>
                      <span className="text-[#D4A94F]">Transporte</span>
                    </div>
                    <div className="flex justify-between text-[#B8C7C0]">
                      <span>Supermercado Pão de Açúcar</span>
                      <span className="text-[#78C6A3]">Alimentação</span>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] font-bold text-center text-[#D4A94F]">
                  Zero risco: Você nunca insere senhas do banco.
                </p>
              </div>

              <div className="lg:col-span-7 order-1 lg:order-2 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1C4939] text-[#E8E4D9] text-xs font-bold">
                  <UploadCloud className="h-4 w-4" />
                  Importação Instantânea de Extrato
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#102D25] dark:text-[#E8E4D9]">
                  O mês inteiro lançado com um simples arrastar de arquivo.
                </h3>
                <p className="text-sm sm:text-base font-medium text-[#355248] dark:text-[#B8C7C0] leading-relaxed">
                  Não quer registrar gasto por gasto todo dia? No final do mês, baixe o extrato ou fatura do seu aplicativo bancário e arraste para o Economia Real.
                </p>
                <ul className="space-y-2.5 text-xs sm:text-sm font-semibold text-[#355248] dark:text-[#B8C7C0]">
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#E6EFEA] dark:bg-[#16382E] text-[#1C4939] dark:text-[#D4A94F] border border-[#1C4939]/30 flex items-center justify-center shrink-0">✓</div>
                    Reconhece automaticamente iFood, Uber, Netflix, Mercados, Farmácias e Postos
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#E6EFEA] dark:bg-[#16382E] text-[#1C4939] dark:text-[#D4A94F] border border-[#1C4939]/30 flex items-center justify-center shrink-0">✓</div>
                    <strong className="text-[#102D25] dark:text-[#E8E4D9]">Sem dupla contagem:</strong> O pagamento da fatura não duplica suas despesas
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#E6EFEA] dark:bg-[#16382E] text-[#1C4939] dark:text-[#D4A94F] border border-[#1C4939]/30 flex items-center justify-center shrink-0">✓</div>
                    Aprende com as suas correções para as próximas faturas
                  </li>
                </ul>
              </div>

            </div>
          </div>

          {/* Card 3: Metas Proporcionais com Travas */}
          <div className="card-duo p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4A94F] text-[#102D25] text-xs font-extrabold">
                  <PieChart className="h-4 w-4" />
                  Planejamento Inteligente com I.A
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#102D25] dark:text-[#E8E4D9]">
                  Distribuição de Orçamento com travas personalizadas.
                </h3>
                <p className="text-sm sm:text-base font-medium text-[#355248] dark:text-[#B8C7C0] leading-relaxed">
                  Defina o limite máximo que você pode gastar no mês (ex: R$ 4.000,00). A I.A calcula a divisão ideal por categoria. Se você tem custos fixos, trave a categoria e o sistema recalcula o restante.
                </p>
                <ul className="space-y-2.5 text-xs sm:text-sm font-semibold text-[#355248] dark:text-[#B8C7C0]">
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#E6EFEA] dark:bg-[#16382E] text-[#1C4939] dark:text-[#D4A94F] border border-[#1C4939]/30 flex items-center justify-center shrink-0">✓</div>
                    <strong className="text-[#102D25] dark:text-[#E8E4D9]">Travas Individuais:</strong> Aluguel fixo em R$ 1.800? Trave Moradia e a I.A reequilibra o restante proporcionalmente.
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#E6EFEA] dark:bg-[#16382E] text-[#1C4939] dark:text-[#D4A94F] border border-[#1C4939]/30 flex items-center justify-center shrink-0">✓</div>
                    Garante que a soma nunca ultrapasse 1 único centavo do teto estipulado
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#E6EFEA] dark:bg-[#16382E] text-[#1C4939] dark:text-[#D4A94F] border border-[#1C4939]/30 flex items-center justify-center shrink-0">✓</div>
                    Sugestões baseadas nas proporções saudáveis de gestão financeira (50-30-20)
                  </li>
                </ul>
              </div>

              <div className="lg:col-span-5 bg-[#102D25] p-6 rounded-2xl border border-[#285E4B] text-[#E8E4D9] shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#214E3E]">
                  <span className="text-xs font-bold text-[#D4A94F] uppercase">Teto Mensal Definido</span>
                  <span className="text-base font-extrabold text-[#E8E4D9] font-numeric">R$ 4.000,00</span>
                </div>
                <div className="p-3 bg-[#0A1D17] rounded-xl border border-[#214E3E] space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 font-bold text-[#E8E4D9]">
                      Moradia <span className="text-[10px] bg-[#16382E] text-[#D4A94F] border border-[#D4A94F]/30 px-1.5 py-0.5 rounded font-mono">Travado</span>
                    </span>
                    <span className="font-extrabold text-[#D4A94F] font-numeric">R$ 1.800 (45%)</span>
                  </div>
                  <div className="flex justify-between items-center text-[#B8C7C0]">
                    <span>Alimentação</span>
                    <span className="font-bold text-[#78C6A3] font-numeric">R$ 1.100 (27.5%)</span>
                  </div>
                  <div className="flex justify-between items-center text-[#B8C7C0]">
                    <span>Transporte & Lazer</span>
                    <span className="font-bold text-[#78C6A3] font-numeric">R$ 1.100 (27.5%)</span>
                  </div>
                </div>
                <p className="text-[11px] font-bold text-[#D4A94F] text-center">
                  Rebalanceamento determinístico mantendo 100% da sua meta.
                </p>
              </div>
            </div>
          </div>

          {/* Card 4: Alerta Preventivo de Limite */}
          <div className="card-duo p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              <div className="lg:col-span-5 order-2 lg:order-1 bg-[#102D25] p-6 rounded-2xl border border-[#D4A94F]/40 text-[#E8E4D9] shadow-xl space-y-3">
                <div className="p-3.5 bg-[#0A1D17] rounded-xl border border-[#D4A94F]/40 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-[#D4A94F]">
                      <AlertTriangle className="h-4 w-4 text-[#D4A94F]" />
                      Gatilho de Alerta: 80%
                    </span>
                    <span className="text-[#102D25] bg-[#D4A94F] font-extrabold px-2 py-0.5 rounded text-[10px]">Alerta Global</span>
                  </div>
                  <p className="text-xs font-medium text-[#E8E4D9]/85 leading-snug">
                    O sistema sinaliza automaticamente quando qualquer categoria atinge seu limite de segurança, mostrando exatamente quantos reais restam.
                  </p>
                </div>
                <div className="text-center pt-1">
                  <span className="text-xs font-bold text-[#D4A94F]">
                    Você no controle antes da surpresa acontecer.
                  </span>
                </div>
              </div>

              <div className="lg:col-span-7 order-1 lg:order-2 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#102D25] text-[#D4A94F] border border-[#D4A94F]/40 text-xs font-bold">
                  <AlertTriangle className="h-4 w-4" />
                  Alerta Preventivo de Consumo
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#102D25] dark:text-[#E8E4D9]">
                  Nunca mais descubra que estourou o limite no último dia do mês.
                </h3>
                <p className="text-sm sm:text-base font-medium text-[#355248] dark:text-[#B8C7C0] leading-relaxed">
                  Saber que gastou demais depois que a fatura fechou não serve para nada. Defina sua margem de segurança (ex: 80%) e receba avisos preventivos para agir com antecedência.
                </p>
                <ul className="space-y-2.5 text-xs sm:text-sm font-semibold text-[#355248] dark:text-[#B8C7C0]">
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#F7EFE0] dark:bg-[#16382E] text-[#9A7220] dark:text-[#D4A94F] border border-[#D4A94F]/40 flex items-center justify-center shrink-0">✓</div>
                    Radar visual com alertas preventivos antes de extrapolar o teto
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#F7EFE0] dark:bg-[#16382E] text-[#9A7220] dark:text-[#D4A94F] border border-[#D4A94F]/40 flex items-center justify-center shrink-0">✓</div>
                    Cálculo diário em tempo real de quanto ainda pode ser gasto com segurança
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#F7EFE0] dark:bg-[#16382E] text-[#9A7220] dark:text-[#D4A94F] border border-[#D4A94F]/40 flex items-center justify-center shrink-0">✓</div>
                    Tranquilidade para manter a economia mensal intacta
                  </li>
                </ul>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          4. TABELA COMPARATIVA EXECUTIVA
          ========================================================================= */}
      <section className="space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E6EFEA] dark:bg-[#16382E] text-[#1C4939] dark:text-[#D4A94F] border border-[#1C4939]/25 dark:border-[#D4A94F]/30 text-xs font-bold uppercase tracking-wider">
            Comparativo Transparente
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#102D25] dark:text-[#E8E4D9]">
            Por que o Economia Real é diferente de tudo o que você já usou?
          </h2>
          <p className="text-[#355248] dark:text-[#B8C7C0] text-sm sm:text-base font-medium">
            Compare lado a lado e entenda por que a nossa abordagem traz resultados reais.
          </p>
        </div>

        <div className="card-duo overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#102D25] text-[#E8E4D9] border-b border-[#214E3E]">
                  <th className="p-4 sm:p-5 font-extrabold text-[#E8E4D9]">Recurso / Diferencial</th>
                  <th className="p-4 sm:p-5 font-extrabold text-center text-sm sm:text-base text-[#D4A94F] bg-[#16382E]">
                    <span className="inline-flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-[#D4A94F]" /> Economia Real
                    </span>
                  </th>
                  <th className="p-4 sm:p-5 font-bold text-[#B8C7C0] text-center">Planilhas Excel</th>
                  <th className="p-4 sm:p-5 font-bold text-[#B8C7C0] text-center">Outros Apps</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DDD0] dark:divide-[#1B4235] font-semibold">
                
                {/* Linha 1 */}
                <tr className="hover:bg-[#EFECE3]/60 dark:hover:bg-[#16382E]/40 transition-colors">
                  <td className="p-4 sm:p-5 text-[#102D25] dark:text-[#E8E4D9] font-bold">Lançamento de Gastos por Voz com I.A</td>
                  <td className="p-4 sm:p-5 text-center text-[#1C4939] dark:text-[#D4A94F] font-extrabold col-highlight-real">
                    <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-5 w-5 stroke-[2.5]" /> Sim, em tempo real</span>
                  </td>
                  <td className="p-4 sm:p-5 text-center text-[#B93838]">
                    <XCircle className="h-5 w-5 text-[#B93838] mx-auto" />
                  </td>
                  <td className="p-4 sm:p-5 text-center text-[#B93838]">
                    <XCircle className="h-5 w-5 text-[#B93838] mx-auto" />
                  </td>
                </tr>

                {/* Linha 2 */}
                <tr className="hover:bg-[#EFECE3]/60 dark:hover:bg-[#16382E]/40 transition-colors">
                  <td className="p-4 sm:p-5 text-[#102D25] dark:text-[#E8E4D9] font-bold">Importação de Faturas e Extratos (OFX/CSV)</td>
                  <td className="p-4 sm:p-5 text-center text-[#1C4939] dark:text-[#D4A94F] font-extrabold col-highlight-real">
                    <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-5 w-5 stroke-[2.5]" /> Sim, automático</span>
                  </td>
                  <td className="p-4 sm:p-5 text-center text-[#526B61] dark:text-[#9AB3A8]">Copiar e colar manual</td>
                  <td className="p-4 sm:p-5 text-center text-[#B93838] font-bold">Cobram plano pago</td>
                </tr>

                {/* Linha 3 */}
                <tr className="hover:bg-[#EFECE3]/60 dark:hover:bg-[#16382E]/40 transition-colors">
                  <td className="p-4 sm:p-5 text-[#102D25] dark:text-[#E8E4D9] font-bold">Prevenção contra Dupla Contagem de Cartão</td>
                  <td className="p-4 sm:p-5 text-center text-[#1C4939] dark:text-[#D4A94F] font-extrabold col-highlight-real">
                    <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-5 w-5 stroke-[2.5]" /> Sim (Passivo Real)</span>
                  </td>
                  <td className="p-4 sm:p-5 text-center text-[#526B61] dark:text-[#9AB3A8]">Fórmulas complexas</td>
                  <td className="p-4 sm:p-5 text-center text-[#B93838]">
                    <XCircle className="h-5 w-5 text-[#B93838] mx-auto" />
                  </td>
                </tr>

                {/* Linha 4 */}
                <tr className="hover:bg-[#EFECE3]/60 dark:hover:bg-[#16382E]/40 transition-colors">
                  <td className="p-4 sm:p-5 text-[#102D25] dark:text-[#E8E4D9] font-bold">Sugestão de Percentuais & Metas com I.A</td>
                  <td className="p-4 sm:p-5 text-center text-[#1C4939] dark:text-[#D4A94F] font-extrabold col-highlight-real">
                    <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-5 w-5 stroke-[2.5]" /> Com travas individuais</span>
                  </td>
                  <td className="p-4 sm:p-5 text-center text-[#B93838]">
                    <XCircle className="h-5 w-5 text-[#B93838] mx-auto" />
                  </td>
                  <td className="p-4 sm:p-5 text-center text-[#526B61] dark:text-[#9AB3A8]">Apenas valores fixos</td>
                </tr>

                {/* Linha 5 */}
                <tr className="hover:bg-[#EFECE3]/60 dark:hover:bg-[#16382E]/40 transition-colors">
                  <td className="p-4 sm:p-5 text-[#102D25] dark:text-[#E8E4D9] font-bold">Alerta Preventivo de Limite (Antes de Estourar)</td>
                  <td className="p-4 sm:p-5 text-center text-[#1C4939] dark:text-[#D4A94F] font-extrabold col-highlight-real">
                    <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-5 w-5 stroke-[2.5]" /> Sim, personalizável</span>
                  </td>
                  <td className="p-4 sm:p-5 text-center text-[#B93838]">
                    <XCircle className="h-5 w-5 text-[#B93838] mx-auto" />
                  </td>
                  <td className="p-4 sm:p-5 text-center text-[#526B61] dark:text-[#9AB3A8]">Apenas aviso tardio</td>
                </tr>

                {/* Linha 6 */}
                <tr className="hover:bg-[#EFECE3]/60 dark:hover:bg-[#16382E]/40 transition-colors">
                  <td className="p-4 sm:p-5 text-[#102D25] dark:text-[#E8E4D9] font-bold">Precisão Monetária ao Centavo</td>
                  <td className="p-4 sm:p-5 text-center text-[#1C4939] dark:text-[#D4A94F] font-extrabold col-highlight-real">
                    <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-5 w-5 stroke-[2.5]" /> 100% Determinística</span>
                  </td>
                  <td className="p-4 sm:p-5 text-center text-[#1C4939] dark:text-[#78C6A3] font-bold">Sim</td>
                  <td className="p-4 sm:p-5 text-center text-[#B93838] font-bold">Arredonda errado</td>
                </tr>

                {/* Linha 7: Destaque Final de Preço */}
                <tr className="bg-[#EFECE3] dark:bg-[#0D241D] border-t border-[#D5CFC0] dark:border-[#214E3E]">
                  <td className="p-4 sm:p-5 text-[#102D25] dark:text-[#E8E4D9] font-extrabold text-sm sm:text-base">
                    Preço / Mensalidade
                  </td>
                  <td className="p-4 sm:p-5 text-center font-extrabold text-sm sm:text-base text-[#1C4939] dark:text-[#D4A94F] col-highlight-real">
                    100% Gratuito
                  </td>
                  <td className="p-4 sm:p-5 text-center text-[#526B61] dark:text-[#9AB3A8] font-medium text-xs sm:text-sm">
                    Grátis (muito trabalho)
                  </td>
                  <td className="p-4 sm:p-5 text-center text-[#B93838] font-extrabold text-xs sm:text-sm">
                    R$ 15 a R$ 35/mês
                  </td>
                </tr>

              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. COMO FUNCIONA: 3 PASSOS EXECUTIVOS
          ========================================================================= */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#102D25] text-[#D4A94F] border border-[#D4A94F]/40 text-xs font-bold uppercase tracking-wider">
            Simplicidade Total
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#102D25] dark:text-[#E8E4D9]">
            Comece em menos de 1 minuto
          </h2>
          <p className="text-[#355248] dark:text-[#B8C7C0] text-sm sm:text-base font-medium">
            Sem burocracias. Você cria sua conta e já começa a economizar hoje.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          
          {/* Passo 1 */}
          <div className="card-duo p-6 space-y-3.5 text-center sm:text-left">
            <div className="h-12 w-12 rounded-xl bg-[#102D25] border border-[#D4A94F]/40 text-[#D4A94F] font-extrabold text-xl flex items-center justify-center shadow-xs mx-auto sm:mx-0 font-numeric">
              01
            </div>
            <h3 className="text-lg font-extrabold text-[#102D25] dark:text-[#E8E4D9]">Crie sua Conta Grátis</h3>
            <p className="text-xs sm:text-sm font-medium text-[#355248] dark:text-[#B8C7C0] leading-relaxed">
              Informe apenas seu nome e e-mail. Não pedimos cartão de crédito, CPF ou senhas bancárias.
            </p>
          </div>

          {/* Passo 2 */}
          <div className="card-duo p-6 space-y-3.5 text-center sm:text-left">
            <div className="h-12 w-12 rounded-xl bg-[#1C4939] border border-[#102D25] text-[#E8E4D9] font-extrabold text-xl flex items-center justify-center shadow-xs mx-auto sm:mx-0 font-numeric">
              02
            </div>
            <h3 className="text-lg font-extrabold text-[#102D25] dark:text-[#E8E4D9]">Lance com Voz ou Fatura</h3>
            <p className="text-xs sm:text-sm font-medium text-[#355248] dark:text-[#B8C7C0] leading-relaxed">
              Fale o que gastou no microfone em segundos ou arraste a fatura do seu banco. A I.A categoriza tudo.
            </p>
          </div>

          {/* Passo 3 */}
          <div className="card-duo p-6 space-y-3.5 text-center sm:text-left">
            <div className="h-12 w-12 rounded-xl bg-[#D4A94F] border border-[#B88B32] text-[#102D25] font-extrabold text-xl flex items-center justify-center shadow-xs mx-auto sm:mx-0 font-numeric">
              03
            </div>
            <h3 className="text-lg font-extrabold text-[#102D25] dark:text-[#E8E4D9]">Acompanhe e Economize</h3>
            <p className="text-xs sm:text-sm font-medium text-[#355248] dark:text-[#B8C7C0] leading-relaxed">
              Receba avisos antes de ultrapassar suas metas e tome decisões inteligentes para multiplicar seu patrimônio.
            </p>
          </div>

        </div>
      </section>

      {/* =========================================================================
          6. PERGUNTAS FREQUENTES (FAQ)
          ========================================================================= */}
      <section className="space-y-8 max-w-3xl mx-auto">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EFECE3] dark:bg-[#16382E] text-[#102D25] dark:text-[#D4A94F] border border-[#D5CFC0] dark:border-[#214E3E] text-xs font-bold uppercase tracking-wider">
            Tire Suas Dúvidas
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#102D25] dark:text-[#E8E4D9]">
            Perguntas Frequentes
          </h2>
          <p className="text-[#526B61] dark:text-[#9AB3A8] text-sm font-medium">
            Tudo o que você precisa saber para começar com total segurança.
          </p>
        </div>

        <div className="space-y-3">
          {[
            {
              question: 'Eu preciso conectar a senha da minha conta bancária?',
              answer: 'Não! De forma alguma. Sua segurança é nossa prioridade máxima. Você nunca insere senhas de banco no Economia Real. O lançamento é feito via comando de voz em tempo real ou você mesmo exporta o extrato/fatura (OFX ou CSV) do seu aplicativo de preferência e arrasta para cá.'
            },
            {
              question: 'Como funciona o lançamento por voz com I.A?',
              answer: 'Basta clicar no botão de microfone e falar naturalmente: "ifood 49,19 no crédito" ou "uber 25 reais". O navegador reconhece o áudio em tempo real e nossa inteligência artificial interpreta o valor, a data, a categoria e a conta, preenchendo o lançamento em menos de 2 segundos.'
            },
            {
              question: 'O aplicativo é realmente gratuito?',
              answer: 'Sim! Você tem acesso completo a todas as ferramentas essenciais: lançamento por voz, importação de extratos com IA, cálculo proporcional de metas com travas individuais, gráficos de fluxo de caixa e alertas de limite.'
            },
            {
              question: 'O que é a prevenção de dupla contagem de faturas?',
              answer: 'Muitos aplicativos somam as compras parceladas no mês em que foram feitas e, quando você paga a fatura do cartão, somam aquele valor novamente como despesa. No Economia Real, o pagamento da fatura é tratado como quitação de passivo. Assim, seus relatórios mostram a realidade exata do seu bolso, sem distorção.'
            },
            {
              question: 'Como funcionam os alertas preventivos de metas?',
              answer: 'Você estipula uma margem de segurança (por exemplo, 80%). Quando os seus gastos em Alimentação, Lazer ou qualquer outra categoria atingem esse patamar, a plataforma acende alertas visuais inteligentes avisando quantos reais restam até o final do período, para que você não seja pego de surpresa.'
            }
          ].map((faq, idx) => (
            <div key={idx} className="card-duo overflow-hidden border-l-4 border-l-[#1C4939] dark:border-l-[#D4A94F]">
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-5 text-left font-extrabold text-[#102D25] dark:text-[#E8E4D9] flex items-center justify-between gap-4 hover:bg-[#EFECE3]/60 dark:hover:bg-[#16382E]/50 transition-colors"
              >
                <span className="text-sm sm:text-base">{faq.question}</span>
                <ChevronDown
                  className={`h-5 w-5 text-[#1C4939] dark:text-[#D4A94F] shrink-0 transition-transform duration-200 ${
                    openFaq === idx ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 pt-2 text-xs sm:text-sm font-medium text-[#355248] dark:text-[#B8C7C0] leading-relaxed border-t border-[#E2DDD0] dark:border-[#214E3E]">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          7. CTA FINAL DE ALTA CONVERSÃO (#102D25 + #1C4939 + #D4A94F)
          ========================================================================= */}
      <section className="rounded-3xl p-8 sm:p-14 text-center relative overflow-hidden space-y-6 bg-gradient-to-br from-[#102D25] via-[#153A30] to-[#1C4939] text-[#E8E4D9] shadow-2xl border border-[#D4A94F]/45">
        
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#D4A94F]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-2xl mx-auto space-y-5 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0A1D17]/65 border border-[#D4A94F]/40 text-[#D4A94F] text-xs font-bold uppercase tracking-wider mx-auto">
            <Sparkles className="h-4 w-4" />
            Comece a Economizar Hoje
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#E8E4D9] tracking-tight leading-tight">
            Pronto para ter o controle do seu dinheiro com clareza profissional?
          </h2>

          <p className="text-[#E8E4D9]/80 text-sm sm:text-base font-medium leading-relaxed">
            Junte-se a quem já parou de perder horas com planilhas e começou a poupar de verdade com inteligência artificial.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => {
                trackCtaClick('bottom_register_btn', 'landing_cta_section');
                onOpenRegister();
              }}
              onMouseEnter={warmUpBackend}
              onTouchStart={warmUpBackend}
              className="btn-duo btn-duo-purple w-full sm:w-auto text-base sm:text-lg px-8 py-4 flex items-center justify-center gap-3"
            >
              <Zap className="h-5 w-5 stroke-[2.5]" />
              <span>Criar Minha Conta Grátis</span>
              <ArrowRight className="h-5 w-5 stroke-[2.5]" />
            </button>
            <button
              onClick={() => {
                trackCtaClick('bottom_login_btn', 'landing_cta_section');
                onOpenLogin();
              }}
              onMouseEnter={warmUpBackend}
              onTouchStart={warmUpBackend}
              className="btn-duo bg-[#E8E4D9]/12 hover:bg-[#E8E4D9]/20 text-[#E8E4D9] border border-[#E8E4D9]/30 w-full sm:w-auto text-base px-6 py-4 flex items-center justify-center gap-2"
            >
              Já tenho conta cadastrada
            </button>
          </div>

          <p className="text-xs font-semibold text-[#D4A94F] pt-2">
            Leva menos de 1 minuto • Sem cartão de crédito • Acesso imediato
          </p>
        </div>
      </section>

      {/* =========================================================================
          8. RODAPÉ INSTITUCIONAL COM SELOS DE CONFIABILIDADE
          ========================================================================= */}
      <footer className="pt-10 border-t border-[#D5CFC0] dark:border-[#214E3E] space-y-8">
        {/* Faixa de Selos de Confiança */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-[#D5CFC0] dark:border-[#214E3E]">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#FAF8F4] dark:bg-[#102D25] border border-[#D5CFC0] dark:border-[#214E3E] shadow-2xs">
            <div className="h-10 w-10 rounded-xl bg-[#E6EFEA] dark:bg-[#16382E] text-[#1C4939] dark:text-[#D4A94F] flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5 stroke-[2.3]" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-[#102D25] dark:text-[#E8E4D9]">100% Conforme LGPD</p>
              <p className="text-[11px] font-medium text-[#526B61] dark:text-[#9AB3A8]">Seus dados financeiros nunca são vendidos.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#FAF8F4] dark:bg-[#102D25] border border-[#D5CFC0] dark:border-[#214E3E] shadow-2xs">
            <div className="h-10 w-10 rounded-xl bg-[#102D25] text-[#D4A94F] flex items-center justify-center shrink-0">
              <Lock className="h-5 w-5 stroke-[2.3]" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-[#102D25] dark:text-[#E8E4D9]">Zero Senha Bancária</p>
              <p className="text-[11px] font-medium text-[#526B61] dark:text-[#9AB3A8]">Importação por arquivo OFX ou comando de voz.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#FAF8F4] dark:bg-[#102D25] border border-[#D5CFC0] dark:border-[#214E3E] shadow-2xs">
            <div className="h-10 w-10 rounded-xl bg-[#F7EFE0] dark:bg-[#16382E] text-[#9A7220] dark:text-[#D4A94F] flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 stroke-[2.3]" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-[#102D25] dark:text-[#E8E4D9]">Precisão Decimal Rigorosa</p>
              <p className="text-[11px] font-medium text-[#526B61] dark:text-[#9AB3A8]">Cálculos no backend sem alucinação da I.A.</p>
            </div>
          </div>
        </div>

        {/* Links Institucionais e Navegação */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start text-xs font-semibold text-[#355248] dark:text-[#B8C7C0]">
          {/* Apresentação da Marca */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo-economia-real.png"
                alt="Logotipo Oficial do Economia Real"
                width={36}
                height={36}
                className="h-9 w-9 rounded-xl object-cover border border-[#1C4939]/30 dark:border-[#D4A94F]/40 shadow-2xs"
              />
              <span className="text-lg font-extrabold text-[#102D25] dark:text-[#E8E4D9]">
                Economia<span className="text-[#1C4939] dark:text-[#D4A94F]">Real</span>
              </span>
            </div>
            <p className="text-[#526B61] dark:text-[#9AB3A8] leading-relaxed text-xs">
              Plataforma de inteligência financeira pessoal projetada para eliminar o atrito de planilhas. Lance movimentações por voz, previna a duplicidade de faturas e economize com clareza.
            </p>
            <p className="text-[11px] text-[#526B61] dark:text-[#9AB3A8] font-bold">
              © 2026 Economia Real. Todos os direitos reservados.
            </p>
          </div>

          {/* Coluna 1: Recursos */}
          <div className="md:col-span-3 space-y-2.5">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#102D25] dark:text-[#E8E4D9]">
              Recursos
            </h4>
            <ul className="space-y-1.5 text-[#526B61] dark:text-[#9AB3A8]">
              <li>• Lançamento de Gastos por Voz</li>
              <li>• Importador de Faturas (OFX/CSV)</li>
              <li>• Prevenção de Dupla Contagem</li>
              <li>• Alertas Preventivos de Metas</li>
              <li>• Orçamentos com Inteligência Artificial</li>
            </ul>
          </div>

          {/* Coluna 2: Confiança & Legal */}
          <div className="md:col-span-4 space-y-2.5">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#102D25] dark:text-[#E8E4D9]">
              Segurança & Governança (LGPD)
            </h4>
            <div className="flex flex-col space-y-2 items-start">
              <button
                type="button"
                onClick={onOpenPrivacy}
                className="text-[#355248] dark:text-[#B8C7C0] hover:text-[#1C4939] dark:hover:text-[#D4A94F] hover:underline flex items-center gap-1.5 transition-colors"
              >
                <Lock className="h-3.5 w-3.5 text-[#1C4939] dark:text-[#D4A94F]" />
                Política de Privacidade & Direitos LGPD
              </button>
              <button
                type="button"
                onClick={onOpenTerms}
                className="text-[#355248] dark:text-[#B8C7C0] hover:text-[#1C4939] dark:hover:text-[#D4A94F] hover:underline flex items-center gap-1.5 transition-colors"
              >
                <FileText className="h-3.5 w-3.5 text-[#1C4939] dark:text-[#D4A94F]" />
                Termos de Uso do Serviço
              </button>
              <button
                type="button"
                onClick={onOpenSecurity}
                className="text-[#355248] dark:text-[#B8C7C0] hover:text-[#1C4939] dark:hover:text-[#D4A94F] hover:underline flex items-center gap-1.5 transition-colors"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-[#D4A94F]" />
                Segurança Bancária & I.A Determinística
              </button>
              <div className="pt-2 text-[11px] text-[#526B61] dark:text-[#9AB3A8] flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-[#1C4939] dark:text-[#D4A94F]" />
                <span>Contato: <strong className="text-[#102D25] dark:text-[#E8E4D9]">contato@economia-real.ia.br</strong></span>
              </div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};
