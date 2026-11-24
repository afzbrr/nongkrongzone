import type {
  BorderItem,
  ChatGroup,
  ConversationItem,
  Message,
  NotificationItem,
  Player,
  Post,
  PostComment,
  Story,
  StoryGroup,
  StoryReact,
  StoryView,
} from '../types';

const STORAGE_KEY = 'nz_static_store_v1';
const OWNER_TELEGRAM_ID = 6189849073;
const OWNER_COINS = 999999999;

export const BORDERS_CATALOG: BorderItem[] = [
  { id: 'FAIZ_SPIDERMAN', name: 'FAIZ SPIDERMAN', category: 'OWNER', price_coins: 0, is_owner_only: true, css_ring: null, icon_emoji: null },
  { id: 'FAIZ_OWNER', name: 'FAIZ GANTENG', category: 'OWNER', price_coins: 0, is_owner_only: true, css_ring: '#D4AF37', icon_emoji: '👑' },
  { id: 'PEMULA', name: 'PEMULA', category: 'Prestasi', price_coins: 50, is_owner_only: false, css_ring: '#8E8E93', icon_emoji: '' },
  { id: 'RAJIN_NONGKRONG', name: 'RAJIN NONGKRONG', category: 'Nonton', price_coins: 70, is_owner_only: false, css_ring: '#30D158', icon_emoji: '' },
  { id: 'SEMANGAT_BARA', name: 'SEMANGAT BARA', category: 'Nonton', price_coins: 80, is_owner_only: false, css_ring: '#FF9F0A', icon_emoji: '' },
  { id: 'SETIA_NONGKRONG', name: 'SETIA NONGKRONG', category: 'Nonton', price_coins: 90, is_owner_only: false, css_ring: '#0A84FF', icon_emoji: '' },
  { id: 'TAHUN_BARU', name: 'TAHUN BARU', category: 'Hari Besar', price_coins: 100, is_owner_only: false, css_ring: '#FFD60A', icon_emoji: '' },
  { id: 'GARUDA_NUSANTARA', name: 'GARUDA NUSANTARA', category: 'Hari Besar', price_coins: 100, is_owner_only: false, css_ring: '#FF453A', icon_emoji: '' },
  { id: 'LEBARAN', name: 'LEBARAN', category: 'Hari Besar', price_coins: 100, is_owner_only: false, css_ring: '#30D158', icon_emoji: '' },
  { id: 'NATAL', name: 'NATAL', category: 'Hari Besar', price_coins: 100, is_owner_only: false, css_ring: '#FF453A', icon_emoji: '' },
  { id: 'HALLOWEEN', name: 'HALLOWEEN', category: 'Hari Besar', price_coins: 100, is_owner_only: false, css_ring: '#FF9F0A', icon_emoji: '' },
  { id: 'VALENTINE', name: 'VALENTINE', category: 'Hari Besar', price_coins: 100, is_owner_only: false, css_ring: '#FF375F', icon_emoji: '' },
  { id: 'KEMERDEKAAN', name: 'KEMERDEKAAN', category: 'Hari Besar', price_coins: 100, is_owner_only: false, css_ring: '#FF453A', icon_emoji: '' },
  { id: 'VOLI', name: 'VOLI', category: 'Olahraga', price_coins: 120, is_owner_only: false, css_ring: null, icon_emoji: null },
  { id: 'BASKET', name: 'BASKET', category: 'Olahraga', price_coins: 120, is_owner_only: false, css_ring: null, icon_emoji: null },
  { id: 'BOLA', name: 'BOLA', category: 'Olahraga', price_coins: 120, is_owner_only: false, css_ring: null, icon_emoji: null },
  { id: 'TENIS', name: 'TENIS', category: 'Olahraga', price_coins: 120, is_owner_only: false, css_ring: null, icon_emoji: null },
  { id: 'UNGU_KAWAII', name: 'UNGU KAWAII', category: 'Toko 3D', price_coins: 120, is_owner_only: false, css_ring: '#BF5AF2', icon_emoji: '' },
  { id: 'RENANG', name: 'RENANG', category: 'Olahraga', price_coins: 120, is_owner_only: false, css_ring: null, icon_emoji: null },
  { id: 'BADMINTON', name: 'BADMINTON', category: 'Olahraga', price_coins: 120, is_owner_only: false, css_ring: null, icon_emoji: null },
  { id: 'PINKY_CANDY', name: 'PINKY CANDY', category: 'Toko 3D', price_coins: 120, is_owner_only: false, css_ring: '#FF375F', icon_emoji: '' },
  { id: 'AURORA_BOREALIS', name: 'AURORA BOREALIS', category: 'Toko 3D', price_coins: 150, is_owner_only: false, css_ring: '#64D2FF', icon_emoji: '' },
  { id: 'LUCU_BEAR', name: 'LUCU BEAR', category: 'Lucu', price_coins: 150, is_owner_only: false, css_ring: null, icon_emoji: null },
  { id: 'ESPORT', name: 'E-SPORT', category: 'Game', price_coins: 150, is_owner_only: false, css_ring: null, icon_emoji: null },
  { id: 'LUCU_CAT', name: 'LUCU CAT', category: 'Lucu', price_coins: 150, is_owner_only: false, css_ring: null, icon_emoji: null },
  { id: 'LUCU_BUNNY', name: 'LUCU BUNNY', category: 'Lucu', price_coins: 150, is_owner_only: false, css_ring: null, icon_emoji: null },
  { id: 'KRISTAL_ES', name: 'KRISTAL ES 3D', category: 'Toko 3D', price_coins: 160, is_owner_only: false, css_ring: '#5E5CE6', icon_emoji: '' },
  { id: 'LUAR_ANGKASA', name: 'LUAR ANGKASA', category: 'Toko 3D', price_coins: 170, is_owner_only: false, css_ring: '#5E5CE6', icon_emoji: '' },
  { id: 'FF', name: 'FF', category: 'Game', price_coins: 180, is_owner_only: false, css_ring: null, icon_emoji: null },
  { id: 'AESTHETIC_PINK', name: 'AESTHETIC PINK', category: 'Aesthetic', price_coins: 180, is_owner_only: false, css_ring: null, icon_emoji: null },
  { id: 'AESTHETIC_SAGE', name: 'AESTHETIC SAGE', category: 'Aesthetic', price_coins: 180, is_owner_only: false, css_ring: null, icon_emoji: null },
  { id: 'CYBER_BLUE', name: 'CYBER BLUE 3D', category: 'Toko 3D', price_coins: 180, is_owner_only: false, css_ring: '#0A84FF', icon_emoji: '' },
  { id: 'ML', name: 'ML', category: 'Game', price_coins: 180, is_owner_only: false, css_ring: null, icon_emoji: null },
  { id: 'AESTHETIC_BLUE', name: 'AESTHETIC BLUE', category: 'Aesthetic', price_coins: 180, is_owner_only: false, css_ring: null, icon_emoji: null },
  { id: 'GALAXY', name: 'GALAXY', category: 'Toko 3D', price_coins: 190, is_owner_only: false, css_ring: '#BF5AF2', icon_emoji: '' },
  { id: 'COUPLE_QUEEN', name: 'COUPLE QUEEN', category: 'Couple Cewe', price_coins: 200, is_owner_only: false, css_ring: null, icon_emoji: null },
  { id: 'LEGENDA_NONGKRONG', name: 'LEGENDA NONGKRONG', category: 'Prestasi', price_coins: 200, is_owner_only: false, css_ring: '#FFD60A', icon_emoji: '' },
  { id: 'API_PHOENIX', name: 'API PHOENIX 3D', category: 'Toko 3D', price_coins: 200, is_owner_only: false, css_ring: '#FF453A', icon_emoji: '' },
  { id: 'NAGA', name: 'NAGA', category: 'Toko 3D', price_coins: 200, is_owner_only: false, css_ring: '#30D158', icon_emoji: '' },
  { id: 'SULTAN', name: 'SULTAN', category: 'Toko 3D', price_coins: 200, is_owner_only: false, css_ring: '#FFD60A', icon_emoji: '' },
  { id: 'IRONMAN', name: 'IRONMAN', category: 'Superhero', price_coins: 200, is_owner_only: false, css_ring: null, icon_emoji: null },
  { id: 'BATMAN', name: 'BATMAN', category: 'Superhero', price_coins: 200, is_owner_only: false, css_ring: null, icon_emoji: null },
  { id: 'COUPLE_KING', name: 'COUPLE KING', category: 'Couple Cowo', price_coins: 200, is_owner_only: false, css_ring: null, icon_emoji: null },
  { id: 'COUPLE_MOON_COWO', name: 'COUPLE MOON COWO', category: 'Couple Cowo', price_coins: 200, is_owner_only: false, css_ring: null, icon_emoji: null },
  { id: 'COUPLE_MOON_CEWE', name: 'COUPLE MOON CEWE', category: 'Couple Cewe', price_coins: 200, is_owner_only: false, css_ring: null, icon_emoji: null },
  { id: 'GAMERS_NEON', name: 'GAMERS NEON', category: 'Gamers', price_coins: 220, is_owner_only: false, css_ring: null, icon_emoji: null },
  { id: 'KPOP_LIGHTSTICK', name: 'KPOP LIGHTSTICK', category: 'Kpopers', price_coins: 220, is_owner_only: false, css_ring: null, icon_emoji: null },
  { id: 'KPOP_PINK', name: 'KPOP PINK', category: 'Kpopers', price_coins: 220, is_owner_only: false, css_ring: null, icon_emoji: null },
  { id: 'GAMERS_PRO', name: 'GAMERS PRO', category: 'Gamers', price_coins: 250, is_owner_only: false, css_ring: null, icon_emoji: null },
  { id: 'ELEGANT_BLACK', name: 'ELEGANT BLACK', category: 'Elegant', price_coins: 250, is_owner_only: false, css_ring: null, icon_emoji: null },
  { id: 'ELEGANT_GOLD', name: 'ELEGANT GOLD', category: 'Elegant', price_coins: 250, is_owner_only: false, css_ring: null, icon_emoji: null },
];

interface LocalDbState {
  activePlayerId: string;
  players: Player[];
  ownedBorders: Record<string, string[]>;
  posts: Post[];
  postLikes: Array<{ post_id: string; player_id: string }>;
  comments: PostComment[];
  commentLikes: Array<{ comment_id: string; player_id: string }>;
  stories: Story[];
  storyViews: StoryView[];
  storyReacts: StoryReact[];
  follows: Array<{ follower_id: string; following_id: string }>;
  blocks: Array<{ blocker_id: string; blocked_id: string }>;
  messages: Message[];
  groups: ChatGroup[];
  groupMembers: Array<{ group_id: string; player_id: string }>;
  notifications: NotificationItem[];
}

function uid(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createInitialDb(): LocalDbState {
  const ownerId = '7c9a08e0-e0b1-42d1-ab74-cd87a431107b';
  const owner: Player = {
    id: ownerId,
    telegram_id: OWNER_TELEGRAM_ID,
    name: 'Faiz Ganteng',
    full_name: 'Faiz Ganteng',
    username: 'istamina',
    avatar_url: null,
    telegram_avatar_url: null,
    bio: '',
    coins: OWNER_COINS,
    is_owner: true,
    is_banned: false,
    border_id: 'API_PHOENIX',
    has_telegram_username: true,
    follows_owner: true,
    created_at: new Date().toISOString(),
  };
  return {
    activePlayerId: ownerId,
    players: [owner],
    ownedBorders: {
      [ownerId]: BORDERS_CATALOG.map((b) => b.id),
    },
    posts: [],
    postLikes: [],
    comments: [],
    commentLikes: [],
    stories: [],
    storyViews: [],
    storyReacts: [],
    follows: [],
    blocks: [],
    messages: [],
    groups: [],
    groupMembers: [],
    notifications: [],
  };
}

let memoryState: LocalDbState | null = null;

function readDb(): LocalDbState {
  if (memoryState) return memoryState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LocalDbState;
      if (parsed && Array.isArray(parsed.players) && parsed.players.length > 0) {
        memoryState = parsed;
        return parsed;
      }
    }
  } catch {
    // ignore storage read errors
  }
  const initial = createInitialDb();
  memoryState = initial;
  saveDb(initial);
  return initial;
}

function saveDb(state: LocalDbState): void {
  memoryState = state;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

function getMe(db: LocalDbState, preferredId?: string | null): Player {
  const id = preferredId || db.activePlayerId;
  const found = db.players.find((p) => p.id === id) || db.players[0];
  return enrichPlayer(db, found, found.id);
}

function enrichPlayer(db: LocalDbState, target: Player, viewerId: string): Player {
  const followersCount = db.follows.filter((f) => f.following_id === target.id).length;
  const followingCount = db.follows.filter((f) => f.follower_id === target.id).length;
  const postsCount = db.posts.filter((p) => !p.is_deleted && p.player_id === target.id).length;
  const isFollowing = db.follows.some(
    (f) => f.follower_id === viewerId && f.following_id === target.id
  );
  const isBlockedByMe = db.blocks.some(
    (b) => b.blocker_id === viewerId && b.blocked_id === target.id
  );
  const hasBlockedMe = db.blocks.some(
    (b) => b.blocker_id === target.id && b.blocked_id === viewerId
  );
  const isOwner = target.telegram_id === OWNER_TELEGRAM_ID || target.is_owner;
  const ownerRow = db.players.find((p) => p.telegram_id === OWNER_TELEGRAM_ID);
  const followsOwner = isOwner
    ? true
    : ownerRow
      ? db.follows.some((f) => f.follower_id === target.id && f.following_id === ownerRow.id)
      : true;
  return {
    ...target,
    name: target.full_name || target.name,
    full_name: target.full_name || target.name,
    is_owner: isOwner,
    coins: isOwner ? OWNER_COINS : target.coins,
    followers_count: followersCount,
    following_count: followingCount,
    posts_count: postsCount,
    is_following: isFollowing,
    is_blocked_by_me: isBlockedByMe,
    has_blocked_me: hasBlockedMe,
    has_telegram_username:
      target.has_telegram_username !== undefined
        ? target.has_telegram_username
        : isOwner
          ? true
          : !/^tg_\d+/.test(String(target.username || '')),
    follows_owner: followsOwner,
  };
}

function hydratePost(db: LocalDbState, p: Post, viewerId: string): Post {
  const author = db.players.find((u) => u.id === p.player_id);
  const orig = p.original_post_id
    ? db.posts.find((o) => o.id === p.original_post_id && !o.is_deleted) || null
    : null;
  const likesCount = db.postLikes.filter((l) => l.post_id === p.id).length;
  const commentsCount = db.comments.filter((c) => !c.is_deleted && c.post_id === p.id).length;
  const likedByMe = db.postLikes.some((l) => l.post_id === p.id && l.player_id === viewerId);
  return {
    ...p,
    likes_count: likesCount,
    comments_count: commentsCount,
    liked_by_me: likedByMe,
    player: author ? enrichPlayer(db, author, viewerId) : undefined,
    original_post: orig ? hydratePost(db, orig, viewerId) : null,
  };
}

export const localStore = {
  telegramLogin: (
    user: { id: number; username?: string; first_name?: string; last_name?: string; photo_url?: string },
    _preferredId?: string | null
  ) => {
    const db = readDb();
    const tgId = Number(user.id);
    const isOwner = tgId === OWNER_TELEGRAM_ID;
    const rawUsername = (user.username || '')
      .replace(/^@/, '')
      .replace(/[^a-zA-Z0-9_]/g, '')
      .slice(0, 32);
    const resolvedUsername = rawUsername || `tg_${tgId}`;
    const combinedName = [user.first_name, user.last_name]
      .filter(Boolean)
      .join(' ')
      .trim()
      .slice(0, 20);
    const tgFullName = combinedName || resolvedUsername.slice(0, 20);
    const tgPhoto = typeof user.photo_url === 'string' && user.photo_url.trim() ? user.photo_url.trim() : null;

    let player = db.players.find((p) => p.telegram_id === tgId);
    const hasTgUsername = Boolean(rawUsername);
    if (!player) {
      player = {
        id: isOwner ? '7c9a08e0-e0b1-42d1-ab74-cd87a431107b' : uid('player'),
        telegram_id: tgId,
        name: tgFullName,
        full_name: tgFullName,
        username: resolvedUsername,
        avatar_url: tgPhoto,
        telegram_avatar_url: tgPhoto,
        bio: '',
        coins: isOwner ? OWNER_COINS : 500,
        is_owner: isOwner,
        is_banned: false,
        border_id: isOwner ? 'API_PHOENIX' : null,
        has_telegram_username: hasTgUsername,
        created_at: new Date().toISOString(),
      };
      db.players.push(player);
      db.ownedBorders[player.id] = isOwner ? BORDERS_CATALOG.map((b) => b.id) : [];
    } else {
      player.has_telegram_username = hasTgUsername;
      if (hasTgUsername && rawUsername !== player.username) {
        player.username = rawUsername;
      }
      if (!player.avatar_url && tgPhoto) {
        player.avatar_url = tgPhoto;
      }
      if (tgPhoto) {
        player.telegram_avatar_url = tgPhoto;
      }
      player.is_owner = isOwner;
      if (isOwner) {
        player.coins = OWNER_COINS;
        db.ownedBorders[player.id] = BORDERS_CATALOG.map((b) => b.id);
      }
    }

    db.activePlayerId = player.id;
    saveDb(db);
    const ownerRow = db.players.find((p) => p.telegram_id === OWNER_TELEGRAM_ID) || null;
    return {
      player: enrichPlayer(db, player, player.id),
      sessionToken: `static-session-${player.id}`,
      players: db.players.map((p) => enrichPlayer(db, p, player!.id)),
      ownerPlayer: ownerRow ? enrichPlayer(db, ownerRow, player.id) : null,
    };
  },

  getMe: (preferredId?: string | null) => {
    const db = readDb();
    const me = getMe(db, preferredId);
    db.activePlayerId = me.id;
    saveDb(db);
    const ownerRow = db.players.find((p) => p.telegram_id === OWNER_TELEGRAM_ID) || null;
    return {
      player: me,
      sessionToken: `static-session-${me.id}`,
      players: db.players.map((p) => enrichPlayer(db, p, me.id)),
      ownerPlayer: ownerRow ? enrichPlayer(db, ownerRow, me.id) : null,
    };
  },

  updateMe: (
    payload: { full_name?: string; name?: string; username?: string; bio?: string; avatar_url?: string | null },
    preferredId?: string | null
  ) => {
    const db = readDb();
    const me = getMe(db, preferredId);
    const target = db.players.find((p) => p.id === me.id)!;
    const rawName = payload.full_name ?? payload.name;
    if (typeof rawName === 'string' && rawName.trim()) {
      const cleaned = rawName.trim().slice(0, 20);
      target.name = cleaned;
      target.full_name = cleaned;
    }
    if (typeof payload.username === 'string') {
      if (me.has_telegram_username) {
        throw new Error('Username mengikuti akun Telegram kamu dan tidak dapat diubah');
      }
      const cleanedUsername = payload.username
        .trim()
        .replace(/^@/, '')
        .replace(/[^a-zA-Z0-9_]/g, '')
        .toLowerCase()
        .slice(0, 20);
      if (cleanedUsername.length < 3) {
        throw new Error('Username minimal 3 karakter (huruf, angka, atau _)');
      }
      const taken = db.players.some(
        (p) => p.id !== target.id && p.username.toLowerCase() === cleanedUsername.toLowerCase()
      );
      if (taken) {
        throw new Error('Username sudah dipakai pengguna lain');
      }
      target.username = cleanedUsername;
    }
    if (typeof payload.bio === 'string') {
      target.bio = payload.bio.trim().slice(0, 300);
    }
    if (payload.avatar_url !== undefined) {
      target.avatar_url = payload.avatar_url || null;
    }
    saveDb(db);
    return { player: enrichPlayer(db, target, target.id) };
  },

  getPlayers: (q = '', preferredId?: string | null) => {
    const db = readDb();
    const me = getMe(db, preferredId);
    const term = q.trim().toLowerCase();
    const list = db.players
      .filter((p) => !term || p.username.toLowerCase().includes(term) || p.name.toLowerCase().includes(term))
      .map((p) => enrichPlayer(db, p, me.id));
    return { players: list };
  },

  getPlayerProfile: (identifier: string, preferredId?: string | null) => {
    const db = readDb();
    const me = getMe(db, preferredId);
    const found =
      db.players.find((p) => p.id === identifier || p.username.toLowerCase() === identifier.toLowerCase()) ||
      me;
    return { player: enrichPlayer(db, found, me.id) };
  },

  getFollowers: (playerId: string, preferredId?: string | null) => {
    const db = readDb();
    const me = getMe(db, preferredId);
    const ids = new Set(db.follows.filter((f) => f.following_id === playerId).map((f) => f.follower_id));
    return { players: db.players.filter((p) => ids.has(p.id)).map((p) => enrichPlayer(db, p, me.id)) };
  },

  getFollowing: (playerId: string, preferredId?: string | null) => {
    const db = readDb();
    const me = getMe(db, preferredId);
    const ids = new Set(db.follows.filter((f) => f.follower_id === playerId).map((f) => f.following_id));
    return { players: db.players.filter((p) => ids.has(p.id)).map((p) => enrichPlayer(db, p, me.id)) };
  },

  getBlockedPlayers: (preferredId?: string | null) => {
    const db = readDb();
    const me = getMe(db, preferredId);
    const ids = new Set(db.blocks.filter((b) => b.blocker_id === me.id).map((b) => b.blocked_id));
    return { players: db.players.filter((p) => ids.has(p.id)).map((p) => enrichPlayer(db, p, me.id)) };
  },

  follow: (targetId: string, preferredId?: string | null) => {
    const db = readDb();
    const me = getMe(db, preferredId);
    if (!db.follows.some((f) => f.follower_id === me.id && f.following_id === targetId)) {
      db.follows.push({ follower_id: me.id, following_id: targetId });
      saveDb(db);
    }
    const updatedMe = getMe(db, me.id);
    return { ok: true, follows_owner: updatedMe.follows_owner };
  },

  unfollow: (targetId: string, preferredId?: string | null) => {
    const db = readDb();
    const me = getMe(db, preferredId);
    db.follows = db.follows.filter((f) => !(f.follower_id === me.id && f.following_id === targetId));
    saveDb(db);
    const updatedMe = getMe(db, me.id);
    return { ok: true, follows_owner: updatedMe.follows_owner };
  },

  block: (targetId: string, preferredId?: string | null) => {
    const db = readDb();
    const me = getMe(db, preferredId);
    if (!db.blocks.some((b) => b.blocker_id === me.id && b.blocked_id === targetId)) {
      db.blocks.push({ blocker_id: me.id, blocked_id: targetId });
    }
    db.follows = db.follows.filter(
      (f) => !(f.follower_id === me.id && f.following_id === targetId) && !(f.follower_id === targetId && f.following_id === me.id)
    );
    saveDb(db);
    const updatedMe = getMe(db, me.id);
    return { ok: true, follows_owner: updatedMe.follows_owner };
  },

  unblock: (targetId: string, preferredId?: string | null) => {
    const db = readDb();
    const me = getMe(db, preferredId);
    db.blocks = db.blocks.filter((b) => !(b.blocker_id === me.id && b.blocked_id === targetId));
    saveDb(db);
    return { ok: true };
  },

  getBorders: (preferredId?: string | null) => {
    const db = readDb();
    const me = getMe(db, preferredId);
    const ownedList = me.is_owner
      ? BORDERS_CATALOG.map((b) => b.id)
      : db.ownedBorders[me.id] || [];
    const ownedSet = new Set(ownedList);

    const visibleBorders = BORDERS_CATALOG.filter((b) => b.id !== 'FAIZ_OWNER' || me.is_owner).map((b) => ({
      ...b,
      owned: me.is_owner || ownedSet.has(b.id),
    }));
    const collectionBorders = visibleBorders.filter((b) => b.owned);
    return {
      borders: visibleBorders,
      collectionBorders,
      ownedIds: Array.from(ownedSet),
      equippedBorderId: me.border_id,
      coins: me.is_owner ? OWNER_COINS : me.coins,
      rawCount: visibleBorders.length,
      rlsHint: null,
    };
  },

  buyBorder: (borderId: string, preferredId?: string | null) => {
    const db = readDb();
    const me = getMe(db, preferredId);
    const target = db.players.find((p) => p.id === me.id)!;
    const border = BORDERS_CATALOG.find((b) => b.id === borderId);
    if (!border) throw new Error('Border tidak ditemukan');
    if (border.is_owner_only && !me.is_owner) throw new Error('Border khusus OWNER');

    const owned = new Set(db.ownedBorders[me.id] || []);
    if (!me.is_owner && !owned.has(borderId)) {
      if (target.coins < border.price_coins) {
        throw new Error('Koin tidak cukup');
      }
      target.coins -= border.price_coins;
    }
    owned.add(borderId);
    db.ownedBorders[me.id] = Array.from(owned);
    saveDb(db);
    return { ok: true, coins: me.is_owner ? OWNER_COINS : target.coins, border };
  },

  equipBorder: (borderId: string, preferredId?: string | null) => {
    const db = readDb();
    const me = getMe(db, preferredId);
    const target = db.players.find((p) => p.id === me.id)!;
    const border = BORDERS_CATALOG.find((b) => b.id === borderId);
    if (!border) throw new Error('Border tidak ditemukan');
    if (border.is_owner_only && !me.is_owner) throw new Error('Border khusus OWNER');
    target.border_id = borderId;
    saveDb(db);
    return {
      ok: true,
      border_id: borderId,
      player: enrichPlayer(db, target, target.id),
    };
  },

  getPosts: (params?: { playerId?: string; q?: string }, preferredId?: string | null) => {
    const db = readDb();
    const me = getMe(db, preferredId);
    const q = (params?.q || '').trim().toLowerCase();
    const list = db.posts
      .filter((p) => !p.is_deleted)
      .filter((p) => (!params?.playerId ? true : p.player_id === params.playerId))
      .filter((p) => (!q ? true : (p.caption || '').toLowerCase().includes(q)))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((p) => hydratePost(db, p, me.id));
    return { posts: list };
  },

  getPost: (postId: string, preferredId?: string | null) => {
    const db = readDb();
    const me = getMe(db, preferredId);
    const found = db.posts.find((p) => p.id === postId && !p.is_deleted);
    return { post: found ? hydratePost(db, found, me.id) : null };
  },

  createPost: (
    payload: {
      caption?: string;
      media_urls?: string[];
      media_type?: string;
      tagged_usernames?: string[];
      original_post_id?: string | null;
      repost_caption?: string | null;
    },
    preferredId?: string | null
  ) => {
    const db = readDb();
    const me = getMe(db, preferredId);
    const newPost: Post = {
      id: uid('post'),
      player_id: me.id,
      caption: payload.caption || null,
      media_urls: payload.media_urls || [],
      media_type: payload.media_type || (payload.media_urls?.length ? 'image' : 'text'),
      tagged_usernames: payload.tagged_usernames || [],
      original_post_id: payload.original_post_id || null,
      repost_caption: payload.repost_caption || null,
      is_deleted: false,
      likes_count: 0,
      comments_count: 0,
      created_at: new Date().toISOString(),
    };
    db.posts.unshift(newPost);
    saveDb(db);
    return { post: hydratePost(db, newPost, me.id) };
  },

  deletePost: (postId: string, preferredId?: string | null) => {
    const db = readDb();
    const me = getMe(db, preferredId);
    const p = db.posts.find((item) => item.id === postId);
    if (p && (p.player_id === me.id || me.is_owner)) {
      p.is_deleted = true;
      saveDb(db);
    }
    return { ok: true };
  },

  togglePostLike: (postId: string, preferredId?: string | null) => {
    const db = readDb();
    const me = getMe(db, preferredId);
    const idx = db.postLikes.findIndex((l) => l.post_id === postId && l.player_id === me.id);
    let liked = false;
    if (idx >= 0) {
      db.postLikes.splice(idx, 1);
    } else {
      db.postLikes.push({ post_id: postId, player_id: me.id });
      liked = true;
    }
    saveDb(db);
    return { liked, likes_count: db.postLikes.filter((l) => l.post_id === postId).length };
  },

  getComments: (postId: string, preferredId?: string | null) => {
    const db = readDb();
    const me = getMe(db, preferredId);
    const raw = db.comments.filter((c) => !c.is_deleted && c.post_id === postId);
    const hydrated: PostComment[] = raw.map((c) => {
      const author = db.players.find((p) => p.id === c.player_id);
      return {
        ...c,
        likes_count: db.commentLikes.filter((l) => l.comment_id === c.id).length,
        liked_by_me: db.commentLikes.some((l) => l.comment_id === c.id && l.player_id === me.id),
        player: author ? enrichPlayer(db, author, me.id) : undefined,
        replies: [],
      };
    });
    const byId = new Map(hydrated.map((c) => [c.id, c]));
    const roots: PostComment[] = [];
    for (const c of hydrated) {
      if (c.parent_comment_id && byId.has(c.parent_comment_id)) {
        byId.get(c.parent_comment_id)!.replies!.push(c);
      } else {
        roots.push(c);
      }
    }
    return { comments: roots };
  },

  addComment: (
    postId: string,
    text: string,
    parentCommentId?: string | null,
    preferredId?: string | null
  ) => {
    const db = readDb();
    const me = getMe(db, preferredId);
    const comment: PostComment = {
      id: uid('cmt'),
      post_id: postId,
      player_id: me.id,
      parent_comment_id: parentCommentId || null,
      text,
      is_deleted: false,
      likes_count: 0,
      created_at: new Date().toISOString(),
      player: me,
      liked_by_me: false,
      replies: [],
    };
    db.comments.push(comment);
    saveDb(db);
    const commentsCount = db.comments.filter((c) => !c.is_deleted && c.post_id === postId).length;
    return { comment, comments_count: commentsCount };
  },

  toggleCommentLike: (commentId: string, preferredId?: string | null) => {
    const db = readDb();
    const me = getMe(db, preferredId);
    const idx = db.commentLikes.findIndex((l) => l.comment_id === commentId && l.player_id === me.id);
    let liked = false;
    if (idx >= 0) {
      db.commentLikes.splice(idx, 1);
    } else {
      db.commentLikes.push({ comment_id: commentId, player_id: me.id });
      liked = true;
    }
    saveDb(db);
    return { liked, likes_count: db.commentLikes.filter((l) => l.comment_id === commentId).length };
  },

  deleteComment: (commentId: string, preferredId?: string | null) => {
    const db = readDb();
    const me = getMe(db, preferredId);
    const c = db.comments.find((item) => item.id === commentId);
    if (c && (c.player_id === me.id || me.is_owner)) {
      c.is_deleted = true;
      saveDb(db);
    }
    return { ok: true };
  },

  getStories: (preferredId?: string | null) => {
    const db = readDb();
    const me = getMe(db, preferredId);
    const now = Date.now();
    const active = db.stories.filter((s) => !s.is_deleted && new Date(s.expires_at).getTime() > now);
    const groupsMap = new Map<string, StoryGroup>();
    for (const s of active) {
      const author = db.players.find((p) => p.id === s.player_id) || me;
      const viewed = db.storyViews.some((v) => v.story_id === s.id && v.player_id === me.id);
      const reacts = db.storyReacts.filter((r) => r.story_id === s.id);
      const hydrated: Story = {
        ...s,
        player: enrichPlayer(db, author, me.id),
        viewed_by_me: viewed,
        views_count: db.storyViews.filter((v) => v.story_id === s.id).length,
        reacts,
      };
      if (!groupsMap.has(author.id)) {
        groupsMap.set(author.id, {
          player: hydrated.player!,
          stories: [],
          has_unseen: false,
        });
      }
      const g = groupsMap.get(author.id)!;
      g.stories.push(hydrated);
      if (!viewed) g.has_unseen = true;
    }
    return { storyGroups: Array.from(groupsMap.values()) };
  },

  createStory: (
    payload: {
      media_url?: string | null;
      media_type: 'text' | 'image' | 'video';
      text?: string;
      caption?: string;
      bg_color?: string;
      duration_hours?: 1 | 6 | 12 | 24;
      song_title?: string;
      song_artist?: string;
      song_url?: string;
    },
    preferredId?: string | null
  ) => {
    const db = readDb();
    const me = getMe(db, preferredId);
    const hours = payload.duration_hours || 24;
    const now = Date.now();
    const story: Story = {
      id: uid('story'),
      player_id: me.id,
      telegram_id: me.telegram_id,
      media_url: payload.media_url || null,
      media_type: payload.media_type,
      text: payload.text || payload.caption || null,
      caption: payload.caption || payload.text || null,
      bg_color: payload.bg_color || null,
      duration_hours: hours,
      song_title: payload.song_title || null,
      song_artist: payload.song_artist || null,
      song_url: payload.song_url || null,
      is_deleted: false,
      created_at: new Date(now).toISOString(),
      expires_at: new Date(now + hours * 3600 * 1000).toISOString(),
      player: me,
      viewed_by_me: true,
      views_count: 0,
      reacts: [],
    };
    db.stories.push(story);
    saveDb(db);
    return { story };
  },

  deleteStory: (storyId: string, preferredId?: string | null) => {
    const db = readDb();
    const me = getMe(db, preferredId);
    const s = db.stories.find((item) => item.id === storyId);
    if (s && (s.player_id === me.id || me.is_owner)) {
      s.is_deleted = true;
      saveDb(db);
    }
    return { ok: true };
  },

  viewStory: (storyId: string, preferredId?: string | null) => {
    const db = readDb();
    const me = getMe(db, preferredId);
    if (!db.storyViews.some((v) => v.story_id === storyId && v.player_id === me.id)) {
      db.storyViews.push({ id: uid('sv'), story_id: storyId, player_id: me.id, player: me });
      saveDb(db);
    }
    return { ok: true };
  },

  getStoryViews: (storyId: string) => {
    const db = readDb();
    return {
      viewers: db.storyViews.filter((v) => v.story_id === storyId),
      reacts: db.storyReacts.filter((r) => r.story_id === storyId),
    };
  },

  reactStory: (storyId: string, emoji: string, preferredId?: string | null) => {
    const db = readDb();
    const me = getMe(db, preferredId);
    const react: StoryReact = {
      id: uid('sr'),
      story_id: storyId,
      player_id: me.id,
      emoji,
      created_at: new Date().toISOString(),
      player: me,
    };
    db.storyReacts.push(react);
    saveDb(db);
    return { react };
  },

  replyStory: (storyId: string, text: string, preferredId?: string | null) => {
    const db = readDb();
    const me = getMe(db, preferredId);
    const story = db.stories.find((s) => s.id === storyId);
    const peerId = story?.player_id || me.id;
    const message: Message = {
      id: uid('msg'),
      sender_id: me.id,
      receiver_id: peerId,
      group_id: null,
      reply_to_id: null,
      text,
      media_url: null,
      media_type: 'text',
      react_emoji: null,
      react_by: null,
      is_deleted_for_all: false,
      deleted_for_user_ids: null,
      is_read: false,
      read_at: null,
      created_at: new Date().toISOString(),
      sender: me,
    };
    db.messages.push(message);
    saveDb(db);
    return { message, peer_id: peerId };
  },

  getConversations: (_preferredId?: string | null): { conversations: ConversationItem[] } => {
    const db = readDb();
    const me = getMe(db, _preferredId);
    const convs: ConversationItem[] = [];
    for (const g of db.groups) {
      const msgs = db.messages.filter((m) => m.group_id === g.id);
      convs.push({
        type: 'group',
        id: g.id,
        group: g,
        last_message: msgs[msgs.length - 1] || null,
        unread_count: 0,
      });
    }
    const peerIds = new Set<string>();
    for (const m of db.messages) {
      if (!m.group_id) {
        if (m.sender_id === me.id && m.receiver_id) peerIds.add(m.receiver_id);
        if (m.receiver_id === me.id) peerIds.add(m.sender_id);
      }
    }
    for (const pid of peerIds) {
      const peer = db.players.find((p) => p.id === pid);
      if (!peer) continue;
      const msgs = db.messages.filter(
        (m) => !m.group_id && ((m.sender_id === me.id && m.receiver_id === pid) || (m.sender_id === pid && m.receiver_id === me.id))
      );
      convs.push({
        type: 'dm',
        id: pid,
        peer: enrichPlayer(db, peer, me.id),
        last_message: msgs[msgs.length - 1] || null,
        unread_count: 0,
      });
    }
    return { conversations: convs };
  },

  getDmMessages: (peerId: string, preferredId?: string | null) => {
    const db = readDb();
    const me = getMe(db, preferredId);
    const peer = db.players.find((p) => p.id === peerId) || me;
    const messages = db.messages.filter(
      (m) =>
        !m.group_id &&
        ((m.sender_id === me.id && m.receiver_id === peerId) ||
          (m.sender_id === peerId && m.receiver_id === me.id))
    );
    return { peer: enrichPlayer(db, peer, me.id), messages, blocked: false };
  },

  markDmRead: (peerId: string, preferredId?: string | null) => {
    const db = readDb();
    const me = getMe(db, preferredId);
    let changed = false;
    db.messages.forEach((m) => {
      if (!m.group_id && m.sender_id === peerId && m.receiver_id === me.id && !m.is_read) {
        m.is_read = true;
        m.read_at = new Date().toISOString();
        changed = true;
      }
    });
    if (changed) saveDb(db);
    return { ok: true };
  },

  getGroupMessages: (groupId: string) => {
    const db = readDb();
    const group = db.groups.find((g) => g.id === groupId) || {
      id: groupId,
      name: 'Grup',
      avatar_url: null,
      created_by: db.activePlayerId,
      created_at: new Date().toISOString(),
    };
    const messages = db.messages.filter((m) => m.group_id === groupId);
    return { group, messages };
  },

  createGroup: (payload: { name: string; avatar_url?: string | null; member_ids: string[] }, preferredId?: string | null) => {
    const db = readDb();
    const me = getMe(db, preferredId);
    const group: ChatGroup = {
      id: uid('grp'),
      name: payload.name,
      avatar_url: payload.avatar_url || null,
      created_by: me.id,
      created_at: new Date().toISOString(),
    };
    db.groups.push(group);
    const uniqueMembers = Array.from(new Set([me.id, ...(payload.member_ids || [])]));
    for (const pid of uniqueMembers) {
      db.groupMembers.push({ group_id: group.id, player_id: pid });
    }
    saveDb(db);
    return { group };
  },

  addGroupMember: (groupId: string, playerId: string) => {
    const db = readDb();
    if (!db.groupMembers.some((gm) => gm.group_id === groupId && gm.player_id === playerId)) {
      db.groupMembers.push({ group_id: groupId, player_id: playerId });
      saveDb(db);
    }
    return { ok: true };
  },

  sendMessage: (
    payload: {
      receiver_id?: string | null;
      group_id?: string | null;
      reply_to_id?: string | null;
      text?: string | null;
      media_url?: string | null;
      media_type?: string | null;
    },
    preferredId?: string | null
  ) => {
    const db = readDb();
    const me = getMe(db, preferredId);
    const message: Message = {
      id: uid('msg'),
      sender_id: me.id,
      receiver_id: payload.receiver_id || null,
      group_id: payload.group_id || null,
      reply_to_id: payload.reply_to_id || null,
      text: payload.text || null,
      media_url: payload.media_url || null,
      media_type: payload.media_type || 'text',
      react_emoji: null,
      react_by: null,
      is_deleted_for_all: false,
      deleted_for_user_ids: null,
      is_read: false,
      read_at: null,
      created_at: new Date().toISOString(),
      sender: me,
      delivered: true,
    };
    db.messages.push(message);
    saveDb(db);
    return { message };
  },

  reactMessage: (messageId: string, emoji: string | null, preferredId?: string | null) => {
    const db = readDb();
    const me = getMe(db, preferredId);
    const msg = db.messages.find((m) => m.id === messageId)!;
    if (msg) {
      msg.react_emoji = emoji;
      msg.react_by = me.id;
      saveDb(db);
    }
    return { message: msg };
  },

  deleteMessage: (messageId: string, scope: 'me' | 'all', preferredId?: string | null) => {
    const db = readDb();
    const me = getMe(db, preferredId);
    const msg = db.messages.find((m) => m.id === messageId);
    if (msg) {
      if (scope === 'all') {
        msg.is_deleted_for_all = true;
      } else {
        msg.deleted_for_user_ids = [...(msg.deleted_for_user_ids || []), me.id];
      }
      saveDb(db);
    }
    return { ok: true, message: msg, deletedForMeId: scope === 'me' ? messageId : undefined };
  },

  getNotifications: () => {
    const db = readDb();
    return {
      notifications: db.notifications,
      unreadCount: db.notifications.filter((n) => !n.is_read).length,
    };
  },

  markAllNotificationsRead: () => {
    const db = readDb();
    db.notifications.forEach((n) => {
      n.is_read = true;
    });
    saveDb(db);
    return { ok: true };
  },

  markNotificationRead: (id: string) => {
    const db = readDb();
    const n = db.notifications.find((item) => item.id === id);
    if (n) {
      n.is_read = true;
      saveDb(db);
    }
    return { ok: true };
  },
};
