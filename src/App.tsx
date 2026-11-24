import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bell,
  Crown,
  Database,
  Gamepad2,
  Home,
  MessageCircle,
  PlusSquare,
  RefreshCw,
  Search,
  Send,
  Tv,
  User,
  X,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import type {
  Giveaway,
  NotificationItem,
  OwnerBroadcast,
  OwnerPanelStats,
  Player,
  Post,
  StoryGroup,
} from './types';
import {
  api,
  isStaticSpaHost,
  setActivePlayerId,
  setActiveSessionToken,
  setNoOwnerFallback,
} from './services/api';
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
import { TransferCoinModal } from './components/TransferCoinModal';
import { OwnerPanelModal } from './components/OwnerPanelModal';
import { HomeOwnerBanners } from './components/HomeOwnerBanners';
import { CoinDisplay } from './components/PlayerBadges';
import { Avatar } from './components/Avatar';
import { formatNumber } from './utils/format';

type Tab = 'feed' | 'nobar' | 'game' | 'explore' | 'borders' | 'profile';
type BootState = 'loading' | 'ready' | 'unconfigured' | 'telegram_required' | 'static_host' | 'error';

export default function App() {
  const [bootState, setBootState] = useState<BootState>('loading');
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
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferInitialRecipient, setTransferInitialRecipient] = useState<Player | null>(null);
  const [ownerPanelOpen, setOwnerPanelOpen] = useState(false);
  const [activeBroadcasts, setActiveBroadcasts] = useState<OwnerBroadcast[]>([]);
  const [ownerAllBroadcasts, setOwnerAllBroadcasts] = useState<OwnerBroadcast[]>([]);
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [ownerStats, setOwnerStats] = useState<OwnerPanelStats | null>(null);
  const [transferToast, setTransferToast] = useState<{
    id: string;
    kind: 'sent' | 'received';
    text: string;
    fromPlayer?: Player | null;
  } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownTransferNotifIdsRef = useRef<Set<string>>(new Set());
  const seenWsNotifIdsRef = useRef<Set<string>>(new Set());
  const initialNotifLoadedRef = useRef(false);

  const showTransferToast = useCallback(
    (toast: { id: string; kind: 'sent' | 'received'; text: string; fromPlayer?: Player | null }) => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setTransferToast(toast);
      toastTimerRef.current = setTimeout(() => {
        setTransferToast(null);
      }, 5000);
    },
    []
  );

  const openTransferModal = useCallback((recipient?: Player | null) => {
    setTransferInitialRecipient(recipient ?? null);
    setTransferOpen(true);
  }, []);

  // Notifications & Real-Time WebSocket
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadChats, setUnreadChats] = useState(0);
  const [wsEvent, setWsEvent] = useState<{ event: string; payload: any; seq: number } | null>(null);
  const wsSeqRef = useRef(0);
  const wsRef = useRef<WebSocket | null>(null);

  const loadOwnerPanelState = useCallback(async () => {
    try {
      const res = await api.getOwnerPanelState();
      setActiveBroadcasts(res.activeBroadcasts || []);
      if (Array.isArray(res.allBroadcasts)) {
        setOwnerAllBroadcasts(res.allBroadcasts);
      } else {
        setOwnerAllBroadcasts(res.activeBroadcasts || []);
      }
      setGiveaways(res.giveaways || []);
      if (res.stats !== undefined) {
        setOwnerStats(res.stats || null);
      }
    } catch {
      // Ignore background errors
    }
  }, []);

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
      loadOwnerPanelState();
    } finally {
      setLoadingFeed(false);
    }
  }, [loadOwnerPanelState]);

  const loadNotificationsAndChats = useCallback(async () => {
    try {
      const [notifRes, convRes] = await Promise.all([
        api.getNotifications(),
        api.getConversations(),
      ]);
      const isCoinNotif = (n: NotificationItem) =>
        n.type === 'transfer' || n.type === 'coin_drop' || n.title === 'Terima Coin';

      if (!initialNotifLoadedRef.current) {
        initialNotifLoadedRef.current = true;
        notifRes.notifications.forEach((n) => {
          seenWsNotifIdsRef.current.add(n.id);
          if (isCoinNotif(n)) {
            shownTransferNotifIdsRef.current.add(n.id);
          }
        });
      } else {
        const freshTransfer = notifRes.notifications.find(
          (n) =>
            isCoinNotif(n) &&
            !n.is_read &&
            !shownTransferNotifIdsRef.current.has(n.id)
        );
        if (freshTransfer) {
          shownTransferNotifIdsRef.current.add(freshTransfer.id);
          showTransferToast({
            id: freshTransfer.id,
            kind: 'received',
            text:
              freshTransfer.message ||
              freshTransfer.title ||
              `Kamu menerima coin dari @${freshTransfer.from_player?.username || 'pengguna'}`,
            fromPlayer: freshTransfer.from_player || null,
          });
          api
            .getMe()
            .then((meRes) => {
              if (meRes?.player) {
                setCurrentUser((prev) =>
                  prev && !prev.is_owner
                    ? {
                        ...prev,
                        coins: meRes.player.coins,
                        balance: meRes.player.balance ?? meRes.player.coins,
                      }
                    : prev
                );
              }
            })
            .catch(() => {});
        }
        notifRes.notifications.forEach((n) => seenWsNotifIdsRef.current.add(n.id));
      }
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
  }, [showTransferToast]);

  const [slowLoading, setSlowLoading] = useState(false);
  const autoRetryCountRef = useRef(0);
  const resolvedByServerRef = useRef(false);

  const extractTelegramAuth = useCallback(() => {
    const win = typeof window !== 'undefined' ? (window as any) : null;
    const tgWebApp = win?.Telegram?.WebApp;
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
        if (fromParams) {
          initData = fromParams;
        } else if (hashParams.get('user') || searchParams.get('user')) {
          initData = hashParams.get('user') ? hashRaw : window.location.search.replace(/^\?/, '');
        }
      } catch {
        // ignore url parse errors
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
        // ignore sessionStorage errors
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
          tgUser = JSON.parse(decodedUser);
        }
      } catch {
        // ignore user JSON parse errors
      }
    }

    const platform = String(tgWebApp?.platform || '').toLowerCase();
    const isTelegramEnv = Boolean(
      initData ||
        tgUser?.id ||
        (platform && platform !== 'unknown') ||
        win?.TelegramWebviewProxy ||
        (typeof navigator !== 'undefined' && /Telegram/i.test(navigator.userAgent)) ||
        (typeof window !== 'undefined' &&
          (window.location.hash.includes('tgWebAppData') ||
            window.location.search.includes('tgWebAppData')))
    );

    return { initData, tgUser, hasTgWebApp: Boolean(tgWebApp), isTelegramEnv };
  }, []);

  const bootstrap = useCallback(
    async (backgroundRefresh = false) => {
      if (!backgroundRefresh) {
        resolvedByServerRef.current = false;
        setActivePlayerId(null);
        setActiveSessionToken(null);
        setBootState('loading');
        setBootError(null);
        setSlowLoading(false);
      }
      try {
        let auth = extractTelegramAuth();
        if (auth.isTelegramEnv && !auth.tgUser?.id && !auth.initData) {
          for (let attempt = 0; attempt < 18; attempt += 1) {
            await new Promise((r) => setTimeout(r, 100));
            auth = extractTelegramAuth();
            if (auth.tgUser?.id || auth.initData) break;
          }
        }

        const isLocalHost =
          typeof window !== 'undefined' &&
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        const isFramed = typeof window !== 'undefined' && window.self !== window.top;
        const allowOwnerPreview = !auth.isTelegramEnv && (isLocalHost || isFramed);
        setNoOwnerFallback(!allowOwnerPreview);

        const { initData, tgUser } = auth;
        let meRes: {
          player: Player;
          sessionToken?: string;
          players: Player[];
          ownerPlayer?: Player | null;
        };

        if (tgUser?.id || initData) {
          const payload = {
            initData,
            ...(tgUser?.id
              ? {
                  user: {
                    id: Number(tgUser.id),
                    username: tgUser.username,
                    first_name: tgUser.first_name,
                    last_name: tgUser.last_name,
                    photo_url: tgUser.photo_url,
                  },
                }
              : {}),
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
        } else if (allowOwnerPreview) {
          meRes = await api.getMe();
        } else {
          resolvedByServerRef.current = true;
          setBootState('telegram_required');
          return;
        }

        resolvedByServerRef.current = true;
        autoRetryCountRef.current = 0;
        setActivePlayerId(meRes.player.id);
        if (meRes.sessionToken) {
          setActiveSessionToken(meRes.sessionToken);
        }
        const tgHasUser = tgUser?.id
          ? Boolean(typeof tgUser?.username === 'string' && tgUser.username.trim())
          : undefined;
        const resolvedPlayer: Player = {
          ...meRes.player,
          has_telegram_username: meRes.player.has_telegram_username ?? tgHasUser ?? true,
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
          Promise.allSettled([loadFeedAndStories(), loadNotificationsAndChats()]).catch(() => {});
        }
      } catch (err: any) {
        if (err?.code === 'SUPABASE_NOT_CONFIGURED') {
          resolvedByServerRef.current = true;
          setMissingEnv(['SUPABASE_URL', 'SUPABASE_ANON_KEY']);
          setBootState('unconfigured');
        } else if (err?.isSpaFallbackHtml) {
          resolvedByServerRef.current = true;
          setBootState('static_host');
        } else if (err?.code === 'TELEGRAM_AUTH_REQUIRED' || err?.status === 401) {
          resolvedByServerRef.current = true;
          setBootState('telegram_required');
        } else if (!backgroundRefresh) {
          setBootError(err?.message || 'Gagal terhubung ke server');
          setBootState('error');
        }
      }
    },
    [extractTelegramAuth, loadFeedAndStories, loadNotificationsAndChats]
  );

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

  // Show manual retry button if network takes unusually long (never fabricate a fake Owner account)
  useEffect(() => {
    if (bootState !== 'loading') return;
    const slowTimer = setTimeout(() => setSlowLoading(true), 4500);
    return () => {
      clearTimeout(slowTimer);
    };
  }, [bootState]);

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
              const notif = parsed.payload as NotificationItem;
              if (!seenWsNotifIdsRef.current.has(notif.id)) {
                seenWsNotifIdsRef.current.add(notif.id);
                setNotifications((prev) =>
                  prev.some((n) => n.id === notif.id) ? prev : [notif, ...prev]
                );
                setUnreadNotifs((c) => c + 1);
              }
              if (
                (notif.type === 'transfer' ||
                  notif.type === 'coin_drop' ||
                  notif.title === 'Terima Coin') &&
                !shownTransferNotifIdsRef.current.has(notif.id)
              ) {
                shownTransferNotifIdsRef.current.add(notif.id);
                showTransferToast({
                  id: notif.id,
                  kind: 'received',
                  text:
                    notif.message ||
                    notif.title ||
                    `Kamu menerima coin dari @${notif.from_player?.username || 'pengguna'}`,
                  fromPlayer: notif.from_player || null,
                });
              }
            } else if (parsed.event === 'coin:transfer_received' && parsed.payload) {
              const payload = parsed.payload;
              if (typeof payload.new_coins === 'number') {
                setCurrentUser((prev) =>
                  prev && !prev.is_owner
                    ? { ...prev, coins: payload.new_coins, balance: payload.new_coins }
                    : prev
                );
              }
              const dedupKey = payload.notification_id || `ws-transfer-${wsSeqRef.current}`;
              if (!shownTransferNotifIdsRef.current.has(dedupKey)) {
                shownTransferNotifIdsRef.current.add(dedupKey);
                showTransferToast({
                  id: dedupKey,
                  kind: 'received',
                  text:
                    payload.message ||
                    payload.title ||
                    `Kamu menerima ${formatNumber(payload.amount)} coin dari @${
                      payload.from_player?.username || 'pengguna'
                    }`,
                  fromPlayer: payload.from_player || null,
                });
              }
            } else if (parsed.event === 'owner_panel:updated') {
              loadOwnerPanelState();
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
    const pollTimer = setInterval(() => {
      loadNotificationsAndChats();
      loadOwnerPanelState();
    }, 15000);

    return () => {
      closedByCleanup = true;
      clearInterval(pollTimer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, [currentUser?.id, loadNotificationsAndChats, loadOwnerPanelState, showTransferToast]);

  // Direct Supabase Realtime subscription (live broadcasts, giveaways, notifications, & balance without refresh)
  useEffect(() => {
    if (!currentUser?.id || isStaticSpaHost()) return;
    let cancelled = false;
    let activeChannel: any = null;
    let activeClient: any = null;

    api
      .getRealtimeConfig()
      .then((cfg) => {
        if (cancelled || !cfg.enabled || !cfg.url || !cfg.anonKey) return;
        const sbClient = createClient(cfg.url, cfg.anonKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        activeClient = sbClient;
        const channel = sbClient
          .channel(`nz-live-${currentUser.id}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'broadcasts' },
            () => {
              loadOwnerPanelState();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'giveaways' },
            () => {
              loadOwnerPanelState();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'giveaway_claims' },
            () => {
              loadOwnerPanelState();
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${currentUser.id}`,
            },
            (payload: any) => {
              const row = payload?.new;
              if (row && !seenWsNotifIdsRef.current.has(row.id)) {
                loadNotificationsAndChats();
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'players',
              filter: `id=eq.${currentUser.id}`,
            },
            (payload: any) => {
              const row = payload?.new;
              if (!row) return;
              const nextCoins = Number(row.balance ?? row.coins);
              if (Number.isFinite(nextCoins)) {
                setCurrentUser((prev) =>
                  prev && !prev.is_owner ? { ...prev, coins: nextCoins, balance: nextCoins } : prev
                );
              }
            }
          )
          .subscribe();

        activeChannel = channel;
      })
      .catch(() => {
        // WS + polling still keep data fresh if Realtime config is unavailable
      });

    return () => {
      cancelled = true;
      if (activeClient && activeChannel) {
        activeClient.removeChannel(activeChannel);
      }
    };
  }, [currentUser?.id, loadNotificationsAndChats, loadOwnerPanelState]);

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
    setTransferOpen(false);
    setTransferInitialRecipient(null);
    setOwnerPanelOpen(false);
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

  // TELEGRAM LOGIN REQUIRED OR STATIC HOST NOTICE
  if (bootState === 'telegram_required' || bootState === 'static_host') {
    const isStatic = bootState === 'static_host';
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
                className="w-full border rounded-[16px] p-5 flex flex-col items-center text-center gap-3"
                style={{ background: 'var(--nz-card)', borderColor: 'var(--nz-border)' }}
              >
                <div
                  className="w-11 h-11 rounded-full border flex items-center justify-center"
                  style={{
                    background: 'var(--nz-elevated)',
                    borderColor: 'var(--nz-border)',
                    color: 'var(--nz-accent-text)',
                  }}
                >
                  {isStatic ? (
                    <Database className="w-5 h-5" strokeWidth={1.75} />
                  ) : (
                    <Send className="w-5 h-5" strokeWidth={1.75} />
                  )}
                </div>
                <h1 className="font-display text-[16px] font-bold tracking-[-0.4px]">
                  {isStatic ? 'Server API Belum Terhubung' : 'Buka Lewat Bot Telegram'}
                </h1>
                <p className="text-[13px] leading-[1.55] max-w-[330px]" style={{ color: 'var(--nz-text-muted)' }}>
                  {isStatic
                    ? 'URL Mini App saat ini mengarah ke hosting statis tanpa server API & Supabase. Gunakan URL server Node/Cloud Run yang aktif agar semua postingan & profil Telegram sinkron untuk semua pengguna.'
                    : 'Untuk memuat foto profil, nama, dan username sesuai akun Telegram kamu secara aman, buka NONGKRONG ZONE langsung melalui tombol Mini App di Bot Telegram.'}
                </p>
                <div className="mt-1 flex items-center justify-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => bootstrap(false)}
                    className="h-9 px-4 rounded-full text-[12.5px] font-semibold inline-flex items-center justify-center gap-1.5 hover:opacity-90"
                    style={{ background: 'var(--nz-btn-bg)', color: 'var(--nz-btn-text)' }}
                  >
                    <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span>Coba Lagi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="h-9 px-4 rounded-full border text-[12.5px] font-semibold inline-flex items-center justify-center gap-1.5 hover:opacity-90"
                    style={{
                      background: 'var(--nz-elevated)',
                      borderColor: 'var(--nz-border)',
                      color: 'var(--nz-text)',
                    }}
                  >
                    <span>Muat Ulang</span>
                  </button>
                </div>
              </div>
            </main>
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

  const isCurrentUserOwner = Boolean(
    currentUser &&
      (currentUser.is_owner ||
        currentUser.role === 'owner' ||
        currentUser.telegram_id === 6189849073 ||
        String(currentUser.username || '').toLowerCase() === 'afz')
  );

  const mustFollowOwner = Boolean(
    currentUser && !isCurrentUserOwner && currentUser.follows_owner !== true
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
              onOpenTransferCoin={openTransferModal}
            />
          ) : activeTab === 'feed' ? (
            <div className="pb-20">
              {/* Saldo & Transfer Coin Bar */}
              <div
                className="mx-3 mt-2.5 mb-1 px-3.5 py-2 rounded-xl border flex items-center justify-between gap-2"
                style={{ background: 'var(--nz-card)', borderColor: 'var(--nz-border)' }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[11.5px] font-semibold" style={{ color: 'var(--nz-text-muted)' }}>
                    Saldo
                  </span>
                  <CoinDisplay
                    coins={currentUser.balance ?? currentUser.coins}
                    isOwner={isCurrentUserOwner}
                  />
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {isCurrentUserOwner && (
                    <button
                      type="button"
                      onClick={() => {
                        loadOwnerPanelState();
                        setOwnerPanelOpen(true);
                      }}
                      className="h-8 px-2.5 rounded-full border border-[#D4AF37]/60 bg-[#D4AF37]/15 text-[#FFD60A] text-[11.5px] font-bold inline-flex items-center gap-1 hover:opacity-90 active:scale-[0.98] transition-all"
                    >
                      <Crown className="w-3.5 h-3.5 text-[#FFD60A]" strokeWidth={2} />
                      <span>Owner</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openTransferModal(null)}
                    className="h-8 px-3 rounded-full text-[12px] font-bold inline-flex items-center gap-1.5 hover:opacity-90 active:scale-[0.98] transition-all shrink-0"
                    style={{ background: 'var(--nz-btn-bg)', color: 'var(--nz-btn-text)' }}
                  >
                    <Send className="w-3.5 h-3.5" strokeWidth={2} />
                    <span>Transfer Coin</span>
                  </button>
                </div>
              </div>

              {/* Compact Owner Broadcasts & WIB Bagi-Bagi Coin */}
              <HomeOwnerBanners
                broadcasts={activeBroadcasts}
                giveaways={giveaways}
                isOwner={isCurrentUserOwner}
                onOpenOwnerPanel={() => {
                  loadOwnerPanelState();
                  setOwnerPanelOpen(true);
                }}
                onClaimGiveaway={async (giveawayId) => {
                  const res = await api.claimGiveaway(giveawayId);
                  setCurrentUser((prev) =>
                    prev && !prev.is_owner
                      ? { ...prev, coins: res.newCoins, balance: res.newCoins }
                      : prev
                  );
                  showTransferToast({
                    id: `claim-${giveawayId}-${Date.now()}`,
                    kind: 'received',
                    text: `Selamat! Kamu dapat +${formatNumber(res.amount)} coin dari Bagi-Bagi Coin!`,
                  });
                  await Promise.allSettled([loadOwnerPanelState(), loadNotificationsAndChats()]);
                }}
              />

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
              onOpenTransferCoin={openTransferModal}
              onOpenOwnerPanel={() => {
                loadOwnerPanelState();
                setOwnerPanelOpen(true);
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
        {/* Transfer Coin Modal */}
        {transferOpen && (
          <TransferCoinModal
            currentUser={currentUser}
            allPlayers={allPlayers}
            initialRecipient={transferInitialRecipient}
            onClose={() => {
              setTransferOpen(false);
              setTransferInitialRecipient(null);
            }}
            onTransferSuccess={({ senderCoins, recipient, amount }) => {
              const isSenderOwner = Boolean(
                currentUser.is_owner ||
                  currentUser.telegram_id === 6189849073 ||
                  String(currentUser.username || '').toLowerCase() === 'afz'
              );
              if (!isSenderOwner) {
                setCurrentUser((prev) => (prev ? { ...prev, coins: senderCoins } : prev));
              }
              setAllPlayers((prev) =>
                prev.map((p) => (p.id === recipient.id ? { ...p, coins: recipient.coins } : p))
              );
              setTransferOpen(false);
              setTransferInitialRecipient(null);
              showTransferToast({
                id: `sent-${Date.now()}`,
                kind: 'sent',
                text: `Berhasil kirim ${formatNumber(amount)} coin ke @${recipient.username}`,
              });
            }}
          />
        )}

        {/* Owner Panel Modal (Broadcast & Bagi-Bagi Coin WIB) */}
        {ownerPanelOpen && isCurrentUserOwner && (
          <OwnerPanelModal
            broadcasts={ownerAllBroadcasts}
            giveaways={giveaways}
            stats={ownerStats}
            onClose={() => setOwnerPanelOpen(false)}
            onStateChanged={loadOwnerPanelState}
          />
        )}

        {/* Real-time Coin Transfer Toast Popup */}
        {transferToast && (
          <div className="fixed top-[56px] left-1/2 -translate-x-1/2 z-50 w-[calc(100%-24px)] max-w-[456px] pointer-events-auto">
            <div
              className="px-3.5 py-2.5 rounded-xl border shadow-2xl flex items-center gap-2.5"
              style={{
                background: 'var(--nz-modal-bg)',
                borderColor: 'var(--nz-accent)',
                color: 'var(--nz-text)',
              }}
            >
              {transferToast.fromPlayer ? (
                <Avatar player={transferToast.fromPlayer} size={32} />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'var(--nz-btn-bg)', color: 'var(--nz-btn-text)' }}
                >
                  <Send className="w-4 h-4" strokeWidth={2} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-semibold leading-snug">{transferToast.text}</p>
              </div>
              <button
                type="button"
                onClick={() => setTransferToast(null)}
                className="p-1 shrink-0 hover:opacity-80"
                style={{ color: 'var(--nz-text-muted)' }}
                aria-label="Tutup notifikasi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    )}
    </BordersProvider>
  );
}
