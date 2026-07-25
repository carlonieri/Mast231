// Bootstrap: crea il primissimo account (titolare) su un database appena
// creato. Necessario solo una volta, perché la gestione utenti (creare gli
// operatori successivi) avviene dalla pagina "Gestione utenti" nel
// gestionale, che però richiede già di essere loggati come titolare.
//
// Uso: npm run utenti:crea-primo -- "Nome Cognome" email@esempio.it password123
require('dotenv').config();

const { getPool } = require('../src/config/db');
const { creaUtente } = require('../src/services/auth.service');

async function main() {
  const [nome, email, password] = process.argv.slice(2);
  if (!nome || !email || !password) {
    console.error('Uso: npm run utenti:crea-primo -- "Nome Cognome" email@esempio.it password');
    process.exitCode = 1;
    return;
  }

  const utente = await creaUtente({ nome, email, password, ruolo: 'titolare' });
  console.log('Account titolare creato:');
  console.log(`  ${utente.nome} <${utente.email}>`);
  console.log('\nOra puoi accedere al gestionale con queste credenziali e creare gli altri account da "Gestione utenti".');
}

main()
  .then(() => getPool().end())
  .catch((err) => {
    console.error('Errore nella creazione del primo utente:', err.message);
    getPool()
      .end()
      .finally(() => {
        process.exitCode = 1;
      });
  });
