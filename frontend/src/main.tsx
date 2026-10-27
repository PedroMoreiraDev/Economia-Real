import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';
import { initBackendKeepAlive } from './services/backendWarmup';
import { initTelemetry } from './services/telemetryService';

// Inicializa heartbeat e pré-aquecimento do backend para prevenir cold start
initBackendKeepAlive();

// Inicializa telemetria de tráfego, UTMs e métricas de crescimento (GA4 / Funil)
initTelemetry();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
