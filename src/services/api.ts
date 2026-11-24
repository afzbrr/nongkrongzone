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
import { localStore } from './localFallbackStore';

let activePlayerIdMemory: string | null = null;
let activeSessionTokenMemory: string | null = null;
let staticSpaMode = false;

export function isStaticSpaHost(): boolean {
  return staticSpaMode;
}

function shouldFallbackToStatic(err: any): boolean {
  return Boolean(err?.isSpaFallbackHtml || err?.status === 404);
}

async function withStaticFallback<T>(
  remoteCall: () => Promise<T>,
  fallbackCall: () => T | Promise<T>
): Promise<T> {
  if (staticSpaMode) {
    return await fallbackCall();
  }
  try {
    return await remoteCall();
  } catch (err: any) {
    if (shouldFallbackToStatic(err)) {
      staticSpaMode = true;
      return await fallbackCall();
    }
    throw err;
  }
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

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let res: Response;
    try {
      res = await fetch(url, {
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
  return withStaticFallback(
    () =>
      apiFetch<{ url: string; mediaType: string }>(
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
      ),
    () => ({
      url: dataBase64,
      mediaType: file.type.startsWith('video/') ? 'video' : 'image',
    })
  );
}

export const api = {
  health: () =>
    withStaticFallback(
      () =>
        apiFetch<{ ok: boolean; supabaseConfigured: boolean; missing: string[] }>('/api/health', {
          cache: 'no-store',
        }),
      () => ({ ok: true, supabaseConfigured: true, missing: [] })
    ),

  telegramLogin: (payload: { initData?: string; user: TelegramWebAppUser }) =>
    withStaticFallback(
      () =>
        apiFetch<{ player: Player; sessionToken: string; players: Player[]; ownerPlayer?: Player | null }>('/api/auth/telegram', {
          method: 'POST',
          body: JSON.stringify(payload),
        }),
      () => localStore.telegramLogin(payload.user, activePlayerIdMemory)
    ),

  telegramLoginGet: (payload: { initData?: string; user: TelegramWebAppUser }) => {
    const sp = new URLSearchParams();
    if (payload.initData) sp.set('initData', payload.initData);
    sp.set('tg_id', String(payload.user.id));
    if (payload.user.username) sp.set('username', payload.user.username);
    if (payload.user.first_name) sp.set('first_name', payload.user.first_name);
    if (payload.user.last_name) sp.set('last_name', payload.user.last_name);
    if (payload.user.photo_url) sp.set('photo_url', payload.user.photo_url);
    return withStaticFallback(
      () =>
        apiFetch<{ player: Player; sessionToken: string; players: Player[]; ownerPlayer?: Player | null }>(
          `/api/auth/telegram-login?${sp.toString()}`,
          { cache: 'no-store' }
        ),
      () => localStore.telegramLogin(payload.user, activePlayerIdMemory)
    );
  },

  getMe: () =>
    withStaticFallback(
      () =>
        apiFetch<{ player: Player; sessionToken?: string; players: Player[]; ownerPlayer?: Player | null }>('/api/auth/me', {
          cache: 'no-store',
        }),
      () => localStore.getMe(activePlayerIdMemory)
    ),

  updateMe: (payload: { full_name?: string; name?: string; username?: string; bio?: string; avatar_url?: string | null }) =>
    withStaticFallback(
      () =>
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
      () => localStore.updateMe(payload, activePlayerIdMemory)
    ),

  getPlayers: (q = '') =>
    withStaticFallback(
      () => apiFetch<{ players: Player[] }>(`/api/players${q ? `?q=${encodeURIComponent(q)}` : ''}`),
      () => localStore.getPlayers(q, activePlayerIdMemory)
    ),

  getPlayerProfile: (identifier: string) =>
    withStaticFallback(
      () => apiFetch<{ player: Player }>(`/api/players/${encodeURIComponent(identifier)}`),
      () => localStore.getPlayerProfile(identifier, activePlayerIdMemory)
    ),

  getFollowers: (playerId: string) =>
    withStaticFallback(
      () => apiFetch<{ players: Player[] }>(`/api/players/${playerId}/followers`),
      () => localStore.getFollowers(playerId, activePlayerIdMemory)
    ),

  getFollowing: (playerId: string) =>
    withStaticFallback(
      () => apiFetch<{ players: Player[] }>(`/api/players/${playerId}/following`),
      () => localStore.getFollowing(playerId, activePlayerIdMemory)
    ),

  getBlockedPlayers: () =>
    withStaticFallback(
      () => apiFetch<{ players: Player[] }>('/api/players/me/blocked'),
      () => localStore.getBlockedPlayers(activePlayerIdMemory)
    ),

  follow: (target_player_id: string) =>
    withStaticFallback(
      () =>
        apiFetch<{ ok: boolean; follows_owner?: boolean }>('/api/follows', {
          method: 'POST',
          body: JSON.stringify({ target_player_id }),
        }),
      () => localStore.follow(target_player_id, activePlayerIdMemory)
    ),

  unfollow: (targetId: string) =>
    withStaticFallback(
      () => apiFetch<{ ok: boolean; follows_owner?: boolean }>(`/api/follows/${targetId}`, { method: 'DELETE' }),
      () => localStore.unfollow(targetId, activePlayerIdMemory)
    ),

  block: (target_player_id: string) =>
    withStaticFallback(
      () =>
        apiFetch<{ ok: boolean; follows_owner?: boolean }>('/api/blocks', {
          method: 'POST',
          body: JSON.stringify({ target_player_id }),
        }),
      () => localStore.block(target_player_id, activePlayerIdMemory)
    ),

  unblock: (targetId: string) =>
    withStaticFallback(
      () => apiFetch<{ ok: boolean }>(`/api/blocks/${targetId}`, { method: 'DELETE' }),
      () => localStore.unblock(targetId, activePlayerIdMemory)
    ),

  getPosts: (params?: { playerId?: string; q?: string }) => {
    const sp = new URLSearchParams();
    if (params?.playerId) sp.set('playerId', params.playerId);
    if (params?.q) sp.set('q', params.q);
    const qs = sp.toString();
    return withStaticFallback(
      () => apiFetch<{ posts: Post[] }>(`/api/posts${qs ? `?${qs}` : ''}`),
      () => localStore.getPosts(params, activePlayerIdMemory)
    );
  },

  getPost: (postId: string) =>
    withStaticFallback(
      () => apiFetch<{ post: Post | null }>(`/api/posts/${postId}`),
      () => localStore.getPost(postId, activePlayerIdMemory)
    ),

  createPost: (payload: {
    caption?: string;
    media_urls?: string[];
    media_type?: string;
    tagged_usernames?: string[];
    original_post_id?: string | null;
    repost_caption?: string | null;
  }) =>
    withStaticFallback(
      () =>
        apiFetch<{ post: Post }>('/api/posts', {
          method: 'POST',
          body: JSON.stringify(payload),
        }),
      () => localStore.createPost(payload, activePlayerIdMemory)
    ),

  deletePost: (postId: string) =>
    withStaticFallback(
      () => apiFetch<{ ok: boolean }>(`/api/posts/${postId}`, { method: 'DELETE' }),
      () => localStore.deletePost(postId, activePlayerIdMemory)
    ),

  togglePostLike: (postId: string) =>
    withStaticFallback(
      () =>
        apiFetch<{ liked: boolean; likes_count: number }>(`/api/posts/${postId}/like`, {
          method: 'POST',
        }),
      () => localStore.togglePostLike(postId, activePlayerIdMemory)
    ),

  getComments: (postId: string) =>
    withStaticFallback(
      () => apiFetch<{ comments: PostComment[] }>(`/api/posts/${postId}/comments`),
      () => localStore.getComments(postId, activePlayerIdMemory)
    ),

  addComment: (postId: string, text: string, parent_comment_id?: string | null) =>
    withStaticFallback(
      () =>
        apiFetch<{ comment: PostComment; comments_count: number }>(`/api/posts/${postId}/comments`, {
          method: 'POST',
          body: JSON.stringify({ text, parent_comment_id: parent_comment_id || null }),
        }),
      () => localStore.addComment(postId, text, parent_comment_id, activePlayerIdMemory)
    ),

  toggleCommentLike: (commentId: string) =>
    withStaticFallback(
      () =>
        apiFetch<{ liked: boolean; likes_count: number }>(`/api/comments/${commentId}/like`, {
          method: 'POST',
        }),
      () => localStore.toggleCommentLike(commentId, activePlayerIdMemory)
    ),

  deleteComment: (commentId: string) =>
    withStaticFallback(
      () => apiFetch<{ ok: boolean }>(`/api/comments/${commentId}`, { method: 'DELETE' }),
      () => localStore.deleteComment(commentId, activePlayerIdMemory)
    ),

  getStories: () =>
    withStaticFallback(
      () => apiFetch<{ storyGroups: StoryGroup[] }>('/api/stories'),
      () => localStore.getStories(activePlayerIdMemory)
    ),

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
    withStaticFallback(
      () =>
        apiFetch<{ story: Story }>('/api/stories', {
          method: 'POST',
          body: JSON.stringify(payload),
        }),
      () => localStore.createStory(payload, activePlayerIdMemory)
    ),

  deleteStory: (storyId: string) =>
    withStaticFallback(
      () => apiFetch<{ ok: boolean }>(`/api/stories/${storyId}`, { method: 'DELETE' }),
      () => localStore.deleteStory(storyId, activePlayerIdMemory)
    ),

  viewStory: (storyId: string) =>
    withStaticFallback(
      () => apiFetch<{ ok: boolean }>(`/api/stories/${storyId}/view`, { method: 'POST' }),
      () => localStore.viewStory(storyId, activePlayerIdMemory)
    ),

  getStoryViews: (storyId: string) =>
    withStaticFallback(
      () => apiFetch<{ viewers: StoryView[]; reacts: StoryReact[] }>(`/api/stories/${storyId}/views`),
      () => localStore.getStoryViews(storyId)
    ),

  reactStory: (storyId: string, emoji: string) =>
    withStaticFallback(
      () =>
        apiFetch<{ react: StoryReact }>(`/api/stories/${storyId}/react`, {
          method: 'POST',
          body: JSON.stringify({ emoji }),
        }),
      () => localStore.reactStory(storyId, emoji, activePlayerIdMemory)
    ),

  replyStory: (storyId: string, text: string) =>
    withStaticFallback(
      () =>
        apiFetch<{ message: Message; peer_id: string }>(`/api/stories/${storyId}/reply`, {
          method: 'POST',
          body: JSON.stringify({ text }),
        }),
      () => localStore.replyStory(storyId, text, activePlayerIdMemory)
    ),

  getConversations: () =>
    withStaticFallback(
      () => apiFetch<{ conversations: ConversationItem[] }>('/api/chat/conversations'),
      () => localStore.getConversations(activePlayerIdMemory)
    ),

  getDmMessages: (peerId: string) =>
    withStaticFallback(
      () => apiFetch<{ peer: Player; messages: Message[]; blocked: boolean }>(`/api/chat/dm/${peerId}`),
      () => localStore.getDmMessages(peerId, activePlayerIdMemory)
    ),

  markDmRead: (peerId: string) =>
    withStaticFallback(
      () => apiFetch<{ ok: boolean }>(`/api/chat/dm/${peerId}/read`, { method: 'POST' }),
      () => localStore.markDmRead(peerId, activePlayerIdMemory)
    ),

  getGroupMessages: (groupId: string) =>
    withStaticFallback(
      () => apiFetch<{ group: ChatGroup; messages: Message[] }>(`/api/chat/groups/${groupId}`),
      () => localStore.getGroupMessages(groupId)
    ),

  createGroup: (payload: { name: string; avatar_url?: string | null; member_ids: string[] }) =>
    withStaticFallback(
      () =>
        apiFetch<{ group: ChatGroup }>('/api/chat/groups', {
          method: 'POST',
          body: JSON.stringify(payload),
        }),
      () => localStore.createGroup(payload, activePlayerIdMemory)
    ),

  addGroupMember: (groupId: string, player_id: string) =>
    withStaticFallback(
      () =>
        apiFetch<{ ok: boolean }>(`/api/chat/groups/${groupId}/members`, {
          method: 'POST',
          body: JSON.stringify({ player_id }),
        }),
      () => localStore.addGroupMember(groupId, player_id)
    ),

  sendMessage: (payload: {
    receiver_id?: string | null;
    group_id?: string | null;
    reply_to_id?: string | null;
    text?: string | null;
    media_url?: string | null;
    media_type?: string | null;
  }) =>
    withStaticFallback(
      () =>
        apiFetch<{ message: Message }>('/api/chat/messages', {
          method: 'POST',
          body: JSON.stringify(payload),
        }),
      () => localStore.sendMessage(payload, activePlayerIdMemory)
    ),

  reactMessage: (messageId: string, emoji: string | null) =>
    withStaticFallback(
      () =>
        apiFetch<{ message: Message }>(`/api/chat/messages/${messageId}/react`, {
          method: 'POST',
          body: JSON.stringify({ emoji }),
        }),
      () => localStore.reactMessage(messageId, emoji, activePlayerIdMemory)
    ),

  deleteMessage: (messageId: string, scope: 'me' | 'all') =>
    withStaticFallback(
      () =>
        apiFetch<{ ok: boolean; message?: Message; deletedForMeId?: string }>(
          `/api/chat/messages/${messageId}?scope=${scope}`,
          { method: 'DELETE' }
        ),
      () => localStore.deleteMessage(messageId, scope, activePlayerIdMemory)
    ),

  getNotifications: () =>
    withStaticFallback(
      () => apiFetch<{ notifications: NotificationItem[]; unreadCount: number }>('/api/notifications'),
      () => localStore.getNotifications()
    ),

  markAllNotificationsRead: () =>
    withStaticFallback(
      () => apiFetch<{ ok: boolean }>('/api/notifications/read-all', { method: 'POST' }),
      () => localStore.markAllNotificationsRead()
    ),

  markNotificationRead: (id: string) =>
    withStaticFallback(
      () => apiFetch<{ ok: boolean }>(`/api/notifications/${id}/read`, { method: 'POST' }),
      () => localStore.markNotificationRead(id)
    ),

  getBorders: () =>
    withStaticFallback(
      () =>
        apiFetch<{
          borders: BorderItem[];
          collectionBorders?: BorderItem[];
          ownedIds: string[];
          equippedBorderId: string | null;
          coins: number;
          rawCount?: number;
          rlsHint?: string | null;
        }>('/api/borders'),
      () => localStore.getBorders(activePlayerIdMemory)
    ),

  buyBorder: (border_id: string) =>
    withStaticFallback(
      () =>
        apiFetch<{ ok: boolean; coins: number; border: BorderItem }>('/api/borders/buy', {
          method: 'POST',
          body: JSON.stringify({ border_id }),
        }),
      () => localStore.buyBorder(border_id, activePlayerIdMemory)
    ),

  equipBorder: (border_id: string) =>
    withStaticFallback(
      () =>
        apiFetch<{ ok: boolean; border_id: string; player: Player }>('/api/borders/equip', {
          method: 'POST',
          body: JSON.stringify({ border_id }),
        }),
      () => localStore.equipBorder(border_id, activePlayerIdMemory)
    ),
};
