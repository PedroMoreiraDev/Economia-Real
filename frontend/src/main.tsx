import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';
import { initBackendKeepAlive } from './services/backendWarmup';

// Inicializa heartbeat e pré-aquecimento do backend para prevenir cold start
initBackendKeepAlive();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
