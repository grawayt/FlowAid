const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }

  return res.json();
}

export const api = {
  // Needs
  getNeeds: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/needs?${query}`);
  },
  claimNeed: (needId, body) =>
    request(`/needs/${needId}/claim`, { method: 'POST', body: JSON.stringify(body) }),

  // Deliveries
  getDeliveries: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/deliveries?${query}`);
  },
  manualConfirm: (deliveryId, body) =>
    request(`/deliveries/${deliveryId}/manual-confirm`, { method: 'POST', body: JSON.stringify(body) }),

  // Organisations
  apply: (body) =>
    request('/organisations/apply', { method: 'POST', body: JSON.stringify(body) }),
  getMyOrg: () => request('/organisations/me'),
  getImpact: (orgId) => request(`/organisations/${orgId}/impact`),

  // Admin
  getPendingOrgs: () => request('/admin/organisations/pending'),
  approveOrg: (orgId, notes) =>
    request(`/admin/organisations/${orgId}/approve`, { method: 'POST', body: JSON.stringify({ notes }) }),
  rejectOrg: (orgId, notes) =>
    request(`/admin/organisations/${orgId}/reject`, { method: 'POST', body: JSON.stringify({ notes }) }),
  getOverview: () => request('/admin/overview'),
};
