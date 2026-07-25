import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errore, setErrore] = useState(null);
  const [inCorso, setInCorso] = useState(false);

  const destinazione = location.state?.da || '/in-acquisizione';

  async function gestisciSubmit(evt) {
    evt.preventDefault();
    setErrore(null);
    setInCorso(true);
    try {
      await login(email, password);
      navigate(destinazione, { replace: true });
    } catch (e) {
      setErrore(e.message);
    } finally {
      setInCorso(false);
    }
  }

  return (
    <div className="pagina-login">
      <form className="scheda-login" onSubmit={gestisciSubmit}>
        <h1>Mast231</h1>
        <p className="testo-muted">Accedi al gestionale email.</p>

        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          required
          disabled={inCorso}
        />

        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          disabled={inCorso}
        />

        {errore && <p className="testo-errore">{errore}</p>}

        <button type="submit" className="btn btn-secondario" disabled={inCorso}>
          {inCorso ? 'Accesso…' : 'Accedi'}
        </button>
      </form>
    </div>
  );
}

export default Login;
