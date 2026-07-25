const { getPool } = require('../config/db');

// Andamento mese su mese: email tracciate, risposte, tasso di risposta,
// interessati, opt-out. Vedi spec, requisito funzionale #9.
//
// Nota: gli opt-out (richieste di rimozione) NON si trovano in email_events —
// quando un lead chiede la rimozione, removeLeadForOptOut cancella il lead e
// (via ON DELETE CASCADE) tutti i suoi email_events, quindi l'evento di
// rimozione non viene mai loggato lì. L'unico registro permanente è la
// tabella esclusioni, usata qui per il conteggio mensile degli opt-out.
async function getAndamentoMensile() {
  const eventiResult = await getPool().query(
    `SELECT
       to_char(date_trunc('month', data), 'YYYY-MM') AS mese,
       SUM(CASE WHEN direzione = 'inviata' THEN 1 ELSE 0 END) AS email_inviate,
       SUM(CASE WHEN direzione = 'ricevuta' AND categoria NOT IN ('bounce', 'risposta_automatica_assenza')
                THEN 1 ELSE 0 END) AS risposte_ricevute,
       SUM(CASE WHEN direzione = 'ricevuta' AND categoria = 'interessato' THEN 1 ELSE 0 END) AS interessati
     FROM email_events
     GROUP BY 1
     ORDER BY 1`
  );

  const optOutResult = await getPool().query(
    `SELECT to_char(date_trunc('month', data), 'YYYY-MM') AS mese, COUNT(*) AS opt_out
     FROM esclusioni
     GROUP BY 1
     ORDER BY 1`
  );

  const optOutPerMese = new Map(optOutResult.rows.map((r) => [r.mese, Number(r.opt_out)]));
  const mesi = new Set([...eventiResult.rows.map((r) => r.mese), ...optOutResult.rows.map((r) => r.mese)]);

  const eventiPerMese = new Map(eventiResult.rows.map((r) => [r.mese, r]));

  return [...mesi].sort().map((mese) => {
    const riga = eventiPerMese.get(mese) || { email_inviate: 0, risposte_ricevute: 0, interessati: 0 };
    const emailInviate = Number(riga.email_inviate) || 0;
    const risposteRicevute = Number(riga.risposte_ricevute) || 0;
    return {
      mese,
      email_inviate: emailInviate,
      risposte_ricevute: risposteRicevute,
      tasso_risposta: emailInviate > 0 ? Number((risposteRicevute / emailInviate).toFixed(3)) : 0,
      interessati: Number(riga.interessati) || 0,
      opt_out: optOutPerMese.get(mese) || 0,
    };
  });
}

module.exports = { getAndamentoMensile };
