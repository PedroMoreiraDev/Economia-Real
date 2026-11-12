import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Plus, 
  Trash2, 
  Edit2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Sparkles, 
  Calendar, 
  AlertCircle,
  Trophy,
  Coins
} from 'lucide-react';
import { SavingsGoal } from '../types/goal';
import { Account } from '../types/financial';
import { fetchSavingsGoalsApi, deleteSavingsGoalApi } from '../services/goalApi';
import { SavingsGoalModal } from './SavingsGoalModal';
import { GoalTransactionModal } from './GoalTransactionModal';
import { useAuth } from '../context/AuthContext';

interface SavingsGoalsSectionProps {
  accounts: Account[];
  onDataChanged?: () => void;
  privacyMode?: boolean;
}

function formatBRL(val: number | undefined, privacyMode?: boolean): string {
  if (privacyMode) return '••••••';
  if (val === undefined || isNaN(val)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

export const SavingsGoalsSection: React.FC<SavingsGoalsSectionProps> = ({
  accounts,
  onDataChanged,
  privacyMode,
}) => {
  const { token } = useAuth();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [activeGoalForTx, setActiveGoalForTx] = useState<SavingsGoal | null>(null);
  const [txModalMode, setTxModalMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadGoals = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await fetchSavingsGoalsApi(token);
      setGoals(data);
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Erro ao carregar metas.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, [token]);

  const handleDelete = async (goal: SavingsGoal) => {
    if (!token) return;
    if (!window.confirm(`Deseja realmente excluir a meta "${goal.title}"?`)) {
      return;
    }

    try {
      await deleteSavingsGoalApi(token, goal.id);
      setFeedbackMessage({ type: 'success', text: `Meta "${goal.title}" removida com sucesso.` });
      loadGoals();
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Erro ao remover meta.' });
    }
  };

  const handleOpenTx = (goal: SavingsGoal, mode: 'deposit' | 'withdraw') => {
    setActiveGoalForTx(goal);
    setTxModalMode(mode);
    setIsTxModalOpen(true);
  };

  const totalSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const totalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);
  const overallPercentage = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
  const completedGoalsCount = goals.filter((g) => g.isReached).length;

  return (
    <div className="space-y-6">
      
      {/* Cabeçalho */}
      <div className="card-duo p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E2DDD0] dark:border-[#214E3E] pb-5">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#102D25] dark:text-[#E8E4D9] flex items-center gap-2.5">
              <span className="p-2.5 rounded-xl bg-[#D4A94F] text-[#102D25] border border-[#B88B32]">
                <Target className="w-5 h-5 stroke-[2.3]" />
              </span>
              <span>Cofres & Metas de Patrimônio</span>
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-[#526B61] dark:text-[#9AB3A8]">
              Construa sua reserva de emergência e alcance seus objetivos de médio e longo prazo
            </p>
          </div>

          <button
            onClick={() => {
              setEditingGoal(null);
              setIsGoalModalOpen(true);
            }}
            className="btn-duo btn-duo-green text-xs sm:text-sm px-4 py-2.5 flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Criar Nova Meta</span>
          </button>
        </div>

        {feedbackMessage && (
          <div
            className={`flex items-center space-x-2.5 p-3.5 rounded-xl text-xs font-bold border ${
              feedbackMessage.type === 'success'
                ? 'bg-[#E6EFEA] dark:bg-[#16382E] border-[#1C4939] text-[#102D25] dark:text-[#E8E4D9]'
                : 'bg-rose-50 border-rose-200 text-[#B93838]'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{feedbackMessage.text}</span>
          </div>
        )}

        {/* 3 Cards de Resumo Executivos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-5 rounded-2xl bg-[#E6EFEA]/70 dark:bg-[#16382E]/80 border border-[#1C4939]/30 dark:border-[#285C49]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#355248] dark:text-[#9AB3A8]">
                Total Poupado
              </span>
              <Coins className="w-5 h-5 text-[#1C4939] dark:text-[#78C6A3]" />
            </div>
            <div className="mt-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#1C4939] dark:text-[#78C6A3] font-numeric">
                {formatBRL(totalSaved, privacyMode)}
              </span>
            </div>
            <span className="text-xs font-semibold text-[#526B61] dark:text-[#9AB3A8] mt-1 block">
              Alocado em objetivos dedicados
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-[#EFECE3] dark:bg-[#102D25] border border-[#D5CFC0] dark:border-[#214E3E]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#526B61] dark:text-[#9AB3A8]">
                Objetivo Global
              </span>
              <Target className="w-5 h-5 text-[#102D25] dark:text-[#D4A94F]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2 font-numeric">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#102D25] dark:text-[#E8E4D9]">
                {formatBRL(totalTarget, privacyMode)}
              </span>
              <span className="text-xs font-bold text-[#1C4939] dark:text-[#D4A94F]">({overallPercentage.toFixed(0)}%)</span>
            </div>
            <span className="text-xs font-semibold text-[#526B61] dark:text-[#9AB3A8] mt-1 block">
              Soma de todas as metas
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-[#F7EFE0] dark:bg-[#16382E] border border-[#D4A94F]/50">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#9A7220] dark:text-[#D4A94F]">
                Metas Conquistadas
              </span>
              <Trophy className="w-5 h-5 text-[#D4A94F]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2 font-numeric">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#102D25] dark:text-[#E8E4D9]">
                {completedGoalsCount}
              </span>
              <span className="text-xs font-bold text-[#9A7220] dark:text-[#D4A94F]">de {goals.length} metas</span>
            </div>
            <span className="text-xs font-semibold text-[#526B61] dark:text-[#9AB3A8] mt-1 block">
              {completedGoalsCount > 0 ? 'Objetivos concluídos' : 'Em andamento'}
            </span>
          </div>
        </div>

        {/* Lista de Metas */}
        {loading ? (
          <div className="p-12 text-center text-[#526B61] dark:text-[#9AB3A8] text-sm font-bold">Carregando metas...</div>
        ) : goals.length === 0 ? (
          <div className="p-10 rounded-2xl border border-dashed border-[#D5CFC0] dark:border-[#214E3E] bg-[#EFECE3]/40 dark:bg-[#0D241D] text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#102D25] text-[#D4A94F] border border-[#D4A94F]/40 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-[#102D25] dark:text-[#E8E4D9]">Nenhuma meta criada ainda</h3>
            <p className="text-xs font-medium text-[#526B61] dark:text-[#9AB3A8] max-w-sm mx-auto">
              Defina uma meta para reserva de emergência, uma viagem ou construção de patrimônio.
            </p>
            <button
              onClick={() => {
                setEditingGoal(null);
                setIsGoalModalOpen(true);
              }}
              className="btn-duo btn-duo-green text-xs px-5 py-2.5"
            >
              Criar Minha Primeira Meta
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {goals.map((goal) => {
              const pct = Math.min(100, goal.progressPercentage);
              return (
                <div
                  key={goal.id}
                  className={`rounded-2xl border p-6 transition-all flex flex-col justify-between relative overflow-hidden ${
                    goal.isReached
                      ? 'bg-[#E6EFEA]/60 dark:bg-[#16382E] border-[#1C4939] dark:border-[#D4A94F]'
                      : 'bg-[#FAF8F4] dark:bg-[#102D25] border-[#D5CFC0] dark:border-[#214E3E] hover:border-[#1C4939]/50'
                  }`}
                >
                  {goal.isReached && (
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4A94F] text-[#102D25] text-[11px] font-extrabold shadow-2xs uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Conquistada</span>
                    </div>
                  )}

                  <div>
                    <div className="mb-4 pr-16">
                      <h3 className="text-lg font-extrabold text-[#102D25] dark:text-[#E8E4D9] tracking-tight">{goal.title}</h3>
                      {goal.targetDate && (
                        <span className="text-xs font-semibold text-[#526B61] dark:text-[#9AB3A8] flex items-center gap-1 mt-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Alvo: {new Date(goal.targetDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 my-4">
                      <div className="flex justify-between text-xs font-bold font-numeric">
                        <span className="text-[#526B61] dark:text-[#9AB3A8] uppercase tracking-wider text-[10px]">Progresso</span>
                        <span className={goal.isReached ? 'text-[#1C4939] dark:text-[#D4A94F] font-extrabold' : 'text-[#102D25] dark:text-[#E8E4D9]'}>
                          {goal.progressPercentage.toFixed(0)}%
                        </span>
                      </div>
                      <div className="progress-duo-track h-3">
                        <div
                          className={`progress-duo-fill ${
                            goal.isReached
                              ? 'bg-[#1C4939]'
                              : pct >= 50
                              ? 'bg-gradient-to-r from-[#1C4939] to-[#D4A94F]'
                              : 'bg-[#D4A94F]'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Valores Numéricos */}
                    <div className="grid grid-cols-2 gap-2 p-3.5 rounded-xl bg-[#EFECE3]/70 dark:bg-[#0D241D] border border-[#E2DDD0] dark:border-[#214E3E] text-xs mb-4 font-numeric">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#526B61] dark:text-[#9AB3A8] block tracking-wider">Acumulado</span>
                        <span className="font-extrabold text-[#1C4939] dark:text-[#78C6A3] text-sm sm:text-base">
                          {formatBRL(goal.currentAmount, privacyMode)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-[#526B61] dark:text-[#9AB3A8] block tracking-wider">Objetivo</span>
                        <span className="font-extrabold text-[#102D25] dark:text-[#E8E4D9] text-sm sm:text-base">
                          {formatBRL(goal.targetAmount, privacyMode)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="pt-3 border-t border-[#E2DDD0] dark:border-[#214E3E] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenTx(goal, 'deposit')}
                        className="btn-duo btn-duo-green text-xs px-3 py-1.5 flex items-center gap-1"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Guardar</span>
                      </button>
                      {goal.currentAmount > 0 && (
                        <button
                          onClick={() => handleOpenTx(goal, 'withdraw')}
                          className="btn-duo btn-duo-white text-xs px-3 py-1.5 flex items-center gap-1"
                        >
                          <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Resgatar</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingGoal(goal);
                          setIsGoalModalOpen(true);
                        }}
                        title="Editar Meta"
                        className="p-2 rounded-lg text-[#526B61] dark:text-[#9AB3A8] hover:text-[#102D25] dark:hover:text-[#E8E4D9] hover:bg-[#EFECE3] dark:hover:bg-[#16382E] transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(goal)}
                        title="Excluir Meta"
                        className="p-2 rounded-lg text-[#526B61] dark:text-[#9AB3A8] hover:text-[#B93838] hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modais */}
      <SavingsGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        goalToEdit={editingGoal}
        onSuccess={() => {
          loadGoals();
          if (onDataChanged) onDataChanged();
        }}
      />

      <GoalTransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        goal={activeGoalForTx}
        accounts={accounts}
        initialMode={txModalMode}
        onSuccess={() => {
          loadGoals();
          if (onDataChanged) onDataChanged();
        }}
      />
    </div>
  );
};
