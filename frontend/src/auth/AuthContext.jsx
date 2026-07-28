import { createContext, useContext, useEffect, useState } from 'react';
import { EVENTO_SESSIONE_SCADUTA, getUtenteCorrente, login as apiLogin, logout as apiLogout } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [utente, setUtente] = useState(null);
  const [caricamento, setCaricamento] = useState(true);
  const [sessioneScaduta, setSessioneScaduta] = useState(false);

  useEffect(() => {
    getUtenteCorrente()
      .then(setUtente)
      .catch(() => setUtente(null))
      .finally(() => setCaricamento(false));
  }, []);

  // Se una richiesta autenticata risponde 401 mentre l'app è aperta (cookie di
  // sessione scaduto), azzera l'utente: RotaProtetta reindirizza già a /login
  // quando utente è null, qui serve solo a far scattare quel meccanismo e a
  // mostrare un messaggio chiaro invece di un semplice redirect silenzioso.
  useEffect(() => {
    function gestisciSessioneScaduta() {
      setUtente(null);
      setSessioneScaduta(true);
    }
    window.addEventListener(EVENTO_SESSIONE_SCADUTA, gestisciSessioneScaduta);
    return () => window.removeEventListener(EVENTO_SESSIONE_SCADUTA, gestisciSessioneScaduta);
  }, []);

  async function login(email, password) {
    const u = await apiLogin(email, password);
    setUtente(u);
    setSessioneScaduta(false);
    return u;
  }

  async function logout() {
    await apiLogout();
    setUtente(null);
  }

  return (
    <AuthContext.Provider value={{ utente, caricamento, sessioneScaduta, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth va usato dentro <AuthProvider>');
  return ctx;
}
