import { useEffect, useState } from 'react';
import { getDashboard } from '../api/client';
import AndamentoChart from '../components/AndamentoChart';
import StatTile from '../components/StatTile';

function Dashboard() {
  const [andamento, setAndamento] = useState(null);
  const [errore, setErrore] = useState(null);

  useEffect(() => {
    getDashboard()
      .then((r) => setAndamento(r.andamento_mensile))
      .catch((e) => setErrore(e.message));
  }, []);

  if (errore) return <p className="testo-errore">{errore}</p>;
  if (!andamento) return <p>Caricamento…</p>;

  const ultimoMese = andamento[andamento.length - 1];

  return (
    <section>
      <h1>Dashboard — andamento mensile</h1>

      {andamento.length === 0 ? (
        <p className="testo-muted">Nessun dato ancora disponibile: verrà popolato man mano che i job di tracciamento girano.</p>
      ) : (
        <>
          <div className="griglia-stat-tile">
            <StatTile etichetta="Email inviate (ultimo mese)" valore={ultimoMese.email_inviate} />
            <StatTile etichetta="Risposte ricevute (ultimo mese)" valore={ultimoMese.risposte_ricevute} />
            <StatTile
              etichetta="Tasso di risposta (ultimo mese)"
              valore={`${Math.round(ultimoMese.tasso_risposta * 100)}%`}
            />
            <StatTile etichetta="Interessati (ultimo mese)" valore={ultimoMese.interessati} tono="buono" />
            <StatTile
              etichetta="Opt-out (ultimo mese)"
              valore={ultimoMese.opt_out}
              tono={ultimoMese.opt_out > 0 ? 'avviso' : 'neutro'}
            />
          </div>

          <AndamentoChart dati={andamento} />

          <table className="tabella-dati">
            <thead>
              <tr>
                <th>Mese</th>
                <th>Email inviate</th>
                <th>Risposte ricevute</th>
                <th>Tasso di risposta</th>
                <th>Interessati</th>
                <th>Opt-out</th>
              </tr>
            </thead>
            <tbody>
              {andamento.map((m) => (
                <tr key={m.mese}>
                  <td>{m.mese}</td>
                  <td>{m.email_inviate}</td>
                  <td>{m.risposte_ricevute}</td>
                  <td>{Math.round(m.tasso_risposta * 100)}%</td>
                  <td>{m.interessati}</td>
                  <td>{m.opt_out}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}

export default Dashboard;
