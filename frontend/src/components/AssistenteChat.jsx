import { useEffect, useRef, useState } from 'react';
import { chiediAssistente } from '../api/client';

const DOMANDE_SUGGERITE = [
  'Dove trovo i richiami di oggi?',
  'Come carico la lista di contatti di oggi?',
  'Cosa vuol dire "senza risposta"?',
  'Come segno un contatto come acquisito?',
];

// Assistente di aiuto in-app: risponde solo a domande su come usare il
// gestionale, non esegue azioni al posto dell'operatore (né nell'app né su
// Outlook). Nessuna persistenza: la conversazione vive solo in questo
// componente e si perde alla chiusura/ricarica della pagina.
function AssistenteChat() {
  const [aperto, setAperto] = useState(false);
  const [messaggi, setMessaggi] = useState([]);
  const [testo, setTesto] = useState('');
  const [caricamento, setCaricamento] = useState(false);
  const [errore, setErrore] = useState(null);
  const fineMessaggiRef = useRef(null);

  useEffect(() => {
    if (aperto) fineMessaggiRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messaggi, aperto, caricamento]);

  async function invia(testoDaInviare) {
    const domanda = (testoDaInviare ?? testo).trim();
    if (!domanda || caricamento) return;

    const nuoviMessaggi = [...messaggi, { ruolo: 'operatore', testo: domanda }];
    setMessaggi(nuoviMessaggi);
    setTesto('');
    setErrore(null);
    setCaricamento(true);

    try {
      const risposta = await chiediAssistente(nuoviMessaggi);
      setMessaggi([...nuoviMessaggi, { ruolo: 'assistente', testo: risposta.testo }]);
    } catch (e) {
      setErrore(e.message);
    } finally {
      setCaricamento(false);
    }
  }

  function gestisciInvio(evt) {
    evt.preventDefault();
    invia();
  }

  return (
    <div className="assistente-widget">
      {aperto && (
        <div className="assistente-pannello">
          <div className="assistente-header">
            <span>Assistente gestionale</span>
            <button
              type="button"
              className="assistente-chiudi"
              onClick={() => setAperto(false)}
              aria-label="Chiudi assistente"
            >
              ×
            </button>
          </div>

          <div className="assistente-messaggi">
            {messaggi.length === 0 && (
              <div className="assistente-suggerimenti">
                <p className="testo-muted">Chiedimi come usare il gestionale, ad esempio:</p>
                {DOMANDE_SUGGERITE.map((domanda) => (
                  <button
                    key={domanda}
                    type="button"
                    className="assistente-suggerimento"
                    onClick={() => invia(domanda)}
                  >
                    {domanda}
                  </button>
                ))}
              </div>
            )}
            {messaggi.map((m, i) => (
              <div key={i} className={`assistente-bolla assistente-bolla-${m.ruolo}`}>
                {m.testo}
              </div>
            ))}
            {caricamento && <div className="assistente-bolla assistente-bolla-assistente">…</div>}
            {errore && <p className="testo-errore">{errore}</p>}
            <div ref={fineMessaggiRef} />
          </div>

          <form className="assistente-input-riga" onSubmit={gestisciInvio}>
            <input
              type="text"
              value={testo}
              onChange={(e) => setTesto(e.target.value)}
              placeholder="Scrivi una domanda…"
              disabled={caricamento}
              aria-label="Scrivi una domanda per l'assistente"
            />
            <button type="submit" className="btn btn-secondario" disabled={caricamento || !testo.trim()}>
              Invia
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className="assistente-bottone-flottante"
        onClick={() => setAperto((v) => !v)}
        aria-label={aperto ? 'Chiudi assistente' : 'Apri assistente di aiuto'}
      >
        {aperto ? '×' : '?'}
      </button>
    </div>
  );
}

export default AssistenteChat;
