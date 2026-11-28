import React, { useEffect, useMemo, useState } from 'react';
import { Heart, Reply, Send, Trash2, X } from 'lucide-react';
import type { Player, Post, PostComment } from '../types';
import { api } from '../services/api';
import { formatNumber, formatRelativeTime } from '../utils/format';
import { Avatar } from './Avatar';
import { RichCaption } from './RichCaption';
import { OwnerBadge } from './PlayerBadges';

interface CommentsSheetProps {
  post: Post | null;
  currentUser: Player;
  onClose: () => void;
  onOpenProfile: (username: string) => void;
  onCommentsCountChange: (postId: string, newCount: number) => void;
  onRequireTelegram?: () => void;
}

interface CommentNodeProps {
  node: PostComment;
  depth: number;
  currentUser: Player;
  onReply: (comment: PostComment) => void;
  onToggleLike: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  onOpenProfile: (username: string) => void;
}

const CommentNode: React.FC<CommentNodeProps> = ({
  node,
  depth,
  currentUser,
  onReply,
  onToggleLike,
  onDelete,
  onOpenProfile,
}) => {
  const isMine = node.player_id === currentUser.id;
  const canDelete = isMine || Boolean(currentUser.is_owner);
  const author = node.player;

  return (
    <div
      className={depth > 0 ? 'pl-6 border-l ml-3 mt-2.5' : 'py-3 border-b'}
      style={{ borderColor: 'var(--nz-border)' }}
    >
      <div className="flex items-start gap-2.5">
        <Avatar
          player={author}
          size={depth > 0 ? 28 : 32}
          onClick={() => author && onOpenProfile(author.username)}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => author && onOpenProfile(author.username)}
              className="font-display font-bold text-[13px] hover:underline"
              style={{ color: 'var(--nz-text)' }}
            >
              {author?.name || 'Pengguna'}
            </button>
            {author?.is_owner && <OwnerBadge compact />}
            <button
              type="button"
              onClick={() => author && onOpenProfile(author.username)}
              className="text-[11.5px] hover:underline"
              style={{ color: 'var(--nz-text-muted)' }}
            >
              @{author?.username || 'user'}
            </button>
            <span className="text-[11px] uppercase" style={{ color: 'var(--nz-text-muted)' }}>
              · {formatRelativeTime(node.created_at)}
            </span>
          </div>

          {node.is_deleted ? (
            <p className="text-[13px] italic mt-0.5" style={{ color: 'var(--nz-text-muted)' }}>
              Komentar ini dihapus
            </p>
          ) : (
            <RichCaption text={node.text} onSelectUsername={onOpenProfile} className="mt-0.5" />
          )}

          {!node.is_deleted && (
            <div className="flex items-center gap-4 mt-1.5">
              <button
                type="button"
                onClick={() => onToggleLike(node.id)}
                className="flex items-center gap-1 text-[11px] py-1"
                style={{ color: 'var(--nz-text-muted)' }}
              >
                <Heart
                  className={`w-3.5 h-3.5 ${
                    node.liked_by_me ? 'fill-[#FF453A] text-[#FF453A]' : ''
                  }`}
                  strokeWidth={1.5}
                />
                <span className="tabular-nums">{formatNumber(node.likes_count)}</span>
              </button>

              <button
                type="button"
                onClick={() => onReply(node)}
                className="flex items-center gap-1 text-[11px] py-1"
                style={{ color: 'var(--nz-text-muted)' }}
              >
                <Reply className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Balas</span>
              </button>

              {canDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(node.id)}
                  className="flex items-center gap-1 text-[11px] text-[#FF453A] hover:opacity-80 py-1"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>Hapus</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {node.replies && node.replies.length > 0 && (
        <div className="mt-1">
          {node.replies.map((child) => (
            <CommentNode
              key={child.id}
              node={child}
              depth={depth + 1}
              currentUser={currentUser}
              onReply={onReply}
              onToggleLike={onToggleLike}
              onDelete={onDelete}
              onOpenProfile={onOpenProfile}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const CommentsSheet: React.FC<CommentsSheetProps> = ({
  post,
  currentUser,
  onClose,
  onOpenProfile,
  onCommentsCountChange,
  onRequireTelegram,
}) => {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [replyTarget, setReplyTarget] = useState<PostComment | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!post) return;
    setLoading(true);
    setReplyTarget(null);
    api
      .getComments(post.id)
      .then((res) => setComments(res.comments))
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [post]);

  const commentTree = useMemo(() => {
    const map = new Map<string, PostComment>();
    const roots: PostComment[] = [];
    for (const c of comments) {
      map.set(c.id, { ...c, replies: [] });
    }
    for (const c of comments) {
      const node = map.get(c.id)!;
      if (c.parent_comment_id && map.has(c.parent_comment_id)) {
        map.get(c.parent_comment_id)!.replies!.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }, [comments]);

  if (!post) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.is_guest) {
      onRequireTelegram?.();
      return;
    }
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await api.addComment(post.id, text.trim(), replyTarget?.id || null);
      setComments((prev) => [...prev, res.comment]);
      onCommentsCountChange(post.id, res.comments_count);
      setText('');
      setReplyTarget(null);
    } finally {
      setSending(false);
    }
  };

  const handleToggleLike = async (commentId: string) => {
    if (currentUser.is_guest) {
      onRequireTelegram?.();
      return;
    }
    const res = await api.toggleCommentLike(commentId);
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId ? { ...c, liked_by_me: res.liked, likes_count: res.likes_count } : c
      )
    );
  };

  const handleDelete = async (commentId: string) => {
    if (currentUser.is_guest) {
      onRequireTelegram?.();
      return;
    }
    await api.deleteComment(commentId);
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId ? { ...c, is_deleted: true, text: 'Komentar ini dihapus' } : c
      )
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-xs">
      <div
        className="w-full max-w-[480px] h-[82dvh] border-t border-x rounded-t-[16px] flex flex-col overflow-hidden"
        style={{ background: 'var(--nz-modal-bg)', borderColor: 'var(--nz-border)' }}
      >
        <div
          className="px-4 h-12 border-b flex items-center justify-between shrink-0"
          style={{ borderColor: 'var(--nz-border)' }}
        >
          <h3 className="font-display text-[15px] font-bold" style={{ color: 'var(--nz-text)' }}>
            Komentar
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center"
            style={{ color: 'var(--nz-text-muted)' }}
            aria-label="Tutup komentar"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4">
          {loading ? (
            <div className="py-12 text-center text-[13px]" style={{ color: 'var(--nz-text-muted)' }}>
              Memuat komentar...
            </div>
          ) : commentTree.length === 0 ? (
            <div className="py-16 text-center text-[13px]" style={{ color: 'var(--nz-text-muted)' }}>
              Belum ada komentar
            </div>
          ) : (
            commentTree.map((node) => (
              <CommentNode
                key={node.id}
                node={node}
                depth={0}
                currentUser={currentUser}
                onReply={(c) => setReplyTarget(c)}
                onToggleLike={handleToggleLike}
                onDelete={handleDelete}
                onOpenProfile={(username) => {
                  onClose();
                  onOpenProfile(username);
                }}
              />
            ))
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="border-t p-3 pb-safe"
          style={{ background: 'var(--nz-modal-bg)', borderColor: 'var(--nz-border)' }}
        >
          {replyTarget && (
            <div
              className="flex items-center justify-between text-[12px] pb-2 px-1"
              style={{ color: 'var(--nz-text-muted)' }}
            >
              <span>
                Membalas{' '}
                <span style={{ color: 'var(--nz-accent-text)' }}>
                  @{replyTarget.player?.username}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setReplyTarget(null)}
                style={{ color: 'var(--nz-text-muted)' }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Avatar player={currentUser} size={32} />
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={replyTarget ? 'Tulis balasan...' : 'Tulis komentar...'}
              className="flex-1 border rounded-full px-3.5 py-2 text-[13px] focus:outline-none"
              style={{
                background: 'var(--nz-elevated)',
                borderColor: 'var(--nz-border)',
                color: 'var(--nz-text)',
              }}
            />
            <button
              type="submit"
              disabled={!text.trim() || sending}
              className="min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center disabled:opacity-40 transition-opacity"
              style={{ background: 'var(--nz-btn-bg)', color: 'var(--nz-btn-text)' }}
              aria-label="Kirim komentar"
            >
              <Send className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
