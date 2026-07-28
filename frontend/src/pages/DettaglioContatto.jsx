import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getLeadDetail, updateLeadStato } from '../api/client';
import BadgeStato from '../components/BadgeStato';
import PercorsoStato from '../components/PercorsoStato';
import { formatData, formatDataOra, giorniDa } from '../utils/formato';

const OPZIONI_STATO = ['da_contattare', 'contattato', 'interessato', 'non_interessato', 'senza_risposta', 'acquisito'];

const SOGLIA_AVVISO_GIORNI = 7;

function DettaglioContatto() {
  const { id } = useParams();
  const [dettaglio, setDettaglio] = useState(null);
  const [caricamento, setCaricamento] = useState(true);
  const [errore, setErrore] = useState(null);
  const [salvataggio, setSalvataggio] = useState(false);
  // Guardia contro risposte "stale" (cambio rapido di contatto) e per non far
  // sparire l'intera scheda dietro "Caricamento…" a ogni cambio stato — solo
  // il primo caricamento di un contatto è bloccante, un refresh successivo
  // (dopo aver cambiato stato) aggiorna i dati sotto senza far flashare la
  // pagina.
  const richiestaInCorsoRef = useRef(0);

  function carica({ mostraCaricamento = true } = {}) {
    const idRichiesta = ++richiestaInCorsoRef.current;
    if (mostraCaricamento) setCaricamento(true);
    setErrore(null);
    getLeadDetail(id)
      .then((d) => {
        if (idRichiesta !== richiestaInCorsoRef.current) return;
        setDettaglio(d);
      })
      .catch((e) => {
        if (idRichiesta !== richiestaInCorsoRef.current) return;
        setErrore(e.message);
      })
      .finally(() => {
        if (idRichiesta !== richiestaInCorsoRef.current) return;
        setCaricamento(false);
      });
  }

  useEffect(() => {
    setDettaglio(null);
    carica();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function cambiaStato(nuovoStato) {
    setSalvataggio(true);
    try {
      await updateLeadStato(id, nuovoStato);
      carica({ mostraCaricamento: false });
    } catch (e) {
      setErrore(e.message);
    } finally {
      setSalvataggio(false);
    }
  }

  if (caricamento) return <p>Caricamento…</p>;
  if (errore) return <p className="testo-errore">{errore}</p>;
  if (!dettaglio) return <p>Contatto non trovato.</p>;

  const giorni = giorniDa(dettaglio.ultima_data_contatto);
  const storico = dettaglio.storico || [];
  const richiami = dettaglio.richiami || [];

  return (
    <section>
      <Link to="/in-acquisizione" className="link-indietro">
        ← Torna alla lista
      </Link>

      <div className="section-header">
        <h1>{dettaglio.nome || dettaglio.email}</h1>
        <BadgeStato stato={dettaglio.stato} />
      </div>

      <PercorsoStato percorso={dettaglio.percorso_stato} />

      <dl className="scheda-contatto">
        <div>
          <dt>Email</dt>
          <dd>{dettaglio.email}</dd>
        </div>
        <div>
          <dt>Città</dt>
          <dd>{dettaglio.citta || '—'}</dd>
        </div>
        <div>
          <dt>Regione</dt>
          <dd>{dettaglio.regione || '—'}</dd>
        </div>
        <div>
          <dt>Ultima categoria email</dt>
          <dd>{dettaglio.ultima_categoria_email || '—'}</dd>
        </div>
        <div>
          <dt>Ultimo contatto</dt>
          <dd>{formatDataOra(dettaglio.ultima_data_contatto)}</dd>
        </div>
      </dl>

      {giorni !== null && giorni < SOGLIA_AVVISO_GIORNI && (
        <div className="avviso-anti-duplicazione">
          Ultimo contatto {giorni === 0 ? 'oggi' : `${giorni} giorn${giorni === 1 ? 'o' : 'i'} fa`}
          {dettaglio.ultima_categoria_email ? ` (${dettaglio.ultima_categoria_email})` : ''}. Valuta se evitare di
          rimandare lo stesso contenuto a distanza di pochi giorni — è solo un avviso, non un blocco: l'invio resta
          da Outlook.
        </div>
      )}

      <div className="cambia-stato">
        <label htmlFor="stato-select">Aggiorna stato manualmente</label>
        <select
          id="stato-select"
          value={OPZIONI_STATO.includes(dettaglio.stato) ? dettaglio.stato : ''}
          disabled={salvataggio}
          onChange={(e) => cambiaStato(e.target.value)}
        >
          {!OPZIONI_STATO.includes(dettaglio.stato) && <option value={dettaglio.stato}>{dettaglio.stato}</option>}
          {OPZIONI_STATO.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <h2>Storico email ({storico.length})</h2>
      {storico.length === 0 ? (
        <p className="testo-muted">
          Nessuna email registrata per questo contatto: comparirà qui non appena verrà inviata o ricevuta
          un'email tracciata.
        </p>
      ) : (
        <table className="tabella-dati">
          <thead>
            <tr>
              <th>Data</th>
              <th>Direzione</th>
              <th>Contenuto</th>
              <th>Categoria</th>
              <th>Fonte</th>
            </tr>
          </thead>
          <tbody>
            {storico.map((e) => (
              <tr key={e.id}>
                <td>{formatDataOra(e.data)}</td>
                <td>{e.direzione === 'inviata' ? 'Inviata' : 'Ricevuta'}</td>
                <td>{(e.direzione === 'inviata' ? e.oggetto : e.sintesi || e.oggetto) || '—'}</td>
                <td>{e.categoria || '—'}</td>
                <td>{e.fonte === 'sent_items' ? 'Posta inviata' : 'Posta in arrivo'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Richiami ({richiami.length})</h2>
      {richiami.length === 0 ? (
        <p className="testo-muted">Nessun richiamo pianificato per questo contatto al momento.</p>
      ) : (
        <ul className="lista-richiami">
          {richiami.map((r) => (
            <li key={r.id}>
              <strong>{formatData(r.data_suggerita)}</strong> — {r.motivo}{' '}
              <span className={`badge ${r.stato === 'fatto' ? 'badge-buono' : 'badge-avviso'}`}>
                {r.stato === 'fatto' ? 'Evaso' : 'Da fare'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default DettaglioContatto;
