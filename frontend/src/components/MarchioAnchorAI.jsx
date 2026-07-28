import logoAnchorAI from '../assets/anchorai-icon.png';

// "Mast231" resta il nome del prodotto, invariato — questo è solo il credito
// a chi l'ha sviluppato, sempre visibile ma chiaramente secondario: nella
// sidebar sotto il titolo, e sulla card di login. Non più relegato in un
// footer a fondo pagina.
function MarchioAnchorAI({ className = '' }) {
  return (
    <div className={`marchio-anchorai ${className}`}>
      <img src={logoAnchorAI} alt="" className="marchio-anchorai-logo" />
      <span>by AnchorAI</span>
    </div>
  );
}

export default MarchioAnchorAI;
