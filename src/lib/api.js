// src/lib/api.js
// Tiny wrapper so your Svelte code is clean and always uses relative /api/* paths.

async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  // Throw with better context if not OK
  if (!res.ok) {
    let detail = '';
    try { detail = await res.text(); } catch {}
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${path}\n${detail}`);
  }
  // Try JSON, fall back to text
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

export function getAttendance(limit = 20) {
  const url = `/api/attendance?limit=${encodeURIComponent(limit)}`;
  return request(url);
}

export function createAttendance({ teamNumber, student, status, notedAt }) {
  return request('/api/attendance', {
    method: 'POST',
    body: JSON.stringify({ teamNumber, student, status, notedAt })
  });
}

export function health() {
  return request('/api/health');
}
