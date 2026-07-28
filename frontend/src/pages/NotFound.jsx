import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <section>
      <h1>Pagina non trovata</h1>
      <p className="testo-muted">
        L'indirizzo digitato non corrisponde a nessuna pagina del gestionale — potrebbe essere un link vecchio o un
        errore di battitura.
      </p>
      <Link to="/in-acquisizione" className="btn btn-primario">
        Torna alla lista clienti
      </Link>
    </section>
  );
}

export default NotFound;
