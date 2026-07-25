import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { getFollowUp } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import AssistenteChat from './AssistenteChat';

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
    getFollowUp({ oggi: true })
      .then((r) => setRichiamiOggi(r.length))
      .catch(() => setRichiamiOggi(null));
  }, []);

  async function gestisciLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-titolo-riga">
          <div className="app-titolo">Mast231 — Gestionale email</div>
          <div className="app-utente">
            <span>{utente?.nome}</span>
            <button type="button" className="btn btn-piccolo" onClick={gestisciLogout}>
              Esci
            </button>
          </div>
        </div>
        <nav className="app-nav">
          {SEZIONI.map((s) => (
            <NavLink key={s.path} to={s.path} className={linkClasse}>
              {s.label}
            </NavLink>
          ))}
          <NavLink to="/carica-lista" className={linkClasse}>
            Carica lista
          </NavLink>
          <NavLink to="/dashboard" className={linkClasse}>
            Dashboard
          </NavLink>
          <NavLink to="/richiami" className={linkClasse}>
            Richiami del giorno
            {richiamiOggi !== null && richiamiOggi > 0 && <span className="badge-richiami">{richiamiOggi}</span>}
          </NavLink>
          {utente?.ruolo === 'titolare' && (
            <NavLink to="/utenti" className={linkClasse}>
              Gestione utenti
            </NavLink>
          )}
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <AssistenteChat />
    </div>
  );
}

export default Layout;
