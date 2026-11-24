const SHORT_MONTHS_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

function pad2(n: number): string {
  return String(Math.floor(Math.max(0, n))).padStart(2, '0');
}

export interface WibParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hours: number; // 0-23
  minutes: number; // 0-59
  seconds: number; // 0-59
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // HH:mm
  clockStr: string; // HH:mm:ss
}

/**
 * Returns wall-clock date in Asia/Jakarta (WIB, UTC+7) using toLocaleString.
 */
export function toWibWallDate(input: number | string | Date = Date.now()): Date {
  const base = input instanceof Date ? input : new Date(input);
  const safeBase = Number.isNaN(base.getTime()) ? new Date() : base;
  return new Date(safeBase.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
}

export function getNowWibMs(): number {
  return toWibWallDate(new Date()).getTime();
}

export function getWibParts(input: number | string | Date = Date.now()): WibParts {
  const d = toWibWallDate(input);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const seconds = d.getSeconds();

  return {
    year,
    month,
    day,
    hours,
    minutes,
    seconds,
    dateStr: `${year}-${pad2(month)}-${pad2(day)}`,
    timeStr: `${pad2(hours)}:${pad2(minutes)}`,
    clockStr: `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`,
  };
}

/**
 * Converts a WIB date (YYYY-MM-DD) + time (HH:mm) into a UTC ISO string (+07:00).
 */
export function parseWibDateTimeToIso(dateStr: string, timeStr: string): string | null {
  const cleanDate = dateStr.trim();
  const cleanTime = timeStr.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate) || !/^\d{2}:\d{2}$/.test(cleanTime)) {
    return null;
  }
  const d = new Date(`${cleanDate}T${cleanTime}:00+07:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function formatWibTimeLabel(isoOrMs: string | number): string {
  const p = getWibParts(isoOrMs);
  return `${p.hours < 10 ? '0' + p.hours : p.hours}.${pad2(p.minutes)} WIB`;
}

export function formatWibDateTimeLabel(isoOrMs: string | number): string {
  const p = getWibParts(isoOrMs);
  const todayWib = getWibParts(Date.now());
  const monName = SHORT_MONTHS_ID[p.month - 1] || pad2(p.month);
  if (p.dateStr === todayWib.dateStr) {
    return `Hari ini · ${p.timeStr} WIB`;
  }
  return `${p.day} ${monName} · ${p.timeStr} WIB`;
}

/**
 * Computes countdown using Asia/Jakarta (UTC+7) wall-clock dates.
 */
export function formatCountdown(targetIsoOrMs: string | number, nowMs = Date.now()): string {
  const targetWallMs = toWibWallDate(targetIsoOrMs).getTime();
  const nowWallMs = toWibWallDate(nowMs).getTime();
  if (!Number.isFinite(targetWallMs) || !Number.isFinite(nowWallMs)) return '00:00:00';
  const diffSec = Math.max(0, Math.floor((targetWallMs - nowWallMs) / 1000));
  const days = Math.floor(diffSec / 86400);
  const hours = Math.floor((diffSec % 86400) / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);
  const seconds = diffSec % 60;
  if (days > 0) {
    return `${days}h ${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
  }
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
}
