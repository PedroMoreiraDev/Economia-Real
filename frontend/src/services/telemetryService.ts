/**
 * Telemetry & Growth Analytics Service - Economia Real
 * 
 * Gerencia a medição de visitantes, conversões de funil, canais de aquisição (UTMs),
 * ativação de usuários e retenção D7, com integração oficial ao Google Analytics 4 (GA4)
 * e conformidade com a LGPD (sem vazamento de dados bancários ou valores monetários).
 */

export interface AttributionData {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term?: string;
  utm_content?: string;
  referrer: string;
  landing_page: string;
  first_visit_at: string;
  detected_channel: string;
}

export interface TelemetryEvent {
  id: string;
  name: string;
  params: Record<string, any>;
  timestamp: string;
}

const ATTRIBUTION_STORAGE_KEY = 'economia_real_attribution';
const EVENTS_STORAGE_KEY = 'economia_real_telemetry_events';
const ACTIVATED_STORAGE_PREFIX = 'economia_real_activated_';
const SIGNUP_DATE_STORAGE_PREFIX = 'economia_real_signup_';
const RETENTION_TRACKED_PREFIX = 'economia_real_retention_7d_';

let isInitialized = false;
let qualifiedVisitTimer: any = null;
let qualifiedVisitFired = false;

/**
 * Detecta o canal de tráfego com base em parâmetros UTM e no Referrer HTTP
 */
function detectChannel(utmSource: string, referrer: string): string {
  const source = utmSource.toLowerCase();
  const ref = referrer.toLowerCase();

  if (source.includes('instagram') || ref.includes('instagram.com') || ref.includes('l.instagram.com')) {
    return 'Instagram';
  }
  if (source.includes('tiktok') || ref.includes('tiktok.com')) {
    return 'TikTok';
  }
  if (source.includes('youtube') || ref.includes('youtube.com') || ref.includes('youtu.be')) {
    return 'YouTube';
  }
  if (source.includes('reddit') || ref.includes('reddit.com')) {
    return 'Reddit';
  }
  if (source.includes('linkedin') || ref.includes('linkedin.com')) {
    return 'LinkedIn';
  }
  if (source.includes('twitter') || source.includes('x.com') || ref.includes('t.co') || ref.includes('x.com')) {
    return 'Twitter/X';
  }
  if (source.includes('whatsapp') || source.includes('wa.me') || ref.includes('whatsapp.com')) {
    return 'WhatsApp';
  }
  if (source.includes('google') && !ref.includes('google.')) {
    return 'Google Ads';
  }
  if (ref.includes('google.com') || ref.includes('google.com.br')) {
    return 'Google Orgânico';
  }
  if (ref.includes('bing.com')) {
    return 'Bing Orgânico';
  }
  if (source.length > 0) {
    return `Campanha (${utmSource})`;
  }
  if (ref.length > 0) {
    try {
      const url = new URL(referrer);
      return `Referral (${url.hostname})`;
    } catch {
      return 'Referral Externo';
    }
  }

  return 'Acesso Direto';
}

/**
 * Captura e persiste a atribuição de origem (First-Touch Attribution)
 */
export function captureAttribution(): AttributionData {
  try {
    const existing = localStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (existing) {
      return JSON.parse(existing);
    }

    const searchParams = new URLSearchParams(window.location.search);
    const utm_source = searchParams.get('utm_source') || '';
    const utm_medium = searchParams.get('utm_medium') || '';
    const utm_campaign = searchParams.get('utm_campaign') || '';
    const utm_term = searchParams.get('utm_term') || undefined;
    const utm_content = searchParams.get('utm_content') || undefined;
    const referrer = document.referrer || '';
    const landing_page = window.location.pathname + window.location.search;

    const detected_channel = detectChannel(utm_source, referrer);

    const attribution: AttributionData = {
      utm_source: utm_source || (detected_channel === 'Google Orgânico' ? 'google' : (detected_channel === 'Acesso Direto' ? 'direct' : detected_channel.toLowerCase())),
      utm_medium: utm_medium || (detected_channel.includes('Orgânico') ? 'organic' : (detected_channel === 'Acesso Direto' ? 'none' : 'referral')),
      utm_campaign: utm_campaign || 'organico',
      utm_term,
      utm_content,
      referrer,
      landing_page,
      first_visit_at: new Date().toISOString(),
      detected_channel,
    };

    localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(attribution));
    return attribution;
  } catch {
    return {
      utm_source: 'direct',
      utm_medium: 'none',
      utm_campaign: 'organico',
      referrer: '',
      landing_page: '/',
      first_visit_at: new Date().toISOString(),
      detected_channel: 'Acesso Direto',
    };
  }
}

/**
 * Retorna a atribuição gravada para a sessão do usuário
 */
export function getAttribution(): AttributionData {
  try {
    const stored = localStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // Silencioso
  }
  return captureAttribution();
}

/**
 * Salva evento no buffer local para inspeção/diagnóstico (últimos 50 eventos)
 */
function recordLocalEvent(name: string, params: Record<string, any>) {
  try {
    const stored = localStorage.getItem(EVENTS_STORAGE_KEY);
    const events: TelemetryEvent[] = stored ? JSON.parse(stored) : [];
    events.unshift({
      id: Math.random().toString(36).substring(2, 9),
      name,
      params,
      timestamp: new Date().toISOString(),
    });
    // Limita aos 50 mais recentes
    if (events.length > 50) {
      events.length = 50;
    }
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
  } catch {
    // Silencioso
  }
}

/**
 * Dispara evento oficial para o Google Analytics 4 e armazena em buffer local
 */
export function trackEvent(eventName: string, customParams: Record<string, any> = {}) {
  const attribution = getAttribution();

  // Enriquecimento de contexto com origem de canal e anonimização LGPD
  const payload: Record<string, any> = {
    ...customParams,
    channel: attribution.detected_channel,
    utm_source: attribution.utm_source,
    utm_medium: attribution.utm_medium,
    utm_campaign: attribution.utm_campaign,
    page_path: window.location.pathname,
  };

  // 1. Envia para o GA4 via gtag oficial se configurado
  const win = window as any;
  if (typeof win.gtag === 'function') {
    try {
      win.gtag('event', eventName, payload);
    } catch (e) {
      console.warn('[Telemetry] Erro ao despachar evento para GA4:', e);
    }
  }

  // 2. Registra em buffer local
  recordLocalEvent(eventName, payload);

  // 3. Log no console em ambiente de desenvolvimento
  if (import.meta.env.DEV) {
    console.log(
      `%c[Telemetria] %c${eventName}`,
      'color: #026CD6; font-weight: bold;',
      'color: #10B981; font-weight: bold;',
      payload
    );
  }
}

/**
 * Inicializa a telemetria, injeta GA4 se configurado e ativa o rastreador de visita qualificada
 */
export function initTelemetry(): void {
  if (isInitialized) return;
  isInitialized = true;

  // 1. Captura atribuição de origem imediatamente
  captureAttribution();

  // 2. Google Analytics 4 (Carregamento Dinâmico Seguro)
  const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID || (window as any).__GA_MEASUREMENT_ID__;
  if (gaId && typeof gaId === 'string' && gaId.startsWith('G-')) {
    if (!document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${gaId}"]`)) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(script);

      const win = window as any;
      win.dataLayer = win.dataLayer || [];
      function gtag(...args: any[]) {
        win.dataLayer?.push(args);
      }
      win.gtag = gtag;

      win.gtag('js', new Date());
      win.gtag('config', gaId, {
        send_page_view: true,
        anonymize_ip: true,
      });
    }
  }

  // 3. Google Search Console Verification Meta Tag
  const gscCode = import.meta.env.VITE_GSC_VERIFICATION_CODE;
  if (gscCode && !document.querySelector('meta[name="google-site-verification"]')) {
    const meta = document.createElement('meta');
    meta.name = 'google-site-verification';
    meta.content = gscCode;
    document.head.appendChild(meta);
  }

  // 4. Rastreamento de Visita Qualificada (Permanece >= 15s ou rola >= 40% da página)
  if (!qualifiedVisitFired) {
    // Critério 1: Tempo na página
    qualifiedVisitTimer = setTimeout(() => {
      triggerQualifiedVisit('time_spent_15s');
    }, 15000);

    // Critério 2: Rolagem e interação
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0 && (scrollY / docHeight) >= 0.4) {
        triggerQualifiedVisit('scroll_depth_40');
        window.removeEventListener('scroll', handleScroll);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  // Evento inicial de visualização de página
  trackEvent('page_view', { title: document.title });
}

function triggerQualifiedVisit(reason: string) {
  if (qualifiedVisitFired) return;
  qualifiedVisitFired = true;
  if (qualifiedVisitTimer) clearTimeout(qualifiedVisitTimer);

  trackEvent('qualified_visit', { qualified_reason: reason });
}

// =========================================================================
// MÉTODOS DE RASTREAMENTO DO FUNIL DE CONVERSÃO & PRODUTO
// =========================================================================

/**
 * 1. Clique em CTA de Abertura do Modal de Cadastro ou Login
 */
export function trackCtaClick(ctaName: string, location: string) {
  trackEvent('click_cta', { cta_name: ctaName, location });
}

export function trackAuthModalOpen(mode: 'login' | 'register' | 'forgot' | 'verify') {
  trackEvent('auth_modal_open', { auth_mode: mode });
}

/**
 * 2. Conclusão de Cadastro de Usuário (Taxa de Cadastro)
 */
export function trackSignUpCompleted(userId: string) {
  try {
    localStorage.setItem(`${SIGNUP_DATE_STORAGE_PREFIX}${userId}`, new Date().toISOString());
  } catch {
    // Silencioso
  }
  trackEvent('sign_up_completed', { user_id_hash: userId.substring(0, 8) });
}

/**
 * 3. Login de Usuário
 */
export function trackLoginCompleted(userId: string) {
  trackEvent('login_completed', { user_id_hash: userId.substring(0, 8) });
}

/**
 * 4. Cadastro de Transação / Movimentação (Receita, Despesa, Compra de Cartão)
 * Nota: Nunca inclui valor monetário real ou descrição privada (LGPD).
 */
export function trackTransactionCreated(data: {
  type: string;
  inputMethod: 'MANUAL' | 'VOICE_AI' | 'EXCEL_IMPORT' | 'CSV_IMPORT' | 'OFX_IMPORT';
  isRecurring?: boolean;
}) {
  trackEvent('transaction_created', {
    transaction_type: data.type,
    input_method: data.inputMethod,
    is_recurring: !!data.isRecurring,
  });
}

/**
 * 5. Importação de Fatura / Extrato Bancário
 */
export function trackStatementImported(format: 'EXCEL' | 'OFX' | 'CSV', count: number) {
  trackEvent('statement_imported', {
    statement_format: format,
    items_count: count,
  });
}

/**
 * 6. ATIVAÇÃO DO USUÁRIO (O Marco Fundamental)
 * 
 * Critério Canônico do Economia Real:
 * O usuário autenticado cadastrou despesas ou importou uma fatura e visualizou a análise/dashboard útil.
 */
export function trackUserActivation(userId: string, trigger: 'TRANSACTION' | 'STATEMENT_IMPORT' | 'ANALYSIS_VIEW'): boolean {
  if (!userId) return false;

  const storageKey = `${ACTIVATED_STORAGE_PREFIX}${userId}`;
  try {
    const existing = localStorage.getItem(storageKey);
    if (existing) {
      return false; // Já estava ativado anteriormente
    }

    const activationRecord = {
      isActivated: true,
      activatedAt: new Date().toISOString(),
      trigger,
      channel: getAttribution().detected_channel,
    };

    localStorage.setItem(storageKey, JSON.stringify(activationRecord));

    trackEvent('user_activated', {
      activation_trigger: trigger,
      user_id_hash: userId.substring(0, 8),
      channel: getAttribution().detected_channel,
    });

    return true;
  } catch {
    return false;
  }
}

/**
 * Verifica se o usuário atual já está ativado
 */
export function isUserActivated(userId: string): { isActivated: boolean; activatedAt?: string; trigger?: string } {
  if (!userId) return { isActivated: false };
  try {
    const stored = localStorage.getItem(`${ACTIVATED_STORAGE_PREFIX}${userId}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Silencioso
  }
  return { isActivated: false };
}

/**
 * 7. RETENÇÃO EM 7 DIAS (Retention D7)
 * 
 * Verifica se passaram 7 dias desde a data de cadastro do usuário e registra o marco de retorno.
 */
export function checkAndTrackRetention7d(userId: string, accountCreatedAt?: string): boolean {
  if (!userId) return false;

  const trackedKey = `${RETENTION_TRACKED_PREFIX}${userId}`;
  try {
    // Se já foi disparado antes, não dispara novamente
    if (localStorage.getItem(trackedKey)) {
      return false;
    }

    // Obtém data de cadastro salva no localStorage ou passada pela API
    let signupIso = localStorage.getItem(`${SIGNUP_DATE_STORAGE_PREFIX}${userId}`);
    if (!signupIso && accountCreatedAt) {
      signupIso = accountCreatedAt;
      localStorage.setItem(`${SIGNUP_DATE_STORAGE_PREFIX}${userId}`, accountCreatedAt);
    }

    if (!signupIso) {
      // Se não havia registro, inicializa com a data de agora para começar a contar os 7 dias
      localStorage.setItem(`${SIGNUP_DATE_STORAGE_PREFIX}${userId}`, new Date().toISOString());
      return false;
    }

    const signupTime = new Date(signupIso).getTime();
    const nowTime = Date.now();
    const diffDays = (nowTime - signupTime) / (1000 * 60 * 60 * 24);

    // Se tiver 7 dias ou mais desde o cadastro
    if (diffDays >= 7) {
      localStorage.setItem(trackedKey, new Date().toISOString());

      trackEvent('retention_7d', {
        days_since_signup: Math.floor(diffDays),
        user_id_hash: userId.substring(0, 8),
        channel: getAttribution().detected_channel,
      });

      return true;
    }
  } catch {
    // Silencioso
  }

  return false;
}

/**
 * Retorna o histórico de eventos e o diagnóstico de telemetria
 */
export function getTelemetryDiagnostics(userId?: string) {
  const attribution = getAttribution();
  const scriptTag = typeof document !== 'undefined' ? document.querySelector('script[src*="googletagmanager.com/gtag/js?id="]') : null;
  const scriptTagId = scriptTag?.getAttribute('src')?.split('id=')?.[1];
  const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID || (window as any).__GA_MEASUREMENT_ID__ || scriptTagId || 'G-68CZ3WHEMB';
  const gscCode = import.meta.env.VITE_GSC_VERIFICATION_CODE;

  let storedEvents: TelemetryEvent[] = [];
  try {
    const raw = localStorage.getItem(EVENTS_STORAGE_KEY);
    if (raw) storedEvents = JSON.parse(raw);
  } catch {
    // Silencioso
  }

  const activation = userId ? isUserActivated(userId) : { isActivated: false };

  let daysSinceSignup: number | null = null;
  if (userId) {
    try {
      const signupIso = localStorage.getItem(`${SIGNUP_DATE_STORAGE_PREFIX}${userId}`);
      if (signupIso) {
        daysSinceSignup = Math.floor((Date.now() - new Date(signupIso).getTime()) / (1000 * 60 * 60 * 24));
      }
    } catch {
      // Silencioso
    }
  }

  return {
    isGaConfigured: !!(gaId && gaId.startsWith('G-')),
    gaId: gaId || 'Não configurado (defina VITE_GA_MEASUREMENT_ID)',
    isGscConfigured: !!gscCode,
    gscCode: gscCode || 'Não configurado (defina VITE_GSC_VERIFICATION_CODE)',
    attribution,
    activation,
    daysSinceSignup,
    hasRetention7d: userId ? !!localStorage.getItem(`${RETENTION_TRACKED_PREFIX}${userId}`) : false,
    recentEvents: storedEvents,
  };
}
