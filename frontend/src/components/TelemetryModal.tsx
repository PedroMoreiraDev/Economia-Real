import React, { useState, useEffect } from 'react';
import {
  X,
  Activity,
  CheckCircle2,
  Copy,
  Share2,
  TrendingUp,
  Clock,
  Search,
  BarChart3,
  Layers
} from 'lucide-react';
import { getTelemetryDiagnostics } from '../services/telemetryService';
import { useAuth } from '../context/AuthContext';

interface TelemetryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TelemetryModal: React.FC<TelemetryModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'metrics' | 'utm_generator' | 'events'>('metrics');

  // Estado para o gerador de links com UTM
  const [utmSource, setUtmSource] = useState('instagram');
  const [utmMedium, setUtmMedium] = useState('bio');
  const [utmCampaign, setUtmCampaign] = useState('lancamento');

  // Diagnóstico em tempo real
  const [diagnostics, setDiagnostics] = useState(() => getTelemetryDiagnostics(user?.id));

  useEffect(() => {
    if (isOpen) {
      setDiagnostics(getTelemetryDiagnostics(user?.id));
    }
  }, [isOpen, user?.id]);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://economiareal.com.br';
  const generatedUrl = `${currentOrigin}/?utm_source=${encodeURIComponent(utmSource.trim().toLowerCase())}&utm_medium=${encodeURIComponent(utmMedium.trim().toLowerCase())}&utm_campaign=${encodeURIComponent(utmCampaign.trim().toLowerCase())}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border-2 border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp">
        
        {/* Topo do Modal */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <Activity className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Central de Métricas & Telemetria
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Ao Vivo
                </span>
              </div>
              <p className="text-xs text-slate-400 font-bold">
                Acompanhamento de visitas, ativação, retenção D7 e canais de aquisição
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Abas de Navegação */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 sm:px-6 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-4 py-2.5 text-xs font-black rounded-t-xl transition-colors border-t-2 border-x-2 -mb-[2px] flex items-center gap-1.5 ${
              activeTab === 'metrics'
                ? 'bg-white text-[#026CD6] border-slate-200 border-b-transparent shadow-xs'
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 stroke-[2.5]" />
            Métricas Principais
          </button>
          <button
            onClick={() => setActiveTab('utm_generator')}
            className={`px-4 py-2.5 text-xs font-black rounded-t-xl transition-colors border-t-2 border-x-2 -mb-[2px] flex items-center gap-1.5 ${
              activeTab === 'utm_generator'
                ? 'bg-white text-[#026CD6] border-slate-200 border-b-transparent shadow-xs'
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 stroke-[2.5]" />
            Gerador de Links UTM
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2.5 text-xs font-black rounded-t-xl transition-colors border-t-2 border-x-2 -mb-[2px] flex items-center gap-1.5 ${
              activeTab === 'events'
                ? 'bg-white text-[#026CD6] border-slate-200 border-b-transparent shadow-xs'
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
            Eventos Recentes ({diagnostics.recentEvents.length})
          </button>
        </div>

        {/* Conteúdo das Abas */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'metrics' && (
            <div className="space-y-6">
              
              {/* 1. Status das Ferramentas Externas (GA4 & GSC) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* Card Google Analytics 4 */}
                <div className={`p-4 rounded-2xl border-2 transition-all ${
                  diagnostics.isGaConfigured
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                    : 'bg-amber-50/80 border-amber-200 text-amber-950'
                }`}>
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-[#026CD6]" />
                      Google Analytics 4
                    </span>
                    {diagnostics.isGaConfigured ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-200 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" /> Conectado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-800">
                        Pendente
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-700 leading-snug">
                    {diagnostics.isGaConfigured ? (
                      <>ID ativo: <code className="bg-white/80 px-1.5 py-0.5 rounded font-mono font-bold text-emerald-700">{diagnostics.gaId}</code></>
                    ) : (
                      'Para conectar, defina a variável VITE_GA_MEASUREMENT_ID no arquivo .env (ex: G-XXXXXXXXXX).'
                    )}
                  </p>
                </div>

                {/* Card Google Search Console */}
                <div className={`p-4 rounded-2xl border-2 transition-all ${
                  diagnostics.isGscConfigured
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                    : 'bg-blue-50/80 border-blue-200 text-blue-950'
                }`}>
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                      <Search className="w-4 h-4 text-[#026CD6]" />
                      Google Search Console
                    </span>
                    {diagnostics.isGscConfigured ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-200 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" /> Verificado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-200 text-blue-800">
                        Pronto p/ Validação
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-700 leading-snug">
                    {diagnostics.isGscConfigured ? (
                      'Meta tag de verificação injetada automaticamente no cabeçalho.'
                    ) : (
                      'Para validar seu domínio no Google, informe seu código em VITE_GSC_VERIFICATION_CODE no .env.'
                    )}
                  </p>
                </div>

              </div>

              {/* 2. As 5 Métricas do Funil */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-[#026CD6]" />
                  Quadro de Controle do Funil Semanal
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Origem e Canal Detectado */}
                  <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 shadow-xs space-y-1.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                      Canal de Aquisição Atual
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-[#026CD6]">
                        {diagnostics.attribution.detected_channel}
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-slate-500 space-y-0.5 pt-1 border-t border-slate-100">
                      <p>Origem (UTM Source): <span className="text-slate-800 font-extrabold">{diagnostics.attribution.utm_source || 'N/A'}</span></p>
                      <p>Campanha: <span className="text-slate-800 font-extrabold">{diagnostics.attribution.utm_campaign || 'N/A'}</span></p>
                      {diagnostics.attribution.referrer && (
                        <p className="truncate">Referrer: <span className="text-slate-800 font-extrabold">{diagnostics.attribution.referrer}</span></p>
                      )}
                    </div>
                  </div>

                  {/* Status de Ativação do Usuário */}
                  <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 shadow-xs space-y-1.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                      Status de Ativação (Usuário Ativado)
                    </span>
                    {user ? (
                      diagnostics.activation.isActivated ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[3]" />
                            Usuário Ativado com Sucesso! 🎉
                          </span>
                          <p className="text-[11px] text-slate-500 font-bold pt-1">
                            Gatilho: <span className="text-slate-800 font-extrabold">{diagnostics.activation.trigger || 'Lançamento/Importação'}</span>
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black">
                            <Clock className="w-4 h-4 text-amber-600" />
                            Pendente de Primeiro Lançamento
                          </span>
                          <p className="text-[11px] text-slate-500 font-bold pt-1">
                            Cadastre uma despesa ou importe uma fatura para se qualificar.
                          </p>
                        </div>
                      )
                    ) : (
                      <p className="text-xs font-bold text-slate-500">
                        Faça login para checar o status de ativação da sua conta.
                      </p>
                    )}
                  </div>

                  {/* Retenção em 7 Dias */}
                  <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 shadow-xs space-y-1.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                      Retenção D7 (Retorno após 7 Dias)
                    </span>
                    {user ? (
                      <div className="space-y-1">
                        <p className="text-sm font-black text-slate-800">
                          {diagnostics.daysSinceSignup !== null
                            ? `${diagnostics.daysSinceSignup} dia(s) desde o cadastro`
                            : 'Novo usuário hoje'}
                        </p>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          diagnostics.hasRetention7d
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {diagnostics.hasRetention7d ? '✓ Meta D7 Atingida e Registrada' : 'Aguardando completar 7 dias'}
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-slate-500">
                        Disponível após efetuar login.
                      </p>
                    )}
                  </div>

                  {/* Visitas Qualificadas */}
                  <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 shadow-xs space-y-1.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                      Visita Qualificada (Regra)
                    </span>
                    <p className="text-xs font-bold text-slate-600 leading-relaxed">
                      Visitante que permanece <span className="font-black text-[#026CD6]">mais de 15 segundos</span> no site ou rola <span className="font-black text-[#026CD6]">mais de 40% da Landing Page</span>.
                    </p>
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block border border-emerald-200">
                      Disparo automático ativo
                    </span>
                  </div>

                </div>
              </div>

              {/* Dica de Segurança e LGPD */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Privacidade Absoluta (LGPD):</strong> Nenhum valor monetário de saldo, descrição de compra pessoal ou dado bancário é enviado ao Google Analytics. Apenas eventos estruturais e canais de tráfego são contabilizados.
                </p>
              </div>

            </div>
          )}

          {activeTab === 'utm_generator' && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-800">
                  Criador de Links de Divulgação (Parâmetros UTM)
                </h4>
                <p className="text-xs font-bold text-slate-500 leading-relaxed">
                  Use links com parâmetros UTM em suas postagens e bios para que o Google Analytics e o painel saibam exatamente de qual rede social cada visitante veio.
                </p>
              </div>

              {/* Botões rápidos de Rede */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                  Escolha o Canal / Rede Social
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { source: 'instagram', medium: 'bio', label: 'Instagram (Bio)' },
                    { source: 'instagram', medium: 'reels', label: 'Instagram (Reels)' },
                    { source: 'tiktok', medium: 'video', label: 'TikTok' },
                    { source: 'whatsapp', medium: 'grupo', label: 'WhatsApp' },
                    { source: 'reddit', medium: 'post', label: 'Reddit' },
                    { source: 'youtube', medium: 'shorts', label: 'YouTube Shorts' },
                    { source: 'linkedin', medium: 'post', label: 'LinkedIn' },
                    { source: 'twitter', medium: 'tweet', label: 'Twitter / X' },
                  ].map((preset) => (
                    <button
                      key={`${preset.source}-${preset.medium}`}
                      type="button"
                      onClick={() => {
                        setUtmSource(preset.source);
                        setUtmMedium(preset.medium);
                      }}
                      className={`px-3 py-2 text-xs font-bold rounded-xl border-2 transition-all text-left ${
                        utmSource === preset.source && utmMedium === preset.medium
                          ? 'bg-blue-50 border-[#026CD6] text-[#026CD6] shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Formulário de Campos */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    utm_source (Origem)
                  </label>
                  <input
                    type="text"
                    value={utmSource}
                    onChange={(e) => setUtmSource(e.target.value)}
                    placeholder="ex: instagram"
                    className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#026CD6]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    utm_medium (Mídia)
                  </label>
                  <input
                    type="text"
                    value={utmMedium}
                    onChange={(e) => setUtmMedium(e.target.value)}
                    placeholder="ex: bio, reels, cpc"
                    className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#026CD6]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    utm_campaign (Campanha)
                  </label>
                  <input
                    type="text"
                    value={utmCampaign}
                    onChange={(e) => setUtmCampaign(e.target.value)}
                    placeholder="ex: lancamento"
                    className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#026CD6]"
                  />
                </div>
              </div>

              {/* Resultado e Botão de Copiar */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                  Link Pronto para Compartilhar
                </span>
                <div className="p-2.5 rounded-xl bg-slate-800 font-mono text-xs text-blue-300 break-all select-all border border-slate-700">
                  {generatedUrl}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-bold">
                    Ao clicar nesse link, o visitante será atribuído a: <strong className="text-white">{utmSource}</strong>
                  </span>
                  <button
                    onClick={handleCopyLink}
                    className={`btn-duo text-xs px-4 py-2 flex items-center gap-1.5 ${
                      copiedLink ? 'btn-duo-green' : 'btn-duo-blue'
                    }`}
                  >
                    {copiedLink ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 stroke-[2.5]" />
                        <span>Copiar Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'events' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-800">
                    Registro de Eventos Disparados em Tempo Real
                  </h4>
                  <p className="text-xs font-bold text-slate-500">
                    Estes são os eventos capturados no seu navegador e enviados ao GA4
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDiagnostics(getTelemetryDiagnostics(user?.id))}
                  className="btn-duo btn-duo-white text-xs px-3 py-1.5"
                >
                  Atualizar Lista
                </button>
              </div>

              {diagnostics.recentEvents.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-slate-200">
                  <p className="text-xs font-bold text-slate-500">Nenhum evento registrado nesta sessão ainda.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {diagnostics.recentEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-[#026CD6]">{evt.name}</span>
                          <span className="text-[10px] text-slate-400 font-sans">
                            {new Date(evt.timestamp).toLocaleTimeString('pt-BR')}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 font-sans truncate max-w-md">
                          {Object.entries(evt.params)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(' • ')}
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800 shrink-0 font-sans">
                        {evt.params.channel || 'Geral'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-500">
          <p>
            Economia Real Telemetry Engine • Pronto para Produção
          </p>
          <button
            onClick={onClose}
            className="btn-duo btn-duo-white text-xs px-4 py-2"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
