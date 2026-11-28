import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  setGuestMode,
  setNoOwnerFallback,
} from './services/api';
import {
  buildGuestPlayerFromLocal,
  buildTelegramPlayerFromClient,
  initTelegramWebAppSafe,
  persistProfileEditsLocally,
  readTelegramClientAuthSafe,
  syncTelegramUserWithLocalProfile,
} from './services/telegramProfile';
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
  const [isTelegramMiniApp, setIsTelegramMiniApp] = useState(false);
  const isTelegramMiniAppRef = useRef(false);
  const [chromeBannerDismissed, setChromeBannerDismissed] = useState(false);

  // Feed & Stories
  const [posts, setPosts] = useState<Post[]>([]);
  const [repostCache, setRepostCache] = useState<Post[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [storyViewerIndex, setStoryViewerIndex] = useState<number | null>(null);
  const homePosts = useMemo(() => posts.filter((p) => !p.original_post_id), [posts]);
  const profileSeedPosts = useMemo(() => [...posts, ...repostCache], [posts, repostCache]);

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

  const openTransferModal = useCallback(
    (recipient?: Player | null) => {
      if (currentUser?.is_guest) {
        if (!isTelegramMiniApp) {
          showTransferToast({
            id: `tg-only-${Date.now()}`,
            kind: 'sent',
            text: 'Buka NONGKRONG ZONE lewat Bot Telegram untuk fitur ini.',
          });
        }
        return;
      }
      setTransferInitialRecipient(recipient ?? null);
      setTransferOpen(true);
    },
    [currentUser?.is_guest, isTelegramMiniApp, showTransferToast]
  );

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

  const [activitySyncVersion, setActivitySyncVersion] = useState(0);
  const feedInFlightRef = useRef(false);

  const loadFeedAndStories = useCallback(
    async (silent = false) => {
      if (silent && feedInFlightRef.current) return;
      feedInFlightRef.current = true;
      if (!silent) {
        setLoadingFeed(true);
      }
      try {
        const [postsRes, storiesRes, playersRes] = await Promise.all([
          api.getPosts(),
          api.getStories(),
          api.getPlayers(),
        ]);
        setPosts((postsRes.posts || []).filter((p) => !p.original_post_id));
        setStoryGroups(storiesRes.storyGroups);
        setAllPlayers(playersRes.players);
        loadOwnerPanelState();
      } catch {
        // Keep current visible feed/stories on transient background polling errors
      } finally {
        feedInFlightRef.current = false;
        if (!silent) {
          setLoadingFeed(false);
        }
      }
    },
    [loadOwnerPanelState]
  );

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
  const bootstrapInFlightRef = useRef(false);
  const lastBackgroundSyncRef = useRef(0);

  const extractTelegramAuth = useCallback((debug = false) => {
    return readTelegramClientAuthSafe({ debug });
  }, []);

  const enterGuestMode = useCallback(
    (insideTelegram = false) => {
      const guestPlayer = buildGuestPlayerFromLocal();
      resolvedByServerRef.current = true;
      autoRetryCountRef.current = 0;
      if (insideTelegram) {
        isTelegramMiniAppRef.current = true;
      }
      setIsTelegramMiniApp(insideTelegram || isTelegramMiniAppRef.current);
      setActivePlayerId(null);
      setActiveSessionToken(null);
      setNoOwnerFallback(true);
      setGuestMode(true);
      setOwnerPlayer(null);
      setCurrentUser(guestPlayer);
      setAllPlayers([guestPlayer]);
      setBootState('ready');
      loadFeedAndStories().catch(() => {});
    },
    [loadFeedAndStories]
  );

  const bootstrap = useCallback(
    async (backgroundRefresh = false) => {
      if (backgroundRefresh && bootstrapInFlightRef.current) return;
      bootstrapInFlightRef.current = true;
      if (!backgroundRefresh) {
        resolvedByServerRef.current = false;
        setActivePlayerId(null);
        setActiveSessionToken(null);
        setGuestMode(false);
        setBootState('loading');
        setBootError(null);
        setSlowLoading(false);
      }
      try {
        initTelegramWebAppSafe();
        let auth = extractTelegramAuth(true);
        let inTelegram = Boolean(auth.isTelegramEnv || isTelegramMiniAppRef.current);
        if (inTelegram) {
          isTelegramMiniAppRef.current = true;
          setIsTelegramMiniApp(true);
        }

        if (!auth.tgUser?.id && !auth.initData && !backgroundRefresh) {
          for (const waitMs of [150, 350]) {
            await new Promise((r) => setTimeout(r, waitMs));
            auth = extractTelegramAuth(true);
            if (auth.isTelegramEnv) {
              inTelegram = true;
              isTelegramMiniAppRef.current = true;
              setIsTelegramMiniApp(true);
            }
            if (auth.tgUser?.id || auth.initData) break;
          }
        }

        const isLocalHost =
          typeof window !== 'undefined' &&
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        const isFramed = typeof window !== 'undefined' && window.self !== window.top;
        const ref = typeof document !== 'undefined' ? document.referrer || '' : '';
        const isStudioFrame = isFramed && (!ref || /aistudio\.google|googleusercontent\.com|localhost/i.test(ref));
        const allowOwnerPreview = !inTelegram && (isLocalHost || isStudioFrame);
        setNoOwnerFallback(!allowOwnerPreview);

        const { initData, tgUser } = auth;
        const immediateTgPlayer = tgUser?.id ? buildTelegramPlayerFromClient(tgUser) : null;
        let prefetchedFeed = false;
        if (immediateTgPlayer) {
          setGuestMode(false);
          setCurrentUser(immediateTgPlayer);
          let hasCachedFollow = false;
          try {
            hasCachedFollow = localStorage.getItem(`nz_follows_owner_${tgUser!.id}`) === '1';
          } catch {
            hasCachedFollow = false;
          }
          if (immediateTgPlayer.is_owner || hasCachedFollow) {
            if (hasCachedFollow && !immediateTgPlayer.is_owner) {
              setCurrentUser({ ...immediateTgPlayer, follows_owner: true });
            }
            setBootState('ready');
            if (!backgroundRefresh) {
              prefetchedFeed = true;
              loadFeedAndStories(false).catch(() => {});
            }
          }
        }

        let meRes: {
          player: Player;
          sessionToken?: string;
          players: Player[];
          ownerPlayer?: Player | null;
        };

        if (tgUser?.id || initData) {
          isTelegramMiniAppRef.current = true;
          setIsTelegramMiniApp(true);
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
            try {
              meRes = await api.telegramLogin(payload);
            } catch (postErr: any) {
              if (
                postErr?.code === 'SUPABASE_NOT_CONFIGURED' ||
                postErr?.status === 401 ||
                postErr?.status === 400 ||
                postErr?.isSpaFallbackHtml
              ) {
                throw postErr;
              }
              meRes = await api.telegramLoginGet(payload);
            }
          } catch (loginErr: any) {
            if (immediateTgPlayer && loginErr?.code !== 'SUPABASE_NOT_CONFIGURED') {
              resolvedByServerRef.current = true;
              setGuestMode(false);
              setCurrentUser(immediateTgPlayer);
              setAllPlayers((prev) => (prev.length > 0 ? prev : [immediateTgPlayer]));
              setBootState('ready');
              loadFeedAndStories().catch(() => {});
              return;
            }
            throw loginErr;
          }
        } else if (allowOwnerPreview) {
          meRes = await api.getMe();
        } else {
          enterGuestMode(inTelegram);
          return;
        }

        resolvedByServerRef.current = true;
        autoRetryCountRef.current = 0;
        setGuestMode(false);
        setActivePlayerId(meRes.player.id);
        if (meRes.sessionToken) {
          setActiveSessionToken(meRes.sessionToken);
        }
        const tgHasUser = tgUser?.id
          ? Boolean(typeof tgUser?.username === 'string' && tgUser.username.trim())
          : undefined;
        let resolvedPlayer: Player = {
          ...meRes.player,
          has_telegram_username: meRes.player.has_telegram_username ?? tgHasUser ?? true,
        };

        if (tgUser?.id) {
          const synced = syncTelegramUserWithLocalProfile(tgUser, resolvedPlayer);
          resolvedPlayer = {
            ...resolvedPlayer,
            name: synced.resolvedName,
            full_name: synced.resolvedName,
            avatar_url: synced.resolvedAvatarUrl,
            username: synced.resolvedUsername,
            has_telegram_username: synced.hasTelegramUsername,
            is_guest: false,
          };
          if (synced.needsServerSync) {
            api
              .updateMe({
                full_name: synced.resolvedName,
                avatar_url: synced.resolvedAvatarUrl,
              })
              .catch(() => {});
          }
        }

        const resolvedOwner =
          meRes.ownerPlayer ||
          (meRes.players || []).find((p) => p.is_owner || p.telegram_id === 6189849073) ||
          null;
        if (resolvedPlayer.telegram_id && (resolvedPlayer.is_owner || resolvedPlayer.follows_owner === true)) {
          try {
            localStorage.setItem(`nz_follows_owner_${resolvedPlayer.telegram_id}`, '1');
          } catch {
            // ignore storage errors
          }
        }
        setOwnerPlayer(resolvedOwner);
        setCurrentUser(resolvedPlayer);
        setAllPlayers(meRes.players || [resolvedPlayer]);
        setBootState('ready');

        if (resolvedPlayer.is_owner || resolvedPlayer.follows_owner === true) {
          const tasks: Promise<any>[] = [loadNotificationsAndChats()];
          if (!prefetchedFeed) {
            tasks.unshift(loadFeedAndStories(backgroundRefresh));
          }
          Promise.allSettled(tasks).catch(() => {});
        }
      } catch (err: any) {
        const latestAuth = extractTelegramAuth(false);
        const insideTg = Boolean(latestAuth.isTelegramEnv || isTelegramMiniAppRef.current);
        if (latestAuth.tgUser?.id && err?.code !== 'SUPABASE_NOT_CONFIGURED') {
          const fallbackTgPlayer = buildTelegramPlayerFromClient(latestAuth.tgUser);
          resolvedByServerRef.current = true;
          setGuestMode(false);
          setIsTelegramMiniApp(true);
          isTelegramMiniAppRef.current = true;
          setCurrentUser(fallbackTgPlayer);
          setAllPlayers((prev) => (prev.length > 0 ? prev : [fallbackTgPlayer]));
          setBootState('ready');
          loadFeedAndStories().catch(() => {});
          return;
        }
        if (err?.code === 'SUPABASE_NOT_CONFIGURED') {
          resolvedByServerRef.current = true;
          setMissingEnv(['SUPABASE_URL', 'SUPABASE_ANON_KEY']);
          setBootState('unconfigured');
        } else if (err?.isSpaFallbackHtml) {
          try {
            const h = await api.health();
            if (!h.supabaseConfigured) {
              resolvedByServerRef.current = true;
              setMissingEnv(h.missing?.length ? h.missing : ['SUPABASE_URL', 'SUPABASE_ANON_KEY']);
              setBootState('unconfigured');
              return;
            }
            enterGuestMode(insideTg);
            return;
          } catch (healthErr: any) {
            if (healthErr?.isSpaFallbackHtml) {
              resolvedByServerRef.current = true;
              setBootState('static_host');
              return;
            }
            enterGuestMode(insideTg);
            return;
          }
        } else if (err?.code === 'TELEGRAM_AUTH_REQUIRED' || err?.status === 401) {
          enterGuestMode(insideTg);
        } else if (!backgroundRefresh) {
          enterGuestMode(insideTg);
        }
      } finally {
        bootstrapInFlightRef.current = false;
      }
    },
    [enterGuestMode, extractTelegramAuth, loadFeedAndStories, loadNotificationsAndChats]
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
    initTelegramWebAppSafe();
    const maxFade = setTimeout(() => setSplashPhase((p) => (p === 'showing' ? 'fading' : p)), 1050);
    const maxDone = setTimeout(() => setSplashPhase('done'), 1350);
    return () => {
      clearTimeout(maxFade);
      clearTimeout(maxDone);
    };
  }, []);

  useEffect(() => {
    if (bootState === 'loading' || splashPhase !== 'showing') return;
    const tFade = setTimeout(() => setSplashPhase('fading'), 450);
    const tDone = setTimeout(() => setSplashPhase('done'), 720);
    return () => {
      clearTimeout(tFade);
      clearTimeout(tDone);
    };
  }, [bootState, splashPhase]);

  useEffect(() => {
    bootstrap(false);
  }, [bootstrap]);

  // If still Guest, immediately check Telegram WebApp & promote if tgUser is available
  useEffect(() => {
    if (!currentUser?.is_guest) return;
    const immediateCheck = extractTelegramAuth(false);
    if (immediateCheck.tgUser?.id) {
      setIsTelegramMiniApp(true);
      isTelegramMiniAppRef.current = true;
      setGuestMode(false);
      setCurrentUser(buildTelegramPlayerFromClient(immediateCheck.tgUser));
      bootstrap(true);
      return;
    }

    let checks = 0;
    const timer = setInterval(() => {
      checks += 1;
      const lateAuth = extractTelegramAuth(false);
      if (lateAuth.isTelegramEnv && !isTelegramMiniApp) {
        isTelegramMiniAppRef.current = true;
        setIsTelegramMiniApp(true);
      }
      if (lateAuth.tgUser?.id || lateAuth.initData) {
        clearInterval(timer);
        if (lateAuth.tgUser?.id) {
          setGuestMode(false);
          setCurrentUser(buildTelegramPlayerFromClient(lateAuth.tgUser));
        }
        bootstrap(true);
      } else if (checks >= 20) {
        clearInterval(timer);
      }
    }, 500);
    return () => clearInterval(timer);
  }, [bootstrap, currentUser?.is_guest, extractTelegramAuth, isTelegramMiniApp]);

  // If Telegram user is temporarily on a non-UUID client fallback ID, retry server login in background
  useEffect(() => {
    if (!currentUser || currentUser.is_guest) return;
    const isRealUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      String(currentUser.id || '')
    );
    if (isRealUuid) return;
    const retryTimer = setInterval(() => {
      bootstrap(true);
    }, 4000);
    return () => clearInterval(retryTimer);
  }, [bootstrap, currentUser]);

  // Universal background sync & foreground resume sync across all phones/devices (works on Node, Cloud Run, & Vercel)
  useEffect(() => {
    if (bootState !== 'ready' || !currentUser || isStaticSpaHost()) return;
    const runSync = (force = false) => {
      const now = Date.now();
      if (!force && now - lastBackgroundSyncRef.current < 3500) return;
      lastBackgroundSyncRef.current = now;
      loadFeedAndStories(true);
      if (!currentUser.is_guest) {
        loadNotificationsAndChats();
      }
      setActivitySyncVersion((v) => v + 1);
    };
    const syncTimer = setInterval(() => runSync(true), 15000);
    const onFocusOrVisible = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      runSync(false);
    };
    window.addEventListener('focus', onFocusOrVisible);
    document.addEventListener('visibilitychange', onFocusOrVisible);
    return () => {
      clearInterval(syncTimer);
      window.removeEventListener('focus', onFocusOrVisible);
      document.removeEventListener('visibilitychange', onFocusOrVisible);
    };
  }, [bootState, currentUser, loadFeedAndStories, loadNotificationsAndChats]);

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
    if (!currentUser?.id || currentUser.is_guest || isStaticSpaHost()) return;
    const isRealUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      String(currentUser.id || '')
    );
    if (!isRealUuid) return;
    let closedByCleanup = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let wsOpened = false;
    let wsFailures = 0;

    const patchAuthorAcrossFeed = (updatedPlayer: Player) => {
      if (!updatedPlayer?.id) return;
      setAllPlayers((prev) => {
        const exists = prev.some((p) => p.id === updatedPlayer.id);
        return exists
          ? prev.map((p) => (p.id === updatedPlayer.id ? { ...p, ...updatedPlayer } : p))
          : [...prev, updatedPlayer];
      });
      setOwnerPlayer((prev) =>
        prev && prev.id === updatedPlayer.id ? { ...prev, ...updatedPlayer } : prev
      );
      setPosts((prev) =>
        prev.map((post) => {
          const nextPlayer =
            post.player && post.player.id === updatedPlayer.id
              ? { ...post.player, ...updatedPlayer }
              : post.player;
          const nextOrig =
            post.original_post && post.original_post.player?.id === updatedPlayer.id
              ? {
                  ...post.original_post,
                  player: { ...post.original_post.player, ...updatedPlayer },
                }
              : post.original_post;
          if (nextPlayer === post.player && nextOrig === post.original_post) return post;
          return { ...post, player: nextPlayer, original_post: nextOrig };
        })
      );
      setStoryGroups((prev) =>
        prev.map((g) =>
          g.player.id === updatedPlayer.id ? { ...g, player: { ...g.player, ...updatedPlayer } } : g
        )
      );
    };

    const connect = () => {
      if (closedByCleanup) return;
      try {
        const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ws = new WebSocket(`${proto}//${window.location.host}/ws?playerId=${currentUser.id}`);
        wsRef.current = ws;

        ws.onopen = () => {
          wsOpened = true;
          wsFailures = 0;
        };

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
              if (parsed.payload.original_post_id) {
                setRepostCache((prev) =>
                  prev.some((p) => p.id === parsed.payload.id) ? prev : [parsed.payload, ...prev]
                );
              } else {
                setPosts((prev) => {
                  if (prev.some((p) => p.id === parsed.payload.id)) return prev;
                  return [parsed.payload, ...prev];
                });
              }
              setActivitySyncVersion((v) => v + 1);
            } else if (parsed.event === 'post:deleted' && parsed.payload?.id) {
              setPosts((prev) => prev.filter((p) => p.id !== parsed.payload.id));
              setRepostCache((prev) => prev.filter((p) => p.id !== parsed.payload.id));
              setActivitySyncVersion((v) => v + 1);
            } else if (parsed.event === 'post:updated' && parsed.payload?.id) {
              setPosts((prev) =>
                prev.map((p) =>
                  p.id === parsed.payload.id
                    ? {
                        ...p,
                        ...(typeof parsed.payload.likes_count === 'number'
                          ? { likes_count: parsed.payload.likes_count }
                          : {}),
                        ...(typeof parsed.payload.comments_count === 'number'
                          ? { comments_count: parsed.payload.comments_count }
                          : {}),
                      }
                    : p
                )
              );
              setActivitySyncVersion((v) => v + 1);
            } else if (parsed.event === 'player:updated') {
              if (parsed.payload?.player) {
                patchAuthorAcrossFeed(parsed.payload.player);
              } else {
                loadFeedAndStories(true);
              }
              setActivitySyncVersion((v) => v + 1);
            } else if (parsed.event === 'story:updated') {
              loadFeedAndStories(true);
            }
          } catch {
            // ignore malformed ws message
          }
        };

        ws.onclose = () => {
          wsFailures += 1;
          if (!closedByCleanup && (wsOpened || wsFailures < 2)) {
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
  }, [currentUser?.id, currentUser?.is_guest, loadFeedAndStories, loadNotificationsAndChats, loadOwnerPanelState, showTransferToast]);

  // Direct Supabase Realtime subscription (live broadcasts, giveaways, posts, profiles, stories, likes, comments, chat across ALL devices)
  useEffect(() => {
    if (!currentUser?.id || isStaticSpaHost()) return;
    let cancelled = false;
    let activeChannel: any = null;
    let activeClient: any = null;
    let feedDebounceTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleFeedSync = () => {
      setActivitySyncVersion((v) => v + 1);
      if (feedDebounceTimer) clearTimeout(feedDebounceTimer);
      feedDebounceTimer = setTimeout(() => {
        loadFeedAndStories(true);
      }, 300);
    };

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
            { event: '*', schema: 'public', table: 'posts' },
            () => {
              scheduleFeedSync();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'stories' },
            () => {
              scheduleFeedSync();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'post_likes' },
            () => {
              scheduleFeedSync();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'post_comments' },
            () => {
              scheduleFeedSync();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'follows' },
            () => {
              setActivitySyncVersion((v) => v + 1);
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'players' },
            (payload: any) => {
              const row = payload?.new;
              if (row && row.id === currentUser.id) {
                const nextCoins = Number(row.balance ?? row.coins);
                setCurrentUser((prev) =>
                  prev
                    ? {
                        ...prev,
                        ...(row.border_id !== undefined ? { border_id: row.border_id } : {}),
                        ...(!prev.is_owner && Number.isFinite(nextCoins)
                          ? { coins: nextCoins, balance: nextCoins }
                          : {}),
                      }
                    : prev
                );
              }
              scheduleFeedSync();
            }
          );

        if (!currentUser.is_guest) {
          channel
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
              { event: 'INSERT', schema: 'public', table: 'messages' },
              (payload: any) => {
                const row = payload?.new;
                if (row && (row.receiver_id === currentUser.id || row.group_id)) {
                  loadNotificationsAndChats();
                  wsSeqRef.current += 1;
                  setWsEvent({ event: 'message:new', payload: row, seq: wsSeqRef.current });
                }
              }
            );
        }

        channel.subscribe();
        activeChannel = channel;
      })
      .catch(() => {
        // Polling still keeps data fresh if Realtime config is unavailable
      });

    return () => {
      cancelled = true;
      if (feedDebounceTimer) clearTimeout(feedDebounceTimer);
      if (activeClient && activeChannel) {
        activeClient.removeChannel(activeChannel);
      }
    };
  }, [currentUser?.id, currentUser?.is_guest, loadFeedAndStories, loadNotificationsAndChats, loadOwnerPanelState]);

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
    const merged: Player = {
      ...updated,
      has_telegram_username: updated.has_telegram_username ?? currentUser?.has_telegram_username,
      follows_owner: updated.follows_owner ?? currentUser?.follows_owner,
      is_guest: updated.is_guest ?? currentUser?.is_guest,
    };
    setCurrentUser(merged);
    persistProfileEditsLocally({
      player: merged,
      name: merged.name,
      avatar_url: merged.avatar_url,
      username: merged.username,
      bio: merged.bio || '',
    });
    if (!merged.is_guest) {
      setAllPlayers((prev) => prev.map((p) => (p.id === merged.id ? { ...p, ...merged } : p)));
      loadFeedAndStories();
    }
  };

  const requireTelegramToast = useCallback(() => {
    if (isTelegramMiniApp) {
      if (currentUser?.is_guest) {
        const check = extractTelegramAuth(true);
        if (check.tgUser?.id || check.initData) {
          bootstrap(true);
        }
      }
      return;
    }
    showTransferToast({
      id: `tg-only-${Date.now()}`,
      kind: 'sent',
      text: 'Buka NONGKRONG ZONE lewat Bot Telegram untuk fitur ini.',
    });
  }, [bootstrap, currentUser?.is_guest, extractTelegramAuth, isTelegramMiniApp, showTransferToast]);

  const handleToggleLike = async (post: Post) => {
    if (currentUser?.is_guest) {
      requireTelegramToast();
      return;
    }
    const res = await api.togglePostLike(post.id);
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id ? { ...p, liked_by_me: res.liked, likes_count: res.likes_count } : p
      )
    );
  };

  const handleRepost = async (origPost: Post, repostCaption: string) => {
    if (currentUser?.is_guest) {
      requireTelegramToast();
      return;
    }
    const res = await api.createPost({
      original_post_id: origPost.id,
      repost_caption: repostCaption || undefined,
      media_type: 'text',
    });
    if (res.post) {
      setRepostCache((prev) => (prev.some((p) => p.id === res.post.id) ? prev : [res.post, ...prev]));
    }
    setActivitySyncVersion((v) => v + 1);
    showTransferToast({
      id: `repost-${Date.now()}`,
      kind: 'sent',
      text: 'Berhasil direpost! Tersimpan di tab Repost profil kamu.',
    });
  };

  const handleDeletePost = async (postId: string) => {
    if (currentUser?.is_guest) {
      requireTelegramToast();
      return;
    }
    await api.deletePost(postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setRepostCache((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleBlockUser = async (target: Player) => {
    if (currentUser?.is_guest) {
      requireTelegramToast();
      return;
    }
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
        currentUser.telegram_id === 6189849073)
  );

  const mustFollowOwner = Boolean(
    currentUser && !currentUser.is_guest && !isCurrentUserOwner && currentUser.follows_owner !== true
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
                if (currentUser?.is_guest) {
                  requireTelegramToast();
                  return;
                }
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
                if (currentUser?.is_guest) {
                  requireTelegramToast();
                  return;
                }
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
              initialPosts={profileSeedPosts}
              knownPlayers={allPlayers}
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
              onRequireTelegram={requireTelegramToast}
              onPostCreatedOrReposted={(newPost) => {
                if (newPost?.original_post_id) {
                  setRepostCache((prev) => (prev.some((p) => p.id === newPost.id) ? prev : [newPost, ...prev]));
                } else if (newPost) {
                  setPosts((prev) => (prev.some((p) => p.id === newPost.id) ? prev : [newPost, ...prev]));
                }
                setActivitySyncVersion((v) => v + 1);
              }}
              onPostDeleted={(postId) => {
                setPosts((prev) => prev.filter((p) => p.id !== postId));
                setRepostCache((prev) => prev.filter((p) => p.id !== postId));
              }}
              syncVersion={activitySyncVersion}
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

              {/* Chrome-only Notice Banner (ALWAYS hidden inside Telegram Mini App) */}
              {!isTelegramMiniApp && currentUser.is_guest && !chromeBannerDismissed && (
                <div
                  className="mx-3 mt-1.5 mb-1 px-3.5 py-2.5 rounded-xl border flex items-center justify-between gap-2.5"
                  style={{
                    background: 'var(--nz-card)',
                    borderColor: 'var(--nz-accent)',
                    color: 'var(--nz-text)',
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Send className="w-4 h-4 shrink-0" style={{ color: 'var(--nz-accent-text)' }} strokeWidth={2} />
                    <p className="text-[12px] font-medium leading-snug">
                      Buka NONGKRONG ZONE lewat Bot Telegram untuk fitur ini.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setChromeBannerDismissed(true)}
                    className="p-1 shrink-0 hover:opacity-80"
                    style={{ color: 'var(--nz-text-muted)' }}
                    aria-label="Tutup banner"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

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
                  if (currentUser?.is_guest) {
                    requireTelegramToast();
                    return;
                  }
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
                onCreateStory={() => {
                  if (currentUser?.is_guest) {
                    requireTelegramToast();
                    return;
                  }
                  setCreateMode('story');
                }}
              />

              {loadingFeed && homePosts.length === 0 ? (
                <div className="py-16 text-center text-[13px]" style={{ color: 'var(--nz-text-muted)' }}>
                  Memuat postingan...
                </div>
              ) : homePosts.length === 0 ? (
                <div
                  className="py-24 flex flex-col items-center justify-center gap-2"
                  style={{ color: 'var(--nz-text-muted)' }}
                >
                  <Home className="w-6 h-6 opacity-70" strokeWidth={1.5} />
                  <p className="text-[13px]">Belum ada postingan</p>
                </div>
              ) : (
                homePosts.map((post) => (
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
              onRequireTelegram={requireTelegramToast}
              onReposted={(repost) => {
                if (repost) {
                  setRepostCache((prev) => (prev.some((p) => p.id === repost.id) ? prev : [repost, ...prev]));
                }
                setActivitySyncVersion((v) => v + 1);
                showTransferToast({
                  id: `repost-explore-${Date.now()}`,
                  kind: 'sent',
                  text: 'Berhasil direpost! Tersimpan di tab Repost profil kamu.',
                });
              }}
            />
          ) : activeTab === 'borders' ? (
            <BordersView
              currentUser={currentUser}
              onBack={() => setActiveTab('profile')}
              onPlayerUpdated={(updated) => {
                setCurrentUser(updated);
                loadFeedAndStories(true);
              }}
            />
          ) : (
            <ProfileView
              username={currentUser.username}
              currentUser={currentUser}
              initialPosts={profileSeedPosts}
              knownPlayers={allPlayers}
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
              onRequireTelegram={requireTelegramToast}
              onPostCreatedOrReposted={(newPost) => {
                if (newPost?.original_post_id) {
                  setRepostCache((prev) => (prev.some((p) => p.id === newPost.id) ? prev : [newPost, ...prev]));
                } else if (newPost) {
                  setPosts((prev) => (prev.some((p) => p.id === newPost.id) ? prev : [newPost, ...prev]));
                }
                setActivitySyncVersion((v) => v + 1);
              }}
              onPostDeleted={(postId) => {
                setPosts((prev) => prev.filter((p) => p.id !== postId));
                setRepostCache((prev) => prev.filter((p) => p.id !== postId));
              }}
              syncVersion={activitySyncVersion}
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
              onClick={() => {
                if (currentUser?.is_guest) {
                  requireTelegramToast();
                  return;
                }
                setCreateMode('post');
              }}
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
          onRequireTelegram={requireTelegramToast}
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
            onCreatedPost={(createdPost) => {
              if (createdPost && !createdPost.original_post_id) {
                setPosts((prev) =>
                  prev.some((p) => p.id === createdPost.id) ? prev : [createdPost, ...prev]
                );
                setActivitySyncVersion((v) => v + 1);
              }
              loadFeedAndStories(true);
            }}
            onCreatedStory={() => loadFeedAndStories(true)}
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
                  currentUser.role === 'owner' ||
                  currentUser.telegram_id === 6189849073
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
            onViewProfile={(username) => {
              setOwnerPanelOpen(false);
              handleOpenProfile(username);
            }}
            onTransferToUser={(player) => {
              setOwnerPanelOpen(false);
              openTransferModal(player);
            }}
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
