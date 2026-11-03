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
    <header className="glass-panel sticky top-0 z-40 border-b border-[#D5CFC0] dark:border-[#214E3E] transition-all">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        
        {/* Logo e Nome da Plataforma */}
        <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
          <div className="relative group shrink-0">
            <img
              src="/logo-economia-real.png"
              alt="Economia Real - Gestão Financeira Inteligente"
              width={48}
              height={48}
              loading="eager"
              fetchPriority="high"
              className="h-9 w-9 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl object-cover border border-[#1C4939]/40 dark:border-[#D4A94F]/40 shadow-sm group-hover:scale-105 transition-transform"
            />
            <span
              className="absolute -bottom-1 -right-1 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-[#D4A94F] border-2 border-[#FAF8F4] dark:border-[#102D25] shadow-xs"
              title="Motor contábil online e conectado"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <span className="text-lg sm:text-2xl font-extrabold tracking-tight text-[#102D25] dark:text-[#E8E4D9] truncate">
                Economia<span className="text-[#1C4939] dark:text-[#D4A94F]">Real</span>
              </span>
              <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#102D25] text-[#D4A94F] border border-[#D4A94F]/40 shadow-xs uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-[#D4A94F]" />
                Inteligência Artificial
              </span>
            </div>
            <p className="text-xs text-[#526B61] dark:text-[#9AB3A8] font-semibold hidden sm:block truncate">
              Gestão financeira pessoal com precisão contábil e IA
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
              className="btn-duo btn-duo-white text-xs px-2 sm:px-3 py-1.5 sm:py-2 flex items-center gap-1 sm:gap-1.5 text-[#102D25] dark:text-[#E8E4D9] hover:border-[#D4A94F] transition-colors"
              title="Abrir o tutorial e guia passo a passo do site"
            >
              <Compass className="h-4 w-4 stroke-[2.2] text-[#D4A94F]" />
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
                  ? 'btn-duo-yellow font-extrabold ring-2 ring-[#D4A94F]/40'
                  : 'btn-duo-white hover:text-[#1C4939] dark:hover:text-[#D4A94F]'
              }`}
              title={
                privacyMode
                  ? 'Valores monetários ocultos. Clique para exibir.'
                  : 'Ocultar valores monetários na tela (Modo Privacidade)'
              }
            >
              {privacyMode ? (
                <>
                  <EyeOff className="h-4 w-4 stroke-[2.2]" />
                  <span className="hidden sm:inline">Oculto</span>
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 stroke-[2.2] text-[#526B61] dark:text-[#9AB3A8]" />
                  <span className="hidden sm:inline">Privacidade</span>
                </>
              )}
            </button>
          )}

          {/* Alternador de Modo Escuro / Claro usando ThemeContext */}
          <button
            type="button"
            onClick={toggleTheme}
            className="btn-duo btn-duo-white text-xs px-2 sm:px-3 py-1.5 sm:py-2 flex items-center gap-1 sm:gap-1.5 text-[#102D25] dark:text-[#E8E4D9] transition-colors"
            title={isDarkMode ? 'Alternar para Modo Claro (Off-white)' : 'Alternar para Modo Escuro (Verde Escuro)'}
            aria-label={isDarkMode ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
          >
            {isDarkMode ? (
              <>
                <Sun className="h-4 w-4 stroke-[2.2] text-[#D4A94F]" />
                <span className="hidden sm:inline">Claro</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 stroke-[2.2] text-[#1C4939]" />
                <span className="hidden sm:inline">Escuro</span>
              </>
            )}
          </button>

          {/* Autenticação / Perfil do Usuário */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-[#EFECE3] dark:bg-[#16382E] border border-[#D5CFC0] dark:border-[#285C49] text-xs shadow-2xs">
                <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-[#102D25] dark:bg-[#D4A94F] text-[#D4A94F] dark:text-[#102D25] font-extrabold flex items-center justify-center text-xs shrink-0 border border-[#D4A94F]/30">
                  {user.fullName ? user.fullName.substring(0, 1).toUpperCase() : 'U'}
                </div>
                <div className="text-left hidden md:block">
                  <p className="font-extrabold text-[#102D25] dark:text-[#E8E4D9] leading-tight">{user.fullName}</p>
                  <p className="text-[10px] text-[#526B61] dark:text-[#D4A94F] font-semibold leading-tight truncate max-w-[140px]">{user.email}</p>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="btn-duo btn-duo-white text-xs px-2 sm:px-3 py-1.5 sm:py-2 flex items-center gap-1 sm:gap-1.5 text-[#B93838] hover:text-rose-700 border-rose-200 hover:bg-rose-50/50"
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
                <LogIn className="h-4 w-4 mr-1 text-[#1C4939] dark:text-[#D4A94F]" />
                Entrar
              </button>
              <button
                onClick={() => onOpenAuthModal('register')}
                onMouseEnter={onWarmUpBackend}
                onTouchStart={onWarmUpBackend}
                className="btn-duo btn-duo-green text-xs px-4 py-2"
              >
                Abrir Conta Grátis
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
