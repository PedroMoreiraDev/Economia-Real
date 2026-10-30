import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

export interface MonthSelectorProps {
  selectedMonth: string;
  isCurrentMonth: boolean;
  formatMonthLabel: (month: string) => string;
  getCurrentMonthStr: () => string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onCurrentMonth: () => void;
  onSelectMonthInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  selectedMonth,
  isCurrentMonth,
  formatMonthLabel,
  getCurrentMonthStr,
  onPrevMonth,
  onNextMonth,
  onCurrentMonth,
  onSelectMonthInput,
}) => {
  return (
    <div className="card-duo p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 bg-gradient-to-r from-white via-blue-50/40 to-white dark:from-slate-900 dark:via-blue-950/20 dark:to-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm">
      
      {/* Lado Esquerdo: Identificação do Mês Ativo */}
      <div className="flex items-center gap-3.5 w-full md:w-auto">
        <div className="h-12 w-12 rounded-2xl bg-[#DDF4FF] dark:bg-blue-950/70 border-2 border-[#BAE6FD] dark:border-blue-800 text-[#026CD6] dark:text-sky-400 flex items-center justify-center shadow-sm shrink-0">
          <Calendar className="h-6 w-6 stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
              Período de Referência
            </span>
            {isCurrentMonth ? (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#E8F8E8] dark:bg-emerald-950/60 text-[#388302] dark:text-emerald-400 border border-[#D7FFB8] dark:border-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#58CC02] animate-pulse" />
                Mês Atual
              </span>
            ) : selectedMonth < getCurrentMonthStr() ? (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-sky-300 border border-blue-200 dark:border-blue-800">
                Mês Anterior
              </span>
            ) : (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                Planejamento Futuro
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight capitalize">
            {formatMonthLabel(selectedMonth)}
          </h2>
        </div>
      </div>

      {/* Lado Direito: Controles de Navegação */}
      <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 w-full md:w-auto">
        <button
          type="button"
          onClick={onPrevMonth}
          className="btn-duo btn-duo-white text-xs px-2.5 sm:px-3 py-2 flex items-center gap-1 sm:gap-1.5 shrink-0"
          title="Voltar para o mês anterior"
        >
          <ChevronLeft className="h-4 w-4 stroke-[3] text-slate-600" />
          <span className="hidden sm:inline">Mês Anterior</span>
        </button>

        {/* Input de Seleção Direta de Mês / Ano */}
        <div className="relative flex-1 sm:flex-initial">
          <input
            type="month"
            value={selectedMonth}
            onChange={onSelectMonthInput}
            aria-label="Escolher mês e ano de referência"
            className="btn-duo btn-duo-white text-xs font-black px-2.5 sm:px-3 py-1.5 cursor-pointer text-slate-700 hover:text-[#026CD6] border-2 border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:border-[#026CD6] w-full text-center"
            title="Clique para escolher qualquer mês e ano diretamente"
          />
        </div>

        <button
          type="button"
          onClick={onNextMonth}
          className="btn-duo btn-duo-white text-xs px-2.5 sm:px-3 py-2 flex items-center gap-1 sm:gap-1.5 shrink-0"
          title="Avançar para o próximo mês"
        >
          <span className="hidden sm:inline">Próximo Mês</span>
          <ChevronRight className="h-4 w-4 stroke-[3] text-slate-600" />
        </button>

        {!isCurrentMonth && (
          <button
            type="button"
            onClick={onCurrentMonth}
            className="btn-duo btn-duo-blue text-xs px-2.5 sm:px-3.5 py-2 flex items-center gap-1 sm:gap-1.5 animate-fadeIn shrink-0"
            title="Voltar para o mês atual"
          >
            <RefreshCw className="h-3.5 w-3.5 stroke-[2.5]" />
            <span className="hidden xs:inline sm:inline">Mês Atual</span>
          </button>
        )}
      </div>
    </div>
  );
};
