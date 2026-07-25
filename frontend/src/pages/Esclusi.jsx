import { useEffect, useState } from 'react';
import { getEsclusioni, exportEsclusioniUrl } from '../api/client';
import { formatDataOra } from '../utils/formato';

function Esclusi() {
  const [esclusioni, setEsclusioni] = useState([]);
  const [caricamento, setCaricamento] = useState(true);
  const [errore, setErrore] = useState(null);

  useEffect(() => {
    getEsclusioni()
      .then(setEsclusioni)
      .catch((e) => setErrore(e.message))
      .finally(() => setCaricamento(false));
  }, []);

  return (
    <section>
      <div className="section-header">
        <h1>Esclusi / rimossi</h1>
        <a className="btn btn-secondario" href={exportEsclusioniUrl()}>
          Esporta Excel
        </a>
      </div>
      <p className="testo-muted">
        Indirizzi che hanno richiesto la rimozione: cancellati automaticamente dai contatti e bloccati in modo
        permanente da ogni futuro caricamento.
      </p>

      {caricamento && <p>Caricamento…</p>}
      {errore && <p className="testo-errore">{errore}</p>}
      {!caricamento && !errore && esclusioni.length === 0 && <p className="testo-muted">Nessun indirizzo escluso.</p>}

      {!caricamento && !errore && esclusioni.length > 0 && (
        <table className="tabella-dati">
          <thead>
            <tr>
              <th>Email</th>
              <th>Data esclusione</th>
              <th>Motivo</th>
            </tr>
          </thead>
          <tbody>
            {esclusioni.map((e) => (
              <tr key={e.id}>
                <td>{e.email}</td>
                <td>{formatDataOra(e.data)}</td>
                <td>{e.motivo || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default Esclusi;
