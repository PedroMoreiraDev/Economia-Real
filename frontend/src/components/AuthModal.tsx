import React, { useState, useEffect, useCallback } from 'react';
import {
  Lock,
  Mail,
  User,
  AlertCircle,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  ShieldCheck,
  RefreshCw,
  KeyRound,
  ArrowRight,
  Send,
} from 'lucide-react';
import {
  loginApi,
  registerApi,
  verifyEmailApi,
  resendVerificationCodeApi,
  fetchCaptchaApi,
  AuthApiException,
} from '../services/authApi';
import { useAuth } from '../context/AuthContext';
import { CaptchaChallenge } from '../types/auth';

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
  const [mode, setMode] = useState<'login' | 'register' | 'verify'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendingCode, setResendingCode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Estado do CAPTCHA nativo
  const [captcha, setCaptcha] = useState<CaptchaChallenge | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [loadingCaptcha, setLoadingCaptcha] = useState(false);

  const { login } = useAuth();

  const loadCaptcha = useCallback(async () => {
    setLoadingCaptcha(true);
    try {
      const challenge = await fetchCaptchaApi();
      setCaptcha(challenge);
      setCaptchaAnswer('');
    } catch {
      // Falha silenciosa ou fallback; o backend aceitará se não for estritamente obrigatório em offline
    } finally {
      setLoadingCaptcha(false);
    }
  }, []);

  // Sempre que o modal abrir ou mudar de modo (exceto verify), atualiza o CAPTCHA
  useEffect(() => {
    if (isOpen && mode !== 'verify') {
      loadCaptcha();
    }
  }, [isOpen, mode, loadCaptcha]);

  // Ao fechar ou resetar
  useEffect(() => {
    if (!isOpen) {
      setErrorMessage(null);
      setFieldErrors({});
      setSuccessMessage(null);
      setVerificationCode('');
      setCaptchaAnswer('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const response = await loginApi({
          email: email.trim(),
          password,
          captchaToken: captcha?.token,
          captchaAnswer: captchaAnswer.trim(),
        });
        login(response.accessToken, {
          id: response.userId,
          email: response.email,
          fullName: response.fullName,
        });
        setSuccessMessage('Login efetuado com sucesso!');
        setTimeout(() => {
          onClose();
        }, 600);
      } else if (mode === 'register') {
        const response = await registerApi({
          email: email.trim(),
          fullName: fullName.trim(),
          password,
          captchaToken: captcha?.token,
          captchaAnswer: captchaAnswer.trim(),
        });

        if (response.requiresVerification) {
          setSuccessMessage(
            response.message || 'Código de verificação enviado! Confira a sua caixa de entrada.'
          );
          setMode('verify');
        } else {
          setSuccessMessage('Conta cadastrada com sucesso!');
          setTimeout(() => {
            onClose();
          }, 600);
        }
      } else if (mode === 'verify') {
        const response = await verifyEmailApi({
          email: email.trim(),
          code: verificationCode.trim(),
        });
        login(response.accessToken, {
          id: response.userId,
          email: response.email,
          fullName: response.fullName,
        });
        setSuccessMessage('Conta verificada e ativada com sucesso!');
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } catch (err) {
      if (err instanceof AuthApiException) {
        const msg = err.apiError.message || 'Falha na autenticação.';
        setErrorMessage(msg);
        if (err.apiError.details) {
          setFieldErrors(err.apiError.details);
        }

        // Se o erro for de e-mail não verificado, sugere ir para tela de verificação
        if (err.apiError.status === 403 || msg.toLowerCase().includes('confirme seu e-mail') || msg.toLowerCase().includes('código de verificação')) {
          setMode('verify');
        }

        // Se o erro foi relacionado ao CAPTCHA, renova o desafio
        if (msg.toLowerCase().includes('captcha') || msg.toLowerCase().includes('humana') || msg.toLowerCase().includes('desafio')) {
          loadCaptcha();
        }
      } else {
        setErrorMessage('Não foi possível conectar ao servidor. Verifique a conexão.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      setErrorMessage('Informe o e-mail para receber um novo código.');
      return;
    }
    setResendingCode(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await resendVerificationCodeApi({ email: email.trim() });
      setSuccessMessage(res.message || 'Novo código de 6 dígitos enviado com sucesso!');
    } catch (err) {
      if (err instanceof AuthApiException) {
        setErrorMessage(err.apiError.message || 'Não foi possível reenviar o código.');
      } else {
        setErrorMessage('Erro ao solicitar reenvio de código.');
      }
    } finally {
      setResendingCode(false);
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
            {mode === 'login'
              ? 'Entrar na Economia Real'
              : mode === 'register'
              ? 'Criar Nova Conta'
              : 'Verificar E-mail'}
          </h2>
          <p className="text-xs sm:text-sm font-bold text-slate-500">
            {mode === 'verify'
              ? 'Insira o código de 6 dígitos enviado para seu e-mail para ativar seu acesso.'
              : 'Economia real, utilizando inteligência artificial para te fazer economizar de verdade'}
          </p>

          {mode !== 'verify' && (
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
          )}
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

        {/* MODO DE VERIFICAÇÃO DE 6 DÍGITOS */}
        {mode === 'verify' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 text-center">
              <p className="text-xs text-slate-500 font-bold mb-1">Código enviado para:</p>
              <p className="text-sm font-black text-slate-800">{email || 'seu e-mail'}</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 text-center">
                Código de 6 Dígitos
              </label>
              <div className="relative">
                <KeyRound className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  autoFocus
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-[0.4em] font-mono pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xl font-black text-slate-800 placeholder-slate-300 focus:outline-none focus:border-[#026CD6] focus:bg-white transition-all"
                />
              </div>
              {fieldErrors.code && (
                <p className="text-xs font-bold text-[#EA2B2B] text-center mt-0.5">{fieldErrors.code}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || verificationCode.length < 6}
              className="btn-duo btn-duo-green w-full py-3 px-4 text-xs sm:text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Validando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Ativar Minha Conta <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>

            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendingCode}
                className="font-bold text-[#026CD6] hover:underline flex items-center gap-1 disabled:opacity-50"
              >
                <Send className="h-3 w-3" />
                {resendingCode ? 'Reenviando...' : 'Reenviar código'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="font-bold text-slate-500 hover:text-slate-800"
              >
                Voltar ao Login
              </button>
            </div>
          </form>
        ) : (
          /* MODO DE LOGIN OU REGISTRO */
          <form onSubmit={handleSubmit} className="space-y-3.5">
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

            {/* WIDGET DE CAPTCHA NATIVO */}
            {captcha && (
              <div className="p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-[#026CD6]" />
                    Verificação Humana
                  </span>
                  <button
                    type="button"
                    onClick={loadCaptcha}
                    disabled={loadingCaptcha}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                    title="Novo desafio"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loadingCaptcha ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="px-3 py-1.5 bg-blue-100/70 border border-blue-200 rounded-xl font-black text-sm text-[#026CD6] select-none tracking-wider">
                    {captcha.question} = ?
                  </div>
                  <input
                    type="number"
                    required
                    placeholder="Resultado"
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#026CD6] transition-all"
                  />
                </div>
                {fieldErrors.captcha && (
                  <p className="text-xs font-bold text-[#EA2B2B] mt-0.5">{fieldErrors.captcha}</p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-duo btn-duo-green w-full mt-2 py-3 px-4 text-xs sm:text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50"
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
        )}
      </div>
    </div>
  );
};
