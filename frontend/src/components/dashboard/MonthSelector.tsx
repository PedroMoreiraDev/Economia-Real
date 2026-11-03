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
    <div className="card-duo p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
      
      {/* Lado Esquerdo: Identificação do Mês Ativo */}
      <div className="flex items-center gap-3.5 w-full md:w-auto">
        <div className="h-12 w-12 rounded-xl bg-[#102D25] border border-[#D4A94F]/40 text-[#D4A94F] flex items-center justify-center shadow-xs shrink-0">
          <Calendar className="h-6 w-6 stroke-[2.2]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase text-[#526B61] dark:text-[#9AB3A8] tracking-wider">
              Período de Referência
            </span>
            {isCurrentMonth ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#E6EFEA] dark:bg-[#16382E] text-[#1C4939] dark:text-[#78C6A3] border border-[#1C4939]/25 dark:border-[#2B6B54] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1C4939] dark:bg-[#D4A94F] animate-pulse" />
                Mês Atual
              </span>
            ) : selectedMonth < getCurrentMonthStr() ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#EFECE3] dark:bg-[#16382E] text-[#355248] dark:text-[#B8C7C0] border border-[#D5CFC0] dark:border-[#214E3E]">
                Histórico
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F7EFE0] dark:bg-[#16382E] text-[#102D25] dark:text-[#D4A94F] border border-[#D4A94F]/40">
                Projeção Futura
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#102D25] dark:text-[#E8E4D9] tracking-tight capitalize">
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
          <ChevronLeft className="h-4 w-4 stroke-[2.5] text-[#102D25] dark:text-[#E8E4D9]" />
          <span className="hidden sm:inline">Mês Anterior</span>
        </button>

        {/* Input de Seleção Direta de Mês / Ano */}
        <div className="relative flex-1 sm:flex-initial">
          <input
            type="month"
            value={selectedMonth}
            onChange={onSelectMonthInput}
            aria-label="Escolher mês e ano de referência"
            className="btn-duo btn-duo-white text-xs font-extrabold px-2.5 sm:px-3 py-1.5 cursor-pointer text-[#102D25] dark:text-[#E8E4D9] hover:border-[#1C4939] dark:hover:border-[#D4A94F] rounded-xl focus:outline-none focus:border-[#1C4939] w-full text-center font-numeric"
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
          <ChevronRight className="h-4 w-4 stroke-[2.5] text-[#102D25] dark:text-[#E8E4D9]" />
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
