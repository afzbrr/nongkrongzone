import type {
  BorderItem,
  ChatGroup,
  ConversationItem,
  Giveaway,
  Message,
  NotificationItem,
  OwnerBroadcast,
  OwnerPanelStats,
  Player,
  Post,
  PostComment,
  Story,
  StoryGroup,
  StoryReact,
  StoryView,
} from '../types';

let activePlayerIdMemory: string | null = null;
let activeSessionTokenMemory: string | null = null;
let noOwnerFallbackMemory = false;
let guestModeMemory = false;

export function isStaticSpaHost(): boolean {
  return false;
}

export function setNoOwnerFallback(enabled: boolean) {
  noOwnerFallbackMemory = enabled;
}

export function setGuestMode(enabled: boolean) {
  guestModeMemory = enabled;
}

export function setActivePlayerId(id: string | null) {
  activePlayerIdMemory = id;
}

export function setActiveSessionToken(token: string | null) {
  activeSessionTokenMemory = token;
}

export function getActivePlayerId(): string | null {
  return activePlayerIdMemory;
}

export interface TelegramWebAppUser {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
}

async function apiFetch<T>(
  url: string,
  options: RequestInit = {},
  timeoutMs = 15000
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const hasBody = options.body !== undefined && options.body !== null;

  const attempt = async (): Promise<T> => {
    const headers: Record<string, string> = {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers as Record<string, string> | undefined),
    };
    if (activeSessionTokenMemory) {
      headers['Authorization'] = `Bearer ${activeSessionTokenMemory}`;
    }
    if (activePlayerIdMemory) {
      headers['x-player-id'] = activePlayerIdMemory;
    }
    if (noOwnerFallbackMemory) {
      headers['x-no-owner-fallback'] = '1';
    }
    if (guestModeMemory) {
      headers['x-guest-mode'] = '1';
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let res: Response;
    try {
      res = await fetch(url, {
        ...(method === 'GET' ? { cache: 'no-store' as RequestCache } : {}),
        ...options,
        credentials: 'same-origin',
        headers,
        signal: controller.signal,
      });
    } catch (err: any) {
      clearTimeout(timer);
      if (err?.name === 'AbortError') {
        const timeoutErr = new Error('Koneksi timeout. Periksa jaringan lalu coba lagi.') as Error & {
          isRetryable?: boolean;
        };
        timeoutErr.isRetryable = true;
        throw timeoutErr;
      }
      const netErr = new Error(err?.message || 'Gagal terhubung ke server') as Error & {
        isRetryable?: boolean;
      };
      netErr.isRetryable = true;
      throw netErr;
    }
    clearTimeout(timer);

    const rawText = await res.text().catch(() => '');
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    const looksLikeHtml = contentType.includes('text/html') || /^\s*</.test(rawText);

    if (looksLikeHtml) {
      const isSpaFallbackHtml =
        rawText.includes('id="root"') || rawText.includes('NONGKRONG ZONE');
      const htmlErr = new Error(
        isSpaFallbackHtml
          ? 'SPA_STATIC_HOST'
          : 'Server sedang menyiapkan koneksi. Coba lagi sebentar.'
      ) as Error & {
        status?: number;
        isProxyHtml?: boolean;
        isSpaFallbackHtml?: boolean;
        isRetryable?: boolean;
      };
      htmlErr.status = res.status;
      htmlErr.isProxyHtml = true;
      htmlErr.isSpaFallbackHtml = isSpaFallbackHtml;
      htmlErr.isRetryable = !isSpaFallbackHtml;
      throw htmlErr;
    }

    let data: any = {};
    if (rawText) {
      try {
        data = JSON.parse(rawText);
      } catch {
        data = {};
      }
    }

    if (!res.ok) {
      const serverMsg = data?.message || data?.error;
      const snippet = !serverMsg && rawText.trim() ? rawText.trim().slice(0, 120) : '';
      const message =
        serverMsg || (snippet ? `HTTP ${res.status}: ${snippet}` : `HTTP ${res.status} (${url})`);
      const err = new Error(message) as Error & {
        code?: string;
        status?: number;
        isRetryable?: boolean;
      };
      err.code = data?.error;
      err.status = res.status;
      err.isRetryable = res.status === 502 || res.status === 503 || res.status === 504 || res.status === 429;
      throw err;
    }

    return data as T;
  };

  try {
    return await attempt();
  } catch (firstErr: any) {
    if (method === 'GET' && firstErr?.isRetryable) {
      await new Promise((r) => setTimeout(r, 350));
      return await attempt();
    }
    throw firstErr;
  }
}

export async function uploadMediaFile(file: File): Promise<{ url: string; mediaType: string }> {
  const dataBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsDataURL(file);
  });
  return apiFetch<{ url: string; mediaType: string }>(
    '/api/upload',
    {
      method: 'POST',
      body: JSON.stringify({
        filename: file.name,
        mimeType: file.type,
        dataBase64,
      }),
    },
    60000
  );
}

export const api = {
  health: () =>
    apiFetch<{ ok: boolean; supabaseConfigured: boolean; missing: string[] }>('/api/health', {
      cache: 'no-store',
    }),

  telegramLogin: (payload: { initData?: string; user?: TelegramWebAppUser }) =>
    apiFetch<{ player: Player; sessionToken: string; players: Player[]; ownerPlayer?: Player | null }>(
      '/api/auth/telegram',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      20000
    ),

  telegramLoginGet: (payload: { initData?: string; user?: TelegramWebAppUser }) => {
    const sp = new URLSearchParams();
    if (payload.initData) sp.set('initData', payload.initData);
    if (payload.user?.id) {
      sp.set('tg_id', String(payload.user.id));
      if (payload.user.username) sp.set('username', payload.user.username);
      if (payload.user.first_name) sp.set('first_name', payload.user.first_name);
      if (payload.user.last_name) sp.set('last_name', payload.user.last_name);
      if (payload.user.photo_url) sp.set('photo_url', payload.user.photo_url);
    }
    return apiFetch<{ player: Player; sessionToken: string; players: Player[]; ownerPlayer?: Player | null }>(
      `/api/auth/telegram-login?${sp.toString()}`,
      { cache: 'no-store' },
      20000
    );
  },

  getMe: () =>
    apiFetch<{ player: Player; sessionToken?: string; players: Player[]; ownerPlayer?: Player | null }>(
      '/api/auth/me',
      {
        cache: 'no-store',
      }
    ),

  updateMe: (payload: {
    full_name?: string;
    name?: string;
    username?: string;
    bio?: string;
    avatar_url?: string | null;
  }) =>
    apiFetch<{ player: Player }>('/api/players/me', {
      method: 'PATCH',
      body: JSON.stringify({
        ...(payload.full_name !== undefined ? { full_name: payload.full_name } : {}),
        ...(payload.name !== undefined ? { name: payload.name } : {}),
        ...(payload.username !== undefined ? { username: payload.username } : {}),
        ...(payload.bio !== undefined ? { bio: payload.bio } : {}),
        ...(payload.avatar_url !== undefined ? { avatar_url: payload.avatar_url } : {}),
      }),
    }),

  getPlayers: (q = '') =>
    apiFetch<{ players: Player[] }>(`/api/players${q ? `?q=${encodeURIComponent(q)}` : ''}`),

  getPlayerProfile: (identifier: string) =>
    apiFetch<{ player: Player }>(`/api/players/${encodeURIComponent(identifier)}`),

  getFollowers: (playerId: string) =>
    apiFetch<{ players: Player[] }>(`/api/players/${playerId}/followers`),

  getFollowing: (playerId: string) =>
    apiFetch<{ players: Player[] }>(`/api/players/${playerId}/following`),

  getBlockedPlayers: () => apiFetch<{ players: Player[] }>('/api/players/me/blocked'),

  follow: (target_player_id: string) =>
    apiFetch<{ ok: boolean; follows_owner?: boolean }>('/api/follows', {
      method: 'POST',
      body: JSON.stringify({ target_player_id }),
    }),

  unfollow: (targetId: string) =>
    apiFetch<{ ok: boolean; follows_owner?: boolean }>(`/api/follows/${targetId}`, {
      method: 'DELETE',
    }),

  block: (target_player_id: string) =>
    apiFetch<{ ok: boolean; follows_owner?: boolean }>('/api/blocks', {
      method: 'POST',
      body: JSON.stringify({ target_player_id }),
    }),

  unblock: (targetId: string) =>
    apiFetch<{ ok: boolean }>(`/api/blocks/${targetId}`, { method: 'DELETE' }),

  getPosts: (params?: { playerId?: string; q?: string }) => {
    const sp = new URLSearchParams();
    if (params?.playerId) sp.set('playerId', params.playerId);
    if (params?.q) sp.set('q', params.q);
    const qs = sp.toString();
    return apiFetch<{ posts: Post[] }>(`/api/posts${qs ? `?${qs}` : ''}`);
  },

  getPost: (postId: string) => apiFetch<{ post: Post | null }>(`/api/posts/${postId}`),

  createPost: (payload: {
    caption?: string;
    media_urls?: string[];
    media_type?: string;
    tagged_usernames?: string[];
    original_post_id?: string | null;
    repost_caption?: string | null;
  }) =>
    apiFetch<{ post: Post }>('/api/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deletePost: (postId: string) =>
    apiFetch<{ ok: boolean }>(`/api/posts/${postId}`, { method: 'DELETE' }),

  togglePostLike: (postId: string) =>
    apiFetch<{ liked: boolean; likes_count: number }>(`/api/posts/${postId}/like`, {
      method: 'POST',
    }),

  getComments: (postId: string) =>
    apiFetch<{ comments: PostComment[] }>(`/api/posts/${postId}/comments`),

  addComment: (postId: string, text: string, parent_comment_id?: string | null) =>
    apiFetch<{ comment: PostComment; comments_count: number }>(`/api/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text, parent_comment_id: parent_comment_id || null }),
    }),

  toggleCommentLike: (commentId: string) =>
    apiFetch<{ liked: boolean; likes_count: number }>(`/api/comments/${commentId}/like`, {
      method: 'POST',
    }),

  deleteComment: (commentId: string) =>
    apiFetch<{ ok: boolean }>(`/api/comments/${commentId}`, { method: 'DELETE' }),

  getStories: () => apiFetch<{ storyGroups: StoryGroup[] }>('/api/stories'),

  createStory: (payload: {
    media_url?: string | null;
    media_type: 'text' | 'image' | 'video';
    text?: string;
    caption?: string;
    bg_color?: string;
    duration_hours?: 1 | 6 | 12 | 24;
    song_title?: string;
    song_artist?: string;
    song_url?: string;
  }) =>
    apiFetch<{ story: Story }>('/api/stories', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteStory: (storyId: string) =>
    apiFetch<{ ok: boolean }>(`/api/stories/${storyId}`, { method: 'DELETE' }),

  viewStory: (storyId: string) =>
    apiFetch<{ ok: boolean }>(`/api/stories/${storyId}/view`, { method: 'POST' }),

  getStoryViews: (storyId: string) =>
    apiFetch<{ viewers: StoryView[]; reacts: StoryReact[] }>(`/api/stories/${storyId}/views`),

  reactStory: (storyId: string, emoji: string) =>
    apiFetch<{ react: StoryReact }>(`/api/stories/${storyId}/react`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    }),

  replyStory: (storyId: string, text: string) =>
    apiFetch<{ message: Message; peer_id: string }>(`/api/stories/${storyId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  getConversations: () =>
    apiFetch<{ conversations: ConversationItem[] }>('/api/chat/conversations'),

  getDmMessages: (peerId: string) =>
    apiFetch<{ peer: Player; messages: Message[]; blocked: boolean }>(`/api/chat/dm/${peerId}`),

  markDmRead: (peerId: string) =>
    apiFetch<{ ok: boolean }>(`/api/chat/dm/${peerId}/read`, { method: 'POST' }),

  getGroupMessages: (groupId: string) =>
    apiFetch<{ group: ChatGroup; messages: Message[] }>(`/api/chat/groups/${groupId}`),

  createGroup: (payload: { name: string; avatar_url?: string | null; member_ids: string[] }) =>
    apiFetch<{ group: ChatGroup }>('/api/chat/groups', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  addGroupMember: (groupId: string, player_id: string) =>
    apiFetch<{ ok: boolean }>(`/api/chat/groups/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify({ player_id }),
    }),

  sendMessage: (payload: {
    receiver_id?: string | null;
    group_id?: string | null;
    reply_to_id?: string | null;
    text?: string | null;
    media_url?: string | null;
    media_type?: string | null;
  }) =>
    apiFetch<{ message: Message }>('/api/chat/messages', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  reactMessage: (messageId: string, emoji: string | null) =>
    apiFetch<{ message: Message }>(`/api/chat/messages/${messageId}/react`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    }),

  deleteMessage: (messageId: string, scope: 'me' | 'all') =>
    apiFetch<{ ok: boolean; message?: Message; deletedForMeId?: string }>(
      `/api/chat/messages/${messageId}?scope=${scope}`,
      { method: 'DELETE' }
    ),

  getNotifications: () =>
    apiFetch<{ notifications: NotificationItem[]; unreadCount: number }>('/api/notifications'),

  markAllNotificationsRead: () =>
    apiFetch<{ ok: boolean }>('/api/notifications/read-all', { method: 'POST' }),

  markNotificationRead: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/notifications/${id}/read`, { method: 'POST' }),

  getBorders: () =>
    apiFetch<{
      borders: BorderItem[];
      collectionBorders?: BorderItem[];
      ownedIds: string[];
      equippedBorderId: string | null;
      coins: number;
      rawCount?: number;
      rlsHint?: string | null;
    }>('/api/borders'),

  buyBorder: (border_id: string) =>
    apiFetch<{ ok: boolean; coins: number; border: BorderItem }>('/api/borders/buy', {
      method: 'POST',
      body: JSON.stringify({ border_id }),
    }),

  equipBorder: (border_id: string) =>
    apiFetch<{ ok: boolean; border_id: string; player: Player }>('/api/borders/equip', {
      method: 'POST',
      body: JSON.stringify({ border_id }),
    }),

  transferCoins: (payload: { to_player_id?: string; to_username?: string; amount: number }) =>
    apiFetch<{
      ok: boolean;
      amount: number;
      senderCoins: number;
      recipient: Player;
      transactionRecorded?: boolean;
    }>('/api/coins/transfer', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getRealtimeConfig: () =>
    apiFetch<{ enabled: boolean; url: string | null; anonKey: string | null }>(
      '/api/realtime-config',
      { cache: 'no-store' }
    ),

  getOwnerPanelState: () =>
    apiFetch<{
      activeBroadcasts: OwnerBroadcast[];
      allBroadcasts?: OwnerBroadcast[];
      stats?: OwnerPanelStats | null;
      giveaways: Giveaway[];
      serverNow: string;
    }>('/api/owner/panel-state', { cache: 'no-store' }),

  createOwnerBroadcast: (payload: {
    title?: string;
    message: string;
    scheduled_at?: string;
    is_active?: boolean;
  }) =>
    apiFetch<{ broadcast: OwnerBroadcast }>('/api/owner/broadcasts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateOwnerBroadcast: (
    id: string,
    payload: {
      title?: string;
      message?: string;
      scheduled_at?: string;
      is_active?: boolean;
    }
  ) =>
    apiFetch<{ broadcast: OwnerBroadcast | null }>(`/api/owner/broadcasts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteOwnerBroadcast: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/owner/broadcasts/${id}`, { method: 'DELETE' }),

  createGiveaway: (payload: {
    amount_per_user: number;
    max_winners: number;
    scheduled_at: string;
  }) =>
    apiFetch<{ giveaway: Giveaway }>('/api/owner/giveaways', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  cancelGiveaway: (id: string) =>
    apiFetch<{ ok: boolean; giveaway: Giveaway | null }>(
      `/api/owner/giveaways/${id}/cancel`,
      { method: 'PATCH' }
    ),

  deleteGiveaway: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/owner/giveaways/${id}`, { method: 'DELETE' }),

  claimGiveaway: (id: string) =>
    apiFetch<{ ok: boolean; amount: number; newCoins: number; claimedCount: number }>(
      `/api/giveaways/${id}/claim`,
      { method: 'POST' }
    ),
};
