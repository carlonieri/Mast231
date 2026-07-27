import BadgeStato from './BadgeStato';
import { formatData } from '../utils/formato';

// Stepper orizzontale: il percorso REALE di questo contatto (date vere delle
// transizioni, da lead_stato_storico), non solo lo stato attuale. Va in cima
// alla vista dettaglio, sopra la timeline dettagliata di email/risposte —
// qui la vista d'insieme, sotto il dettaglio di cosa si sono detti.
function PercorsoStato({ percorso }) {
  if (!percorso || percorso.length === 0) return null;

  return (
    <div className="percorso-stato">
      {percorso.map((tappa, i) => {
        const attuale = i === percorso.length - 1;
        return (
          <div key={`${tappa.stato}-${tappa.data}-${i}`} className="percorso-stato-riga">
            <div className={`percorso-stato-tappa${attuale ? ' percorso-stato-tappa-attuale' : ''}`}>
              <BadgeStato stato={tappa.stato} />
              <span className="percorso-stato-data">
                {formatData(tappa.data)}
                {tappa.origine === 'manuale' ? ' · manuale' : ''}
              </span>
            </div>
            {!attuale && <span className="percorso-stato-freccia">→</span>}
          </div>
        );
      })}
    </div>
  );
}

export default PercorsoStato;
