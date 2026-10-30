import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';
import { initBackendKeepAlive } from './services/backendWarmup';
import { initTelemetry } from './services/telemetryService';

import { ThemeProvider } from './context/ThemeContext';

// Inicializa heartbeat e pré-aquecimento do backend para prevenir cold start
initBackendKeepAlive();

// Inicializa telemetria de tráfego, UTMs e métricas de crescimento (GA4 / Funil)
initTelemetry();

// Registra o Service Worker para suporte a PWA e cache offline
if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Falha silenciosa em ambientes locais restritos
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);

