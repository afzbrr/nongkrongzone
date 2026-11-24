import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bell,
  Database,
  Gamepad2,
  Home,
  MessageCircle,
  PlusSquare,
  RefreshCw,
  Search,
  Tv,
  User,
  X,
} from 'lucide-react';
import type { NotificationItem, Player, Post, StoryGroup } from './types';
import { api, isStaticSpaHost, setActivePlayerId, setActiveSessionToken } from './services/api';
import { BordersProvider } from './context/BordersContext';
import { StoryBar } from './components/StoryBar';
import { StoryViewer } from './components/StoryViewer';
import { PostCard } from './components/PostCard';
import { CommentsSheet } from './components/CommentsSheet';
import { CreateModal } from './components/CreateModal';
import { ChatView } from './components/ChatView';
import { ProfileView } from './components/ProfileView';
import { ExploreView } from './components/ExploreView';
import { NotificationsView } from './components/NotificationsView';
import { BordersView } from './components/BordersView';
import { ComingSoonView } from './components/ComingSoonView';
import { BrandLogo } from './components/BrandLogo';
import { SplashScreen } from './components/SplashScreen';
import { FollowOwnerGate } from './components/FollowOwnerGate';

type Tab = 'feed' | 'nobar' | 'game' | 'explore' | 'borders' | 'profile';

export default function App() {
  const [bootState, setBootState] = useState<'loading' | 'ready' | 'unconfigured' | 'error'>('loading');
  const [bootError, setBootError] = useState<string | null>(null);
  const [missingEnv, setMissingEnv] = useState<string[]>([]);
  const [splashPhase, setSplashPhase] = useState<'showing' | 'fading' | 'done'>('showing');

  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [ownerPlayer, setOwnerPlayer] = useState<Player | null>(null);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('feed');
  const [viewingUsername, setViewingUsername] = useState<string | null>(null);

  // Feed & Stories
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [storyViewerIndex, setStoryViewerIndex] = useState<number | null>(null);

  // Modals / Overlays
  const [commentsPost, setCommentsPost] = useState<Post | null>(null);
  const [createMode, setCreateMode] = useState<'post' | 'story' | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInitialPeer, setChatInitialPeer] = useState<Player | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [focusedPost, setFocusedPost] = useState<Post | null>(null);

  // Notifications & Real-Time WebSocket
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadChats, setUnreadChats] = useState(0);
  const [wsEvent, setWsEvent] = useState<{ event: string; payload: any; seq: number } | null>(null);
  const wsSeqRef = useRef(0);
  const wsRef = useRef<WebSocket | null>(null);

  const loadFeedAndStories = useCallback(async () => {
    setLoadingFeed(true);
    try {
      const [postsRes, storiesRes, playersRes] = await Promise.all([
        api.getPosts(),
        api.getStories(),
        api.getPlayers(),
      ]);
      setPosts(postsRes.posts);
      setStoryGroups(storiesRes.storyGroups);
      setAllPlayers(playersRes.players);
    } finally {
      setLoadingFeed(false);
    }
  }, []);

  const loadNotificationsAndChats = useCallback(async () => {
    try {
      const [notifRes, convRes] = await Promise.all([
        api.getNotifications(),
        api.getConversations(),
      ]);
      setNotifications(notifRes.notifications);
      setUnreadNotifs(notifRes.unreadCount);
      const totalUnreadChat = convRes.conversations.reduce(
        (sum, c) => sum + (c.unread_count || 0),
        0
      );
      setUnreadChats(totalUnreadChat);
    } catch {
      // Ignore background errors
    }
  }, []);

  const [slowLoading, setSlowLoading] = useState(false);
  const autoRetryCountRef = useRef(0);
  const resolvedByServerRef = useRef(false);

  const extractTelegramAuth = useCallback(() => {
    const tgWebApp = (window as any)?.Telegram?.WebApp;
    try {
      tgWebApp?.ready?.();
      tgWebApp?.expand?.();
    } catch {
      // ignore WebApp API errors
    }

    let initData = typeof tgWebApp?.initData === 'string' ? tgWebApp.initData : '';
    let tgUser = tgWebApp?.initDataUnsafe?.user;

    if (!initData && typeof window !== 'undefined') {
      try {
        const hashRaw = window.location.hash.replace(/^#/, '');
        const hashParams = new URLSearchParams(hashRaw);
        const searchParams = new URLSearchParams(window.location.search);
        const fromParams = hashParams.get('tgWebAppData') || searchParams.get('tgWebAppData');
        if (fromParams) initData = fromParams;
      } catch {
        // ignore url parse errors
      }
    }

    if ((!tgUser || !tgUser.id) && initData) {
      try {
        const normalizedInit = initData.includes('%3D') && !initData.includes('=')
          ? decodeURIComponent(initData)
          : initData;
        const params = new URLSearchParams(normalizedInit);
        const rawUser = params.get('user');
        if (rawUser) {
          const decodedUser = rawUser.startsWith('%') ? decodeURIComponent(rawUser) : rawUser;
          tgUser = JSON.parse(decodedUser);
        }
      } catch {
        // ignore user JSON parse errors
      }
    }

    return { initData, tgUser, hasTgWebApp: Boolean(tgWebApp) };
  }, []);

  const buildLocalFallbackPlayer = useCallback((tgUser?: any): Player => {
    const tgId = Number(tgUser?.id);
    const hasTg = Number.isSafeInteger(tgId) && tgId > 0;
    const isOwner = !hasTg || tgId === 6189849073;
    const username = hasTg
      ? String(tgUser?.username || `tg_${tgId}`).replace(/^@/, '') || `tg_${tgId}`
      : 'istamina';
    const fullName = hasTg
      ? [tgUser?.first_name, tgUser?.last_name].filter(Boolean).join(' ').trim() || username
      : 'Faiz Ganteng';

    const hasTgUsername = hasTg && Boolean(typeof tgUser?.username === 'string' && tgUser.username.trim());
    return {
      id: isOwner ? '7c9a08e0-e0b1-42d1-ab74-cd87a431107b' : hasTg ? `tg-${tgId}` : '00000000-0000-0000-0000-000000000001',
      telegram_id: hasTg ? tgId : 6189849073,
      name: fullName,
      full_name: fullName,
      username,
      avatar_url: typeof tgUser?.photo_url === 'string' ? tgUser.photo_url : null,
      telegram_avatar_url: typeof tgUser?.photo_url === 'string' ? tgUser.photo_url : null,
      bio: '',
      is_owner: isOwner,
      is_banned: false,
      coins: isOwner ? 999999999 : 500,
      border_id: isOwner ? 'API_PHOENIX' : null,
      has_telegram_username: hasTg ? hasTgUsername : true,
      follows_owner: isOwner ? true : false,
      created_at: new Date().toISOString(),
    };
  }, []);

  const bootstrap = useCallback(async (backgroundRefresh = false) => {
    if (!backgroundRefresh) {
      resolvedByServerRef.current = false;
      setBootState('loading');
      setBootError(null);
      setSlowLoading(false);
    }
    try {
      let auth = extractTelegramAuth();
      if (auth.hasTgWebApp && !auth.tgUser?.id) {
        await new Promise((r) => setTimeout(r, 150));
        auth = extractTelegramAuth();
      }

      const { initData, tgUser } = auth;
      let meRes: { player: Player; sessionToken?: string; players: Player[]; ownerPlayer?: Player | null };

      if (tgUser?.id) {
        const payload = {
          initData,
          user: {
            id: Number(tgUser.id),
            username: tgUser.username,
            first_name: tgUser.first_name,
            last_name: tgUser.last_name,
            photo_url: tgUser.photo_url,
          },
        };
        try {
          meRes = await api.telegramLogin(payload);
        } catch (postErr: any) {
          if (
            postErr?.code === 'SUPABASE_NOT_CONFIGURED' ||
            postErr?.status === 401 ||
            postErr?.isSpaFallbackHtml
          ) {
            throw postErr;
          }
          meRes = await api.telegramLoginGet(payload);
        }
      } else {
        meRes = await api.getMe();
      }

      resolvedByServerRef.current = true;
      autoRetryCountRef.current = 0;
      setActivePlayerId(meRes.player.id);
      if (meRes.sessionToken) {
        setActiveSessionToken(meRes.sessionToken);
      }
      const tgHasUser =
        tgUser?.id ? Boolean(typeof tgUser?.username === 'string' && tgUser.username.trim()) : true;
      const resolvedPlayer: Player = {
        ...meRes.player,
        has_telegram_username: meRes.player.has_telegram_username ?? tgHasUser,
      };
      const resolvedOwner =
        meRes.ownerPlayer ||
        (meRes.players || []).find((p) => p.is_owner || p.telegram_id === 6189849073) ||
        null;
      setOwnerPlayer(resolvedOwner);
      setCurrentUser(resolvedPlayer);
      setAllPlayers(meRes.players || [resolvedPlayer]);
      setBootState('ready');

      if (resolvedPlayer.is_owner || resolvedPlayer.follows_owner === true) {
        // Load feed & notifications in background so feed issues never trap user on loading screen
        Promise.allSettled([loadFeedAndStories(), loadNotificationsAndChats()]).catch(() => {});
      }
    } catch (err: any) {
      if (err?.code === 'SUPABASE_NOT_CONFIGURED') {
        resolvedByServerRef.current = true;
        setMissingEnv(['SUPABASE_URL', 'SUPABASE_ANON_KEY']);
        setBootState('unconfigured');
      } else if (err?.isSpaFallbackHtml || err?.status === 404) {
        const { tgUser } = extractTelegramAuth();
        const fallbackPlayer = buildLocalFallbackPlayer(tgUser);
        resolvedByServerRef.current = true;
        setCurrentUser((prev) => prev || fallbackPlayer);
        setAllPlayers((prev) => (prev.length > 0 ? prev : [fallbackPlayer]));
        setBootState('ready');
      } else if (!backgroundRefresh) {
        setBootError(err?.message || 'Gagal terhubung ke server');
        setBootState('error');
      }
    }
  }, [buildLocalFallbackPlayer, extractTelegramAuth, loadFeedAndStories, loadNotificationsAndChats]);

  // Map any direct/refreshed SPA path via JS state & normalize URL to "/" without page reload
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const rawPath = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
    if (rawPath !== '/') {
      if (rawPath === '/nobar') setActiveTab('nobar');
      else if (rawPath === '/game' || rawPath === '/mabar') setActiveTab('game');
      else if (rawPath === '/search' || rawPath === '/explore') setActiveTab('explore');
      else if (rawPath === '/border' || rawPath === '/borders') setActiveTab('borders');
      else if (rawPath === '/profil' || rawPath === '/profile') setActiveTab('profile');
      else if (rawPath === '/chat') setChatOpen(true);
      else if (rawPath === '/post') setCreateMode('post');
      else setActiveTab('feed');

      try {
        window.history.replaceState(null, '', `/${window.location.search}${window.location.hash}`);
      } catch {
        // ignore history error
      }
    }
  }, []);

  useEffect(() => {
    document.title = 'NONGKRONG ZONE - Tempat Nongkrong Anak Muda';
    try {
      const tgWebApp = (window as any)?.Telegram?.WebApp;
      tgWebApp?.ready?.();
      tgWebApp?.expand?.();
    } catch {
      // ignore
    }
    const fadeTimer = setTimeout(() => {
      setSplashPhase('fading');
    }, 2150);
    const doneTimer = setTimeout(() => {
      setSplashPhase('done');
    }, 2500);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  useEffect(() => {
    bootstrap(false);
  }, [bootstrap]);

  // Hard 2.5s boot guarantee: never leave user stuck on "Memuat..." after SplashScreen finishes
  useEffect(() => {
    if (bootState !== 'loading') return;
    const slowTimer = setTimeout(() => setSlowLoading(true), 2000);
    const forceEnterTimer = setTimeout(() => {
      if (!resolvedByServerRef.current) {
        const { tgUser } = extractTelegramAuth();
        const fallbackPlayer = buildLocalFallbackPlayer(tgUser);
        setCurrentUser((prev) => prev || fallbackPlayer);
        setAllPlayers((prev) => (prev.length > 0 ? prev : [fallbackPlayer]));
        setBootState('ready');
      }
    }, 2450);
    return () => {
      clearTimeout(slowTimer);
      clearTimeout(forceEnterTimer);
    };
  }, [bootState, buildLocalFallbackPlayer, extractTelegramAuth]);

  useEffect(() => {
    if (bootState !== 'error') return;
    if (autoRetryCountRef.current >= 1) return;
    const timer = setTimeout(() => {
      autoRetryCountRef.current += 1;
      bootstrap(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [bootState, bootstrap]);

  // WebSocket real-time connection
  useEffect(() => {
    if (!currentUser?.id || isStaticSpaHost()) return;
    let closedByCleanup = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      try {
        const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ws = new WebSocket(`${proto}//${window.location.host}/ws?playerId=${currentUser.id}`);
        wsRef.current = ws;

        ws.onmessage = (e) => {
          try {
            const parsed = JSON.parse(e.data);
            wsSeqRef.current += 1;
            setWsEvent({ event: parsed.event, payload: parsed.payload, seq: wsSeqRef.current });

            if (parsed.event === 'notification:new' && parsed.payload) {
              setNotifications((prev) => [parsed.payload, ...prev]);
              setUnreadNotifs((c) => c + 1);
            } else if (parsed.event === 'message:new' && parsed.payload) {
              if (parsed.payload.sender_id !== currentUser.id) {
                loadNotificationsAndChats();
              }
            } else if (parsed.event === 'chat:read') {
              loadNotificationsAndChats();
            } else if (parsed.event === 'post:created' && parsed.payload) {
              setPosts((prev) => {
                if (prev.some((p) => p.id === parsed.payload.id)) return prev;
                return [parsed.payload, ...prev];
              });
            } else if (parsed.event === 'post:deleted' && parsed.payload?.id) {
              setPosts((prev) => prev.filter((p) => p.id !== parsed.payload.id));
            }
          } catch {
            // ignore malformed ws message
          }
        };

        ws.onclose = () => {
          if (!closedByCleanup) {
            reconnectTimer = setTimeout(connect, 2500);
          }
        };
      } catch {
        // Ignore WebSocket errors in restricted WebViews
      }
    };

    connect();
    return () => {
      closedByCleanup = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, [currentUser?.id, loadNotificationsAndChats]);

  const handleOpenProfile = (username: string) => {
    if (currentUser && username.toLowerCase() === currentUser.username.toLowerCase()) {
      setViewingUsername(null);
      setActiveTab('profile');
    } else {
      setViewingUsername(username);
    }
  };

  const handleOwnerUnfollowed = useCallback(() => {
    setViewingUsername(null);
    setChatOpen(false);
    setNotifOpen(false);
    setCreateMode(null);
    setCommentsPost(null);
    setFocusedPost(null);
    setStoryViewerIndex(null);
    setActiveTab('feed');
    setCurrentUser((prev) => (prev && !prev.is_owner ? { ...prev, follows_owner: false } : prev));
  }, []);

  const handleCurrentUserUpdated = (updated: Player) => {
    setCurrentUser((prev) => ({
      ...updated,
      has_telegram_username: updated.has_telegram_username ?? prev?.has_telegram_username,
      follows_owner: updated.follows_owner ?? prev?.follows_owner,
    }));
    setAllPlayers((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
    loadFeedAndStories();
  };

  const handleToggleLike = async (post: Post) => {
    const res = await api.togglePostLike(post.id);
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id ? { ...p, liked_by_me: res.liked, likes_count: res.likes_count } : p
      )
    );
  };

  const handleRepost = async (origPost: Post, repostCaption: string) => {
    const res = await api.createPost({
      original_post_id: origPost.id,
      repost_caption: repostCaption || undefined,
      media_type: 'text',
    });
    setPosts((prev) => {
      if (prev.some((p) => p.id === res.post.id)) return prev;
      return [res.post, ...prev];
    });
  };

  const handleDeletePost = async (postId: string) => {
    await api.deletePost(postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleBlockUser = async (target: Player) => {
    const res = await api.block(target.id);
    if (
      !currentUser?.is_owner &&
      (res.follows_owner === false || target.is_owner || target.telegram_id === 6189849073)
    ) {
      handleOwnerUnfollowed();
      return;
    }
    await loadFeedAndStories();
  };

  const handleSelectNotification = async (notif: NotificationItem) => {
    if (!notif.is_read) {
      api.markNotificationRead(notif.id).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
      setUnreadNotifs((c) => Math.max(0, c - 1));
    }
    setNotifOpen(false);

    if (notif.type === 'story_reply' && notif.from_player) {
      setChatInitialPeer(notif.from_player);
      setChatOpen(true);
      return;
    }

    if (notif.post_id) {
      try {
        const res = await api.getPost(notif.post_id);
        if (res.post) {
          setFocusedPost(res.post);
          return;
        }
      } catch {
        // fallback to profile
      }
    }

    if (notif.from_player) {
      handleOpenProfile(notif.from_player.username);
    }
  };

  // LOADING OR ERROR STATE
  if (bootState === 'error') {
    return (
      <>
        {splashPhase !== 'done' && <SplashScreen fadingOut={splashPhase === 'fading'} />}
        <div className="min-h-dvh flex justify-center" style={{ background: 'var(--nz-bg)', color: 'var(--nz-text)' }}>
          <div
            className="w-full max-w-[480px] min-h-dvh sm:border-x flex flex-col items-center justify-center gap-3 px-6 text-center"
            style={{ borderColor: 'var(--nz-border)' }}
          >
            <BrandLogo size="md" />
            <p className="text-[13px] max-w-[320px]" style={{ color: 'var(--nz-text-muted)' }}>
              {bootError || 'Gagal memuat aplikasi. Periksa koneksi kamu.'}
            </p>
            <div className="mt-1 flex items-center justify-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  autoRetryCountRef.current = 0;
                  bootstrap();
                }}
                className="h-9 px-4 rounded-full text-[12.5px] font-semibold inline-flex items-center justify-center gap-1.5 hover:opacity-90"
                style={{ background: 'var(--nz-btn-bg)', color: 'var(--nz-btn-text)' }}
              >
                <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Coba Lagi</span>
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="h-9 px-4 rounded-full text-[12.5px] font-semibold inline-flex items-center justify-center gap-1.5 border hover:opacity-90"
                style={{
                  background: 'var(--nz-elevated)',
                  borderColor: 'var(--nz-border)',
                  color: 'var(--nz-text)',
                }}
              >
                <span>Muat Ulang Halaman</span>
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (bootState === 'loading' || (bootState === 'ready' && !currentUser)) {
    return (
      <>
        {splashPhase !== 'done' && <SplashScreen fadingOut={splashPhase === 'fading'} />}
        <div className="min-h-dvh flex justify-center" style={{ background: 'var(--nz-bg)', color: 'var(--nz-text)' }}>
          <div
            className="w-full max-w-[480px] min-h-dvh sm:border-x flex flex-col items-center justify-center gap-3 px-6 text-center"
            style={{ borderColor: 'var(--nz-border)' }}
          >
            <BrandLogo size="md" />
            <span className="text-[12px]" style={{ color: 'var(--nz-text-muted)' }}>
              Memuat...
            </span>
            {slowLoading && (
              <button
                type="button"
                onClick={() => bootstrap(false)}
                className="mt-1 h-8 px-3.5 rounded-full text-[12px] font-semibold inline-flex items-center justify-center gap-1.5 border"
                style={{
                  background: 'var(--nz-elevated)',
                  borderColor: 'var(--nz-border)',
                  color: 'var(--nz-text)',
                }}
              >
                <RefreshCw className="w-3 h-3" strokeWidth={1.75} />
                <span>Muat Ulang</span>
              </button>
            )}
          </div>
        </div>
      </>
    );
  }

  // UNCONFIGURED SUPABASE SECRETS NOTICE
  if (bootState === 'unconfigured' || !currentUser) {
    return (
      <>
        {splashPhase !== 'done' && <SplashScreen fadingOut={splashPhase === 'fading'} />}
        <div className="min-h-dvh flex justify-center" style={{ background: 'var(--nz-bg)', color: 'var(--nz-text)' }}>
          <div
            className="w-full max-w-[480px] min-h-dvh sm:border-x flex flex-col"
            style={{ borderColor: 'var(--nz-border)' }}
          >
            <header
              className="h-[48px] px-4 border-b flex items-center justify-between"
              style={{ background: 'var(--nz-header-bg)', borderColor: 'var(--nz-border)' }}
            >
              <BrandLogo size="sm" />
            </header>
            <main className="flex-1 flex items-center justify-center p-6">
              <div
                className="w-full border rounded-[14px] p-5 flex flex-col gap-3"
                style={{ background: 'var(--nz-card)', borderColor: 'var(--nz-border)' }}
              >
                <div className="flex items-center gap-2.5" style={{ color: 'var(--nz-text)' }}>
                  <Database className="w-5 h-5" style={{ color: 'var(--nz-accent)' }} strokeWidth={1.5} />
                  <h1 className="font-display text-[16px] font-bold tracking-[-0.5px]">
                    Koneksi Supabase Diperlukan
                  </h1>
                </div>
                <p className="text-[13px] leading-[1.5]" style={{ color: 'var(--nz-text-muted)' }}>
                  Tambahkan variabel{' '}
                  <span className="font-medium" style={{ color: 'var(--nz-text)' }}>
                    {missingEnv.join(' & ') || 'SUPABASE_URL & SUPABASE_ANON_KEY'}
                  </span>{' '}
                  pada panel Secrets di Settings agar aplikasi terhubung ke database Supabase kamu.
                </p>
                <button
                  type="button"
                  onClick={() => bootstrap(false)}
                  className="mt-1 h-9 px-4 rounded-full text-[12.5px] font-semibold inline-flex items-center justify-center gap-1.5 self-start hover:opacity-90"
                  style={{ background: 'var(--nz-btn-bg)', color: 'var(--nz-btn-text)' }}
                >
                  <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>Coba Lagi</span>
                </button>
              </div>
            </main>
          </div>
        </div>
      </>
    );
  }

  const mustFollowOwner = Boolean(
    currentUser && !currentUser.is_owner && currentUser.follows_owner !== true
  );

  return (
    <BordersProvider playerId={currentUser.id}>
    {splashPhase !== 'done' && <SplashScreen fadingOut={splashPhase === 'fading'} />}
    {mustFollowOwner ? (
      <FollowOwnerGate
        currentUser={currentUser}
        ownerPlayer={ownerPlayer}
        onFollowedOwner={(resolvedOwner) => {
          setOwnerPlayer(resolvedOwner);
          setCurrentUser((prev) =>
            prev
              ? {
                  ...prev,
                  follows_owner: true,
                  following_count: (prev.following_count || 0) + 1,
                }
              : prev
          );
          Promise.allSettled([loadFeedAndStories(), loadNotificationsAndChats()]).catch(() => {});
        }}
      />
    ) : (
    <div className="min-h-dvh flex justify-center" style={{ background: 'var(--nz-bg)', color: 'var(--nz-text)' }}>
      <div
        className="w-full max-w-[480px] min-h-dvh sm:border-x flex flex-col relative"
        style={{ borderColor: 'var(--nz-border)' }}
      >
        {/* Clean 48px Header: NONGKRONG ZONE. left, Notif + Chat right */}
        <header
          className="sticky top-0 z-30 h-[48px] px-4 border-b flex items-center justify-between"
          style={{ background: 'var(--nz-header-bg)', borderColor: 'var(--nz-border)' }}
        >
          <button
            type="button"
            onClick={() => {
              setViewingUsername(null);
              setActiveTab('feed');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center"
            aria-label="NONGKRONG ZONE Beranda"
          >
            <BrandLogo size="sm" />
          </button>

          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => {
                setViewingUsername(null);
                setActiveTab('explore');
              }}
              className="relative min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors"
              style={{
                color: !viewingUsername && activeTab === 'explore' ? 'var(--nz-text)' : 'var(--nz-text-muted)',
              }}
              aria-label="Jelajah & Cari"
            >
              <Search className="w-[20px] h-[20px]" strokeWidth={1.5} />
            </button>

            <button
              type="button"
              onClick={() => {
                loadNotificationsAndChats();
                setNotifOpen(true);
              }}
              className="relative min-w-[42px] min-h-[42px] flex items-center justify-center transition-colors"
              style={{ color: 'var(--nz-text-muted)' }}
              aria-label="Notifikasi"
            >
              <Bell className="w-[20px] h-[20px]" strokeWidth={1.5} />
              {unreadNotifs > 0 && (
                <span
                  className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] px-1 rounded-full text-[10px] font-semibold flex items-center justify-center tabular-nums"
                  style={{ background: 'var(--nz-btn-bg)', color: 'var(--nz-btn-text)' }}
                >
                  {unreadNotifs > 99 ? '99+' : unreadNotifs}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setChatInitialPeer(null);
                setChatOpen(true);
              }}
              className="relative min-w-[42px] min-h-[42px] flex items-center justify-center transition-colors"
              style={{ color: 'var(--nz-text-muted)' }}
              aria-label="Obrolan"
            >
              <MessageCircle className="w-[20px] h-[20px]" strokeWidth={1.5} />
              {unreadChats > 0 && (
                <span
                  className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] px-1 rounded-full text-[10px] font-semibold flex items-center justify-center tabular-nums"
                  style={{ background: 'var(--nz-btn-bg)', color: 'var(--nz-btn-text)' }}
                >
                  {unreadChats > 99 ? '99+' : unreadChats}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Main Scroll Content */}
        <main className="flex-1">
          {viewingUsername ? (
            <ProfileView
              username={viewingUsername}
              currentUser={currentUser}
              onBack={() => setViewingUsername(null)}
              onOpenProfile={handleOpenProfile}
              onOpenChatWith={(peer) => {
                setChatInitialPeer(peer);
                setChatOpen(true);
              }}
              onCurrentUserUpdated={handleCurrentUserUpdated}
              onOwnerUnfollowed={handleOwnerUnfollowed}
              onOpenComments={setCommentsPost}
            />
          ) : activeTab === 'feed' ? (
            <div className="pb-20">
              <StoryBar
                currentUser={currentUser}
                storyGroups={storyGroups}
                onOpenStoryGroup={(idx) => setStoryViewerIndex(idx)}
                onCreateStory={() => setCreateMode('story')}
              />

              {loadingFeed && posts.length === 0 ? (
                <div className="py-16 text-center text-[13px]" style={{ color: 'var(--nz-text-muted)' }}>
                  Memuat postingan...
                </div>
              ) : posts.length === 0 ? (
                <div
                  className="py-24 flex flex-col items-center justify-center gap-2"
                  style={{ color: 'var(--nz-text-muted)' }}
                >
                  <Home className="w-6 h-6 opacity-70" strokeWidth={1.5} />
                  <p className="text-[13px]">Belum ada postingan</p>
                </div>
              ) : (
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUser={currentUser}
                    onOpenProfile={handleOpenProfile}
                    onToggleLike={handleToggleLike}
                    onOpenComments={setCommentsPost}
                    onRepost={handleRepost}
                    onDeletePost={handleDeletePost}
                    onBlockUser={handleBlockUser}
                  />
                ))
              )}
            </div>
          ) : activeTab === 'nobar' ? (
            <ComingSoonView
              mode="nobar"
              onBack={() => {
                setViewingUsername(null);
                setActiveTab('feed');
              }}
            />
          ) : activeTab === 'game' ? (
            <ComingSoonView
              mode="game"
              onBack={() => {
                setViewingUsername(null);
                setActiveTab('feed');
              }}
            />
          ) : activeTab === 'explore' ? (
            <ExploreView
              currentUser={currentUser}
              onOpenProfile={handleOpenProfile}
              onOpenComments={setCommentsPost}
            />
          ) : activeTab === 'borders' ? (
            <BordersView
              currentUser={currentUser}
              onBack={() => setActiveTab('profile')}
              onPlayerUpdated={(updated) => {
                setCurrentUser(updated);
                loadFeedAndStories();
              }}
            />
          ) : (
            <ProfileView
              username={currentUser.username}
              currentUser={currentUser}
              onOpenProfile={handleOpenProfile}
              onOpenChatWith={(peer) => {
                setChatInitialPeer(peer);
                setChatOpen(true);
              }}
              onCurrentUserUpdated={handleCurrentUserUpdated}
              onOwnerUnfollowed={handleOwnerUnfollowed}
              onOpenComments={setCommentsPost}
              onOpenBorders={() => {
                setViewingUsername(null);
                setActiveTab('borders');
              }}
            />
          )}
        </main>

        {/* Bottom Navigation Bar: Home | Nobar | Post (+) | Game | Profil */}
        <nav
          className="sticky bottom-0 z-30 border-t pb-safe"
          style={{ background: 'var(--nz-header-bg)', borderColor: 'var(--nz-border)' }}
        >
          <div className="grid grid-cols-5 h-[56px] items-center">
            <button
              type="button"
              onClick={() => {
                setViewingUsername(null);
                setActiveTab('feed');
              }}
              className="h-full flex flex-col items-center justify-center gap-0.5 transition-colors"
              style={{
                color: !viewingUsername && activeTab === 'feed' ? 'var(--nz-text)' : 'var(--nz-text-muted)',
              }}
              aria-label="Home"
            >
              <Home className="w-[21px] h-[21px]" strokeWidth={1.6} />
              <span className="text-[10px] font-semibold leading-none">Home</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewingUsername(null);
                setActiveTab('nobar');
              }}
              className="h-full flex flex-col items-center justify-center gap-0.5 transition-colors"
              style={{
                color: !viewingUsername && activeTab === 'nobar' ? 'var(--nz-text)' : 'var(--nz-text-muted)',
              }}
              aria-label="Nobar"
            >
              <Tv className="w-[21px] h-[21px]" strokeWidth={1.6} />
              <span className="text-[10px] font-semibold leading-none">Nobar</span>
            </button>

            <button
              type="button"
              onClick={() => setCreateMode('post')}
              className="h-full flex flex-col items-center justify-center gap-0.5 transition-colors"
              style={{ color: 'var(--nz-text-muted)' }}
              aria-label="Post"
            >
              <PlusSquare className="w-[22px] h-[22px]" strokeWidth={1.7} />
              <span className="text-[10px] font-semibold leading-none">Post</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewingUsername(null);
                setActiveTab('game');
              }}
              className="h-full flex flex-col items-center justify-center gap-0.5 transition-colors"
              style={{
                color: !viewingUsername && activeTab === 'game' ? 'var(--nz-text)' : 'var(--nz-text-muted)',
              }}
              aria-label="Game"
            >
              <Gamepad2 className="w-[22px] h-[22px]" strokeWidth={1.6} />
              <span className="text-[10px] font-semibold leading-none">Game</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewingUsername(null);
                setActiveTab('profile');
              }}
              className="h-full flex flex-col items-center justify-center gap-0.5 transition-colors"
              style={{
                color: !viewingUsername && activeTab === 'profile' ? 'var(--nz-text)' : 'var(--nz-text-muted)',
              }}
              aria-label="Profil"
            >
              <User className="w-[21px] h-[21px]" strokeWidth={1.6} />
              <span className="text-[10px] font-semibold leading-none">Profil</span>
            </button>
          </div>
        </nav>

        {/* Story Viewer Modal */}
        {storyViewerIndex !== null && storyGroups[storyViewerIndex] && (
          <StoryViewer
            storyGroups={storyGroups}
            initialGroupIndex={storyViewerIndex}
            currentUser={currentUser}
            onClose={() => {
              setStoryViewerIndex(null);
              loadFeedAndStories();
            }}
            onStoryDeleted={loadFeedAndStories}
            onOpenProfile={handleOpenProfile}
            onOpenDmChat={(peer) => {
              setChatInitialPeer(peer);
              setChatOpen(true);
            }}
          />
        )}

        {/* Comments Bottom Sheet */}
        <CommentsSheet
          post={commentsPost}
          currentUser={currentUser}
          onClose={() => setCommentsPost(null)}
          onOpenProfile={handleOpenProfile}
          onCommentsCountChange={(postId, count) => {
            setPosts((prev) =>
              prev.map((p) => (p.id === postId ? { ...p, comments_count: count } : p))
            );
          }}
        />

        {/* Create Post / Story Modal */}
        {createMode && (
          <CreateModal
            initialMode={createMode}
            currentUser={currentUser}
            allPlayers={allPlayers}
            onClose={() => setCreateMode(null)}
            onCreatedPost={loadFeedAndStories}
            onCreatedStory={loadFeedAndStories}
          />
        )}

        {/* Chat Overlay */}
        {chatOpen && (
          <ChatView
            currentUser={currentUser}
            allPlayers={allPlayers}
            initialDmPeer={chatInitialPeer}
            wsEvents={wsEvent}
            onClose={() => {
              setChatOpen(false);
              setChatInitialPeer(null);
              loadNotificationsAndChats();
            }}
            onOpenProfile={handleOpenProfile}
          />
        )}

        {/* Notifications Overlay */}
        {notifOpen && (
          <NotificationsView
            notifications={notifications}
            onClose={() => setNotifOpen(false)}
            onMarkAllRead={async () => {
              await api.markAllNotificationsRead();
              setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
              setUnreadNotifs(0);
            }}
            onSelectNotification={handleSelectNotification}
          />
        )}

        {/* Focused Post Modal (from notification click) */}
        {focusedPost && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
            <div
              className="w-full max-w-[480px] max-h-[90dvh] border rounded-[14px] flex flex-col overflow-hidden"
              style={{ background: 'var(--nz-modal-bg)', borderColor: 'var(--nz-border)' }}
            >
              <div
                className="h-11 px-4 border-b flex items-center justify-between shrink-0"
                style={{ borderColor: 'var(--nz-border)' }}
              >
                <span className="font-display text-[14px] font-bold" style={{ color: 'var(--nz-text)' }}>
                  Postingan
                </span>
                <button type="button" onClick={() => setFocusedPost(null)}>
                  <X className="w-5 h-5" style={{ color: 'var(--nz-text-muted)' }} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <PostCard
                  post={focusedPost}
                  currentUser={currentUser}
                  onOpenProfile={(u) => {
                    setFocusedPost(null);
                    handleOpenProfile(u);
                  }}
                  onToggleLike={async (p) => {
                    const res = await api.togglePostLike(p.id);
                    setFocusedPost((prev) =>
                      prev ? { ...prev, liked_by_me: res.liked, likes_count: res.likes_count } : null
                    );
                    setPosts((prev) =>
                      prev.map((item) =>
                        item.id === p.id
                          ? { ...item, liked_by_me: res.liked, likes_count: res.likes_count }
                          : item
                      )
                    );
                  }}
                  onOpenComments={(p) => {
                    setFocusedPost(null);
                    setCommentsPost(p);
                  }}
                  onRepost={handleRepost}
                  onDeletePost={async (id) => {
                    await handleDeletePost(id);
                    setFocusedPost(null);
                  }}
                  onBlockUser={async (target) => {
                    await handleBlockUser(target);
                    setFocusedPost(null);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    )}
    </BordersProvider>
  );
}
