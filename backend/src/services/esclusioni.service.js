const { getPool } = require('../config/db');

// Elenco degli indirizzi esclusi/rimossi (tabella separata da leads: blocca
// anche indirizzi mai caricati come lead — vedi schema.sql).
async function listEsclusioni() {
  const result = await getPool().query(
    `SELECT id, email, data, motivo FROM esclusioni ORDER BY data DESC`
  );
  return result.rows;
}

module.exports = { listEsclusioni };
