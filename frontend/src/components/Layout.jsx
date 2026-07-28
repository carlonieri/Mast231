import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { EVENTO_RICHIAMI_AGGIORNATI, getFollowUp } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import AssistenteChat from './AssistenteChat';
import MarchioAnchorAI from './MarchioAnchorAI';

const SEZIONI = [
  { path: '/acquisiti', label: 'Acquisiti' },
  { path: '/in-acquisizione', label: 'In acquisizione' },
  { path: '/interessati', label: 'Interessati' },
  { path: '/senza-risposta', label: 'Senza risposta' },
  { path: '/non-interessati', label: 'Non interessati' },
  { path: '/esclusi', label: 'Esclusi' },
];

function linkClasse({ isActive }) {
  return isActive ? 'nav-link nav-link-attivo' : 'nav-link';
}

function Layout() {
  const [richiamiOggi, setRichiamiOggi] = useState(null);
  const { utente, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    function carica() {
      getFollowUp({ oggi: true })
        .then((r) => setRichiamiOggi(r.length))
        .catch(() => setRichiamiOggi(null));
    }
    // La sidebar resta montata per tutta la sessione (non si ricarica
    // navigando tra le pagine): senza questo listener il numero restava
    // fermo al valore del primo caricamento anche dopo aver evaso o preso in
    // carico un richiamo da /richiami.
    carica();
    window.addEventListener(EVENTO_RICHIAMI_AGGIORNATI, carica);
    return () => window.removeEventListener(EVENTO_RICHIAMI_AGGIORNATI, carica);
  }, []);

  async function gestisciLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-titolo">Mast231</div>
          <div className="sidebar-sottotitolo">Gestionale email</div>
          <MarchioAnchorAI />
        </div>

        {/* Raggruppate per priorità/frequenza d'uso, non un elenco piatto:
            cosa fare oggi, poi i contatti (lavoro quotidiano), poi analisi
            periodica, infine amministrazione (rara, solo titolare). */}
        <nav className="sidebar-nav">
          <div className="sidebar-gruppo">
            <div className="sidebar-gruppo-titolo">Oggi</div>
            <NavLink to="/richiami" className="sidebar-card-richiami">
              <span className="sidebar-card-richiami-etichetta">Richiami del giorno</span>
              <span className="sidebar-card-richiami-numero">{richiamiOggi ?? '—'}</span>
            </NavLink>
            <NavLink to="/carica-lista" className={linkClasse}>
              Carica lista
            </NavLink>
          </div>

          <div className="sidebar-gruppo">
            <div className="sidebar-gruppo-titolo">Contatti</div>
            {SEZIONI.map((s) => (
              <NavLink key={s.path} to={s.path} className={linkClasse}>
                {s.label}
              </NavLink>
            ))}
          </div>

          <div className="sidebar-gruppo">
            <div className="sidebar-gruppo-titolo">Analisi</div>
            <NavLink to="/dashboard" className={linkClasse}>
              Dashboard
            </NavLink>
          </div>

          {utente?.ruolo === 'titolare' && (
            <div className="sidebar-gruppo sidebar-gruppo-admin">
              <div className="sidebar-gruppo-titolo">Amministrazione</div>
              <NavLink to="/utenti" className={linkClasse}>
                Gestione utenti
              </NavLink>
            </div>
          )}
        </nav>

        <div className="sidebar-utente">
          <span>{utente?.nome}</span>
          <button type="button" className="btn btn-piccolo" onClick={gestisciLogout}>
            Esci
          </button>
        </div>
      </aside>

      <main className="app-main">
        <Outlet />
      </main>
      <AssistenteChat />
    </div>
  );
}

export default Layout;
