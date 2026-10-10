import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface InlineDatePickerProps {
  value: string; // formato YYYY-MM-DD
  onChange: (newDate: string) => void;
  disabled?: boolean;
  triggerClassName?: string;
  fullWidth?: boolean;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAY_NAMES = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export const InlineDatePicker: React.FC<InlineDatePickerProps> = ({
  value,
  onChange,
  disabled = false,
  triggerClassName,
  fullWidth = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; openUpwards: boolean }>({
    top: 0,
    left: 0,
    openUpwards: false,
  });

  // Data atual da visualização do calendário (ano e mês)
  const [viewYear, setViewYear] = useState<number>(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length >= 1) return parseInt(parts[0], 10) || new Date().getFullYear();
    }
    return new Date().getFullYear();
  });

  const [viewMonth, setViewMonth] = useState<number>(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length >= 2) return (parseInt(parts[1], 10) - 1) || new Date().getMonth();
    }
    return new Date().getMonth();
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Sincroniza mês e ano quando o valor mudar ou abrir
  useEffect(() => {
    if (value) {
      const [y, m] = value.split('-').map(Number);
      if (!isNaN(y) && !isNaN(m)) {
        setViewYear(y);
        setViewMonth(m - 1);
      }
    }
  }, [value, isOpen]);

  // Calcula a posição do popover com base na viewport
  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = 310;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpwards = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    const popoverWidth = 260;
    let left = rect.left;
    if (left + popoverWidth > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - popoverWidth - 12);
    }

    setCoords({
      top: openUpwards ? rect.top - 6 : rect.bottom + 6,
      left,
      openUpwards,
    });
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Fecha ao clicar fora, ao pressionar Escape ou redimensionar
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleScroll = (event: Event) => {
      // Se a rolagem for interna do próprio popover, não fecha
      if (popoverRef.current && popoverRef.current.contains(event.target as Node)) {
        return;
      }
      setIsOpen(false);
    };

    const handleResize = () => {
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  // Navegação de mês
  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Selecionar dia
  const handleSelectDay = (day: number) => {
    const formatted = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(formatted);
    setIsOpen(false);
  };

  // Atalho "Hoje"
  const handleSelectToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = new Date();
    const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    onChange(formatted);
    setIsOpen(false);
  };

  // Atalho "Ontem"
  const handleSelectYesterday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const formatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    onChange(formatted);
    setIsOpen(false);
  };

  // Cálculo da grade do mês
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Domingo
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  // Dias selecionados e de hoje
  const today = new Date();
  const isCurrentMonthToday = today.getFullYear() === viewYear && today.getMonth() === viewMonth;
  const currentDayToday = today.getDate();

  let selectedDayInView: number | null = null;
  if (value) {
    const [y, m, d] = value.split('-').map(Number);
    if (y === viewYear && m === viewMonth + 1) {
      selectedDayInView = d;
    }
  }

  // Formatação amigável para exibição no botão: DD/MM/AAAA
  const displayLabel = (() => {
    if (!value) return 'Selecionar';
    const parts = value.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return value;
  })();

  return (
    <div className={`relative ${fullWidth ? 'w-full' : 'inline-flex items-center'}`}>
      {/* Botão Gatilho Estilo Badge Customizado */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={
          triggerClassName ||
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold border border-slate-200/90 bg-slate-50/90 hover:bg-blue-50/80 hover:border-blue-300 text-slate-700 hover:text-blue-900 active:scale-97 transition-all cursor-pointer shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-200 disabled:opacity-50"
        }
        title="Clique para alterar a data"
      >
        <Calendar className="w-3 h-3 text-slate-400 stroke-[2.5]" />
        <span>{displayLabel}</span>
      </button>

      {/* Popover Customizado Renderizado via Portal */}
      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: 'fixed',
              top: coords.openUpwards ? undefined : `${coords.top}px`,
              bottom: coords.openUpwards ? `${window.innerHeight - coords.top}px` : undefined,
              left: `${coords.left}px`,
              width: '260px',
              zIndex: 9999,
            }}
            className="card-duo bg-white/98 backdrop-blur-md border-2 border-slate-200/90 shadow-2xl p-3 rounded-2xl animate-scaleUp text-slate-800 select-none"
          >
            {/* Cabeçalho do Mês e Ano */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
                title="Mês anterior"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              </button>

              <span className="text-xs font-black text-slate-800 tracking-wide capitalize">
                {MONTH_NAMES[viewMonth]} <span className="text-slate-500 font-bold">{viewYear}</span>
              </span>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
                title="Próximo mês"
              >
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Cabeçalho dos Dias da Semana */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {WEEKDAY_NAMES.map((name, i) => (
                <span key={i} className="text-[10px] font-black text-slate-400">
                  {name}
                </span>
              ))}
            </div>

            {/* Grade de Dias */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {/* Dias do mês anterior para completar o início da semana */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => {
                const prevDay = daysInPrevMonth - firstDayOfWeek + i + 1;
                return (
                  <span
                    key={`prev-${i}`}
                    className="h-7 w-7 flex items-center justify-center text-[11px] font-semibold text-slate-300 mx-auto select-none"
                  >
                    {prevDay}
                  </span>
                );
              })}

              {/* Dias do mês corrente */}
              {Array.from({ length: daysInCurrentMonth }).map((_, i) => {
                const day = i + 1;
                const isSelected = selectedDayInView === day;
                const isToday = isCurrentMonthToday && currentDayToday === day;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleSelectDay(day)}
                    className={`h-7 w-7 mx-auto flex items-center justify-center text-xs rounded-xl font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#026CD6] text-white font-black shadow-[0_2px_0_0_#024fa0] scale-105'
                        : isToday
                        ? 'bg-blue-50 text-[#026CD6] font-black ring-1 ring-[#026CD6]/40 hover:bg-blue-100'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:scale-95'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Rodapé com Atalhos Rápidos */}
            <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSelectToday}
                  className="px-2 py-1 rounded-lg text-[10px] font-black text-[#026CD6] bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  Hoje
                </button>
                <button
                  type="button"
                  onClick={handleSelectYesterday}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Ontem
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 px-1 py-0.5"
              >
                Fechar
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
