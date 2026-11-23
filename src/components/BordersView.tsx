import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, Coins, Crown, Lock } from 'lucide-react';
import type { BorderItem, Player } from '../types';
import { api } from '../services/api';
import { useBorders } from '../context/BordersContext';
import { resolveBorderVisual } from '../utils/borderStyles';
import { formatNumber } from '../utils/format';
import { Avatar } from './Avatar';
import { BorderEffectStage } from './BorderEffectStage';
import { CoinDisplay } from './PlayerBadges';

interface BordersViewProps {
  currentUser: Player;
  onBack?: () => void;
  onPlayerUpdated: (updated: Player) => void;
}

const CATEGORIES = [
  'Semua',
  'Elegant',
  'Aesthetic',
  'Lucu',
  'Couple Cowo',
  'Couple Cewe',
  'Kpopers',
  'Gamers',
  'Toko 3D',
  'Nonton',
  'Prestasi',
  'Hari Besar',
  'Olahraga',
  'Game',
  'Superhero',
  'OWNER',
] as const;

const TAP_BURST_VECTORS = [
  { tx: '-30px', ty: '-26px' },
  { tx: '0px', ty: '-36px' },
  { tx: '30px', ty: '-26px' },
  { tx: '36px', ty: '0px' },
  { tx: '30px', ty: '26px' },
  { tx: '0px', ty: '36px' },
  { tx: '-30px', ty: '26px' },
  { tx: '-36px', ty: '0px' },
];

interface BorderCard3DProps {
  border: BorderItem;
  index: number;
  activeTab: 'koleksi' | 'toko';
  currentUser: Player;
  owned: boolean;
  equipped: boolean;
  isBusy: boolean;
  onEquip: (b: BorderItem) => void;
  onBuy: (b: BorderItem) => void;
}

const BorderCard3D: React.FC<BorderCard3DProps> = ({
  border,
  index,
  activeTab,
  currentUser,
  owned,
  equipped,
  isBusy,
  onEquip,
  onBuy,
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState<{ rx: number; ry: number; active: boolean }>({
    rx: 0,
    ry: 0,
    active: false,
  });
  const [tapBurstKey, setTapBurstKey] = useState(0);
  const [isBouncing, setIsBouncing] = useState(false);

  const visual = resolveBorderVisual(border);
  const isOwnerBorder = visual.isOwnerBadge;

  const updateTiltFromClientPoint = (clientX: number, clientY: number) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const normX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const normY = ((clientY - rect.top) / rect.height) * 2 - 1;
    const clampedX = Math.max(-1, Math.min(1, normX));
    const clampedY = Math.max(-1, Math.min(1, normY));
    setTilt({
      rx: Number((-clampedY * 8).toFixed(2)),
      ry: Number((clampedX * 8).toFixed(2)),
      active: true,
    });
  };

  const resetTilt = () => {
    setTilt({ rx: 0, ry: 0, active: false });
  };

  const triggerTapFeedback = () => {
    setTapBurstKey((prev) => prev + 1);
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 240);
  };

  const scaleVal = isBouncing ? 1.05 : tilt.active ? 1.02 : 1;

  return (
    <div
      className="nz-card-enter"
      style={{
        perspective: '1000px',
        animationDelay: `${index * 50}ms`,
      }}
    >
      <div
        ref={cardRef}
        onMouseMove={(e) => updateTiltFromClientPoint(e.clientX, e.clientY)}
        onMouseLeave={resetTilt}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          if (touch) updateTiltFromClientPoint(touch.clientX, touch.clientY);
          triggerTapFeedback();
        }}
        onTouchMove={(e) => {
          const touch = e.touches[0];
          if (touch) updateTiltFromClientPoint(touch.clientX, touch.clientY);
        }}
        onTouchEnd={resetTilt}
        onClick={triggerTapFeedback}
        style={{
          background: visual.cardBgGradient,
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(${scaleVal})`,
          transformStyle: 'preserve-3d',
          transition: tilt.active
            ? 'transform 60ms linear, box-shadow 220ms ease'
            : 'transform 360ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 260ms ease',
          boxShadow:
            tilt.active || equipped
              ? visual.cardHoverShadow
              : `0 6px 18px rgba(0,0,0,0.28), 0 0 12px ${visual.primaryColor}22`,
        }}
        className={`relative text-[#111113] rounded-2xl p-4 flex flex-col items-center text-center gap-2.5 overflow-hidden select-none ${
          equipped ? 'ring-2 ring-[#8B5CF6]' : 'border border-black/10'
        }`}
      >
        {/* Subtle Soft Bokeh Circles */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
          <span
            className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-xl"
            style={{ background: visual.bokehTint }}
          />
          <span
            className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full blur-xl"
            style={{ background: visual.bokehTint }}
          />
        </div>

        {/* Diagonal Glass Reflection Shine Sweeping Every ~2s */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden z-[1]">
          <div
            className="w-16 h-[160%] -top-[30%] bg-gradient-to-r from-transparent via-white/70 to-transparent nz-glass-sweep"
            style={{ position: 'absolute', left: 0 }}
          />
        </div>

        {/* Mini Tap Particle Burst */}
        {tapBurstKey > 0 && (
          <div
            key={tapBurstKey}
            aria-hidden="true"
            className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40"
          >
            {TAP_BURST_VECTORS.map((vec, i) => (
              <span
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={
                  {
                    backgroundColor: i % 2 === 0 ? visual.primaryColor : visual.secondaryColor,
                    boxShadow: `0 0 6px ${visual.primaryColor}`,
                    '--tx': vec.tx,
                    '--ty': vec.ty,
                    animation: 'tap-burst 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        )}

        {/* 3D Animated Avatar Preview Stage */}
        <BorderEffectStage visual={visual}>
          <Avatar player={currentUser} size={72} overrideBorder={border} use3dFloat />
        </BorderEffectStage>

        <div className="relative z-10 min-w-0 w-full" style={{ transform: 'translateZ(20px)' }}>
          {(() => {
            const catLower = String(border.category || '').toLowerCase();
            const idUpper = String(border.id || '').toUpperCase();
            const isCowo = catLower === 'couple cowo' || idUpper === 'COUPLE_KING' || idUpper === 'COUPLE_MOON_COWO';
            const isCewe = catLower === 'couple cewe' || idUpper === 'COUPLE_QUEEN' || idUpper === 'COUPLE_MOON_CEWE';
            return (
              <>
                <div className="flex items-center justify-center gap-1 flex-wrap">
                  <span className="font-display text-[13px] font-bold tracking-[-0.3px] text-[#111113] leading-tight">
                    {border.name}
                  </span>
                  {isOwnerBorder && (
                    <span className="nz-shimmer-badge text-[9px] font-bold uppercase tracking-wider text-[#78350F] bg-gradient-to-r from-[#FDE68A] via-[#FFD60A] to-[#F59E0B] px-1.5 py-0.5 rounded shadow-xs">
                      OWNER
                    </span>
                  )}
                  {isCowo && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#1D4ED8] bg-[#DBEAFE] border border-[#93C5FD] px-1.5 py-0.5 rounded">
                      COWO
                    </span>
                  )}
                  {isCewe && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#BE185D] bg-[#FCE7F3] border border-[#F9A8D4] px-1.5 py-0.5 rounded">
                      CEWE
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[#6B7280] mt-0.5">
                  {isCowo ? (
                    <span className="font-semibold text-[#1D4ED8]">UNTUK COWO</span>
                  ) : isCewe ? (
                    <span className="font-semibold text-[#BE185D]">UNTUK CEWE</span>
                  ) : (
                    border.category
                  )}
                </div>
              </>
            );
          })()}
        </div>

        <div className="relative z-10 w-full mt-auto pt-1" style={{ transform: 'translateZ(20px)' }}>
          {equipped ? (
            <div className="w-full h-8 rounded-xl bg-[#EEF2FF] text-[#6D28D9] text-[12px] font-semibold flex items-center justify-center gap-1">
              <Check className="w-3.5 h-3.5" strokeWidth={2} />
              <span>Dipakai</span>
            </div>
          ) : currentUser.is_owner ? (
            <button
              type="button"
              disabled={isBusy}
              onClick={(e) => {
                e.stopPropagation();
                triggerTapFeedback();
                onEquip(border);
              }}
              className="w-full h-8 rounded-xl text-[11.5px] font-bold hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-1"
              style={{
                background: 'var(--nz-border-btn-bg)',
                color: 'var(--nz-border-btn-text)',
              }}
            >
              <Crown className="w-3.5 h-3.5 text-[#FFD60A] shrink-0" strokeWidth={2} />
              <span>
                {isBusy
                  ? 'Memakai...'
                  : activeTab === 'toko'
                    ? 'GRATIS - OWNER'
                    : 'PAKAI'}
              </span>
            </button>
          ) : isOwnerBorder ? (
            <button
              type="button"
              disabled
              className="w-full h-8 px-2 rounded-xl bg-[#E5E7EB] text-[#6B7280] text-[11px] font-bold flex items-center justify-center gap-1 cursor-not-allowed"
            >
              <Lock className="w-3 h-3 shrink-0" strokeWidth={2} />
              <span>KHUSUS OWNER</span>
            </button>
          ) : owned ? (
            <button
              type="button"
              disabled={isBusy}
              onClick={(e) => {
                e.stopPropagation();
                triggerTapFeedback();
                onEquip(border);
              }}
              className="w-full h-8 rounded-xl text-[12px] font-semibold hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all"
              style={{
                background: 'var(--nz-border-btn-bg)',
                color: 'var(--nz-border-btn-text)',
              }}
            >
              {isBusy ? 'Memakai...' : 'Pakai'}
            </button>
          ) : Number(currentUser.coins || 0) < Number(border.price_coins || 0) ? (
            <div className="flex flex-col gap-1">
              <div className="text-[10.5px] font-semibold text-[#9CA3AF] tabular-nums">
                {formatNumber(border.price_coins)} Coin
              </div>
              <button
                type="button"
                disabled
                className="w-full h-8 px-2 rounded-xl bg-[#E5E7EB] text-[#6B7280] text-[11.5px] font-semibold flex items-center justify-center gap-1 cursor-not-allowed"
              >
                <span>Coin Kurang</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={isBusy}
              onClick={(e) => {
                e.stopPropagation();
                triggerTapFeedback();
                onBuy(border);
              }}
              className="w-full h-8 px-2 rounded-xl bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#111113] text-[12px] font-semibold flex items-center justify-center gap-1.5 tabular-nums active:scale-95 disabled:opacity-50 transition-all"
            >
              <Coins className="w-3.5 h-3.5 text-[#D97706] shrink-0" strokeWidth={1.75} />
              <span>
                {isBusy ? 'Membeli...' : `Beli - ${formatNumber(border.price_coins)} Coin`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const BordersView: React.FC<BordersViewProps> = ({
  currentUser,
  onBack,
  onPlayerUpdated,
}) => {
  const { allBorders, collectionBorders, ownedIds, loading, error, rlsHint, refreshBorders } =
    useBorders();
  const [activeTab, setActiveTab] = useState<'koleksi' | 'toko'>('toko');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; type: 'ok' | 'err' } | null>(null);

  useEffect(() => {
    refreshBorders();
  }, [refreshBorders]);

  const showToast = (text: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ text, type });
    setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 2800);
  };

  const isBorderOwned = (b: BorderItem) => {
    return Boolean(currentUser.is_owner || b.owned || ownedIds.has(String(b.id)));
  };

  const isBorderEquipped = (b: BorderItem) => {
    if (currentUser.is_owner) {
      return (
        currentUser.border_id === b.id ||
        (!currentUser.border_id && (b.is_owner_only || b.id === 'FAIZ_OWNER'))
      );
    }
    return currentUser.border_id === b.id;
  };

  const filteredBorders = useMemo(() => {
    const sourceList = activeTab === 'toko' ? allBorders : collectionBorders;

    return sourceList.filter((b) => {
      const upperName = String(b.name || '').trim().toUpperCase();
      const upperId = String(b.id || '').trim().toUpperCase();
      const isOwnerBorder = Boolean(
        b.is_owner_only ||
          upperId === 'FAIZ_OWNER' ||
          upperId === 'FAIZ_SPIDERMAN' ||
          upperName === 'FAIZ GANTENG' ||
          upperName === 'FAIZ SPIDERMAN'
      );

      if (activeTab === 'toko') {
        if (!currentUser.is_owner) {
          const isFaizGanteng = upperId === 'FAIZ_OWNER' || upperName === 'FAIZ GANTENG';
          if (isFaizGanteng) return false;
          // FAIZ SPIDERMAN stays visible in Toko with "KHUSUS OWNER" disabled button
        }
      } else {
        if (isOwnerBorder && !currentUser.is_owner) return false;
        if (!isBorderOwned(b)) return false;
      }

      if (selectedCategory !== 'Semua') {
        if (b.category !== selectedCategory) return false;
      }
      return true;
    });
  }, [allBorders, collectionBorders, activeTab, selectedCategory, ownedIds, currentUser.is_owner]);

  const handleBuy = async (border: BorderItem) => {
    if (busyId) return;
    if (currentUser.is_owner) {
      await handleEquip(border);
      return;
    }
    if (Number(currentUser.coins || 0) < Number(border.price_coins || 0)) {
      showToast('Coin tidak cukup', 'err');
      return;
    }

    setBusyId(border.id);
    try {
      const res = await api.buyBorder(border.id);
      onPlayerUpdated({ ...currentUser, coins: res.coins });
      await refreshBorders();
      showToast(`Berhasil membeli ${border.name}`, 'ok');
    } catch (err: any) {
      showToast(err?.message || 'Coin tidak cukup', 'err');
    } finally {
      setBusyId(null);
    }
  };

  const handleEquip = async (border: BorderItem) => {
    if (busyId) return;
    setBusyId(border.id);
    try {
      const res = await api.equipBorder(border.id);
      onPlayerUpdated(res.player);
      await refreshBorders();
      showToast(`Border ${border.name} dipakai`, 'ok');
    } catch (err: any) {
      showToast(err?.message || 'Gagal memakai border', 'err');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="w-full pb-20">
      {/* Sub-header */}
      <div
        className="px-4 py-3 border-b flex items-center justify-between gap-2"
        style={{ borderColor: 'var(--nz-border)' }}
      >
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="min-w-[36px] min-h-[36px] flex items-center justify-center"
              style={{ color: 'var(--nz-text)' }}
              aria-label="Kembali"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
            </button>
          )}
          <h1
            className="font-display text-[16px] font-bold tracking-[-0.5px]"
            style={{ color: 'var(--nz-text)' }}
          >
            Border Avatar
          </h1>
        </div>

        <div
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[12px] font-semibold tabular-nums"
          style={{
            background: 'var(--nz-card)',
            borderColor: 'var(--nz-border)',
            color: 'var(--nz-text)',
          }}
        >
          <span>Coin Kamu:</span>
          <CoinDisplay coins={currentUser.coins} isOwner={currentUser.is_owner} />
        </div>
      </div>

      {/* 2 Plain-Text Tabs: Koleksi Border & Toko Border */}
      <div
        className="px-4 pt-3 pb-2 border-b flex items-center gap-2"
        style={{ borderColor: 'var(--nz-border)' }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('koleksi')}
          className="flex-1 h-9 rounded-[10px] text-[12.5px] font-semibold transition-colors border"
          style={
            activeTab === 'koleksi'
              ? {
                  background: 'var(--nz-btn-bg)',
                  color: 'var(--nz-btn-text)',
                  borderColor: 'transparent',
                }
              : {
                  background: 'var(--nz-card)',
                  color: 'var(--nz-text-muted)',
                  borderColor: 'var(--nz-border)',
                }
          }
        >
          Koleksi Border
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('toko');
            if (selectedCategory === 'OWNER') {
              setSelectedCategory('Semua');
            }
          }}
          className="flex-1 h-9 rounded-[10px] text-[12.5px] font-semibold transition-colors border"
          style={
            activeTab === 'toko'
              ? {
                  background: 'var(--nz-btn-bg)',
                  color: 'var(--nz-btn-text)',
                  borderColor: 'transparent',
                }
              : {
                  background: 'var(--nz-card)',
                  color: 'var(--nz-text-muted)',
                  borderColor: 'var(--nz-border)',
                }
          }
        >
          Toko Border
        </button>
      </div>

      {/* Category Filter Strip */}
      <div
        className="px-4 py-2.5 border-b flex items-center gap-1.5 overflow-x-auto no-scrollbar"
        style={{ borderColor: 'var(--nz-border)' }}
      >
        {CATEGORIES.map((cat) => {
          if (cat === 'OWNER' && !currentUser.is_owner) return null;
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className="h-7 px-3 rounded-full text-[11.5px] font-semibold whitespace-nowrap shrink-0 transition-colors border"
              style={
                active
                  ? {
                      background: 'var(--nz-btn-bg)',
                      color: 'var(--nz-btn-text)',
                      borderColor: 'transparent',
                    }
                  : {
                      background: 'var(--nz-card)',
                      color: 'var(--nz-text-muted)',
                      borderColor: 'var(--nz-border)',
                    }
              }
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-4">
        {loading && allBorders.length === 0 ? (
          <div className="py-16 text-center text-[13px]" style={{ color: 'var(--nz-text-muted)' }}>
            Memuat border...
          </div>
        ) : error ? (
          <div
            className="p-4 rounded-xl border border-[#FF453A]/40 text-[12.5px] text-[#FF453A]"
            style={{ background: 'var(--nz-card)' }}
          >
            {error}
          </div>
        ) : filteredBorders.length === 0 ? (
          <div className="py-12 px-4 text-center flex flex-col items-center gap-2">
            <span className="text-[13px]" style={{ color: 'var(--nz-text-muted)' }}>
              {allBorders.length === 0
                ? 'Belum ada border'
                : 'Belum ada border di kategori ini'}
            </span>
            {allBorders.length === 0 && rlsHint && (
              <p className="text-[12px] text-[#FF9F0A] max-w-xs leading-relaxed">{rlsHint}</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredBorders.map((border, index) => (
              <BorderCard3D
                key={border.id}
                border={border}
                index={index}
                activeTab={activeTab}
                currentUser={currentUser}
                owned={isBorderOwned(border)}
                equipped={isBorderEquipped(border)}
                isBusy={busyId === border.id}
                onEquip={handleEquip}
                onBuy={handleBuy}
              />
            ))}
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl border text-[12.5px] font-medium shadow-lg"
          style={{ background: 'var(--nz-modal-bg)', borderColor: 'var(--nz-border)' }}
        >
          <span style={{ color: toast.type === 'err' ? '#FF453A' : 'var(--nz-text)' }}>
            {toast.text}
          </span>
        </div>
      )}
    </div>
  );
};
