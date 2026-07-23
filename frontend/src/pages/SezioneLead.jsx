import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLeads, getFiltriLead, exportLeadUrl } from '../api/client';
import BadgeStato from '../components/BadgeStato';
import { formatDataOra } from '../utils/formato';

function SezioneLead({ titolo, stati }) {
  const statoParam = stati.join(',');
  const [leads, setLeads] = useState([]);
  const [caricamento, setCaricamento] = useState(true);
  const [errore, setErrore] = useState(null);
  const [opzioniFiltro, setOpzioniFiltro] = useState({ citta: [], regione: [] });
  const [citta, setCitta] = useState('');
  const [regione, setRegione] = useState('');

  useEffect(() => {
    getFiltriLead()
      .then(setOpzioniFiltro)
      .catch(() => setOpzioniFiltro({ citta: [], regione: [] }));
  }, []);

  useEffect(() => {
    setCaricamento(true);
    setErrore(null);
    getLeads({ stato: statoParam, citta, regione })
      .then(setLeads)
      .catch((e) => setErrore(e.message))
      .finally(() => setCaricamento(false));
  }, [statoParam, citta, regione]);

  return (
    <section>
      <div className="section-header">
        <h1>{titolo}</h1>
        <a className="btn btn-secondario" href={exportLeadUrl({ stato: statoParam, citta, regione })}>
          Esporta Excel
        </a>
      </div>

      <div className="filtri-riga">
        <select value={citta} onChange={(e) => setCitta(e.target.value)} aria-label="Filtra per città">
          <option value="">Tutte le città</option>
          {opzioniFiltro.citta.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select value={regione} onChange={(e) => setRegione(e.target.value)} aria-label="Filtra per regione">
          <option value="">Tutte le regioni</option>
          {opzioniFiltro.regione.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {caricamento && <p>Caricamento…</p>}
      {errore && <p className="testo-errore">{errore}</p>}
      {!caricamento && !errore && leads.length === 0 && <p className="testo-muted">Nessun contatto in questa sezione.</p>}

      {!caricamento && !errore && leads.length > 0 && (
        <table className="tabella-dati">
          <thead>
            <tr>
              <th>Email</th>
              <th>Nome</th>
              <th>Città</th>
              <th>Regione</th>
              <th>Stato</th>
              <th>Ultima categoria</th>
              <th>Ultimo contatto</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id}>
                <td>
                  <Link to={`/contatti/${l.id}`}>{l.email}</Link>
                </td>
                <td>{l.nome || '—'}</td>
                <td>{l.citta || '—'}</td>
                <td>{l.regione || '—'}</td>
                <td>
                  <BadgeStato stato={l.stato} />
                </td>
                <td>{l.ultima_categoria_email || '—'}</td>
                <td>{formatDataOra(l.ultima_data_contatto)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default SezioneLead;
