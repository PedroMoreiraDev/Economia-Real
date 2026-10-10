import React, { useState, useRef, useEffect } from 'react';
import { Tag, ChevronDown, Plus, Check } from 'lucide-react';
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
  placeholder = 'Digite ou selecione uma categoria...',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const trimmedText = categoryName.trim().toLowerCase();

  // Filtra as categorias existentes pelo texto digitado
  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(trimmedText)
  );

  // Verifica se o texto digitado coincide exatamente com alguma categoria existente
  const exactMatch = categories.find(
    (cat) => cat.name.toLowerCase() === trimmedText
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    const match = categories.find(
      (cat) => cat.name.toLowerCase() === newText.trim().toLowerCase()
    );
    if (match) {
      onChange(match.id, newText);
    } else {
      // É uma categoria nova digitada pelo usuário
      onChange('', newText);
    }
    if (!isOpen) setIsOpen(true);
  };

  const handleSelect = (cat: Category) => {
    onChange(cat.id, cat.name);
    setIsOpen(false);
  };

  const handleSelectNew = () => {
    onChange('', categoryName.trim());
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <input
          type="text"
          value={categoryName}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#58CC02] focus:bg-white transition-all"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-3 p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border-2 border-slate-200 rounded-2xl shadow-xl z-50 max-h-56 overflow-y-auto p-1.5 animate-scale-up">
          {/* Opção de criar categoria nova se o que foi digitado não bate exatamente */}
          {categoryName.trim() !== '' && !exactMatch && (
            <button
              type="button"
              onClick={handleSelectNew}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 mb-1 flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-1.5 truncate">
                <Plus className="w-3.5 h-3.5 stroke-[3] text-emerald-600 shrink-0" />
                Criar categoria: <strong className="underline font-black">{categoryName.trim()}</strong>
              </span>
              <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded-md bg-emerald-200 text-emerald-800 shrink-0">
                Nova
              </span>
            </button>
          )}

          {/* Opção sem categoria */}
          <button
            type="button"
            onClick={() => {
              onChange('', '');
              setIsOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-100 flex items-center gap-2 transition-colors"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Sem categoria</span>
          </button>

          {/* Lista de categorias existentes filtradas */}
          {filteredCategories.length > 0 ? (
            filteredCategories.map((cat) => {
              const isSelected = value === cat.id || (!value && cat.name.toLowerCase() === trimmedText);
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
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
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
            categoryName.trim() === '' && (
              <div className="p-3 text-center text-xs text-slate-400 font-bold">
                Nenhuma categoria disponível.
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};
