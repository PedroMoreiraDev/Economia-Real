import React, { useState, useEffect, useRef } from 'react';
import { Target, X, AlertCircle, Trash2, CheckCircle2, Globe, ChevronDown, Search, Check } from 'lucide-react';
import { Category } from '../types/financial';
import { BudgetProgressDto, CreateBudgetPayload } from '../types/budget';
import { 
  createOrUpdateBudgetApi, 
  deleteBudgetApi, 
  updateGlobalAlertThresholdApi, 
  getStoredGlobalAlertThreshold, 
  setStoredGlobalAlertThreshold 
} from '../services/budgetApi';
import { useAuth } from '../context/AuthContext';
import { CurrencyInput } from './CurrencyInput';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  existingBudgets: BudgetProgressDto[];
  onBudgetUpdated: () => void;
  monthReference?: string;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  categories,
  existingBudgets,
  onBudgetUpdated,
  monthReference,
}) => {
  const { token, user } = useAuth();
  const [categoryId, setCategoryId] = useState('');
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [alertThreshold, setAlertThreshold] = useState(() => {
    const stored = getStoredGlobalAlertThreshold(user?.id);
    if (stored) return stored.toString();
    if (existingBudgets.length > 0 && existingBudgets[0].alertThresholdPercentage) {
      return existingBudgets[0].alertThresholdPercentage.toString();
    }
    return '80';
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados do seletor moderno de categoria
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredGlobalAlertThreshold(user?.id);
      if (stored) {
        setAlertThreshold(stored.toString());
      } else if (existingBudgets.length > 0 && existingBudgets[0].alertThresholdPercentage) {
        setAlertThreshold(existingBudgets[0].alertThresholdPercentage.toString());
      }
      setIsDropdownOpen(false);
      setSearchTerm('');
    }
  }, [isOpen, user?.id, existingBudgets]);

  // Fecha o dropdown se clicar fora ou pressionar ESC
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  // Foco automático no campo de busca ao abrir o dropdown
  useEffect(() => {
    if (isDropdownOpen) {
      setSearchTerm('');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isDropdownOpen]);

  if (!isOpen) return null;

  // Quando o usuário seleciona uma categoria, se já houver orçamento, pré-preenche o limite
  const handleCategoryChange = (catId: string) => {
    setCategoryId(catId);
    const existing = existingBudgets.find(b => b.categoryId === catId);
    if (existing) {
      setMonthlyLimit(existing.monthlyLimit.toString());
    } else {
      setMonthlyLimit('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setError(null);
    setLoading(true);

    try {
      const thresholdVal = parseInt(alertThreshold, 10);
      if (isNaN(thresholdVal) || thresholdVal < 1 || thresholdVal > 100) {
        throw new Error('O percentual de alerta deve estar entre 1 e 100%.');
      }

      // Se o usuário selecionou uma categoria, valida e salva a meta individual
      if (categoryId) {
        const limitVal = parseFloat(monthlyLimit);
        if (isNaN(limitVal) || limitVal <= 0) {
          throw new Error('O limite mensal deve ser maior que zero.');
        }

        const payload: CreateBudgetPayload = {
          categoryId,
          monthReference: monthReference || undefined,
          monthlyLimit: limitVal,
          alertThresholdPercentage: thresholdVal,
        };

        await createOrUpdateBudgetApi(token, payload);
      }

      // Aplica o percentual de alerta de consumo próximo para todas as categorias existentes no mês
      await updateGlobalAlertThresholdApi(token, thresholdVal, monthReference);

      // Persiste nas preferências locais do usuário para futuras metas e I.A
      setStoredGlobalAlertThreshold(user?.id, thresholdVal);

      onBudgetUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar configurações.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (budgetId: string) => {
    if (!token) return;
    if (!window.confirm('Tem certeza que deseja remover a meta desta categoria?')) return;

    setLoading(true);
    try {
      await deleteBudgetApi(token, budgetId);
      onBudgetUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao remover orçamento.');
    } finally {
      setLoading(false);
    }
  };

  const selectedBudget = existingBudgets.find(b => b.categoryId === categoryId);
  const selectedCategory = categories.find(c => c.id === categoryId);
  const isCategorySelected = Boolean(categoryId);

  // Filtra as categorias com base no termo digitado
  const filteredCategories = searchTerm.trim()
    ? categories.filter(c => c.name.toLowerCase().includes(searchTerm.trim().toLowerCase()))
    : categories;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:!bg-[#0F172A] border-2 border-slate-200 dark:!border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col text-slate-800 dark:!text-white max-h-[90dvh] my-auto">
        
        {/* Cabeçalho */}
        <div className="p-4 sm:p-6 border-b-2 border-slate-100 dark:!border-slate-800 flex items-center justify-between bg-blue-50/70 dark:!bg-blue-950/40">
          <div className="flex items-center gap-3 sm:gap-3.5">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-[#026CD6] text-white shadow-[0_3px_0_0_#0153AB] shrink-0">
              <Target className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-black text-slate-800 dark:!text-white">Meta de Orçamento</h2>
              <p className="text-xs sm:text-sm font-bold text-slate-400">Estabeleça limites e alertas de monitoramento</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:!bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 lg:p-8 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3.5 bg-rose-50 dark:!bg-rose-950/50 border-2 border-[#FF4B4B] dark:!border-rose-800 rounded-2xl flex items-center gap-2.5 text-xs sm:text-sm font-bold text-[#EA2B2B] dark:!text-rose-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Selecionar Categoria (Menu Estilizado no Padrão Duolingo) */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:!text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Categoria de Despesa</span>
              {!isCategorySelected ? (
                <span className="text-[10px] font-bold text-[#026CD6] dark:text-sky-300 bg-blue-50 dark:!bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-md">
                  Opcional p/ alerta geral
                </span>
              ) : (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:!bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md">
                  Meta individual
                </span>
              )}
            </label>

            {/* Gatilho Principal */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsDropdownOpen(!isDropdownOpen);
                }
              }}
              className={`w-full min-h-[46px] px-4 py-2.5 rounded-2xl flex items-center justify-between cursor-pointer border-2 transition-all select-none active:scale-[0.99] ${
                isDropdownOpen
                  ? 'border-[#026CD6] bg-white dark:!bg-[#1E293B] ring-2 ring-[#026CD6]/20 shadow-sm'
                  : 'bg-slate-50 dark:!bg-[#1E293B] border-slate-200 dark:!border-slate-700 hover:border-slate-300 dark:hover:!border-slate-600'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate pr-2">
                {selectedCategory ? (
                  <>
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm ring-2 ring-white/40"
                      style={{ backgroundColor: selectedCategory.colorHex || '#026CD6' }}
                    />
                    <span className="text-xs sm:text-sm font-black text-slate-800 dark:!text-white truncate">
                      {selectedCategory.name}
                    </span>
                    {selectedBudget && (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 dark:!bg-blue-900/60 text-[#026CD6] dark:text-sky-300 border border-blue-200 dark:border-blue-700/60 shrink-0">
                        Meta: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedBudget.monthlyLimit)}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4 text-[#026CD6] shrink-0" />
                    <span className="text-xs sm:text-sm font-bold text-slate-600 dark:!text-slate-300 truncate">
                      Nenhuma selecionada (Apenas alerta geral)
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {selectedCategory && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCategoryChange('');
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:!bg-rose-950/40 transition-colors"
                    title="Limpar categoria"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180 text-[#026CD6]' : ''
                  }`}
                />
              </div>
            </div>

            {/* Menu Popover Flutuante */}
            {isDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:!bg-[#0F172A] border-2 border-slate-200 dark:!border-slate-800 rounded-2xl shadow-2xl z-50 p-2.5 animate-scaleUp">
                {/* Campo de Busca */}
                <div className="relative mb-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar categoria..."
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:!bg-[#1E293B] border-2 border-slate-200 dark:!border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-800 dark:!text-white placeholder-slate-400 focus:outline-none focus:border-[#026CD6] transition-all"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Opção de Nenhuma Selecionada / Alerta Geral */}
                <button
                  type="button"
                  onClick={() => {
                    handleCategoryChange('');
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                    !categoryId
                      ? 'bg-blue-50 dark:!bg-blue-950/60 text-[#026CD6] dark:text-sky-300 border-2 border-blue-200 dark:border-blue-800 font-black'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:!bg-[#1E293B]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="p-1 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-[#026CD6] dark:text-sky-300 shrink-0">
                      <Globe className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <span className="block truncate font-black">Nenhuma (Alerta geral)</span>
                      <span className="block text-[10px] text-slate-400 truncate">Configura apenas o aviso preventivo</span>
                    </div>
                  </div>
                  {!categoryId && <Check className="w-4 h-4 text-[#026CD6] stroke-[3] shrink-0" />}
                </button>

                {/* Divisória com contagem de categorias */}
                <div className="flex items-center justify-between px-2 pt-2 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400 border-t border-slate-100 dark:border-slate-800 mt-1">
                  <span>Categorias ({filteredCategories.length})</span>
                  {existingBudgets.length > 0 && (
                    <span className="text-emerald-600 dark:text-emerald-400">{existingBudgets.length} com meta</span>
                  )}
                </div>

                {/* Lista de Categorias com Rolagem */}
                <div className="max-h-56 overflow-y-auto space-y-1 pr-0.5 custom-scrollbar">
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((cat) => {
                      const isSelected = categoryId === cat.id;
                      const existing = existingBudgets.find((b) => b.categoryId === cat.id);

                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            handleCategoryChange(cat.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-[#E8F8E8] dark:!bg-emerald-950/60 text-[#46A302] dark:text-emerald-300 border-2 border-[#58CC02] font-black'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:!bg-[#1E293B]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <span
                              className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700"
                              style={{ backgroundColor: cat.colorHex || '#3B82F6' }}
                            />
                            <span className="truncate">{cat.name}</span>
                            {existing && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-100 dark:!bg-blue-900/60 text-[#026CD6] dark:text-sky-300 border border-blue-200 dark:border-blue-800 shrink-0">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(existing.monthlyLimit)}
                              </span>
                            )}
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#58CC02] stroke-[3] shrink-0" />}
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400 font-bold">
                      Nenhuma categoria encontrada para "{searchTerm}".
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Limite Mensal */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:!text-slate-400 mb-1.5">
              Limite Mensal Máximo (R$)
            </label>
            <CurrencyInput
              disabled={!isCategorySelected}
              value={monthlyLimit}
              onChangeValue={(val) => setMonthlyLimit(val > 0 ? val.toString() : '')}
              placeholder={isCategorySelected ? "0,00" : "Selecione uma categoria"}
              className="bg-slate-50 dark:!bg-[#1E293B] border-2 border-slate-200 dark:!border-slate-700 rounded-2xl py-2.5 text-sm font-black text-slate-800 dark:!text-white focus:border-[#026CD6] focus:bg-white dark:focus:!bg-[#1E293B] disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800/50"
            />
          </div>

          {/* Limite de Alerta Percentual (Global para todas as categorias) */}
          <div className="p-3.5 bg-blue-50/60 dark:!bg-[#1E293B] border-2 border-blue-100/80 dark:!border-slate-700 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:!text-slate-200 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#026CD6]" />
                <span>Alerta de Consumo Próximo</span>
              </label>
              <span className="text-[#026CD6] dark:text-sky-300 font-black text-xs px-2 py-0.5 bg-blue-100 dark:!bg-blue-900/60 rounded-lg">
                {alertThreshold}% (Todas as Categorias)
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(e.target.value)}
              className="w-full accent-[#026CD6] cursor-pointer"
            />
            <p className="text-[11px] font-bold text-slate-500 dark:!text-slate-400 leading-snug">
              Configuração geral: aplica-se a todas as categorias do mês e também às metas geradas por I.A. A interface mudará para estado de aviso amarelo ao atingir este percentual.
            </p>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-3 pt-4 border-t-2 border-slate-100 dark:border-slate-800">
            {selectedBudget && (
              <button
                type="button"
                onClick={() => handleDelete(selectedBudget.id)}
                disabled={loading}
                className="p-3 rounded-2xl border-2 border-rose-200 dark:!border-rose-900/80 text-[#FF4B4B] dark:text-rose-400 hover:bg-rose-50 dark:hover:!bg-rose-950/40 transition-colors"
                title="Excluir meta desta categoria"
              >
                <Trash2 className="w-5 h-5 stroke-[2.5]" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="btn-duo btn-duo-white flex-1 py-3 text-xs sm:text-sm font-black"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || (isCategorySelected && (!monthlyLimit || parseFloat(monthlyLimit) <= 0))}
              className="btn-duo btn-duo-green flex-1 py-3 text-xs sm:text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>{isCategorySelected ? 'Salvar Meta' : 'Aplicar Alerta Geral'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};


