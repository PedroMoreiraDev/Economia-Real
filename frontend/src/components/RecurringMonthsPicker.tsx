import React from 'react';
import { Minus, Plus, Calendar } from 'lucide-react';

interface RecurringMonthsPickerProps {
  months: number;
  onChangeMonths: (months: number) => void;
  startDateStr?: string; // Formato YYYY-MM ou YYYY-MM-DD
  theme?: 'income' | 'expense' | 'bill';
  label?: string;
  minMonths?: number;
  maxMonths?: number;
}

const PRESET_CHIPS = [
  { value: 3, label: '3 meses' },
  { value: 6, label: '6 meses' },
  { value: 12, label: '12 meses (1 ano)' },
  { value: 24, label: '24 meses (2 anos)' },
  { value: 36, label: '36 meses (3 anos)' },
];

export const RecurringMonthsPicker: React.FC<RecurringMonthsPickerProps> = ({
  months,
  onChangeMonths,
  startDateStr,
  theme = 'income',
  label = 'Quantidade de meses de repetição',
  minMonths = 1,
  maxMonths = 60,
}) => {
  // Ajuste fino com clamp
  const handleClamp = (val: number) => {
    const clamped = Math.max(minMonths, Math.min(maxMonths, val));
    onChangeMonths(clamped);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      onChangeMonths(minMonths);
      return;
    }
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed)) {
      handleClamp(parsed);
    }
  };

  // Calcula o mês inicial e o mês final projetado
  const calculateProjectionSummary = () => {
    let baseDate: Date;
    if (startDateStr) {
      const parts = startDateStr.split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      baseDate = new Date(y, m, 1);
    } else {
      baseDate = new Date();
      baseDate.setDate(1);
    }

    if (isNaN(baseDate.getTime())) {
      baseDate = new Date();
      baseDate.setDate(1);
    }

    const formatter = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' });
    const startFormatted = formatter.format(baseDate);

    // Mês final = baseDate + (months - 1) meses
    const endDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + Math.max(1, months) - 1, 1);
    const endFormatted = formatter.format(endDate);

    return { startFormatted, endFormatted };
  };

  const { startFormatted, endFormatted } = calculateProjectionSummary();

  // Estilização por tema com alto contraste e harmonia no Modo Escuro (sem tons pastéis ou fundos leitosos)
  const themeStyles = {
    income: {
      activeChip: 'bg-emerald-600 text-white border-emerald-600 shadow-[0_2px_0_0_#047857]',
      stepperBtn: 'hover:bg-emerald-100 dark:hover:!bg-[#1E293B] text-emerald-800 dark:!text-emerald-400 border-emerald-300 dark:!border-emerald-800',
      inputFocus: 'focus:border-emerald-500 focus:ring-emerald-200',
      badge: 'text-emerald-800 dark:!text-emerald-300 bg-emerald-100/80 dark:!bg-[#0F172A] border-emerald-300 dark:!border-emerald-800',
      accentText: 'text-emerald-900 dark:!text-emerald-200',
    },
    expense: {
      activeChip: 'bg-rose-600 text-white border-rose-600 shadow-[0_2px_0_0_#BE123C]',
      stepperBtn: 'hover:bg-rose-100 dark:hover:!bg-[#1E293B] text-rose-800 dark:!text-rose-400 border-rose-300 dark:!border-rose-800',
      inputFocus: 'focus:border-rose-500 focus:ring-rose-200',
      badge: 'text-rose-800 dark:!text-rose-300 bg-rose-100/80 dark:!bg-[#0F172A] border-rose-300 dark:!border-rose-800',
      accentText: 'text-rose-900 dark:!text-rose-200',
    },
    bill: {
      activeChip: 'bg-[#026CD6] text-white border-[#026CD6] shadow-[0_2px_0_0_#0153AB]',
      stepperBtn: 'hover:bg-blue-100 dark:hover:!bg-[#1E293B] text-[#026CD6] dark:!text-sky-300 border-blue-300 dark:!border-blue-800',
      inputFocus: 'focus:border-[#026CD6] focus:ring-blue-200',
      badge: 'text-blue-800 dark:!text-sky-300 bg-blue-100/80 dark:!bg-[#0F172A] border-blue-300 dark:!border-blue-800',
      accentText: 'text-blue-900 dark:!text-sky-200',
    },
  }[theme];

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:!text-slate-300">
          {label}
        </label>
        <span className="text-[11px] font-bold text-slate-500 dark:!text-slate-400">
          (Mín. {minMonths} a Máx. {maxMonths} meses)
        </span>
      </div>

      {/* Controle Central: Stepper Interativo com Input Livre */}
      <div className="flex items-center gap-3">
        <div className="flex items-center bg-white dark:!bg-[#0F172A] border-2 border-slate-200 dark:!border-slate-800 rounded-2xl shadow-inner p-1">
          <button
            type="button"
            onClick={() => handleClamp(months - 1)}
            disabled={months <= minMonths}
            className={`h-9 w-9 rounded-xl flex items-center justify-center font-black transition-all border disabled:opacity-40 disabled:cursor-not-allowed ${themeStyles.stepperBtn}`}
            title="Diminuir 1 mês"
          >
            <Minus className="h-4 w-4 stroke-[3]" />
          </button>

          <div className="flex items-center px-2">
            <input
              type="number"
              min={minMonths}
              max={maxMonths}
              value={months}
              onChange={handleInputChange}
              className={`w-14 text-center font-black text-base text-slate-800 dark:!text-white bg-transparent focus:outline-none transition-all ${themeStyles.inputFocus}`}
            />
            <span className="text-xs font-bold text-slate-400 dark:!text-slate-400 select-none pr-1">
              {months === 1 ? 'mês' : 'meses'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleClamp(months + 1)}
            disabled={months >= maxMonths}
            className={`h-9 w-9 rounded-xl flex items-center justify-center font-black transition-all border disabled:opacity-40 disabled:cursor-not-allowed ${themeStyles.stepperBtn}`}
            title="Aumentar 1 mês"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
          </button>
        </div>

        {/* Chips de Atalhos Rápidos */}
        <div className="flex items-center gap-1.5 flex-wrap flex-1">
          {PRESET_CHIPS.map((chip) => {
            const isSelected = months === chip.value;
            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => handleClamp(chip.value)}
                className={`py-1.5 px-2.5 rounded-xl border text-xs font-bold transition-all ${
                  isSelected
                    ? themeStyles.activeChip
                    : 'bg-white dark:!bg-[#1E293B] border-slate-200 dark:!border-slate-700 text-slate-600 dark:!text-slate-200 hover:bg-slate-50 dark:hover:!bg-[#334155]'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Resumo da Projeção Temporal */}
      <div className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${themeStyles.badge}`}>
        <Calendar className="h-4 w-4 shrink-0 stroke-[2.5]" />
        <span>
          {months === 1 ? (
            <span>Será lançado apenas no mês inicial: <strong>{startFormatted}</strong>.</span>
          ) : (
            <span>
              Será lançado automaticamente por <strong>{months} meses</strong>: de <strong>{startFormatted}</strong> até <strong>{endFormatted}</strong>.
            </span>
          )}
        </span>
      </div>
    </div>
  );
};
