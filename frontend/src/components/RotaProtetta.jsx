import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

// Richiede una sessione valida (reindirizza a /login altrimenti). Con
// soloTitolare, richiede anche il ruolo titolare — l'applicazione reale del
// vincolo resta comunque lato server (le route /api/utenti rispondono 403 a
// un operatore): questo è solo per non mostrare una pagina inutilizzabile.
function RotaProtetta({ soloTitolare = false }) {
  const { utente, caricamento } = useAuth();
  const location = useLocation();

  if (caricamento) return <p>Caricamento…</p>;
  if (!utente) return <Navigate to="/login" replace state={{ da: location.pathname }} />;
  if (soloTitolare && utente.ruolo !== 'titolare') return <Navigate to="/in-acquisizione" replace />;

  return <Outlet />;
}

export default RotaProtetta;
