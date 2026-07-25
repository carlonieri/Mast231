const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include', // manda/riceve il cookie di sessione (login)
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    let message = `Errore ${res.status}`;
    try {
      const body = await res.json();
      if (body.message) message = body.message;
    } catch {
      // corpo non JSON: si mantiene il messaggio generico
    }
    const errore = new Error(message);
    errore.status = res.status;
    throw errore;
  }
  if (res.status === 204) return null;
  return res.json();
}

function buildQuery(params) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, value);
  });
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

export function login(email, password) {
  return request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export function logout() {
  return request('/api/auth/logout', { method: 'POST' });
}

export function getUtenteCorrente() {
  return request('/api/auth/me');
}

export function getUtenti() {
  return request('/api/utenti');
}

export function creaUtenteAccount(dati) {
  return request('/api/utenti', { method: 'POST', body: JSON.stringify(dati) });
}

export function aggiornaUtenteAccount(id, dati) {
  return request(`/api/utenti/${id}`, { method: 'PATCH', body: JSON.stringify(dati) });
}

export function getLeads({ stato, citta, regione } = {}) {
  return request(`/api/leads${buildQuery({ stato, citta, regione })}`);
}

export function getFiltriLead() {
  return request('/api/leads/opzioni-filtro');
}

export function getLeadDetail(id) {
  return request(`/api/leads/${id}`);
}

export function updateLeadStato(id, stato) {
  return request(`/api/leads/${id}`, { method: 'PATCH', body: JSON.stringify({ stato }) });
}

export function exportLeadUrl({ stato, citta, regione } = {}) {
  return `${API_BASE}/api/leads/export${buildQuery({ stato, citta, regione })}`;
}

export function getEsclusioni() {
  return request('/api/esclusioni');
}

export function exportEsclusioniUrl() {
  return `${API_BASE}/api/esclusioni/export`;
}

export function getFollowUp({ oggi } = {}) {
  return request(`/api/follow-up${buildQuery({ oggi: oggi ? 'true' : undefined })}`);
}

export function markFollowUpDone(id) {
  return request(`/api/follow-up/${id}`, { method: 'PATCH' });
}

export function prendiInCaricoFollowUp(id) {
  return request(`/api/follow-up/${id}/prendi-in-carico`, { method: 'PATCH' });
}

export function getDashboard() {
  return request('/api/dashboard');
}

export function getCaricamenti() {
  return request('/api/caricamenti');
}

// Richiamo "senza risposta" per zona: genera una bozza (o più, scaglionate)
// con i destinatari in CCN, stesso meccanismo di "Carica lista giornaliera".
export function generaRichiamoZona({ citta, regione }) {
  return request('/api/gruppi-export-richiamo', { method: 'POST', body: JSON.stringify({ citta, regione }) });
}

// Multipart/form-data: non passa dall'helper request() perché non deve
// forzare Content-Type: application/json (il browser imposta da solo il
// boundary corretto quando il body è un FormData).
export async function caricaLista(formData) {
  const res = await fetch(`${API_BASE}/api/caricamenti`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (!res.ok) {
    let message = `Errore ${res.status}`;
    try {
      const body = await res.json();
      if (body.message) message = body.message;
    } catch {
      // corpo non JSON: si mantiene il messaggio generico
    }
    throw new Error(message);
  }
  return res.json();
}

export function chiediAssistente(messaggi) {
  return request('/api/assistente/chat', {
    method: 'POST',
    body: JSON.stringify({ messaggi }),
  });
}
