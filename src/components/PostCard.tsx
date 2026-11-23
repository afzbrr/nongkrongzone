import React, { useState } from 'react';
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
  Trash2,
  User,
  Ban,
} from 'lucide-react';
import type { Player, Post } from '../types';
import { formatNumber, formatRelativeTime } from '../utils/format';
import { Avatar } from './Avatar';
import { PostMedia } from './PostMedia';
import { RichCaption } from './RichCaption';
import { OwnerBadge } from './PlayerBadges';

interface PostCardProps {
  post: Post;
  currentUser: Player;
  onOpenProfile: (username: string) => void;
  onToggleLike: (post: Post) => void;
  onOpenComments: (post: Post) => void;
  onRepost: (post: Post, repostCaption: string) => Promise<void>;
  onDeletePost: (postId: string) => Promise<void>;
  onBlockUser: (player: Player) => Promise<void>;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUser,
  onOpenProfile,
  onToggleLike,
  onOpenComments,
  onRepost,
  onDeletePost,
  onBlockUser,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [repostOpen, setRepostOpen] = useState(false);
  const [repostCaption, setRepostCaption] = useState('');
  const [submittingRepost, setSubmittingRepost] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const author = post.player;
  const isMine = post.player_id === currentUser.id;
  const canDelete = isMine || Boolean(currentUser.is_owner);
  const isRepost = Boolean(post.original_post_id);
  const orig = post.original_post;

  const handleRepostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRepost) return;
    setSubmittingRepost(true);
    try {
      await onRepost(orig || post, repostCaption.trim());
      setRepostCaption('');
      setRepostOpen(false);
    } finally {
      setSubmittingRepost(false);
    }
  };

  return (
    <article
      className="w-full border-b"
      style={{ background: 'var(--nz-card)', borderColor: 'var(--nz-border)' }}
    >
      {/* Repost Indicator */}
      {isRepost && (
        <div
          className="px-4 pt-3 pb-1 flex items-center gap-1.5 text-[11px]"
          style={{ color: 'var(--nz-text-muted)' }}
        >
          <Repeat2 className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>
            Merepost dari{' '}
            {orig?.player ? (
              <button
                type="button"
                onClick={() => onOpenProfile(orig.player!.username)}
                className="font-medium hover:underline"
                style={{ color: 'var(--nz-accent-text)' }}
              >
                @{orig.player.username}
              </button>
            ) : (
              'pengguna'
            )}
          </span>
        </div>
      )}

      {/* Post Header */}
      <div className="px-4 pt-3 pb-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar
            player={author}
            size={36}
            onClick={() => author && onOpenProfile(author.username)}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <button
                type="button"
                onClick={() => author && onOpenProfile(author.username)}
                className="font-display text-[15px] font-bold tracking-[-0.5px] truncate hover:opacity-80"
                style={{ color: 'var(--nz-text)' }}
              >
                {author?.name || 'Pengguna'}
              </button>
              {author?.is_owner && <OwnerBadge compact />}
            </div>
            <div
              className="flex items-center gap-1.5 text-[11px]"
              style={{ color: 'var(--nz-text-muted)' }}
            >
              <button
                type="button"
                onClick={() => author && onOpenProfile(author.username)}
                className="font-semibold text-[12px] hover:opacity-80 truncate"
                style={{ color: 'var(--nz-text-muted)' }}
              >
                @{author?.username || 'user'}
              </button>
              <span aria-hidden="true">·</span>
              <span className="uppercase tracking-wide whitespace-nowrap">
                {formatRelativeTime(post.created_at)}
              </span>
            </div>
          </div>
        </div>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center transition-opacity hover:opacity-80"
            style={{ color: 'var(--nz-text-muted)' }}
            aria-label="Opsi postingan"
          >
            <MoreHorizontal className="w-[18px] h-[18px]" strokeWidth={1.5} />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmDelete(false);
                }}
              />
              <div
                className="absolute right-0 top-10 z-30 w-48 border rounded-[12px] overflow-hidden py-1 shadow-lg"
                style={{ background: 'var(--nz-modal-bg)', borderColor: 'var(--nz-border)' }}
              >
                {author && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenProfile(author.username);
                    }}
                    className="w-full px-3.5 py-2.5 text-left text-[13px] flex items-center gap-2.5 hover:opacity-80"
                    style={{ color: 'var(--nz-text)' }}
                  >
                    <User className="w-4 h-4" style={{ color: 'var(--nz-text-muted)' }} strokeWidth={1.5} />
                    <span>Lihat Profil</span>
                  </button>
                )}

                {canDelete && (
                  confirmDelete ? (
                    <button
                      type="button"
                      onClick={async () => {
                        setMenuOpen(false);
                        setConfirmDelete(false);
                        await onDeletePost(post.id);
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-[13px] text-[#FF453A] font-medium flex items-center gap-2.5"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                      <span>Konfirmasi Hapus</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="w-full px-3.5 py-2.5 text-left text-[13px] text-[#FF453A] flex items-center gap-2.5"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                      <span>Hapus Postingan</span>
                    </button>
                  )
                )}

                {!isMine && author && (
                  <button
                    type="button"
                    onClick={async () => {
                      setMenuOpen(false);
                      await onBlockUser(author);
                    }}
                    className="w-full px-3.5 py-2.5 text-left text-[13px] text-[#FF453A] flex items-center gap-2.5"
                  >
                    <Ban className="w-4 h-4" strokeWidth={1.5} />
                    <span>Blokir @{author.username}</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Repost Caption (if any) */}
      {isRepost && post.repost_caption && (
        <div className="px-4 pb-2.5">
          <RichCaption text={post.repost_caption} onSelectUsername={onOpenProfile} />
        </div>
      )}

      {/* Normal Caption (when no media) */}
      {!isRepost && post.caption && (!post.media_urls || post.media_urls.length === 0) && (
        <div className="px-4 pb-3">
          <RichCaption text={post.caption} onSelectUsername={onOpenProfile} />
        </div>
      )}

      {/* Embedded Original Post for Repost */}
      {isRepost ? (
        <div className="px-4 pb-3">
          {orig ? (
            <div
              className="border rounded-[12px] overflow-hidden"
              style={{ background: 'var(--nz-elevated)', borderColor: 'var(--nz-border)' }}
            >
              <div
                className="px-3 py-2.5 flex items-center gap-2 border-b"
                style={{ borderColor: 'var(--nz-border)' }}
              >
                <Avatar
                  player={orig.player}
                  size={28}
                  onClick={() => orig.player && onOpenProfile(orig.player.username)}
                />
                <div className="min-w-0 flex items-center gap-1.5">
                  <span
                    className="font-display text-[13px] font-bold truncate"
                    style={{ color: 'var(--nz-text)' }}
                  >
                    {orig.player?.name || 'Pengguna'}
                  </span>
                  {orig.player?.is_owner && <OwnerBadge compact />}
                  <span className="text-[12px] truncate" style={{ color: 'var(--nz-text-muted)' }}>
                    @{orig.player?.username}
                  </span>
                </div>
              </div>
              <PostMedia mediaUrls={orig.media_urls} mediaType={orig.media_type} />
              {orig.caption && (
                <div className="px-3 py-2.5">
                  <RichCaption text={orig.caption} onSelectUsername={onOpenProfile} />
                </div>
              )}
            </div>
          ) : (
            <div
              className="border rounded-[12px] px-3 py-4 text-[13px]"
              style={{
                background: 'var(--nz-elevated)',
                borderColor: 'var(--nz-border)',
                color: 'var(--nz-text-muted)',
              }}
            >
              Postingan asli sudah dihapus atau tidak tersedia.
            </div>
          )}
        </div>
      ) : (
        <>
          <PostMedia mediaUrls={post.media_urls} mediaType={post.media_type} />
          {post.caption && post.media_urls && post.media_urls.length > 0 && (
            <div className="px-4 pt-2.5 pb-1">
              <RichCaption text={post.caption} onSelectUsername={onOpenProfile} />
            </div>
          )}
        </>
      )}

      {/* Action Bar */}
      <div className="px-2 py-1 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onToggleLike(post)}
            className="min-h-[44px] px-2.5 flex items-center gap-1.5 active:scale-[0.96] transition-all duration-150"
            style={{ color: 'var(--nz-text-muted)' }}
            aria-label="Suka"
          >
            <Heart
              className={`w-[19px] h-[19px] transition-colors ${
                post.liked_by_me ? 'fill-[#FF453A] text-[#FF453A]' : ''
              }`}
              strokeWidth={1.5}
            />
            <span
              className="text-[12px] font-medium tabular-nums"
              style={{ color: post.liked_by_me ? '#FF453A' : 'var(--nz-text-muted)' }}
            >
              {formatNumber(post.likes_count)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onOpenComments(post)}
            className="min-h-[44px] px-2.5 flex items-center gap-1.5 active:scale-[0.96] transition-all duration-150"
            style={{ color: 'var(--nz-text-muted)' }}
            aria-label="Komentar"
          >
            <MessageCircle className="w-[19px] h-[19px]" strokeWidth={1.5} />
            <span className="text-[12px] font-medium tabular-nums">
              {formatNumber(post.comments_count)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setRepostOpen((v) => !v)}
            className="min-h-[44px] px-2.5 flex items-center gap-1.5 active:scale-[0.96] transition-all duration-150"
            style={{ color: repostOpen ? 'var(--nz-accent-text)' : 'var(--nz-text-muted)' }}
            aria-label="Repost"
          >
            <Repeat2 className="w-[19px] h-[19px]" strokeWidth={1.5} />
            <span className="text-[12px] font-medium">Repost</span>
          </button>
        </div>

        {canDelete && (
          <button
            type="button"
            onClick={async () => {
              if (!confirmDelete) {
                setConfirmDelete(true);
                return;
              }
              setConfirmDelete(false);
              await onDeletePost(post.id);
            }}
            onBlur={() => setConfirmDelete(false)}
            className="min-h-[44px] px-2.5 flex items-center gap-1 text-[12px] font-medium text-[#FF453A] active:scale-[0.96] transition-all"
            aria-label="Hapus postingan"
          >
            <Trash2 className="w-[16px] h-[16px]" strokeWidth={1.6} />
            <span>{confirmDelete ? 'Yakin?' : 'Hapus'}</span>
          </button>
        )}
      </div>

      {/* Inline Repost Drawer */}
      {repostOpen && (
        <form
          onSubmit={handleRepostSubmit}
          className="px-4 pb-3 pt-2 border-t flex flex-col gap-2"
          style={{ background: 'var(--nz-elevated)', borderColor: 'var(--nz-border)' }}
        >
          <input
            type="text"
            value={repostCaption}
            onChange={(e) => setRepostCaption(e.target.value)}
            placeholder="Tambahkan catatan repost (opsional)..."
            className="w-full border rounded-[10px] px-3 py-2 text-[13px] focus:outline-none"
            style={{
              background: 'var(--nz-card)',
              borderColor: 'var(--nz-border)',
              color: 'var(--nz-text)',
            }}
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setRepostOpen(false)}
              className="px-3 py-1.5 text-[12px]"
              style={{ color: 'var(--nz-text-muted)' }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submittingRepost}
              className="px-4 py-1.5 rounded-full text-[12px] font-semibold hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--nz-btn-bg)', color: 'var(--nz-btn-text)' }}
            >
              {submittingRepost ? 'Mengirim...' : 'Posting Ulang'}
            </button>
          </div>
        </form>
      )}
    </article>
  );
};
