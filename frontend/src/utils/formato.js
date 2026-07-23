export function formatData(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('it-IT', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function formatDataOra(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('it-IT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function giorniDa(iso) {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}
