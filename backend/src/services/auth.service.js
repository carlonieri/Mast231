const bcrypt = require('bcryptjs');
const { getPool } = require('../config/db');

const SALT_ROUNDS = 12;

function pubblico(utente) {
  if (!utente) return null;
  // eslint-disable-next-line no-unused-vars
  const { password_hash, ...resto } = utente;
  return resto;
}

async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verificaPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

async function trovaUtentePerEmail(email) {
  const result = await getPool().query('SELECT * FROM utenti WHERE email = $1', [String(email || '').toLowerCase()]);
  return result.rows[0] || null;
}

async function trovaUtentePerId(id) {
  const result = await getPool().query('SELECT * FROM utenti WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function listaUtenti() {
  const result = await getPool().query(
    'SELECT id, nome, email, ruolo, attivo, created_at FROM utenti ORDER BY nome'
  );
  return result.rows;
}

const RUOLI_VALIDI = ['titolare', 'operatore'];

async function creaUtente({ nome, email, password, ruolo }) {
  if (!nome || !email || !password) {
    const err = new Error('Nome, email e password sono obbligatori.');
    err.statusCode = 400;
    throw err;
  }
  if (ruolo && !RUOLI_VALIDI.includes(ruolo)) {
    const err = new Error(`Ruolo non valido: ${ruolo}`);
    err.statusCode = 400;
    throw err;
  }
  const passwordHash = await hashPassword(password);
  try {
    const result = await getPool().query(
      `INSERT INTO utenti (nome, email, password_hash, ruolo)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nome, email, ruolo, attivo, created_at`,
      [nome, String(email).toLowerCase(), passwordHash, ruolo || 'operatore']
    );
    return result.rows[0];
  } catch (err) {
    if (err.code === '23505') {
      const dup = new Error('Esiste già un account con questa email.');
      dup.statusCode = 409;
      throw dup;
    }
    throw err;
  }
}

// Aggiorna solo i campi passati: attivo (attiva/disattiva accesso), ruolo,
// nome, e opzionalmente una nuova password (reset da parte del titolare —
// non esiste un flusso di recupero autonomo, vedi README).
async function aggiornaUtente(id, { attivo, ruolo, nome, password }) {
  if (ruolo && !RUOLI_VALIDI.includes(ruolo)) {
    const err = new Error(`Ruolo non valido: ${ruolo}`);
    err.statusCode = 400;
    throw err;
  }

  const campi = [];
  const valori = [];
  if (attivo !== undefined) {
    valori.push(attivo);
    campi.push(`attivo = $${valori.length}`);
  }
  if (ruolo !== undefined) {
    valori.push(ruolo);
    campi.push(`ruolo = $${valori.length}`);
  }
  if (nome !== undefined) {
    valori.push(nome);
    campi.push(`nome = $${valori.length}`);
  }
  if (password) {
    valori.push(await hashPassword(password));
    campi.push(`password_hash = $${valori.length}`);
  }

  if (campi.length === 0) return trovaUtentePerId(id);

  valori.push(id);
  const result = await getPool().query(
    `UPDATE utenti SET ${campi.join(', ')} WHERE id = $${valori.length}
     RETURNING id, nome, email, ruolo, attivo, created_at`,
    valori
  );
  return result.rows[0] || null;
}

module.exports = {
  pubblico,
  verificaPassword,
  trovaUtentePerEmail,
  trovaUtentePerId,
  listaUtenti,
  creaUtente,
  aggiornaUtente,
  RUOLI_VALIDI,
};
