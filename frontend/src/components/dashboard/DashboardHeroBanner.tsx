import React from 'react';
import { Sparkles, Plus, Mic, UploadCloud, Download } from 'lucide-react';

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
    <div className="card-real-blue p-3.5 sm:p-6 lg:p-8 relative overflow-hidden">
      <div className="max-w-2xl lg:max-w-3xl space-y-3 relative z-10">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/90 dark:bg-slate-800/90 border-2 border-blue-200 dark:border-blue-700 text-[#026CD6] dark:text-sky-300 text-xs font-black shadow-sm uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5 text-blue-500 fill-blue-400" />
          Painel de Controle Financeiro
        </div>

        <h1 className="text-lg sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
          Olá{firstName ? `, ${firstName}` : ''}!{' '}
          <span className="text-[#026CD6] dark:text-sky-400 underline decoration-blue-300 dark:decoration-blue-500 decoration-4">
            Pronto para organizar suas contas?
          </span>{' '}
          🎩✨
        </h1>

        <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-base font-bold leading-relaxed">
          Monitore seu fluxo de caixa, planeje seus lançamentos e acompanhe suas metas com precisão e suporte de IA.
        </p>

        {/* Ações Rápidas em Destaque (Grid 2x2 no mobile, Flex no desktop) */}
        <div className="pt-2 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3">
          <button
            id="tour-add-btn"
            onClick={onOpenTransactionModal}
            className="btn-duo btn-duo-green text-xs sm:text-sm px-2.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-center gap-1.5 sm:gap-2 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 stroke-[3] shrink-0" />
            <span className="truncate">Novo Lançamento</span>
          </button>

          <button
            id="tour-ai-btn"
            onClick={onOpenAiModal}
            className="btn-duo btn-duo-purple text-xs sm:text-sm px-2.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-center gap-1.5 sm:gap-2 w-full sm:w-auto"
          >
            <Mic className="h-4 w-4 shrink-0" />
            <span className="truncate">Falar com IA</span>
          </button>

          <button
            id="tour-import-btn"
            onClick={onOpenImportModal}
            className="btn-duo btn-duo-white text-xs sm:text-sm px-2.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-center gap-1.5 sm:gap-2 w-full sm:w-auto"
          >
            <UploadCloud className="h-4 w-4 text-[#0284C7] shrink-0" />
            <span className="truncate">Importar Extrato</span>
          </button>

          <button
            onClick={onExportCsv}
            disabled={!hasTransactions || exportingCsv}
            className="btn-duo btn-duo-white text-xs sm:text-sm px-2.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-center gap-1.5 sm:gap-2 w-full sm:w-auto disabled:opacity-50"
            title="Exportar para Excel em CSV formatado"
          >
            <Download className={`h-4 w-4 text-blue-600 shrink-0 ${exportingCsv ? 'animate-bounce' : ''}`} />
            <span className="truncate">{exportingCsv ? 'Gerando...' : 'Exportar Planilha'}</span>
          </button>
        </div>
      </div>

      {/* Indicador Flutuante de IA e Projeção de Economia */}
      <div className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none select-none items-center">
        <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-3xl border-2 border-blue-200/90 dark:border-blue-700 p-4 shadow-xl shadow-blue-900/10 space-y-2.5 w-64 rotate-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Radar de IA Ativo
            </span>
            <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              +18.4%
            </span>
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400">Economia Projetada</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">R$ 1.420,00</p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-800 dark:text-sky-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1.5 rounded-xl border border-blue-100 dark:border-blue-800">
            <Sparkles className="w-3.5 h-3.5 text-[#026CD6] dark:text-sky-400 shrink-0" />
            <span>Otimização contínua ativada</span>
          </div>
        </div>
      </div>
    </div>
  );
};
