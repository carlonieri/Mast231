import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import SezioneLead from './pages/SezioneLead';
import DettaglioContatto from './pages/DettaglioContatto';
import Esclusi from './pages/Esclusi';
import Dashboard from './pages/Dashboard';
import Richiami from './pages/Richiami';

// Le 5 sezioni della spec (requisito funzionale #6) + "Non interessati", non
// esplicitamente elencata tra le 5 ma necessaria per non nascondere quei
// contatti: leads.stato non ha una casella dedicata alle 5 sezioni, quindi
// "non_interessato" viene mostrato qui a parte per completezza dei dati.
const SEZIONI_CONFIG = [
  { slug: 'acquisiti', titolo: 'Clienti già acquisiti', stati: ['acquisito'] },
  { slug: 'in-acquisizione', titolo: 'Clienti in acquisizione', stati: ['da_contattare', 'contattato'] },
  { slug: 'interessati', titolo: 'Clienti potenziali / interessati', stati: ['interessato'] },
  { slug: 'senza-risposta', titolo: 'Clienti contattati senza risposta', stati: ['senza_risposta'] },
  { slug: 'non-interessati', titolo: 'Non interessati', stati: ['non_interessato'] },
];

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/in-acquisizione" replace />} />
        {SEZIONI_CONFIG.map((cfg) => (
          <Route
            key={cfg.slug}
            path={`/${cfg.slug}`}
            element={<SezioneLead titolo={cfg.titolo} stati={cfg.stati} />}
          />
        ))}
        <Route path="/contatti/:id" element={<DettaglioContatto />} />
        <Route path="/esclusi" element={<Esclusi />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/richiami" element={<Richiami />} />
      </Route>
    </Routes>
  );
}

export default App;
