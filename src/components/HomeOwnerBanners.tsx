import React, { useEffect, useState } from 'react';
import { Check, Clock, Coins, Gift, Megaphone, X } from 'lucide-react';
import type { Giveaway, OwnerBroadcast } from '../types';
import { formatNumber } from '../utils/format';
import { formatCountdown, formatWibTimeLabel } from '../utils/wib';

interface HomeOwnerBannersProps {
  broadcasts: OwnerBroadcast[];
  giveaways: Giveaway[];
  isOwner: boolean;
  onClaimGiveaway: (giveawayId: string) => Promise<void>;
  onOpenOwnerPanel?: () => void;
}

export const HomeOwnerBanners: React.FC<HomeOwnerBannersProps> = ({
  broadcasts,
  giveaways,
  isOwner,
  onClaimGiveaway,
  onOpenOwnerPanel,
}) => {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [dismissedIds, setDismissedIds] = useState<Record<string, boolean>>({});
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimErrors, setClaimErrors] = useState<Record<string, string>>({});

  const hasTimedContent = broadcasts.length > 0 || giveaways.length > 0;
  useEffect(() => {
    if (!hasTimedContent) return;
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [hasTimedContent]);

  const activeBroadcasts = broadcasts.filter((b) => {
    if (dismissedIds[b.id]) return false;
    if (!b.is_active) return false;
    const schedMs = new Date(b.scheduled_at).getTime();
    return Number.isFinite(schedMs) && schedMs <= nowMs;
  });

  const visibleGiveaways = giveaways.filter((g) => g.status !== 'cancelled');

  if (activeBroadcasts.length === 0 && visibleGiveaways.length === 0) {
    return null;
  }

  return (
    <div className="mx-3 mt-1.5 flex flex-col gap-1.5">
      {/* Compact Dismissible Broadcast Bars */}
      {activeBroadcasts.map((bc) => (
        <div
          key={bc.id}
          className="px-3 py-1.5 rounded-xl border flex items-center justify-between gap-2"
          style={{
            background: 'var(--nz-card)',
            borderColor: 'var(--nz-accent)',
          }}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Megaphone
              className="w-3.5 h-3.5 shrink-0"
              style={{ color: 'var(--nz-accent)' }}
              strokeWidth={2}
            />
            <div className="min-w-0 flex-1">
              <p
                className="text-[12px] leading-[1.35] line-clamp-2 break-words"
                style={{ color: 'var(--nz-text)' }}
              >
                <span
                  className="font-bold uppercase tracking-wider text-[10px] mr-1.5"
                  style={{ color: 'var(--nz-accent-text)' }}
                >
                  {bc.title || 'Broadcast'}
                </span>
                {bc.message}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDismissedIds((prev) => ({ ...prev, [bc.id]: true }))}
            className="p-1 shrink-0 opacity-70 hover:opacity-100"
            style={{ color: 'var(--nz-text-muted)' }}
            aria-label="Tutup broadcast"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      {/* Compact Bagi-Bagi Coin WIB Cards */}
      {visibleGiveaways.map((gw) => {
        const startMs = new Date(gw.scheduled_at).getTime();
        const remaining = Math.max(0, gw.max_winners - gw.claimed_count);
        const isFull = gw.status === 'ended' || remaining === 0;
        const isWaiting = !isFull && Number.isFinite(startMs) && nowMs < startMs;
        const err = claimErrors[gw.id];

        return (
          <div
            key={gw.id}
            className="px-3 py-2 rounded-xl border flex flex-col gap-1.5"
            style={{
              background: 'var(--nz-card)',
              borderColor: !isWaiting && !isFull ? 'var(--nz-accent)' : 'var(--nz-border)',
            }}
          >
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'var(--nz-elevated)' }}
                >
                  <Gift className="w-3.5 h-3.5 text-[#FACC15]" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-display text-[12.5px] font-bold truncate">
                      Bagi-Bagi Coin Jam {formatWibTimeLabel(gw.scheduled_at)}
                    </span>
                    {isWaiting ? (
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.2 rounded inline-flex items-center gap-0.5 tabular-nums"
                        style={{ background: 'var(--nz-elevated)', color: '#FACC15' }}
                      >
                        <Clock className="w-2.5 h-2.5" strokeWidth={2} />
                        {formatCountdown(gw.scheduled_at, nowMs)}
                      </span>
                    ) : !isFull ? (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.2 rounded uppercase"
                        style={{ background: 'var(--nz-elevated)', color: '#30D158' }}
                      >
                        LIVE
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] mt-0.5" style={{ color: 'var(--nz-text-muted)' }}>
                    <span className="inline-flex items-center gap-0.5 text-[#FACC15] font-semibold tabular-nums">
                      <Coins className="w-3 h-3" strokeWidth={1.8} />
                      +{formatNumber(gw.amount_per_user)}
                    </span>
                    <span>·</span>
                    <span className="tabular-nums">
                      {isFull
                        ? 'Slot Habis'
                        : `Sisa ${formatNumber(remaining)}/${formatNumber(gw.max_winners)}`}
                    </span>
                  </div>
                </div>
              </div>

              {isOwner ? (
                <button
                  type="button"
                  onClick={onOpenOwnerPanel}
                  className="h-7 px-2.5 rounded-full border text-[11px] font-semibold shrink-0 hover:opacity-90"
                  style={{
                    background: 'var(--nz-elevated)',
                    borderColor: 'var(--nz-border)',
                    color: 'var(--nz-accent-text)',
                  }}
                >
                  {gw.claimed_count}/{gw.max_winners} Klaim
                </button>
              ) : gw.claimed_by_me ? (
                <span className="h-7 px-2.5 rounded-full bg-[#30D158]/15 text-[#30D158] text-[11px] font-bold inline-flex items-center gap-1 shrink-0">
                  <Check className="w-3 h-3" strokeWidth={2.4} />
                  <span>Sudah Diklaim</span>
                </span>
              ) : isFull ? (
                <span
                  className="h-7 px-2.5 rounded-full text-[11px] font-semibold inline-flex items-center shrink-0"
                  style={{ background: 'var(--nz-elevated)', color: 'var(--nz-text-muted)' }}
                >
                  Slot Habis
                </span>
              ) : isWaiting ? (
                <span
                  className="h-7 px-2.5 rounded-full text-[11px] font-semibold inline-flex items-center shrink-0 tabular-nums"
                  style={{ background: 'var(--nz-elevated)', color: 'var(--nz-text-muted)' }}
                >
                  Tunggu WIB
                </span>
              ) : (
                <button
                  type="button"
                  disabled={claimingId === gw.id}
                  onClick={async () => {
                    setClaimingId(gw.id);
                    setClaimErrors((prev) => {
                      const next = { ...prev };
                      delete next[gw.id];
                      return next;
                    });
                    try {
                      await onClaimGiveaway(gw.id);
                    } catch (e: any) {
                      setClaimErrors((prev) => ({
                        ...prev,
                        [gw.id]: e?.message || 'Gagal klaim coin',
                      }));
                    } finally {
                      setClaimingId(null);
                    }
                  }}
                  className="h-7 px-3 rounded-full text-[11.5px] font-bold inline-flex items-center gap-1 shrink-0 hover:opacity-90 active:scale-[0.97] disabled:opacity-50"
                  style={{ background: 'var(--nz-btn-bg)', color: 'var(--nz-btn-text)' }}
                >
                  <span>{claimingId === gw.id ? '...' : 'Klaim Coin'}</span>
                </button>
              )}
            </div>

            {err && <p className="text-[11px] text-[#FF453A] font-medium">{err}</p>}
          </div>
        );
      })}
    </div>
  );
};
