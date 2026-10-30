import React from 'react';
import { Sparkles, Compass, Eye, EyeOff, Sun, Moon, LogOut, LogIn } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { User } from '../../types/auth';

export interface TopNavigationProps {
  user: User | null;
  isAuthenticated: boolean;
  privacyMode: boolean;
  togglePrivacyMode: () => void;
  onOpenTour: () => void;
  onOpenAuthModal: (mode: 'login' | 'register') => void;
  onWarmUpBackend: () => void;
  onLogout: () => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  user,
  isAuthenticated,
  privacyMode,
  togglePrivacyMode,
  onOpenTour,
  onOpenAuthModal,
  onWarmUpBackend,
  onLogout,
}) => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <header className="glass-panel sticky top-0 z-40 border-b-2 border-slate-200/90 dark:border-slate-800 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        
        {/* Logo e Nome da Plataforma */}
        <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
          <div className="relative group shrink-0">
            <img
              src="/logo-economia-real.png"
              alt="Economia Real - Controle Financeiro Inteligente"
              width={48}
              height={48}
              loading="eager"
              fetchPriority="high"
              className="h-9 w-9 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl object-cover border-2 border-blue-200 shadow-md group-hover:scale-105 transition-transform"
            />
            <span
              className="absolute -bottom-1 -right-1 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full !bg-[#10B981] border-2 border-white dark:border-slate-900 animate-pulse shadow-sm"
              style={{ backgroundColor: '#10B981' }}
              title="Sistema online e conectado"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white truncate">
                Economia<span className="text-[#026CD6] dark:text-sky-400">Real</span>
              </span>
              <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-950/80 dark:to-indigo-950/80 text-blue-900 dark:text-sky-300 border border-blue-200 dark:border-blue-800 shadow-sm uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-[#026CD6] dark:text-sky-400" />
                Inteligência Artificial 🎩
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold hidden sm:block truncate">
              Economia real, utilizando inteligência artificial para te fazer economizar de verdade
            </p>
          </div>
        </div>

        {/* Área Direita: Controles, Perfil e Autenticação */}
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
          {/* Botão do Guia / Tutorial do App */}
          {isAuthenticated && (
            <button
              type="button"
              onClick={onOpenTour}
              className="btn-duo btn-duo-white text-xs px-2 sm:px-3 py-1.5 sm:py-2 flex items-center gap-1 sm:gap-1.5 text-slate-700 hover:text-amber-600 transition-colors"
              title="Abrir o tutorial e guia passo a passo do site"
            >
              <Compass className="h-4 w-4 stroke-[2.5] text-amber-500" />
              <span className="hidden sm:inline">Guia</span>
            </button>
          )}

          {/* Botão de Modo Privacidade (Ocultar/Mostrar Valores) */}
          {isAuthenticated && (
            <button
              type="button"
              onClick={togglePrivacyMode}
              className={`btn-duo text-xs px-2 sm:px-3 py-1.5 sm:py-2 flex items-center gap-1 sm:gap-1.5 transition-all ${
                privacyMode
                  ? 'btn-duo-yellow font-black ring-2 ring-amber-300'
                  : 'btn-duo-white hover:text-[#026CD6]'
              }`}
              title={
                privacyMode
                  ? 'Valores monetários ocultos. Clique para exibir.'
                  : 'Ocultar valores monetários na tela (Modo Privacidade)'
              }
            >
              {privacyMode ? (
                <>
                  <EyeOff className="h-4 w-4 stroke-[2.5]" />
                  <span className="hidden sm:inline">Oculto</span>
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 stroke-[2.5] text-slate-500" />
                  <span className="hidden sm:inline">Privacidade</span>
                </>
              )}
            </button>
          )}

          {/* Alternador de Modo Escuro / Claro usando ThemeContext */}
          <button
            type="button"
            onClick={toggleTheme}
            className="btn-duo btn-duo-white text-xs px-2 sm:px-3 py-1.5 sm:py-2 flex items-center gap-1 sm:gap-1.5 text-slate-700 hover:text-blue-600 transition-colors"
            title={isDarkMode ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
            aria-label={isDarkMode ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
          >
            {isDarkMode ? (
              <>
                <Sun className="h-4 w-4 stroke-[2.5] text-amber-500" />
                <span className="hidden sm:inline">Claro</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 stroke-[2.5] text-indigo-500" />
                <span className="hidden sm:inline">Escuro</span>
              </>
            )}
          </button>

          {/* Autenticação / Perfil do Usuário */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-2xl bg-blue-50/90 dark:bg-slate-800 border-2 border-blue-200 dark:border-slate-700 text-xs shadow-sm">
                <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-xl bg-gradient-to-br from-[#026CD6] to-[#0153AB] border-b-2 border-[#0153AB] text-white font-black flex items-center justify-center text-xs shadow-sm shrink-0">
                  {user.fullName ? user.fullName.substring(0, 1).toUpperCase() : 'U'}
                </div>
                <div className="text-left hidden md:block">
                  <p className="font-extrabold text-slate-800 dark:text-slate-100 leading-tight">{user.fullName}</p>
                  <p className="text-[10px] text-blue-700 dark:text-sky-400 font-bold leading-tight truncate max-w-[140px]">{user.email}</p>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="btn-duo btn-duo-white text-xs px-2 sm:px-3 py-1.5 sm:py-2 flex items-center gap-1 sm:gap-1.5 text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50/50"
                title="Encerrar sessão"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuthModal('login')}
                onMouseEnter={onWarmUpBackend}
                onTouchStart={onWarmUpBackend}
                className="btn-duo btn-duo-white text-xs px-4 py-2"
              >
                <LogIn className="h-4 w-4 mr-1 text-slate-500" />
                Entrar
              </button>
              <button
                onClick={() => onOpenAuthModal('register')}
                onMouseEnter={onWarmUpBackend}
                onTouchStart={onWarmUpBackend}
                className="btn-duo btn-duo-green text-xs px-4 py-2"
              >
                Cadastrar Grátis
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
