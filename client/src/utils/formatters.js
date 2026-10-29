// client/src/utils/formatters.js

export function formatCurrency(amount) {
  const num = parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(num);
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function truncate(str, n = 40) {
  if (!str) return '—';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

export function getRiskLevel(score) {
  if (score >= 75) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}
