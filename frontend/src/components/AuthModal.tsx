import React, { useState } from 'react';
import { Lock, Mail, User, AlertCircle, CheckCircle2, X, Eye, EyeOff } from 'lucide-react';
import { loginApi, registerApi, AuthApiException } from '../services/authApi';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { login } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const response = await loginApi({ email, password });
        login(response.accessToken, {
          id: response.userId,
          email: response.email,
          fullName: response.fullName,
        });
        setSuccessMessage('Login efetuado com sucesso!');
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        const response = await registerApi({ email, fullName, password });
        login(response.accessToken, {
          id: response.userId,
          email: response.email,
          fullName: response.fullName,
        });
        setSuccessMessage('Conta criada e autenticada com sucesso!');
        setTimeout(() => {
          onClose();
        }, 600);
      }
    } catch (err) {
      if (err instanceof AuthApiException) {
        setErrorMessage(err.apiError.message || 'Falha ao autenticar.');
        if (err.apiError.details) {
          setFieldErrors(err.apiError.details);
        }
      } else {
        setErrorMessage('Não foi possível conectar ao servidor. Verifique se o backend está em execução.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md rounded-3xl bg-white border-2 border-slate-200 shadow-2xl p-6 sm:p-8 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="Fechar"
        >
          <X className="h-5 w-5 stroke-[2.5]" />
        </button>

        {/* Header e Abas */}
        <div className="text-center space-y-1 mb-6">
          <img
            src="/logo-economia-real.png"
            alt="Economia Real"
            className="inline-block h-16 w-16 rounded-3xl object-cover border-2 border-blue-200 shadow-[0_4px_0_0_#BFDBFE] mb-3"
          />
          <h2 className="text-2xl font-black tracking-tight text-slate-800">
            {mode === 'login' ? 'Entrar na Economia Real' : 'Criar Nova Conta'}
          </h2>
          <p className="text-xs sm:text-sm font-bold text-slate-500">
            Economia real, utilizando inteligência artificial para te fazer economizar de verdade
          </p>

          <div className="flex bg-slate-100 p-1.5 rounded-2xl mt-4 border-2 border-slate-200/80 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
                setFieldErrors({});
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-black rounded-xl transition-all ${
                mode === 'login'
                  ? 'bg-[#026CD6] text-white shadow-[0_3px_0_0_#0153AB]'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-white/60'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
                setFieldErrors({});
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-black rounded-xl transition-all ${
                mode === 'register'
                  ? 'bg-[#026CD6] text-white shadow-[0_3px_0_0_#0153AB]'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-white/60'
              }`}
            >
              Cadastrar
            </button>
          </div>
        </div>

        {/* Feedback de Erro ou Sucesso */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border-2 border-[#FF4B4B] flex items-start gap-2.5 text-xs sm:text-sm font-bold text-[#EA2B2B]">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-blue-50 border-2 border-[#026CD6] flex items-center gap-2.5 text-xs sm:text-sm font-bold text-[#026CD6]">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500">Nome Completo</label>
              <div className="relative">
                <User className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Pedro Silva"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#026CD6] focus:bg-white transition-all"
                />
              </div>
              {fieldErrors.fullName && (
                <p className="text-xs font-bold text-[#EA2B2B] mt-0.5">{fieldErrors.fullName}</p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500">E-mail</label>
            <div className="relative">
              <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#026CD6] focus:bg-white transition-all"
              />
            </div>
            {fieldErrors.email && (
              <p className="text-xs font-bold text-[#EA2B2B] mt-0.5">{fieldErrors.email}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500">Senha</label>
            <div className="relative">
              <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Mínimo de 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#026CD6] focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-xs font-bold text-[#EA2B2B] mt-0.5">{fieldErrors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-duo btn-duo-green w-full mt-3 py-3 px-4 text-xs sm:text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processando...
              </span>
            ) : mode === 'login' ? (
              'Entrar na Plataforma'
            ) : (
              'Criar Minha Conta'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
