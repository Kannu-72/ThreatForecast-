export function formatRisk(val) {
  if (val == null || isNaN(val)) return '—';
  return (val * 100).toFixed(1) + '%';
}

export function formatRiskDecimal(val) {
  if (val == null || isNaN(val)) return '—';
  return Number(val).toFixed(4);
}

export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function formatNumber(num) {
  if (num == null || isNaN(num)) return '—';
  return Number(num).toLocaleString();
}

export function formatTimestamp(ts) {
  if (!ts) return '--:--:--';
  try {
    const d = new Date(Number(ts) * 1000);
    return d.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '--:--:--';
  }
}
