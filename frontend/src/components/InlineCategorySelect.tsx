import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Tag, ChevronDown, Check, Plus, Search } from 'lucide-react';
import { Category } from '../types/financial';

interface InlineCategorySelectProps {
  currentCategoryId?: string;
  categories: Category[];
  disabled?: boolean;
  onSelectCategory: (categoryId: string) => void;
  onOpenCreateCategory: () => void;
}

export const InlineCategorySelect: React.FC<InlineCategorySelectProps> = ({
  currentCategoryId,
  categories,
  disabled = false,
  onSelectCategory,
  onOpenCreateCategory,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [coords, setCoords] = useState<{ top: number; left: number; openUpwards: boolean }>({
    top: 0,
    left: 0,
    openUpwards: false,
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const selectedCategory = categories.find((c) => c.id === currentCategoryId);

  // Calcula a posição do popover quando aberto
  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = 280;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpwards = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    const popoverWidth = 240;
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
      setSearchTerm('');
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Fecha ao clicar fora ou rolar
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
      // Se a rolagem estiver acontecendo dentro da lista do popover, ignora e permite rolar livremente
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

  const isUncategorized = !selectedCategory;
  const catColor = selectedCategory?.colorHex || '#d97706';

  return (
    <div className="relative inline-flex items-center">
      {/* Botão Gatilho Estilo Badge Customizado */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10.5px] font-bold border transition-all cursor-pointer focus:outline-none disabled:opacity-50 ${
          isUncategorized
            ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-400 hover:border-amber-500 shadow-2xs hover:shadow-xs active:scale-97'
            : 'border-slate-200 shadow-2xs hover:brightness-95 active:scale-97'
        }`}
        style={
          isUncategorized
            ? undefined
            : {
                backgroundColor: `${selectedCategory.colorHex}18`,
                color: selectedCategory.colorHex,
                borderColor: `${selectedCategory.colorHex}50`,
              }
        }
        title={
          isUncategorized
            ? '⚠️ Movimentação sem categoria! Clique para definir a categoria agora.'
            : 'Clique para alterar a categoria desta movimentação'
        }
      >
        {isUncategorized ? (
          <span className="text-xs leading-none select-none">⚠️</span>
        ) : (
          <Tag className="w-2.5 h-2.5 flex-shrink-0 stroke-[2.5]" style={{ color: catColor }} />
        )}
        <span className="truncate max-w-[75px] sm:max-w-[90px]">
          {isUncategorized ? 'Sem Categoria' : selectedCategory.name}
        </span>
        <ChevronDown
          className={`w-2.5 h-2.5 flex-shrink-0 stroke-[2.5] transition-transform duration-200 ${
            isUncategorized ? 'text-amber-800' : 'text-slate-400'
          } ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Popover Customizado Renderizado no Portal para Nunca Sofrer Overflow */}
      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: 'fixed',
              top: coords.openUpwards ? undefined : `${coords.top}px`,
              bottom: coords.openUpwards ? `${window.innerHeight - coords.top}px` : undefined,
              left: `${coords.left}px`,
              width: '240px',
              zIndex: 9999,
            }}
            className="card-duo bg-white/98 backdrop-blur-md border-2 border-slate-200/90 shadow-2xl p-2 rounded-2xl animate-scaleUp text-slate-800"
          >
            {/* Campo de Busca Rápida de Categorias */}
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar categoria..."
                autoFocus
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-2.5 py-1.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#026CD6] focus:bg-white transition-all"
              />
            </div>

            {/* Lista com Rolagem Suave */}
            <div className="max-h-52 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
              {filteredCategories.length === 0 ? (
                <div className="py-3 text-center text-xs font-bold text-slate-400">
                  Nenhuma categoria encontrada.
                </div>
              ) : (
                filteredCategories.map((cat) => {
                  const isCurrent = cat.id === currentCategoryId;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        onSelectCategory(cat.id);
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
                          className="w-3 h-3 rounded-full flex-shrink-0 shadow-xs"
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

            {/* Ação Fixa de Criação de Nova Categoria no Rodapé */}
            <div className="pt-2 mt-1 border-t-2 border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenCreateCategory();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-black text-[#026CD6] bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200 transition-all text-left"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Criar Nova Categoria...</span>
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
