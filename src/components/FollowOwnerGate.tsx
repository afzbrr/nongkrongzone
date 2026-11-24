import React, { useEffect, useState } from 'react';
import { Coins, Lock, RefreshCw, UserPlus } from 'lucide-react';
import type { Player } from '../types';
import { api } from '../services/api';
import { formatNumber } from '../utils/format';
import { Avatar } from './Avatar';
import { BrandLogo } from './BrandLogo';
import { OwnerBadge } from './PlayerBadges';

interface FollowOwnerGateProps {
  currentUser: Player;
  ownerPlayer: Player | null;
  onFollowedOwner: (resolvedOwner: Player) => void;
}

export const FollowOwnerGate: React.FC<FollowOwnerGateProps> = ({
  currentUser,
  ownerPlayer: initialOwner,
  onFollowedOwner,
}) => {
  const [owner, setOwner] = useState<Player | null>(initialOwner);
  const [loadingOwner, setLoadingOwner] = useState(!initialOwner);
  const [followingBusy, setFollowingBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialOwner) {
      setOwner(initialOwner);
      setLoadingOwner(false);
      return;
    }
    let cancelled = false;
    setLoadingOwner(true);
    api
      .getPlayers()
      .then((res) => {
        if (cancelled) return;
        const found =
          res.players.find((p) => p.is_owner || p.telegram_id === 6189849073) || null;
        setOwner(found);
      })
      .catch(() => {
        if (!cancelled) setOwner(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingOwner(false);
      });
    return () => {
      cancelled = true;
    };
  }, [initialOwner]);

  const handleFollowAndEnter = async () => {
    if (!owner || followingBusy) return;
    setFollowingBusy(true);
    setError(null);
    try {
      try {
        await api.follow(owner.id);
      } catch (followErr: any) {
        if (/diblokir/i.test(followErr?.message || '')) {
          await api.unblock(owner.id);
          await api.follow(owner.id);
        } else {
          throw followErr;
        }
      }
      onFollowedOwner(owner);
    } catch (err: any) {
      setError(err?.message || 'Gagal follow akun Owner. Coba lagi.');
    } finally {
      setFollowingBusy(false);
    }
  };

  return (
    <div
      className="min-h-dvh flex justify-center"
      style={{ background: 'var(--nz-bg)', color: 'var(--nz-text)' }}
    >
      <div
        className="w-full max-w-[480px] min-h-dvh sm:border-x flex flex-col"
        style={{ borderColor: 'var(--nz-border)' }}
      >
        <header
          className="h-[48px] px-4 border-b flex items-center justify-between"
          style={{ background: 'var(--nz-header-bg)', borderColor: 'var(--nz-border)' }}
        >
          <BrandLogo size="sm" />
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11.5px] font-semibold tabular-nums"
            style={{
              background: 'var(--nz-card)',
              borderColor: 'var(--nz-border)',
              color: 'var(--nz-text)',
            }}
          >
            <Coins className="w-3.5 h-3.5 text-[#FACC15]" strokeWidth={1.75} />
            <span>{formatNumber(currentUser.coins)} Coin</span>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-5">
          <div
            className="w-full rounded-[18px] border p-5 flex flex-col items-center text-center gap-4 shadow-xl"
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
              <Lock className="w-5 h-5" strokeWidth={1.75} />
            </div>

            <div className="flex flex-col gap-1.5">
              <h1
                className="font-display text-[17px] font-bold tracking-[-0.4px]"
                style={{ color: 'var(--nz-text)' }}
              >
                Follow Akun Owner Dulu
              </h1>
              <p
                className="text-[12.5px] leading-relaxed max-w-[320px]"
                style={{ color: 'var(--nz-text-muted)' }}
              >
                Untuk masuk ke <strong style={{ color: 'var(--nz-text)' }}>NONGKRONG ZONE</strong>,
                kamu wajib follow akun Owner terlebih dahulu. Jika nanti unfollow, akun akan keluar
                otomatis.
              </p>
            </div>

            {loadingOwner ? (
              <div className="py-6 text-[12.5px]" style={{ color: 'var(--nz-text-muted)' }}>
                Memuat profil Owner...
              </div>
            ) : owner ? (
              <div
                className="w-full rounded-[14px] border p-4 flex flex-col items-center gap-2.5"
                style={{ background: 'var(--nz-elevated)', borderColor: 'var(--nz-border)' }}
              >
                <Avatar player={owner} size={72} />
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  <span
                    className="font-display text-[15px] font-bold"
                    style={{ color: 'var(--nz-text)' }}
                  >
                    {owner.name}
                  </span>
                  <OwnerBadge compact />
                </div>
                <span className="text-[12px]" style={{ color: 'var(--nz-text-muted)' }}>
                  @{owner.username}
                </span>
                {owner.bio && (
                  <p
                    className="text-[12px] leading-snug line-clamp-2"
                    style={{ color: 'var(--nz-text-body)' }}
                  >
                    {owner.bio}
                  </p>
                )}
              </div>
            ) : (
              <div className="py-4 text-[12.5px] text-[#FF453A]">
                Akun Owner belum ditemukan.
              </div>
            )}

            {error && <p className="text-[12px] text-[#FF453A]">{error}</p>}

            {owner ? (
              <button
                type="button"
                disabled={followingBusy}
                onClick={handleFollowAndEnter}
                className="w-full h-11 rounded-full text-[13.5px] font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.99] disabled:opacity-50 transition-all"
                style={{ background: 'var(--nz-btn-bg)', color: 'var(--nz-btn-text)' }}
              >
                <UserPlus className="w-4 h-4" strokeWidth={2} />
                <span>{followingBusy ? 'Memproses...' : 'Follow Owner & Masuk'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full h-10 rounded-full border text-[12.5px] font-semibold flex items-center justify-center gap-1.5"
                style={{
                  background: 'var(--nz-elevated)',
                  borderColor: 'var(--nz-border)',
                  color: 'var(--nz-text)',
                }}
              >
                <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Muat Ulang</span>
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
