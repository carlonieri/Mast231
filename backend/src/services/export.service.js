const ExcelJS = require('exceljs');

// Genera un buffer .xlsx da un elenco di righe + definizione colonne.
// Riusato da tutte le route di export (una per sezione del gestionale).
async function buildXlsxBuffer({ columns, rows, sheetName = 'Dati' }) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  sheet.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width || 22 }));
  sheet.getRow(1).font = { bold: true };
  rows.forEach((row) => sheet.addRow(row));
  return workbook.xlsx.writeBuffer();
}

module.exports = { buildXlsxBuffer };
