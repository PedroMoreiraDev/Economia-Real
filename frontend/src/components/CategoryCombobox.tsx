import React, { useState, useRef, useEffect } from 'react';
import { Tag, ChevronDown, Plus, Check, Search, X } from 'lucide-react';
import { Category } from '../types/financial';

interface CategoryComboboxProps {
  value: string; // ID da categoria selecionada ou vazio
  categoryName: string; // Nome da categoria digitada ou selecionada
  onChange: (categoryId: string, categoryName: string) => void;
  categories: Category[];
  placeholder?: string;
  className?: string;
}

export const CategoryCombobox: React.FC<CategoryComboboxProps> = ({
  value,
  categoryName,
  onChange,
  categories,
  placeholder = 'Selecione uma categoria...',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Categoria atualmente selecionada
  const selectedCategory = categories.find(
    (c) => c.id === value || (categoryName && c.name.toLowerCase() === categoryName.trim().toLowerCase())
  );

  // Fecha o dropdown se clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Foco automático no campo de busca ao abrir
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const cleanSearch = searchTerm.trim().toLowerCase();

  // Filtra as categorias existentes APENAS pelo termo de busca digitado dentro do dropdown
  const filteredCategories = cleanSearch
    ? categories.filter((cat) => cat.name.toLowerCase().includes(cleanSearch))
    : categories;

  // Verifica se o texto de busca coincide exatamente com alguma categoria existente
  const exactMatch = cleanSearch
    ? categories.some((cat) => cat.name.toLowerCase() === cleanSearch)
    : true;

  const handleSelect = (cat: Category) => {
    onChange(cat.id, cat.name);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleSelectNew = () => {
    if (searchTerm.trim()) {
      onChange('', searchTerm.trim());
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('', '');
    setSearchTerm('');
  };

  const displayName = selectedCategory ? selectedCategory.name : categoryName;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Botão Gatilho Principal */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className={`w-full px-4 py-2.5 bg-slate-50 border-2 rounded-2xl flex items-center justify-between cursor-pointer transition-all select-none ${
          isOpen
            ? 'border-[#58CC02] bg-white ring-2 ring-[#58CC02]/20'
            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-100/60'
        }`}
      >
        <div className="flex items-center gap-2.5 truncate pr-2">
          {displayName ? (
            <>
              <span
                className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: selectedCategory?.colorHex || '#10B981' }}
              />
              <span className="text-sm font-black text-slate-800 truncate">
                {displayName}
              </span>
              {selectedCategory?.systemDefault && (
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200 shrink-0">
                  Padrão
                </span>
              )}
            </>
          ) : (
            <>
              <Tag className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-sm font-bold text-slate-400 truncate">
                {placeholder}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {displayName && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
              title="Remover categoria"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <div className="p-1 text-slate-400">
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#58CC02]' : ''}`} />
          </div>
        </div>
      </div>

      {/* Menu Suspenso Flutuante com TODAS as categorias e busca */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border-2 border-slate-200 rounded-2xl shadow-2xl z-50 p-2 animate-scale-up">
          {/* Campo de Busca dedicado */}
          <div className="relative mb-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar ou criar categoria..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#58CC02] focus:bg-white transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="max-h-56 overflow-y-auto space-y-0.5 pr-0.5 custom-scrollbar">
            {/* Opção de criar categoria nova se o termo digitado não existe */}
            {searchTerm.trim() !== '' && !exactMatch && (
              <button
                type="button"
                onClick={handleSelectNew}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 mb-1 flex items-center justify-between transition-colors shadow-sm"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <Plus className="w-3.5 h-3.5 stroke-[3] text-emerald-600 shrink-0" />
                  Criar categoria: <strong className="underline font-black">{searchTerm.trim()}</strong>
                </span>
                <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded-md bg-emerald-200 text-emerald-800 shrink-0">
                  Nova
                </span>
              </button>
            )}

            {/* Opção Sem categoria */}
            <button
              type="button"
              onClick={() => {
                onChange('', '');
                setIsOpen(false);
                setSearchTerm('');
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                !displayName
                  ? 'bg-blue-50 text-blue-900 border border-blue-200 font-black'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Sem categoria</span>
              </div>
              {!displayName && <Check className="w-3.5 h-3.5 text-blue-600 stroke-[3] shrink-0" />}
            </button>

            {/* Lista com TODAS as categorias cadastradas */}
            {filteredCategories.length > 0 ? (
              filteredCategories.map((cat) => {
                const isSelected =
                  value === cat.id ||
                  (!value && categoryName && cat.name.toLowerCase() === categoryName.trim().toLowerCase());

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelect(cat)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-blue-50 text-blue-900 border border-blue-200 font-black'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: cat.colorHex || '#3B82F6' }}
                      />
                      <span className="truncate">{cat.name}</span>
                      {cat.systemDefault && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 border border-slate-200">
                          Padrão
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 stroke-[3] shrink-0" />}
                  </button>
                );
              })
            ) : (
              !searchTerm.trim() && (
                <div className="p-3 text-center text-xs text-slate-400 font-bold">
                  Nenhuma categoria cadastrada.
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};
