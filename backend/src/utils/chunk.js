function chunk(array, size) {
  // Un size non valido (0, negativo, non numerico — es. UPLOAD_BATCH_SIZE
  // configurato male in .env) farebbe avanzare il ciclo di 0 o all'indietro:
  // loop infinito. Con un size non valido, un unico chunk con tutto l'array
  // è un fallback sicuro e ragionevole.
  const dimensione = Number.isInteger(size) && size > 0 ? size : array.length || 1;
  const chunks = [];
  for (let i = 0; i < array.length; i += dimensione) {
    chunks.push(array.slice(i, i + dimensione));
  }
  return chunks;
}

module.exports = { chunk };
