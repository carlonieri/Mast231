import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getLeadDetail, updateLeadStato } from '../api/client';
import BadgeStato from '../components/BadgeStato';
import { formatData, formatDataOra, giorniDa } from '../utils/formato';

const OPZIONI_STATO = ['da_contattare', 'contattato', 'interessato', 'non_interessato', 'senza_risposta', 'acquisito'];

const SOGLIA_AVVISO_GIORNI = 7;

function DettaglioContatto() {
  const { id } = useParams();
  const [dettaglio, setDettaglio] = useState(null);
  const [caricamento, setCaricamento] = useState(true);
  const [errore, setErrore] = useState(null);
  const [salvataggio, setSalvataggio] = useState(false);

  function carica() {
    setCaricamento(true);
    setErrore(null);
    getLeadDetail(id)
      .then(setDettaglio)
      .catch((e) => setErrore(e.message))
      .finally(() => setCaricamento(false));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(carica, [id]);

  async function cambiaStato(nuovoStato) {
    setSalvataggio(true);
    try {
      await updateLeadStato(id, nuovoStato);
      carica();
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

  return (
    <section>
      <Link to="/in-acquisizione" className="link-indietro">
        ← Torna alla lista
      </Link>

      <div className="section-header">
        <h1>{dettaglio.nome || dettaglio.email}</h1>
        <BadgeStato stato={dettaglio.stato} />
      </div>

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

      <h2>Storico email ({dettaglio.storico.length})</h2>
      {dettaglio.storico.length === 0 ? (
        <p className="testo-muted">Nessuna email registrata per questo contatto.</p>
      ) : (
        <table className="tabella-dati">
          <thead>
            <tr>
              <th>Data</th>
              <th>Direzione</th>
              <th>Oggetto</th>
              <th>Categoria</th>
              <th>Fonte</th>
            </tr>
          </thead>
          <tbody>
            {dettaglio.storico.map((e) => (
              <tr key={e.id}>
                <td>{formatDataOra(e.data)}</td>
                <td>{e.direzione === 'inviata' ? 'Inviata' : 'Ricevuta'}</td>
                <td>{e.oggetto || '—'}</td>
                <td>{e.categoria || '—'}</td>
                <td>{e.fonte === 'sent_items' ? 'Posta inviata' : 'Posta in arrivo'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Richiami ({dettaglio.richiami.length})</h2>
      {dettaglio.richiami.length === 0 ? (
        <p className="testo-muted">Nessun richiamo pianificato.</p>
      ) : (
        <ul className="lista-richiami">
          {dettaglio.richiami.map((r) => (
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
