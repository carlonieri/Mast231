const CONFIG = {
  da_contattare: { label: 'Da contattare', classe: 'badge-neutro' },
  contattato: { label: 'Contattato', classe: 'badge-neutro' },
  interessato: { label: 'Interessato', classe: 'badge-buono' },
  non_interessato: { label: 'Non interessato', classe: 'badge-serio' },
  senza_risposta: { label: 'Senza risposta', classe: 'badge-avviso' },
  escluso: { label: 'Escluso', classe: 'badge-critico' },
  acquisito: { label: 'Acquisito', classe: 'badge-buono' },
};

function BadgeStato({ stato }) {
  const cfg = CONFIG[stato] || { label: stato, classe: 'badge-neutro' };
  return <span className={`badge ${cfg.classe}`}>{cfg.label}</span>;
}

export default BadgeStato;
