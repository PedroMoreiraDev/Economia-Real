import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Tag, ChevronDown, Check, Search, X } from 'lucide-react';
import { Category } from '../types/financial';

interface CategoryFilterDropdownProps {
  categories: Category[];
  selectedCategoryId: string; // 'ALL' | 'NONE' | UUID
  onChange: (categoryId: string) => void;
  uncategorizedCount?: number;
  className?: string;
}

export const CategoryFilterDropdown: React.FC<CategoryFilterDropdownProps> = ({
  categories,
  selectedCategoryId,
  onChange,
  uncategorizedCount = 0,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [coords, setCoords] = useState<{ top: number; left: number; openUpwards: boolean; width: number }>({
    top: 0,
    left: 0,
    openUpwards: false,
    width: 230,
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const isAll = selectedCategoryId === 'ALL';
  const isNone = selectedCategoryId === 'NONE';

  // Atualiza coordenadas para o Portal flutuante
  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = 310;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpwards = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    const popoverWidth = Math.max(240, rect.width);
    let left = rect.left;
    if (left + popoverWidth > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - popoverWidth - 12);
    }

    setCoords({
      top: openUpwards ? rect.top - 6 : rect.bottom + 6,
      left,
      openUpwards,
      width: popoverWidth,
    });
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) {
      updatePosition();
      setSearchTerm('');
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Fecha ao clicar fora, teclar Escape ou redimensionar janela
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

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Botão Gatilho com Design System Rico */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className={`w-full sm:w-auto inline-flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border shadow-2xs hover:shadow-xs active:scale-98 ${
          isAll
            ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
            : isNone
            ? 'bg-amber-50 text-amber-950 border-amber-300 shadow-sm'
            : 'shadow-sm'
        }`}
        style={
          selectedCategory
            ? {
                backgroundColor: `${selectedCategory.colorHex || '#026CD6'}12`,
                color: selectedCategory.colorHex || '#026CD6',
                borderColor: `${selectedCategory.colorHex || '#026CD6'}45`,
              }
            : undefined
        }
        title={
          selectedCategory
            ? `Filtrado por: ${selectedCategory.name}`
            : isNone
            ? 'Filtrado por: Sem categoria'
            : 'Filtrar por categoria'
        }
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {selectedCategory ? (
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-xs"
              style={{ backgroundColor: selectedCategory.colorHex || '#026CD6' }}
            />
          ) : isNone ? (
            <span className="text-xs leading-none select-none">⚠️</span>
          ) : (
            <Tag className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 stroke-[2.5]" />
          )}

          <span className="truncate max-w-[130px] sm:max-w-[160px]">
            {selectedCategory
              ? selectedCategory.name
              : isNone
              ? 'Sem categoria'
              : 'Todas as categorias'}
          </span>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {!isAll ? (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange('ALL');
              }}
              className="p-0.5 rounded-md hover:bg-black/10 transition-colors text-current opacity-70 hover:opacity-100"
              title="Limpar filtro de categoria"
            >
              <X className="w-3 h-3 stroke-[3]" />
            </span>
          ) : (
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 stroke-[2.5] transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          )}
        </div>
      </button>

      {/* Popover Moderno Renderizado com Portal Flutuante */}
      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: 'fixed',
              top: coords.openUpwards ? undefined : `${coords.top}px`,
              bottom: coords.openUpwards ? `${window.innerHeight - coords.top}px` : undefined,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 9999,
            }}
            className="card-duo bg-white/98 dark:!bg-[#0F172A] backdrop-blur-md border-2 border-slate-200/90 dark:!border-slate-800 shadow-2xl p-2 rounded-2xl animate-scaleUp text-slate-800 dark:!text-white"
          >
            {/* Campo de Busca Rápida */}
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar categoria..."
                autoFocus
                className="w-full bg-slate-50 dark:!bg-[#1E293B] border border-slate-200 dark:!border-slate-700 rounded-xl pl-8 pr-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:!text-white placeholder-slate-400 focus:outline-none focus:border-[#026CD6] focus:bg-white dark:focus:!bg-[#1E293B] transition-all"
              />
            </div>

            {/* Lista de Opções */}
            <div className="max-h-60 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
              {/* Opção 1: Todas as Categorias */}
              <button
                type="button"
                onClick={() => {
                  onChange('ALL');
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-all text-left ${
                  isAll
                    ? 'bg-blue-50 dark:!bg-[#1E293B] text-[#026CD6] dark:!text-sky-400 font-black'
                    : 'hover:bg-slate-100 dark:hover:!bg-[#1E293B] text-slate-700 dark:!text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-slate-400 stroke-[2.5]" />
                  <span>Todas as categorias</span>
                </div>
                {isAll && <Check className="w-3.5 h-3.5 text-[#026CD6] flex-shrink-0 stroke-[3]" />}
              </button>

              {/* Opção 2: Sem Categoria */}
              <button
                type="button"
                onClick={() => {
                  onChange('NONE');
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-all text-left ${
                  isNone
                    ? 'bg-amber-100/80 text-amber-900 font-black'
                    : 'hover:bg-amber-50/70 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs leading-none select-none">⚠️</span>
                  <span>Sem categoria</span>
                  {uncategorizedCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-200/80 text-amber-900 font-black">
                      {uncategorizedCount}
                    </span>
                  )}
                </div>
                {isNone && <Check className="w-3.5 h-3.5 text-amber-700 flex-shrink-0 stroke-[3]" />}
              </button>

              <div className="border-t border-slate-100 my-1" />

              {/* Categorias Cadastradas */}
              {filteredCategories.length === 0 ? (
                <div className="py-3 text-center text-xs font-bold text-slate-400">
                  Nenhuma categoria encontrada.
                </div>
              ) : (
                filteredCategories.map((cat) => {
                  const isCurrent = cat.id === selectedCategoryId;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        onChange(cat.id);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-all text-left group ${
                        isCurrent
                          ? 'bg-blue-50 text-[#026CD6] font-black'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-xs"
                          style={{ backgroundColor: cat.colorHex || '#026CD6' }}
                        />
                        <span className="truncate">{cat.name}</span>
                      </div>
                      {isCurrent && (
                        <Check className="w-3.5 h-3.5 text-[#026CD6] flex-shrink-0 stroke-[3]" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
