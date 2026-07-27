import { useEffect, useState } from 'react';
import { getUtenti, creaUtenteAccount, aggiornaUtenteAccount } from '../api/client';
import { formatDataOra } from '../utils/formato';

function NuovoUtenteForm({ onCreato }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ruolo, setRuolo] = useState('operatore');
  const [inCorso, setInCorso] = useState(false);
  const [errore, setErrore] = useState(null);

  async function gestisciSubmit(evt) {
    evt.preventDefault();
    setInCorso(true);
    setErrore(null);
    try {
      await creaUtenteAccount({ nome, email, password, ruolo });
      setNome('');
      setEmail('');
      setPassword('');
      setRuolo('operatore');
      onCreato();
    } catch (e) {
      setErrore(e.message);
    } finally {
      setInCorso(false);
    }
  }

  return (
    <form onSubmit={gestisciSubmit}>
      <div className="filtri-riga">
        <input type="text" placeholder="Nome e cognome" value={nome} onChange={(e) => setNome(e.target.value)} disabled={inCorso} required />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={inCorso} required />
        <input
          type="password"
          placeholder="Password iniziale"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={inCorso}
          required
        />
        <select value={ruolo} onChange={(e) => setRuolo(e.target.value)} disabled={inCorso}>
          <option value="operatore">Operatore</option>
          <option value="titolare">Titolare</option>
        </select>
        <button type="submit" className="btn btn-primario" disabled={inCorso}>
          {inCorso ? 'Creazione…' : 'Crea account'}
        </button>
      </div>
      {errore && <p className="testo-errore">{errore}</p>}
    </form>
  );
}

function RigaUtente({ utente, onAggiornato }) {
  const [nuovaPassword, setNuovaPassword] = useState('');
  const [inCorso, setInCorso] = useState(false);
  const [errore, setErrore] = useState(null);

  async function cambiaAttivo() {
    setInCorso(true);
    setErrore(null);
    try {
      await aggiornaUtenteAccount(utente.id, { attivo: !utente.attivo });
      onAggiornato();
    } catch (e) {
      setErrore(e.message);
    } finally {
      setInCorso(false);
    }
  }

  async function resettaPassword() {
    if (!nuovaPassword) return;
    setInCorso(true);
    setErrore(null);
    try {
      await aggiornaUtenteAccount(utente.id, { password: nuovaPassword });
      setNuovaPassword('');
      onAggiornato();
    } catch (e) {
      setErrore(e.message);
    } finally {
      setInCorso(false);
    }
  }

  return (
    <tr>
      <td>{utente.nome}</td>
      <td>{utente.email}</td>
      <td>{utente.ruolo === 'titolare' ? 'Titolare' : 'Operatore'}</td>
      <td>
        <span className={`badge ${utente.attivo ? 'badge-buono' : 'badge-critico'}`}>
          {utente.attivo ? 'Attivo' : 'Disattivato'}
        </span>
      </td>
      <td>{formatDataOra(utente.created_at)}</td>
      <td>
        <div className="azioni-utente">
          <button type="button" className="btn btn-piccolo" onClick={cambiaAttivo} disabled={inCorso}>
            {utente.attivo ? 'Disattiva' : 'Riattiva'}
          </button>
          <input
            type="password"
            placeholder="Nuova password"
            value={nuovaPassword}
            onChange={(e) => setNuovaPassword(e.target.value)}
            disabled={inCorso}
          />
          <button type="button" className="btn btn-piccolo" onClick={resettaPassword} disabled={inCorso || !nuovaPassword}>
            Reimposta
          </button>
        </div>
        {errore && <p className="testo-errore">{errore}</p>}
      </td>
    </tr>
  );
}

function GestioneUtenti() {
  const [utenti, setUtenti] = useState([]);
  const [caricamento, setCaricamento] = useState(true);
  const [errore, setErrore] = useState(null);

  function carica() {
    setCaricamento(true);
    getUtenti()
      .then(setUtenti)
      .catch((e) => setErrore(e.message))
      .finally(() => setCaricamento(false));
  }

  useEffect(carica, []);

  return (
    <section>
      <h1>Gestione utenti</h1>
      <p className="testo-muted">
        Crea un account per ogni persona che userà il gestionale (titolare e operatori). Disattivare un account ne
        blocca l'accesso senza perdere lo storico dei task già presi in carico.
      </p>

      <h2>Nuovo account</h2>
      <NuovoUtenteForm onCreato={carica} />

      <h2>Account esistenti</h2>
      {caricamento && <p>Caricamento…</p>}
      {errore && <p className="testo-errore">{errore}</p>}
      {!caricamento && !errore && (
        <table className="tabella-dati">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Ruolo</th>
              <th>Stato</th>
              <th>Creato il</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {utenti.map((u) => (
              <RigaUtente key={u.id} utente={u} onAggiornato={carica} />
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default GestioneUtenti;
