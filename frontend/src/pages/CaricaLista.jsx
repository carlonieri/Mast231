import { useEffect, useRef, useState } from 'react';
import { caricaLista, confermaCaricamento, getCaricamenti, getRevisioneCaricamento } from '../api/client';
import { formatDataOra, giorniDa } from '../utils/formato';

const ETICHETTE_MOTIVO = {
  acquisito: 'Già acquisito',
  interessato: 'Già interessato',
  non_interessato: 'Già non interessato',
  contattato_recente: 'Contattato di recente',
};

function CaricaLista() {
  const fileInputRef = useRef(null);
  const [citta, setCitta] = useState('');
  const [regione, setRegione] = useState('');
  const [inCorso, setInCorso] = useState(false);
  const [errore, setErrore] = useState(null);
  const [risultato, setRisultato] = useState(null);

  // Caricamento in attesa di revisione (stato 'in_revisione'): l'operatore
  // deve decidere, indirizzo per indirizzo, se tenerlo o escluderlo prima che
  // vengano creati lead o generate bozze.
  const [revisione, setRevisione] = useState(null);
  const [decisioni, setDecisioni] = useState({});
  const [confermaInCorso, setConfermaInCorso] = useState(false);

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

  // Usata sia dopo un nuovo upload sia riprendendo una revisione interrotta
  // (es. dopo un refresh della pagina prima di confermare).
  function applicaRevisione(esito) {
    setRevisione(esito);
    const defaultDecisioni = {};
    esito.segnalati.forEach((s) => { defaultDecisioni[s.email] = 'escludi'; });
    setDecisioni(defaultDecisioni);
  }

  async function gestisciRiprendi(id) {
    setErrore(null);
    setRisultato(null);
    try {
      const esito = await getRevisioneCaricamento(id);
      applicaRevisione(esito);
    } catch (e) {
      setErrore(e.message);
      caricaStorico(); // lo stato potrebbe essere cambiato nel frattempo (es. confermato da un altro operatore)
    }
  }

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
    setRevisione(null);
    try {
      const esito = await caricaLista(formData);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (esito.stato === 'in_revisione') {
        // Default prudente: nessun indirizzo segnalato viene tenuto finché
        // l'operatore non lo sceglie esplicitamente.
        applicaRevisione(esito);
      } else {
        setRisultato(esito);
      }
      caricaStorico();
    } catch (e) {
      setErrore(e.message);
    } finally {
      setInCorso(false);
    }
  }

  function impostaDecisione(email, azione) {
    setDecisioni((prev) => ({ ...prev, [email]: azione }));
  }

  async function gestisciConferma() {
    setConfermaInCorso(true);
    setErrore(null);
    try {
      const decisioniArray = revisione.segnalati.map((s) => ({ email: s.email, azione: decisioni[s.email] || 'escludi' }));
      const esito = await confermaCaricamento(revisione.caricamento_id, decisioniArray);
      setRisultato(esito);
      setRevisione(null);
      setDecisioni({});
      caricaStorico();
    } catch (e) {
      setErrore(e.message);
    } finally {
      setConfermaInCorso(false);
    }
  }

  return (
    <section>
      <h1>Carica lista giornaliera</h1>
      <p className="testo-muted">
        Carica un file Excel (.xlsx) o CSV con i nuovi contatti del giorno (colonna email obbligatoria, nome/città/
        regione facoltative). Il sistema valida ogni riga, toglie i duplicati nel file e controlla ogni indirizzo
        contro la blacklist (automatico, senza eccezioni). Gli indirizzi che corrispondono a lead già acquisiti,
        interessati, non interessati o contattati di recente non vengono inclusi né scartati in automatico: vengono
        segnalati per una revisione manuale prima di generare qualunque bozza. Solo dopo la conferma, il sistema
        genera automaticamente una bozza email nella cartella Bozze della casella (destinatari già inseriti, oggetto e
        testo restano da scrivere) — se gli indirizzi da caricare superano la soglia per bozza, li scaglia
        automaticamente in più bozze.
      </p>

      <form onSubmit={gestisciSubmit}>
        <div className="filtri-riga">
          <input
            type="file"
            accept=".xlsx,.csv"
            ref={fileInputRef}
            disabled={inCorso || Boolean(revisione)}
            aria-label="File da caricare"
          />
          <input
            type="text"
            placeholder="Città (default per le righe senza città)"
            value={citta}
            onChange={(e) => setCitta(e.target.value)}
            disabled={inCorso || Boolean(revisione)}
          />
          <input
            type="text"
            placeholder="Regione (default per le righe senza regione)"
            value={regione}
            onChange={(e) => setRegione(e.target.value)}
            disabled={inCorso || Boolean(revisione)}
          />
          <button type="submit" className="btn btn-secondario" disabled={inCorso || Boolean(revisione)}>
            {inCorso ? 'Caricamento…' : 'Carica'}
          </button>
        </div>
      </form>

      {errore && <p className="testo-errore">{errore}</p>}

      {revisione && (
        <div className="riepilogo-caricamento">
          <h2>Revisione manuale richiesta</h2>
          <p className="testo-muted">
            {revisione.segnalati.length} indirizzo/i corrispondono a lead già in uno stato avanzato: scegli per
            ciascuno se tenerlo nella lista da contattare o escluderlo. Nessuna bozza verrà generata finché non
            confermi.
          </p>
          <table className="tabella-dati">
            <thead>
              <tr>
                <th>Email</th>
                <th>Stato attuale</th>
                <th>Da quanto tempo</th>
                <th>Motivo segnalazione</th>
                <th>Tieni nella lista</th>
              </tr>
            </thead>
            <tbody>
              {revisione.segnalati.map((s) => {
                const giorni = giorniDa(s.data_riferimento);
                return (
                  <tr key={s.email}>
                    <td>{s.email}</td>
                    <td>{s.stato_lead}</td>
                    <td>{giorni === null ? '—' : `${giorni} giorni fa`}</td>
                    <td>{ETICHETTE_MOTIVO[s.motivo] || s.motivo}</td>
                    <td>
                      <input
                        type="checkbox"
                        checked={decisioni[s.email] === 'tieni'}
                        onChange={(e) => impostaDecisione(s.email, e.target.checked ? 'tieni' : 'escludi')}
                        disabled={confermaInCorso}
                        aria-label={`Tieni ${s.email} nella lista`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button type="button" className="btn btn-secondario" onClick={gestisciConferma} disabled={confermaInCorso}>
            {confermaInCorso ? 'Conferma in corso…' : 'Conferma e genera bozze'}
          </button>
        </div>
      )}

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
              <dt>Puliti automatici</dt>
              <dd>{risultato.puliti_automatici}</dd>
            </div>
            <div>
              <dt>Segnalati per revisione</dt>
              <dd>
                {risultato.segnalati_revisione.totale} (tenuti: {risultato.segnalati_revisione.confermati.length}, esclusi:{' '}
                {risultato.segnalati_revisione.rimossi.length})
              </dd>
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
            <p className="testo-muted">Nessun indirizzo da caricare: nessuna bozza generata.</p>
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
                Più di {risultato.soglia_batch} indirizzi: scaglionati automaticamente in{' '}
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
              <th>Puliti automatici</th>
              <th>Bozze</th>
              <th>Stato</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {storico.map((c) => (
              <tr key={c.id}>
                <td>{formatDataOra(c.data_caricamento)}</td>
                <td>{c.fonte || '—'}</td>
                <td>{[c.citta, c.regione].filter(Boolean).join(' / ') || '—'}</td>
                <td>{c.numero_record ?? '—'}</td>
                <td>{c.dettagli?.puliti_automatici ?? '—'}</td>
                <td>{c.dettagli?.bozze?.length ?? '—'}</td>
                <td>{c.stato === 'in_revisione' ? 'In attesa di revisione' : 'Completato'}</td>
                <td>
                  {c.stato === 'in_revisione' && !revisione && (
                    <button type="button" className="btn btn-secondario" onClick={() => gestisciRiprendi(c.id)}>
                      Riprendi
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default CaricaLista;
