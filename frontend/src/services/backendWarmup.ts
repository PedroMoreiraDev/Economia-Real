import { API_BASE_URL } from './apiConfig';

/**
 * Serviço de Gerenciamento do Ciclo de Vida e Pré-Aquecimento do Backend.
 * 
 * Resolve o problema de 'Cold Start' (servidor em repouso/hibernação em plataformas
 * como Render, Railway ou Neon Postgres), garantindo:
 * 1. Ping de inicialização imediata ao carregar a página (com timeout estendido de até 45s).
 * 2. Heartbeat silencioso a cada 4 minutos para impedir que o servidor durma enquanto a aba estiver aberta.
 * 3. Reativação automática ao focar a aba ou voltar para o aplicativo (evento visibilitychange).
 */

const PING_INTERVAL_MS = 4 * 60 * 1000; // 4 minutos (Render dorme aos 15 minutos)
const MIN_REPING_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutos de ociosidade antes de aceitar re-ping no foco
const COLD_START_TIMEOUT_MS = 45 * 1000; // 45 segundos para dar tempo do container e JVM subirem

let lastPingTimestamp = 0;
let isPingInProgress = false;
let heartbeatIntervalId: any = null;
let listenersAttached = false;

/**
 * Realiza uma verificação de saúde leve no endpoint /api/v1/health.
 * Não gera logs de erro intrusivos no console.
 */
export async function pingBackend(reason = 'periodic'): Promise<boolean> {
  const now = Date.now();
  if (isPingInProgress) {
    return false;
  }

  // Se já pingou recentemente com sucesso (menos de 2 min), evita requisições redundantes
  if (reason !== 'force' && now - lastPingTimestamp < MIN_REPING_THRESHOLD_MS) {
    return true;
  }

  isPingInProgress = true;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), COLD_START_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });

    if (res.ok) {
      lastPingTimestamp = Date.now();
      return true;
    }
    return false;
  } catch {
    // Falha silenciosa: o backend pode estar no meio do boot ou a rede oscilando
    return false;
  } finally {
    clearTimeout(timeoutId);
    isPingInProgress = false;
  }
}

/**
 * Inicializa os ouvintes de eventos da aba do navegador para manter o servidor ativo
 * e acordá-lo assim que o usuário retornar.
 */
export function initBackendKeepAlive(): void {
  if (listenersAttached || typeof window === 'undefined') {
    return;
  }
  listenersAttached = true;

  // 1. Ping inicial imediato ao abrir o site
  pingBackend('initial');

  // 2. Heartbeat contínuo a cada 4 minutos
  heartbeatIntervalId = setInterval(() => {
    if (document.visibilityState === 'visible') {
      pingBackend('heartbeat');
    }
  }, PING_INTERVAL_MS);

  // 3. Ao voltar para a aba ou janela
  const handleVisibilityOrFocus = () => {
    if (document.visibilityState === 'visible') {
      const elapsed = Date.now() - lastPingTimestamp;
      if (elapsed > MIN_REPING_THRESHOLD_MS) {
        pingBackend('tab_resume');
      }
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityOrFocus);
  window.addEventListener('focus', handleVisibilityOrFocus);

  // 4. Ao passar o mouse pela primeira vez após muito tempo fora
  let userActivityAttached = true;
  const handleFirstActivity = () => {
    const elapsed = Date.now() - lastPingTimestamp;
    if (elapsed > MIN_REPING_THRESHOLD_MS) {
      pingBackend('user_activity');
    }
    if (userActivityAttached) {
      window.removeEventListener('pointerdown', handleFirstActivity);
      userActivityAttached = false;
      // Reativa o listener de toque/clique a cada intervalo para economizar listeners
      setTimeout(() => {
        window.addEventListener('pointerdown', handleFirstActivity, { once: true });
        userActivityAttached = true;
      }, MIN_REPING_THRESHOLD_MS);
    }
  };

  window.addEventListener('pointerdown', handleFirstActivity, { once: true });
}

/**
 * Finaliza o keep-alive (para uso em testes ou limpeza de ciclo de vida).
 */
export function stopBackendKeepAlive(): void {
  if (heartbeatIntervalId) {
    clearInterval(heartbeatIntervalId);
    heartbeatIntervalId = null;
  }
}
