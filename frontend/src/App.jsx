import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import RotaProtetta from './components/RotaProtetta';
import Layout from './components/Layout';
import Login from './pages/Login';
import SezioneLead from './pages/SezioneLead';
import DettaglioContatto from './pages/DettaglioContatto';
import Esclusi from './pages/Esclusi';
import Dashboard from './pages/Dashboard';
import Richiami from './pages/Richiami';
import CaricaLista from './pages/CaricaLista';
import GestioneUtenti from './pages/GestioneUtenti';

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
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<RotaProtetta />}>
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
            <Route path="/carica-lista" element={<CaricaLista />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/richiami" element={<Richiami />} />
            <Route element={<RotaProtetta soloTitolare />}>
              <Route path="/utenti" element={<GestioneUtenti />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
