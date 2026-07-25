import { useEffect, useRef, useState } from 'react';
import { caricaLista, getCaricamenti } from '../api/client';
import { formatDataOra } from '../utils/formato';

function CaricaLista() {
  const fileInputRef = useRef(null);
  const [citta, setCitta] = useState('');
  const [regione, setRegione] = useState('');
  const [inCorso, setInCorso] = useState(false);
  const [errore, setErrore] = useState(null);
  const [risultato, setRisultato] = useState(null);

  const [storico, setStorico] = useState([]);
  const [storicoCaricamento, setStoricoCaricamento] = useState(true);
  const [storicoErrore, setStoricoErrore] = useState(null);

  function caricaStorico() {
    setStoricoCaricamento(true);
    getCaricamenti()
      .then(setStorico)
      .catch((e) => setStoricoErrore(e.message))
      .finally(() => setStoricoCaricamento(false));
  }

  useEffect(caricaStorico, []);

  async function gestisciSubmit(evt) {
    evt.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setErrore('Seleziona un file Excel (.xlsx) o CSV.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    if (citta.trim()) formData.append('citta', citta.trim());
    if (regione.trim()) formData.append('regione', regione.trim());

    setInCorso(true);
    setErrore(null);
    setRisultato(null);
    try {
      const esito = await caricaLista(formData);
      setRisultato(esito);
      if (fileInputRef.current) fileInputRef.current.value = '';
      caricaStorico();
    } catch (e) {
      setErrore(e.message);
    } finally {
      setInCorso(false);
    }
  }

  return (
    <section>
      <h1>Carica lista giornaliera</h1>
      <p className="testo-muted">
        Carica un file Excel (.xlsx) o CSV con i nuovi contatti del giorno (colonna email obbligatoria, nome/città/
        regione facoltative). Il sistema valida ogni riga, toglie i duplicati nel file, controlla ogni indirizzo
        contro la blacklist e genera automaticamente una bozza email nella cartella Bozze della casella (destinatari
        già inseriti, oggetto e testo restano da scrivere) — se gli indirizzi puliti superano la soglia per bozza, li
        scaglia automaticamente in più bozze.
      </p>

      <form onSubmit={gestisciSubmit}>
        <div className="filtri-riga">
          <input type="file" accept=".xlsx,.csv" ref={fileInputRef} disabled={inCorso} aria-label="File da caricare" />
          <input
            type="text"
            placeholder="Città (default per le righe senza città)"
            value={citta}
            onChange={(e) => setCitta(e.target.value)}
            disabled={inCorso}
          />
          <input
            type="text"
            placeholder="Regione (default per le righe senza regione)"
            value={regione}
            onChange={(e) => setRegione(e.target.value)}
            disabled={inCorso}
          />
          <button type="submit" className="btn btn-secondario" disabled={inCorso}>
            {inCorso ? 'Caricamento…' : 'Carica'}
          </button>
        </div>
      </form>

      {errore && <p className="testo-errore">{errore}</p>}

      {risultato && (
        <div className="riepilogo-caricamento">
          <h2>Riepilogo caricamento</h2>
          <dl className="scheda-contatto">
            <div>
              <dt>Indirizzi totali nel file</dt>
              <dd>{risultato.totale_righe}</dd>
            </div>
            <div>
              <dt>Scartati (formato non valido)</dt>
              <dd>{risultato.righe_non_valide}</dd>
            </div>
            <div>
              <dt>Scartati (duplicati nel file)</dt>
              <dd>{risultato.duplicati_nel_file}</dd>
            </div>
            <div>
              <dt>Scartati (in blacklist)</dt>
              <dd>{risultato.esclusi_blacklist.length}</dd>
            </div>
            <div>
              <dt>Indirizzi puliti</dt>
              <dd>{risultato.puliti}</dd>
            </div>
          </dl>

          {risultato.esclusi_blacklist.length > 0 && (
            <>
              <h2>Indirizzi scartati per blacklist</h2>
              <table className="tabella-dati">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {risultato.esclusi_blacklist.map((e) => (
                    <tr key={e.email}>
                      <td>{e.email}</td>
                      <td>{e.motivo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          <h2>Bozze generate su Outlook</h2>
          {risultato.bozze.length === 0 && (
            <p className="testo-muted">Nessun indirizzo pulito da caricare: nessuna bozza generata.</p>
          )}
          {risultato.bozze.length === 1 && (
            <p>
              Generata <strong>1 bozza</strong> nella cartella Bozze della casella, con{' '}
              <strong>{risultato.bozze[0].destinatari}</strong> destinatari già inseriti nel campo A. Apri Outlook,
              trova la bozza, scrivi oggetto e testo e invia.
            </p>
          )}
          {risultato.bozze.length > 1 && (
            <>
              <p>
                Più di {risultato.soglia_batch} indirizzi puliti: scaglionati automaticamente in{' '}
                <strong>{risultato.bozze.length} bozze</strong> (massimo {risultato.soglia_batch} destinatari
                ciascuna). Apri Outlook, trova le bozze nella cartella Bozze, scrivi oggetto e testo e invia ciascuna.
              </p>
              <table className="tabella-dati">
                <thead>
                  <tr>
                    <th>Bozza</th>
                    <th>Destinatari</th>
                  </tr>
                </thead>
                <tbody>
                  {risultato.bozze.map((b) => (
                    <tr key={b.numero_batch}>
                      <td>#{b.numero_batch}</td>
                      <td>{b.destinatari}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      <h2>Caricamenti recenti</h2>
      {storicoCaricamento && <p>Caricamento…</p>}
      {storicoErrore && <p className="testo-errore">{storicoErrore}</p>}
      {!storicoCaricamento && !storicoErrore && storico.length === 0 && (
        <p className="testo-muted">Nessun caricamento ancora effettuato.</p>
      )}
      {!storicoCaricamento && !storicoErrore && storico.length > 0 && (
        <table className="tabella-dati">
          <thead>
            <tr>
              <th>Data</th>
              <th>File</th>
              <th>Città/Regione</th>
              <th>Righe totali</th>
              <th>Puliti</th>
              <th>Bozze</th>
            </tr>
          </thead>
          <tbody>
            {storico.map((c) => (
              <tr key={c.id}>
                <td>{formatDataOra(c.data_caricamento)}</td>
                <td>{c.fonte || '—'}</td>
                <td>{[c.citta, c.regione].filter(Boolean).join(' / ') || '—'}</td>
                <td>{c.numero_record ?? '—'}</td>
                <td>{c.dettagli?.puliti ?? '—'}</td>
                <td>{c.dettagli?.bozze?.length ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default CaricaLista;
