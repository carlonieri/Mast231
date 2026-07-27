import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

// Font self-hosted (nessuna richiesta a Google Fonts o altri CDN esterni —
// coerente con un'app che tratta dati di compliance/GDPR). IBM Plex Sans per
// titoli/intestazioni, Public Sans per corpo del testo e dati in tabella —
// vedi styles.css per l'assegnazione dei ruoli.
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-sans/700.css';
import '@fontsource/public-sans/400.css';
import '@fontsource/public-sans/500.css';
import '@fontsource/public-sans/600.css';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
