import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { getFollowUp } from '../api/client';

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

  useEffect(() => {
    getFollowUp({ oggi: true })
      .then((r) => setRichiamiOggi(r.length))
      .catch(() => setRichiamiOggi(null));
  }, []);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-titolo">Mast231 — Gestionale email</div>
        <nav className="app-nav">
          {SEZIONI.map((s) => (
            <NavLink key={s.path} to={s.path} className={linkClasse}>
              {s.label}
            </NavLink>
          ))}
          <NavLink to="/dashboard" className={linkClasse}>
            Dashboard
          </NavLink>
          <NavLink to="/richiami" className={linkClasse}>
            Richiami del giorno
            {richiamiOggi !== null && richiamiOggi > 0 && <span className="badge-richiami">{richiamiOggi}</span>}
          </NavLink>
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
