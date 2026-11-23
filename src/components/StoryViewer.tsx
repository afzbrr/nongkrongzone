import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Music,
  Send,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type { Player, StoryGroup, StoryReact, StoryView } from '../types';
import { api } from '../services/api';
import { formatRemainingTime, sanitizeMediaUrl } from '../utils/format';
import { THEMES } from '../context/ThemeContext';
import { Avatar } from './Avatar';
import { OwnerBadge } from './PlayerBadges';
import { MediaVideoPlayer } from './PostMedia';

interface StoryViewerProps {
  storyGroups: StoryGroup[];
  initialGroupIndex: number;
  currentUser: Player;
  onClose: () => void;
  onStoryDeleted: () => void;
  onOpenProfile: (username: string) => void;
  onOpenDmChat: (peer: Player) => void;
}

const STORY_REACTION_EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '👏'];

function isLightBackground(bg?: string | null): boolean {
  if (!bg) return false;
  const trimmed = bg.trim().toLowerCase();
  if (trimmed === '#ffffff' || trimmed === '#fce7f3' || trimmed === '#fff') return true;
  const matchedTheme = THEMES.find((t) => t.bg.toLowerCase() === trimmed);
  return Boolean(matchedTheme?.isLight);
}

export const StoryViewer: React.FC<StoryViewerProps> = ({
  storyGroups,
  initialGroupIndex,
  currentUser,
  onClose,
  onStoryDeleted,
  onOpenProfile,
  onOpenDmChat,
}) => {
  const [groupIdx, setGroupIdx] = useState(initialGroupIndex);
  const [storyIdx, setStoryIdx] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replySentPeer, setReplySentPeer] = useState<Player | null>(null);
  const [muted, setMuted] = useState(false);
  const [viewersOpen, setViewersOpen] = useState(false);
  const [viewers, setViewers] = useState<StoryView[]>([]);
  const [reacts, setReacts] = useState<StoryReact[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentGroup = storyGroups[groupIdx];
  const currentStory = currentGroup?.stories[storyIdx];

  useEffect(() => {
    if (!currentStory) return;
    setReacts(currentStory.reacts || []);
    setReplySentPeer(null);
    setViewersOpen(false);
    api.viewStory(currentStory.id).catch(() => {});
    api
      .getStoryViews(currentStory.id)
      .then((res) => {
        setViewers(res.viewers);
        setReacts(res.reacts);
      })
      .catch(() => {});
  }, [currentStory?.id]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = muted;
    if (currentStory?.song_url && !muted) {
      audioRef.current.play().catch(() => {});
    }
  }, [currentStory?.id, muted]);

  if (!currentGroup || !currentStory) return null;

  const isMine = currentStory.player_id === currentUser.id;
  const canDelete = isMine || Boolean(currentUser.is_owner);
  const mediaUrl = sanitizeMediaUrl(currentStory.media_url);
  const songUrl = sanitizeMediaUrl(currentStory.song_url);
  const storyText = (currentStory.text || currentStory.caption || '').trim();
  const isTextOnlyStory = currentStory.media_type === 'text' || !mediaUrl;
  const storyBg = isTextOnlyStory ? currentStory.bg_color || '#0B0B0D' : '#000000';
  const textLightBg = isTextOnlyStory && isLightBackground(storyBg);

  const goNext = () => {
    if (storyIdx < currentGroup.stories.length - 1) {
      setStoryIdx(storyIdx + 1);
    } else if (groupIdx < storyGroups.length - 1) {
      setGroupIdx(groupIdx + 1);
      setStoryIdx(0);
    } else {
      onClose();
    }
  };

  const goPrev = () => {
    if (storyIdx > 0) {
      setStoryIdx(storyIdx - 1);
    } else if (groupIdx > 0) {
      const prevGroup = storyGroups[groupIdx - 1];
      setGroupIdx(groupIdx - 1);
      setStoryIdx(Math.max(0, prevGroup.stories.length - 1));
    }
  };

  const handleReact = async (emoji: string) => {
    const res = await api.reactStory(currentStory.id, emoji);
    setReacts((prev) => [res.react, ...prev]);
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || sendingReply) return;
    setSendingReply(true);
    try {
      await api.replyStory(currentStory.id, replyText.trim());
      setReplyText('');
      setReplySentPeer(currentGroup.player);
    } finally {
      setSendingReply(false);
    }
  };

  const handleDelete = async () => {
    await api.deleteStory(currentStory.id);
    onStoryDeleted();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#000000] flex items-center justify-center">
      <div className="relative w-full max-w-[480px] h-full bg-[#0B0B0D] flex flex-col overflow-hidden">
        {songUrl && <audio ref={audioRef} src={songUrl} autoPlay loop muted={muted} />}

        {/* Top Progress Bars & Header */}
        <div className="absolute top-0 inset-x-0 z-20 p-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          <div className="flex items-center gap-1 mb-3">
            {currentGroup.stories.map((s, idx) => (
              <div key={s.id} className="flex-1 h-[2px] bg-white/25 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-200 ${
                    idx <= storyIdx ? 'w-full bg-[#F4F4F5]' : 'w-0'
                  }`}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar
                player={currentGroup.player}
                size={32}
                onClick={() => {
                  onClose();
                  onOpenProfile(currentGroup.player.username);
                }}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-[13px] font-bold text-[#F4F4F5] truncate">
                    {currentGroup.player.name || 'Pengguna'}
                  </span>
                  {currentGroup.player.is_owner && <OwnerBadge compact />}
                </div>
                <span className="text-[11px] text-[#D4D4D8] block truncate">
                  @{currentGroup.player.username} · {formatRemainingTime(currentStory.expires_at)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {songUrl && (
                <button
                  type="button"
                  onClick={() => setMuted((m) => !m)}
                  className="min-w-[38px] min-h-[38px] flex items-center justify-center text-[#F4F4F5]"
                  aria-label={muted ? 'Nyalakan suara' : 'Bisukan'}
                >
                  {muted ? (
                    <VolumeX className="w-[18px] h-[18px]" strokeWidth={1.5} />
                  ) : (
                    <Volume2 className="w-[18px] h-[18px]" strokeWidth={1.5} />
                  )}
                </button>
              )}

              {canDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="min-w-[38px] min-h-[38px] flex items-center justify-center text-[#FF453A]"
                  aria-label="Hapus story"
                >
                  <Trash2 className="w-[18px] h-[18px]" strokeWidth={1.5} />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="min-w-[38px] min-h-[38px] flex items-center justify-center text-[#F4F4F5]"
                aria-label="Tutup story"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {currentStory.song_title && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-[#141417]/85 border border-[#232328] text-[12px] text-[#F4F4F5] max-w-full">
              <Music className="w-3.5 h-3.5 text-[#8B5CF6] shrink-0" strokeWidth={1.5} />
              <span className="truncate">
                {currentStory.song_title}
                {currentStory.song_artist ? ` — ${currentStory.song_artist}` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Media / Text Canvas — STRICTLY object-contain, max-h-[85vh], NEVER cropped or upscaled */}
        <div
          className="relative flex-1 flex items-center justify-center overflow-hidden"
          style={{ background: storyBg }}
        >
          {isTextOnlyStory ? (
            <div className="px-7 py-16 flex items-center justify-center text-center max-w-full">
              <p
                className="font-display text-[22px] sm:text-[25px] font-bold leading-[1.35] break-words max-w-full"
                style={{ color: textLightBg ? '#111111' : '#FFFFFF' }}
              >
                {storyText || 'Story Teks'}
              </p>
            </div>
          ) : mediaUrl && currentStory.media_type === 'video' ? (
            <MediaVideoPlayer
              key={currentStory.id}
              src={mediaUrl}
              maxHeightClass="max-h-[85vh]"
              autoPlay
            />
          ) : mediaUrl ? (
            <img
              key={currentStory.id}
              src={mediaUrl}
              alt={storyText || 'Story'}
              referrerPolicy="no-referrer"
              className="max-w-full w-auto h-auto max-h-[85vh] object-contain mx-auto block bg-black"
            />
          ) : null}

          {/* Overlay text ONLY at bottom of media so it never covers the photo/video center */}
          {!isTextOnlyStory && storyText && (
            <div className="absolute bottom-3 inset-x-4 z-15 flex justify-center pointer-events-none">
              <p className="px-3.5 py-2 rounded-[12px] bg-black/60 backdrop-blur-xs text-[13.5px] text-white leading-[1.4] text-center max-w-full break-words">
                {storyText}
              </p>
            </div>
          )}

          {/* Left / Right Edge Tap Zones (keep center unobstructed for Video Play button) */}
          <button
            type="button"
            onClick={goPrev}
            aria-label="Story sebelumnya"
            className="absolute left-0 top-20 bottom-20 w-[22%] z-10 flex items-center justify-start pl-2 group"
          >
            <span className="w-9 h-9 rounded-full bg-black/45 text-white/85 flex items-center justify-center group-hover:bg-black/75 transition-colors">
              <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
            </span>
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Story berikutnya"
            className="absolute right-0 top-20 bottom-20 w-[22%] z-10 flex items-center justify-end pr-2 group"
          >
            <span className="w-9 h-9 rounded-full bg-black/45 text-white/85 flex items-center justify-center group-hover:bg-black/75 transition-colors">
              <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
            </span>
          </button>
        </div>

        {/* Bottom Reacts & Reply Bar */}
        <div className="relative z-20 p-3 pb-safe bg-gradient-to-t from-black via-black/90 to-transparent border-t border-[#232328]/60 flex flex-col gap-2.5">
          {reacts.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar px-1">
              {reacts.slice(0, 12).map((r) => (
                <span
                  key={r.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] bg-[#141417] border border-[#232328] text-[12px] shrink-0"
                >
                  <span>{r.emoji}</span>
                  <span className="text-[11px] text-[#8E8E93]">@{r.player?.username}</span>
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              {STORY_REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleReact(emoji)}
                  className="w-9 h-9 rounded-full bg-[#141417] border border-[#232328] flex items-center justify-center text-[15px] hover:border-[#8B5CF6] active:scale-95 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setViewersOpen(true)}
              className="h-9 px-3 rounded-full bg-[#141417] border border-[#232328] text-[#F4F4F5] text-[12px] flex items-center gap-1.5 tabular-nums shrink-0"
            >
              <Eye className="w-3.5 h-3.5 text-[#8E8E93]" strokeWidth={1.5} />
              <span>{viewers.length}</span>
            </button>
          </div>

          {!isMine && (
            <form onSubmit={handleReply} className="flex items-center gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Balas story @${currentGroup.player.username}...`}
                className="flex-1 bg-[#141417] border border-[#232328] rounded-full px-3.5 py-2 text-[13px] text-[#F4F4F5] placeholder:text-[#8E8E93] focus:outline-none focus:border-[#8B5CF6]"
              />
              <button
                type="submit"
                disabled={!replyText.trim() || sendingReply}
                className="min-w-[40px] min-h-[40px] rounded-full bg-[#FFFFFF] text-[#0B0B0D] flex items-center justify-center disabled:opacity-40"
                aria-label="Balas ke chat"
              >
                <Send className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </form>
          )}

          {replySentPeer && (
            <div className="flex items-center justify-between px-3 py-2 rounded-[10px] bg-[#141417] border border-[#232328] text-[12px]">
              <span className="text-[#E5E5E7]">Balasan terkirim ke chat</span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDmChat(replySentPeer);
                }}
                className="text-[#8B5CF6] font-semibold hover:underline"
              >
                Buka Chat
              </button>
            </div>
          )}
        </div>

        {/* Viewers Drawer */}
        {viewersOpen && (
          <div className="absolute inset-0 z-30 bg-black/75 flex items-end">
            <div className="w-full max-h-[65%] bg-[#141417] border-t border-[#232328] rounded-t-[16px] flex flex-col overflow-hidden">
              <div className="px-4 h-12 border-b border-[#232328] flex items-center justify-between">
                <span className="font-display text-[14px] font-bold text-[#F4F4F5] tabular-nums">
                  Dilihat oleh {viewers.length}
                </span>
                <button
                  type="button"
                  onClick={() => setViewersOpen(false)}
                  className="min-w-[36px] min-h-[36px] flex items-center justify-center text-[#8E8E93]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-2">
                {viewers.length === 0 ? (
                  <p className="py-10 text-center text-[13px] text-[#8E8E93]">Belum ada penonton</p>
                ) : (
                  viewers.map((v) => (
                    <div
                      key={v.id}
                      className="py-2.5 flex items-center justify-between border-b border-[#232328] last:border-0"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (v.player) {
                            onClose();
                            onOpenProfile(v.player.username);
                          }
                        }}
                        className="flex items-center gap-2.5 text-left"
                      >
                        <Avatar player={v.player} size={32} />
                        <div>
                          <div className="text-[13px] font-semibold text-[#F4F4F5]">
                            {v.player?.name || 'Pengguna'}
                          </div>
                          <div className="text-[12px] text-[#8E8E93]">@{v.player?.username}</div>
                        </div>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
