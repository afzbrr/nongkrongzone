import 'dotenv/config';
import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { WebSocketServer, WebSocket } from 'ws';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createServer as createViteServer } from 'vite';

const PORT = Number(process.env.PORT) || 3000;
const OWNER_TELEGRAM_ID = 6189849073;
const OWNER_DEFAULT_USERNAME = 'istamina';
const OWNER_NAME = 'Faiz Ganteng';
const OWNER_COINS = 999999999;
const OWNER_BORDER = 'FAIZ_OWNER';
const SESSION_SECRET =
  (process.env.SESSION_SECRET || '').trim() || crypto.randomBytes(32).toString('hex');

const telegramAvatarMemoryCache = new Map<string, string>();
const telegramHasUsernameCache = new Map<string, boolean>();
const schemaCaps = {
  checked: false,
  hasTelegramAvatarCol: false,
  hasProfilesTable: false,
  // posts columns
  postsPlayerId: true,
  postsTelegramId: false,
  postsUsername: false,
  postsFullName: false,
  postsAvatarUrl: false,
  postsMediaUrl: false,
  postsMediaUrls: true,
  postsLikes: false,
  postsLikesCount: true,
  postsCommentsCount: true,
  postsIsDeleted: true,
  postsTaggedUsernames: true,
  postsOriginalPostId: true,
  // post_likes columns
  likesId: true,
  likesPlayerId: true,
  likesTelegramId: false,
  // post_comments columns
  commentsPlayerId: true,
  commentsTelegramId: false,
  commentsUsername: false,
  commentsFullName: false,
  commentsAvatarUrl: false,
  commentsText: true,
  commentsComment: false,
  commentsParentId: true,
  commentsIsDeleted: true,
  commentsLikesCount: true,
  // stories columns
  storiesPlayerId: true,
  storiesTelegramId: false,
  storiesUsername: false,
  storiesFullName: false,
  storiesAvatarUrl: false,
  storiesText: false,
  storiesCaption: true,
  storiesBgColor: false,
  storiesDurationHours: false,
  storiesIsDeleted: true,
  storiesSongTitle: true,
};

let schemaCapsPromise: Promise<typeof schemaCaps> | null = null;
let authCapsChecked = false;
let authCapsPromise: Promise<void> | null = null;

async function detectAuthSchemaCaps(sb: SupabaseClient) {
  if (schemaCaps.checked || authCapsChecked) return schemaCaps;
  if (authCapsPromise) {
    await authCapsPromise;
    return schemaCaps;
  }
  authCapsPromise = (async () => {
    try {
      const quickProbe = (table: string, col: string) =>
        Promise.race([
          sb.from(table).select(col).limit(1).then((r) => !r.error, () => false),
          new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 1500)),
        ]);
      const [hasTgAv, hasProf] = await Promise.all([
        quickProbe('players', 'telegram_avatar_url'),
        quickProbe('profiles', 'id'),
      ]);
      schemaCaps.hasTelegramAvatarCol = hasTgAv;
      schemaCaps.hasProfilesTable = hasProf;
    } catch {
      // keep defaults
    } finally {
      authCapsChecked = true;
    }
  })();
  await authCapsPromise;
  return schemaCaps;
}

async function detectSchemaCaps(sb: SupabaseClient) {
  if (schemaCaps.checked) return schemaCaps;
  if (schemaCapsPromise) return schemaCapsPromise;
  schemaCapsPromise = (async () => {
    try {
      const colProbe = (table: string, col: string) =>
        Promise.race([
          sb.from(table).select(col).limit(1).then((r) => !r.error, () => false),
          new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 4000)),
        ]);

    const [
      hasTgAv,
      hasProf,
      pPid,
      pTgId,
      pUser,
      pFull,
      pAv,
      pMUrl,
      pMUrls,
      pLikes,
      pLikesC,
      pCommsC,
      pIsDel,
      pTag,
      pOrig,
      lId,
      lPid,
      lTgId,
      cPid,
      cTgId,
      cUser,
      cFull,
      cAv,
      cText,
      cComment,
      cParent,
      cIsDel,
      cLikesC,
      sPid,
      sTgId,
      sUser,
      sFull,
      sAv,
      sText,
      sCap,
      sBg,
      sDur,
      sIsDel,
      sSong,
    ] = await Promise.all([
      colProbe('players', 'telegram_avatar_url'),
      colProbe('profiles', 'id'),
      colProbe('posts', 'player_id'),
      colProbe('posts', 'telegram_id'),
      colProbe('posts', 'username'),
      colProbe('posts', 'full_name'),
      colProbe('posts', 'avatar_url'),
      colProbe('posts', 'media_url'),
      colProbe('posts', 'media_urls'),
      colProbe('posts', 'likes'),
      colProbe('posts', 'likes_count'),
      colProbe('posts', 'comments_count'),
      colProbe('posts', 'is_deleted'),
      colProbe('posts', 'tagged_usernames'),
      colProbe('posts', 'original_post_id'),
      colProbe('post_likes', 'id'),
      colProbe('post_likes', 'player_id'),
      colProbe('post_likes', 'telegram_id'),
      colProbe('post_comments', 'player_id'),
      colProbe('post_comments', 'telegram_id'),
      colProbe('post_comments', 'username'),
      colProbe('post_comments', 'full_name'),
      colProbe('post_comments', 'avatar_url'),
      colProbe('post_comments', 'text'),
      colProbe('post_comments', 'comment'),
      colProbe('post_comments', 'parent_comment_id'),
      colProbe('post_comments', 'is_deleted'),
      colProbe('post_comments', 'likes_count'),
      colProbe('stories', 'player_id'),
      colProbe('stories', 'telegram_id'),
      colProbe('stories', 'username'),
      colProbe('stories', 'full_name'),
      colProbe('stories', 'avatar_url'),
      colProbe('stories', 'text'),
      colProbe('stories', 'caption'),
      colProbe('stories', 'bg_color'),
      colProbe('stories', 'duration_hours'),
      colProbe('stories', 'is_deleted'),
      colProbe('stories', 'song_title'),
    ]);

    schemaCaps.hasTelegramAvatarCol = hasTgAv;
    schemaCaps.hasProfilesTable = hasProf;
    schemaCaps.postsPlayerId = pPid;
    schemaCaps.postsTelegramId = pTgId;
    schemaCaps.postsUsername = pUser;
    schemaCaps.postsFullName = pFull;
    schemaCaps.postsAvatarUrl = pAv;
    schemaCaps.postsMediaUrl = pMUrl;
    schemaCaps.postsMediaUrls = pMUrls;
    schemaCaps.postsLikes = pLikes;
    schemaCaps.postsLikesCount = pLikesC;
    schemaCaps.postsCommentsCount = pCommsC;
    schemaCaps.postsIsDeleted = pIsDel;
    schemaCaps.postsTaggedUsernames = pTag;
    schemaCaps.postsOriginalPostId = pOrig;
    schemaCaps.likesId = lId;
    schemaCaps.likesPlayerId = lPid;
    schemaCaps.likesTelegramId = lTgId;
    schemaCaps.commentsPlayerId = cPid;
    schemaCaps.commentsTelegramId = cTgId;
    schemaCaps.commentsUsername = cUser;
    schemaCaps.commentsFullName = cFull;
    schemaCaps.commentsAvatarUrl = cAv;
    schemaCaps.commentsText = cText;
    schemaCaps.commentsComment = cComment;
    schemaCaps.commentsParentId = cParent;
    schemaCaps.commentsIsDeleted = cIsDel;
    schemaCaps.commentsLikesCount = cLikesC;
    schemaCaps.storiesPlayerId = sPid;
    schemaCaps.storiesTelegramId = sTgId;
    schemaCaps.storiesUsername = sUser;
    schemaCaps.storiesFullName = sFull;
    schemaCaps.storiesAvatarUrl = sAv;
    schemaCaps.storiesText = sText;
    schemaCaps.storiesCaption = sCap;
    schemaCaps.storiesBgColor = sBg;
    schemaCaps.storiesDurationHours = sDur;
    schemaCaps.storiesIsDeleted = sIsDel;
    schemaCaps.storiesSongTitle = sSong;
    } catch {
      // keep defaults
    } finally {
      schemaCaps.checked = true;
    }
    return schemaCaps;
  })();
  return schemaCapsPromise;
}

function isOwnerByTelegramId(telegramId: unknown): boolean {
  return Number(telegramId) === OWNER_TELEGRAM_ID;
}

function isUnlimitedOwner(row: any): boolean {
  if (!row) return false;
  return Boolean(
    isOwnerByTelegramId(row.telegram_id) ||
      row.is_owner === true ||
      String(row.role || '').trim().toLowerCase() === 'owner' ||
      String(row.username || '').trim().toLowerCase() === 'afz'
  );
}

function resolveRowBalance(row: any): number {
  if (!row) return 0;
  if (isUnlimitedOwner(row)) return OWNER_COINS;
  const hasBal = row.balance !== undefined && row.balance !== null;
  const hasCoins = row.coins !== undefined && row.coins !== null;
  if (hasBal && hasCoins) {
    const b = Number(row.balance || 0);
    const c = Number(row.coins || 0);
    return b === 0 && c > 0 ? c : b;
  }
  return Number(hasBal ? row.balance : row.coins || 0);
}

function formatCoinsId(val: number): string {
  return Math.trunc(val).toLocaleString('id-ID');
}

function getWibTodayStartIso(): string {
  const now = new Date();
  const wibStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }); // YYYY-MM-DD
  return new Date(`${wibStr}T00:00:00+07:00`).toISOString();
}

async function updatePlayerCoinsAndBalance(
  sb: SupabaseClient,
  playerId: string,
  nextAmount: number,
  extraUpdates: Record<string, any> = {}
) {
  const safeVal = Math.max(0, Math.trunc(nextAmount));
  const payload = { ...extraUpdates, coins: safeVal, balance: safeVal };
  let { data, error } = await sb
    .from('players')
    .update(payload)
    .eq('id', playerId)
    .select('*')
    .maybeSingle();

  if (error && /column|schema cache|PGRST204/i.test(String(error.message || ''))) {
    const fallbackPayload = { ...extraUpdates, coins: safeVal };
    const retry = await sb
      .from('players')
      .update(fallbackPayload)
      .eq('id', playerId)
      .select('*')
      .maybeSingle();
    data = retry.data;
    error = retry.error;
  }
  if (error) throw error;
  return data;
}

async function insertNotificationSafe(
  sb: SupabaseClient,
  opts: {
    toPlayerId: string;
    fromPlayerId?: string | null;
    type?: string;
    title: string;
    message?: string | null;
    postId?: string | null;
  }
) {
  const payloads: Array<Record<string, any>> = [
    {
      user_id: opts.toPlayerId,
      to_player_id: opts.toPlayerId,
      from_player_id: opts.fromPlayerId ?? null,
      type: opts.type || 'transfer',
      title: opts.title,
      message: opts.message ?? opts.title,
      post_id: opts.postId ?? null,
      is_read: false,
    },
    {
      user_id: opts.toPlayerId,
      title: opts.title,
      message: opts.message ?? opts.title,
      is_read: false,
    },
    {
      to_player_id: opts.toPlayerId,
      from_player_id: opts.fromPlayerId ?? null,
      type: opts.type || 'transfer',
      title: opts.message || opts.title,
      post_id: opts.postId ?? null,
      is_read: false,
    },
  ];

  for (const payload of payloads) {
    const { data, error } = await sb.from('notifications').insert(payload).select('*').maybeSingle();
    if (!error && data) return data;
    const msg = String(error?.message || '');
    if (!/column|schema cache|PGRST204|null value/i.test(msg)) {
      console.warn('[notifications] Insert warning:', msg);
      return null;
    }
  }
  return null;
}

async function recordTransferTransaction(
  sb: SupabaseClient,
  opts: {
    senderId: string;
    recipientId: string;
    amount: number;
    senderUsername: string;
    recipientUsername: string;
    txType?: string;
    note?: string;
  }
): Promise<boolean> {
  const txType = opts.txType || 'transfer';
  const noteText = opts.note || `Transfer ke @${opts.recipientUsername}`;
  const payloads: Array<Record<string, any>> = [
    {
      sender_id: opts.senderId,
      receiver_id: opts.recipientId,
      amount: opts.amount,
      tx_type: txType,
      note: noteText,
    },
    {
      sender_id: opts.senderId,
      receiver_id: opts.recipientId,
      amount: opts.amount,
      type: txType,
      note: noteText,
    },
    {
      from_player_id: opts.senderId,
      to_player_id: opts.recipientId,
      amount: opts.amount,
      type: txType,
      note: noteText,
    },
  ];

  for (const payload of payloads) {
    const { error } = await sb.from('transactions').insert(payload);
    if (!error) return true;
    const msg = String(error.message || '');
    if (/relation .*transactions.* does not exist|Could not find the table/i.test(msg)) {
      console.warn('[transactions] Table `transactions` not found in Supabase:', msg);
      return false;
    }
    if (!/column|schema cache|PGRST204/i.test(msg)) {
      console.warn('[transactions] Insert warning:', msg);
      return false;
    }
  }
  return false;
}

const OWNER_PANEL_DATA_DIR = path.resolve(process.cwd(), 'data');
const OWNER_PANEL_STORE_PATH = path.resolve(OWNER_PANEL_DATA_DIR, 'owner-panel.json');

interface BroadcastRow {
  id: string;
  title: string;
  message: string;
  scheduled_at: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

interface GiveawayRow {
  id: string;
  amount_per_user: number;
  max_winners: number;
  claimed_count: number;
  scheduled_at: string;
  status: string;
  created_by: string | null;
  created_at: string;
}

interface GiveawayClaimRow {
  id: string;
  giveaway_id: string;
  user_id: string;
  amount: number;
  claimed_at: string;
}

interface OwnerPanelFallbackData {
  broadcasts: BroadcastRow[];
  giveaways: GiveawayRow[];
  claims: GiveawayClaimRow[];
}

function isMissingRelationError(err: any): boolean {
  if (!err) return false;
  const code = String(err.code || '');
  const msg = String(err.message || '');
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    /relation .* does not exist|Could not find the table/i.test(msg)
  );
}

function readOwnerPanelFallback(): OwnerPanelFallbackData {
  try {
    if (!fs.existsSync(OWNER_PANEL_STORE_PATH)) {
      return { broadcasts: [], giveaways: [], claims: [] };
    }
    const raw = fs.readFileSync(OWNER_PANEL_STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      broadcasts: Array.isArray(parsed?.broadcasts) ? parsed.broadcasts : [],
      giveaways: Array.isArray(parsed?.giveaways) ? parsed.giveaways : [],
      claims: Array.isArray(parsed?.claims) ? parsed.claims : [],
    };
  } catch {
    return { broadcasts: [], giveaways: [], claims: [] };
  }
}

function writeOwnerPanelFallback(data: OwnerPanelFallbackData) {
  fs.mkdirSync(OWNER_PANEL_DATA_DIR, { recursive: true });
  const tmpPath = `${OWNER_PANEL_STORE_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmpPath, OWNER_PANEL_STORE_PATH);
}

const dropLockQueues = new Map<string, Promise<any>>();
function withDropLock<T>(dropId: string, fn: () => Promise<T>): Promise<T> {
  const prev = dropLockQueues.get(dropId) || Promise.resolve();
  const next = prev.then(fn, fn);
  dropLockQueues.set(
    dropId,
    next.catch(() => {})
  );
  return next;
}

function isMissingLocalUpload(url: unknown): boolean {
  if (typeof url !== 'string' || !url.startsWith('/uploads/')) return false;
  const filename = path.basename(url);
  if (!filename) return true;
  const resolved = path.resolve(UPLOADS_DIR, filename);
  if (!resolved.startsWith(UPLOADS_DIR + path.sep)) return true;
  return !fs.existsSync(resolved);
}

function normalizePlayer(row: any): any {
  if (!row) return row;
  const isOwner = isUnlimitedOwner(row);
  const fullName = String(row.full_name || row.name || row.username || 'Pengguna');
  const rawTgAvatar =
    row.telegram_avatar_url !== undefined
      ? row.telegram_avatar_url
      : telegramAvatarMemoryCache.get(String(row.id)) ?? null;
  const tgAvatar = isMissingLocalUpload(rawTgAvatar) ? null : rawTgAvatar;
  if (tgAvatar && row.id) {
    telegramAvatarMemoryCache.set(String(row.id), tgAvatar);
  }
  const cleanAvatarUrl = isMissingLocalUpload(row.avatar_url) ? tgAvatar || null : row.avatar_url;
  const cachedHasTgUsername = row.id ? telegramHasUsernameCache.get(String(row.id)) : undefined;
  const hasTelegramUsername =
    cachedHasTgUsername !== undefined
      ? cachedHasTgUsername
      : isOwner
        ? true
        : !/^tg_\d+/.test(String(row.username || ''));
  const resolvedBalance = resolveRowBalance(row);
  return {
    ...row,
    avatar_url: cleanAvatarUrl,
    name: fullName,
    full_name: fullName,
    telegram_avatar_url: tgAvatar,
    is_owner: isOwner,
    role: isOwner ? 'owner' : String(row.role || 'user'),
    has_telegram_username: hasTelegramUsername,
    coins: resolvedBalance,
    balance: resolvedBalance,
  };
}

async function syncProfilesTable(sb: SupabaseClient, playerRow: any) {
  const caps = await detectAuthSchemaCaps(sb);
  if (!caps.hasProfilesTable || !playerRow) return;
  try {
    const norm = normalizePlayer(playerRow);
    await sb.from('profiles').upsert(
      {
        id: norm.id,
        telegram_id: norm.telegram_id,
        username: norm.username,
        full_name: norm.full_name,
        bio: norm.bio || '',
        avatar_url: norm.avatar_url || null,
        telegram_avatar_url: norm.telegram_avatar_url || null,
        is_owner: norm.is_owner,
        coins: norm.coins,
      },
      { onConflict: 'telegram_id' }
    );
  } catch {
    // non-fatal sync
  }
}

function signSessionToken(playerId: string, hasTgUser?: boolean): string {
  const payloadObj: Record<string, unknown> = { pid: playerId, iat: Date.now() };
  if (typeof hasTgUser === 'boolean') {
    payloadObj.hasTgUser = hasTgUser;
  }
  const payload = Buffer.from(JSON.stringify(payloadObj), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifySessionToken(token: string): { pid: string; hasTgUser?: boolean } | null {
  try {
    const [payload, sig] = token.split('.');
    if (!payload || !sig) return null;
    const expectedSig = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(payload)
      .digest('base64url');
    const a = Buffer.from(sig, 'utf8');
    const b = Buffer.from(expectedSig, 'utf8');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!isUuid(decoded?.pid)) return null;
    return {
      pid: decoded.pid,
      hasTgUser: typeof decoded.hasTgUser === 'boolean' ? decoded.hasTgUser : undefined,
    };
  } catch {
    return null;
  }
}

function parseTelegramUserFromInitData(initData: string): any | undefined {
  try {
    const params = new URLSearchParams(initData);
    const rawUser = params.get('user');
    return rawUser ? JSON.parse(rawUser) : undefined;
  } catch {
    return undefined;
  }
}

function verifyTelegramInitData(initData: string, rawBotToken: string): { ok: boolean; user?: any } {
  try {
    const botToken = rawBotToken.replace(/^['"]|['"]$/g, '').trim();
    if (!/^\d+:[A-Za-z0-9_-]{20,}$/.test(botToken)) {
      return { ok: false, user: parseTelegramUserFromInitData(initData) };
    }
    const params = new URLSearchParams(initData);
    const hash = (params.get('hash') || '').trim().toLowerCase();
    if (!hash) return { ok: false };
    const entries: [string, string][] = [];
    params.forEach((value, key) => {
      if (key !== 'hash') entries.push([key, value]);
    });
    entries.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
    const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n');
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex').toLowerCase();
    const a = Buffer.from(hash, 'utf8');
    const b = Buffer.from(computedHash, 'utf8');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return { ok: false, user: parseTelegramUserFromInitData(initData) };
    }
    return { ok: true, user: parseTelegramUserFromInitData(initData) };
  } catch {
    return { ok: false };
  }
}

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const tgAvatarFetchCache = new Map<number, { ts: number; url: string | null }>();

async function fetchTelegramAvatarFromBotApi(
  sb: SupabaseClient,
  tgId: number
): Promise<string | null> {
  if (!Number.isSafeInteger(tgId) || tgId <= 0) return null;
  const cached = tgAvatarFetchCache.get(tgId);
  if (cached && Date.now() - cached.ts < 10 * 60 * 1000) {
    return cached.url;
  }

  const rawBotToken = (process.env.TELEGRAM_BOT_TOKEN || '').replace(/^['"]|['"]$/g, '').trim();
  if (!/^\d+:[A-Za-z0-9_-]{20,}$/.test(rawBotToken)) {
    return null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2800);
  try {
    const photosRes = await fetch(
      `https://api.telegram.org/bot${rawBotToken}/getUserProfilePhotos?user_id=${tgId}&limit=1`,
      { signal: controller.signal }
    );
    if (!photosRes.ok) {
      tgAvatarFetchCache.set(tgId, { ts: Date.now(), url: null });
      return null;
    }
    const photosData: any = await photosRes.json().catch(() => null);
    const sizes = photosData?.result?.photos?.[0];
    if (!Array.isArray(sizes) || sizes.length === 0) {
      tgAvatarFetchCache.set(tgId, { ts: Date.now(), url: null });
      return null;
    }
    const bestPhoto = sizes[sizes.length - 1];
    const fileId = bestPhoto?.file_id;
    if (typeof fileId !== 'string' || !fileId) {
      tgAvatarFetchCache.set(tgId, { ts: Date.now(), url: null });
      return null;
    }

    const fileRes = await fetch(
      `https://api.telegram.org/bot${rawBotToken}/getFile?file_id=${encodeURIComponent(fileId)}`,
      { signal: controller.signal }
    );
    if (!fileRes.ok) {
      tgAvatarFetchCache.set(tgId, { ts: Date.now(), url: null });
      return null;
    }
    const fileData: any = await fileRes.json().catch(() => null);
    const filePath = fileData?.result?.file_path;
    if (typeof filePath !== 'string' || !filePath || filePath.includes('..')) {
      tgAvatarFetchCache.set(tgId, { ts: Date.now(), url: null });
      return null;
    }

    const imgRes = await fetch(
      `https://api.telegram.org/file/bot${rawBotToken}/${filePath.replace(/^\/+/, '')}`,
      { signal: controller.signal }
    );
    if (!imgRes.ok) {
      tgAvatarFetchCache.set(tgId, { ts: Date.now(), url: null });
      return null;
    }
    const arrayBuf = await imgRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    if (buffer.byteLength === 0 || buffer.byteLength > 5 * 1024 * 1024) {
      tgAvatarFetchCache.set(tgId, { ts: Date.now(), url: null });
      return null;
    }

    const filename = `tg_avatar_${tgId}.jpg`;
    let publicUrl: string | null = null;
    try {
      const storagePath = `avatars/${filename}`;
      const { error: upErr } = await sb.storage
        .from('media')
        .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true });
      if (!upErr) {
        const { data: pubData } = sb.storage.from('media').getPublicUrl(storagePath);
        if (pubData?.publicUrl) {
          publicUrl = pubData.publicUrl;
        }
      }
    } catch {
      // fall back to local /uploads
    }

    if (!publicUrl) {
      const targetPath = path.resolve(UPLOADS_DIR, filename);
      if (targetPath.startsWith(UPLOADS_DIR + path.sep)) {
        fs.writeFileSync(targetPath, buffer);
        publicUrl = `/uploads/${filename}`;
      }
    }

    tgAvatarFetchCache.set(tgId, { ts: Date.now(), url: publicUrl });
    return publicUrl;
  } catch {
    tgAvatarFetchCache.set(tgId, { ts: Date.now(), url: null });
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function getSupabaseConfig() {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    ''
  ).trim();
  return { url, key };
}

let cachedClient: SupabaseClient | null = null;
let cachedConfigKey = '';

function getSupabase(): SupabaseClient | null {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;
  const sig = `${url}|${key}`;
  if (!cachedClient || cachedConfigKey !== sig) {
    cachedClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    cachedConfigKey = sig;
  }
  return cachedClient;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(val: unknown): val is string {
  return typeof val === 'string' && UUID_REGEX.test(val);
}

function sanitizeUrl(val: unknown): string | null {
  if (typeof val !== 'string') return null;
  const trimmed = val.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('/src/assets/')) {
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

function extractMentions(text: string): string[] {
  const matches = text.match(/@([a-zA-Z0-9_]+)/g) || [];
  return Array.from(new Set(matches.map((m) => m.slice(1).toLowerCase())));
}

// WebSocket client registry mapped by player_id
const wsClients = new Map<string, Set<WebSocket>>();

function broadcastToPlayer(playerId: string, event: string, payload: unknown) {
  const sockets = wsClients.get(playerId);
  if (!sockets) return;
  const msg = JSON.stringify({ event, payload });
  for (const ws of sockets) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  }
}

function broadcastToAll(event: string, payload: unknown) {
  const msg = JSON.stringify({ event, payload });
  for (const sockets of wsClients.values()) {
    for (const ws of sockets) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(msg);
      }
    }
  }
}

function isPlayerOnline(playerId: string): boolean {
  const sockets = wsClients.get(playerId);
  if (!sockets || sockets.size === 0) return false;
  for (const ws of sockets) {
    if (ws.readyState === WebSocket.OPEN) return true;
  }
  return false;
}

async function resolveAuthenticatedPlayerOnly(sb: SupabaseClient, req: Request) {
  const authHeader = req.header('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const tokenPayload = verifySessionToken(token);
    if (tokenPayload?.pid) {
      if (tokenPayload.hasTgUser !== undefined) {
        telegramHasUsernameCache.set(tokenPayload.pid, tokenPayload.hasTgUser);
      }
      const { data: foundByToken } = await sb
        .from('players')
        .select('*')
        .eq('id', tokenPayload.pid)
        .eq('is_banned', false)
        .maybeSingle();
      if (foundByToken) return normalizePlayer(foundByToken);
    }
  }

  const requestedId = req.header('x-player-id');
  if (requestedId && isUuid(requestedId)) {
    const { data: found } = await sb
      .from('players')
      .select('*')
      .eq('id', requestedId)
      .eq('is_banned', false)
      .maybeSingle();
    if (found) return normalizePlayer(found);
  }

  return null;
}

async function ensureOwnerAndResolvePlayer(sb: SupabaseClient, req: Request) {
  const resolved = await resolveAuthenticatedPlayerOnly(sb, req);
  if (resolved) return resolved;

  if (req.header('x-no-owner-fallback') === '1') {
    const authErr = new Error('Silakan buka aplikasi langsung lewat Bot Telegram.') as Error & {
      status?: number;
      code?: string;
    };
    authErr.status = 401;
    authErr.code = 'TELEGRAM_AUTH_REQUIRED';
    throw authErr;
  }

  const { data: existingOwner, error: selectErr } = await sb
    .from('players')
    .select('*')
    .eq('telegram_id', OWNER_TELEGRAM_ID)
    .maybeSingle();

  if (selectErr) throw selectErr;
  if (existingOwner) {
    if (!existingOwner.avatar_url || isMissingLocalUpload(existingOwner.avatar_url)) {
      const fetchedAv = await Promise.race([
        fetchTelegramAvatarFromBotApi(sb, OWNER_TELEGRAM_ID),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 650)),
      ]);
      if (fetchedAv) {
        const updatePayload: Record<string, any> = { avatar_url: fetchedAv };
        const caps = await detectAuthSchemaCaps(sb);
        if (caps.hasTelegramAvatarCol) {
          updatePayload.telegram_avatar_url = fetchedAv;
        }
        const { data: updatedOwner } = await sb
          .from('players')
          .update(updatePayload)
          .eq('id', existingOwner.id)
          .select('*')
          .maybeSingle();
        if (updatedOwner) {
          const norm = normalizePlayer(updatedOwner);
          telegramAvatarMemoryCache.set(String(norm.id), fetchedAv);
          await syncProfilesTable(sb, norm);
          return norm;
        }
      }
    }
    return normalizePlayer(existingOwner);
  }

  const ownerPayload = {
    telegram_id: OWNER_TELEGRAM_ID,
    name: OWNER_NAME,
    username: OWNER_DEFAULT_USERNAME,
    coins: OWNER_COINS,
    is_owner: true,
    border_id: OWNER_BORDER,
    has_followed_owner: true,
  };

  let { data: insertedOwner, error: insertErr } = await sb
    .from('players')
    .upsert(ownerPayload, { onConflict: 'telegram_id' })
    .select('*')
    .single();

  if (insertErr && /has_followed_owner/i.test(insertErr.message || '')) {
    const { has_followed_owner: _omit, ...fallbackPayload } = ownerPayload;
    const retry = await sb
      .from('players')
      .upsert(fallbackPayload, { onConflict: 'telegram_id' })
      .select('*')
      .single();
    insertedOwner = retry.data;
    insertErr = retry.error;
  }

  if (insertErr) {
    const { data: raceOwner } = await sb
      .from('players')
      .select('*')
      .eq('telegram_id', OWNER_TELEGRAM_ID)
      .maybeSingle();
    if (raceOwner) return normalizePlayer(raceOwner);
    throw insertErr;
  }
  return normalizePlayer(insertedOwner);
}

async function getBlockedSet(sb: SupabaseClient, playerId: string): Promise<{
  blockedByMe: Set<string>;
  blockedMe: Set<string>;
  anyBlocked: Set<string>;
}> {
  const { data: rows } = await sb
    .from('blocks')
    .select('blocker_id, blocked_id')
    .or(`blocker_id.eq.${playerId},blocked_id.eq.${playerId}`);

  const blockedByMe = new Set<string>();
  const blockedMe = new Set<string>();
  const anyBlocked = new Set<string>();

  for (const r of rows || []) {
    if (r.blocker_id === playerId) {
      blockedByMe.add(r.blocked_id);
      anyBlocked.add(r.blocked_id);
    }
    if (r.blocked_id === playerId) {
      blockedMe.add(r.blocker_id);
      anyBlocked.add(r.blocker_id);
    }
  }
  return { blockedByMe, blockedMe, anyBlocked };
}

async function getPlayersMap(sb: SupabaseClient, ids: string[], telegramIds: number[] = []) {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  const uniqueTgIds = Array.from(new Set(telegramIds.filter((n) => Number.isFinite(n) && n > 0)));
  const map = new Map<string, any>();
  const [byIdRes, byTgRes] = await Promise.all([
    uniqueIds.length > 0 ? sb.from('players').select('*').in('id', uniqueIds) : Promise.resolve({ data: [] as any[] }),
    uniqueTgIds.length > 0 ? sb.from('players').select('*').in('telegram_id', uniqueTgIds) : Promise.resolve({ data: [] as any[] }),
  ]);
  for (const p of [...(byIdRes.data || []), ...(byTgRes.data || [])]) {
    const norm = normalizePlayer(p);
    if (norm.id) map.set(norm.id, norm);
    if (norm.telegram_id) map.set(`tg:${norm.telegram_id}`, norm);
  }
  return map;
}

function resolveAuthorFromRow(row: any, playersMap: Map<string, any>) {
  const byId = row.player_id ? playersMap.get(row.player_id) : null;
  const byTg = row.telegram_id ? playersMap.get(`tg:${row.telegram_id}`) : null;
  const found = byId || byTg;
  if (found) return found;
  if (row.username || row.full_name || row.telegram_id) {
    const tgId = row.telegram_id ? Number(row.telegram_id) : null;
    const isOwner = isOwnerByTelegramId(tgId);
    const fullName = String(row.full_name || row.username || 'Pengguna');
    return {
      id: row.player_id || (tgId ? `tg_${tgId}` : 'unknown'),
      telegram_id: tgId,
      name: fullName,
      full_name: fullName,
      username: row.username || (tgId ? `tg_${tgId}` : 'user'),
      avatar_url: row.avatar_url || null,
      is_owner: isOwner,
      is_banned: false,
      coins: isOwner ? OWNER_COINS : 0,
      border_id: isOwner ? OWNER_BORDER : null,
      created_at: row.created_at || new Date().toISOString(),
    };
  }
  return null;
}

async function enrichPlayerStats(sb: SupabaseClient, targetPlayer: any, viewerId: string) {
  const normalizedTarget = normalizePlayer(targetPlayer);
  const [{ count: followersCount }, { count: followingCount }, { count: postsCount }, { data: followRow }, blocks] =
    await Promise.all([
      sb.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', normalizedTarget.id),
      sb.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', normalizedTarget.id),
      sb
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('player_id', normalizedTarget.id)
        .eq('is_deleted', false),
      sb
        .from('follows')
        .select('id')
        .eq('follower_id', viewerId)
        .eq('following_id', normalizedTarget.id)
        .maybeSingle(),
      getBlockedSet(sb, viewerId),
    ]);

  return {
    ...normalizedTarget,
    followers_count: followersCount || 0,
    following_count: followingCount || 0,
    posts_count: postsCount || 0,
    is_following: Boolean(followRow),
    is_blocked_by_me: blocks.blockedByMe.has(normalizedTarget.id),
    has_blocked_me: blocks.blockedMe.has(normalizedTarget.id),
  };
}

async function resolveOwnerAndFollowStatus(sb: SupabaseClient, viewer: any) {
  let { data: ownerRow } = await sb
    .from('players')
    .select('*')
    .eq('telegram_id', OWNER_TELEGRAM_ID)
    .maybeSingle();

  if (!ownerRow) {
    const ownerPayload = {
      telegram_id: OWNER_TELEGRAM_ID,
      name: OWNER_NAME,
      username: OWNER_DEFAULT_USERNAME,
      coins: OWNER_COINS,
      is_owner: true,
      border_id: OWNER_BORDER,
    };
    const { data: insertedOwner } = await sb
      .from('players')
      .upsert(ownerPayload, { onConflict: 'telegram_id' })
      .select('*')
      .maybeSingle();
    ownerRow = insertedOwner || null;
  }

  const normalizedOwner = ownerRow ? normalizePlayer(ownerRow) : null;
  let followsOwner = Boolean(viewer?.is_owner || isOwnerByTelegramId(viewer?.telegram_id));
  if (!followsOwner && normalizedOwner?.id && viewer?.id) {
    const { data: followRow } = await sb
      .from('follows')
      .select('id')
      .eq('follower_id', viewer.id)
      .eq('following_id', normalizedOwner.id)
      .maybeSingle();
    followsOwner = Boolean(followRow);
  }
  return { ownerPlayer: normalizedOwner, followsOwner };
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '75mb' }));
  app.use((err: any, _req: Request, res: Response, next: (e?: any) => void) => {
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({ error: 'Format JSON tidak valid' });
    }
    return next(err);
  });

  // Serve uploaded files safely with path traversal confinement
  app.get('/uploads/:filename', (req: Request, res: Response) => {
    const filename = path.basename(req.params.filename);
    const resolved = path.resolve(UPLOADS_DIR, filename);
    if (!resolved.startsWith(UPLOADS_DIR + path.sep)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (!fs.existsSync(resolved)) {
      return res.status(404).json({ error: 'File not found' });
    }
    return res.sendFile(resolved);
  });

  app.get('/api/health', (_req: Request, res: Response) => {
    const { url, key } = getSupabaseConfig();
    const missing: string[] = [];
    if (!url) missing.push('SUPABASE_URL');
    if (!key) missing.push('SUPABASE_ANON_KEY');
    res.json({
      ok: true,
      supabaseConfigured: Boolean(url && key),
      missing,
    });
  });

  // Upload photo/video/audio -> prioritize Supabase Storage bucket "media"
  app.post('/api/upload', async (req: Request, res: Response) => {
    try {
      const { mimeType, dataBase64 } = req.body || {};
      if (typeof mimeType !== 'string' || typeof dataBase64 !== 'string') {
        return res.status(400).json({ error: 'Invalid upload payload' });
      }
      const allowedMimes: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
        'image/heic': 'heic',
        'video/mp4': 'mp4',
        'video/webm': 'webm',
        'video/quicktime': 'mov',
        'video/x-m4v': 'm4v',
        'video/3gpp': '3gp',
        'audio/mpeg': 'mp3',
        'audio/mp3': 'mp3',
        'audio/mp4': 'm4a',
        'audio/wav': 'wav',
        'audio/ogg': 'ogg',
      };
      const ext = allowedMimes[mimeType.toLowerCase()];
      if (!ext) {
        return res.status(400).json({ error: 'Tipe file tidak didukung' });
      }
      const cleaned = dataBase64.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(cleaned, 'base64');
      if (buffer.byteLength === 0 || buffer.byteLength > 50 * 1024 * 1024) {
        return res.status(400).json({ error: 'Ukuran file maksimal 50MB' });
      }

      const fileName = `${crypto.randomUUID()}.${ext}`;

      // Upload to Supabase Storage bucket "media" first (falls back to "uploads" / "public" / local)
      const sb = getSupabase();
      let storageErrorMsg: string | null = null;
      if (sb) {
        for (const bucket of ['media', 'uploads', 'public']) {
          const { error: upErr } = await sb.storage.from(bucket).upload(fileName, buffer, {
            contentType: mimeType,
            upsert: false,
          });
          if (!upErr) {
            const { data: pub } = sb.storage.from(bucket).getPublicUrl(fileName);
            if (pub?.publicUrl) {
              return res.json({ url: pub.publicUrl, mediaType: mimeType.split('/')[0], bucket });
            }
          } else if (bucket === 'media') {
            storageErrorMsg = upErr.message;
            console.warn('[UPLOAD bucket media]', upErr.message);
          }
        }
      }

      const targetPath = path.resolve(UPLOADS_DIR, fileName);
      if (!targetPath.startsWith(UPLOADS_DIR + path.sep)) {
        return res.status(400).json({ error: 'Invalid filename' });
      }
      fs.writeFileSync(targetPath, buffer);
      return res.json({
        url: `/uploads/${fileName}`,
        mediaType: mimeType.split('/')[0],
        storageFallback: true,
        ...(storageErrorMsg ? { storageHint: storageErrorMsg } : {}),
      });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Upload gagal' });
    }
  });

  // Borders (read directly from Supabase `borders` and `player_borders`)
  app.get('/api/borders', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      const [bordersRes, pbRes] = await Promise.all([
        sb.from('borders').select('*').order('price_coins', { ascending: true }),
        sb.from('player_borders').select('*, borders(*)').eq('player_id', me.id),
      ]);

      if (bordersRes.error) {
        console.error('[GET /api/borders] borders table query failed:', bordersRes.error);
        return res.status(500).json({
          error: bordersRes.error.message || 'Gagal membaca tabel borders',
          details: bordersRes.error,
        });
      }
      if (pbRes.error) {
        console.error('[GET /api/borders] player_borders query failed:', pbRes.error);
      }

      const allRawBorders = bordersRes.data || [];
      const bannedNames = new Set(['RAJIN CHECK-IN', 'MISI SELESAI']);

      const allBorders = allRawBorders.filter((b: any) => {
        const upperName = String(b.name || '').trim().toUpperCase();
        const upperId = String(b.id || '').trim().toUpperCase();
        if (bannedNames.has(upperName)) return false;
        if (upperName.includes('NOBAR')) return false;
        const isFaizOwnerCard = upperId === 'FAIZ_OWNER' || upperName === 'FAIZ GANTENG';
        if (isFaizOwnerCard && !me.is_owner) return false;
        // FAIZ_SPIDERMAN stays visible to everyone so regular users see "KHUSUS OWNER" and Owner gets it free
        return true;
      });

      const ownedRows = pbRes.data || [];
      const ownedSet = new Set<string>(ownedRows.map((r: any) => String(r.border_id)));
      if (me.is_owner) {
        for (const b of allBorders) {
          ownedSet.add(String(b.id));
        }
      }

      const borders = allBorders.map((b: any) => {
        const upperName = String(b.name || '').trim().toUpperCase();
        const upperId = String(b.id || '').trim().toUpperCase();
        const isOwnerOnly =
          Boolean(b.is_owner_only) ||
          upperId === 'FAIZ_OWNER' ||
          upperId === 'FAIZ_SPIDERMAN' ||
          upperName === 'FAIZ GANTENG' ||
          upperName === 'FAIZ SPIDERMAN';
        return {
          ...b,
          is_owner_only: isOwnerOnly,
          owned: ownedSet.has(String(b.id)),
        };
      });

      const collectionBorders = me.is_owner
        ? borders
        : ownedRows
            .map((r: any) => r.borders || allBorders.find((b: any) => String(b.id) === String(r.border_id)))
            .filter(Boolean)
            .map((b: any) => ({ ...b, owned: true }));

      return res.json({
        borders,
        collectionBorders,
        ownedIds: Array.from(ownedSet),
        equippedBorderId: me.border_id || null,
        coins: me.is_owner ? OWNER_COINS : Number(me.coins || 0),
        rawCount: allRawBorders.length,
        rlsHint:
          allRawBorders.length === 0 && !process.env.SUPABASE_SERVICE_ROLE_KEY
            ? 'Tabel borders mengembalikan 0 baris ke anon key. Pastikan RLS tabel borders dimatikan atau buat policy SELECT using (true).'
            : null,
      });
    } catch (err: any) {
      console.error('[GET /api/borders ERROR]', err);
      return res.status(500).json({ error: err?.message || 'Gagal memuat border' });
    }
  });

  app.post('/api/borders/buy', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      const borderId = typeof req.body?.border_id === 'string' ? req.body.border_id.trim() : '';
      if (!borderId) return res.status(400).json({ error: 'Border tidak valid' });

      const { data: border, error: bErr } = await sb
        .from('borders')
        .select('*')
        .eq('id', borderId)
        .maybeSingle();
      if (bErr) throw bErr;
      if (!border) return res.status(404).json({ error: 'Border tidak ditemukan' });

      const upperName = String(border.name || '').trim().toUpperCase();
      const upperId = String(border.id || '').trim().toUpperCase();
      const isOwnerOnly =
        Boolean(border.is_owner_only) ||
        upperId === 'FAIZ_OWNER' ||
        upperId === 'FAIZ_SPIDERMAN' ||
        upperName === 'FAIZ GANTENG' ||
        upperName === 'FAIZ SPIDERMAN';
      if (isOwnerOnly && !me.is_owner) {
        return res.status(403).json({ error: 'Khusus Owner' });
      }
      if (upperName === 'RAJIN CHECK-IN' || upperName === 'MISI SELESAI' || upperName.includes('NOBAR')) {
        return res.status(400).json({ error: 'Border tidak tersedia' });
      }

      // Owner never pays coins; free access to all borders
      if (me.is_owner) {
        return res.json({
          ok: true,
          coins: OWNER_COINS,
          border,
        });
      }

      const { data: existingOwned } = await sb
        .from('player_borders')
        .select('border_id')
        .eq('player_id', me.id)
        .eq('border_id', border.id)
        .maybeSingle();

      if (existingOwned) {
        return res.status(400).json({ error: 'Border sudah dimiliki' });
      }

      const price = Number(border.price_coins || 0);
      const currentCoins = resolveRowBalance(me);
      if (currentCoins < price) {
        return res.status(400).json({ error: 'Coin tidak cukup' });
      }

      const newCoins = currentCoins - price;
      const updatedPlayer = await updatePlayerCoinsAndBalance(sb, me.id, newCoins);
      if (!updatedPlayer) {
        return res.status(400).json({ error: 'Coin tidak cukup' });
      }

      const { error: insErr } = await sb
        .from('player_borders')
        .upsert(
          { player_id: me.id, border_id: border.id },
          { onConflict: 'player_id,border_id' }
        );
      if (insErr) throw insErr;

      await syncProfilesTable(sb, updatedPlayer);

      return res.json({
        ok: true,
        coins: resolveRowBalance(updatedPlayer),
        border,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal membeli border' });
    }
  });

  app.post('/api/borders/equip', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      const borderId = typeof req.body?.border_id === 'string' ? req.body.border_id.trim() : '';
      if (!borderId) return res.status(400).json({ error: 'Border tidak valid' });

      const { data: border } = await sb
        .from('borders')
        .select('*')
        .eq('id', borderId)
        .maybeSingle();
      if (!border) return res.status(404).json({ error: 'Border tidak ditemukan' });

      const upperName = String(border.name || '').trim().toUpperCase();
      const upperId = String(border.id || '').trim().toUpperCase();
      const isOwnerOnly =
        Boolean(border.is_owner_only) ||
        upperId === 'FAIZ_OWNER' ||
        upperId === 'FAIZ_SPIDERMAN' ||
        upperName === 'FAIZ GANTENG' ||
        upperName === 'FAIZ SPIDERMAN';
      if (isOwnerOnly && !me.is_owner) {
        return res.status(403).json({ error: 'Khusus Owner' });
      }

      if (!me.is_owner) {
        const { data: ownedRow } = await sb
          .from('player_borders')
          .select('border_id')
          .eq('player_id', me.id)
          .eq('border_id', borderId)
          .maybeSingle();
        if (!ownedRow) {
          return res.status(403).json({ error: 'Kamu belum memiliki border ini' });
        }
      }

      const { data: updated, error: uErr } = await sb
        .from('players')
        .update({ border_id: border.id })
        .eq('id', me.id)
        .select('*')
        .single();
      if (uErr) throw uErr;

      return res.json({
        ok: true,
        border_id: updated.border_id,
        player: await enrichPlayerStats(sb, updated, me.id),
      });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal memakai border' });
    }
  });

  // Transfer Coins between users with Owner Infinity rule, transactions log, & real-time notification
  app.post('/api/coins/transfer', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      const rawAmount = Number(req.body?.amount);
      if (!Number.isFinite(rawAmount) || !Number.isInteger(rawAmount) || rawAmount <= 0) {
        return res.status(400).json({ error: 'Jumlah coin harus lebih dari 0' });
      }
      if (rawAmount > 1_000_000_000) {
        return res.status(400).json({ error: 'Jumlah coin melebihi batas maksimal' });
      }
      const amount = Math.trunc(rawAmount);

      const rawToId = typeof req.body?.to_player_id === 'string' ? req.body.to_player_id.trim() : '';
      const rawToUsername =
        typeof req.body?.to_username === 'string'
          ? req.body.to_username.trim().replace(/^@/, '')
          : '';

      if (!rawToId && !rawToUsername) {
        return res.status(400).json({ error: 'Pilih penerima transfer terlebih dahulu' });
      }

      let recipientRow: any = null;
      if (rawToId) {
        if (!isUuid(rawToId)) {
          return res.status(400).json({ error: 'ID penerima tidak valid' });
        }
        const { data } = await sb
          .from('players')
          .select('*')
          .eq('id', rawToId)
          .eq('is_banned', false)
          .maybeSingle();
        recipientRow = data;
      } else {
        const { data } = await sb
          .from('players')
          .select('*')
          .ilike('username', rawToUsername)
          .eq('is_banned', false)
          .maybeSingle();
        recipientRow = data;
      }

      if (!recipientRow) {
        return res.status(404).json({ error: 'Pengguna tujuan tidak ditemukan' });
      }

      if (recipientRow.id === me.id) {
        return res.status(400).json({ error: 'Tidak boleh transfer ke diri sendiri' });
      }

      const { data: freshSender, error: senderFetchErr } = await sb
        .from('players')
        .select('*')
        .eq('id', me.id)
        .eq('is_banned', false)
        .maybeSingle();
      if (senderFetchErr) throw senderFetchErr;
      if (!freshSender) {
        return res.status(404).json({ error: 'Akun pengirim tidak ditemukan' });
      }

      const senderIsOwner = isUnlimitedOwner(freshSender);
      const recipientIsOwner = isUnlimitedOwner(recipientRow);

      let senderCoinsAfter = OWNER_COINS;
      let updatedSenderRow = freshSender;

      if (!senderIsOwner) {
        const currentSenderCoins = resolveRowBalance(freshSender);
        if (currentSenderCoins < amount) {
          return res.status(400).json({ error: 'Saldo tidak cukup' });
        }
        const nextSenderCoins = currentSenderCoins - amount;
        const deductedSender = await updatePlayerCoinsAndBalance(sb, me.id, nextSenderCoins);
        if (!deductedSender) {
          return res.status(400).json({ error: 'Saldo tidak cukup' });
        }
        updatedSenderRow = deductedSender;
        senderCoinsAfter = resolveRowBalance(deductedSender);
      }

      let recipientCoinsAfter = OWNER_COINS;
      let updatedRecipientRow = recipientRow;

      if (!recipientIsOwner) {
        const currentRecipientCoins = resolveRowBalance(recipientRow);
        const nextRecipientCoins = currentRecipientCoins + amount;
        let creditedRecipient: any = null;
        try {
          creditedRecipient = await updatePlayerCoinsAndBalance(sb, recipientRow.id, nextRecipientCoins);
        } catch (creditErr: any) {
          if (!senderIsOwner) {
            await updatePlayerCoinsAndBalance(sb, me.id, resolveRowBalance(freshSender)).catch(() => {});
          }
          throw creditErr;
        }
        if (!creditedRecipient) {
          if (!senderIsOwner) {
            await updatePlayerCoinsAndBalance(sb, me.id, resolveRowBalance(freshSender)).catch(() => {});
          }
          throw new Error('Gagal menambahkan saldo penerima');
        }
        updatedRecipientRow = creditedRecipient;
        recipientCoinsAfter = resolveRowBalance(creditedRecipient);
      }

      await Promise.all([
        !senderIsOwner ? syncProfilesTable(sb, updatedSenderRow) : Promise.resolve(),
        !recipientIsOwner ? syncProfilesTable(sb, updatedRecipientRow) : Promise.resolve(),
      ]);

      const transactionRecorded = await recordTransferTransaction(sb, {
        senderId: me.id,
        recipientId: recipientRow.id,
        amount,
        senderUsername: me.username,
        recipientUsername: recipientRow.username,
        txType: 'transfer',
        note: `Transfer ke @${recipientRow.username}`,
      });

      const notifMessage = `Kamu menerima ${formatCoinsId(amount)} coin dari @${me.username}`;
      const notif = await insertNotificationSafe(sb, {
        toPlayerId: recipientRow.id,
        fromPlayerId: me.id,
        type: 'transfer',
        title: 'Terima Coin',
        message: notifMessage,
      });

      const normSender = normalizePlayer(updatedSenderRow);
      if (notif) {
        broadcastToPlayer(recipientRow.id, 'notification:new', {
          ...notif,
          title: notif.title || 'Terima Coin',
          message: notif.message || notifMessage,
          from_player: normSender,
        });
      }
      broadcastToPlayer(recipientRow.id, 'coin:transfer_received', {
        amount,
        from_player: normSender,
        new_coins: recipientCoinsAfter,
        notification_id: notif?.id || null,
        title: 'Terima Coin',
        message: notifMessage,
      });

      return res.json({
        ok: true,
        amount,
        senderCoins: senderCoinsAfter,
        recipient: normalizePlayer(updatedRecipientRow),
        transactionRecorded,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal mengirim coin' });
    }
  });

  // Public Supabase Realtime client config (returns ONLY public ANON key, never service role key)
  app.get('/api/realtime-config', (_req: Request, res: Response) => {
    const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
    const anonKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();
    if (!url || !anonKey) {
      return res.json({ enabled: false, url: null, anonKey: null });
    }
    return res.json({ enabled: true, url, anonKey });
  });

  // =========================================================================
  // OWNER PANEL: Broadcasts, Giveaways (Bagi-Bagi Coin WIB), & Stats
  // =========================================================================
  async function fetchAllBroadcasts(sb: SupabaseClient): Promise<BroadcastRow[]> {
    const { data, error } = await sb
      .from('broadcasts')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && Array.isArray(data)) {
      return data.map((b: any) => ({
        id: b.id,
        title: String(b.title || 'Pengumuman Owner'),
        message: String(b.message || ''),
        scheduled_at: b.scheduled_at || b.created_at,
        is_active: Boolean(b.is_active),
        created_by: b.created_by ?? null,
        created_at: b.created_at,
      }));
    }
    if (error && !isMissingRelationError(error)) {
      throw error;
    }
    return readOwnerPanelFallback().broadcasts.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  async function fetchAllGiveaways(sb: SupabaseClient): Promise<{
    giveaways: GiveawayRow[];
    claims: GiveawayClaimRow[];
  }> {
    const [gRes, cRes] = await Promise.all([
      sb.from('giveaways').select('*').order('scheduled_at', { ascending: true }),
      sb.from('giveaway_claims').select('*').order('claimed_at', { ascending: false }),
    ]);

    if (!gRes.error && !cRes.error && Array.isArray(gRes.data) && Array.isArray(cRes.data)) {
      return {
        giveaways: gRes.data.map((g: any) => ({
          id: g.id,
          amount_per_user: Number(g.amount_per_user || 0),
          max_winners: Number(g.max_winners || 0),
          claimed_count: Number(g.claimed_count || 0),
          scheduled_at: g.scheduled_at,
          status: String(g.status || 'scheduled'),
          created_by: g.created_by ?? null,
          created_at: g.created_at,
        })),
        claims: cRes.data.map((c: any) => ({
          id: c.id,
          giveaway_id: c.giveaway_id,
          user_id: c.user_id,
          amount: Number(c.amount || 0),
          claimed_at: c.claimed_at || c.created_at,
        })),
      };
    }

    if (gRes.error && !isMissingRelationError(gRes.error)) {
      throw gRes.error;
    }
    if (cRes.error && !isMissingRelationError(cRes.error)) {
      throw cRes.error;
    }

    const fb = readOwnerPanelFallback();
    return {
      giveaways: [...fb.giveaways].sort(
        (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
      ),
      claims: [...fb.claims].sort(
        (a, b) => new Date(b.claimed_at).getTime() - new Date(a.claimed_at).getTime()
      ),
    };
  }

  async function fetchOwnerStats(sb: SupabaseClient) {
    const todayStartIso = getWibTodayStartIso();
    const [playersRes, txRes] = await Promise.all([
      sb.from('players').select('id, username, role, is_owner, telegram_id, coins, balance, is_banned'),
      sb
        .from('transactions')
        .select('amount, tx_type, created_at')
        .gte('created_at', todayStartIso),
    ]);

    const playerRows = (playersRes.data || []).filter((p: any) => !p.is_banned);
    const totalUsers = playerRows.length;
    const totalCoinsCirculating = playerRows.reduce((sum: number, p: any) => {
      if (isUnlimitedOwner(p)) return sum;
      return sum + resolveRowBalance(p);
    }, 0);

    const txRows = (txRes.data || []).filter(
      (t: any) => !t.tx_type || String(t.tx_type).toLowerCase() === 'transfer'
    );
    const todayTransfersCount = txRows.length;
    const todayTransfersVolume = txRows.reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

    return {
      totalUsers,
      totalCoinsCirculating,
      todayTransfersCount,
      todayTransfersVolume,
    };
  }

  async function buildHydratedOwnerPanelState(sb: SupabaseClient, me: any | null) {
    const nowMs = Date.now();
    const isOwnerCaller = isUnlimitedOwner(me);
    const [allBroadcasts, { giveaways, claims }, stats] = await Promise.all([
      fetchAllBroadcasts(sb),
      fetchAllGiveaways(sb),
      isOwnerCaller ? fetchOwnerStats(sb).catch(() => null) : Promise.resolve(null),
    ]);

    const activeBroadcasts = allBroadcasts.filter((b) => {
      if (!b.is_active) return false;
      const schedMs = new Date(b.scheduled_at).getTime();
      return Number.isFinite(schedMs) && schedMs <= nowMs;
    });

    const claimsByGiveaway = new Map<string, GiveawayClaimRow[]>();
    for (const c of claims) {
      const list = claimsByGiveaway.get(c.giveaway_id) || [];
      list.push(c);
      claimsByGiveaway.set(c.giveaway_id, list);
    }

    let claimerMap = new Map<string, any>();
    if (isOwnerCaller && claims.length > 0) {
      const claimerIds = Array.from(new Set(claims.map((c) => c.user_id).filter(Boolean)));
      if (claimerIds.length > 0) {
        const { data: pRows } = await sb.from('players').select('*').in('id', claimerIds);
        for (const p of pRows || []) {
          claimerMap.set(p.id, normalizePlayer(p));
        }
      }
    }

    const hydratedGiveaways = giveaways
      .filter((g) => {
        if (isOwnerCaller) return true;
        return g.status !== 'cancelled';
      })
      .map((g) => {
        const gClaims = claimsByGiveaway.get(g.id) || [];
        const effectiveClaimed = Math.max(g.claimed_count || 0, gClaims.length);
        let effectiveStatus = g.status;
        const schedMs = new Date(g.scheduled_at).getTime();
        if (effectiveStatus !== 'cancelled' && effectiveStatus !== 'ended') {
          if (effectiveClaimed >= g.max_winners) {
            effectiveStatus = 'ended';
          } else if (Number.isFinite(schedMs) && schedMs <= nowMs) {
            effectiveStatus = 'live';
          } else {
            effectiveStatus = 'scheduled';
          }
        }
        return {
          ...g,
          claimed_count: effectiveClaimed,
          status: effectiveStatus,
          claimed_by_me: me ? gClaims.some((c) => c.user_id === me.id) : false,
          ...(isOwnerCaller
            ? {
                claims: gClaims.map((c) => ({
                  ...c,
                  player: claimerMap.get(c.user_id),
                })),
              }
            : {}),
        };
      });

    return {
      activeBroadcasts,
      ...(isOwnerCaller ? { allBroadcasts, stats } : {}),
      giveaways: hydratedGiveaways,
      serverNow: new Date(nowMs).toISOString(),
    };
  }

  app.get('/api/owner/panel-state', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      let me: any = null;
      try {
        me = await ensureOwnerAndResolvePlayer(sb, req);
      } catch {
        me = null;
      }
      const state = await buildHydratedOwnerPanelState(sb, me);
      return res.json(state);
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal memuat data panel owner' });
    }
  });

  app.post('/api/owner/broadcasts', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      if (!isUnlimitedOwner(me)) {
        return res.status(403).json({ error: 'Hanya Owner yang dapat membuat broadcast' });
      }

      const title =
        typeof req.body?.title === 'string' && req.body.title.trim()
          ? req.body.title.trim().slice(0, 80)
          : 'Pengumuman Owner';
      const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
      if (!message || message.length > 240) {
        return res.status(400).json({ error: 'Isi pesan broadcast wajib diisi (maks. 240 karakter)' });
      }

      const rawSched = req.body?.scheduled_at ? new Date(String(req.body.scheduled_at)).getTime() : Date.now();
      const scheduledAtIso = Number.isFinite(rawSched)
        ? new Date(rawSched).toISOString()
        : new Date().toISOString();
      const isActive = req.body?.is_active !== false;

      const newRow: BroadcastRow = {
        id: crypto.randomUUID(),
        title,
        message,
        scheduled_at: scheduledAtIso,
        is_active: isActive,
        created_by: me.id,
        created_at: new Date().toISOString(),
      };

      const { data: inserted, error: insErr } = await sb
        .from('broadcasts')
        .insert(newRow)
        .select('*')
        .maybeSingle();

      let saved = inserted as BroadcastRow | null;
      if (insErr) {
        if (!isMissingRelationError(insErr)) throw insErr;
        const fb = readOwnerPanelFallback();
        fb.broadcasts.unshift(newRow);
        writeOwnerPanelFallback(fb);
        saved = newRow;
      }

      broadcastToAll('owner_panel:updated', { reason: 'broadcast_created', id: saved?.id || newRow.id });
      return res.json({ broadcast: saved || newRow });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal membuat broadcast' });
    }
  });

  app.patch('/api/owner/broadcasts/:id', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      if (!isUnlimitedOwner(me)) {
        return res.status(403).json({ error: 'Hanya Owner yang dapat mengedit broadcast' });
      }
      const id = String(req.params.id || '').trim();
      if (!id) return res.status(400).json({ error: 'ID broadcast tidak valid' });

      const updates: Record<string, any> = {};
      if (typeof req.body?.title === 'string') {
        updates.title = req.body.title.trim().slice(0, 80) || 'Pengumuman Owner';
      }
      if (typeof req.body?.message === 'string') {
        const msg = req.body.message.trim();
        if (!msg || msg.length > 240) {
          return res.status(400).json({ error: 'Isi pesan broadcast wajib diisi (maks. 240 karakter)' });
        }
        updates.message = msg;
      }
      if (req.body?.scheduled_at) {
        const ms = new Date(String(req.body.scheduled_at)).getTime();
        if (!Number.isFinite(ms)) {
          return res.status(400).json({ error: 'Waktu jadwal WIB tidak valid' });
        }
        updates.scheduled_at = new Date(ms).toISOString();
      }
      if (typeof req.body?.is_active === 'boolean') {
        updates.is_active = req.body.is_active;
      }

      const { data: updated, error: updErr } = await sb
        .from('broadcasts')
        .update(updates)
        .eq('id', id)
        .select('*')
        .maybeSingle();

      let saved = updated as BroadcastRow | null;
      if (updErr) {
        if (!isMissingRelationError(updErr)) throw updErr;
        const fb = readOwnerPanelFallback();
        fb.broadcasts = fb.broadcasts.map((b) => (b.id === id ? { ...b, ...updates } : b));
        writeOwnerPanelFallback(fb);
        saved = fb.broadcasts.find((b) => b.id === id) || null;
      }

      broadcastToAll('owner_panel:updated', { reason: 'broadcast_updated', id });
      return res.json({ broadcast: saved });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal memperbarui broadcast' });
    }
  });

  app.delete('/api/owner/broadcasts/:id', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      if (!isUnlimitedOwner(me)) {
        return res.status(403).json({ error: 'Hanya Owner yang dapat menghapus broadcast' });
      }
      const id = String(req.params.id || '').trim();
      if (!id) return res.status(400).json({ error: 'ID broadcast tidak valid' });

      const { error: delErr } = await sb.from('broadcasts').delete().eq('id', id);
      if (delErr) {
        if (!isMissingRelationError(delErr)) throw delErr;
        const fb = readOwnerPanelFallback();
        fb.broadcasts = fb.broadcasts.filter((b) => b.id !== id);
        writeOwnerPanelFallback(fb);
      }

      broadcastToAll('owner_panel:updated', { reason: 'broadcast_deleted', id });
      return res.json({ ok: true });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal menghapus broadcast' });
    }
  });

  app.post('/api/owner/giveaways', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      if (!isUnlimitedOwner(me)) {
        return res.status(403).json({ error: 'Hanya Owner yang dapat membuat event bagi-bagi coin' });
      }

      const amountPerUser = Number(req.body?.amount_per_user);
      const maxWinners = Number(req.body?.max_winners);
      if (!Number.isInteger(amountPerUser) || amountPerUser <= 0 || amountPerUser > 1_000_000_000) {
        return res.status(400).json({ error: 'Jumlah coin per orang harus lebih dari 0' });
      }
      if (!Number.isInteger(maxWinners) || maxWinners <= 0 || maxWinners > 10_000) {
        return res.status(400).json({ error: 'Jumlah penerima minimal 1 dan maksimal 10.000 orang' });
      }

      const rawSched = req.body?.scheduled_at ? new Date(String(req.body.scheduled_at)).getTime() : Date.now();
      if (!Number.isFinite(rawSched)) {
        return res.status(400).json({ error: 'Waktu bagi-bagi coin WIB tidak valid' });
      }
      const isLiveNow = rawSched <= Date.now();

      const newRow: GiveawayRow = {
        id: crypto.randomUUID(),
        amount_per_user: Math.trunc(amountPerUser),
        max_winners: Math.trunc(maxWinners),
        claimed_count: 0,
        scheduled_at: new Date(rawSched).toISOString(),
        status: isLiveNow ? 'live' : 'scheduled',
        created_by: me.id,
        created_at: new Date().toISOString(),
      };

      const { data: inserted, error: insErr } = await sb
        .from('giveaways')
        .insert(newRow)
        .select('*')
        .maybeSingle();

      let saved = inserted as GiveawayRow | null;
      if (insErr) {
        if (!isMissingRelationError(insErr)) throw insErr;
        const fb = readOwnerPanelFallback();
        fb.giveaways.unshift(newRow);
        writeOwnerPanelFallback(fb);
        saved = newRow;
      }

      broadcastToAll('owner_panel:updated', {
        reason: 'giveaway_created',
        id: saved?.id || newRow.id,
      });

      return res.json({
        giveaway: {
          ...(saved || newRow),
          claimed_by_me: false,
          claims: [],
        },
      });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal membuat event bagi-bagi coin' });
    }
  });

  app.patch('/api/owner/giveaways/:id/cancel', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      if (!isUnlimitedOwner(me)) {
        return res.status(403).json({ error: 'Hanya Owner yang dapat membatalkan event' });
      }
      const id = String(req.params.id || '').trim();
      if (!id) return res.status(400).json({ error: 'ID event tidak valid' });

      const { data: updated, error: updErr } = await sb
        .from('giveaways')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .select('*')
        .maybeSingle();

      if (updErr) {
        if (!isMissingRelationError(updErr)) throw updErr;
        const fb = readOwnerPanelFallback();
        fb.giveaways = fb.giveaways.map((g) => (g.id === id ? { ...g, status: 'cancelled' } : g));
        writeOwnerPanelFallback(fb);
      }

      broadcastToAll('owner_panel:updated', { reason: 'giveaway_cancelled', id });
      return res.json({ ok: true, giveaway: updated || null });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal membatalkan event' });
    }
  });

  app.delete('/api/owner/giveaways/:id', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      if (!isUnlimitedOwner(me)) {
        return res.status(403).json({ error: 'Hanya Owner yang dapat menghapus event' });
      }
      const id = String(req.params.id || '').trim();
      if (!id) return res.status(400).json({ error: 'ID event tidak valid' });

      const { error: delClaimErr } = await sb.from('giveaway_claims').delete().eq('giveaway_id', id);
      const { error: delErr } = await sb.from('giveaways').delete().eq('id', id);

      if (delErr || delClaimErr) {
        const errToCheck = delErr || delClaimErr;
        if (!isMissingRelationError(errToCheck)) throw errToCheck;
        const fb = readOwnerPanelFallback();
        fb.giveaways = fb.giveaways.filter((g) => g.id !== id);
        fb.claims = fb.claims.filter((c) => c.giveaway_id !== id);
        writeOwnerPanelFallback(fb);
      }

      broadcastToAll('owner_panel:updated', { reason: 'giveaway_deleted', id });
      return res.json({ ok: true });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal menghapus event bagi-bagi coin' });
    }
  });

  app.post('/api/giveaways/:id/claim', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    const giveawayId = String(req.params.id || '').trim();
    if (!giveawayId) return res.status(400).json({ error: 'ID bagi-bagi coin tidak valid' });

    try {
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      if (isUnlimitedOwner(me)) {
        return res.status(400).json({ error: 'Akun Owner tidak mengambil kuota member' });
      }

      const result = await withDropLock(giveawayId, async () => {
        const { giveaways, claims } = await fetchAllGiveaways(sb);
        const giveaway = giveaways.find((g) => g.id === giveawayId);
        if (!giveaway) {
          return { status: 404, body: { error: 'Event bagi-bagi coin tidak ditemukan' } };
        }
        if (giveaway.status === 'cancelled') {
          return { status: 400, body: { error: 'Event bagi-bagi coin telah dibatalkan' } };
        }

        const nowMs = Date.now();
        const schedMs = new Date(giveaway.scheduled_at).getTime();
        if (Number.isFinite(schedMs) && nowMs < schedMs) {
          return {
            status: 400,
            body: { error: 'Belum waktunya klaim! Tunggu sampai jam WIB yang ditentukan.' },
          };
        }

        // Duplicate claim check directly against database claims
        const { data: existingDbClaim, error: dupErr } = await sb
          .from('giveaway_claims')
          .select('id')
          .eq('giveaway_id', giveawayId)
          .eq('user_id', me.id)
          .maybeSingle();

        if (dupErr && !isMissingRelationError(dupErr)) throw dupErr;
        const gClaims = claims.filter((c) => c.giveaway_id === giveawayId);
        if (existingDbClaim || gClaims.some((c) => c.user_id === me.id)) {
          return { status: 400, body: { error: 'Sudah Diklaim! Kamu hanya bisa klaim 1 kali per event.' } };
        }

        const currentClaimed = Math.max(giveaway.claimed_count || 0, gClaims.length);
        if (giveaway.status === 'ended' || currentClaimed >= giveaway.max_winners) {
          return { status: 400, body: { error: 'Slot Habis! Kuota bagi-bagi coin sudah penuh.' } };
        }

        const newClaim: GiveawayClaimRow = {
          id: crypto.randomUUID(),
          giveaway_id: giveawayId,
          user_id: me.id,
          amount: giveaway.amount_per_user,
          claimed_at: new Date().toISOString(),
        };

        const { error: claimInsErr } = await sb.from('giveaway_claims').insert(newClaim);
        if (claimInsErr) {
          if (isMissingRelationError(claimInsErr)) {
            const fb = readOwnerPanelFallback();
            const fbClaims = fb.claims.filter((c) => c.giveaway_id === giveawayId);
            if (fbClaims.some((c) => c.user_id === me.id)) {
              return { status: 400, body: { error: 'Sudah Diklaim! Kamu hanya bisa klaim 1 kali per event.' } };
            }
            if (fbClaims.length >= giveaway.max_winners) {
              return { status: 400, body: { error: 'Slot Habis! Kuota bagi-bagi coin sudah penuh.' } };
            }
            fb.claims.unshift(newClaim);
            fb.giveaways = fb.giveaways.map((g) => {
              if (g.id !== giveawayId) return g;
              const nextCount = fbClaims.length + 1;
              return {
                ...g,
                claimed_count: nextCount,
                status: nextCount >= g.max_winners ? 'ended' : 'live',
              };
            });
            writeOwnerPanelFallback(fb);
          } else if (String(claimInsErr.code || '') === '23505') {
            return { status: 400, body: { error: 'Sudah Diklaim! Kamu hanya bisa klaim 1 kali per event.' } };
          } else {
            throw claimInsErr;
          }
        } else {
          const nextCount = currentClaimed + 1;
          await sb
            .from('giveaways')
            .update({
              claimed_count: nextCount,
              status: nextCount >= giveaway.max_winners ? 'ended' : 'live',
            })
            .eq('id', giveawayId);
        }

        const { data: freshPlayer, error: pErr } = await sb
          .from('players')
          .select('*')
          .eq('id', me.id)
          .maybeSingle();
        if (pErr || !freshPlayer) {
          throw pErr || new Error('Akun tidak ditemukan');
        }

        const nextCoins = resolveRowBalance(freshPlayer) + Number(giveaway.amount_per_user);
        const updatedPlayer = await updatePlayerCoinsAndBalance(sb, me.id, nextCoins);
        if (!updatedPlayer) {
          throw new Error('Gagal menambahkan coin');
        }

        await syncProfilesTable(sb, updatedPlayer);

        const { data: ownerPlayerRow } = await sb
          .from('players')
          .select('*')
          .or(`telegram_id.eq.${OWNER_TELEGRAM_ID},username.ilike.afz`)
          .limit(1)
          .maybeSingle();

        await recordTransferTransaction(sb, {
          senderId: ownerPlayerRow?.id || me.id,
          recipientId: me.id,
          amount: giveaway.amount_per_user,
          senderUsername: ownerPlayerRow?.username || 'afz',
          recipientUsername: me.username,
          txType: 'giveaway',
          note: `Bagi-Bagi Coin (+${formatCoinsId(giveaway.amount_per_user)} coin)`,
        });

        const notifMessage = `Kamu mendapat ${formatCoinsId(giveaway.amount_per_user)} coin dari Bagi-Bagi Coin Owner!`;
        const notif = await insertNotificationSafe(sb, {
          toPlayerId: me.id,
          fromPlayerId: ownerPlayerRow?.id || null,
          type: 'coin_drop',
          title: 'Terima Coin',
          message: notifMessage,
        });

        if (notif) {
          broadcastToPlayer(me.id, 'notification:new', {
            ...notif,
            title: notif.title || 'Terima Coin',
            message: notif.message || notifMessage,
            from_player: ownerPlayerRow ? normalizePlayer(ownerPlayerRow) : null,
          });
        }
        broadcastToPlayer(me.id, 'coin:transfer_received', {
          amount: giveaway.amount_per_user,
          from_player: ownerPlayerRow ? normalizePlayer(ownerPlayerRow) : null,
          new_coins: nextCoins,
          notification_id: notif?.id || null,
          title: 'Terima Coin',
          message: notifMessage,
        });
        broadcastToAll('owner_panel:updated', {
          reason: 'giveaway_claimed',
          giveawayId,
        });

        return {
          status: 200,
          body: {
            ok: true,
            amount: giveaway.amount_per_user,
            newCoins: nextCoins,
            claimedCount: currentClaimed + 1,
          },
        };
      });

      return res.status(result.status).json(result.body);
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal klaim bagi-bagi coin' });
    }
  });

  async function handleTelegramLogin(
    sb: SupabaseClient,
    initData: string,
    rawUserInput: any
  ): Promise<{ status: number; body: Record<string, any> }> {
    const rawBotToken = (process.env.TELEGRAM_BOT_TOKEN || '').replace(/^['"]|['"]$/g, '').trim();
    const hasValidBotToken = /^\d+:[A-Za-z0-9_-]{20,}$/.test(rawBotToken);
    let tgUser = rawUserInput || (initData ? parseTelegramUserFromInitData(initData) : undefined);

    if (hasValidBotToken && initData) {
      const verified = verifyTelegramInitData(initData, rawBotToken);
      if (verified.ok) {
        if (verified.user) tgUser = verified.user;
      } else {
        console.warn('[TG AUTH] initData HMAC mismatch — periksa TELEGRAM_BOT_TOKEN di Secrets');
        if (process.env.TELEGRAM_STRICT_AUTH === 'true') {
          return { status: 401, body: { error: 'Verifikasi Telegram initData gagal' } };
        }
        if (verified.user) tgUser = verified.user;
      }
    } else if (initData && !tgUser?.id) {
      tgUser = parseTelegramUserFromInitData(initData);
    }

    const tgId = Number(tgUser?.id);
    if (!Number.isSafeInteger(tgId) || tgId <= 0) {
      return { status: 400, body: { error: 'Data Telegram user tidak valid' } };
    }

    const isOwner = isOwnerByTelegramId(tgId);
    const rawTgUsername =
      typeof tgUser?.username === 'string'
        ? tgUser.username.replace(/^@/, '').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 32)
        : '';
    const resolvedUsername = rawTgUsername || `tg_${tgId}`;

    const firstName = typeof tgUser?.first_name === 'string' ? tgUser.first_name.trim() : '';
    const lastName = typeof tgUser?.last_name === 'string' ? tgUser.last_name.trim() : '';
    const combinedName = [firstName, lastName].filter(Boolean).join(' ').trim().slice(0, 20);
    const tgFullName = combinedName || resolvedUsername.slice(0, 20);
    let tgPhotoUrl = sanitizeUrl(tgUser?.photo_url);

    const [caps, existingRes] = await Promise.all([
      detectAuthSchemaCaps(sb),
      sb.from('players').select('*').eq('telegram_id', tgId).maybeSingle(),
    ]);
    if (existingRes.error) throw existingRes.error;
    const existing = existingRes.data;

    let profileRow: any = null;
    if (caps.hasProfilesTable) {
      const { data: pRow } = await sb
        .from('profiles')
        .select('*')
        .eq('telegram_id', tgId)
        .maybeSingle();
      profileRow = pRow || null;
    }

    if (!tgPhotoUrl) {
      const profAv = sanitizeUrl(profileRow?.telegram_avatar_url) || sanitizeUrl(profileRow?.avatar_url);
      if (profAv && !isMissingLocalUpload(profAv)) {
        tgPhotoUrl = profAv;
      } else if (!existing?.avatar_url || isMissingLocalUpload(existing.avatar_url)) {
        const bgFetch = fetchTelegramAvatarFromBotApi(sb, tgId)
          .then(async (fetchedUrl) => {
            if (!fetchedUrl) return null;
            const bgUpdate: Record<string, any> = { avatar_url: fetchedUrl };
            if (caps.hasTelegramAvatarCol) bgUpdate.telegram_avatar_url = fetchedUrl;
            await sb.from('players').update(bgUpdate).eq('telegram_id', tgId);
            return fetchedUrl;
          })
          .catch(() => null);
        tgPhotoUrl = await Promise.race([
          bgFetch,
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 650)),
        ]);
      }
    }

    let activeRow = existing;

    if (!existing) {
      let finalUsername = resolvedUsername;
      const { data: collider } = await sb
        .from('players')
        .select('id, telegram_id, username')
        .eq('username', resolvedUsername)
        .maybeSingle();
      if (collider) {
        if (isOwner) {
          await sb
            .from('players')
            .update({ username: `${collider.username}_${String(collider.id).slice(0, 4)}` })
            .eq('id', collider.id);
        } else {
          finalUsername = `${resolvedUsername.slice(0, 24)}_${String(tgId).slice(-4)}`;
        }
      }

      const rawProfAv = sanitizeUrl(profileRow?.avatar_url);
      const initialAvatar = (rawProfAv && !isMissingLocalUpload(rawProfAv) ? rawProfAv : null) || tgPhotoUrl;
      const initialName =
        (typeof profileRow?.full_name === 'string' && profileRow.full_name.trim())
          ? profileRow.full_name.trim().slice(0, 20)
          : tgFullName;
      const initialBio = typeof profileRow?.bio === 'string' ? profileRow.bio : '';

      const newPayload: Record<string, any> = {
        telegram_id: tgId,
        username: finalUsername,
        name: initialName,
        avatar_url: initialAvatar,
        bio: initialBio,
        is_owner: isOwner,
        role: isOwner ? 'owner' : 'user',
        is_banned: false,
        coins: isOwner ? OWNER_COINS : 500,
        balance: isOwner ? OWNER_COINS : 500,
        border_id: isOwner ? OWNER_BORDER : null,
      };
      if (caps.hasTelegramAvatarCol) {
        newPayload.telegram_avatar_url = tgPhotoUrl;
      }

      const { data: inserted, error: insErr } = await sb
        .from('players')
        .insert(newPayload)
        .select('*')
        .single();
      if (insErr) {
        const { data: raceRow } = await sb
          .from('players')
          .select('*')
          .eq('telegram_id', tgId)
          .maybeSingle();
        if (raceRow) {
          activeRow = raceRow;
        } else {
          throw insErr;
        }
      } else {
        activeRow = inserted;
      }
    } else {
      // Existing user: preserve custom name, custom avatar_url, and bio!
      // Sync Telegram username if Telegram account has username; repair missing/broken local upload avatars;
      // strictly enforce is_owner and role by telegram_id.
      const updates: Record<string, any> = {};

      if (rawTgUsername && rawTgUsername !== existing.username) {
        const { data: collider } = await sb
          .from('players')
          .select('id, username')
          .eq('username', rawTgUsername)
          .neq('id', existing.id)
          .maybeSingle();
        if (collider) {
          if (isOwner) {
            await sb
              .from('players')
              .update({ username: `${collider.username}_${String(collider.id).slice(0, 4)}` })
              .eq('id', collider.id);
            updates.username = rawTgUsername;
          }
        } else {
          updates.username = rawTgUsername;
        }
      }

      const rawProfAv = sanitizeUrl(profileRow?.avatar_url) || sanitizeUrl(profileRow?.telegram_avatar_url);
      const hydratedAvatar =
        tgPhotoUrl || (rawProfAv && !isMissingLocalUpload(rawProfAv) ? rawProfAv : null);
      if ((!existing.avatar_url || isMissingLocalUpload(existing.avatar_url)) && hydratedAvatar) {
        updates.avatar_url = hydratedAvatar;
      } else if (isMissingLocalUpload(existing.avatar_url) && !hydratedAvatar) {
        updates.avatar_url = null;
      }
      if (!existing.bio && typeof profileRow?.bio === 'string' && profileRow.bio.trim()) {
        updates.bio = profileRow.bio;
      }
      const existingNameTrimmed = String(existing.name || '').trim();
      if (!existingNameTrimmed || existingNameTrimmed === 'Pengguna' || /^tg_\d+$/.test(existingNameTrimmed)) {
        const fallbackProfName =
          typeof profileRow?.full_name === 'string' && profileRow.full_name.trim()
            ? profileRow.full_name.trim().slice(0, 20)
            : '';
        updates.name = fallbackProfName || tgFullName;
      }

      if (tgPhotoUrl && caps.hasTelegramAvatarCol && existing.telegram_avatar_url !== tgPhotoUrl) {
        updates.telegram_avatar_url = tgPhotoUrl;
      }
      if (
        isOwner &&
        (!existing.is_owner ||
          String(existing.role || '').toLowerCase() !== 'owner' ||
          Number(existing.coins) !== OWNER_COINS ||
          Number(existing.balance) !== OWNER_COINS)
      ) {
        updates.is_owner = true;
        updates.role = 'owner';
        updates.coins = OWNER_COINS;
        updates.balance = OWNER_COINS;
      } else if (!isOwner && (existing.is_owner || String(existing.role || '').toLowerCase() === 'owner')) {
        updates.is_owner = false;
        updates.role = 'user';
      }

      if (Object.keys(updates).length > 0) {
        const { data: updated, error: updErr } = await sb
          .from('players')
          .update(updates)
          .eq('id', existing.id)
          .select('*')
          .single();
        if (updErr) throw updErr;
        activeRow = updated;
      }
    }

    const hasTgUsername = Boolean(rawTgUsername);
    if (tgPhotoUrl && activeRow?.id) {
      telegramAvatarMemoryCache.set(String(activeRow.id), tgPhotoUrl);
    }
    if (activeRow?.id) {
      telegramHasUsernameCache.set(String(activeRow.id), hasTgUsername);
    }

    const normalizedRow = normalizePlayer(activeRow);
    void syncProfilesTable(sb, normalizedRow);

    const [enriched, ownerState, playersRes] = await Promise.all([
      enrichPlayerStats(sb, normalizedRow, normalizedRow.id),
      resolveOwnerAndFollowStatus(sb, normalizedRow),
      sb
        .from('players')
        .select('id, telegram_id, name, username, avatar_url, is_owner, role, border_id, coins, balance')
        .eq('is_banned', false)
        .order('is_owner', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(50),
    ]);

    return {
      status: 200,
      body: {
        player: {
          ...enriched,
          has_telegram_username: hasTgUsername,
          follows_owner: ownerState.followsOwner,
        },
        sessionToken: signSessionToken(normalizedRow.id, hasTgUsername),
        players: (playersRes.data || []).map((p) => normalizePlayer(p)),
        ownerPlayer: ownerState.ownerPlayer,
      },
    };
  }

  // Telegram Mini App Login (POST primary + GET fallback for strict WebView proxies)
  app.post('/api/auth/telegram', async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    const sb = getSupabase();
    if (!sb) {
      return res.status(503).json({
        error: 'SUPABASE_NOT_CONFIGURED',
        message: 'Tambahkan SUPABASE_URL dan SUPABASE_ANON_KEY di Settings -> Secrets.',
      });
    }
    try {
      const initData = typeof req.body?.initData === 'string' ? req.body.initData : '';
      const result = await handleTelegramLogin(sb, initData, req.body?.user);
      return res.status(result.status).json(result.body);
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal login Telegram' });
    }
  });

  app.get('/api/auth/telegram-login', async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    const sb = getSupabase();
    if (!sb) {
      return res.status(503).json({
        error: 'SUPABASE_NOT_CONFIGURED',
        message: 'Tambahkan SUPABASE_URL dan SUPABASE_ANON_KEY di Settings -> Secrets.',
      });
    }
    try {
      const initData = typeof req.query.initData === 'string' ? req.query.initData : '';
      const rawTgId = Number(req.query.tg_id);
      const queryUser =
        Number.isSafeInteger(rawTgId) && rawTgId > 0
          ? {
              id: rawTgId,
              username: typeof req.query.username === 'string' ? req.query.username : undefined,
              first_name: typeof req.query.first_name === 'string' ? req.query.first_name : undefined,
              last_name: typeof req.query.last_name === 'string' ? req.query.last_name : undefined,
              photo_url: typeof req.query.photo_url === 'string' ? req.query.photo_url : undefined,
            }
          : undefined;
      const result = await handleTelegramLogin(sb, initData, queryUser);
      return res.status(result.status).json(result.body);
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal login Telegram' });
    }
  });

  // Auth / Me (loads verified active session; ONLY falls back to Owner in AI Studio preview without x-no-owner-fallback)
  app.get('/api/auth/me', async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    const sb = getSupabase();
    if (!sb) {
      return res.status(503).json({
        error: 'SUPABASE_NOT_CONFIGURED',
        message: 'Tambahkan SUPABASE_URL dan SUPABASE_ANON_KEY di Settings -> Secrets.',
      });
    }
    try {
      const player = await ensureOwnerAndResolvePlayer(sb, req);
      const [enriched, ownerState, playersRes] = await Promise.all([
        enrichPlayerStats(sb, player, player.id),
        resolveOwnerAndFollowStatus(sb, player),
        sb
          .from('players')
          .select('id, telegram_id, name, username, avatar_url, is_owner, role, border_id, coins, balance')
          .eq('is_banned', false)
          .order('is_owner', { ascending: false })
          .order('created_at', { ascending: true })
          .limit(50),
      ]);
      return res.json({
        player: {
          ...enriched,
          follows_owner: ownerState.followsOwner,
        },
        sessionToken: signSessionToken(player.id, enriched.has_telegram_username),
        players: (playersRes.data || []).map((p) => normalizePlayer(p)),
        ownerPlayer: ownerState.ownerPlayer,
      });
    } catch (err: any) {
      const status = typeof err?.status === 'number' ? err.status : 500;
      return res.status(status).json({
        error: err?.code || err?.message || 'Gagal memuat akun',
        message: err?.message || 'Gagal memuat akun',
      });
    }
  });

  // Update own profile: full_name (max 20 chars), avatar_url, bio, and username ONLY when Telegram account has no username
  app.patch('/api/players/me', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      const updates: Record<string, any> = {};

      const rawFullName =
        typeof req.body?.full_name === 'string'
          ? req.body.full_name
          : typeof req.body?.name === 'string'
            ? req.body.name
            : undefined;
      if (rawFullName !== undefined) {
        const trimmedName = rawFullName.trim().slice(0, 20);
        if (!trimmedName) {
          return res.status(400).json({ error: 'Nama tidak boleh kosong' });
        }
        updates.name = trimmedName;
      }

      if (typeof req.body?.username === 'string') {
        const cachedHasTg = telegramHasUsernameCache.get(String(me.id));
        const hasTgUsername = me.is_owner
          ? true
          : cachedHasTg !== undefined
            ? cachedHasTg
            : !/^tg_\d+/.test(String(me.username || ''));
        if (hasTgUsername) {
          return res.status(400).json({
            error: 'Username mengikuti akun Telegram kamu dan tidak dapat diubah',
          });
        }
        const cleanedUsername = req.body.username
          .trim()
          .replace(/^@/, '')
          .replace(/[^a-zA-Z0-9_]/g, '')
          .toLowerCase()
          .slice(0, 20);
        if (cleanedUsername.length < 3) {
          return res.status(400).json({
            error: 'Username minimal 3 karakter (huruf, angka, atau _)',
          });
        }
        if (!me.is_owner && (cleanedUsername === 'afz' || cleanedUsername === 'istamina')) {
          return res.status(400).json({
            error: 'Username tersebut khusus Owner dan tidak dapat digunakan',
          });
        }
        const { data: existingUsername } = await sb
          .from('players')
          .select('id')
          .ilike('username', cleanedUsername)
          .neq('id', me.id)
          .maybeSingle();
        if (existingUsername) {
          return res.status(400).json({ error: 'Username sudah dipakai pengguna lain' });
        }
        updates.username = cleanedUsername;
      }

      if (typeof req.body?.bio === 'string') {
        updates.bio = req.body.bio.trim().slice(0, 300);
      }

      if (req.body?.avatar_url !== undefined) {
        if (req.body.avatar_url === '' || req.body.avatar_url === null) {
          updates.avatar_url = null;
        } else {
          const cleanAvatar = sanitizeUrl(req.body.avatar_url);
          if (!cleanAvatar) {
            return res.status(400).json({ error: 'URL foto profil tidak valid' });
          }
          updates.avatar_url = cleanAvatar;
        }
      }

      if (Object.keys(updates).length === 0) {
        const [enriched, ownerState] = await Promise.all([
          enrichPlayerStats(sb, me, me.id),
          resolveOwnerAndFollowStatus(sb, me),
        ]);
        return res.json({ player: { ...enriched, follows_owner: ownerState.followsOwner } });
      }

      const { data: updated, error } = await sb
        .from('players')
        .update(updates)
        .eq('id', me.id)
        .select('*')
        .single();
      if (error) throw error;

      await syncProfilesTable(sb, updated);

      const [enriched, ownerState] = await Promise.all([
        enrichPlayerStats(sb, updated, me.id),
        resolveOwnerAndFollowStatus(sb, updated),
      ]);
      return res.json({ player: { ...enriched, follows_owner: ownerState.followsOwner } });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal update profil' });
    }
  });

  // Search / list players (Owner always included)
  app.get('/api/players', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
      let query = sb
        .from('players')
        .select('*')
        .eq('is_banned', false)
        .order('is_owner', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

      if (q) {
        const safeQ = q.replace(/[%_,()]/g, '');
        if (safeQ) {
          query = query.or(`username.ilike.%${safeQ}%,name.ilike.%${safeQ}%`);
        }
      }

      const [{ data: rows, error }, { data: myFollows }, blocks] = await Promise.all([
        query,
        sb.from('follows').select('following_id').eq('follower_id', me.id),
        getBlockedSet(sb, me.id),
      ]);

      if (error) throw error;
      const followingSet = new Set((myFollows || []).map((f) => f.following_id));

      const players = (rows || []).map((p) => ({
        ...normalizePlayer(p),
        is_following: followingSet.has(p.id),
        is_blocked_by_me: blocks.blockedByMe.has(p.id),
        has_blocked_me: blocks.blockedMe.has(p.id),
      }));
      return res.json({ players });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal memuat pengguna' });
    }
  });

  // Blocked users list
  app.get('/api/players/me/blocked', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      const { data: blockRows } = await sb
        .from('blocks')
        .select('blocked_id')
        .eq('blocker_id', me.id);
      const ids = (blockRows || []).map((b) => b.blocked_id);
      if (ids.length === 0) return res.json({ players: [] });
      const { data: players } = await sb.from('players').select('*').in('id', ids);
      return res.json({ players: (players || []).map((p) => normalizePlayer(p)) });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal memuat daftar blokir' });
    }
  });

  // Get player profile by username or id
  app.get('/api/players/:identifier', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      const identifier = req.params.identifier;
      const query = isUuid(identifier)
        ? sb.from('players').select('*').eq('id', identifier).maybeSingle()
        : sb.from('players').select('*').eq('username', identifier).maybeSingle();
      const { data: target, error } = await query;
      if (error) throw error;
      if (!target) return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
      const enriched = await enrichPlayerStats(sb, target, me.id);
      return res.json({ player: enriched });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal memuat profil' });
    }
  });

  // Followers / Following lists
  app.get('/api/players/:id/followers', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      const targetId = req.params.id;
      if (!isUuid(targetId)) return res.status(400).json({ error: 'ID tidak valid' });
      const { data: rows } = await sb
        .from('follows')
        .select('follower_id')
        .eq('following_id', targetId);
      const ids = (rows || []).map((r) => r.follower_id);
      if (ids.length === 0) return res.json({ players: [] });
      const [{ data: players }, { data: myFollows }] = await Promise.all([
        sb.from('players').select('*').in('id', ids),
        sb.from('follows').select('following_id').eq('follower_id', me.id),
      ]);
      const followSet = new Set((myFollows || []).map((f) => f.following_id));
      return res.json({
        players: (players || []).map((p) => ({ ...normalizePlayer(p), is_following: followSet.has(p.id) })),
      });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal memuat pengikut' });
    }
  });

  app.get('/api/players/:id/following', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      const targetId = req.params.id;
      if (!isUuid(targetId)) return res.status(400).json({ error: 'ID tidak valid' });
      const { data: rows } = await sb
        .from('follows')
        .select('following_id')
        .eq('follower_id', targetId);
      const ids = (rows || []).map((r) => r.following_id);
      if (ids.length === 0) return res.json({ players: [] });
      const [{ data: players }, { data: myFollows }] = await Promise.all([
        sb.from('players').select('*').in('id', ids),
        sb.from('follows').select('following_id').eq('follower_id', me.id),
      ]);
      const followSet = new Set((myFollows || []).map((f) => f.following_id));
      return res.json({
        players: (players || []).map((p) => ({ ...normalizePlayer(p), is_following: followSet.has(p.id) })),
      });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal memuat mengikuti' });
    }
  });

  // Follow / Unfollow
  app.post('/api/follows', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      const targetId = req.body?.target_player_id;
      if (!isUuid(targetId) || targetId === me.id) {
        return res.status(400).json({ error: 'Target tidak valid' });
      }
      const blocks = await getBlockedSet(sb, me.id);
      if (blocks.anyBlocked.has(targetId)) {
        return res.status(403).json({ error: 'Tidak bisa mengikuti pengguna yang diblokir' });
      }

      const { error } = await sb
        .from('follows')
        .upsert({ follower_id: me.id, following_id: targetId }, { onConflict: 'follower_id,following_id' });
      if (error) throw error;

      const { data: notif } = await sb
        .from('notifications')
        .insert({
          to_player_id: targetId,
          from_player_id: me.id,
          type: 'follow',
          title: `@${me.username} mulai mengikuti kamu`,
          is_read: false,
        })
        .select('*')
        .single();
      if (notif) {
        broadcastToPlayer(targetId, 'notification:new', { ...notif, from_player: me });
      }

      const ownerState = await resolveOwnerAndFollowStatus(sb, me);
      return res.json({ ok: true, follows_owner: ownerState.followsOwner });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal follow' });
    }
  });

  app.delete('/api/follows/:targetId', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      const targetId = req.params.targetId;
      if (!isUuid(targetId)) return res.status(400).json({ error: 'Target tidak valid' });
      const { error } = await sb
        .from('follows')
        .delete()
        .eq('follower_id', me.id)
        .eq('following_id', targetId);
      if (error) throw error;
      const ownerState = await resolveOwnerAndFollowStatus(sb, me);
      return res.json({ ok: true, follows_owner: ownerState.followsOwner });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal unfollow' });
    }
  });

  // Block / Unblock (automatically removes follows both directions)
  app.post('/api/blocks', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      const targetId = req.body?.target_player_id;
      if (!isUuid(targetId) || targetId === me.id) {
        return res.status(400).json({ error: 'Target tidak valid' });
      }
      const { error } = await sb
        .from('blocks')
        .upsert({ blocker_id: me.id, blocked_id: targetId }, { onConflict: 'blocker_id,blocked_id' });
      if (error) throw error;

      // Auto-unfollow in both directions
      await Promise.all([
        sb.from('follows').delete().eq('follower_id', me.id).eq('following_id', targetId),
        sb.from('follows').delete().eq('follower_id', targetId).eq('following_id', me.id),
      ]);

      const ownerState = await resolveOwnerAndFollowStatus(sb, me);
      return res.json({ ok: true, follows_owner: ownerState.followsOwner });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal memblokir' });
    }
  });

  app.delete('/api/blocks/:targetId', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      const targetId = req.params.targetId;
      if (!isUuid(targetId)) return res.status(400).json({ error: 'Target tidak valid' });
      const { error } = await sb
        .from('blocks')
        .delete()
        .eq('blocker_id', me.id)
        .eq('blocked_id', targetId);
      if (error) throw error;
      return res.json({ ok: true });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal membuka blokir' });
    }
  });

  // Helper to hydrate posts with players, original_post, liked_by_me, and normalized media_urls / likes_count / comments_count
  async function hydratePosts(sb: SupabaseClient, rawPosts: any[], viewer: any, blockedSet: Set<string>) {
    const caps = await detectSchemaCaps(sb);
    const visible = rawPosts.filter((p) => {
      if (p.is_deleted) return false;
      if (p.player_id && blockedSet.has(p.player_id)) return false;
      return true;
    });
    if (visible.length === 0) return [];

    const origIds = Array.from(
      new Set(visible.map((p) => p.original_post_id).filter((id): id is string => Boolean(id)))
    );
    let origMap = new Map<string, any>();
    if (origIds.length > 0 && caps.postsOriginalPostId) {
      const { data: origRows } = await sb.from('posts').select('*').in('id', origIds);
      for (const o of origRows || []) {
        if (!o.is_deleted && (!o.player_id || !blockedSet.has(o.player_id))) {
          origMap.set(o.id, o);
        }
      }
    }

    const playerIds: string[] = [];
    const tgIds: number[] = [];
    for (const p of visible) {
      if (p.player_id) playerIds.push(p.player_id);
      if (p.telegram_id) tgIds.push(Number(p.telegram_id));
    }
    for (const o of origMap.values()) {
      if (o.player_id) playerIds.push(o.player_id);
      if (o.telegram_id) tgIds.push(Number(o.telegram_id));
    }

    const postIds = visible.map((p) => p.id);
    const likesPromise = caps.likesPlayerId
      ? sb.from('post_likes').select('post_id').eq('player_id', viewer.id).in('post_id', postIds)
      : caps.likesTelegramId && viewer.telegram_id
        ? sb.from('post_likes').select('post_id').eq('telegram_id', viewer.telegram_id).in('post_id', postIds)
        : Promise.resolve({ data: [] as any[] });

    const commentsCountPromise = !caps.postsCommentsCount
      ? sb.from('post_comments').select('post_id').in('post_id', postIds)
      : Promise.resolve({ data: null as any[] | null });

    const [playersMap, { data: myLikes }, commentsRowsRes] = await Promise.all([
      getPlayersMap(sb, playerIds, tgIds),
      likesPromise,
      commentsCountPromise,
    ]);

    const likedSet = new Set((myLikes || []).map((l: any) => l.post_id));
    const commentCountsMap = new Map<string, number>();
    if (Array.isArray(commentsRowsRes.data)) {
      for (const cr of commentsRowsRes.data) {
        commentCountsMap.set(cr.post_id, (commentCountsMap.get(cr.post_id) || 0) + 1);
      }
    }

    const normalizePost = (p: any) => {
      const mediaUrls =
        Array.isArray(p.media_urls) && p.media_urls.length > 0
          ? p.media_urls
          : p.media_url
            ? [p.media_url]
            : [];
      const author = resolveAuthorFromRow(p, playersMap);
      return {
        ...p,
        player_id: p.player_id || author?.id || '',
        media_urls: mediaUrls,
        tagged_usernames: Array.isArray(p.tagged_usernames) ? p.tagged_usernames : [],
        likes_count: Number(p.likes_count ?? p.likes ?? 0),
        comments_count: Number(p.comments_count ?? commentCountsMap.get(p.id) ?? 0),
        player: author,
      };
    };

    return visible.map((p) => {
      const origRaw = p.original_post_id ? origMap.get(p.original_post_id) || null : null;
      return {
        ...normalizePost(p),
        liked_by_me: likedSet.has(p.id),
        original_post: origRaw ? normalizePost(origRaw) : null,
      };
    });
  }

  // Feed & Posts
  app.get('/api/posts', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const caps = await detectSchemaCaps(sb);
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      const blocks = await getBlockedSet(sb, me.id);
      const playerIdFilter = typeof req.query.playerId === 'string' ? req.query.playerId : null;
      const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

      if (playerIdFilter && blocks.anyBlocked.has(playerIdFilter)) {
        return res.json({ posts: [] });
      }

      let query = sb
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(60);

      if (caps.postsIsDeleted) {
        query = query.eq('is_deleted', false);
      }

      if (playerIdFilter && isUuid(playerIdFilter)) {
        if (caps.postsPlayerId) {
          query = query.eq('player_id', playerIdFilter);
        } else if (caps.postsTelegramId) {
          const { data: tp } = await sb
            .from('players')
            .select('telegram_id')
            .eq('id', playerIdFilter)
            .maybeSingle();
          if (tp?.telegram_id) {
            query = query.eq('telegram_id', tp.telegram_id);
          }
        }
      }
      if (q) {
        const safeQ = q.replace(/[%_,()]/g, '');
        if (safeQ) {
          query = query.ilike('caption', `%${safeQ}%`);
        }
      }

      const { data: rawPosts, error } = await query;
      if (error) throw error;
      const posts = await hydratePosts(sb, rawPosts || [], me, blocks.anyBlocked);
      return res.json({ posts });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal memuat postingan' });
    }
  });

  app.get('/api/posts/:id', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const caps = await detectSchemaCaps(sb);
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      const postId = req.params.id;
      if (!isUuid(postId)) return res.status(400).json({ error: 'ID tidak valid' });
      const blocks = await getBlockedSet(sb, me.id);
      let q = sb.from('posts').select('*').eq('id', postId);
      if (caps.postsIsDeleted) q = q.eq('is_deleted', false);
      const { data: raw, error } = await q.maybeSingle();
      if (error) throw error;
      if (!raw || (raw.player_id && blocks.anyBlocked.has(raw.player_id))) {
        return res.status(404).json({ error: 'Postingan tidak ditemukan' });
      }
      const hydrated = await hydratePosts(sb, [raw], me, blocks.anyBlocked);
      return res.json({ post: hydrated[0] || null });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal memuat postingan' });
    }
  });

  app.post('/api/posts', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const caps = await detectSchemaCaps(sb);
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      const caption = typeof req.body?.caption === 'string' ? req.body.caption.trim() : '';
      const repostCaption =
        typeof req.body?.repost_caption === 'string' ? req.body.repost_caption.trim() : null;
      const originalPostId = isUuid(req.body?.original_post_id) ? req.body.original_post_id : null;

      const rawUrls = Array.isArray(req.body?.media_urls)
        ? req.body.media_urls
        : typeof req.body?.media_url === 'string' && req.body.media_url
          ? [req.body.media_url]
          : [];
      const mediaUrls = rawUrls
        .map((u: unknown) => sanitizeUrl(u))
        .filter((u: string | null): u is string => Boolean(u));

      let mediaType = typeof req.body?.media_type === 'string' ? req.body.media_type : 'text';
      if (mediaUrls.length > 1) {
        mediaType = 'carousel';
      } else if (mediaUrls.length === 1 && mediaType === 'text') {
        const lower = mediaUrls[0].toLowerCase();
        mediaType = /\.(mp4|webm|mov|m4v|3gp)(\?|$)/.test(lower) ? 'video' : 'image';
      } else if (mediaUrls.length === 0) {
        mediaType = 'text';
      }

      if (!caption && mediaUrls.length === 0 && !originalPostId) {
        return res.status(400).json({ error: 'Isi caption atau pilih media terlebih dahulu' });
      }

      const mentionsFromText = extractMentions(`${caption} ${repostCaption || ''}`);
      const extraTags = Array.isArray(req.body?.tagged_usernames)
        ? req.body.tagged_usernames
            .filter((u: unknown): u is string => typeof u === 'string')
            .map((u: string) => u.replace(/^@/, '').trim().toLowerCase())
        : [];
      const taggedUsernames = Array.from(new Set([...mentionsFromText, ...extraTags])).filter(Boolean);

      const insertPayload: Record<string, any> = {
        caption: caption || null,
        media_type: mediaType,
      };
      if (caps.postsPlayerId) insertPayload.player_id = me.id;
      if (caps.postsTelegramId && me.telegram_id) insertPayload.telegram_id = me.telegram_id;
      if (caps.postsUsername) insertPayload.username = me.username;
      if (caps.postsFullName) insertPayload.full_name = me.full_name || me.name;
      if (caps.postsAvatarUrl) insertPayload.avatar_url = me.avatar_url || null;
      if (caps.postsMediaUrl) insertPayload.media_url = mediaUrls[0] || null;
      if (caps.postsMediaUrls) insertPayload.media_urls = mediaUrls;
      if (caps.postsTaggedUsernames) insertPayload.tagged_usernames = taggedUsernames;
      if (caps.postsOriginalPostId) {
        insertPayload.original_post_id = originalPostId;
        insertPayload.repost_caption = repostCaption;
      }
      if (caps.postsIsDeleted) insertPayload.is_deleted = false;
      if (caps.postsLikes) insertPayload.likes = 0;
      if (caps.postsLikesCount) insertPayload.likes_count = 0;
      if (caps.postsCommentsCount) insertPayload.comments_count = 0;

      const { data: inserted, error } = await sb
        .from('posts')
        .insert(insertPayload)
        .select('*')
        .single();

      if (error) throw error;

      // Send tag notifications for @usernames
      if (taggedUsernames.length > 0) {
        const blocks = await getBlockedSet(sb, me.id);
        const { data: taggedPlayers } = await sb
          .from('players')
          .select('id, username')
          .in('username', taggedUsernames);
        for (const tp of taggedPlayers || []) {
          if (tp.id !== me.id && !blocks.anyBlocked.has(tp.id)) {
            const { data: notif } = await sb
              .from('notifications')
              .insert({
                to_player_id: tp.id,
                from_player_id: me.id,
                type: 'tag',
                title: `@${me.username} menandai kamu di postingan`,
                post_id: inserted.id,
                is_read: false,
              })
              .select('*')
              .single();
            if (notif) {
              broadcastToPlayer(tp.id, 'notification:new', { ...notif, from_player: me });
            }
          }
        }
      }

      const blocks = await getBlockedSet(sb, me.id);
      const [hydrated] = await hydratePosts(sb, [inserted], me, blocks.anyBlocked);
      broadcastToAll('post:created', hydrated);
      return res.status(201).json({ post: hydrated });
    } catch (err: any) {
      const msg = String(err?.message || 'Gagal membuat postingan');
      if (msg.toLowerCase().includes('row-level security')) {
        return res.status(500).json({
          error:
            'Supabase RLS memblokir INSERT ke tabel posts. Tambahkan SUPABASE_SERVICE_ROLE_KEY di Secrets atau izinkan policy INSERT tabel posts di Supabase.',
        });
      }
      return res.status(500).json({ error: msg });
    }
  });

  // Delete Post: ONLY post owner OR Owner Faiz (is_owner)
  app.delete('/api/posts/:id', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const caps = await detectSchemaCaps(sb);
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      const postId = req.params.id;
      if (!isUuid(postId)) return res.status(400).json({ error: 'ID tidak valid' });
      const { data: existing } = await sb
        .from('posts')
        .select('*')
        .eq('id', postId)
        .maybeSingle();
      if (!existing) return res.status(404).json({ error: 'Postingan tidak ditemukan' });

      const isPostOwner =
        (existing.player_id && existing.player_id === me.id) ||
        (existing.telegram_id && me.telegram_id && Number(existing.telegram_id) === Number(me.telegram_id));
      if (!isPostOwner && !me.is_owner) {
        return res.status(403).json({ error: 'Kamu tidak bisa menghapus postingan orang lain' });
      }

      if (caps.postsIsDeleted) {
        const { error } = await sb.from('posts').update({ is_deleted: true }).eq('id', postId);
        if (error) throw error;
      } else {
        const { error } = await sb.from('posts').delete().eq('id', postId);
        if (error) throw error;
      }
      broadcastToAll('post:deleted', { id: postId });
      return res.json({ ok: true });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal menghapus postingan' });
    }
  });

  // Like / Unlike Post
  app.post('/api/posts/:id/like', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const caps = await detectSchemaCaps(sb);
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      const postId = req.params.id;
      if (!isUuid(postId)) return res.status(400).json({ error: 'ID tidak valid' });

      let postQuery = sb.from('posts').select('*').eq('id', postId);
      if (caps.postsIsDeleted) postQuery = postQuery.eq('is_deleted', false);
      const { data: post } = await postQuery.maybeSingle();
      if (!post) return res.status(404).json({ error: 'Postingan tidak ditemukan' });

      let likeCheck = sb.from('post_likes').select('*').eq('post_id', postId);
      if (caps.likesPlayerId) {
        likeCheck = likeCheck.eq('player_id', me.id);
      } else if (caps.likesTelegramId && me.telegram_id) {
        likeCheck = likeCheck.eq('telegram_id', me.telegram_id);
      }
      const { data: existing } = await likeCheck.maybeSingle();

      let liked = false;
      if (existing) {
        if (caps.likesId && existing.id) {
          await sb.from('post_likes').delete().eq('id', existing.id);
        } else {
          let delQ = sb.from('post_likes').delete().eq('post_id', postId);
          if (caps.likesPlayerId) delQ = delQ.eq('player_id', me.id);
          else if (caps.likesTelegramId && me.telegram_id) delQ = delQ.eq('telegram_id', me.telegram_id);
          await delQ;
        }
        liked = false;
      } else {
        const likeInsert: Record<string, any> = { post_id: postId };
        if (caps.likesPlayerId) likeInsert.player_id = me.id;
        if (caps.likesTelegramId && me.telegram_id) likeInsert.telegram_id = me.telegram_id;
        await sb.from('post_likes').insert(likeInsert);
        liked = true;
        if (post.player_id && post.player_id !== me.id) {
          const { data: notif } = await sb
            .from('notifications')
            .insert({
              to_player_id: post.player_id,
              from_player_id: me.id,
              type: 'like',
              title: `@${me.username} menyukai postinganmu`,
              post_id: postId,
              is_read: false,
            })
            .select('*')
            .single();
          if (notif) {
            broadcastToPlayer(post.player_id, 'notification:new', { ...notif, from_player: me });
          }
        }
      }

      const { count } = await sb
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);
      const baseCount = Number(post.likes_count ?? post.likes ?? 0);
      const likesCount = count ?? Math.max(0, baseCount + (liked ? 1 : -1));
      const postLikeUpdate: Record<string, any> = {};
      if (caps.postsLikesCount) postLikeUpdate.likes_count = likesCount;
      if (caps.postsLikes) postLikeUpdate.likes = likesCount;
      if (Object.keys(postLikeUpdate).length > 0) {
        await sb.from('posts').update(postLikeUpdate).eq('id', postId);
      }

      return res.json({ liked, likes_count: likesCount });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal like postingan' });
    }
  });

  // Comments
  app.get('/api/posts/:id/comments', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const caps = await detectSchemaCaps(sb);
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      const postId = req.params.id;
      if (!isUuid(postId)) return res.status(400).json({ error: 'ID tidak valid' });

      const { data: rows, error } = await sb
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      if (error) throw error;

      const commentRows = rows || [];
      const playerIds = commentRows.map((c) => c.player_id).filter(Boolean);
      const tgIds = commentRows.map((c) => Number(c.telegram_id)).filter((n) => Number.isFinite(n) && n > 0);
      const commentIds = commentRows.map((c) => c.id);

      const [playersMap, myLikesRes] = await Promise.all([
        getPlayersMap(sb, playerIds, tgIds),
        commentIds.length > 0 && caps.commentsLikesCount
          ? sb
              .from('comment_likes')
              .select('comment_id')
              .eq('player_id', me.id)
              .in('comment_id', commentIds)
              .then((r) => r, () => ({ data: [] as any[] }))
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const likedSet = new Set((myLikesRes.data || []).map((l: any) => l.comment_id));
      const comments = commentRows.map((c) => {
        const rawText = c.text ?? c.comment ?? '';
        const author = resolveAuthorFromRow(c, playersMap);
        return {
          ...c,
          player_id: c.player_id || author?.id || '',
          text: c.is_deleted ? 'Komentar ini dihapus' : rawText,
          likes_count: Number(c.likes_count || 0),
          player: author,
          liked_by_me: likedSet.has(c.id),
        };
      });

      return res.json({ comments });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal memuat komentar' });
    }
  });

  app.post('/api/posts/:id/comments', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const caps = await detectSchemaCaps(sb);
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      const postId = req.params.id;
      const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
      const parentCommentId = isUuid(req.body?.parent_comment_id) ? req.body.parent_comment_id : null;

      if (!isUuid(postId) || !text) {
        return res.status(400).json({ error: 'Komentar tidak boleh kosong' });
      }

      let postQ = sb.from('posts').select('*').eq('id', postId);
      if (caps.postsIsDeleted) postQ = postQ.eq('is_deleted', false);
      const { data: post } = await postQ.maybeSingle();
      if (!post) return res.status(404).json({ error: 'Postingan tidak ditemukan' });

      const commentInsert: Record<string, any> = { post_id: postId };
      if (caps.commentsPlayerId) commentInsert.player_id = me.id;
      if (caps.commentsTelegramId && me.telegram_id) commentInsert.telegram_id = me.telegram_id;
      if (caps.commentsUsername) commentInsert.username = me.username;
      if (caps.commentsFullName) commentInsert.full_name = me.full_name || me.name;
      if (caps.commentsAvatarUrl) commentInsert.avatar_url = me.avatar_url || null;
      if (caps.commentsText) commentInsert.text = text;
      if (caps.commentsComment) commentInsert.comment = text;
      if (caps.commentsParentId) commentInsert.parent_comment_id = parentCommentId;
      if (caps.commentsIsDeleted) commentInsert.is_deleted = false;
      if (caps.commentsLikesCount) commentInsert.likes_count = 0;

      const { data: inserted, error } = await sb
        .from('post_comments')
        .insert(commentInsert)
        .select('*')
        .single();
      if (error) throw error;

      const { count } = await sb
        .from('post_comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);
      const commentsCount = count ?? (post.comments_count || 0) + 1;
      if (caps.postsCommentsCount) {
        await sb.from('posts').update({ comments_count: commentsCount }).eq('id', postId);
      }

      // Notify post owner
      if (post.player_id && post.player_id !== me.id) {
        const { data: notif } = await sb
          .from('notifications')
          .insert({
            to_player_id: post.player_id,
            from_player_id: me.id,
            type: 'comment',
            title: `@${me.username} mengomentari postinganmu`,
            post_id: postId,
            is_read: false,
          })
          .select('*')
          .single();
        if (notif) {
          broadcastToPlayer(post.player_id, 'notification:new', { ...notif, from_player: me });
        }
      }

      // Notify parent comment owner if replying
      if (parentCommentId && caps.commentsParentId) {
        const { data: parent } = await sb
          .from('post_comments')
          .select('player_id')
          .eq('id', parentCommentId)
          .maybeSingle();
        if (parent && parent.player_id && parent.player_id !== me.id && parent.player_id !== post.player_id) {
          const { data: notif } = await sb
            .from('notifications')
            .insert({
              to_player_id: parent.player_id,
              from_player_id: me.id,
              type: 'comment',
              title: `@${me.username} membalas komentarmu`,
              post_id: postId,
              is_read: false,
            })
            .select('*')
            .single();
          if (notif) {
            broadcastToPlayer(parent.player_id, 'notification:new', { ...notif, from_player: me });
          }
        }
      }

      // Mention notifications
      const mentions = extractMentions(text);
      if (mentions.length > 0) {
        const { data: mentioned } = await sb
          .from('players')
          .select('id, username')
          .in('username', mentions);
        for (const mp of mentioned || []) {
          if (mp.id !== me.id && mp.id !== post.player_id) {
            const { data: notif } = await sb
              .from('notifications')
              .insert({
                to_player_id: mp.id,
                from_player_id: me.id,
                type: 'mention',
                title: `@${me.username} menyebut kamu di komentar`,
                post_id: postId,
                is_read: false,
              })
              .select('*')
              .single();
            if (notif) {
              broadcastToPlayer(mp.id, 'notification:new', { ...notif, from_player: me });
            }
          }
        }
      }

      return res.status(201).json({
        comment: {
          ...inserted,
          player_id: inserted.player_id || me.id,
          text: inserted.text ?? inserted.comment ?? text,
          likes_count: Number(inserted.likes_count || 0),
          player: me,
          liked_by_me: false,
        },
        comments_count: commentsCount,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal mengirim komentar' });
    }
  });

  app.post('/api/comments/:id/like', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      const commentId = req.params.id;
      if (!isUuid(commentId)) return res.status(400).json({ error: 'ID tidak valid' });

      const { data: comment } = await sb
        .from('post_comments')
        .select('id, likes_count')
        .eq('id', commentId)
        .maybeSingle();
      if (!comment) return res.status(404).json({ error: 'Komentar tidak ditemukan' });

      const { data: existing } = await sb
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('player_id', me.id)
        .maybeSingle();

      let liked = false;
      if (existing) {
        await sb.from('comment_likes').delete().eq('id', existing.id);
        liked = false;
      } else {
        await sb
          .from('comment_likes')
          .upsert({ comment_id: commentId, player_id: me.id }, { onConflict: 'comment_id,player_id' });
        liked = true;
      }

      const { count } = await sb
        .from('comment_likes')
        .select('*', { count: 'exact', head: true })
        .eq('comment_id', commentId);
      const likesCount = count ?? Math.max(0, (comment.likes_count || 0) + (liked ? 1 : -1));
      await sb.from('post_comments').update({ likes_count: likesCount }).eq('id', commentId);

      return res.json({ liked, likes_count: likesCount });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal like komentar' });
    }
  });

  app.delete('/api/comments/:id', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const caps = await detectSchemaCaps(sb);
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      const commentId = req.params.id;
      if (!isUuid(commentId)) return res.status(400).json({ error: 'ID tidak valid' });
      const { data: existing } = await sb
        .from('post_comments')
        .select('*')
        .eq('id', commentId)
        .maybeSingle();
      if (!existing) return res.status(404).json({ error: 'Komentar tidak ditemukan' });
      const isCommentOwner =
        (existing.player_id && existing.player_id === me.id) ||
        (existing.telegram_id && me.telegram_id && Number(existing.telegram_id) === Number(me.telegram_id));
      if (!isCommentOwner && !me.is_owner) {
        return res.status(403).json({ error: 'Tidak bisa menghapus komentar orang lain' });
      }
      if (caps.commentsIsDeleted) {
        const { error } = await sb
          .from('post_comments')
          .update({ is_deleted: true })
          .eq('id', commentId);
        if (error) throw error;
      } else {
        const { error } = await sb.from('post_comments').delete().eq('id', commentId);
        if (error) throw error;
      }
      return res.json({ ok: true });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal menghapus komentar' });
    }
  });

  // Stories (ALWAYS filter WHERE expires_at > NOW(); support text/image/video, bg_color, duration_hours 1/6/12/24)
  app.get('/api/stories', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const caps = await detectSchemaCaps(sb);
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      const blocks = await getBlockedSet(sb, me.id);
      const nowIso = new Date().toISOString();

      let query = sb
        .from('stories')
        .select('*')
        .gt('expires_at', nowIso)
        .order('created_at', { ascending: true });
      if (caps.storiesIsDeleted) {
        query = query.eq('is_deleted', false);
      }

      const { data: rawStories, error } = await query;
      if (error) throw error;

      const visibleStories = (rawStories || []).filter((s) => {
        if (s.is_deleted) return false;
        if (s.expires_at && new Date(s.expires_at).getTime() <= Date.now()) return false;
        if (s.player_id && blocks.anyBlocked.has(s.player_id)) return false;
        return true;
      });
      if (visibleStories.length === 0) return res.json({ storyGroups: [] });

      const storyIds = visibleStories.map((s) => s.id);
      const playerIds = visibleStories.map((s) => s.player_id).filter(Boolean);
      const tgIds = visibleStories.map((s) => Number(s.telegram_id)).filter((n) => Number.isFinite(n) && n > 0);

      const [playersMap, viewsRes, reactsRes] = await Promise.all([
        getPlayersMap(sb, playerIds, tgIds),
        sb
          .from('story_views')
          .select('story_id, player_id')
          .in('story_id', storyIds)
          .then((r) => r, () => ({ data: [] as any[] })),
        sb
          .from('story_reacts')
          .select('*')
          .in('story_id', storyIds)
          .order('created_at', { ascending: true })
          .then((r) => r, () => ({ data: [] as any[] })),
      ]);

      const reactPlayerIds = (reactsRes.data || []).map((r: any) => r.player_id).filter(Boolean);
      const reactPlayersMap = await getPlayersMap(sb, reactPlayerIds);

      const viewsByStory = new Map<string, Set<string>>();
      for (const v of viewsRes.data || []) {
        if (!viewsByStory.has(v.story_id)) viewsByStory.set(v.story_id, new Set());
        viewsByStory.get(v.story_id)!.add(v.player_id);
      }

      const reactsByStory = new Map<string, any[]>();
      for (const r of reactsRes.data || []) {
        if (!reactsByStory.has(r.story_id)) reactsByStory.set(r.story_id, []);
        reactsByStory.get(r.story_id)!.push({
          ...r,
          player: reactPlayersMap.get(r.player_id) || null,
        });
      }

      const groupsMap = new Map<string, { player: any; stories: any[]; has_unseen: boolean }>();
      for (const s of visibleStories) {
        const player = resolveAuthorFromRow(s, playersMap);
        if (!player) continue;
        const groupKey = player.id;
        const viewersSet = viewsByStory.get(s.id) || new Set();
        const viewedByMe = viewersSet.has(me.id);
        const storyText = s.text ?? s.caption ?? null;
        const enrichedStory = {
          ...s,
          player_id: s.player_id || player.id,
          text: storyText,
          caption: storyText,
          bg_color: s.bg_color || null,
          duration_hours: s.duration_hours || null,
          player,
          viewed_by_me: viewedByMe,
          views_count: viewersSet.size,
          reacts: reactsByStory.get(s.id) || [],
        };
        if (!groupsMap.has(groupKey)) {
          groupsMap.set(groupKey, { player, stories: [], has_unseen: false });
        }
        const g = groupsMap.get(groupKey)!;
        g.stories.push(enrichedStory);
        if (!viewedByMe) g.has_unseen = true;
      }

      const storyGroups = Array.from(groupsMap.values()).sort((a, b) => {
        if (a.player.id === me.id) return -1;
        if (b.player.id === me.id) return 1;
        if (a.has_unseen !== b.has_unseen) return a.has_unseen ? -1 : 1;
        return 0;
      });

      return res.json({ storyGroups });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal memuat story' });
    }
  });

  app.post('/api/stories', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const caps = await detectSchemaCaps(sb);
      const me = await ensureOwnerAndResolvePlayer(sb, req);

      const mediaType =
        req.body?.media_type === 'video'
          ? 'video'
          : req.body?.media_type === 'text'
            ? 'text'
            : 'image';
      const mediaUrl = mediaType === 'text' ? null : sanitizeUrl(req.body?.media_url);
      const rawText =
        typeof req.body?.text === 'string'
          ? req.body.text.trim()
          : typeof req.body?.caption === 'string'
            ? req.body.caption.trim()
            : '';

      if (mediaType === 'text' && !rawText) {
        return res.status(400).json({ error: 'Teks story wajib diisi' });
      }
      if (mediaType !== 'text' && !mediaUrl) {
        return res.status(400).json({ error: 'Media story wajib dipilih' });
      }

      const allowedDurations = new Set([1, 6, 12, 24]);
      const requestedDuration = Number(req.body?.duration_hours);
      const durationHours = allowedDurations.has(requestedDuration) ? requestedDuration : 24;

      const bgColor =
        typeof req.body?.bg_color === 'string' && req.body.bg_color.trim()
          ? req.body.bg_color.trim().slice(0, 120)
          : null;

      const songTitle = typeof req.body?.song_title === 'string' ? req.body.song_title.trim() || null : null;
      const songArtist = typeof req.body?.song_artist === 'string' ? req.body.song_artist.trim() || null : null;
      const songUrl = sanitizeUrl(req.body?.song_url);

      const createdAt = new Date();
      const expiresAt = new Date(createdAt.getTime() + durationHours * 60 * 60 * 1000).toISOString();

      const storyInsert: Record<string, any> = {
        media_url: mediaUrl,
        media_type: mediaType,
        created_at: createdAt.toISOString(),
        expires_at: expiresAt,
      };
      if (caps.storiesPlayerId) storyInsert.player_id = me.id;
      if (caps.storiesTelegramId && me.telegram_id) storyInsert.telegram_id = me.telegram_id;
      if (caps.storiesUsername) storyInsert.username = me.username;
      if (caps.storiesFullName) storyInsert.full_name = me.full_name || me.name;
      if (caps.storiesAvatarUrl) storyInsert.avatar_url = me.avatar_url || null;
      if (caps.storiesText) storyInsert.text = rawText || null;
      if (caps.storiesCaption) storyInsert.caption = rawText || null;
      if (caps.storiesBgColor) storyInsert.bg_color = bgColor;
      if (caps.storiesDurationHours) storyInsert.duration_hours = durationHours;
      if (caps.storiesIsDeleted) storyInsert.is_deleted = false;
      if (caps.storiesSongTitle) {
        storyInsert.song_title = songTitle;
        storyInsert.song_artist = songArtist;
        storyInsert.song_url = songUrl;
      }

      const { data: story, error } = await sb
        .from('stories')
        .insert(storyInsert)
        .select('*')
        .single();

      if (error) throw error;
      return res.status(201).json({
        story: {
          ...story,
          text: story.text ?? story.caption ?? (rawText || null),
          caption: story.caption ?? story.text ?? (rawText || null),
          bg_color: story.bg_color ?? bgColor,
          duration_hours: story.duration_hours ?? durationHours,
          player: me,
        },
      });
    } catch (err: any) {
      const msg = String(err?.message || 'Gagal membuat story');
      if (msg.toLowerCase().includes('row-level security')) {
        return res.status(500).json({
          error:
            'Supabase RLS memblokir INSERT ke tabel stories. Tambahkan SUPABASE_SERVICE_ROLE_KEY di Secrets atau izinkan policy INSERT tabel stories di Supabase.',
        });
      }
      return res.status(500).json({ error: msg });
    }
  });

  // Delete Story: ONLY story owner OR Owner Faiz (is_owner)
  app.delete('/api/stories/:id', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const caps = await detectSchemaCaps(sb);
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      const storyId = req.params.id;
      if (!isUuid(storyId)) return res.status(400).json({ error: 'ID tidak valid' });
      const { data: existing } = await sb
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .maybeSingle();
      if (!existing) return res.status(404).json({ error: 'Story tidak ditemukan' });

      const isStoryOwner =
        (existing.player_id && existing.player_id === me.id) ||
        (existing.telegram_id && me.telegram_id && Number(existing.telegram_id) === Number(me.telegram_id));
      if (!isStoryOwner && !me.is_owner) {
        return res.status(403).json({ error: 'Akses ditolak' });
      }

      if (caps.storiesIsDeleted) {
        const { error } = await sb.from('stories').update({ is_deleted: true }).eq('id', storyId);
        if (error) throw error;
      } else {
        const { error } = await sb.from('stories').delete().eq('id', storyId);
        if (error) throw error;
      }
      return res.json({ ok: true });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal menghapus story' });
    }
  });

  app.post('/api/stories/:id/view', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      const storyId = req.params.id;
      if (!isUuid(storyId)) return res.status(400).json({ error: 'ID tidak valid' });

      await sb
        .from('story_views')
        .upsert({ story_id: storyId, player_id: me.id }, { onConflict: 'story_id,player_id' });
      return res.json({ ok: true });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal mencatat view story' });
    }
  });

  app.get('/api/stories/:id/views', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      await ensureOwnerAndResolvePlayer(sb, req);
      const storyId = req.params.id;
      if (!isUuid(storyId)) return res.status(400).json({ error: 'ID tidak valid' });

      const [{ data: viewRows }, { data: reactRows }] = await Promise.all([
        sb.from('story_views').select('*').eq('story_id', storyId),
        sb.from('story_reacts').select('*').eq('story_id', storyId).order('created_at', { ascending: false }),
      ]);

      const allIds = [
        ...(viewRows || []).map((v) => v.player_id),
        ...(reactRows || []).map((r) => r.player_id),
      ];
      const pMap = await getPlayersMap(sb, allIds);

      return res.json({
        viewers: (viewRows || []).map((v) => ({ ...v, player: pMap.get(v.player_id) || null })),
        reacts: (reactRows || []).map((r) => ({ ...r, player: pMap.get(r.player_id) || null })),
      });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal memuat penonton story' });
    }
  });

  app.post('/api/stories/:id/react', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      const storyId = req.params.id;
      const emoji = typeof req.body?.emoji === 'string' ? req.body.emoji.trim().slice(0, 12) : '';
      if (!isUuid(storyId) || !emoji) return res.status(400).json({ error: 'Emoji tidak valid' });

      const { data: story } = await sb
        .from('stories')
        .select('id, player_id')
        .eq('id', storyId)
        .eq('is_deleted', false)
        .maybeSingle();
      if (!story) return res.status(404).json({ error: 'Story tidak ditemukan' });

      const { data: react, error } = await sb
        .from('story_reacts')
        .insert({ story_id: storyId, player_id: me.id, emoji })
        .select('*')
        .single();
      if (error) throw error;

      if (story.player_id !== me.id) {
        const { data: notif } = await sb
          .from('notifications')
          .insert({
            to_player_id: story.player_id,
            from_player_id: me.id,
            type: 'story_react',
            title: `@${me.username} bereaksi ${emoji} ke story kamu`,
            is_read: false,
          })
          .select('*')
          .single();
        if (notif) {
          broadcastToPlayer(story.player_id, 'notification:new', { ...notif, from_player: me });
        }
      }

      return res.status(201).json({ react: { ...react, player: me } });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal react story' });
    }
  });

  app.post('/api/stories/:id/reply', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      const storyId = req.params.id;
      const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
      if (!isUuid(storyId) || !text) return res.status(400).json({ error: 'Balasan tidak boleh kosong' });

      const { data: story } = await sb
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .eq('is_deleted', false)
        .maybeSingle();
      if (!story) return res.status(404).json({ error: 'Story tidak ditemukan' });

      const blocks = await getBlockedSet(sb, me.id);
      if (blocks.anyBlocked.has(story.player_id)) {
        return res.status(403).json({ error: 'Pengguna diblokir' });
      }

      const { data: message, error } = await sb
        .from('messages')
        .insert({
          sender_id: me.id,
          receiver_id: story.player_id,
          group_id: null,
          text: `[Balas Story] ${text}`,
          media_url: story.media_url,
          media_type: story.media_type,
          is_deleted_for_all: false,
          deleted_for_user_ids: [],
          is_read: false,
        })
        .select('*')
        .single();
      if (error) throw error;

      const hydratedMsg = { ...message, sender: me, delivered: isPlayerOnline(story.player_id) };
      broadcastToPlayer(story.player_id, 'message:new', hydratedMsg);
      broadcastToPlayer(me.id, 'message:new', hydratedMsg);

      if (story.player_id !== me.id) {
        const { data: notif } = await sb
          .from('notifications')
          .insert({
            to_player_id: story.player_id,
            from_player_id: me.id,
            type: 'story_reply',
            title: `@${me.username} membalas story kamu: "${text.slice(0, 40)}"`,
            is_read: false,
          })
          .select('*')
          .single();
        if (notif) {
          broadcastToPlayer(story.player_id, 'notification:new', { ...notif, from_player: me });
        }
      }

      return res.status(201).json({ message: hydratedMsg, peer_id: story.player_id });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal membalas story' });
    }
  });

  // Chat Conversations (1-1 DM & Groups)
  app.get('/api/chat/conversations', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      const blocks = await getBlockedSet(sb, me.id);

      const [{ data: dmRows }, { data: myGroupRows }] = await Promise.all([
        sb
          .from('messages')
          .select('*')
          .is('group_id', null)
          .or(`sender_id.eq.${me.id},receiver_id.eq.${me.id}`)
          .order('created_at', { ascending: false })
          .limit(300),
        sb.from('group_members').select('group_id').eq('player_id', me.id),
      ]);

      // Group DMs by peer
      const dmByPeer = new Map<string, { lastMessage: any; unreadCount: number }>();
      for (const m of dmRows || []) {
        const deletedFor = Array.isArray(m.deleted_for_user_ids) ? m.deleted_for_user_ids : [];
        if (deletedFor.includes(me.id)) continue;
        const peerId = m.sender_id === me.id ? m.receiver_id : m.sender_id;
        if (!peerId || blocks.anyBlocked.has(peerId)) continue;

        if (!dmByPeer.has(peerId)) {
          dmByPeer.set(peerId, { lastMessage: m, unreadCount: 0 });
        }
        if (m.receiver_id === me.id && !m.is_read) {
          dmByPeer.get(peerId)!.unreadCount += 1;
        }
      }

      const groupIds = Array.from(new Set((myGroupRows || []).map((g) => g.group_id)));
      let groupsData: any[] = [];
      let allMembersRows: any[] = [];
      let groupMsgs: any[] = [];

      if (groupIds.length > 0) {
        const [gRes, gmRes, msgRes] = await Promise.all([
          sb.from('chat_groups').select('*').in('id', groupIds),
          sb.from('group_members').select('*').in('group_id', groupIds),
          sb
            .from('messages')
            .select('*')
            .in('group_id', groupIds)
            .order('created_at', { ascending: false })
            .limit(300),
        ]);
        groupsData = gRes.data || [];
        allMembersRows = gmRes.data || [];
        groupMsgs = msgRes.data || [];
      }

      const peerIds = Array.from(dmByPeer.keys());
      const memberPlayerIds = allMembersRows.map((m) => m.player_id);
      const playersMap = await getPlayersMap(sb, [...peerIds, ...memberPlayerIds]);

      const conversations: any[] = [];

      for (const [peerId, info] of dmByPeer.entries()) {
        const peer = playersMap.get(peerId);
        if (!peer) continue;
        conversations.push({
          type: 'dm',
          id: peerId,
          peer,
          last_message: {
            ...info.lastMessage,
            text: info.lastMessage.is_deleted_for_all ? 'Pesan ini dihapus' : info.lastMessage.text,
            delivered: isPlayerOnline(peerId) || info.lastMessage.is_read,
          },
          unread_count: info.unreadCount,
        });
      }

      for (const g of groupsData) {
        const members = allMembersRows
          .filter((m) => m.group_id === g.id)
          .map((m) => playersMap.get(m.player_id))
          .filter(Boolean);
        const lastRaw = groupMsgs.find((m) => {
          if (m.group_id !== g.id) return false;
          const deletedFor = Array.isArray(m.deleted_for_user_ids) ? m.deleted_for_user_ids : [];
          return !deletedFor.includes(me.id);
        });
        conversations.push({
          type: 'group',
          id: g.id,
          group: { ...g, members },
          last_message: lastRaw
            ? {
                ...lastRaw,
                text: lastRaw.is_deleted_for_all ? 'Pesan ini dihapus' : lastRaw.text,
              }
            : null,
          unread_count: 0,
        });
      }

      conversations.sort((a, b) => {
        const ta = a.last_message?.created_at || a.group?.created_at || '';
        const tb = b.last_message?.created_at || b.group?.created_at || '';
        return tb.localeCompare(ta);
      });

      return res.json({ conversations });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal memuat obrolan' });
    }
  });

  // Hydrate messages helper
  async function hydrateMessages(sb: SupabaseClient, rows: any[], myId: string) {
    const visible = rows.filter((m) => {
      const deletedFor = Array.isArray(m.deleted_for_user_ids) ? m.deleted_for_user_ids : [];
      return !deletedFor.includes(myId);
    });

    const msgMap = new Map<string, any>();
    for (const m of visible) msgMap.set(m.id, m);

    const replyIds = visible
      .map((m) => m.reply_to_id)
      .filter((id): id is string => Boolean(id) && !msgMap.has(id));
    if (replyIds.length > 0) {
      const { data: extraReplies } = await sb.from('messages').select('*').in('id', replyIds);
      for (const r of extraReplies || []) msgMap.set(r.id, r);
    }

    const senderIds = Array.from(msgMap.values()).map((m) => m.sender_id);
    const playersMap = await getPlayersMap(sb, senderIds);

    const formatMsg = (m: any): any => {
      const isDelAll = Boolean(m.is_deleted_for_all);
      return {
        ...m,
        text: isDelAll ? 'Pesan ini dihapus' : m.text,
        media_url: isDelAll ? null : m.media_url,
        media_type: isDelAll ? null : m.media_type,
        sender: playersMap.get(m.sender_id) || null,
        delivered: m.is_read || (m.receiver_id ? isPlayerOnline(m.receiver_id) : true),
      };
    };

    return visible.map((m) => {
      const formatted = formatMsg(m);
      const replyRaw = m.reply_to_id ? msgMap.get(m.reply_to_id) : null;
      return {
        ...formatted,
        reply_to: replyRaw ? formatMsg(replyRaw) : null,
      };
    });
  }

  // DM thread
  app.get('/api/chat/dm/:peerId', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      const peerId = req.params.peerId;
      if (!isUuid(peerId)) return res.status(400).json({ error: 'ID tidak valid' });

      const blocks = await getBlockedSet(sb, me.id);
      const { data: peer } = await sb.from('players').select('*').eq('id', peerId).maybeSingle();
      if (!peer) return res.status(404).json({ error: 'Pengguna tidak ditemukan' });

      const normalizedPeer = normalizePlayer(peer);
      if (blocks.anyBlocked.has(peerId)) {
        return res.json({
          peer: {
            ...normalizedPeer,
            is_blocked_by_me: blocks.blockedByMe.has(peerId),
            has_blocked_me: blocks.blockedMe.has(peerId),
          },
          messages: [],
          blocked: true,
        });
      }

      // Mark incoming messages as read!
      const readAt = new Date().toISOString();
      const { data: updatedRead } = await sb
        .from('messages')
        .update({ is_read: true, read_at: readAt })
        .eq('sender_id', peerId)
        .eq('receiver_id', me.id)
        .is('group_id', null)
        .eq('is_read', false)
        .select('id');

      if (updatedRead && updatedRead.length > 0) {
        broadcastToPlayer(peerId, 'chat:read', {
          reader_id: me.id,
          peer_id: me.id,
          read_at: readAt,
          message_ids: updatedRead.map((u) => u.id),
        });
      }

      const { data: rawMsgs, error } = await sb
        .from('messages')
        .select('*')
        .is('group_id', null)
        .or(`and(sender_id.eq.${me.id},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${me.id})`)
        .order('created_at', { ascending: true })
        .limit(200);

      if (error) throw error;
      const messages = await hydrateMessages(sb, rawMsgs || [], me.id);
      return res.json({ peer: normalizedPeer, messages, blocked: false });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal memuat chat' });
    }
  });

  // Group thread
  app.get('/api/chat/groups/:groupId', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      const groupId = req.params.groupId;
      if (!isUuid(groupId)) return res.status(400).json({ error: 'ID grup tidak valid' });

      const { data: membership } = await sb
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('player_id', me.id)
        .maybeSingle();
      if (!membership) return res.status(403).json({ error: 'Kamu bukan anggota grup ini' });

      const [{ data: group }, { data: memberRows }, { data: rawMsgs }] = await Promise.all([
        sb.from('chat_groups').select('*').eq('id', groupId).maybeSingle(),
        sb.from('group_members').select('player_id').eq('group_id', groupId),
        sb
          .from('messages')
          .select('*')
          .eq('group_id', groupId)
          .order('created_at', { ascending: true })
          .limit(200),
      ]);

      if (!group) return res.status(404).json({ error: 'Grup tidak ditemukan' });
      const playersMap = await getPlayersMap(
        sb,
        (memberRows || []).map((m) => m.player_id)
      );
      const members = Array.from(playersMap.values());
      const messages = await hydrateMessages(sb, rawMsgs || [], me.id);

      return res.json({ group: { ...group, members }, messages });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal memuat grup' });
    }
  });

  // Create group
  app.post('/api/chat/groups', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
      const avatarUrl = sanitizeUrl(req.body?.avatar_url);
      const memberIds: string[] = Array.isArray(req.body?.member_ids)
        ? req.body.member_ids.filter((id: unknown): id is string => isUuid(id))
        : [];

      if (!name) return res.status(400).json({ error: 'Nama grup wajib diisi' });

      const { data: group, error } = await sb
        .from('chat_groups')
        .insert({
          name: name.slice(0, 60),
          avatar_url: avatarUrl,
          created_by: me.id,
        })
        .select('*')
        .single();
      if (error) throw error;

      const uniqueMembers = Array.from(new Set([me.id, ...memberIds]));
      await sb.from('group_members').upsert(
        uniqueMembers.map((pid) => ({ group_id: group.id, player_id: pid })),
        { onConflict: 'group_id,player_id' }
      );

      const playersMap = await getPlayersMap(sb, uniqueMembers);
      return res.status(201).json({ group: { ...group, members: Array.from(playersMap.values()) } });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal membuat grup' });
    }
  });

  // Add member to group
  app.post('/api/chat/groups/:groupId/members', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      const groupId = req.params.groupId;
      const targetPlayerId = req.body?.player_id;
      if (!isUuid(groupId) || !isUuid(targetPlayerId)) {
        return res.status(400).json({ error: 'Parameter tidak valid' });
      }
      const { data: membership } = await sb
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('player_id', me.id)
        .maybeSingle();
      if (!membership) return res.status(403).json({ error: 'Akses ditolak' });

      const { error } = await sb
        .from('group_members')
        .upsert({ group_id: groupId, player_id: targetPlayerId }, { onConflict: 'group_id,player_id' });
      if (error) throw error;
      return res.json({ ok: true });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal menambah anggota' });
    }
  });

  // Send message (DM or Group)
  app.post('/api/chat/messages', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      const receiverId = isUuid(req.body?.receiver_id) ? req.body.receiver_id : null;
      const groupId = isUuid(req.body?.group_id) ? req.body.group_id : null;
      const replyToId = isUuid(req.body?.reply_to_id) ? req.body.reply_to_id : null;
      const text = typeof req.body?.text === 'string' ? req.body.text.trim() : null;
      const mediaUrl = sanitizeUrl(req.body?.media_url);
      const mediaType =
        typeof req.body?.media_type === 'string'
          ? req.body.media_type
          : mediaUrl
            ? /\.(mp4|webm|mov)(\?|$)/i.test(mediaUrl)
              ? 'video'
              : 'image'
            : 'text';

      if (!receiverId && !groupId) {
        return res.status(400).json({ error: 'Tujuan pesan wajib diisi' });
      }
      if (!text && !mediaUrl) {
        return res.status(400).json({ error: 'Pesan tidak boleh kosong' });
      }

      if (receiverId) {
        const blocks = await getBlockedSet(sb, me.id);
        if (blocks.anyBlocked.has(receiverId)) {
          return res.status(403).json({ error: 'Tidak dapat mengirim pesan ke pengguna yang diblokir' });
        }
      }

      const { data: inserted, error } = await sb
        .from('messages')
        .insert({
          sender_id: me.id,
          receiver_id: groupId ? null : receiverId,
          group_id: groupId,
          reply_to_id: replyToId,
          text: text || null,
          media_url: mediaUrl,
          media_type: mediaType,
          is_deleted_for_all: false,
          deleted_for_user_ids: [],
          is_read: false,
        })
        .select('*')
        .single();
      if (error) throw error;

      const [hydrated] = await hydrateMessages(sb, [inserted], me.id);

      if (receiverId) {
        broadcastToPlayer(receiverId, 'message:new', hydrated);
        broadcastToPlayer(me.id, 'message:new', hydrated);
      } else if (groupId) {
        const { data: memberRows } = await sb
          .from('group_members')
          .select('player_id')
          .eq('group_id', groupId);
        for (const m of memberRows || []) {
          broadcastToPlayer(m.player_id, 'message:new', hydrated);
        }
      }

      return res.status(201).json({ message: hydrated });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal mengirim pesan' });
    }
  });

  // React to message
  app.post('/api/chat/messages/:id/react', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      const msgId = req.params.id;
      const emoji = typeof req.body?.emoji === 'string' ? req.body.emoji.trim().slice(0, 12) : null;
      if (!isUuid(msgId)) return res.status(400).json({ error: 'ID tidak valid' });

      const { data: updated, error } = await sb
        .from('messages')
        .update({ react_emoji: emoji, react_by: emoji ? me.id : null })
        .eq('id', msgId)
        .select('*')
        .single();
      if (error) throw error;

      const [hydrated] = await hydrateMessages(sb, [updated], me.id);
      if (updated.receiver_id) {
        broadcastToPlayer(updated.receiver_id, 'message:updated', hydrated);
        broadcastToPlayer(updated.sender_id, 'message:updated', hydrated);
      } else if (updated.group_id) {
        const { data: memberRows } = await sb
          .from('group_members')
          .select('player_id')
          .eq('group_id', updated.group_id);
        for (const m of memberRows || []) {
          broadcastToPlayer(m.player_id, 'message:updated', hydrated);
        }
      }
      return res.json({ message: hydrated });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal react pesan' });
    }
  });

  // Mark single DM thread as read (called when receiving live msg in open chat)
  app.post('/api/chat/dm/:peerId/read', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      const peerId = req.params.peerId;
      if (!isUuid(peerId)) return res.status(400).json({ error: 'ID tidak valid' });
      const readAt = new Date().toISOString();
      const { data: updated } = await sb
        .from('messages')
        .update({ is_read: true, read_at: readAt })
        .eq('sender_id', peerId)
        .eq('receiver_id', me.id)
        .is('group_id', null)
        .eq('is_read', false)
        .select('id');
      if (updated && updated.length > 0) {
        broadcastToPlayer(peerId, 'chat:read', {
          reader_id: me.id,
          peer_id: me.id,
          read_at: readAt,
          message_ids: updated.map((u) => u.id),
        });
      }
      return res.json({ ok: true });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal update status baca' });
    }
  });

  // Delete message (for me or for everyone)
  app.delete('/api/chat/messages/:id', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      const msgId = req.params.id;
      const scope = req.query.scope === 'all' ? 'all' : 'me';
      if (!isUuid(msgId)) return res.status(400).json({ error: 'ID tidak valid' });

      const { data: existing } = await sb.from('messages').select('*').eq('id', msgId).maybeSingle();
      if (!existing) return res.status(404).json({ error: 'Pesan tidak ditemukan' });

      if (scope === 'all') {
        if (existing.sender_id !== me.id) {
          return res.status(403).json({ error: 'Hanya pengirim yang bisa menghapus untuk semua' });
        }
        const { data: updated, error } = await sb
          .from('messages')
          .update({ is_deleted_for_all: true })
          .eq('id', msgId)
          .select('*')
          .single();
        if (error) throw error;
        const [hydrated] = await hydrateMessages(sb, [updated], me.id);
        if (updated.receiver_id) {
          broadcastToPlayer(updated.receiver_id, 'message:updated', hydrated);
          broadcastToPlayer(updated.sender_id, 'message:updated', hydrated);
        } else if (updated.group_id) {
          const { data: memberRows } = await sb
            .from('group_members')
            .select('player_id')
            .eq('group_id', updated.group_id);
          for (const m of memberRows || []) {
            broadcastToPlayer(m.player_id, 'message:updated', hydrated);
          }
        }
        return res.json({ ok: true, message: hydrated });
      } else {
        const currentDeleted: string[] = Array.isArray(existing.deleted_for_user_ids)
          ? existing.deleted_for_user_ids
          : [];
        if (!currentDeleted.includes(me.id)) {
          currentDeleted.push(me.id);
        }
        const { error } = await sb
          .from('messages')
          .update({ deleted_for_user_ids: currentDeleted })
          .eq('id', msgId);
        if (error) throw error;
        return res.json({ ok: true, deletedForMeId: msgId });
      }
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal menghapus pesan' });
    }
  });

  // Notifications (supports both user_id & to_player_id + title & message columns)
  app.get('/api/notifications', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      let { data: rows, error } = await sb
        .from('notifications')
        .select('*')
        .or(`user_id.eq.${me.id},to_player_id.eq.${me.id}`)
        .order('created_at', { ascending: false })
        .limit(80);
      if (error && /column|schema cache|PGRST204/i.test(String(error.message || ''))) {
        const retry = await sb
          .from('notifications')
          .select('*')
          .eq('to_player_id', me.id)
          .order('created_at', { ascending: false })
          .limit(80);
        rows = retry.data;
        error = retry.error;
      }
      if (error) throw error;

      const fromIds = (rows || []).map((n: any) => n.from_player_id).filter(Boolean);
      const pMap = await getPlayersMap(sb, fromIds);
      const notifications = (rows || []).map((n: any) => ({
        ...n,
        from_player: n.from_player_id ? pMap.get(n.from_player_id) || null : null,
      }));
      const unreadCount = notifications.filter((n: any) => !n.is_read).length;
      return res.json({ notifications, unreadCount });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal memuat notifikasi' });
    }
  });

  app.post('/api/notifications/read-all', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      const { error } = await sb
        .from('notifications')
        .update({ is_read: true })
        .or(`user_id.eq.${me.id},to_player_id.eq.${me.id}`)
        .eq('is_read', false);
      if (error && /column|schema cache|PGRST204/i.test(String(error.message || ''))) {
        await sb
          .from('notifications')
          .update({ is_read: true })
          .eq('to_player_id', me.id)
          .eq('is_read', false);
      }
      return res.json({ ok: true });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal menandai notifikasi' });
    }
  });

  app.post('/api/notifications/:id/read', async (req: Request, res: Response) => {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
    try {
      const me = await ensureOwnerAndResolvePlayer(sb, req);
      const notifId = req.params.id;
      if (!isUuid(notifId)) return res.status(400).json({ error: 'ID tidak valid' });
      const { error } = await sb
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notifId)
        .or(`user_id.eq.${me.id},to_player_id.eq.${me.id}`);
      if (error && /column|schema cache|PGRST204/i.test(String(error.message || ''))) {
        await sb
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notifId)
          .eq('to_player_id', me.id);
      }
      return res.json({ ok: true });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal menandai notifikasi' });
    }
  });

  // Vite or Static production serving
  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
        return next();
      }
      return res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const server = http.createServer(app);

  // WebSocket server on /ws attached to HTTP server (port 3000)
  const wss = new WebSocketServer({ server, path: '/ws' });
  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '/ws', `http://${req.headers.host || 'localhost'}`);
    const playerId = url.searchParams.get('playerId');
    if (playerId && isUuid(playerId)) {
      if (!wsClients.has(playerId)) wsClients.set(playerId, new Set());
      wsClients.get(playerId)!.add(ws);
      ws.on('close', () => {
        wsClients.get(playerId)?.delete(ws);
        if (wsClients.get(playerId)?.size === 0) {
          wsClients.delete(playerId);
        }
      });
    }
  });

  // Supabase Realtime bridge (forwards direct DB changes to connected WS clients)
  const sbRealtime = getSupabase();
  if (sbRealtime) {
    try {
      sbRealtime
        .channel('nz-server-db-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'broadcasts' }, () => {
          broadcastToAll('owner_panel:updated', { reason: 'supabase_realtime_broadcast' });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'giveaways' }, () => {
          broadcastToAll('owner_panel:updated', { reason: 'supabase_realtime_giveaway' });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'giveaway_claims' }, () => {
          broadcastToAll('owner_panel:updated', { reason: 'supabase_realtime_claim' });
        })
        .subscribe();
    } catch {
      // Non-fatal if Realtime replication isn't enabled on server client
    }
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Nongkrong Zone server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
