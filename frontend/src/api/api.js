/**
 * Centralized API client for ThreatForecast
 * Strictly preserves all existing backend endpoints, methods, headers, and payloads.
 */

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  'http://127.0.0.1:8000';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, options);

  if (!response.ok) {
    const text = await response.text();
    let message = text;
    try {
      const parsed = JSON.parse(text);
      message = parsed.detail || parsed.message || text;
    } catch {
      // Keep raw text if not JSON
    }
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// Named functions strictly maintaining existing signatures
export const health = () => request('/api/health');

export const status = () => request('/api/status');

export const mitre = () => request('/api/mitre/candidates');

export const latestForecast = () => request('/api/forecast/latest');

export const forecastHistory = () => request('/api/forecast/history');

export const start = (interfaceName = '') =>
  request('/api/control/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ interface: interfaceName }),
  });

export const stop = () =>
  request('/api/control/stop', {
    method: 'POST',
  });

export const replay = (path, speed = 1.0) =>
  request('/api/control/replay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, speed: Number(speed) }),
  });

export const replayUpload = (file, speed = 1.0) => {
  return request(`/api/control/replay-upload-raw?speed=${encodeURIComponent(speed)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'X-Filename': file.name,
    },
    body: file,
  });
};

export const shap = (horizon_seconds, max_evals = 600) =>
  request('/api/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ horizon_seconds, max_evals }),
  });

export const wsUrl = () => {
  const wsBase =
    import.meta.env.VITE_WS_BASE_URL ||
    API_BASE.replace(/^http/, 'ws');
  return `${wsBase}/ws/live`;
};

// Centralized API object for structured imports
export const api = {
  health,
  status,
  mitre,
  latestForecast,
  forecastHistory,
  start,
  stop,
  replay,
  replayUpload,
  shap,
  wsUrl,
};

export default api;
