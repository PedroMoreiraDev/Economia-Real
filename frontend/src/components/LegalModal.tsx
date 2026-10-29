import React, { useState } from 'react';
import {
  ShieldCheck,
  FileText,
  Lock,
  X,
  CheckCircle2,
  Mail,
  Server,
  Sparkles
} from 'lucide-react';

export type LegalTab = 'privacy' | 'terms' | 'security';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalTab;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'privacy'
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-3xl bg-white border-2 border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header do Modal com Identidade Visual */}
        <div className="p-5 sm:p-6 border-b-2 border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-blue-100 text-[#026CD6] border-2 border-blue-200 flex items-center justify-center shrink-0 shadow-sm">
              <ShieldCheck className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  Transparência, Segurança & Privacidade
                </h2>
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                  LGPD Ativa
                </span>
              </div>
              <p className="text-xs font-bold text-slate-500">
                Economia Real • Governança de Dados Pessoais e Financeiros
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            title="Fechar"
          >
            <X className="h-5 w-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Barra de Abas */}
        <div className="flex border-b-2 border-slate-100 bg-white px-5 sm:px-6 pt-3 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-black border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'privacy'
                ? 'border-[#026CD6] text-[#026CD6]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="h-4 w-4" />
            Política de Privacidade (LGPD)
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-black border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'terms'
                ? 'border-[#026CD6] text-[#026CD6]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="h-4 w-4" />
            Termos de Uso
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-black border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'security'
                ? 'border-[#026CD6] text-[#026CD6]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Server className="h-4 w-4" />
            Segurança & I.A Determinística
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed font-medium">
          {/* =========================================================================
              ABA 1: POLÍTICA DE PRIVACIDADE (LGPD)
              ========================================================================= */}
          {activeTab === 'privacy' && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-900 space-y-1">
                <div className="flex items-center gap-2 font-black text-sm text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
                  Seus Dados Financeiros Pertencem Estritamente a Você
                </div>
                <p className="text-xs font-bold leading-normal text-emerald-700">
                  O Economia Real segue com rigor absoluto as diretrizes da Lei Geral de Proteção de Dados (Lei 13.709/2018 - LGPD). Nunca vendemos, alugamos ou compartilhamos seus registros financeiros com anunciantes ou birôs de crédito.
                </p>
              </div>

              <section className="space-y-2">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-100 text-[#026CD6] flex items-center justify-center text-xs font-black">1</span>
                  Dados que Coletamos
                </h3>
                <p>
                  Para funcionamento do serviço, coletamos exclusivamente os dados necessários para identificação e prestação da plataforma:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li><strong>Dados Cadastrais:</strong> Nome completo e endereço de e-mail (usado unicamente para login, verificação com token seguro e recuperação de acesso).</li>
                  <li><strong>Dados Financeiros Inseridos por Você:</strong> Descrições de despesas/receitas, valores monetários, datas e categorias (lançados por comando de voz ou via upload de arquivo OFX/CSV).</li>
                  <li><strong>O que JAMAIS coletamos:</strong> Números completos de cartão de crédito, códigos de segurança (CVV), senhas de contas bancárias ou tokens Open Banking.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-100 text-[#026CD6] flex items-center justify-center text-xs font-black">2</span>
                  Isolamento Rigoroso de Inquilino (Anti-IDOR)
                </h3>
                <p>
                  Toda consulta, inserção e agregação em nossa arquitetura de backend é estritamente vinculada ao identificador criptográfico do usuário autenticado via token JWT. Nenhum usuário tem acesso ou visibilidade às finanças de terceiros.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-100 text-[#026CD6] flex items-center justify-center text-xs font-black">3</span>
                  Direitos do Titular (LGPD Art. 18)
                </h3>
                <p>
                  Você pode a qualquer momento exercer plenamente os seus direitos:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-slate-100 border border-slate-200">
                    <strong className="block text-slate-900 font-bold mb-0.5">Portabilidade de Dados</strong>
                    Exporte todas as suas movimentações em formato aberto CSV a qualquer instante com 1 clique.
                  </div>
                  <div className="p-3 rounded-xl bg-slate-100 border border-slate-200">
                    <strong className="block text-slate-900 font-bold mb-0.5">Direito ao Esquecimento</strong>
                    Você pode solicitar a exclusão integral e irreversível da sua conta e de todo o histórico associado.
                  </div>
                </div>
              </section>

              <div className="pt-2 text-xs text-slate-500 border-t border-slate-200">
                Dúvidas sobre privacidade e requisições LGPD? Contate nosso Encarregado de Proteção de Dados (DPO) através do e-mail oficial: <a href="mailto:contato@economia-real.ia.br" className="text-[#026CD6] font-bold underline">contato@economia-real.ia.br</a>.
              </div>
            </div>
          )}

          {/* =========================================================================
              ABA 2: TERMOS DE USO
              ========================================================================= */}
          {activeTab === 'terms' && (
            <div className="space-y-5 animate-fade-in">
              <section className="space-y-2">
                <h3 className="text-base font-black text-slate-900">
                  1. Aceitação e Natureza da Plataforma
                </h3>
                <p>
                  O <strong>Economia Real</strong> é uma ferramenta de gestão, organização e planejamento financeiro pessoal com suporte de Inteligência Artificial. Ao criar uma conta ou utilizar a aplicação, você concorda com estes Termos de Uso.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-black text-slate-900">
                  2. Responsabilidade sobre os Lançamentos
                </h3>
                <p>
                  A plataforma atua como assistente e organizador dos registros inseridos pelo próprio usuário (seja por voz, digitação manual ou upload de extrato/fatura). O usuário é responsável pela exatidão das informações fornecidas e conferência dos limites recomendados.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-black text-slate-900">
                  3. Disponibilidade e Modelo Gratuito
                </h3>
                <p>
                  As funcionalidades essenciais — lançamento de despesas com I.A, importação de extratos OFX/CSV, acompanhamento de metas com alertas preventivos e relatórios de fluxo de caixa — são fornecidas de forma gratuita para apoiar a saúde financeira dos usuários.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-black text-slate-900">
                  4. Não Recomendação de Investimentos Regulados
                </h3>
                <p>
                  O Economia Real não atua como instituição financeira, corretora de valores ou consultoria de investimentos credenciada na CVM/Banco Central. Os alertas e sugestões gerados pela plataforma possuem caráter exclusivamente informativo e de organização orçamentária pessoal.
                </p>
              </section>
            </div>
          )}

          {/* =========================================================================
              ABA 3: SEGURANÇA & IA DETERMINÍSTICA
              ========================================================================= */}
          {activeTab === 'security' && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 rounded-2xl bg-blue-50 border-2 border-blue-200 text-blue-950 space-y-1">
                <div className="flex items-center gap-2 font-black text-sm text-[#026CD6]">
                  <Sparkles className="h-4 w-4" />
                  Arquitetura Híbrida: I.A Interpretativa + Backend Determinístico
                </div>
                <p className="text-xs font-bold leading-normal text-blue-800">
                  Nossos cálculos matemáticos de saldos, faturas e limites nunca dependem de probabilidades de Inteligência Artificial. A I.A é usada estritamente para transcrever comandos e categorizar estabelecimentos; todos os totais são processados no backend com precisão matemática decimal exata (<code>BigDecimal</code>).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-wider">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Zero Conexão de Senha Bancária
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    Você nunca digita sua senha de banco no aplicativo. As faturas são importadas via arquivos padrão (OFX/CSV) gerados pelo seu próprio banco de confiança.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-wider">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Prevenção de Dupla Contagem
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    Ao pagar a fatura do cartão de crédito, o sistema reconhece a quitação do passivo sem somar as despesas novamente no gráfico mensal.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-wider">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Criptografia em Repouso e Trânsito
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    Todas as comunicações utilizam túnel HTTPS/TLS moderno com cabeçalhos HSTS, X-Content-Type-Options e proteção rigorosa contra ataques de injeção.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-wider">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Auditoria e Telemetria Anônima
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    Nenhum valor monetário ou descrição de gasto pessoal é transmitido a serviços de telemetria externa, preservando 100% da sua privacidade.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="p-4 sm:p-5 border-t-2 border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-[#026CD6]" />
            Suporte: <span className="font-black text-slate-700">contato@economia-real.ia.br</span>
          </p>

          <button
            onClick={onClose}
            className="btn-duo btn-duo-blue text-xs font-black px-6 py-2.5 rounded-xl shadow-md"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
