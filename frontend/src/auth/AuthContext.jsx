import { createContext, useContext, useEffect, useState } from 'react';
import { getUtenteCorrente, login as apiLogin, logout as apiLogout } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [utente, setUtente] = useState(null);
  const [caricamento, setCaricamento] = useState(true);

  useEffect(() => {
    getUtenteCorrente()
      .then(setUtente)
      .catch(() => setUtente(null))
      .finally(() => setCaricamento(false));
  }, []);

  async function login(email, password) {
    const u = await apiLogin(email, password);
    setUtente(u);
    return u;
  }

  async function logout() {
    await apiLogout();
    setUtente(null);
  }

  return (
    <AuthContext.Provider value={{ utente, caricamento, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth va usato dentro <AuthProvider>');
  return ctx;
}
