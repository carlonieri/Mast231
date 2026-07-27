import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLeads, getFiltriLead, exportLeadUrl, generaRichiamoZona } from '../api/client';
import BadgeStato from '../components/BadgeStato';
import { formatDataOra } from '../utils/formato';

// Solo per la sezione "Senza risposta": genera una bozza reale (CCN, stesso
// scaglionamento di "Carica lista giornaliera") con i contatti della zona
// attualmente filtrata — vedi spec, requisito funzionale #8.
function RichiamoZona({ citta, regione }) {
  const [inCorso, setInCorso] = useState(false);
  const [errore, setErrore] = useState(null);
  const [esito, setEsito] = useState(null);

  const zonaScelta = Boolean(citta || regione);
  const etichettaZona = [citta, regione].filter(Boolean).join(' / ') || 'tutte le zone';

  async function genera() {
    setInCorso(true);
    setErrore(null);
    setEsito(null);
    try {
      const risultato = await generaRichiamoZona({ citta, regione });
      setEsito(risultato);
    } catch (e) {
      setErrore(e.message);
    } finally {
      setInCorso(false);
    }
  }

  return (
    <div className="riquadro-richiamo-zona">
      <div className="riquadro-richiamo-zona-riga">
        <div>
          <strong>Richiamo per zona:</strong> genera una bozza email con i contatti "senza risposta" di{' '}
          <em>{etichettaZona}</em> già inseriti in CCN, pronta da aprire in Outlook.
        </div>
        <button type="button" className="btn btn-primario" onClick={genera} disabled={inCorso || !zonaScelta}>
          {inCorso ? 'Generazione…' : 'Genera bozza richiamo'}
        </button>
      </div>
      {!zonaScelta && <p className="testo-muted">Seleziona prima una città o una regione dai filtri sopra.</p>}
      {errore && <p className="testo-errore">{errore}</p>}
      {esito && esito.numero_destinatari === 0 && (
        <p className="testo-muted">Nessun contatto "senza risposta" in questa zona: nessuna bozza generata.</p>
      )}
      {esito && esito.numero_destinatari > 0 && esito.bozze.length === 1 && (
        <p>
          Generata <strong>1 bozza</strong> (CCN) nella cartella Bozze con <strong>{esito.numero_destinatari}</strong>{' '}
          destinatari.
        </p>
      )}
      {esito && esito.numero_destinatari > 0 && esito.bozze.length > 1 && (
        <p>
          Più di {esito.soglia_batch} contatti: scaglionati automaticamente in{' '}
          <strong>{esito.bozze.length} bozze</strong> (CCN, massimo {esito.soglia_batch} destinatari ciascuna) —{' '}
          {esito.numero_destinatari} destinatari totali.
        </p>
      )}
    </div>
  );
}

function SezioneLead({ titolo, stati, mostraRichiamoZona = false }) {
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
        <a className="btn" href={exportLeadUrl({ stato: statoParam, citta, regione })}>
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

      {mostraRichiamoZona && <RichiamoZona citta={citta} regione={regione} />}

      {caricamento && <p>Caricamento…</p>}
      {errore && <p className="testo-errore">{errore}</p>}
      {!caricamento && !errore && leads.length === 0 && (
        <p className="testo-muted">
          Nessun contatto qui al momento — questa lista si aggiorna da sola man mano che carichi nuovi indirizzi
          (sezione "Carica lista") e arrivano risposte.
        </p>
      )}

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
