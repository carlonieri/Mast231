function StatTile({ etichetta, valore, tono = 'neutro' }) {
  return (
    <div className={`stat-tile stat-tile-${tono}`}>
      <div className="stat-tile-valore">{valore}</div>
      <div className="stat-tile-etichetta">{etichetta}</div>
    </div>
  );
}

export default StatTile;
