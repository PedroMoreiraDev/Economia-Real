import React from 'react';
import { Sparkles, Plus, Mic, UploadCloud, Download, ShieldCheck } from 'lucide-react';

export interface DashboardHeroBannerProps {
  firstName: string;
  onOpenTransactionModal: () => void;
  onOpenAiModal: () => void;
  onOpenImportModal: () => void;
  onExportCsv: () => void;
  hasTransactions: boolean;
  exportingCsv: boolean;
}

export const DashboardHeroBanner: React.FC<DashboardHeroBannerProps> = ({
  firstName,
  onOpenTransactionModal,
  onOpenAiModal,
  onOpenImportModal,
  onExportCsv,
  hasTransactions,
  exportingCsv,
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#102D25] via-[#153A30] to-[#1C4939] text-[#E8E4D9] p-4 sm:p-6 lg:p-8 border border-[#275E4B] shadow-duo-lg">
      {/* Textura arquitetônica sutil */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #E8E4D9 1px, transparent 1px), linear-gradient(to bottom, #E8E4D9 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#D4A94F]/15 blur-3xl" />

      <div className="max-w-2xl lg:max-w-3xl space-y-3.5 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0A1D17]/65 border border-[#D4A94F]/40 text-[#D4A94F] text-xs font-bold shadow-xs uppercase tracking-wider">
          <ShieldCheck className="h-3.5 w-3.5 text-[#D4A94F]" />
          Painel Executivo de Gestão Financeira
        </div>

        <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#E8E4D9] leading-tight">
          Olá{firstName ? `, ${firstName}` : ''}.{' '}
          <span className="text-[#D4A94F] underline decoration-[#D4A94F]/50 decoration-2 underline-offset-4">
            Visão consolidada do seu patrimônio.
          </span>
        </h1>

        <p className="text-[#E8E4D9]/80 text-xs sm:text-base font-medium leading-relaxed max-w-2xl">
          Monitore seu fluxo de caixa, audite faturas e acompanhe suas metas financeiras com precisão contábil e Inteligência Artificial.
        </p>

        {/* Ações Rápidas em Destaque (Grid 2x2 no mobile, Flex no desktop) */}
        <div className="pt-2 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3">
          <button
            id="tour-add-btn"
            onClick={onOpenTransactionModal}
            className="btn-duo bg-[#1C4939] hover:bg-[#0D241D] text-[#E8E4D9] border border-[#D4A94F]/40 text-xs sm:text-sm px-3 sm:px-4 py-2.5 flex items-center justify-center gap-1.5 sm:gap-2 w-full sm:w-auto shadow-md"
          >
            <Plus className="h-4 w-4 stroke-[2.5] text-[#D4A94F] shrink-0" />
            <span className="truncate">Novo Lançamento</span>
          </button>

          <button
            id="tour-ai-btn"
            onClick={onOpenAiModal}
            className="btn-duo btn-duo-purple text-xs sm:text-sm px-3 sm:px-4 py-2.5 flex items-center justify-center gap-1.5 sm:gap-2 w-full sm:w-auto"
          >
            <Mic className="h-4 w-4 stroke-[2.3] shrink-0" />
            <span className="truncate">Falar com IA</span>
          </button>

          <button
            id="tour-import-btn"
            onClick={onOpenImportModal}
            className="btn-duo bg-[#E8E4D9] hover:bg-[#FAF8F4] text-[#102D25] border border-[#D5CFC0] text-xs sm:text-sm px-3 sm:px-4 py-2.5 flex items-center justify-center gap-1.5 sm:gap-2 w-full sm:w-auto font-extrabold"
          >
            <UploadCloud className="h-4 w-4 text-[#1C4939] shrink-0" />
            <span className="truncate">Importar Extrato</span>
          </button>

          <button
            onClick={onExportCsv}
            disabled={!hasTransactions || exportingCsv}
            className="btn-duo bg-[#0A1D17]/60 hover:bg-[#0A1D17]/90 text-[#E8E4D9] border border-[#E8E4D9]/25 text-xs sm:text-sm px-3 sm:px-4 py-2.5 flex items-center justify-center gap-1.5 sm:gap-2 w-full sm:w-auto disabled:opacity-40"
            title="Exportar para Excel em CSV formatado"
          >
            <Download className={`h-4 w-4 text-[#D4A94F] shrink-0 ${exportingCsv ? 'animate-bounce' : ''}`} />
            <span className="truncate">{exportingCsv ? 'Gerando...' : 'Exportar Planilha'}</span>
          </button>
        </div>
      </div>

      {/* Indicador Flutuante de IA e Projeção de Economia */}
      <div className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none select-none items-center z-10">
        <div className="bg-[#0A1D17]/80 backdrop-blur-md rounded-2xl border border-[#D4A94F]/40 p-4 shadow-2xl space-y-2.5 w-64">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#E8E4D9]/80 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#D4A94F] animate-pulse" />
              Radar Financeiro IA
            </span>
            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-[#1C4939] text-[#D4A94F] border border-[#D4A94F]/30">
              Ativo
            </span>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[#9AB3A8]">Motor Determinístico</span>
            <p className="text-lg font-extrabold text-[#E8E4D9] tracking-tight">Precisão ao Centavo</p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#D4A94F] bg-[#102D25] px-2.5 py-1.5 rounded-xl border border-[#285E4B]">
            <Sparkles className="w-3.5 h-3.5 text-[#D4A94F] shrink-0" />
            <span>Auditoria contínua ativada</span>
          </div>
        </div>
      </div>
    </div>
  );
};
