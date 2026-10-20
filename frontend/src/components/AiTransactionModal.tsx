import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Mic, 
  Square, 
  Upload, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle,
  RefreshCw,
  Tag,
  Calendar
} from 'lucide-react';
import { Account, Category, CreateTransactionPayload, TransactionType } from '../types/financial';
import { AiExtractionResponse } from '../types/ai';
import { extractFromTextApi, extractFromAudioApi } from '../services/aiApi';
import { createTransactionApi } from '../services/financialApi';
import { useAuth } from '../context/AuthContext';
import { CurrencyInput } from './CurrencyInput';

interface AiTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts?: Account[];
  categories: Category[];
  onTransactionCreated: () => void;
}

export const AiTransactionModal: React.FC<AiTransactionModalProps> = ({
  isOpen,
  onClose,
  categories,
  onTransactionCreated,
}) => {
  const { token } = useAuth();

  // Abas: 'text' ou 'voice'
  const [activeTab, setActiveTab] = useState<'text' | 'voice'>('text');
  const [inputText, setInputText] = useState('');

  // Estados de gravação de áudio e reconhecimento de voz nativo
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const isRecordingRef = useRef(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const accumulatedTranscriptRef = useRef<string>('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const speechTranscriptRef = useRef<string>('');

  // Estados de IA e Proposta
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successFeedback, setSuccessFeedback] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<AiExtractionResponse | null>(null);

  // Campos editáveis da proposta confirmada
  const [confirmType, setConfirmType] = useState<TransactionType>('EXPENSE');
  const [confirmDescription, setConfirmDescription] = useState('');
  const [confirmAmount, setConfirmAmount] = useState('');
  const [confirmDate, setConfirmDate] = useState('');
  const [confirmCategoryId, setConfirmCategoryId] = useState('');

  // Limpeza de timers, gravador e speech recognition
  useEffect(() => {
    return () => {
      isRecordingRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.stop(); } catch {}
        speechRecognitionRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try { mediaRecorderRef.current.stop(); } catch {}
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, []);

  // Reseta estados quando o modal é aberto ou fechado
  useEffect(() => {
    if (!isOpen) {
      if (isRecordingRef.current) {
        stopRecording();
      }
      setSuccessFeedback(null);
      setError(null);
      setExtractedData(null);
      setInputText('');
      setLiveTranscript('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Pré-preenche os campos de confirmação quando a IA retorna a resposta
  const handleAiSuccess = (data: AiExtractionResponse) => {
    setExtractedData(data);
    setConfirmType(data.type);
    setConfirmDescription(data.description);
    setConfirmAmount(data.amount > 0 ? data.amount.toFixed(2) : '');
    setConfirmDate(data.accrualDate);

    // Sugere categoria casando por ID ou nome
    if (data.suggestedCategoryId) {
      setConfirmCategoryId(data.suggestedCategoryId);
    } else if (data.suggestedCategoryName) {
      const matched = categories.find(
        c => c.name.toLowerCase() === data.suggestedCategoryName?.toLowerCase()
      );
      if (matched) setConfirmCategoryId(matched.id);
    }
  };

  // Processar texto natural
  const handleProcessText = async (textToProcess?: string) => {
    const text = textToProcess || inputText;
    if (!text.trim() || !token) return;

    setError(null);
    setSuccessFeedback(null);
    setIsProcessingAi(true);

    try {
      const response = await extractFromTextApi(token, text.trim());
      handleAiSuccess(response);
    } catch (err: any) {
      setError(err.message || 'Falha ao processar texto pela inteligência artificial.');
    } finally {
      setIsProcessingAi(false);
    }
  };

  // Processar fala capturada em tempo real pela Web Speech API
  const processRecognizedText = async (text: string) => {
    if (!token) return;
    setError(null);
    setSuccessFeedback(null);
    setIsProcessingAi(true);

    try {
      const response = await extractFromTextApi(token, text.trim());
      handleAiSuccess({
        ...response,
        transcribedText: text.trim(),
        origin: 'AI_AUDIO' as any,
      });
    } catch (err: any) {
      setError(err.message || 'Falha ao processar comando de voz.');
    } finally {
      setIsProcessingAi(false);
    }
  };

  // Iniciar gravação de voz com detecção inteligente por dispositivo
  const startRecording = async () => {
    // 1. Verificação de contexto seguro (HTTPS é obrigatório no celular para uso de microfone)
    if (
      typeof window !== 'undefined' &&
      !window.isSecureContext &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      setError(
        'O reconhecimento de voz no celular exige conexão segura (HTTPS). Em conexões HTTP locais (via IP), os navegadores mobile bloqueiam o microfone por segurança.'
      );
      return;
    }

    setError(null);
    setSuccessFeedback(null);
    audioChunksRef.current = [];
    speechTranscriptRef.current = '';
    accumulatedTranscriptRef.current = '';
    setLiveTranscript('');
    isRecordingRef.current = true;

    // 2. Prioridade 1: Web Speech API nativa (Chrome Android, Safari iOS, Edge)
    // NÃO executamos getUserMedia simultaneamente pois no mobile isso bloqueia o hardware do microfone
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      try {
        const recognition = new SpeechRecognitionClass();
        recognition.lang = 'pt-BR';
        recognition.interimResults = true;
        // continuous = false é mais resiliente em celulares Android (evita encerramento silencioso)
        recognition.continuous = false;

        recognition.onresult = (event: any) => {
          let interim = '';
          let finalChunk = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalChunk += transcript + ' ';
            } else {
              interim += transcript;
            }
          }
          if (finalChunk) {
            accumulatedTranscriptRef.current = (
              accumulatedTranscriptRef.current + ' ' + finalChunk
            ).trim();
          }
          const fullDisplay = (
            accumulatedTranscriptRef.current + (interim ? ' ' + interim : '')
          ).trim();
          speechTranscriptRef.current = fullDisplay;
          setLiveTranscript(fullDisplay);
        };

        recognition.onerror = (event: any) => {
          console.warn('SpeechRecognition status/erro:', event.error);
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            isRecordingRef.current = false;
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
            setError('Permissão do microfone negada. Permita o uso do microfone nas configurações do seu navegador.');
          } else if (event.error === 'audio-capture') {
            isRecordingRef.current = false;
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
            setError('Nenhum microfone encontrado ou o microfone está ocupado por outro app.');
          } else if (event.error === 'network') {
            isRecordingRef.current = false;
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
            setError('Erro de conexão ao serviço de voz. Verifique sua conexão com a internet.');
          }
          // 'no-speech' e pausas naturais são tratadas sem abortar a interface
        };

        recognition.onend = () => {
          // Se o usuário ainda não clicou em parar, reinicia a escuta para permitir pausas naturais na fala
          if (isRecordingRef.current) {
            try {
              recognition.start();
            } catch {
              // Já iniciado ou em processo de parada
            }
          }
        };

        recognition.start();
        speechRecognitionRef.current = recognition;
        setIsRecording(true);
        setRecordingSeconds(0);

        timerRef.current = window.setInterval(() => {
          setRecordingSeconds(prev => prev + 1);
        }, 1000);
        return;
      } catch (err) {
        console.warn('Falha ao iniciar SpeechRecognition nativo, caindo para MediaRecorder:', err);
      }
    }

    // 3. Prioridade 2: Fallback para MediaRecorder (para navegadores sem Web Speech API nativa)
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Gravação de microfone não suportada pelo seu navegador atual.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      let selectedMime = '';
      if (typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function') {
        const candidates = [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/mp4',
          'audio/aac',
          'audio/ogg',
        ];
        for (const candidate of candidates) {
          if (MediaRecorder.isTypeSupported(candidate)) {
            selectedMime = candidate;
            break;
          }
        }
      }

      const recorder = selectedMime
        ? new MediaRecorder(stream, { mimeType: selectedMime })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;

        const actualMime = recorder.mimeType || selectedMime || 'audio/webm';
        const cleanMime = actualMime.split(';')[0].trim();
        const ext = cleanMime.includes('mp4')
          ? 'mp4'
          : cleanMime.includes('aac')
          ? 'aac'
          : cleanMime.includes('ogg')
          ? 'ogg'
          : 'webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: cleanMime });

        if (audioBlob.size < 500) {
          setError(
            'A gravação foi muito curta ou o microfone não captou som. Por favor, tente falar novamente mais próximo ao microfone.'
          );
          return;
        }

        await processAudioBlob(audioBlob, `gravacao.${ext}`);
      };

      recorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = window.setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      isRecordingRef.current = false;
      setIsRecording(false);
      setError(
        err.message || 'Não foi possível acessar o microfone. Verifique as permissões do navegador.'
      );
    }
  };

  // Parar gravação de voz
  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    isRecordingRef.current = false;
    setIsRecording(false);

    // Se estava utilizando Web Speech API
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {
        // ignora
      }
      speechRecognitionRef.current = null;

      // Aguarda pequeno intervalo para consolidação do último trecho da transcrição
      setTimeout(() => {
        const capturedText = speechTranscriptRef.current.trim();
        if (capturedText) {
          processRecognizedText(capturedText);
        } else {
          setError(
            'Não foi possível identificar o que foi dito. Fale claramente próximo ao microfone e tente novamente.'
          );
        }
      }, 150);
      return;
    }

    // Se estava utilizando MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.requestData();
      } catch (e) {
        // ignora
      }
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  };

  // Processar áudio (Blob ou File) via backend
  const processAudioBlob = async (blob: Blob, filename = 'gravacao.webm') => {
    if (!token) return;
    setError(null);
    setIsProcessingAi(true);

    try {
      const response = await extractFromAudioApi(token, blob, filename);
      handleAiSuccess(response);
    } catch (err: any) {
      setError(err.message || 'Falha ao transcrever e processar o áudio.');
    } finally {
      setIsProcessingAi(false);
    }
  };

  // Enviar arquivo de áudio manual
  const handleUploadAudioFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setError(null);
    setIsProcessingAi(true);

    try {
      const response = await extractFromAudioApi(token, file, file.name);
      handleAiSuccess(response);
    } catch (err: any) {
      setError(err.message || 'Erro ao processar arquivo de áudio.');
    } finally {
      setIsProcessingAi(false);
    }
  };

  // Salvar transação confirmada (Cálculo e persistência determinística no backend)
  const handleConfirmAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setError(null);
    setIsSaving(true);

    try {
      const val = parseFloat(confirmAmount);
      if (isNaN(val) || val <= 0) {
        throw new Error('Informe um valor monetário válido e maior que zero.');
      }
      if (!confirmDescription.trim()) {
        throw new Error('Informe a descrição da transação.');
      }

      const payload: CreateTransactionPayload = {
        type: confirmType,
        amount: val,
        accrualDate: confirmDate,
        description: confirmDescription.trim(),
        categoryId: confirmCategoryId || undefined,
        notes: `Criado via IA (${extractedData?.origin || 'AI'}) - "${extractedData?.rawInput || ''}"`,
      };

      await createTransactionApi(token, payload);
      onTransactionCreated();

      // Limpa a transação salva e volta para a tela de gravação por microfone
      const savedDesc = confirmDescription.trim();
      setExtractedData(null);
      setInputText('');
      setLiveTranscript('');
      speechTranscriptRef.current = '';
      audioChunksRef.current = [];
      setActiveTab('voice');
      setSuccessFeedback(`Registro "${savedDesc}" salvo com sucesso no seu extrato de movimentações!`);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar transação confirmada.');
    } finally {
      setIsSaving(false);
    }
  };

  // Exemplos rápidos para acelerar a entrada
  const quickExamples = [
    'Almoço executivo 45,50 hoje',
    'Uber 24,90 ontem no cartão',
    'Mercado 135,00 no débito',
    'Salário 5.000 no PIX',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border-2 border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Cabeçalho alegre estilo Duolingo */}
        <div className="p-6 border-b-2 border-slate-100 bg-[#F4FBF4] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-[#58CC02] text-white shadow-[0_3px_0_0_#46A302]">
              <Sparkles className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2">
                <span>Lançamento com IA</span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E8F8E8] text-[#46A302] border border-[#D7FFB8]">
                  Zero Alucinação
                </span>
              </h2>
              <p className="text-xs sm:text-sm font-bold text-slate-400">
                Fale ou digite naturalmente — o sistema estrutura para você!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Abas e Conteúdo */}
        <div className="p-6 overflow-y-auto space-y-6">

          {/* Mensagem de Sucesso após Salvar */}
          {successFeedback && (
            <div className="p-3.5 bg-[#E8F8E8] border-2 border-[#58CC02] rounded-2xl flex items-center justify-between gap-3 text-slate-800 text-xs sm:text-sm font-bold shadow-sm animate-fade-in">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl bg-[#58CC02] text-white shadow-[0_2px_0_0_#46A302]">
                  <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                </div>
                <div>
                  <span className="text-slate-800">{successFeedback}</span>
                  <p className="text-[11px] text-[#46A302] font-extrabold mt-0.5">
                    Você já pode clicar no microfone abaixo e falar o próximo registro!
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSuccessFeedback(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-white/80 transition-colors"
                title="Fechar aviso"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          )}

          {/* Seletor de Modo: Texto ou Voz */}
          {!extractedData && (
            <div className="flex bg-slate-100 p-1.5 rounded-2xl border-2 border-slate-200/80 gap-1.5">
              <button
                type="button"
                onClick={() => { setActiveTab('text'); setError(null); }}
                className={`flex-1 py-2 text-xs sm:text-sm font-black rounded-xl flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'text'
                    ? 'bg-[#58CC02] text-white shadow-[0_3px_0_0_#46A302]'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-white/60'
                }`}
              >
                <Sparkles className="w-4 h-4 stroke-[3]" />
                Texto Natural
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('voice'); setError(null); }}
                className={`flex-1 py-2 text-xs sm:text-sm font-black rounded-xl flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'voice'
                    ? 'bg-[#CE82FF] text-white shadow-[0_3px_0_0_#A64BFF]'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-white/60'
                }`}
              >
                <Mic className="w-4 h-4 stroke-[3]" />
                Comando por Voz
              </button>
            </div>
          )}

          {/* Mensagens de Alerta ou Erro */}
          {error && (
            <div className="p-3.5 bg-rose-50 border-2 border-[#FF4B4B] rounded-2xl flex items-start gap-3 text-[#EA2B2B] text-xs sm:text-sm font-bold">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ETAPA 1: ENTRADA DE DADOS (TEXTO OU VOZ) */}
          {!extractedData && (
            <>
              {activeTab === 'text' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                      Descreva seu gasto ou receita livremente:
                    </label>
                    <div className="relative">
                      <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Ex: Almoço 45 reais no débito hoje, ou Uber 22,50 ontem no cartão..."
                        rows={3}
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-slate-800 font-bold placeholder-slate-400 focus:outline-none focus:border-[#58CC02] focus:bg-white transition-all resize-none"
                      />
                    </div>
                  </div>

                  {/* Exemplos Rápidos */}
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Exemplos rápidos para testar:</p>
                    <div className="flex flex-wrap gap-2">
                      {quickExamples.map((ex) => (
                        <button
                          key={ex}
                          type="button"
                          onClick={() => {
                            setInputText(ex);
                            handleProcessText(ex);
                          }}
                          className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-[#E8F8E8] hover:text-[#46A302] border-2 border-slate-200 hover:border-[#D7FFB8] transition-all"
                        >
                          "{ex}"
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isProcessingAi || !inputText.trim()}
                    onClick={() => handleProcessText()}
                    className="btn-duo btn-duo-green w-full py-3.5 px-4 text-xs sm:text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isProcessingAi ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Interpretando com IA...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 stroke-[3]" />
                        <span>Interpretar Despesa com IA</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* Modo de Gravação por Voz */
                <div className="space-y-6 text-center py-4">
                  <div className="flex flex-col items-center justify-center gap-3">
                    {/* Botão de gravação pulsante */}
                    <div className="relative">
                      {isRecording && (
                        <div className="absolute inset-0 rounded-full bg-[#FF4B4B]/30 animate-ping" />
                      )}
                      <button
                        type="button"
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                          isRecording
                            ? 'bg-[#FF4B4B] text-white shadow-[0_6px_0_0_#EA2B2B] active:translate-y-1'
                            : 'bg-[#58CC02] text-white shadow-[0_6px_0_0_#46A302] hover:bg-[#46A302] active:translate-y-1'
                        }`}
                      >
                        {isRecording ? (
                          <Square className="w-9 h-9 fill-current" />
                        ) : (
                          <Mic className="w-9 h-9 stroke-[2.5]" />
                        )}
                      </button>
                    </div>

                    {isRecording ? (
                      <div className="space-y-2">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-[#EA2B2B] border-2 border-[#FF4B4B]">
                          <span className="w-2 h-2 rounded-full bg-[#FF4B4B] animate-pulse" />
                          Gravando áudio ({String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:{String(recordingSeconds % 60).padStart(2, '0')})
                        </span>
                        {liveTranscript ? (
                          <div className="p-3 bg-purple-50 border-2 border-purple-200 rounded-2xl text-purple-900 font-bold text-xs sm:text-sm max-w-sm mx-auto shadow-sm">
                            <span className="text-[10px] uppercase font-black tracking-wider text-purple-600 block mb-0.5">
                              Ouvindo em tempo real:
                            </span>
                            "{liveTranscript}"
                          </div>
                        ) : (
                          <p className="text-xs font-bold text-slate-400">Fale normalmente e clique no botão vermelho para finalizar.</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <p className="text-xs sm:text-sm font-bold text-slate-600">
                          Clique no microfone e diga, por exemplo: <br />
                          <span className="text-[#58CC02] font-black">"Ifood 49,19 no débito hoje"</span>
                        </p>
                        {successFeedback && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F8E8] text-[#46A302] border border-[#58CC02] text-xs font-black">
                            <span className="w-2 h-2 rounded-full bg-[#58CC02] animate-ping" />
                            <span>Pronto para o próximo! Clique no microfone acima</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Upload alternativo de arquivo de áudio */}
                  <div className="pt-4 border-t-2 border-slate-100">
                    <label className="text-xs font-black text-slate-500 hover:text-slate-800 cursor-pointer inline-flex items-center gap-1.5">
                      <Upload className="w-4 h-4" />
                      Ou envie um áudio gravado (.webm, .mp3, .wav, .m4a)
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={handleUploadAudioFile}
                      />
                    </label>
                  </div>

                  {isProcessingAi && (
                    <div className="flex items-center justify-center gap-2 text-sm font-bold text-[#58CC02] py-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Transcrevendo e estruturando com precisão...
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ETAPA 2: REVISÃO HUMANA E CONFIRMAÇÃO OBRIGATÓRIA (ZERO ALUCINAÇÃO) */}
          {extractedData && (
            <form onSubmit={handleConfirmAndSave} className="space-y-4 animate-fade-in">
              
              {/* Balão de transcrição se veio de voz */}
              {extractedData.transcribedText && (
                <div className="p-3.5 bg-purple-50 border-2 border-[#CE82FF]/40 rounded-2xl text-xs font-bold text-[#A64BFF]">
                  <span className="font-black uppercase tracking-wider block mb-0.5">Transcrição de Voz:</span>
                  "{extractedData.transcribedText}"
                </div>
              )}

              {/* Banner de Validação & Confiança */}
              <div className="flex items-center justify-between p-3.5 bg-[#E8F8E8] border-2 border-[#D7FFB8] rounded-2xl">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#58CC02] stroke-[2.5]" />
                  <span className="text-xs font-black text-slate-700">
                    Dados interpretados. Revise e confirme:
                  </span>
                </div>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-white text-[#46A302] border border-[#58CC02]">
                  {Math.round(extractedData.confidenceScore * 100)}% Confiança
                </span>
              </div>

              {/* Avisos de Ambiguidade se houver */}
              {extractedData.ambiguities && extractedData.ambiguities.length > 0 && (
                <div className="p-3.5 bg-amber-50 border-2 border-[#FFC800] rounded-2xl space-y-1">
                  {extractedData.ambiguities.map((amb, i) => (
                    <p key={i} className="text-xs font-bold text-[#B37800] flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                      {amb}
                    </p>
                  ))}
                </div>
              )}

              {/* Formulário Estruturado Confirmável */}
              <div className="grid grid-cols-2 gap-3">
                {/* Tipo de Transação */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">Tipo</label>
                  <select
                    value={confirmType}
                    onChange={(e) => setConfirmType(e.target.value as TransactionType)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-[#58CC02] focus:bg-white transition-all"
                  >
                    <option value="EXPENSE">Despesa</option>
                    <option value="INCOME">Receita</option>
                    <option value="TRANSFER">Transferência</option>
                  </select>
                </div>

                {/* Valor Monetário (R$) */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">Valor (R$)</label>
                  <CurrencyInput
                    value={confirmAmount}
                    onChangeValue={(val) => setConfirmAmount(val > 0 ? val.toString() : '')}
                    placeholder="0,00"
                    className="bg-slate-50 border-2 border-slate-200 rounded-2xl py-2.5 text-xs sm:text-sm font-black text-slate-800 focus:border-[#58CC02] focus:bg-white"
                  />
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">Descrição</label>
                <input
                  type="text"
                  required
                  value={confirmDescription}
                  onChange={(e) => setConfirmDescription(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-[#58CC02] focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Data de Competência */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Data
                  </label>
                  <input
                    type="date"
                    required
                    value={confirmDate}
                    onChange={(e) => setConfirmDate(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-[#58CC02] focus:bg-white transition-all"
                  />
                </div>

                {/* Categoria Sugerida */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    Categoria
                  </label>
                  <select
                    value={confirmCategoryId}
                    onChange={(e) => setConfirmCategoryId(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-[#58CC02] focus:bg-white transition-all"
                  >
                    <option value="">Sem categoria</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ações: Descartar / Confirmar */}
              <div className="flex gap-3 pt-3 border-t-2 border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setExtractedData(null);
                    setError(null);
                  }}
                  className="btn-duo btn-duo-white flex-1 py-3 text-xs sm:text-sm font-black"
                >
                  Tentar Outra Frase
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-duo btn-duo-green flex-1 py-3 text-xs sm:text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      <span>Confirmar e Salvar</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  );
};
