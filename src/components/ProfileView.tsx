import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Award,
  Ban,
  Check,
  ChevronRight,
  Coins,
  Crown,
  Edit3,
  ImagePlus,
  LayoutGrid,
  Lock,
  MessageCircle,
  Palette,
  Repeat2,
  RotateCcw,
  Send,
  Shield,
  X,
} from 'lucide-react';
import type { Player, Post } from '../types';
import { api, uploadMediaFile } from '../services/api';
import { compressImageFileToDataUrl, persistProfileEditsLocally } from '../services/telegramProfile';
import { useBorders } from '../context/BordersContext';
import { THEMES, useTheme } from '../context/ThemeContext';
import { formatNumber, getInitials, sanitizeMediaUrl } from '../utils/format';
import { Avatar } from './Avatar';
import { CoinDisplay, OwnerBadge } from './PlayerBadges';
import { PostCard } from './PostCard';

interface ProfileViewProps {
  username: string;
  currentUser: Player;
  onBack?: () => void;
  onOpenProfile: (username: string) => void;
  onOpenChatWith: (peer: Player) => void;
  onCurrentUserUpdated: (updated: Player) => void;
  onOwnerUnfollowed?: () => void;
  onOpenComments: (post: Post) => void;
  onOpenBorders?: () => void;
  onOpenTransferCoin?: (initialRecipient?: Player | null) => void;
  onOpenOwnerPanel?: () => void;
  onRequireTelegram?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  username,
  currentUser,
  onBack,
  onOpenProfile,
  onOpenChatWith,
  onCurrentUserUpdated,
  onOwnerUnfollowed,
  onOpenComments,
  onOpenBorders,
  onOpenTransferCoin,
  onOpenOwnerPanel,
  onRequireTelegram,
}) => {
  const { bordersById } = useBorders();
  const { theme, setThemeId } = useTheme();
  const [profile, setProfile] = useState<Player | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals / Sheets
  const [unfollowConfirmOpen, setUnfollowConfirmOpen] = useState(false);
  const [followSheetMode, setFollowSheetMode] = useState<'followers' | 'following' | null>(null);
  const [followList, setFollowList] = useState<Player[]>([]);
  const [loadingFollowList, setLoadingFollowList] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editNotice, setEditNotice] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [blockedModalOpen, setBlockedModalOpen] = useState(false);
  const [blockedList, setBlockedList] = useState<Player[]>([]);

  const [themeSheetOpen, setThemeSheetOpen] = useState(false);
  const [profileContentTab, setProfileContentTab] = useState<'posts' | 'reposts'>('posts');
  const [sheetDragY, setSheetDragY] = useState(0);
  const dragStartYRef = useRef<number | null>(null);
  const [tgDebug, setTgDebug] = useState<{
    platform: string;
    hasInitData: boolean;
    user: unknown;
    url: string;
    userAgent: string;
    tickLabel: string;
  }>({
    platform: '-',
    hasInitData: false,
    user: null,
    url: '',
    userAgent: '',
    tickLabel: '0s',
  });

  const loadProfileData = async () => {
    const isOwnByUsername = username.toLowerCase() === currentUser.username.toLowerCase();
    if (currentUser.is_guest && isOwnByUsername) {
      setProfile(currentUser);
      setPosts([]);
      setLoading(false);
      return;
    }
    if (isOwnByUsername && !profile) {
      setProfile(currentUser);
      setLoading(false);
    } else if (!profile) {
      setLoading(true);
    }
    try {
      const pRes = await api.getPlayerProfile(username);
      const mergedProfile: Player = isOwnByUsername
        ? {
            ...pRes.player,
            has_telegram_username:
              pRes.player.has_telegram_username ?? currentUser.has_telegram_username,
          }
        : pRes.player;
      setProfile(mergedProfile);
      if (!mergedProfile.is_blocked_by_me && !mergedProfile.has_blocked_me) {
        const postsRes = await api.getPosts({ playerId: mergedProfile.id });
        setPosts(postsRes.posts);
      } else {
        setPosts([]);
      }
    } catch {
      if (isOwnByUsername) {
        setProfile(currentUser);
      } else {
        setProfile(null);
      }
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setProfileContentTab('posts');
  }, [username]);

  useEffect(() => {
    loadProfileData();
  }, [username, currentUser.id, currentUser.username, currentUser.avatar_url, currentUser.name, currentUser.border_id]);

  useEffect(() => {
    setProfile((prev) =>
      prev && prev.id === currentUser.id
        ? { ...prev, coins: currentUser.coins, is_owner: currentUser.is_owner }
        : prev
    );
  }, [currentUser.id, currentUser.coins, currentUser.is_owner]);

  useEffect(() => {
    const readSnapshot = (tickLabel: string) => {
      try {
        const win = typeof window !== 'undefined' ? (window as any) : null;
        const tgWebApp = win?.Telegram?.WebApp;
        const rawInitData = typeof tgWebApp?.initData === 'string' ? tgWebApp.initData : '';
        const rawUser = tgWebApp?.initDataUnsafe?.user ?? null;
        setTgDebug({
          platform: String(tgWebApp?.platform ?? 'tidak ada'),
          hasInitData: Boolean(rawInitData && rawInitData.trim().length > 0),
          user: rawUser && Object.keys(rawUser).length > 0 ? rawUser : null,
          url: typeof window !== 'undefined' ? window.location.href : '',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          tickLabel,
        });
      } catch {
        // Ignore Telegram debug read error
      }
    };

    readSnapshot('0s');
    const t1 = setTimeout(() => readSnapshot('1s'), 1000);
    const t2 = setTimeout(() => readSnapshot('2s'), 2000);
    const t3 = setTimeout(() => readSnapshot('3s'), 3000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const isMe = profile?.id === currentUser.id;

  const handleFollow = async () => {
    if (currentUser.is_guest) {
      onRequireTelegram?.();
      return;
    }
    if (!profile) return;
    await api.follow(profile.id);
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            is_following: true,
            followers_count: (prev.followers_count || 0) + 1,
          }
        : prev
    );
  };

  const handleConfirmUnfollow = async () => {
    if (currentUser.is_guest) {
      onRequireTelegram?.();
      return;
    }
    if (!profile) return;
    const res = await api.unfollow(profile.id);
    setUnfollowConfirmOpen(false);
    if (!currentUser.is_owner && (res.follows_owner === false || profile.is_owner || profile.telegram_id === 6189849073)) {
      onOwnerUnfollowed?.();
      return;
    }
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            is_following: false,
            followers_count: Math.max(0, (prev.followers_count || 1) - 1),
          }
        : prev
    );
  };

  const handleBlockToggle = async () => {
    if (currentUser.is_guest) {
      onRequireTelegram?.();
      return;
    }
    if (!profile) return;
    if (profile.is_blocked_by_me) {
      await api.unblock(profile.id);
      await loadProfileData();
    } else {
      const res = await api.block(profile.id);
      if (!currentUser.is_owner && (res.follows_owner === false || profile.is_owner || profile.telegram_id === 6189849073)) {
        onOwnerUnfollowed?.();
        return;
      }
      await loadProfileData();
    }
  };

  const openFollowSheet = async (mode: 'followers' | 'following') => {
    if (!profile) return;
    setFollowSheetMode(mode);
    setLoadingFollowList(true);
    try {
      const res =
        mode === 'followers'
          ? await api.getFollowers(profile.id)
          : await api.getFollowing(profile.id);
      setFollowList(res.players);
    } finally {
      setLoadingFollowList(false);
    }
  };

  const handleDirectUnfollowInList = async (target: Player) => {
    const res = await api.unfollow(target.id);
    if (!currentUser.is_owner && (res.follows_owner === false || target.is_owner || target.telegram_id === 6189849073)) {
      setFollowSheetMode(null);
      onOwnerUnfollowed?.();
      return;
    }
    setFollowList((prev) => prev.filter((p) => p.id !== target.id));
    if (isMe) {
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              following_count: Math.max(0, (prev.following_count || 1) - 1),
            }
          : prev
      );
    }
  };

  const handleToggleLike = async (post: Post) => {
    if (currentUser.is_guest) {
      onRequireTelegram?.();
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
    if (currentUser.is_guest) {
      onRequireTelegram?.();
      return;
    }
    await api.createPost({
      original_post_id: origPost.id,
      repost_caption: repostCaption || undefined,
      media_type: 'text',
    });
    loadProfileData();
  };

  const handleDeletePost = async (postId: string) => {
    await api.deletePost(postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setProfile((prev) =>
      prev ? { ...prev, posts_count: Math.max(0, (prev.posts_count || 1) - 1) } : prev
    );
  };

  const handleAvatarFileSelected = async (
    file: File,
    applyImmediately: boolean
  ): Promise<void> => {
    setUploadingAvatar(true);
    setEditNotice(null);
    try {
      let nextUrl = '';
      if (currentUser.is_guest) {
        nextUrl = await compressImageFileToDataUrl(file, 360);
      } else {
        try {
          const res = await uploadMediaFile(file);
          nextUrl = res.url;
        } catch {
          nextUrl = await compressImageFileToDataUrl(file, 360);
        }
      }
      setEditAvatar(nextUrl);
      if (applyImmediately && profile) {
        if (currentUser.is_guest) {
          const updatedGuest: Player = {
            ...currentUser,
            avatar_url: nextUrl || null,
          };
          persistProfileEditsLocally({
            player: updatedGuest,
            avatar_url: nextUrl || null,
            markAvatarEdited: true,
          });
          setProfile(updatedGuest);
          onCurrentUserUpdated(updatedGuest);
        } else {
          const res = await api.updateMe({ avatar_url: nextUrl || null });
          const updatedPlayer: Player = {
            ...res.player,
            has_telegram_username: res.player.has_telegram_username ?? profile.has_telegram_username,
          };
          persistProfileEditsLocally({
            player: updatedPlayer,
            avatar_url: updatedPlayer.avatar_url,
            markAvatarEdited: true,
          });
          setProfile(updatedPlayer);
          onCurrentUserUpdated(updatedPlayer);
        }
      }
    } catch (err: any) {
      setEditNotice(err?.message || 'Gagal mengunggah foto');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedName = editName.trim().slice(0, 20);
    if (!cleanedName) {
      setEditNotice('Nama tidak boleh kosong');
      return;
    }

    if (currentUser.is_guest) {
      const updatedGuest: Player = {
        ...currentUser,
        name: cleanedName,
        full_name: cleanedName,
        bio: editBio.trim().slice(0, 300),
        avatar_url: editAvatar || null,
      };
      persistProfileEditsLocally({
        player: updatedGuest,
        name: cleanedName,
        avatar_url: editAvatar || null,
        bio: updatedGuest.bio || '',
        markNameEdited: true,
        markAvatarEdited: (editAvatar || null) !== (profile?.avatar_url || null),
      });
      setProfile(updatedGuest);
      onCurrentUserUpdated(updatedGuest);
      setEditOpen(false);
      return;
    }

    const canEditUsername = profile?.has_telegram_username === false;
    let cleanedUsername: string | undefined;
    if (canEditUsername) {
      cleanedUsername = editUsername
        .trim()
        .replace(/^@/, '')
        .replace(/[^a-zA-Z0-9_]/g, '')
        .toLowerCase()
        .slice(0, 20);
      if (cleanedUsername.length < 3) {
        setEditNotice('Username minimal 3 karakter (huruf, angka, atau _)');
        return;
      }
    }

    setSavingEdit(true);
    setEditNotice(null);
    try {
      const res = await api.updateMe({
        full_name: cleanedName,
        ...(cleanedUsername !== undefined ? { username: cleanedUsername } : {}),
        bio: editBio,
        avatar_url: editAvatar || null,
      });
      const updatedPlayer: Player = {
        ...res.player,
        has_telegram_username: res.player.has_telegram_username ?? profile?.has_telegram_username,
      };
      persistProfileEditsLocally({
        player: updatedPlayer,
        name: updatedPlayer.name,
        avatar_url: updatedPlayer.avatar_url,
        username: updatedPlayer.username,
        bio: updatedPlayer.bio || '',
        markNameEdited: true,
        markAvatarEdited:
          (editAvatar || null) !== (profile?.telegram_avatar_url || null) ||
          (editAvatar || null) !== (profile?.avatar_url || null),
      });
      setProfile(updatedPlayer);
      onCurrentUserUpdated(updatedPlayer);
      setEditOpen(false);
    } catch (err: any) {
      setEditNotice(err?.message || 'Gagal menyimpan profil');
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-[13px]" style={{ color: 'var(--nz-text-muted)' }}>
        Memuat profil...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-16 text-center px-6">
        <p className="text-[13px]" style={{ color: 'var(--nz-text-muted)' }}>
          Pengguna tidak ditemukan
        </p>
      </div>
    );
  }

  const equippedBorderLabel = profile.border_id
    ? bordersById.get(String(profile.border_id))?.name || profile.border_id
    : profile.is_owner
      ? 'FAIZ GANTENG'
      : null;

  return (
    <div className="w-full pb-20">
      {/* Sub-header if viewing another user's profile */}
      {onBack && (
        <div
          className="h-11 px-2 border-b flex items-center gap-2"
          style={{ borderColor: 'var(--nz-border)', background: 'var(--nz-header-bg)' }}
        >
          <button
            type="button"
            onClick={onBack}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center"
            style={{ color: 'var(--nz-text)' }}
            aria-label="Kembali"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
          </button>
          <span
            className="font-display text-[15px] font-bold truncate"
            style={{ color: 'var(--nz-text)' }}
          >
            @{profile.username}
          </span>
        </div>
      )}

      {/* Compact 1-Row Tema Selector Bar at top of own profile */}
      {isMe && (
        <div className="px-4 pt-3">
          <button
            type="button"
            onClick={() => {
              setSheetDragY(0);
              setThemeSheetOpen(true);
            }}
            className="w-full h-10 px-3.5 rounded-[12px] border flex items-center justify-between gap-2 hover:opacity-90 active:scale-[0.99] transition-all"
            style={{ background: 'var(--nz-card)', borderColor: 'var(--nz-border)' }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Palette
                className="w-4 h-4 shrink-0"
                style={{ color: 'var(--nz-accent-text)' }}
                strokeWidth={1.75}
              />
              <span
                className="text-[12.5px] font-semibold truncate"
                style={{ color: 'var(--nz-text)' }}
              >
                Tema: {theme.name}
              </span>
            </div>
            <ChevronRight
              className="w-4 h-4 shrink-0"
              style={{ color: 'var(--nz-text-muted)' }}
              strokeWidth={1.75}
            />
          </button>
        </div>
      )}

      {/* Profile Header */}
      <div className="px-4 pt-5 pb-4 border-b" style={{ borderColor: 'var(--nz-border)' }}>
        <div className="flex items-start justify-between gap-4">
          <Avatar player={profile} size={72} />

          <div className="flex-1 grid grid-cols-3 gap-2 pt-2 text-center">
            <div>
              <div
                className="font-display text-[15px] font-bold tabular-nums"
                style={{ color: 'var(--nz-text)' }}
              >
                {formatNumber(profile.posts_count ?? posts.length)}
              </div>
              <div className="text-[11px]" style={{ color: 'var(--nz-text-muted)' }}>
                Postingan
              </div>
            </div>
            <button
              type="button"
              onClick={() => openFollowSheet('followers')}
              className="hover:opacity-80"
            >
              <div
                className="font-display text-[15px] font-bold tabular-nums"
                style={{ color: 'var(--nz-text)' }}
              >
                {formatNumber(profile.followers_count || 0)}
              </div>
              <div className="text-[11px]" style={{ color: 'var(--nz-text-muted)' }}>
                Pengikut
              </div>
            </button>
            <button
              type="button"
              onClick={() => openFollowSheet('following')}
              className="hover:opacity-80"
            >
              <div
                className="font-display text-[15px] font-bold tabular-nums"
                style={{ color: 'var(--nz-text)' }}
              >
                {formatNumber(profile.following_count || 0)}
              </div>
              <div className="text-[11px]" style={{ color: 'var(--nz-text-muted)' }}>
                Mengikuti
              </div>
            </button>
          </div>
        </div>

        {/* Name, Username, OWNER badge, Border ID, Coins */}
        <div className="mt-3.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h1
              className="font-display text-[17px] font-bold tracking-[-0.5px]"
              style={{ color: 'var(--nz-text)' }}
            >
              {profile.name}
            </h1>
            {profile.is_owner && <OwnerBadge />}
            {equippedBorderLabel && (
              <span
                className="text-[10px] font-semibold uppercase tracking-wider border px-2 py-0.5 rounded-[4px]"
                style={{ color: 'var(--nz-text-muted)', borderColor: 'var(--nz-border)' }}
              >
                {equippedBorderLabel}
              </span>
            )}
          </div>

          <div
            className="flex items-center gap-2.5 mt-0.5 text-[12.5px] flex-wrap"
            style={{ color: 'var(--nz-text-muted)' }}
          >
            <span>{profile.is_guest || profile.username === '-' ? '-' : `@${profile.username}`}</span>
            <span aria-hidden="true">·</span>
            <CoinDisplay
              coins={profile.balance ?? profile.coins}
              isOwner={Boolean(
                profile.is_owner ||
                  profile.role === 'owner' ||
                  profile.telegram_id === 6189849073 ||
                  String(profile.username || '').toLowerCase() === 'afz'
              )}
            />
            {isMe && !profile.is_guest && onOpenTransferCoin && (
              <button
                type="button"
                onClick={() => onOpenTransferCoin(null)}
                className="h-6 px-2.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1 hover:opacity-90 active:scale-[0.98] transition-all"
                style={{ background: 'var(--nz-btn-bg)', color: 'var(--nz-btn-text)' }}
              >
                <Send className="w-3 h-3" strokeWidth={2} />
                <span>Transfer Coin</span>
              </button>
            )}
          </div>

          {profile.bio && (
            <p
              className="mt-2 text-[13.5px] leading-[1.5] whitespace-pre-wrap"
              style={{ color: 'var(--nz-text-body)' }}
            >
              {profile.bio}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          {isMe ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setEditName((profile.full_name || profile.name || '').slice(0, 20));
                  setEditUsername(profile.username || '');
                  setEditBio(profile.bio || '');
                  setEditAvatar(profile.avatar_url || '');
                  setEditNotice(null);
                  setEditOpen(true);
                }}
                className="h-8 px-3.5 rounded-full border text-[12px] font-semibold flex items-center gap-1.5 hover:opacity-90"
                style={{
                  background: 'var(--nz-card)',
                  borderColor: 'var(--nz-border)',
                  color: 'var(--nz-text)',
                }}
              >
                <Edit3 className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Edit Profil</span>
              </button>

              <label
                className="h-8 px-3.5 rounded-full border text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer hover:opacity-90"
                style={{
                  background: 'var(--nz-card)',
                  borderColor: 'var(--nz-border)',
                  color: 'var(--nz-text)',
                }}
              >
                <ImagePlus className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>{uploadingAvatar ? 'Mengunggah...' : 'Ganti Foto'}</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingAvatar}
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    e.target.value = '';
                    if (!f) return;
                    await handleAvatarFileSelected(f, true);
                  }}
                />
              </label>

              {!profile.is_guest && onOpenBorders && (
                <button
                  type="button"
                  onClick={onOpenBorders}
                  className="h-8 px-3.5 rounded-full text-[12px] font-semibold flex items-center gap-1.5 hover:opacity-90"
                  style={{ background: 'var(--nz-btn-bg)', color: 'var(--nz-btn-text)' }}
                >
                  <Award className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>Border</span>
                </button>
              )}

              {!profile.is_guest && onOpenTransferCoin && (
                <button
                  type="button"
                  onClick={() => onOpenTransferCoin(null)}
                  className="h-8 px-3.5 rounded-full border text-[12px] font-semibold flex items-center gap-1.5 hover:opacity-90"
                  style={{
                    background: 'var(--nz-card)',
                    borderColor: 'var(--nz-border)',
                    color: 'var(--nz-accent-text)',
                  }}
                >
                  <Send className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>Transfer Coin</span>
                </button>
              )}

              {!profile.is_guest &&
                onOpenOwnerPanel &&
                Boolean(
                  profile.is_owner ||
                    profile.role === 'owner' ||
                    profile.telegram_id === 6189849073 ||
                    String(profile.username || '').toLowerCase() === 'afz'
                ) && (
                  <button
                    type="button"
                    onClick={onOpenOwnerPanel}
                    className="h-8 px-3.5 rounded-full border border-[#D4AF37]/60 bg-[#D4AF37]/15 text-[#FFD60A] text-[12px] font-bold flex items-center gap-1.5 hover:opacity-90"
                  >
                    <Crown className="w-3.5 h-3.5 text-[#FFD60A]" strokeWidth={2} />
                    <span>Panel Owner</span>
                  </button>
                )}

              {!profile.is_guest && (
                <button
                  type="button"
                  onClick={async () => {
                    const res = await api.getBlockedPlayers();
                    setBlockedList(res.players);
                    setBlockedModalOpen(true);
                  }}
                  className="h-8 px-3.5 rounded-full border text-[12px] font-semibold flex items-center gap-1.5 hover:opacity-90"
                  style={{
                    background: 'var(--nz-card)',
                    borderColor: 'var(--nz-border)',
                    color: 'var(--nz-text-muted)',
                  }}
                >
                  <Shield className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>Diblokir</span>
                </button>
              )}
            </>
          ) : (
            <>
              {!profile.is_blocked_by_me && !profile.has_blocked_me && (
                <>
                  {profile.is_following ? (
                    <button
                      type="button"
                      onClick={() => setUnfollowConfirmOpen(true)}
                      className="h-[28px] px-[14px] rounded-full border text-[12px] font-semibold transition-colors"
                      style={{
                        background: 'var(--nz-card)',
                        borderColor: 'var(--nz-border)',
                        color: 'var(--nz-text-muted)',
                      }}
                    >
                      Mengikuti
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleFollow}
                      className="h-[28px] px-[14px] rounded-full text-[12px] font-semibold hover:opacity-90 transition-opacity"
                      style={{ background: 'var(--nz-btn-bg)', color: 'var(--nz-btn-text)' }}
                    >
                      Ikuti
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (currentUser.is_guest) {
                        onRequireTelegram?.();
                        return;
                      }
                      onOpenChatWith(profile);
                    }}
                    className="h-[28px] px-[14px] rounded-full border text-[12px] font-semibold flex items-center gap-1.5"
                    style={{
                      background: 'var(--nz-card)',
                      borderColor: 'var(--nz-border)',
                      color: 'var(--nz-text)',
                    }}
                  >
                    <MessageCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span>Pesan</span>
                  </button>

                  {onOpenTransferCoin && (
                    <button
                      type="button"
                      onClick={() => onOpenTransferCoin(profile)}
                      className="h-[28px] px-[14px] rounded-full text-[12px] font-semibold flex items-center gap-1.5 hover:opacity-90"
                      style={{
                        background: 'var(--nz-btn-bg)',
                        color: 'var(--nz-btn-text)',
                      }}
                    >
                      <Send className="w-3.5 h-3.5" strokeWidth={1.75} />
                      <span>Transfer Coin</span>
                    </button>
                  )}
                </>
              )}

              <button
                type="button"
                onClick={handleBlockToggle}
                className="h-[28px] px-[12px] rounded-full bg-transparent text-[#FF453A] text-[12px] font-semibold flex items-center gap-1 hover:bg-[#FF453A]/10"
              >
                <Ban className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>{profile.is_blocked_by_me ? 'Buka Blokir' : 'Blokir'}</span>
              </button>
            </>
          )}
        </div>

        {/* Temporary Debug Telegram Box (only on own profile) */}
        {isMe && (
          <div
            className="mt-3 rounded-[10px] border p-2.5 text-[11px] leading-[1.45] font-mono break-all"
            style={{
              background: 'var(--nz-elevated)',
              borderColor: 'var(--nz-border)',
              color: 'var(--nz-text)',
            }}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="font-sans text-[11px] font-bold tracking-wide uppercase" style={{ color: 'var(--nz-accent-text)' }}>
                DEBUG TELEGRAM
              </span>
              <span className="text-[10px]" style={{ color: 'var(--nz-text-muted)' }}>
                update: {tgDebug.tickLabel}
              </span>
            </div>
            <div className="space-y-1">
              <div>
                <span style={{ color: 'var(--nz-text-muted)' }}>platform: </span>
                <span>{tgDebug.platform}</span>
              </div>
              <div>
                <span style={{ color: 'var(--nz-text-muted)' }}>initData: </span>
                <span>{tgDebug.hasInitData ? 'ada' : 'tidak ada'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--nz-text-muted)' }}>user: </span>
                {tgDebug.user ? (
                  <pre className="mt-1 p-1.5 rounded bg-black/40 text-[10.5px] whitespace-pre-wrap break-all overflow-x-auto">
                    {JSON.stringify(tgDebug.user, null, 2)}
                  </pre>
                ) : (
                  <span className="font-sans font-bold text-[#FF453A]">
                    USER KOSONG - Telegram tidak mengirim data
                  </span>
                )}
              </div>
              <div>
                <span style={{ color: 'var(--nz-text-muted)' }}>URL: </span>
                <span>{tgDebug.url}</span>
              </div>
              <div>
                <span style={{ color: 'var(--nz-text-muted)' }}>userAgent: </span>
                <span>{tgDebug.userAgent}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs: Postingan & Repost */}
      {!profile.is_blocked_by_me && !profile.has_blocked_me && (
        <div className="grid grid-cols-2 border-b" style={{ borderColor: 'var(--nz-border)' }}>
          <button
            type="button"
            onClick={() => setProfileContentTab('posts')}
            className="h-11 flex items-center justify-center gap-1.5 text-[12.5px] font-semibold relative transition-colors"
            style={{
              color: profileContentTab === 'posts' ? 'var(--nz-text)' : 'var(--nz-text-muted)',
            }}
          >
            <LayoutGrid className="w-4 h-4" strokeWidth={1.75} />
            <span>Postingan</span>
            <span className="text-[11px] opacity-75 tabular-nums">
              ({formatNumber(posts.filter((p) => !p.original_post_id).length)})
            </span>
            {profileContentTab === 'posts' && (
              <span
                className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full"
                style={{ background: 'var(--nz-btn-bg)' }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setProfileContentTab('reposts')}
            className="h-11 flex items-center justify-center gap-1.5 text-[12.5px] font-semibold relative transition-colors"
            style={{
              color: profileContentTab === 'reposts' ? 'var(--nz-text)' : 'var(--nz-text-muted)',
            }}
          >
            <Repeat2 className="w-4 h-4" strokeWidth={1.75} />
            <span>Repost</span>
            <span className="text-[11px] opacity-75 tabular-nums">
              ({formatNumber(posts.filter((p) => Boolean(p.original_post_id)).length)})
            </span>
            {profileContentTab === 'reposts' && (
              <span
                className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full"
                style={{ background: 'var(--nz-btn-bg)' }}
              />
            )}
          </button>
        </div>
      )}

      {/* Posts / Reposts Feed of this user */}
      {(() => {
        const displayedPosts =
          profileContentTab === 'reposts'
            ? posts.filter((p) => Boolean(p.original_post_id))
            : posts.filter((p) => !p.original_post_id);

        if (profile.is_blocked_by_me || profile.has_blocked_me) {
          return (
            <div className="py-16 text-center px-6 text-[13px]" style={{ color: 'var(--nz-text-muted)' }}>
              Postingan disembunyikan karena pengguna ini diblokir.
            </div>
          );
        }

        if (displayedPosts.length === 0) {
          return (
            <div
              className="py-16 flex flex-col items-center justify-center gap-2 text-center text-[13px]"
              style={{ color: 'var(--nz-text-muted)' }}
            >
              {profileContentTab === 'reposts' ? (
                <>
                  <Repeat2 className="w-5 h-5 opacity-70" strokeWidth={1.6} />
                  <span>Belum ada repost</span>
                </>
              ) : (
                <span>Belum ada postingan</span>
              )}
            </div>
          );
        }

        return displayedPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentUser={currentUser}
            onOpenProfile={onOpenProfile}
            onToggleLike={handleToggleLike}
            onOpenComments={onOpenComments}
            onRepost={handleRepost}
            onDeletePost={handleDeletePost}
            onBlockUser={async (target) => {
              const res = await api.block(target.id);
              if (
                !currentUser.is_owner &&
                (res.follows_owner === false || target.is_owner || target.telegram_id === 6189849073)
              ) {
                onOwnerUnfollowed?.();
                return;
              }
              loadProfileData();
            }}
          />
        ));
      })()}

      {/* Unfollow Confirmation Dialog */}
      {unfollowConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div
            className="w-full max-w-[340px] border rounded-[14px] p-4 flex flex-col gap-3"
            style={{ background: 'var(--nz-modal-bg)', borderColor: 'var(--nz-border)' }}
          >
            <h3 className="font-display text-[15px] font-bold" style={{ color: 'var(--nz-text)' }}>
              Berhenti Mengikuti @{profile.username}?
            </h3>
            <p className="text-[13px]" style={{ color: 'var(--nz-text-muted)' }}>
              Kamu bisa mengikuti kembali kapan saja.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setUnfollowConfirmOpen(false)}
                className="h-9 px-4 rounded-[10px] text-[12.5px]"
                style={{ color: 'var(--nz-text-muted)' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmUnfollow}
                className="h-9 px-4 rounded-[10px] text-[12.5px] font-semibold text-[#FF453A] hover:bg-[#FF453A]/10"
              >
                Ya, Unfollow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Followers / Following Sheet */}
      {followSheetMode && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-end justify-center">
          <div
            className="w-full max-w-[480px] max-h-[70dvh] border-t rounded-t-[16px] flex flex-col"
            style={{ background: 'var(--nz-modal-bg)', borderColor: 'var(--nz-border)' }}
          >
            <div
              className="px-4 h-12 border-b flex items-center justify-between"
              style={{ borderColor: 'var(--nz-border)' }}
            >
              <span className="font-display text-[14px] font-bold" style={{ color: 'var(--nz-text)' }}>
                {followSheetMode === 'followers' ? 'Pengikut' : 'Mengikuti'}
              </span>
              <button type="button" onClick={() => setFollowSheetMode(null)}>
                <X className="w-5 h-5" style={{ color: 'var(--nz-text-muted)' }} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4">
              {loadingFollowList ? (
                <div className="py-12 text-center text-[13px]" style={{ color: 'var(--nz-text-muted)' }}>
                  Memuat...
                </div>
              ) : followList.length === 0 ? (
                <div className="py-12 text-center text-[13px]" style={{ color: 'var(--nz-text-muted)' }}>
                  Belum ada
                </div>
              ) : (
                followList.map((u) => (
                  <div
                    key={u.id}
                    className="py-3 flex items-center justify-between gap-3 border-b last:border-b-0"
                    style={{ borderColor: 'var(--nz-border)' }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setFollowSheetMode(null);
                        onOpenProfile(u.username);
                      }}
                      className="flex items-center gap-2.5 min-w-0 text-left"
                    >
                      <Avatar player={u} size={36} />
                      <div className="min-w-0">
                        <div
                          className="text-[13.5px] font-semibold truncate"
                          style={{ color: 'var(--nz-text)' }}
                        >
                          {u.name}
                        </div>
                        <div className="text-[12px] truncate" style={{ color: 'var(--nz-text-muted)' }}>
                          @{u.username}
                        </div>
                      </div>
                    </button>

                    {isMe && followSheetMode === 'following' && (
                      <button
                        type="button"
                        onClick={() => handleDirectUnfollowInList(u)}
                        className="h-7 px-3 rounded-full border text-[12px] text-[#FF453A] font-medium flex items-center gap-1 shrink-0 hover:bg-[#FF453A]/10"
                        style={{ background: 'var(--nz-elevated)', borderColor: 'var(--nz-border)' }}
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Unfollow</span>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-end sm:items-center justify-center">
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-[480px] max-h-[90dvh] overflow-y-auto border rounded-t-[16px] sm:rounded-[16px] p-4 flex flex-col gap-3.5"
            style={{ background: 'var(--nz-modal-bg)', borderColor: 'var(--nz-border)' }}
          >
            <div
              className="flex items-center justify-between pb-2 border-b"
              style={{ borderColor: 'var(--nz-border)' }}
            >
              <span className="font-display text-[15px] font-bold" style={{ color: 'var(--nz-text)' }}>
                Edit Profil
              </span>
              <button type="button" onClick={() => setEditOpen(false)}>
                <X className="w-5 h-5" style={{ color: 'var(--nz-text-muted)' }} />
              </button>
            </div>

            {/* Foto Profil Preview + Upload dari Galeri + Balikin ke Foto Telegram */}
            <div className="flex flex-col gap-2 text-[12px]" style={{ color: 'var(--nz-text-muted)' }}>
              <span>Foto Profil</span>
              <div className="flex items-center gap-3">
                <div
                  className="w-16 h-16 rounded-full border overflow-hidden bg-[#0E0E11] flex items-center justify-center shrink-0"
                  style={{ borderColor: 'var(--nz-border)' }}
                >
                  {sanitizeMediaUrl(editAvatar) ? (
                    <img
                      src={sanitizeMediaUrl(editAvatar)!}
                      alt="Preview foto profil"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-display text-base font-bold text-[#F4F4F5]">
                      {getInitials(editName || profile.name)}
                    </span>
                  )}
                </div>

                <div className="flex-1 flex flex-col gap-2">
                  <label
                    className="h-9 px-3 rounded-[10px] border text-[12px] font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-90"
                    style={{
                      background: 'var(--nz-elevated)',
                      borderColor: 'var(--nz-border)',
                      color: 'var(--nz-text)',
                    }}
                  >
                    <ImagePlus className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span>{uploadingAvatar ? 'Mengunggah foto...' : 'Ganti Foto'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingAvatar}
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        e.target.value = '';
                        if (!f) return;
                        await handleAvatarFileSelected(f, false);
                      }}
                    />
                  </label>

                  {!profile.is_guest && (
                    <button
                      type="button"
                      onClick={() => {
                        const tgPhoto = profile.telegram_avatar_url || '';
                        setEditAvatar(tgPhoto);
                        setEditNotice(
                          tgPhoto
                            ? 'Foto dikembalikan ke foto Telegram asli. Tekan Simpan untuk menerapkan.'
                            : 'Foto Telegram asli tidak tersedia, foto direset ke default.'
                        );
                      }}
                      className="h-8 px-3 rounded-[10px] border text-[11.5px] font-medium inline-flex items-center justify-center gap-1.5 hover:opacity-90"
                      style={{
                        background: 'var(--nz-card)',
                        borderColor: 'var(--nz-border)',
                        color: 'var(--nz-text-muted)',
                      }}
                    >
                      <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} />
                      <span>Balikin ke Foto Telegram</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Nama / full_name (max 20 huruf) */}
            <label className="flex flex-col gap-1 text-[12px]" style={{ color: 'var(--nz-text-muted)' }}>
              <div className="flex items-center justify-between">
                <span>Nama</span>
                <span className="tabular-nums text-[11px]">{editName.length}/20</span>
              </div>
              <input
                type="text"
                value={editName}
                maxLength={20}
                onChange={(e) => setEditName(e.target.value.slice(0, 20))}
                required
                placeholder="Nama tampilan (maks. 20 huruf)"
                className="border rounded-[10px] px-3 py-2 text-[13px] focus:outline-none"
                style={{
                  background: 'var(--nz-elevated)',
                  borderColor: 'var(--nz-border)',
                  color: 'var(--nz-text)',
                }}
              />
            </label>

            {/* Username: editable jika Telegram tidak punya username, terkunci jika punya username Telegram atau mode Guest */}
            {!profile.is_guest && profile.has_telegram_username === false ? (
              <label className="flex flex-col gap-1 text-[12px]" style={{ color: 'var(--nz-text-muted)' }}>
                <div className="flex items-center justify-between">
                  <span>Username (Bisa Diubah)</span>
                  <span className="tabular-nums text-[11px]">{editUsername.length}/20</span>
                </div>
                <div className="relative flex items-center">
                  <span
                    className="absolute left-3 text-[13px] font-semibold select-none"
                    style={{ color: 'var(--nz-text-muted)' }}
                  >
                    @
                  </span>
                  <input
                    type="text"
                    value={editUsername}
                    maxLength={20}
                    onChange={(e) =>
                      setEditUsername(
                        e.target.value.replace(/^@/, '').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase().slice(0, 20)
                      )
                    }
                    placeholder="buat_username"
                    className="w-full border rounded-[10px] pl-7 pr-3 py-2 text-[13px] focus:outline-none"
                    style={{
                      background: 'var(--nz-elevated)',
                      borderColor: 'var(--nz-border)',
                      color: 'var(--nz-text)',
                    }}
                  />
                </div>
                <p className="text-[11px] leading-snug" style={{ color: 'var(--nz-text-muted)' }}>
                  Akun Telegram kamu belum punya username. Kamu bebas pasang atau ubah username sendiri di sini (3–20 huruf, angka, atau _).
                </p>
              </label>
            ) : (
              <div className="flex flex-col gap-1 text-[12px]" style={{ color: 'var(--nz-text-muted)' }}>
                <span>Username Telegram</span>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={profile.is_guest || profile.username === '-' ? '-' : `@${profile.username}`}
                    disabled
                    readOnly
                    aria-label="Username Telegram (tidak dapat diubah)"
                    className="w-full border rounded-[10px] pl-3 pr-9 py-2 text-[13px] bg-[#27272A]/40 text-[#9CA3AF] cursor-not-allowed opacity-80 select-none"
                    style={{ borderColor: 'var(--nz-border)' }}
                  />
                  <Lock className="w-4 h-4 text-[#9CA3AF] absolute right-3 pointer-events-none" strokeWidth={1.75} />
                </div>
                <p className="text-[11px] leading-snug text-[#9CA3AF]">
                  Username mengikuti akun Telegram, tidak bisa diubah
                </p>
              </div>
            )}

            {/* Bio */}
            <label className="flex flex-col gap-1 text-[12px]" style={{ color: 'var(--nz-text-muted)' }}>
              <span>Bio</span>
              <textarea
                rows={3}
                value={editBio}
                maxLength={300}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Tulis bio singkat..."
                className="border rounded-[10px] px-3 py-2 text-[13px] focus:outline-none resize-none"
                style={{
                  background: 'var(--nz-elevated)',
                  borderColor: 'var(--nz-border)',
                  color: 'var(--nz-text)',
                }}
              />
            </label>

            {editNotice && (
              <p className="text-[11.5px] text-[#FACC15]">{editNotice}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="h-9 px-4 text-[12.5px]"
                style={{ color: 'var(--nz-text-muted)' }}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingEdit || uploadingAvatar}
                className="h-9 px-5 rounded-full text-[12.5px] font-semibold disabled:opacity-50"
                style={{ background: 'var(--nz-btn-bg)', color: 'var(--nz-btn-text)' }}
              >
                {savingEdit ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Blocked Users Modal */}
      {blockedModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-end justify-center">
          <div
            className="w-full max-w-[480px] max-h-[65dvh] border-t rounded-t-[16px] flex flex-col"
            style={{ background: 'var(--nz-modal-bg)', borderColor: 'var(--nz-border)' }}
          >
            <div
              className="px-4 h-12 border-b flex items-center justify-between"
              style={{ borderColor: 'var(--nz-border)' }}
            >
              <span className="font-display text-[14px] font-bold" style={{ color: 'var(--nz-text)' }}>
                Pengguna Diblokir
              </span>
              <button type="button" onClick={() => setBlockedModalOpen(false)}>
                <X className="w-5 h-5" style={{ color: 'var(--nz-text-muted)' }} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4">
              {blockedList.length === 0 ? (
                <div className="py-12 text-center text-[13px]" style={{ color: 'var(--nz-text-muted)' }}>
                  Belum ada yang diblokir
                </div>
              ) : (
                blockedList.map((u) => (
                  <div
                    key={u.id}
                    className="py-3 flex items-center justify-between border-b last:border-b-0"
                    style={{ borderColor: 'var(--nz-border)' }}
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar player={u} size={36} />
                      <div>
                        <div className="text-[13px] font-semibold" style={{ color: 'var(--nz-text)' }}>
                          {u.name}
                        </div>
                        <div className="text-[12px]" style={{ color: 'var(--nz-text-muted)' }}>
                          @{u.username}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await api.unblock(u.id);
                        setBlockedList((prev) => prev.filter((p) => p.id !== u.id));
                      }}
                      className="h-7 px-3 rounded-full border text-[12px]"
                      style={{
                        background: 'var(--nz-elevated)',
                        borderColor: 'var(--nz-border)',
                        color: 'var(--nz-text)',
                      }}
                    >
                      Buka Blokir
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sheet Popup: Pilih Tema */}
      {themeSheetOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 flex items-end justify-center"
          onClick={() => setThemeSheetOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              dragStartYRef.current = e.touches[0]?.clientY ?? null;
            }}
            onTouchMove={(e) => {
              if (dragStartYRef.current === null) return;
              const dy = (e.touches[0]?.clientY ?? 0) - dragStartYRef.current;
              if (dy > 0) setSheetDragY(dy);
            }}
            onTouchEnd={() => {
              if (sheetDragY > 55) {
                setThemeSheetOpen(false);
              }
              setSheetDragY(0);
              dragStartYRef.current = null;
            }}
            style={{
              background: 'var(--nz-modal-bg)',
              borderColor: 'var(--nz-border)',
              transform: sheetDragY > 0 ? `translateY(${sheetDragY}px)` : undefined,
              transition: sheetDragY > 0 ? 'none' : 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
            className="w-full max-w-[480px] border-t rounded-t-[20px] flex flex-col pb-safe shadow-2xl"
          >
            {/* Drag Handle */}
            <div className="pt-2.5 pb-1 flex justify-center">
              <span
                className="w-10 h-1 rounded-full opacity-50"
                style={{ background: 'var(--nz-text-muted)' }}
              />
            </div>

            {/* Popup Header */}
            <div
              className="px-4 h-11 border-b flex items-center justify-between"
              style={{ borderColor: 'var(--nz-border)' }}
            >
              <span
                className="font-display text-[14.5px] font-bold"
                style={{ color: 'var(--nz-text)' }}
              >
                Pilih Tema
              </span>
              <button
                type="button"
                onClick={() => setThemeSheetOpen(false)}
                className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full hover:opacity-80"
                aria-label="Tutup Pilih Tema"
              >
                <X className="w-5 h-5" style={{ color: 'var(--nz-text-muted)' }} />
              </button>
            </div>

            {/* Compact 3-Column Theme Grid */}
            <div className="p-3.5 grid grid-cols-3 gap-2 max-h-[65dvh] overflow-y-auto">
              {THEMES.map((t) => {
                const active = theme.id === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setThemeId(t.id);
                      setThemeSheetOpen(false);
                    }}
                    className={`relative rounded-[11px] p-2 border flex flex-col items-center gap-1 transition-all active:scale-95 ${
                      active ? 'ring-2 ring-[#FACC15]' : ''
                    }`}
                    style={{
                      background: 'var(--nz-card)',
                      borderColor: active ? '#FACC15' : 'var(--nz-border)',
                    }}
                  >
                    <div className="relative">
                      <span
                        className="block w-7 h-7 rounded-full border shadow-sm"
                        style={{
                          background: `linear-gradient(135deg, ${t.previewColors[0]} 50%, ${t.previewColors[1]} 50%)`,
                          borderColor: active ? '#FACC15' : 'var(--nz-border)',
                        }}
                      />
                      {active && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#FACC15] text-[#000000] flex items-center justify-center shadow">
                          <Check className="w-2.5 h-2.5" strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <span
                      className="text-[10px] font-bold tracking-tight text-center leading-tight truncate w-full"
                      style={{ color: 'var(--nz-text)' }}
                    >
                      {t.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
