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
  AlertTriangle
} from 'lucide-react';

interface LandingPageProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenLogin, onOpenRegister }) => {
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
          1. HERO SECTION COM CONTRASTE VIBRANTE & SIMULADOR ESCURO PREMIUM
          ========================================================================= */}
      <section className="relative overflow-hidden pt-2 pb-6 sm:py-8">
        
        {/* Glows coloridos e atmosféricos de fundo (Azul, Violeta, Esmeralda) */}
        <div className="absolute top-12 left-10 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute top-20 right-10 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-emerald-400/15 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* Lado Esquerdo: Argumentação Forte e Colorida */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Tag / Badge Vibrante de Tecnologia */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-xs font-black shadow-md shadow-indigo-500/20 uppercase tracking-wider">
              <Sparkles className="h-4 w-4 text-yellow-300 animate-spin" style={{ animationDuration: '4s' }} />
              <span>Inteligência Financeira Real • Sem Planilhas</span>
            </div>

            {/* Título Principal com Destaques Cromáticos */}
            <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-black text-slate-900 tracking-tight leading-[1.15]">
              Controle suas finanças sem o sofrimento de{' '}
              <span className="bg-gradient-to-r from-[#026CD6] via-[#2563EB] to-[#4F46E5] bg-clip-text text-transparent">
                anotar tudo na mão
              </span>.
            </h1>

            {/* Subtítulo Persuasivo */}
            <p className="text-base sm:text-lg font-bold text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Fale no microfone ou suba a fatura do seu banco. A I.A categoriza tudo em segundos, define seus limites ideais e{' '}
              <span className="text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-lg font-black border border-amber-300">
                te avisa antes de você estourar o orçamento
              </span>.
            </p>

            {/* Botões de Ação Imediata (CTAs Táteis com Relevo 3D) */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={onOpenRegister}
                className="btn-duo btn-duo-green w-full sm:w-auto text-base sm:text-lg px-8 py-4 flex items-center justify-center gap-3 shadow-xl shadow-emerald-600/30 border-b-4 border-emerald-700 hover:scale-[1.02] transition-transform"
              >
                <Zap className="h-5 w-5 fill-white stroke-[2.5]" />
                Criar Conta Grátis Agora
                <ArrowRight className="h-5 w-5 stroke-[3]" />
              </button>

              <button
                onClick={onOpenLogin}
                className="btn-duo btn-duo-white w-full sm:w-auto text-base px-6 py-4 flex items-center justify-center gap-2 border-slate-300 text-slate-800 hover:bg-slate-100"
              >
                Já tenho conta cadastrada
              </button>
            </div>

            {/* Micro-provas de Confiança com Selos Coloridos */}
            <div className="pt-3 flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-xs font-black">
              <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 stroke-[3]" />
                100% Gratuito
              </span>
              <span className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                <CheckCircle2 className="h-4 w-4 text-[#026CD6] stroke-[3]" />
                Sem pedir cartão de crédito
              </span>
              <span className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                <CheckCircle2 className="h-4 w-4 text-indigo-600 stroke-[3]" />
                Sem conectar senha bancária
              </span>
            </div>
          </div>

          {/* Lado Direito: Simulador com Moldura Dark Premium (Contraste Máximo!) */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 border-4 border-slate-800 shadow-2xl shadow-indigo-950/40 text-white relative overflow-hidden">
              
              {/* Efeito Glow Interno */}
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

              {/* Topo do Mockup: Simulação de Sistema Operacional */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
                  <div className="w-3 h-3 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                  <span className="text-[11px] font-black text-slate-400 ml-1.5">Simulador em Tempo Real</span>
                </div>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  I.A Online
                </span>
              </div>

              {/* Botões de Alternância das Demonstrações */}
              <div className="grid grid-cols-3 gap-1.5 my-4 p-1.5 bg-slate-800/80 rounded-2xl border border-slate-700/60 relative z-10">
                <button
                  onClick={() => setActiveHeroTab('voice')}
                  className={`py-2 px-1 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    activeHeroTab === 'voice'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Mic className="h-3.5 w-3.5" />
                  Voz
                </button>
                <button
                  onClick={() => setActiveHeroTab('statement')}
                  className={`py-2 px-1 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    activeHeroTab === 'statement'
                      ? 'bg-gradient-to-r from-blue-600 to-sky-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UploadCloud className="h-3.5 w-3.5" />
                  Fatura
                </button>
                <button
                  onClick={() => setActiveHeroTab('goals')}
                  className={`py-2 px-1 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    activeHeroTab === 'goals'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/30'
                      : 'text-slate-400 hover:text-white'
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
                    <div className="p-3.5 rounded-2xl bg-indigo-950/70 border border-indigo-500/30 space-y-2">
                      <div className="flex items-center justify-between text-xs font-black text-indigo-300">
                        <span className="flex items-center gap-1.5">
                          <Volume2 className="h-4 w-4 text-indigo-400 animate-pulse" />
                          Você fala com o celular:
                        </span>
                        <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-md font-mono">Microfone Ativo</span>
                      </div>
                      <p className="text-sm font-black text-white italic bg-slate-800/90 p-3 rounded-xl border border-indigo-400/20">
                        "Ifood 49 e 19 no crédito ontem à noite"
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-indigo-400 text-xs font-black">
                      <Sparkles className="h-4 w-4 text-yellow-400 animate-bounce" />
                      <span>Processamento Instantâneo</span>
                    </div>

                    {/* Resultado estruturado pela I.A */}
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border-2 border-emerald-500/40 shadow-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider">Transação Criada</span>
                        <span className="text-[10px] font-black bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="h-3 w-3 stroke-[3]" /> 1.2s
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-black text-white">🍔 Alimentação (iFood)</p>
                          <p className="text-xs font-bold text-slate-400">Cartão de Crédito • Ontem</p>
                        </div>
                        <p className="text-base font-black text-rose-400">- R$ 49,19</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. MOCKUP DE FATURA COM IA */}
                {activeHeroTab === 'statement' && (
                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl bg-blue-950/60 border border-blue-500/30 space-y-2 text-center">
                      <UploadCloud className="h-8 w-8 text-sky-400 mx-auto animate-bounce" />
                      <div>
                        <p className="text-xs font-black text-white">fatura_nubank_outubro.csv</p>
                        <p className="text-[11px] font-bold text-sky-300">54 transações categorizadas</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-200">UBER *TRIP RIO</span>
                        <span className="text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/40 font-black">Transporte</span>
                        <span className="font-black text-rose-300">- R$ 24,90</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-200">POSTO SHELL COMBUSTIVEL</span>
                        <span className="text-sky-300 bg-sky-950/60 px-2 py-0.5 rounded-md border border-sky-500/40 font-black">Veículo</span>
                        <span className="font-black text-rose-300">- R$ 150,00</span>
                      </div>
                    </div>
                    <p className="text-[11px] font-black text-center text-emerald-400">
                      ✓ Sem duplicar pagamentos de cartão de crédito!
                    </p>
                  </div>
                )}

                {/* 3. MOCKUP DE METAS COM ALERTA PREVENTIVO */}
                {activeHeroTab === 'goals' && (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-amber-950/60 border-2 border-amber-500/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                          <AlertTriangle className="h-4 w-4 text-amber-400" />
                          Alerta de Consumo Próximo (80%)
                        </span>
                        <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md">Ativo</span>
                      </div>
                      <p className="text-xs font-bold text-amber-200/90 leading-snug">
                        Você já consumiu <strong>82%</strong> da meta de Alimentação. Faltam 12 dias para virar o mês!
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700 space-y-2">
                      <div className="flex justify-between text-xs font-black">
                        <span className="text-white">🍔 Alimentação</span>
                        <span className="text-rose-400 font-black">R$ 820,00 / R$ 1.000,00</span>
                      </div>
                      <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                        <div className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 rounded-full" style={{ width: '82%' }}></div>
                      </div>
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-400">Teto máximo</span>
                        <span className="text-emerald-400 font-black">R$ 180,00 restantes</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Botão de Rodapé do Mockup */}
              <div className="pt-4 border-t border-slate-800 relative z-10">
                <button
                  onClick={onOpenRegister}
                  className="w-full btn-duo btn-duo-purple text-xs sm:text-sm py-3 flex items-center justify-center gap-2 border-b-4 border-indigo-900 shadow-lg shadow-indigo-600/30"
                >
                  <Sparkles className="h-4 w-4 text-yellow-300" />
                  Experimentar Gratuitamente no seu Bolso
                </button>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          2. A DOR VS A SOLUÇÃO: BLOCOS COM CORES EXPRESSIVAS E CONTRASTE
          ========================================================================= */}
      <section className="space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-100 text-rose-800 border-2 border-rose-300 text-xs font-black uppercase tracking-wider">
            A Dor da Desorganização
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900">
            Por que 9 em cada 10 pessoas desistem de controlar os gastos?
          </h2>
          <p className="text-slate-600 text-sm sm:text-base font-bold">
            O problema não é sua força de vontade. É o atrito absurdo das ferramentas que te oferecem por aí.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          
          {/* Card 1: Planilhas (Vermelho/Coral Suave mas bem colorido) */}
          <div className="rounded-3xl p-6 space-y-4 border-2 border-rose-300/80 bg-gradient-to-b from-rose-50 via-red-50/60 to-rose-100/40 shadow-[0_6px_0_0_#FDA4AF] transition-all">
            <div className="h-12 w-12 rounded-2xl bg-rose-500 border-b-4 border-rose-700 flex items-center justify-center text-white shadow-md">
              <FileSpreadsheet className="h-6 w-6 stroke-[2.5]" />
            </div>
            <h3 className="text-lg font-black text-rose-950 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
              Planilhas de Excel
            </h3>
            <p className="text-xs sm:text-sm font-bold text-rose-900/80 leading-relaxed">
              Você precisa ligar o computador no domingo, caçar comprovantes antigos, brigar com fórmulas que quebram e, na segunda semana, já desistiu de tudo.
            </p>
          </div>

          {/* Card 2: Outros Apps (Âmbar/Laranja Quente) */}
          <div className="rounded-3xl p-6 space-y-4 border-2 border-amber-300/80 bg-gradient-to-b from-amber-50 via-orange-50/60 to-amber-100/40 shadow-[0_6px_0_0_#FCD34D] transition-all">
            <div className="h-12 w-12 rounded-2xl bg-amber-500 border-b-4 border-amber-700 flex items-center justify-center text-amber-950 shadow-md">
              <Sliders className="h-6 w-6 stroke-[2.5]" />
            </div>
            <h3 className="text-lg font-black text-amber-950 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-amber-600 shrink-0" />
              Apps Tradicionais
            </h3>
            <p className="text-xs sm:text-sm font-bold text-amber-900/80 leading-relaxed">
              Exigem preencher 8 campos manuais para cada cafezinho de R$ 6,00. E pior: cobram mensalidade cara e duplicam o pagamento da sua fatura nos relatórios.
            </p>
          </div>

          {/* Card 3: Economia Real (Verde Esmeralda Vibrante em Destaque!) */}
          <div className="rounded-3xl p-6 space-y-4 border-2 border-emerald-500 bg-gradient-to-b from-emerald-600 to-teal-700 text-white shadow-[0_8px_0_0_#065F46] md:-translate-y-2 hover:-translate-y-3 transition-all relative overflow-hidden">
            <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-yellow-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-sm">
              ✨ Solução Definitiva
            </div>
            <div className="h-12 w-12 rounded-2xl bg-white text-emerald-700 border-b-4 border-emerald-200 flex items-center justify-center shadow-lg">
              <Zap className="h-6 w-6 fill-emerald-600 stroke-[2.5]" />
            </div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-yellow-300 shrink-0" />
              Economia Real com I.A
            </h3>
            <p className="text-xs sm:text-sm font-bold text-emerald-50 leading-relaxed">
              Fale 1 áudio de 2 segundos enquanto entra no carro ou arraste o extrato no final do mês. A inteligência artificial organiza tudo e te avisa antes de você estourar.
            </p>
          </div>

        </div>
      </section>

      {/* =========================================================================
          3. OS 4 GRANDES DIFERENCIAIS DA I.A COM PALETAS TEMÁTICAS VIBRANTES
          ========================================================================= */}
      <section className="space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-100 text-[#026CD6] border-2 border-blue-300 text-xs font-black uppercase tracking-wider">
            Superpoderes da Plataforma
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900">
            A inteligência artificial trabalhando pelo seu bolso
          </h2>
          <p className="text-slate-600 text-sm sm:text-base font-bold">
            Feito sob medida para quem não quer perder tempo e exige saber exatamente para onde vai cada centavo.
          </p>
        </div>

        <div className="space-y-8">
          
          {/* Card 1: Lançamento por Voz (Tema Índigo / Roxo Tecnológico) */}
          <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/80 border-2 border-indigo-200 shadow-[0_6px_0_0_#C7D2FE] transition-all">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-black shadow-sm">
                  <Mic className="h-4 w-4" />
                  Lançamento por Voz Nativo
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                  Diga o que gastou e pronto. A I.A faz o resto.
                </h3>
                <p className="text-sm sm:text-base font-bold text-slate-600 leading-relaxed">
                  Basta apertar o microfone e falar como você conversa com um amigo: <strong className="text-indigo-900 bg-indigo-100 px-1.5 py-0.5 rounded">"Almoço 45 reais no débito"</strong> ou <strong className="text-indigo-900 bg-indigo-100 px-1.5 py-0.5 rounded">"Farmácia 89,90 parcelado em 2x"</strong>.
                </p>
                <ul className="space-y-2.5 text-xs sm:text-sm font-bold text-slate-700">
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">✓</div>
                    Reconhecimento de voz em tempo real no navegador do PC ou no celular
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">✓</div>
                    Identifica categoria, valor numérico exato, data e conta correspondente
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">✓</div>
                    Nunca mais gaste 2 minutos preenchendo formulários para um cafezinho
                  </li>
                </ul>
              </div>

              <div className="lg:col-span-5 bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-6 rounded-3xl border-2 border-indigo-700/60 text-white shadow-xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/40">
                    <Volume2 className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-indigo-300 uppercase tracking-wider">Comando Falado</p>
                    <p className="text-sm font-black text-white">"Ifood 49,19 no cartão"</p>
                  </div>
                </div>
                <div className="p-3.5 bg-slate-800/90 rounded-2xl border border-indigo-500/30 space-y-2 text-xs">
                  <div className="flex justify-between font-black">
                    <span className="text-slate-400">Categoria Detectada:</span>
                    <span className="text-indigo-300 font-extrabold">🍔 Alimentação</span>
                  </div>
                  <div className="flex justify-between font-black">
                    <span className="text-slate-400">Método de Pagamento:</span>
                    <span className="text-slate-200">Cartão de Crédito</span>
                  </div>
                  <div className="flex justify-between font-black pt-1 border-t border-slate-700">
                    <span className="text-slate-400">Valor exato:</span>
                    <span className="text-rose-400 font-black text-sm">- R$ 49,19</span>
                  </div>
                </div>
                <div className="text-[11px] font-black text-center text-emerald-400 flex items-center justify-center gap-1">
                  <Check className="h-3.5 w-3.5 stroke-[3]" /> Registrado com precisão em 1.2 segundos
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Importação de Fatura e Extrato (Tema Azul Elétrico / Sky Blue) */}
          <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-blue-50/90 via-white to-sky-50/80 border-2 border-blue-200 shadow-[0_6px_0_0_#BFDBFE] transition-all">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              <div className="lg:col-span-5 order-2 lg:order-1 bg-gradient-to-br from-blue-900 via-slate-900 to-sky-950 p-6 rounded-3xl border-2 border-blue-700/60 text-white shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-xl bg-blue-500 text-white font-black text-xs shadow-sm">
                      OFX
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-500 text-white font-black text-xs shadow-sm">
                      CSV
                    </span>
                  </div>
                  <span className="text-[11px] font-black text-sky-300 bg-sky-950/80 px-2.5 py-0.5 rounded-full border border-sky-400/30">
                    Nubank, Inter, Itaú, C6...
                  </span>
                </div>
                <div className="p-3 bg-slate-800/90 rounded-2xl border border-blue-400/30 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-black">
                    <span className="text-slate-200">54 transações lidas</span>
                    <span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded font-black">100% Conciliado</span>
                  </div>
                  <div className="space-y-1.5 pt-1 text-[11px] font-bold">
                    <div className="flex justify-between text-slate-300">
                      <span>Uber do Brasil</span>
                      <span className="text-sky-300">Transporte</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Supermercado Pão de Açúcar</span>
                      <span className="text-indigo-300">Alimentação</span>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] font-black text-center text-yellow-300">
                  🔒 Zero risco: Você não insere senhas do banco.
                </p>
              </div>

              <div className="lg:col-span-7 order-1 lg:order-2 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#026CD6] text-white text-xs font-black shadow-sm">
                  <UploadCloud className="h-4 w-4" />
                  Importação Instantânea de Extrato
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                  O mês inteiro lançado com um simples arrastar de arquivo.
                </h3>
                <p className="text-sm sm:text-base font-bold text-slate-600 leading-relaxed">
                  Não quer registrar gasto por gasto todo dia? No final do mês, baixe o extrato ou fatura do seu aplicativo bancário e arraste para o Economia Real.
                </p>
                <ul className="space-y-2.5 text-xs sm:text-sm font-bold text-slate-700">
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-blue-100 text-[#026CD6] flex items-center justify-center shrink-0">✓</div>
                    Reconhece automaticamente iFood, Uber, Netflix, Mercados, Farmácias e Postos
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-blue-100 text-[#026CD6] flex items-center justify-center shrink-0">✓</div>
                    <strong className="text-slate-900">Sem dupla contagem:</strong> O pagamento da fatura não duplica suas despesas!
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-blue-100 text-[#026CD6] flex items-center justify-center shrink-0">✓</div>
                    Aprende com as suas correções para as próximas faturas
                  </li>
                </ul>
              </div>

            </div>
          </div>

          {/* Card 3: Metas Proporcionais com Travas (Tema Verde Esmeralda / Menta) */}
          <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/80 border-2 border-emerald-200 shadow-[0_6px_0_0_#A7F3D0] transition-all">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-black shadow-sm">
                  <PieChart className="h-4 w-4" />
                  Planejamento Inteligente com I.A
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                  Distribuição de Orçamento com travas personalizadas.
                </h3>
                <p className="text-sm sm:text-base font-bold text-slate-600 leading-relaxed">
                  Defina o limite máximo que você pode gastar no mês (ex: R$ 4.000,00). A I.A calcula a divisão ideal por categoria. Se você tem custos fixos, trave a categoria e veja a mágica acontecer!
                </p>
                <ul className="space-y-2.5 text-xs sm:text-sm font-bold text-slate-700">
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">✓</div>
                    <strong>Travas Individuais:</strong> Aluguel fixo em R$ 1.800? Trave Moradia e a I.A reequilibra o restante proporcionalmente.
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">✓</div>
                    Garante que a soma nunca ultrapasse 1 único centavo do teto estipulado
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">✓</div>
                    Sugestões baseadas nas proporções saudáveis de gestão financeira (50-30-20)
                  </li>
                </ul>
              </div>

              <div className="lg:col-span-5 bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 p-6 rounded-3xl border-2 border-emerald-600/60 text-white shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-800/40">
                  <span className="text-xs font-black text-emerald-300 uppercase">Teto Mensal Definido</span>
                  <span className="text-base font-black text-white">R$ 4.000,00</span>
                </div>
                <div className="p-3 bg-slate-800/90 rounded-2xl border border-emerald-500/30 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 font-black text-white">
                      🏠 Moradia <span className="text-[10px] bg-blue-500/30 text-blue-300 border border-blue-400/30 px-1.5 py-0.5 rounded font-mono">🔒 Travado</span>
                    </span>
                    <span className="font-black text-sky-300">R$ 1.800 (45%)</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>🍔 Alimentação</span>
                    <span className="font-black text-emerald-400">R$ 1.100 (27.5%)</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>🚗 Transporte & Lazer</span>
                    <span className="font-black text-emerald-400">R$ 1.100 (27.5%)</span>
                  </div>
                </div>
                <p className="text-[11px] font-black text-emerald-400 text-center">
                  ✨ Rebalanceamento determinístico mantendo 100% da sua meta.
                </p>
              </div>
            </div>
          </div>

          {/* Card 4: Alerta Preventivo de Limite (Tema Âmbar / Dourado Radiante) */}
          <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-amber-50/90 via-white to-yellow-50/80 border-2 border-amber-200 shadow-[0_6px_0_0_#FDE68A] transition-all">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              <div className="lg:col-span-5 order-2 lg:order-1 bg-gradient-to-br from-amber-950 via-slate-900 to-orange-950 p-6 rounded-3xl border-2 border-amber-500/60 text-white shadow-xl space-y-3">
                <div className="p-3.5 bg-slate-800/90 rounded-2xl border border-amber-400/40 space-y-2">
                  <div className="flex items-center justify-between text-xs font-black">
                    <span className="flex items-center gap-1.5 text-amber-300">
                      <AlertTriangle className="h-4 w-4 text-amber-400 animate-bounce" />
                      Gatilho de Alerta: 80%
                    </span>
                    <span className="text-slate-950 bg-amber-400 font-black px-2 py-0.5 rounded text-[10px]">Alerta Global</span>
                  </div>
                  <p className="text-xs font-bold text-slate-200 leading-snug">
                    O sistema muda de cor automaticamente quando qualquer categoria atinge seu limite de segurança, mostrando exatamente quantos reais restam.
                  </p>
                </div>
                <div className="text-center pt-1">
                  <span className="text-xs font-black text-amber-300">
                    💡 Você no controle antes da surpresa acontecer.
                  </span>
                </div>
              </div>

              <div className="lg:col-span-7 order-1 lg:order-2 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-600 text-white text-xs font-black shadow-sm">
                  <AlertTriangle className="h-4 w-4" />
                  Alerta Preventivo de Consumo
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                  Nunca mais descubra que estourou o limite no último dia do mês.
                </h3>
                <p className="text-sm sm:text-base font-bold text-slate-600 leading-relaxed">
                  Saber que gastou demais depois que a fatura fechou não serve para nada. Defina sua margem de segurança (ex: 80%) e receba avisos preventivos para agir com antecedência.
                </p>
                <ul className="space-y-2.5 text-xs sm:text-sm font-bold text-slate-700">
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">✓</div>
                    Radar visual com alertas amarelos e vermelhos antes de extrapolar o teto
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">✓</div>
                    Cálculo diário em tempo real de quanto ainda pode ser gasto com segurança
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">✓</div>
                    Tranquilidade para manter a economia mensal intacta
                  </li>
                </ul>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          4. TABELA COMPARATIVA MATADORA COM CABEÇALHO AZUL REAL SÓLIDO
          ========================================================================= */}
      <section className="space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border-2 border-emerald-300 text-xs font-black uppercase tracking-wider">
            Comparativo Transparente
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900">
            Por que o Economia Real é diferente de tudo o que você já usou?
          </h2>
          <p className="text-slate-600 text-sm sm:text-base font-bold">
            Compare lado a lado e entenda por que a nossa abordagem traz resultados reais.
          </p>
        </div>

        <div className="rounded-3xl overflow-hidden border-2 border-slate-300 shadow-2xl bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-900 text-white border-b-2 border-slate-800">
                  <th className="p-4 sm:p-5 font-black text-slate-200">Recurso / Diferencial</th>
                  <th className="p-4 sm:p-5 font-black text-yellow-300 bg-[#026CD6] border-x-2 border-blue-400 text-center text-sm sm:text-base">
                    💼 Economia Real
                  </th>
                  <th className="p-4 sm:p-5 font-extrabold text-slate-300 text-center">Planilhas Excel</th>
                  <th className="p-4 sm:p-5 font-extrabold text-slate-300 text-center">Outros Apps</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold">
                
                {/* Linha 1 */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 sm:p-5 text-slate-900 font-black">Lançamento de Gastos por Voz com I.A</td>
                  <td className="p-4 sm:p-5 text-center bg-blue-50/80 border-x-2 border-blue-200 text-emerald-700 font-black">
                    <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-5 w-5 text-emerald-600 stroke-[3]" /> Sim, em tempo real</span>
                  </td>
                  <td className="p-4 sm:p-5 text-center text-rose-500 font-extrabold">
                    <XCircle className="h-5 w-5 text-rose-400 mx-auto" />
                  </td>
                  <td className="p-4 sm:p-5 text-center text-rose-500 font-extrabold">
                    <XCircle className="h-5 w-5 text-rose-400 mx-auto" />
                  </td>
                </tr>

                {/* Linha 2 */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 sm:p-5 text-slate-900 font-black">Importação de Faturas e Extratos (OFX/CSV)</td>
                  <td className="p-4 sm:p-5 text-center bg-blue-50/80 border-x-2 border-blue-200 text-emerald-700 font-black">
                    <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-5 w-5 text-emerald-600 stroke-[3]" /> Sim, automático</span>
                  </td>
                  <td className="p-4 sm:p-5 text-center text-slate-500">Copiar e colar manual</td>
                  <td className="p-4 sm:p-5 text-center text-rose-600">Cobram plano pago</td>
                </tr>

                {/* Linha 3 */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 sm:p-5 text-slate-900 font-black">Prevenção contra Dupla Contagem de Cartão</td>
                  <td className="p-4 sm:p-5 text-center bg-blue-50/80 border-x-2 border-blue-200 text-emerald-700 font-black">
                    <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-5 w-5 text-emerald-600 stroke-[3]" /> Sim (Passivo Real)</span>
                  </td>
                  <td className="p-4 sm:p-5 text-center text-slate-500">Fórmulas complexas</td>
                  <td className="p-4 sm:p-5 text-center text-rose-500">
                    <XCircle className="h-5 w-5 text-rose-400 mx-auto" />
                  </td>
                </tr>

                {/* Linha 4 */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 sm:p-5 text-slate-900 font-black">Sugestão de Percentuais & Metas com I.A</td>
                  <td className="p-4 sm:p-5 text-center bg-blue-50/80 border-x-2 border-blue-200 text-emerald-700 font-black">
                    <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-5 w-5 text-emerald-600 stroke-[3]" /> Com travas individuais</span>
                  </td>
                  <td className="p-4 sm:p-5 text-center text-rose-500">
                    <XCircle className="h-5 w-5 text-rose-400 mx-auto" />
                  </td>
                  <td className="p-4 sm:p-5 text-center text-slate-500">Apenas valores fixos</td>
                </tr>

                {/* Linha 5 */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 sm:p-5 text-slate-900 font-black">Alerta Preventivo de Limite (Antes de Estourar)</td>
                  <td className="p-4 sm:p-5 text-center bg-blue-50/80 border-x-2 border-blue-200 text-emerald-700 font-black">
                    <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-5 w-5 text-emerald-600 stroke-[3]" /> Sim, personalizável</span>
                  </td>
                  <td className="p-4 sm:p-5 text-center text-rose-500">
                    <XCircle className="h-5 w-5 text-rose-400 mx-auto" />
                  </td>
                  <td className="p-4 sm:p-5 text-center text-slate-500">Apenas aviso tardio</td>
                </tr>

                {/* Linha 6 */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 sm:p-5 text-slate-900 font-black">Precisão Monetária ao Centavo</td>
                  <td className="p-4 sm:p-5 text-center bg-blue-50/80 border-x-2 border-blue-200 text-emerald-700 font-black">
                    <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-5 w-5 text-emerald-600 stroke-[3]" /> 100% Determinística</span>
                  </td>
                  <td className="p-4 sm:p-5 text-center text-emerald-600 font-black">Sim</td>
                  <td className="p-4 sm:p-5 text-center text-rose-500">Arredonda errado</td>
                </tr>

                {/* Linha 7 */}
                <tr className="bg-slate-50/90">
                  <td className="p-4 sm:p-5 text-slate-900 font-black">Preço / Mensalidade</td>
                  <td className="p-4 sm:p-5 text-center bg-blue-100 border-x-2 border-blue-300 text-[#026CD6] font-black text-base">
                    100% Gratuito
                  </td>
                  <td className="p-4 sm:p-5 text-center text-slate-600">Grátis (muito trabalho)</td>
                  <td className="p-4 sm:p-5 text-center text-rose-600 font-black">R$ 15 a R$ 35/mês</td>
                </tr>

              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. COMO FUNCIONA: 3 PASSOS COM CORES DISTINTAS
          ========================================================================= */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-100 text-indigo-800 border-2 border-indigo-300 text-xs font-black uppercase tracking-wider">
            Simplicidade Total
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900">
            Comece em menos de 1 minuto
          </h2>
          <p className="text-slate-600 text-sm sm:text-base font-bold">
            Sem burocracias. Você cria sua conta e já começa a economizar hoje.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          
          {/* Passo 1 (Azul Real) */}
          <div className="rounded-3xl p-6 space-y-3.5 text-center sm:text-left bg-gradient-to-b from-blue-50 to-white border-2 border-blue-200 shadow-[0_6px_0_0_#93C5FD]">
            <div className="h-12 w-12 rounded-2xl bg-[#026CD6] border-b-4 border-blue-800 text-white font-black text-xl flex items-center justify-center shadow-md mx-auto sm:mx-0">
              1
            </div>
            <h3 className="text-lg font-black text-slate-900">Crie sua Conta Grátis</h3>
            <p className="text-xs sm:text-sm font-bold text-slate-600 leading-relaxed">
              Informe apenas seu nome e e-mail. Não pedimos cartão de crédito, CPF ou senhas bancárias.
            </p>
          </div>

          {/* Passo 2 (Índigo Tecnológico) */}
          <div className="rounded-3xl p-6 space-y-3.5 text-center sm:text-left bg-gradient-to-b from-indigo-50 to-white border-2 border-indigo-200 shadow-[0_6px_0_0_#C7D2FE]">
            <div className="h-12 w-12 rounded-2xl bg-indigo-600 border-b-4 border-indigo-800 text-white font-black text-xl flex items-center justify-center shadow-md mx-auto sm:mx-0">
              2
            </div>
            <h3 className="text-lg font-black text-slate-900">Lance com Voz ou Fatura</h3>
            <p className="text-xs sm:text-sm font-bold text-slate-600 leading-relaxed">
              Fale o que gastou no microfone em segundos ou arraste a fatura do seu banco. A I.A categoriza tudo.
            </p>
          </div>

          {/* Passo 3 (Verde Esmeralda) */}
          <div className="rounded-3xl p-6 space-y-3.5 text-center sm:text-left bg-gradient-to-b from-emerald-50 to-white border-2 border-emerald-200 shadow-[0_6px_0_0_#A7F3D0]">
            <div className="h-12 w-12 rounded-2xl bg-emerald-600 border-b-4 border-emerald-800 text-white font-black text-xl flex items-center justify-center shadow-md mx-auto sm:mx-0">
              3
            </div>
            <h3 className="text-lg font-black text-slate-900">Acompanhe e Economize</h3>
            <p className="text-xs sm:text-sm font-bold text-slate-600 leading-relaxed">
              Receba avisos antes de ultrapassar suas metas e tome decisões inteligentes para sobrar dinheiro no bolso.
            </p>
          </div>

        </div>
      </section>

      {/* =========================================================================
          6. PERGUNTAS FREQUENTES (FAQ COM BORDAS COLORIDAS)
          ========================================================================= */}
      <section className="space-y-8 max-w-3xl mx-auto">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-200 text-slate-800 border-2 border-slate-300 text-xs font-black uppercase tracking-wider">
            Tire Suas Dúvidas
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900">
            Perguntas Frequentes
          </h2>
          <p className="text-slate-600 text-sm font-bold">
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
            <div key={idx} className="rounded-2xl overflow-hidden border-2 border-slate-200/90 bg-white shadow-sm hover:border-blue-300 transition-all border-l-4 border-l-[#026CD6]">
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-5 text-left font-black text-slate-900 flex items-center justify-between gap-4 hover:bg-blue-50/30 transition-colors"
              >
                <span className="text-sm sm:text-base">{faq.question}</span>
                <ChevronDown
                  className={`h-5 w-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                    openFaq === idx ? 'rotate-180 text-[#026CD6]' : ''
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 pt-1 text-xs sm:text-sm font-bold text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          7. CTA FINAL DE ALTA CONVERSÃO COM DEGRADÊ AZUL REAL VIBRANTE
          ========================================================================= */}
      <section className="rounded-3xl p-8 sm:p-14 text-center relative overflow-hidden space-y-6 bg-gradient-to-br from-[#026CD6] via-[#0A7DEF] to-[#4F46E5] text-white shadow-2xl border-4 border-blue-300/40 shadow-blue-600/30">
        
        {/* Glows internos decorativos */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-2xl mx-auto space-y-5 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-yellow-300 text-xs font-black shadow-sm uppercase tracking-wider mx-auto">
            <Sparkles className="h-4 w-4" />
            Comece a Economizar Hoje
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Pronto para ter o controle do seu dinheiro no piloto automático?
          </h2>

          <p className="text-blue-100 text-sm sm:text-base font-bold leading-relaxed">
            Junte-se a quem já parou de perder horas com planilhas e começou a poupar de verdade com inteligência artificial.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onOpenRegister}
              className="btn-duo btn-duo-green w-full sm:w-auto text-base sm:text-lg px-8 py-4 flex items-center justify-center gap-3 shadow-2xl shadow-emerald-950/40 border-b-4 border-emerald-800 hover:scale-[1.02] transition-transform"
            >
              <Zap className="h-5 w-5 fill-white stroke-[2.5]" />
              Criar Minha Conta Grátis
              <ArrowRight className="h-5 w-5 stroke-[3]" />
            </button>
            <button
              onClick={onOpenLogin}
              className="btn-duo btn-duo-white w-full sm:w-auto text-base px-6 py-4 flex items-center justify-center gap-2 text-slate-800"
            >
              Já tenho conta cadastrada
            </button>
          </div>

          <p className="text-xs font-bold text-blue-200/90 pt-2">
            ⚡ Leva menos de 1 minuto • Sem cartão de crédito • Acesso imediato
          </p>
        </div>
      </section>

    </div>
  );
};
