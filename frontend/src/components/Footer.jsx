import logoAnchorAI from '../assets/anchorai-logo.png';

// Firma discreta: AnchorAI ha sviluppato il gestionale per conto di Mast231,
// ma il titolo/prodotto resta "Mast231 — Gestionale email" (invariato).
function Footer() {
  return (
    <footer className="app-footer">
      <span>Powered by</span>
      <img src={logoAnchorAI} alt="AnchorAI" className="app-footer-logo" />
    </footer>
  );
}

export default Footer;
