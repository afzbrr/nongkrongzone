import React, { useMemo, useRef, useState } from 'react';
import {
  Camera,
  Check,
  Clock,
  FileText,
  Film,
  Link2,
  Music,
  Upload,
  X,
} from 'lucide-react';
import type { Player } from '../types';
import { api, uploadMediaFile } from '../services/api';
import { THEMES } from '../context/ThemeContext';
import { Avatar } from './Avatar';
import { MediaVideoPlayer } from './PostMedia';

interface CreateModalProps {
  initialMode: 'post' | 'story';
  currentUser: Player;
  allPlayers: Player[];
  onClose: () => void;
  onCreatedPost: () => void;
  onCreatedStory: () => void;
}

type MediaChoice = 'text' | 'image' | 'video';
type StoryDurationHours = 1 | 6 | 12 | 24;

const STORY_DURATIONS: { hours: StoryDurationHours; label: string }[] = [
  { hours: 1, label: '1 Jam' },
  { hours: 6, label: '6 Jam' },
  { hours: 12, label: '12 Jam' },
  { hours: 24, label: '24 Jam' },
];

function getVideoDurationSeconds(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const vid = document.createElement('video');
    vid.preload = 'metadata';

    const cleanup = () => {
      vid.removeAttribute('src');
      vid.load();
      URL.revokeObjectURL(objectUrl);
    };

    vid.onloadedmetadata = () => {
      const duration = Number.isFinite(vid.duration) ? vid.duration : 0;
      cleanup();
      resolve(duration);
    };

    vid.onerror = () => {
      cleanup();
      reject(new Error('Format video tidak terbaca'));
    };

    vid.src = objectUrl;
  });
}

export const CreateModal: React.FC<CreateModalProps> = ({
  initialMode,
  currentUser,
  allPlayers,
  onClose,
  onCreatedPost,
  onCreatedStory,
}) => {
  const [mode, setMode] = useState<'post' | 'story'>(initialMode);

  // Post state
  const [postKind, setPostKind] = useState<MediaChoice>('text');
  const [caption, setCaption] = useState('');
  const [postMediaUrl, setPostMediaUrl] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Story state
  const [storyKind, setStoryKind] = useState<MediaChoice>('text');
  const [storyMediaUrl, setStoryMediaUrl] = useState('');
  const [storyText, setStoryText] = useState('');
  const [selectedThemeId, setSelectedThemeId] = useState(THEMES[0].id);
  const [durationHours, setDurationHours] = useState<StoryDurationHours>(24);
  const [showMusic, setShowMusic] = useState(false);
  const [songTitle, setSongTitle] = useState('');
  const [songArtist, setSongArtist] = useState('');
  const [songUrl, setSongUrl] = useState('');

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const postImageRef = useRef<HTMLInputElement | null>(null);
  const postVideoRef = useRef<HTMLInputElement | null>(null);
  const storyImageRef = useRef<HTMLInputElement | null>(null);
  const storyVideoRef = useRef<HTMLInputElement | null>(null);
  const songFileRef = useRef<HTMLInputElement | null>(null);

  const selectedTheme = useMemo(
    () => THEMES.find((t) => t.id === selectedThemeId) || THEMES[0],
    [selectedThemeId]
  );

  const mentionQuery = useMemo(() => {
    const match = caption.match(/(?:^|\s)@([a-zA-Z0-9_]*)$/);
    return match ? match[1].toLowerCase() : null;
  }, [caption]);

  const mentionCandidates = useMemo(() => {
    if (mentionQuery === null) return [];
    return allPlayers
      .filter(
        (p) =>
          p.username.toLowerCase().includes(mentionQuery) ||
          p.name.toLowerCase().includes(mentionQuery)
      )
      .slice(0, 5);
  }, [allPlayers, mentionQuery]);

  const insertMention = (username: string) => {
    setCaption((prev) => prev.replace(/@([a-zA-Z0-9_]*)$/, `@${username} `));
  };

  const handleSelectPostKind = (kind: MediaChoice) => {
    setError(null);
    if (kind !== postKind) {
      setPostMediaUrl('');
      setShowUrlInput(false);
      setUrlInput('');
    }
    setPostKind(kind);
  };

  const handleSelectStoryKind = (kind: MediaChoice) => {
    setError(null);
    if (kind !== storyKind) {
      setStoryMediaUrl('');
    }
    setStoryKind(kind);
  };

  const handleUploadPostImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Pilih file foto yang valid');
      e.target.value = '';
      return;
    }
    setUploading(true);
    try {
      const res = await uploadMediaFile(file);
      setPostMediaUrl(res.url);
    } catch (err: any) {
      setError(err?.message || 'Gagal mengunggah foto');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleUploadPostVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (!file.type.startsWith('video/')) {
      setError('Pilih file video yang valid');
      e.target.value = '';
      return;
    }
    setUploading(true);
    try {
      const duration = await getVideoDurationSeconds(file);
      if (duration > 60) {
        setError('Durasi video postingan maksimal 60 detik');
        setUploading(false);
        e.target.value = '';
        return;
      }
      const res = await uploadMediaFile(file);
      setPostMediaUrl(res.url);
    } catch (err: any) {
      setError(err?.message || 'Gagal mengunggah video');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleUploadStoryImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Pilih file foto yang valid');
      e.target.value = '';
      return;
    }
    setUploading(true);
    try {
      const res = await uploadMediaFile(file);
      setStoryMediaUrl(res.url);
    } catch (err: any) {
      setError(err?.message || 'Gagal mengunggah foto story');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleUploadStoryVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (!file.type.startsWith('video/')) {
      setError('Pilih file video yang valid');
      e.target.value = '';
      return;
    }
    setUploading(true);
    try {
      const duration = await getVideoDurationSeconds(file);
      if (duration > 15) {
        setError('Durasi video story maksimal 15 detik');
        setUploading(false);
        e.target.value = '';
        return;
      }
      const res = await uploadMediaFile(file);
      setStoryMediaUrl(res.url);
    } catch (err: any) {
      setError(err?.message || 'Gagal mengunggah video story');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleUploadSongFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const res = await uploadMediaFile(file);
      setSongUrl(res.url);
      if (!songTitle) {
        setSongTitle(file.name.replace(/\.[^.]+$/, ''));
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal mengunggah audio');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleApplyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    setPostMediaUrl(trimmed);
    setUrlInput('');
    setShowUrlInput(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || uploading) return;
    setError(null);
    setSubmitting(true);

    try {
      if (mode === 'post') {
        if (postKind === 'text') {
          if (!caption.trim()) {
            setError('Tulis isi postingan terlebih dahulu');
            setSubmitting(false);
            return;
          }
          await api.createPost({
            caption: caption.trim(),
            media_urls: [],
            media_type: 'text',
          });
        } else {
          if (!postMediaUrl.trim()) {
            setError(postKind === 'video' ? 'Pilih 1 video dulu (maks 60 detik)' : 'Pilih 1 foto dulu');
            setSubmitting(false);
            return;
          }
          await api.createPost({
            caption: caption.trim(),
            media_urls: [postMediaUrl.trim()],
            media_type: postKind,
          });
        }
        onCreatedPost();
        onClose();
      } else {
        if (storyKind === 'text') {
          if (!storyText.trim()) {
            setError('Tulis teks story terlebih dahulu');
            setSubmitting(false);
            return;
          }
          await api.createStory({
            media_type: 'text',
            media_url: null,
            text: storyText.trim(),
            caption: storyText.trim(),
            bg_color: selectedTheme.bg,
            duration_hours: durationHours,
            song_title: songTitle.trim() || undefined,
            song_artist: songArtist.trim() || undefined,
            song_url: songUrl.trim() || undefined,
          });
        } else {
          if (!storyMediaUrl.trim()) {
            setError(storyKind === 'video' ? 'Pilih 1 video story (maks 15 detik)' : 'Pilih 1 foto story');
            setSubmitting(false);
            return;
          }
          await api.createStory({
            media_url: storyMediaUrl.trim(),
            media_type: storyKind,
            text: storyText.trim() || undefined,
            caption: storyText.trim() || undefined,
            bg_color: '#000000',
            duration_hours: durationHours,
            song_title: songTitle.trim() || undefined,
            song_artist: songArtist.trim() || undefined,
            song_url: songUrl.trim() || undefined,
          });
        }
        onCreatedStory();
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal mempublikasikan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center">
      <div
        className="w-full max-w-[480px] max-h-[92dvh] border rounded-t-[16px] sm:rounded-[16px] flex flex-col overflow-hidden"
        style={{ background: 'var(--nz-modal-bg)', borderColor: 'var(--nz-border)' }}
      >
        {/* Header */}
        <div
          className="px-4 h-12 border-b flex items-center justify-between shrink-0"
          style={{ borderColor: 'var(--nz-border)' }}
        >
          <div
            className="flex items-center gap-1 p-0.5 rounded-[8px] border"
            style={{ background: 'var(--nz-elevated)', borderColor: 'var(--nz-border)' }}
          >
            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode('post');
              }}
              className="px-3 py-1 text-[12px] font-semibold rounded-[6px] transition-colors"
              style={
                mode === 'post'
                  ? { background: 'var(--nz-btn-bg)', color: 'var(--nz-btn-text)' }
                  : { color: 'var(--nz-text-muted)' }
              }
            >
              Postingan
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode('story');
              }}
              className="px-3 py-1 text-[12px] font-semibold rounded-[6px] transition-colors"
              style={
                mode === 'story'
                  ? { background: 'var(--nz-btn-bg)', color: 'var(--nz-btn-text)' }
                  : { color: 'var(--nz-text-muted)' }
              }
            >
              Story
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center"
            style={{ color: 'var(--nz-text-muted)' }}
            aria-label="Tutup"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <Avatar player={currentUser} size={32} />
            <div>
              <div className="font-display text-[13px] font-bold" style={{ color: 'var(--nz-text)' }}>
                {currentUser.name}
              </div>
              <div className="text-[12px]" style={{ color: 'var(--nz-text-muted)' }}>
                @{currentUser.username}
              </div>
            </div>
          </div>

          {error && (
            <div className="px-3 py-2 rounded-[10px] border border-[#FF453A]/40 bg-[#FF453A]/10 text-[12px] text-[#FF453A]">
              {error}
            </div>
          )}

          {mode === 'post' ? (
            <>
              <textarea
                rows={3}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Lagi nongkrong di mana? Ketik @username untuk tag teman..."
                className="w-full border rounded-[12px] p-3 text-[13.5px] leading-[1.5] focus:outline-none resize-none"
                style={{
                  background: 'var(--nz-elevated)',
                  borderColor: 'var(--nz-border)',
                  color: 'var(--nz-text)',
                }}
              />

              {mentionCandidates.length > 0 && (
                <div
                  className="border rounded-[10px]"
                  style={{ background: 'var(--nz-elevated)', borderColor: 'var(--nz-border)' }}
                >
                  {mentionCandidates.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => insertMention(p.username)}
                      className="w-full px-3 py-2 flex items-center gap-2 text-left border-b last:border-b-0"
                      style={{ borderColor: 'var(--nz-border)' }}
                    >
                      <Avatar player={p} size={28} />
                      <span className="text-[13px] font-medium" style={{ color: 'var(--nz-text)' }}>
                        {p.name}
                      </span>
                      <span className="text-[12px]" style={{ color: 'var(--nz-accent-text)' }}>
                        @{p.username}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* 3 Post Choices: Teks | Foto | Video */}
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'text', label: 'Teks', icon: FileText },
                    { id: 'image', label: 'Foto', icon: Camera },
                    { id: 'video', label: 'Video', icon: Film },
                  ] as const
                ).map((item) => {
                  const Icon = item.icon;
                  const active = postKind === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectPostKind(item.id)}
                      className="h-10 rounded-[10px] border text-[12.5px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      style={
                        active
                          ? {
                              background: 'var(--nz-btn-bg)',
                              color: 'var(--nz-btn-text)',
                              borderColor: 'transparent',
                            }
                          : {
                              background: 'var(--nz-elevated)',
                              borderColor: 'var(--nz-border)',
                              color: 'var(--nz-text)',
                            }
                      }
                    >
                      <Icon className="w-4 h-4" strokeWidth={1.75} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <input
                ref={postImageRef}
                type="file"
                accept="image/*"
                onChange={handleUploadPostImage}
                className="hidden"
              />
              <input
                ref={postVideoRef}
                type="file"
                accept="video/*"
                onChange={handleUploadPostVideo}
                className="hidden"
              />

              {postKind === 'image' && (
                <div className="flex flex-col gap-2">
                  {postMediaUrl ? (
                    <div
                      className="relative rounded-[12px] overflow-hidden border bg-black flex items-center justify-center"
                      style={{ borderColor: 'var(--nz-border)' }}
                    >
                      <img
                        src={postMediaUrl}
                        alt="Preview Foto"
                        referrerPolicy="no-referrer"
                        className="max-w-full w-auto h-auto max-h-[80vh] object-contain mx-auto block bg-black"
                      />
                      <button
                        type="button"
                        onClick={() => setPostMediaUrl('')}
                        className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/80 text-white flex items-center justify-center border border-white/20"
                        aria-label="Hapus foto"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => postImageRef.current?.click()}
                      disabled={uploading}
                      className="w-full py-8 rounded-[12px] border border-dashed flex flex-col items-center justify-center gap-2 disabled:opacity-50"
                      style={{
                        background: 'var(--nz-elevated)',
                        borderColor: 'var(--nz-border)',
                        color: 'var(--nz-text-muted)',
                      }}
                    >
                      <Upload className="w-5 h-5" strokeWidth={1.5} />
                      <span className="text-[12.5px] font-medium">
                        {uploading ? 'Mengunggah foto...' : 'Pilih 1 Foto (Ukuran Asli, Tanpa Crop)'}
                      </span>
                    </button>
                  )}

                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => setShowUrlInput((v) => !v)}
                      className="text-[11.5px] flex items-center gap-1 hover:underline"
                      style={{ color: 'var(--nz-text-muted)' }}
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      <span>Pakai URL foto</span>
                    </button>
                  </div>
                </div>
              )}

              {postKind === 'video' && (
                <div className="flex flex-col gap-2">
                  {postMediaUrl ? (
                    <div
                      className="relative rounded-[12px] overflow-hidden border bg-black"
                      style={{ borderColor: 'var(--nz-border)' }}
                    >
                      <MediaVideoPlayer src={postMediaUrl} maxHeightClass="max-h-[80vh]" />
                      <button
                        type="button"
                        onClick={() => setPostMediaUrl('')}
                        className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/80 text-white flex items-center justify-center border border-white/20 z-20"
                        aria-label="Hapus video"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => postVideoRef.current?.click()}
                      disabled={uploading}
                      className="w-full py-8 rounded-[12px] border border-dashed flex flex-col items-center justify-center gap-2 disabled:opacity-50"
                      style={{
                        background: 'var(--nz-elevated)',
                        borderColor: 'var(--nz-border)',
                        color: 'var(--nz-text-muted)',
                      }}
                    >
                      <Film className="w-5 h-5" strokeWidth={1.5} />
                      <span className="text-[12.5px] font-medium">
                        {uploading ? 'Memeriksa & mengunggah video...' : 'Pilih 1 Video (Maks 60 Detik)'}
                      </span>
                    </button>
                  )}

                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => setShowUrlInput((v) => !v)}
                      className="text-[11.5px] flex items-center gap-1 hover:underline"
                      style={{ color: 'var(--nz-text-muted)' }}
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      <span>Pakai URL video</span>
                    </button>
                  </div>
                </div>
              )}

              {showUrlInput && postKind !== 'text' && (
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder={postKind === 'video' ? 'https://... (.mp4/.webm)' : 'https://... (URL foto)'}
                    className="flex-1 border rounded-[10px] px-3 py-2 text-[12.5px] focus:outline-none"
                    style={{
                      background: 'var(--nz-elevated)',
                      borderColor: 'var(--nz-border)',
                      color: 'var(--nz-text)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyUrl}
                    className="h-9 px-3 rounded-[10px] text-[12px] font-semibold"
                    style={{ background: 'var(--nz-btn-bg)', color: 'var(--nz-btn-text)' }}
                  >
                    Pakai
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              {/* 3 Story Choices: Teks | Foto | Video */}
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'text', label: 'Teks', icon: FileText },
                    { id: 'image', label: 'Foto', icon: Camera },
                    { id: 'video', label: 'Video', icon: Film },
                  ] as const
                ).map((item) => {
                  const Icon = item.icon;
                  const active = storyKind === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectStoryKind(item.id)}
                      className="h-10 rounded-[10px] border text-[12.5px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      style={
                        active
                          ? {
                              background: 'var(--nz-btn-bg)',
                              color: 'var(--nz-btn-text)',
                              borderColor: 'transparent',
                            }
                          : {
                              background: 'var(--nz-elevated)',
                              borderColor: 'var(--nz-border)',
                              color: 'var(--nz-text)',
                            }
                      }
                    >
                      <Icon className="w-4 h-4" strokeWidth={1.75} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <input
                ref={storyImageRef}
                type="file"
                accept="image/*"
                onChange={handleUploadStoryImage}
                className="hidden"
              />
              <input
                ref={storyVideoRef}
                type="file"
                accept="video/*"
                onChange={handleUploadStoryVideo}
                className="hidden"
              />

              {storyKind === 'text' ? (
                <>
                  {/* Live Story Text Preview */}
                  <div
                    className="w-full min-h-[210px] rounded-[14px] border p-5 flex items-center justify-center text-center transition-all"
                    style={{
                      background: selectedTheme.bg,
                      borderColor: 'var(--nz-border)',
                    }}
                  >
                    <p
                      className="font-display text-[19px] font-bold leading-[1.35] break-words max-w-full"
                      style={{ color: selectedTheme.isLight ? '#111111' : '#FFFFFF' }}
                    >
                      {storyText.trim() || 'Tulis sesuatu untuk Story kamu...'}
                    </p>
                  </div>

                  {/* 11 Theme Color Picker */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11.5px] font-medium" style={{ color: 'var(--nz-text-muted)' }}>
                      Pilih Warna Background ({selectedTheme.name})
                    </span>
                    <div className="grid grid-cols-6 gap-2">
                      {THEMES.map((t) => {
                        const isSelected = t.id === selectedThemeId;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setSelectedThemeId(t.id)}
                            title={t.name}
                            aria-label={`Background ${t.name}`}
                            className="h-9 rounded-[10px] border flex items-center justify-center transition-transform active:scale-95"
                            style={{
                              background: t.bg,
                              borderColor: isSelected ? 'var(--nz-accent)' : 'var(--nz-border)',
                              boxShadow: isSelected ? '0 0 0 2px var(--nz-accent)' : undefined,
                            }}
                          >
                            {isSelected && (
                              <Check
                                className="w-4 h-4"
                                style={{ color: t.isLight ? '#111111' : '#FFFFFF' }}
                                strokeWidth={2.5}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    value={storyText}
                    onChange={(e) => setStoryText(e.target.value)}
                    placeholder="Tulis teks story..."
                    className="w-full border rounded-[12px] p-3 text-[13.5px] leading-[1.5] focus:outline-none resize-none"
                    style={{
                      background: 'var(--nz-elevated)',
                      borderColor: 'var(--nz-border)',
                      color: 'var(--nz-text)',
                    }}
                  />
                </>
              ) : storyKind === 'image' ? (
                <>
                  {storyMediaUrl ? (
                    <div
                      className="relative rounded-[12px] overflow-hidden border bg-black flex items-center justify-center"
                      style={{ borderColor: 'var(--nz-border)' }}
                    >
                      <img
                        src={storyMediaUrl}
                        alt="Preview Story"
                        referrerPolicy="no-referrer"
                        className="max-w-full w-auto h-auto max-h-[80vh] object-contain mx-auto block bg-black"
                      />
                      {storyText.trim() && (
                        <div className="absolute bottom-3 inset-x-3 flex justify-center pointer-events-none">
                          <span className="px-3 py-1.5 rounded-[10px] bg-black/60 backdrop-blur-xs text-white text-[13px] text-center max-w-full break-words">
                            {storyText.trim()}
                          </span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setStoryMediaUrl('')}
                        className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/80 text-white flex items-center justify-center border border-white/20"
                        aria-label="Hapus foto story"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => storyImageRef.current?.click()}
                      disabled={uploading}
                      className="w-full py-10 rounded-[12px] border border-dashed flex flex-col items-center justify-center gap-2 disabled:opacity-50"
                      style={{
                        background: 'var(--nz-elevated)',
                        borderColor: 'var(--nz-border)',
                        color: 'var(--nz-text-muted)',
                      }}
                    >
                      <Camera className="w-5 h-5" strokeWidth={1.5} />
                      <span className="text-[12.5px] font-medium">
                        {uploading ? 'Mengunggah foto...' : 'Pilih 1 Foto Story (Ukuran Asli)'}
                      </span>
                    </button>
                  )}

                  <input
                    type="text"
                    value={storyText}
                    onChange={(e) => setStoryText(e.target.value)}
                    placeholder="Tambahkan teks di bawah foto (opsional)..."
                    className="w-full border rounded-[10px] px-3 py-2 text-[13px] focus:outline-none"
                    style={{
                      background: 'var(--nz-elevated)',
                      borderColor: 'var(--nz-border)',
                      color: 'var(--nz-text)',
                    }}
                  />
                </>
              ) : (
                <>
                  {storyMediaUrl ? (
                    <div
                      className="relative rounded-[12px] overflow-hidden border bg-black"
                      style={{ borderColor: 'var(--nz-border)' }}
                    >
                      <MediaVideoPlayer src={storyMediaUrl} maxHeightClass="max-h-[80vh]" />
                      {storyText.trim() && (
                        <div className="px-3 py-2 bg-black/75 border-t border-white/10 text-center text-white text-[12.5px]">
                          {storyText.trim()}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setStoryMediaUrl('')}
                        className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/80 text-white flex items-center justify-center border border-white/20 z-20"
                        aria-label="Hapus video story"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => storyVideoRef.current?.click()}
                      disabled={uploading}
                      className="w-full py-10 rounded-[12px] border border-dashed flex flex-col items-center justify-center gap-2 disabled:opacity-50"
                      style={{
                        background: 'var(--nz-elevated)',
                        borderColor: 'var(--nz-border)',
                        color: 'var(--nz-text-muted)',
                      }}
                    >
                      <Film className="w-5 h-5" strokeWidth={1.5} />
                      <span className="text-[12.5px] font-medium">
                        {uploading ? 'Memeriksa & mengunggah video...' : 'Pilih 1 Video Story (Maks 15 Detik)'}
                      </span>
                    </button>
                  )}

                  <input
                    type="text"
                    value={storyText}
                    onChange={(e) => setStoryText(e.target.value)}
                    placeholder="Tambahkan teks di bawah video (opsional)..."
                    className="w-full border rounded-[10px] px-3 py-2 text-[13px] focus:outline-none"
                    style={{
                      background: 'var(--nz-elevated)',
                      borderColor: 'var(--nz-border)',
                      color: 'var(--nz-text)',
                    }}
                  />
                </>
              )}

              {/* Mandatory Story Duration Picker: 1 Jam | 6 Jam | 12 Jam | 24 Jam */}
              <div className="flex flex-col gap-1.5 pt-1">
                <div className="flex items-center gap-1.5 text-[11.5px] font-medium" style={{ color: 'var(--nz-text-muted)' }}>
                  <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>Durasi Story</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {STORY_DURATIONS.map((opt) => {
                    const active = durationHours === opt.hours;
                    return (
                      <button
                        key={opt.hours}
                        type="button"
                        onClick={() => setDurationHours(opt.hours)}
                        className="h-9 rounded-full border text-[12px] font-semibold transition-colors"
                        style={
                          active
                            ? {
                                background: 'var(--nz-btn-bg)',
                                color: 'var(--nz-btn-text)',
                                borderColor: 'transparent',
                              }
                            : {
                                background: 'var(--nz-elevated)',
                                borderColor: 'var(--nz-border)',
                                color: 'var(--nz-text)',
                              }
                        }
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Collapsible Music Section */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowMusic((v) => !v)}
                  className="text-[12px] flex items-center gap-1.5 py-1 hover:underline"
                  style={{ color: 'var(--nz-accent-text)' }}
                >
                  <Music className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>{showMusic ? 'Tutup Musik Story' : '+ Tambah Musik Story (Opsional)'}</span>
                </button>

                {showMusic && (
                  <div
                    className="mt-2 p-3 rounded-[12px] border flex flex-col gap-2"
                    style={{ background: 'var(--nz-elevated)', borderColor: 'var(--nz-border)' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-medium" style={{ color: 'var(--nz-text)' }}>
                        Musik Latar
                      </span>
                      <input
                        ref={songFileRef}
                        type="file"
                        accept="audio/*"
                        onChange={handleUploadSongFile}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => songFileRef.current?.click()}
                        className="text-[11px] hover:underline"
                        style={{ color: 'var(--nz-accent-text)' }}
                      >
                        Upload Audio
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={songTitle}
                        onChange={(e) => setSongTitle(e.target.value)}
                        placeholder="Judul lagu"
                        className="border rounded-[8px] px-2.5 py-1.5 text-[12px] focus:outline-none"
                        style={{
                          background: 'var(--nz-card)',
                          borderColor: 'var(--nz-border)',
                          color: 'var(--nz-text)',
                        }}
                      />
                      <input
                        type="text"
                        value={songArtist}
                        onChange={(e) => setSongArtist(e.target.value)}
                        placeholder="Artis"
                        className="border rounded-[8px] px-2.5 py-1.5 text-[12px] focus:outline-none"
                        style={{
                          background: 'var(--nz-card)',
                          borderColor: 'var(--nz-border)',
                          color: 'var(--nz-text)',
                        }}
                      />
                    </div>
                    <input
                      type="url"
                      value={songUrl}
                      onChange={(e) => setSongUrl(e.target.value)}
                      placeholder="URL audio (.mp3 / .m4a)"
                      className="border rounded-[8px] px-2.5 py-1.5 text-[12px] focus:outline-none"
                      style={{
                        background: 'var(--nz-card)',
                        borderColor: 'var(--nz-border)',
                        color: 'var(--nz-text)',
                      }}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-[10px] text-[13px]"
              style={{ color: 'var(--nz-text-muted)' }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || uploading}
              className="h-10 px-5 rounded-[10px] text-[13px] font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity"
              style={{ background: 'var(--nz-btn-bg)', color: 'var(--nz-btn-text)' }}
            >
              {submitting ? 'Memproses...' : mode === 'post' ? 'Bagikan' : 'Terbitkan Story'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
