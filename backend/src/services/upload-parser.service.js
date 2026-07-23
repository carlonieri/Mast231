const ExcelJS = require('exceljs');
const { parse: parseCsvSync } = require('csv-parse/sync');

// Riconoscimento colonne tollerante alle varianti più comuni di intestazione
// in italiano/inglese che un cliente potrebbe usare nel proprio file.
const EMAIL_HEADERS = ['email', 'e-mail', 'indirizzo email', 'indirizzo'];
const NOME_HEADERS = ['nome', 'nominativo', 'ragione sociale', 'ragione_sociale'];
const CITTA_HEADERS = ['citta', 'città', 'city'];
const REGIONE_HEADERS = ['regione', 'region'];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email);
}

function normalizeHeader(header) {
  return String(header || '').trim().toLowerCase();
}

function pickField(row, candidates) {
  for (const key of Object.keys(row)) {
    if (candidates.includes(normalizeHeader(key))) {
      const value = row[key];
      return value === null || value === undefined ? '' : String(value).trim();
    }
  }
  return '';
}

function rowsToContatti(rows) {
  return rows.map((row) => ({
    email: pickField(row, EMAIL_HEADERS).toLowerCase(),
    nome: pickField(row, NOME_HEADERS) || null,
    citta: pickField(row, CITTA_HEADERS) || null,
    regione: pickField(row, REGIONE_HEADERS) || null,
  }));
}

async function parseXlsx(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  // ExcelJS: row.values è 1-indexed (indice 0 sempre vuoto) — si allinea alla colonna A/B/C...
  const headers = sheet.getRow(1).values.slice(1).map((h) => String(h || '').trim());

  const rows = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // salta l'intestazione
    const values = row.values.slice(1);
    const obj = {};
    headers.forEach((header, idx) => {
      obj[header] = values[idx];
    });
    rows.push(obj);
  });

  return rowsToContatti(rows);
}

function parseCsv(buffer) {
  const records = parseCsvSync(buffer, { columns: true, skip_empty_lines: true, trim: true, bom: true });
  return rowsToContatti(records);
}

// Nota: solo .xlsx e .csv sono supportati (non .xls, il formato binario legacy
// di Excel) — vedi limite della libreria usata per la lettura xlsx.
async function parseUploadedFile(buffer, filename) {
  const ext = (String(filename || '').split('.').pop() || '').toLowerCase();
  if (ext === 'csv') return parseCsv(buffer);
  if (ext === 'xlsx') return parseXlsx(buffer);
  if (ext === 'xls') {
    throw new Error('Formato .xls non supportato: salvare il file come .xlsx o .csv.');
  }
  throw new Error('Formato file non riconosciuto: usare .xlsx o .csv.');
}

module.exports = { parseUploadedFile, isValidEmail };
