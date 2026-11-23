import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ImageOff, Play, Volume2, VolumeX } from 'lucide-react';
import { sanitizeMediaUrl } from '../utils/format';

interface MediaVideoPlayerProps {
  src: string;
  maxHeightClass?: string;
  autoPlay?: boolean;
  onError?: () => void;
}

export const MediaVideoPlayer: React.FC<MediaVideoPlayerProps> = ({
  src,
  maxHeightClass = 'max-h-[80vh]',
  autoPlay = false,
  onError,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    setIsPlaying(false);
  }, [src]);

  const handlePlayToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid.play().catch(() => {});
    } else {
      vid.pause();
    }
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const vid = videoRef.current;
    if (!vid) return;
    const nextMuted = !vid.muted;
    vid.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  return (
    <div className="relative flex items-center justify-center bg-black w-full">
      <video
        ref={videoRef}
        src={src}
        controls
        playsInline
        autoPlay={autoPlay}
        muted={isMuted}
        preload="metadata"
        className={`max-w-full w-auto h-auto ${maxHeightClass} object-contain mx-auto block bg-black`}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onVolumeChange={() => {
          if (videoRef.current) setIsMuted(videoRef.current.muted);
        }}
        onError={onError}
      />

      {!isPlaying && (
        <button
          type="button"
          onClick={handlePlayToggle}
          aria-label="Putar video"
          className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-black/75 border border-white/25 text-white flex items-center justify-center hover:bg-black/90 active:scale-95 transition-all z-10 shadow-lg"
        >
          <Play className="w-6 h-6 fill-white ml-0.5" strokeWidth={1.75} />
        </button>
      )}

      <button
        type="button"
        onClick={handleMuteToggle}
        aria-label={isMuted ? 'Nyalakan suara video' : 'Bisukan suara video'}
        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/70 border border-white/20 text-white flex items-center justify-center hover:bg-black/85 active:scale-95 transition-all z-10"
      >
        {isMuted ? (
          <VolumeX className="w-4 h-4" strokeWidth={1.75} />
        ) : (
          <Volume2 className="w-4 h-4" strokeWidth={1.75} />
        )}
      </button>
    </div>
  );
};

interface PostMediaProps {
  mediaUrls?: string[] | null;
  mediaType?: string | null;
}

function isVideoUrl(url: string, mediaType?: string | null): boolean {
  if (mediaType === 'video') return true;
  return /\.(mp4|webm|mov|m4v|3gp)(\?|$)/i.test(url);
}

export const PostMedia: React.FC<PostMediaProps> = ({ mediaUrls, mediaType }) => {
  const validUrls = (mediaUrls || [])
    .map((u) => sanitizeMediaUrl(u))
    .filter((u): u is string => Boolean(u));

  const [index, setIndex] = useState(0);
  const [failedIndices, setFailedIndices] = useState<Record<number, boolean>>({});

  if (validUrls.length === 0) return null;

  const currentIndex = Math.min(index, validUrls.length - 1);
  const currentUrl = validUrls[currentIndex];
  const isVideo = isVideoUrl(currentUrl, validUrls.length === 1 ? mediaType : undefined);
  const hasFailed = failedIndices[currentIndex];

  return (
    <div className="relative w-full bg-black overflow-hidden flex items-center justify-center">
      {hasFailed ? (
        <div className="w-full py-16 flex flex-col items-center justify-center gap-2 bg-[#141417] text-[#8E8E93]">
          <ImageOff className="w-5 h-5" strokeWidth={1.5} />
          <span className="text-xs">Media tidak dapat dimuat</span>
        </div>
      ) : isVideo ? (
        <MediaVideoPlayer
          src={currentUrl}
          maxHeightClass="max-h-[80vh]"
          onError={() => setFailedIndices((prev) => ({ ...prev, [currentIndex]: true }))}
        />
      ) : (
        <img
          src={currentUrl}
          alt="Media postingan"
          referrerPolicy="no-referrer"
          className="max-w-full w-auto h-auto max-h-[80vh] object-contain mx-auto block bg-black"
          onError={() => setFailedIndices((prev) => ({ ...prev, [currentIndex]: true }))}
        />
      )}

      {validUrls.length > 1 && (
        <>
          <div className="absolute top-3 left-3 px-2 py-0.5 rounded-[8px] bg-black/75 text-[#F4F4F5] text-[11px] font-medium tabular-nums border border-white/10">
            {currentIndex + 1}/{validUrls.length}
          </div>

          {currentIndex > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIndex((i) => Math.max(0, i - 1));
              }}
              aria-label="Media sebelumnya"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/65 text-white flex items-center justify-center hover:bg-black/85 transition-colors z-10"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />
            </button>
          )}

          {currentIndex < validUrls.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIndex((i) => Math.min(validUrls.length - 1, i + 1));
              }}
              aria-label="Media berikutnya"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/65 text-white flex items-center justify-center hover:bg-black/85 transition-colors z-10"
            >
              <ChevronRight className="w-4 h-4" strokeWidth={1.75} />
            </button>
          )}

          <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-1.5 pointer-events-none">
            {validUrls.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Slide ${i + 1}`}
                className={`pointer-events-auto h-1.5 rounded-full transition-all duration-200 ${
                  i === currentIndex ? 'w-4 bg-[#F4F4F5]' : 'w-1.5 bg-[#8E8E93]/40'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
