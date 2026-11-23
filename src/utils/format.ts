export function formatRelativeTime(isoString?: string | null): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSec < 60) return 'baru saja';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} jam lalu`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} hari lalu`;
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

export function formatRemainingTime(expiresAt?: string | null): string {
  if (!expiresAt) return '';
  const target = new Date(expiresAt).getTime();
  if (Number.isNaN(target)) return '';
  const diffMs = target - Date.now();
  if (diffMs <= 0) return 'Habis';
  const totalMinutes = Math.floor(diffMs / 60000);
  if (totalMinutes < 60) {
    return `Sisa ${Math.max(1, totalMinutes)}m`;
  }
  const hours = Math.floor(totalMinutes / 60);
  return `Sisa ${hours}j`;
}

export function formatClockTime(isoString?: string | null): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatNumber(num?: number | string | null): string {
  const parsed = typeof num === 'string' ? Number(num) : (num ?? 0);
  if (!Number.isFinite(parsed)) return '0';
  return new Intl.NumberFormat('id-ID').format(parsed);
}

export function extractMentions(text: string): string[] {
  const matches = text.match(/@([a-zA-Z0-9_]+)/g) || [];
  const unique = new Set(matches.map((m) => m.slice(1).toLowerCase()));
  return Array.from(unique);
}

export function sanitizeMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('/uploads/')) return trimmed;
  if (trimmed.startsWith('/src/assets/')) return trimmed;
  if (/^data:(image\/(png|jpe?g|webp|gif|heic)|video\/(mp4|webm|quicktime|x-m4v));base64,[A-Za-z0-9+/=]+$/i.test(trimmed)) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export function getInitials(name?: string | null): string {
  if (!name) return 'NZ';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}
