import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getFollowUp, markFollowUpDone, prendiInCaricoFollowUp } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { formatData } from '../utils/formato';

function Richiami() {
  const { utente } = useAuth();
  const [soloOggi, setSoloOggi] = useState(true);
  const [richiami, setRichiami] = useState([]);
  const [caricamento, setCaricamento] = useState(true);
  const [errore, setErrore] = useState(null);

  function carica() {
    setCaricamento(true);
    setErrore(null);
    getFollowUp({ oggi: soloOggi })
      .then(setRichiami)
      .catch((e) => setErrore(e.message))
      .finally(() => setCaricamento(false));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(carica, [soloOggi]);

  async function segnaEvaso(id) {
    try {
      await markFollowUpDone(id);
      carica();
    } catch (e) {
      setErrore(e.message);
    }
  }

  async function prendiInCarico(id) {
    try {
      await prendiInCaricoFollowUp(id);
      carica();
    } catch (e) {
      setErrore(e.message);
    }
  }

  return (
    <section>
      <h1>Richiami{soloOggi ? ' del giorno' : ''}</h1>
      <p className="testo-muted">
        Il sistema pianifica, non invia: prendi in carico un richiamo per assegnartelo, poi segnalo evaso dopo aver
        scritto e inviato tu il messaggio da Outlook.
      </p>

      <label className="filtro-checkbox">
        <input type="checkbox" checked={soloOggi} onChange={(e) => setSoloOggi(e.target.checked)} />
        Solo scaduti/in scadenza oggi
      </label>

      {caricamento && <p>Caricamento…</p>}
      {errore && <p className="testo-errore">{errore}</p>}
      {!caricamento && !errore && richiami.length === 0 && <p className="testo-muted">Nessun richiamo da evadere.</p>}

      {!caricamento && !errore && richiami.length > 0 && (
        <table className="tabella-dati">
          <thead>
            <tr>
              <th>Scadenza</th>
              <th>Contatto</th>
              <th>Città</th>
              <th>Motivo</th>
              <th>Assegnato a</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {richiami.map((r) => (
              <tr key={r.id}>
                <td>{formatData(r.data_suggerita)}</td>
                <td>
                  <Link to={`/contatti/${r.lead_id}`}>{r.nome || r.email}</Link>
                </td>
                <td>{r.citta || '—'}</td>
                <td>{r.motivo}</td>
                <td>
                  {r.assegnato_nome ? (
                    r.assegnato_a === utente?.id ? (
                      <span className="badge badge-buono">Tu</span>
                    ) : (
                      r.assegnato_nome
                    )
                  ) : (
                    <span className="testo-muted">Non assegnato</span>
                  )}
                </td>
                <td className="azioni-richiamo">
                  {!r.assegnato_a && (
                    <button type="button" className="btn btn-piccolo" onClick={() => prendiInCarico(r.id)}>
                      Prendi in carico
                    </button>
                  )}
                  <button type="button" className="btn btn-piccolo" onClick={() => segnaEvaso(r.id)}>
                    Segna evaso
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default Richiami;
