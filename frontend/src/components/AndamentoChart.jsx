import { useRef, useState } from 'react';

const SERIE = [
  { chiave: 'email_inviate', etichetta: 'Email inviate', colore: 'var(--series-1)' },
  { chiave: 'risposte_ricevute', etichetta: 'Risposte ricevute', colore: 'var(--series-2)' },
  { chiave: 'interessati', etichetta: 'Interessati', colore: 'var(--series-3)' },
];

const WIDTH = 640;
const HEIGHT = 280;
const PADDING = { top: 16, right: 16, bottom: 32, left: 36 };

// Grafico a linee in SVG puro (nessuna libreria di charting): 3 serie mensili,
// assi/griglia recessivi, marker che si evidenziano al passaggio del mouse,
// legenda sempre visibile. La tabella dati sotto il grafico (renderizzata dal
// componente Dashboard) copre il requisito di accessibilità "vista tabellare".
function AndamentoChart({ dati }) {
  const [indiceHover, setIndiceHover] = useState(null);
  const svgRef = useRef(null);

  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const valoreMassimo = Math.max(1, ...dati.flatMap((d) => SERIE.map((s) => d[s.chiave])));

  const puntoX = (i) => PADDING.left + (dati.length <= 1 ? plotWidth / 2 : (i / (dati.length - 1)) * plotWidth);
  const puntoY = (v) => PADDING.top + plotHeight - (v / valoreMassimo) * plotHeight;

  function percorso(chiave) {
    return dati.map((d, i) => `${i === 0 ? 'M' : 'L'} ${puntoX(i).toFixed(1)} ${puntoY(d[chiave]).toFixed(1)}`).join(' ');
  }

  function gestisciMouseMove(evt) {
    if (!svgRef.current || dati.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const xRelativo = ((evt.clientX - rect.left) / rect.width) * WIDTH;
    let indicePiuVicino = 0;
    let distanzaMinima = Infinity;
    dati.forEach((_, i) => {
      const dist = Math.abs(puntoX(i) - xRelativo);
      if (dist < distanzaMinima) {
        distanzaMinima = dist;
        indicePiuVicino = i;
      }
    });
    setIndiceHover(indicePiuVicino);
  }

  const numeroTacche = 4;
  const valoriTacche = Array.from({ length: numeroTacche + 1 }, (_, i) => Math.round((valoreMassimo / numeroTacche) * i));

  return (
    <div className="viz-root grafico-andamento">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Andamento mensile di email inviate, risposte ricevute e interessati"
        onMouseMove={gestisciMouseMove}
        onMouseLeave={() => setIndiceHover(null)}
      >
        {valoriTacche.map((v) => (
          <g key={v}>
            <line x1={PADDING.left} x2={WIDTH - PADDING.right} y1={puntoY(v)} y2={puntoY(v)} className="griglia-linea" />
            <text x={PADDING.left - 8} y={puntoY(v)} textAnchor="end" dominantBaseline="middle" className="asse-testo">
              {v}
            </text>
          </g>
        ))}

        {dati.map((d, i) => (
          <text key={d.mese} x={puntoX(i)} y={HEIGHT - 10} textAnchor="middle" className="asse-testo">
            {d.mese}
          </text>
        ))}

        {indiceHover !== null && (
          <line
            x1={puntoX(indiceHover)}
            x2={puntoX(indiceHover)}
            y1={PADDING.top}
            y2={HEIGHT - PADDING.bottom}
            className="crosshair"
          />
        )}

        {SERIE.map((s) => (
          <path key={s.chiave} d={percorso(s.chiave)} fill="none" stroke={s.colore} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        ))}

        {SERIE.map((s) =>
          dati.map((d, i) => (
            <circle
              key={`${s.chiave}-${i}`}
              cx={puntoX(i)}
              cy={puntoY(d[s.chiave])}
              r={indiceHover === i ? 5 : 3}
              fill={s.colore}
            />
          ))
        )}
      </svg>

      <div className="legenda-grafico">
        {SERIE.map((s) => (
          <span key={s.chiave} className="legenda-voce">
            <span className="legenda-pallino" style={{ background: s.colore }} />
            {s.etichetta}
          </span>
        ))}
      </div>
    </div>
  );
}

export default AndamentoChart;
