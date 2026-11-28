import React, { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { Player, Post } from '../types';
import { api } from '../services/api';
import { Avatar } from './Avatar';
import { CoinDisplay, OwnerBadge } from './PlayerBadges';
import { PostCard } from './PostCard';

interface ExploreViewProps {
  currentUser: Player;
  onOpenProfile: (username: string) => void;
  onOpenComments: (post: Post) => void;
  onRequireTelegram?: () => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  currentUser,
  onOpenProfile,
  onOpenComments,
  onRequireTelegram,
}) => {
  const [query, setQuery] = useState('');
  const [peopleTab, setPeopleTab] = useState<'members' | 'leaderboard'>('members');
  const [players, setPlayers] = useState<Player[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [unfollowTarget, setUnfollowTarget] = useState<Player | null>(null);

  const displayedPlayers = useMemo(() => {
    if (peopleTab === 'members') return players;
    return [...players].sort((a, b) => Number(b.coins || 0) - Number(a.coins || 0));
  }, [players, peopleTab]);

  const loadExplore = async (q: string) => {
    setLoading(true);
    try {
      const [pRes, postRes] = await Promise.all([
        api.getPlayers(q),
        api.getPosts(q ? { q } : undefined),
      ]);
      setPlayers(pRes.players);
      setPosts(postRes.posts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadExplore(query.trim());
    }, 180);
    return () => clearTimeout(timer);
  }, [query, currentUser.id]);

  const handleFollow = async (target: Player) => {
    if (currentUser.is_guest) {
      onRequireTelegram?.();
      return;
    }
    await api.follow(target.id);
    setPlayers((prev) =>
      prev.map((p) => (p.id === target.id ? { ...p, is_following: true } : p))
    );
  };

  const handleConfirmUnfollow = async () => {
    if (currentUser.is_guest) {
      onRequireTelegram?.();
      return;
    }
    if (!unfollowTarget) return;
    await api.unfollow(unfollowTarget.id);
    setPlayers((prev) =>
      prev.map((p) => (p.id === unfollowTarget.id ? { ...p, is_following: false } : p))
    );
    setUnfollowTarget(null);
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

  return (
    <div className="w-full pb-20">
      {/* Search Bar */}
      <div
        className="px-4 py-3 border-b sticky top-12 z-20 backdrop-blur-md"
        style={{ background: 'var(--nz-header-bg)', borderColor: 'var(--nz-border)' }}
      >
        <div className="relative flex items-center">
          <Search
            className="w-4 h-4 absolute left-3.5 pointer-events-none"
            style={{ color: 'var(--nz-text-muted)' }}
            strokeWidth={1.5}
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari orang atau postingan..."
            className="w-full h-10 border rounded-[12px] pl-10 pr-9 text-[13px] focus:outline-none"
            style={{
              background: 'var(--nz-card)',
              borderColor: 'var(--nz-border)',
              color: 'var(--nz-text)',
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 hover:opacity-80"
              style={{ color: 'var(--nz-text-muted)' }}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* People / Leaderboard Section */}
      <div className="border-b" style={{ borderColor: 'var(--nz-border)' }}>
        <div className="px-4 pt-3 pb-2 flex items-center justify-between">
          <span
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--nz-text-muted)' }}
          >
            {peopleTab === 'members' ? 'Anggota' : 'Leaderboard'}
          </span>
          <div
            className="flex items-center gap-1 p-0.5 rounded-[8px] border"
            style={{ background: 'var(--nz-card)', borderColor: 'var(--nz-border)' }}
          >
            <button
              type="button"
              onClick={() => setPeopleTab('members')}
              className="px-2.5 py-1 rounded-[6px] text-[11px] font-semibold transition-colors"
              style={
                peopleTab === 'members'
                  ? { background: 'var(--nz-btn-bg)', color: 'var(--nz-btn-text)' }
                  : { color: 'var(--nz-text-muted)' }
              }
            >
              Anggota
            </button>
            <button
              type="button"
              onClick={() => setPeopleTab('leaderboard')}
              className="px-2.5 py-1 rounded-[6px] text-[11px] font-semibold transition-colors"
              style={
                peopleTab === 'leaderboard'
                  ? { background: 'var(--nz-btn-bg)', color: 'var(--nz-btn-text)' }
                  : { color: 'var(--nz-text-muted)' }
              }
            >
              Leaderboard
            </button>
          </div>
        </div>
        {loading && displayedPlayers.length === 0 ? (
          <div className="py-6 text-center text-[13px]" style={{ color: 'var(--nz-text-muted)' }}>
            Mencari...
          </div>
        ) : displayedPlayers.length === 0 ? (
          <div className="py-6 text-center text-[13px]" style={{ color: 'var(--nz-text-muted)' }}>
            Belum ada pengguna
          </div>
        ) : (
          <div>
            {displayedPlayers.map((p, idx) => {
              const isMe = p.id === currentUser.id;
              return (
                <div
                  key={p.id}
                  className="px-4 py-2.5 flex items-center justify-between gap-3 border-t"
                  style={{ borderColor: 'var(--nz-border)' }}
                >
                  <button
                    type="button"
                    onClick={() => onOpenProfile(p.username)}
                    className="flex items-center gap-2.5 min-w-0 text-left flex-1"
                  >
                    {peopleTab === 'leaderboard' && (
                      <span
                        className="w-5 text-[12px] font-semibold tabular-nums shrink-0"
                        style={{ color: 'var(--nz-text-muted)' }}
                      >
                        #{idx + 1}
                      </span>
                    )}
                    <Avatar player={p} size={36} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="font-display text-[14px] font-bold truncate"
                          style={{ color: 'var(--nz-text)' }}
                        >
                          {p.name}
                        </span>
                        {p.is_owner && <OwnerBadge compact />}
                      </div>
                      <div
                        className="flex items-center gap-2 text-[12px] truncate"
                        style={{ color: 'var(--nz-text-muted)' }}
                      >
                        <span>@{p.username}</span>
                        {peopleTab === 'leaderboard' && (
                          <CoinDisplay coins={p.coins} isOwner={p.is_owner} iconSize="sm" />
                        )}
                      </div>
                    </div>
                  </button>

                  {!isMe && !p.is_blocked_by_me && !p.has_blocked_me && (
                    p.is_following ? (
                      <button
                        type="button"
                        onClick={() => setUnfollowTarget(p)}
                        className="h-[28px] px-[14px] rounded-full border text-[12px] font-semibold shrink-0"
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
                        onClick={() => handleFollow(p)}
                        className="h-[28px] px-[14px] rounded-full text-[12px] font-semibold shrink-0"
                        style={{ background: 'var(--nz-btn-bg)', color: 'var(--nz-btn-text)' }}
                      >
                        Ikuti
                      </button>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Matching Posts */}
      <div>
        <div
          className="px-4 pt-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--nz-text-muted)' }}
        >
          Postingan
        </div>
        {posts.length === 0 ? (
          <div className="py-12 text-center text-[13px]" style={{ color: 'var(--nz-text-muted)' }}>
            Belum ada postingan
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              onOpenProfile={onOpenProfile}
              onToggleLike={handleToggleLike}
              onOpenComments={onOpenComments}
              onRepost={async (orig, cap) => {
                if (currentUser.is_guest) {
                  onRequireTelegram?.();
                  return;
                }
                await api.createPost({
                  original_post_id: orig.id,
                  repost_caption: cap || undefined,
                  media_type: 'text',
                });
                loadExplore(query.trim());
              }}
              onDeletePost={async (id) => {
                if (currentUser.is_guest) {
                  onRequireTelegram?.();
                  return;
                }
                await api.deletePost(id);
                setPosts((prev) => prev.filter((p) => p.id !== id));
              }}
              onBlockUser={async (target) => {
                if (currentUser.is_guest) {
                  onRequireTelegram?.();
                  return;
                }
                await api.block(target.id);
                loadExplore(query.trim());
              }}
            />
          ))
        )}
      </div>

      {unfollowTarget && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div
            className="w-full max-w-[340px] border rounded-[14px] p-4 flex flex-col gap-3"
            style={{ background: 'var(--nz-modal-bg)', borderColor: 'var(--nz-border)' }}
          >
            <h3 className="font-display text-[15px] font-bold" style={{ color: 'var(--nz-text)' }}>
              Berhenti Mengikuti @{unfollowTarget.username}?
            </h3>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setUnfollowTarget(null)}
                className="h-9 px-4 text-[12.5px]"
                style={{ color: 'var(--nz-text-muted)' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmUnfollow}
                className="h-9 px-4 text-[12.5px] font-semibold text-[#FF453A]"
              >
                Ya, Unfollow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
