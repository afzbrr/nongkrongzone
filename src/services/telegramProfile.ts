import type { Player } from '../types';

export const NONGKRONG_PROFILE_STORAGE_KEY = 'nongkrong_profile';

export interface ClientTelegramUser {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
}

export interface NongkrongLocalProfile {
  telegram_id: number | null;
  name: string;
  username: string;
  avatar_url: string | null;
  telegram_avatar_url: string | null;
  bio: string;
  has_telegram_username: boolean;
  custom_name_edited: boolean;
  custom_avatar_edited: boolean;
  is_guest: boolean;
  updated_at: string;
}

export interface TelegramClientAuth {
  initData: string;
  tgUser: ClientTelegramUser | undefined;
  hasTgWebApp: boolean;
  platform: string;
  isTelegramEnv: boolean;
}

let detectedTelegramSessionCache = false;

export function initTelegramWebAppSafe(): void {
  try {
    const win = typeof window !== 'undefined' ? (window as any) : null;
    const tgWebApp = win?.Telegram?.WebApp;
    if (tgWebApp) {
      if (typeof tgWebApp.ready === 'function') tgWebApp.ready();
      if (typeof tgWebApp.expand === 'function') tgWebApp.expand();
    }
  } catch {
    // Ignore WebApp API errors outside Telegram
  }
}

export function logTelegramDebugSafe(): void {
  try {
    const win = typeof window !== 'undefined' ? (window as any) : null;
    const tgWebApp = win?.Telegram?.WebApp;
    console.log('TG platform:', tgWebApp?.platform);
    console.log('TG user:', tgWebApp?.initDataUnsafe?.user);
  } catch {
    // Ignore debug log errors
  }
}

export function readTelegramClientAuthSafe(options?: { debug?: boolean }): TelegramClientAuth {
  initTelegramWebAppSafe();

  let initData = '';
  let tgUser: any = undefined;
  let hasTgWebApp = false;
  let platform = 'unknown';
  let hasProxy = false;

  try {
    const win = typeof window !== 'undefined' ? (window as any) : null;
    const tgWebApp = win?.Telegram?.WebApp;
    hasTgWebApp = Boolean(win?.Telegram && tgWebApp);
    platform = String(tgWebApp?.platform || 'unknown').toLowerCase() || 'unknown';
    hasProxy = Boolean(win?.TelegramWebviewProxy);

    if (typeof tgWebApp?.initData === 'string') {
      initData = tgWebApp.initData;
    }
    if (tgWebApp?.initDataUnsafe?.user && tgWebApp.initDataUnsafe.user.id) {
      tgUser = tgWebApp.initDataUnsafe.user;
    }

    if (options?.debug) {
      console.log('TG platform:', tgWebApp?.platform);
      console.log('TG user:', tgWebApp?.initDataUnsafe?.user);
    }
  } catch {
    // Ignore errors reading window.Telegram.WebApp
  }

  if (!initData && typeof window !== 'undefined') {
    try {
      const hashRaw = window.location.hash.replace(/^#/, '');
      const hashParams = new URLSearchParams(hashRaw);
      const searchParams = new URLSearchParams(window.location.search);
      const fromParams = hashParams.get('tgWebAppData') || searchParams.get('tgWebAppData');
      if (fromParams) {
        initData = fromParams;
      } else if (hashParams.get('user') || searchParams.get('user')) {
        initData = hashParams.get('user') ? hashRaw : window.location.search.replace(/^\?/, '');
      }
    } catch {
      // Ignore URL parse errors
    }
  }

  if (!initData && typeof window !== 'undefined') {
    try {
      const rawInitParams = window.sessionStorage.getItem('__telegram__initParams');
      if (rawInitParams) {
        const parsedParams = JSON.parse(rawInitParams);
        if (typeof parsedParams?.tgWebAppData === 'string' && parsedParams.tgWebAppData) {
          initData = parsedParams.tgWebAppData;
        }
      }
    } catch {
      // Ignore sessionStorage errors
    }
  }

  if ((!tgUser || !tgUser.id) && initData) {
    try {
      const normalizedInit =
        initData.includes('%3D') && !initData.includes('=')
          ? decodeURIComponent(initData)
          : initData;
      const params = new URLSearchParams(normalizedInit);
      const rawUser = params.get('user');
      if (rawUser) {
        const decodedUser = rawUser.startsWith('%') ? decodeURIComponent(rawUser) : rawUser;
        const parsed = JSON.parse(decodedUser);
        if (parsed && parsed.id) {
          tgUser = parsed;
        }
      }
    } catch {
      // Ignore user JSON parse errors
    }
  }

  let hasUrlData = false;
  let hasSessionTgParams = false;
  let isTgUa = false;
  try {
    if (typeof window !== 'undefined') {
      const fullUrl = `${window.location.search}${window.location.hash}`;
      hasUrlData =
        fullUrl.includes('tgWebAppData') ||
        fullUrl.includes('tgWebAppVersion') ||
        fullUrl.includes('tgWebAppPlatform');
      hasSessionTgParams = Boolean(window.sessionStorage.getItem('__telegram__initParams'));
    }
    if (typeof navigator !== 'undefined') {
      isTgUa = /Telegram/i.test(navigator.userAgent);
    }
  } catch {
    // Ignore environment inspection errors
  }

  const normalizedUser: ClientTelegramUser | undefined =
    tgUser && Number.isSafeInteger(Number(tgUser.id)) && Number(tgUser.id) > 0
      ? {
          id: Number(tgUser.id),
          username: typeof tgUser.username === 'string' ? tgUser.username : undefined,
          first_name: typeof tgUser.first_name === 'string' ? tgUser.first_name : undefined,
          last_name: typeof tgUser.last_name === 'string' ? tgUser.last_name : undefined,
          photo_url: typeof tgUser.photo_url === 'string' ? tgUser.photo_url : undefined,
        }
      : undefined;

  const isPlatformTelegram = Boolean(hasTgWebApp && platform && platform !== 'unknown');
  const isTelegramEnv = Boolean(
    detectedTelegramSessionCache ||
      isPlatformTelegram ||
      hasUrlData ||
      hasSessionTgParams ||
      hasProxy ||
      isTgUa ||
      initData ||
      normalizedUser?.id
  );

  if (isTelegramEnv) {
    detectedTelegramSessionCache = true;
  }

  return { initData, tgUser: normalizedUser, hasTgWebApp, platform, isTelegramEnv };
}

export function loadLocalNongkrongProfile(): NongkrongLocalProfile | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(NONGKRONG_PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      telegram_id:
        typeof parsed.telegram_id === 'number' && Number.isFinite(parsed.telegram_id)
          ? parsed.telegram_id
          : null,
      name: typeof parsed.name === 'string' ? parsed.name : '',
      username: typeof parsed.username === 'string' ? parsed.username : '',
      avatar_url: typeof parsed.avatar_url === 'string' && parsed.avatar_url ? parsed.avatar_url : null,
      telegram_avatar_url:
        typeof parsed.telegram_avatar_url === 'string' && parsed.telegram_avatar_url
          ? parsed.telegram_avatar_url
          : null,
      bio: typeof parsed.bio === 'string' ? parsed.bio : '',
      has_telegram_username: Boolean(parsed.has_telegram_username),
      custom_name_edited: Boolean(parsed.custom_name_edited),
      custom_avatar_edited: Boolean(parsed.custom_avatar_edited),
      is_guest: Boolean(parsed.is_guest),
      updated_at: typeof parsed.updated_at === 'string' ? parsed.updated_at : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function saveLocalNongkrongProfile(profile: NongkrongLocalProfile): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(NONGKRONG_PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore localStorage quota / privacy errors
  }
}

export function getTelegramDisplayName(tgUser?: ClientTelegramUser | null): string {
  if (!tgUser) return '';
  const first = typeof tgUser.first_name === 'string' ? tgUser.first_name.trim() : '';
  const last = typeof tgUser.last_name === 'string' ? tgUser.last_name.trim() : '';
  const joined = [first, last].filter(Boolean).join(' ').trim();
  const fallback = typeof tgUser.username === 'string' ? tgUser.username.replace(/^@/, '').trim() : '';
  return (joined || fallback || `User ${tgUser.id}`).slice(0, 20);
}

/**
 * Syncs client-side Telegram profile with `localStorage.nongkrong_profile`
 * following the exact rules:
 * - Never overwrites Telegram profile with Guest localStorage profile.
 * - First open (or if user hasn't edited Name/Photo): uses Telegram Name (first_name + last_name) & Photo (photo_url).
 * - Subsequent opens: preserves user-edited Name / Photo,
 *   while ALWAYS updating Username to the latest Telegram username (when Telegram provides one).
 */
export function syncTelegramUserWithLocalProfile(
  tgUser: ClientTelegramUser,
  serverPlayer?: Player | null
): {
  resolvedName: string;
  resolvedAvatarUrl: string | null;
  resolvedUsername: string;
  hasTelegramUsername: boolean;
  needsServerSync: boolean;
  localProfile: NongkrongLocalProfile;
} {
  const tgId = Number(tgUser.id);
  const rawTgUsername =
    typeof tgUser.username === 'string'
      ? tgUser.username.replace(/^@/, '').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 32)
      : '';
  const hasTelegramUsername = Boolean(rawTgUsername);
  const tgName = getTelegramDisplayName(tgUser);
  const tgPhotoUrl =
    typeof tgUser.photo_url === 'string' && tgUser.photo_url.trim() ? tgUser.photo_url.trim() : null;

  const stored = loadLocalNongkrongProfile();
  const isSameStoredUser = Boolean(stored && !stored.is_guest && stored.telegram_id === tgId);

  const serverName =
    serverPlayer && typeof serverPlayer.name === 'string' && serverPlayer.name.trim()
      ? serverPlayer.name.trim().slice(0, 20)
      : '';
  const serverAvatar =
    serverPlayer && typeof serverPlayer.avatar_url === 'string' && serverPlayer.avatar_url.trim()
      ? serverPlayer.avatar_url.trim()
      : null;

  const customNameEdited = Boolean(
    (isSameStoredUser && stored?.custom_name_edited) ||
      (serverName &&
        tgName &&
        serverName !== tgName &&
        !/^tg_\d+$/.test(serverName) &&
        serverName !== 'Pengguna' &&
        serverName !== 'Guest')
  );
  const customAvatarEdited = Boolean(
    (isSameStoredUser && stored?.custom_avatar_edited) ||
      (serverAvatar &&
        tgPhotoUrl &&
        serverAvatar !== tgPhotoUrl &&
        !serverAvatar.includes(`tg_avatar_${tgId}`))
  );

  const resolvedName =
    isSameStoredUser && stored?.custom_name_edited && stored.name.trim()
      ? stored.name.trim().slice(0, 20)
      : customNameEdited && serverName
        ? serverName
        : tgName || serverName;

  const resolvedAvatarUrl =
    isSameStoredUser && stored?.custom_avatar_edited
      ? stored.avatar_url
      : customAvatarEdited && serverAvatar
        ? serverAvatar
        : tgPhotoUrl ?? serverAvatar;

  const resolvedUsername = hasTelegramUsername
    ? rawTgUsername
    : serverPlayer?.username || (isSameStoredUser ? stored?.username : '') || `tg_${tgId}`;

  const needsServerSync = Boolean(
    serverPlayer &&
      ((resolvedName && resolvedName !== serverPlayer.name) ||
        (resolvedAvatarUrl && resolvedAvatarUrl !== (serverPlayer.avatar_url || null)) ||
        (isSameStoredUser &&
          stored?.custom_avatar_edited &&
          stored.avatar_url !== (serverPlayer.avatar_url || null)))
  );

  const nextLocal: NongkrongLocalProfile = {
    telegram_id: tgId,
    name: resolvedName,
    username: resolvedUsername,
    avatar_url: resolvedAvatarUrl,
    telegram_avatar_url: tgPhotoUrl || (isSameStoredUser ? stored?.telegram_avatar_url || null : null),
    bio: serverPlayer?.bio ?? (isSameStoredUser ? stored?.bio || '' : ''),
    has_telegram_username: hasTelegramUsername,
    custom_name_edited: customNameEdited,
    custom_avatar_edited: customAvatarEdited,
    is_guest: false,
    updated_at: new Date().toISOString(),
  };

  saveLocalNongkrongProfile(nextLocal);

  return {
    resolvedName,
    resolvedAvatarUrl,
    resolvedUsername,
    hasTelegramUsername,
    needsServerSync,
    localProfile: nextLocal,
  };
}

export function buildGuestPlayerFromLocal(): Player {
  const stored = loadLocalNongkrongProfile();
  const isGuestStored = Boolean(stored && stored.is_guest);
  const name = isGuestStored && stored?.name.trim() ? stored.name.trim().slice(0, 20) : 'Guest';
  const avatarUrl = isGuestStored ? stored?.avatar_url || null : null;
  const bio = isGuestStored ? stored?.bio || '' : '';

  saveLocalNongkrongProfile({
    telegram_id: null,
    name,
    username: '-',
    avatar_url: avatarUrl,
    telegram_avatar_url: null,
    bio,
    has_telegram_username: true,
    custom_name_edited: Boolean(isGuestStored && stored?.custom_name_edited),
    custom_avatar_edited: Boolean(isGuestStored && stored?.custom_avatar_edited),
    is_guest: true,
    updated_at: new Date().toISOString(),
  });

  return {
    id: 'guest',
    telegram_id: null,
    name,
    full_name: name,
    username: '-',
    avatar_url: avatarUrl,
    telegram_avatar_url: null,
    bio,
    coins: 0,
    balance: 0,
    role: 'user',
    is_owner: false,
    is_banned: false,
    border_id: null,
    created_at: new Date().toISOString(),
    followers_count: 0,
    following_count: 0,
    posts_count: 0,
    has_telegram_username: true,
    follows_owner: true,
    is_guest: true,
  };
}

export function persistProfileEditsLocally(params: {
  player: Player;
  name?: string;
  avatar_url?: string | null;
  username?: string;
  bio?: string;
  markNameEdited?: boolean;
  markAvatarEdited?: boolean;
}): void {
  const stored = loadLocalNongkrongProfile();
  const isSameTg = Boolean(
    stored &&
      !stored.is_guest &&
      params.player.telegram_id &&
      stored.telegram_id === params.player.telegram_id
  );
  const isSameGuest = Boolean(stored && stored.is_guest && params.player.is_guest);
  const carryFlags = isSameTg || isSameGuest;

  saveLocalNongkrongProfile({
    telegram_id: params.player.is_guest ? null : params.player.telegram_id ?? null,
    name: (params.name ?? params.player.name ?? 'Guest').slice(0, 20),
    username: params.player.is_guest ? '-' : params.username ?? params.player.username,
    avatar_url: params.avatar_url !== undefined ? params.avatar_url : params.player.avatar_url ?? null,
    telegram_avatar_url:
      params.player.telegram_avatar_url ?? (carryFlags ? stored?.telegram_avatar_url ?? null : null),
    bio: params.bio !== undefined ? params.bio : params.player.bio || '',
    has_telegram_username: params.player.is_guest
      ? true
      : params.player.has_telegram_username !== false,
    custom_name_edited: Boolean(params.markNameEdited || (carryFlags && stored?.custom_name_edited)),
    custom_avatar_edited: Boolean(
      params.markAvatarEdited || (carryFlags && stored?.custom_avatar_edited)
    ),
    is_guest: Boolean(params.player.is_guest),
    updated_at: new Date().toISOString(),
  });
}

export async function compressImageFileToDataUrl(file: File, maxSize = 320): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file foto'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(String(reader.result || ''));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(String(reader.result || ''));
            return;
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } catch {
          resolve(String(reader.result || ''));
        }
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
}
