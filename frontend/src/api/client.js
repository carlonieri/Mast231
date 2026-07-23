const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
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
    throw new Error(message);
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

export function getDashboard() {
  return request('/api/dashboard');
}
