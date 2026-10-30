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
}

export const SavingsGoalsSection: React.FC<SavingsGoalsSectionProps> = ({
  accounts,
  onDataChanged,
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
      
      {/* Cabeçalho Estilo Duolingo */}
      <div className="card-duo p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-slate-100 pb-5">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
              <span className="text-2xl">🎯</span>
              <span>Metas de Economia & Conquistas</span>
            </h2>
            <p className="text-xs sm:text-sm font-bold text-slate-500">
              Transforme seus sonhos em realidade guardando um pouquinho a cada mês!
            </p>
          </div>

          <button
            onClick={() => {
              setEditingGoal(null);
              setIsGoalModalOpen(true);
            }}
            className="btn-duo btn-duo-green text-xs sm:text-sm px-4 py-2.5 flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Criar Nova Meta</span>
          </button>
        </div>

        {feedbackMessage && (
          <div
            className={`flex items-center space-x-2.5 p-3.5 rounded-2xl text-xs font-black border-2 ${
              feedbackMessage.type === 'success'
                ? 'bg-[#E8F8E8] border-[#D7FFB8] text-[#388302]'
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{feedbackMessage.text}</span>
          </div>
        )}

        {/* 3 Cards de Resumo Gamificados */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-5 rounded-3xl bg-[#F4FBF4] dark:bg-emerald-950/20 border-2 border-emerald-200 dark:border-emerald-800/40 shadow-[0_3px_0_0_#D1FAE5] dark:shadow-[0_3px_0_0_#064E3B]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Total Poupado
              </span>
              <Coins className="w-5 h-5 text-[#58CC02]" />
            </div>
            <div className="mt-2">
              <span className="text-2xl sm:text-3xl font-black text-[#46A302]">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSaved)}
              </span>
            </div>
            <span className="text-xs font-bold text-slate-500 mt-1 block">
              Guardado em caixinhas seguras
            </span>
          </div>

          <div className="p-5 rounded-3xl bg-[#DDF4FF] border-2 border-[#BAE6FD] shadow-[0_3px_0_0_#BAE6FD]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Objetivo Global
              </span>
              <Target className="w-5 h-5 text-[#1CB0F6]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalTarget)}
              </span>
              <span className="text-xs font-black text-[#1899D6]">({overallPercentage.toFixed(0)}%)</span>
            </div>
            <span className="text-xs font-bold text-slate-500 mt-1 block">
              Soma de todas as metas
            </span>
          </div>

          <div className="p-5 rounded-3xl bg-[#FFF5D1] border-2 border-[#FDE68A] shadow-[0_3px_0_0_#FDE68A]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-800">
                Metas Conquistadas
              </span>
              <Trophy className="w-5 h-5 text-amber-500 fill-amber-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-amber-950">
                {completedGoalsCount}
              </span>
              <span className="text-xs font-extrabold text-amber-800">de {goals.length} metas</span>
            </div>
            <span className="text-xs font-bold text-amber-700 mt-1 block">
              {completedGoalsCount > 0 ? 'Parabéns pelo foco! 🏆' : 'Em andamento'}
            </span>
          </div>
        </div>

        {/* Lista de Metas */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm font-bold">Carregando metas...</div>
        ) : goals.length === 0 ? (
          <div className="p-10 rounded-3xl border-2 border-dashed border-slate-200 dark:!border-slate-800 dark:!bg-[#070C14] text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-[#D7FFB8] dark:!bg-[#0F1E36] text-3xl flex items-center justify-center mx-auto shadow-sm border-2 border-transparent dark:!border-emerald-800/80">
              ✨
            </div>
            <h3 className="text-base font-black text-slate-800 dark:!text-white">Nenhuma meta criada ainda</h3>
            <p className="text-xs font-bold text-slate-400 dark:!text-slate-200 max-w-sm mx-auto">
              Defina uma meta para reserva de emergência, uma viagem de férias ou um sonho que queira realizar!
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
                  className={`rounded-3xl border-2 p-6 transition-all flex flex-col justify-between relative overflow-hidden shadow-[0_4px_0_0_#E2E8F0] dark:shadow-[0_4px_0_0_#020617] ${
                    goal.isReached
                      ? 'bg-gradient-to-br from-[#F4FBF4] to-[#E8F8E8] dark:from-emerald-950/40 dark:to-slate-900 border-[#58CC02] dark:border-emerald-600 shadow-[0_4px_0_0_#A7F3D0] dark:shadow-[0_4px_0_0_#064E3B]'
                      : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-emerald-300'
                  }`}
                >
                  {goal.isReached && (
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFC800] text-amber-950 border-2 border-[#E5A500] text-[11px] font-black shadow-sm uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Conquistada! 🎉</span>
                    </div>
                  )}

                  <div>
                    <div className="mb-4 pr-16">
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">{goal.title}</h3>
                      {goal.targetDate && (
                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1 mt-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Alvo: {new Date(goal.targetDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                        </span>
                      )}
                    </div>

                    {/* Barra de Progresso Estilo Duolingo */}
                    <div className="space-y-1.5 my-4">
                      <div className="flex justify-between text-xs font-black">
                        <span className="text-slate-500 uppercase tracking-wider text-[10px]">Progresso</span>
                        <span className={goal.isReached ? 'text-[#46A302] font-black' : 'text-slate-800'}>
                          {goal.progressPercentage.toFixed(0)}%
                        </span>
                      </div>
                      <div className="progress-duo-track h-4">
                        <div
                          className={`progress-duo-fill ${
                            goal.isReached
                              ? 'bg-[#58CC02]'
                              : pct >= 50
                              ? 'bg-[#1CB0F6]'
                              : 'bg-[#FF9600]'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Valores Numéricos */}
                    <div className="grid grid-cols-2 gap-2 p-3.5 rounded-2xl bg-slate-50 dark:!bg-[#0F172A] border-2 border-slate-100 dark:!border-slate-800 text-xs mb-4">
                      <div>
                        <span className="text-[10px] uppercase font-black text-slate-400 dark:!text-slate-400 block tracking-wider">Acumulado</span>
                        <span className="font-black text-[#46A302] dark:!text-emerald-400 text-sm sm:text-base">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(goal.currentAmount)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-black text-slate-400 dark:!text-slate-400 block tracking-wider">Objetivo</span>
                        <span className="font-black text-slate-900 dark:!text-white text-sm sm:text-base">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(goal.targetAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="pt-3 border-t-2 border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenTx(goal, 'deposit')}
                        className="btn-duo btn-duo-green text-xs px-3 py-1.5 flex items-center gap-1"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Guardar</span>
                      </button>
                      {goal.currentAmount > 0 && (
                        <button
                          onClick={() => handleOpenTx(goal, 'withdraw')}
                          className="btn-duo btn-duo-white text-xs px-3 py-1.5 flex items-center gap-1"
                        >
                          <ArrowDownLeft className="w-3.5 h-3.5 stroke-[3]" />
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
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(goal)}
                        title="Excluir Meta"
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
