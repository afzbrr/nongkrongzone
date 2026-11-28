import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpDown,
  Ban,
  ChevronDown,
  ChevronUp,
  Clock,
  Coins,
  Crown,
  Edit3,
  Gift,
  Megaphone,
  Plus,
  Power,
  RefreshCw,
  Search,
  Send,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import type { Giveaway, OwnerBroadcast, OwnerPanelStats, Player } from '../types';
import { api } from '../services/api';
import { formatNumber } from '../utils/format';
import {
  formatCountdown,
  formatWibDateTimeLabel,
  getWibParts,
  parseWibDateTimeToIso,
} from '../utils/wib';
import { Avatar } from './Avatar';
import { CoinDisplay, OwnerBadge } from './PlayerBadges';

interface OwnerPanelModalProps {
  broadcasts: OwnerBroadcast[];
  giveaways: Giveaway[];
  stats?: OwnerPanelStats | null;
  onClose: () => void;
  onStateChanged: () => Promise<void> | void;
  onViewProfile?: (username: string) => void;
  onTransferToUser?: (player: Player) => void;
}

export const OwnerPanelModal: React.FC<OwnerPanelModalProps> = ({
  broadcasts,
  giveaways,
  stats,
  onClose,
  onStateChanged,
  onViewProfile,
  onTransferToUser,
}) => {
  const [tab, setTab] = useState<'broadcast' | 'giveaway' | 'users'>('broadcast');
  const [nowMs, setNowMs] = useState(() => Date.now());

  // Owner users coin list state
  const [usersList, setUsersList] = useState<Player[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [userSort, setUserSort] = useState<'highest' | 'lowest' | 'newest'>('highest');
  const [usersLoadedOnce, setUsersLoadedOnce] = useState(false);

  // Broadcast form state
  const initialWib = useMemo(() => getWibParts(Date.now()), []);
  const [editingBroadcastId, setEditingBroadcastId] = useState<string | null>(null);
  const [bcTitle, setBcTitle] = useState('Pengumuman Owner');
  const [bcMessage, setBcMessage] = useState('');
  const [bcScheduleMode, setBcScheduleMode] = useState<'now' | 'wib'>('now');
  const [bcDate, setBcDate] = useState(initialWib.dateStr);
  const [bcTime, setBcTime] = useState(initialWib.timeStr);
  const [bcActive, setBcActive] = useState(true);
  const [bcSaving, setBcSaving] = useState(false);
  const [bcBusyId, setBcBusyId] = useState<string | null>(null);
  const [bcError, setBcError] = useState<string | null>(null);

  // Giveaway form state
  const [amountPerUser, setAmountPerUser] = useState('100');
  const [maxWinners, setMaxWinners] = useState('10');
  const [gwDate, setGwDate] = useState(initialWib.dateStr);
  const [gwTime, setGwTime] = useState(() => getWibParts(Date.now() + 5 * 60_000).timeStr);
  const [gwSaving, setGwSaving] = useState(false);
  const [gwBusyId, setGwBusyId] = useState<string | null>(null);
  const [gwError, setGwError] = useState<string | null>(null);
  const [expandedClaims, setExpandedClaims] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadUsersCoins = async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const res = await api.getOwnerUsersCoins();
      setUsersList(res.users || []);
      setUsersLoadedOnce(true);
    } catch (err: any) {
      setUsersError(err?.message || 'Gagal memuat daftar coin pengguna');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'users') {
      loadUsersCoins();
    }
  }, [tab, stats?.totalCoinsCirculating, stats?.totalUsers]);

  const filteredAndSortedUsers = useMemo(() => {
    const q = userSearch.trim().replace(/^@/, '').toLowerCase();
    const list = usersList.filter((u) => {
      if (!q) return true;
      return (
        String(u.name || '').toLowerCase().includes(q) ||
        String(u.full_name || '').toLowerCase().includes(q) ||
        String(u.username || '').toLowerCase().includes(q)
      );
    });
    return [...list].sort((a, b) => {
      const aOwner = a.is_owner || a.role === 'owner' || a.telegram_id === 6189849073 ? 1 : 0;
      const bOwner = b.is_owner || b.role === 'owner' || b.telegram_id === 6189849073 ? 1 : 0;
      if (aOwner !== bOwner) return bOwner - aOwner;
      if (userSort === 'lowest') {
        return Number(a.coins || 0) - Number(b.coins || 0);
      }
      if (userSort === 'newest') {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
      return Number(b.coins || 0) - Number(a.coins || 0);
    });
  }, [usersList, userSearch, userSort]);

  const wibNow = useMemo(() => getWibParts(nowMs), [nowMs]);

  const scheduledGiveawayIso = useMemo(
    () => parseWibDateTimeToIso(gwDate, gwTime),
    [gwDate, gwTime]
  );

  const resetBroadcastForm = () => {
    const p = getWibParts(Date.now());
    setEditingBroadcastId(null);
    setBcTitle('Pengumuman Owner');
    setBcMessage('');
    setBcScheduleMode('now');
    setBcDate(p.dateStr);
    setBcTime(p.timeStr);
    setBcActive(true);
    setBcError(null);
  };

  const startEditBroadcast = (b: OwnerBroadcast) => {
    const p = getWibParts(b.scheduled_at);
    setEditingBroadcastId(b.id);
    setBcTitle(b.title || 'Pengumuman Owner');
    setBcMessage(b.message || '');
    setBcScheduleMode('wib');
    setBcDate(p.dateStr);
    setBcTime(p.timeStr);
    setBcActive(Boolean(b.is_active));
    setBcError(null);
  };

  const handleSaveBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedMsg = bcMessage.trim();
    const cleanedTitle = bcTitle.trim() || 'Pengumuman Owner';
    if (!cleanedMsg) {
      setBcError('Isi pesan broadcast terlebih dahulu');
      return;
    }

    let scheduledAtIso = new Date().toISOString();
    if (bcScheduleMode === 'wib') {
      const parsed = parseWibDateTimeToIso(bcDate, bcTime);
      if (!parsed) {
        setBcError('Format tanggal/jam WIB tidak valid');
        return;
      }
      scheduledAtIso = parsed;
    }

    setBcSaving(true);
    setBcError(null);
    try {
      if (editingBroadcastId) {
        await api.updateOwnerBroadcast(editingBroadcastId, {
          title: cleanedTitle,
          message: cleanedMsg,
          scheduled_at: scheduledAtIso,
          is_active: bcActive,
        });
      } else {
        await api.createOwnerBroadcast({
          title: cleanedTitle,
          message: cleanedMsg,
          scheduled_at: scheduledAtIso,
          is_active: bcActive,
        });
      }
      resetBroadcastForm();
      await onStateChanged();
    } catch (err: any) {
      setBcError(err?.message || 'Gagal menyimpan broadcast');
    } finally {
      setBcSaving(false);
    }
  };

  const handleToggleBroadcastActive = async (b: OwnerBroadcast) => {
    setBcBusyId(b.id);
    setBcError(null);
    try {
      await api.updateOwnerBroadcast(b.id, { is_active: !b.is_active });
      await onStateChanged();
    } catch (err: any) {
      setBcError(err?.message || 'Gagal mengubah status broadcast');
    } finally {
      setBcBusyId(null);
    }
  };

  const handleDeleteBroadcast = async (id: string) => {
    setBcBusyId(id);
    setBcError(null);
    try {
      await api.deleteOwnerBroadcast(id);
      if (editingBroadcastId === id) {
        resetBroadcastForm();
      }
      await onStateChanged();
    } catch (err: any) {
      setBcError(err?.message || 'Gagal menghapus broadcast');
    } finally {
      setBcBusyId(null);
    }
  };

  const handleCreateGiveaway = async (e: React.FormEvent) => {
    e.preventDefault();
    const winnersNum = Math.trunc(Number(maxWinners.replace(/[^0-9]/g, '')));
    const coinNum = Math.trunc(Number(amountPerUser.replace(/[^0-9]/g, '')));
    if (!Number.isInteger(coinNum) || coinNum <= 0) {
      setGwError('Jumlah coin per orang harus lebih dari 0');
      return;
    }
    if (!Number.isInteger(winnersNum) || winnersNum <= 0) {
      setGwError('Jumlah penerima minimal 1 orang');
      return;
    }
    if (!scheduledGiveawayIso) {
      setGwError('Pilih tanggal & jam WIB yang valid');
      return;
    }

    setGwSaving(true);
    setGwError(null);
    try {
      await api.createGiveaway({
        amount_per_user: coinNum,
        max_winners: winnersNum,
        scheduled_at: scheduledGiveawayIso,
      });
      await onStateChanged();
    } catch (err: any) {
      setGwError(err?.message || 'Gagal membuat event bagi-bagi coin');
    } finally {
      setGwSaving(false);
    }
  };

  const handleCancelGiveaway = async (id: string) => {
    setGwBusyId(id);
    setGwError(null);
    try {
      await api.cancelGiveaway(id);
      await onStateChanged();
    } catch (err: any) {
      setGwError(err?.message || 'Gagal membatalkan event');
    } finally {
      setGwBusyId(null);
    }
  };

  const handleDeleteGiveaway = async (id: string) => {
    setGwBusyId(id);
    setGwError(null);
    try {
      await api.deleteGiveaway(id);
      await onStateChanged();
    } catch (err: any) {
      setGwError(err?.message || 'Gagal menghapus event');
    } finally {
      setGwBusyId(null);
    }
  };

  const setQuickWibTarget = (preset: 'now' | 'plus5' | '15:00' | '20:00') => {
    if (preset === 'now') {
      const p = getWibParts(Date.now());
      setGwDate(p.dateStr);
      setGwTime(p.timeStr);
    } else if (preset === 'plus5') {
      const p = getWibParts(Date.now() + 5 * 60_000);
      setGwDate(p.dateStr);
      setGwTime(p.timeStr);
    } else {
      const todayWib = getWibParts(Date.now());
      const candidateIso = parseWibDateTimeToIso(todayWib.dateStr, preset);
      if (candidateIso && new Date(candidateIso).getTime() <= Date.now()) {
        const tomorrow = getWibParts(Date.now() + 86_400_000);
        setGwDate(tomorrow.dateStr);
      } else {
        setGwDate(todayWib.dateStr);
      }
      setGwTime(preset);
    }
    setGwError(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[460px] max-h-[92dvh] border rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        style={{
          background: 'var(--nz-modal-bg)',
          borderColor: 'var(--nz-border)',
          color: 'var(--nz-text)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-4 py-3 border-b flex items-center justify-between gap-2 shrink-0"
          style={{ borderColor: 'var(--nz-border)' }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-[#D4AF37]/60 bg-[#D4AF37]/15">
              <Crown className="w-4 h-4 text-[#FFD60A]" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-[15px] font-bold leading-tight">
                Panel Owner
              </h2>
              <div className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--nz-text-muted)' }}>
                <Clock className="w-3 h-3 text-[#FACC15]" strokeWidth={1.8} />
                <span className="tabular-nums font-medium">{wibNow.clockStr} WIB</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full hover:opacity-80"
            style={{ color: 'var(--nz-text-muted)' }}
            aria-label="Tutup Panel Owner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Small Stats Row */}
        <div
          className="px-3.5 py-2.5 border-b grid grid-cols-3 gap-2 shrink-0"
          style={{ borderColor: 'var(--nz-border)', background: 'var(--nz-card)' }}
        >
          <button
            type="button"
            onClick={() => setTab('users')}
            className="px-2.5 py-1.5 rounded-lg border text-left hover:opacity-90 transition-opacity"
            style={{ background: 'var(--nz-elevated)', borderColor: 'var(--nz-border)' }}
          >
            <span className="text-[10px] block" style={{ color: 'var(--nz-text-muted)' }}>
              Total User
            </span>
            <span className="font-display text-[13.5px] font-bold tabular-nums">
              {formatNumber(stats?.totalUsers ?? 0)}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTab('users')}
            className="px-2.5 py-1.5 rounded-lg border text-left hover:opacity-90 transition-opacity"
            style={{ background: 'var(--nz-elevated)', borderColor: 'var(--nz-border)' }}
          >
            <span className="text-[10px] block" style={{ color: 'var(--nz-text-muted)' }}>
              Coin Beredar
            </span>
            <span className="font-display text-[13.5px] font-bold tabular-nums text-[#FACC15]">
              {formatNumber(stats?.totalCoinsCirculating ?? 0)}
            </span>
          </button>
          <div
            className="px-2.5 py-1.5 rounded-lg border"
            style={{ background: 'var(--nz-elevated)', borderColor: 'var(--nz-border)' }}
          >
            <span className="text-[10px] block" style={{ color: 'var(--nz-text-muted)' }}>
              Transfer Hari Ini
            </span>
            <span className="font-display text-[13.5px] font-bold tabular-nums">
              {formatNumber(stats?.todayTransfersCount ?? 0)}{' '}
              <span className="text-[10px] font-medium" style={{ color: 'var(--nz-text-muted)' }}>
                ({formatNumber(stats?.todayTransfersVolume ?? 0)})
              </span>
            </span>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="grid grid-cols-3 border-b shrink-0" style={{ borderColor: 'var(--nz-border)' }}>
          <button
            type="button"
            onClick={() => setTab('broadcast')}
            className="h-11 flex items-center justify-center gap-1.5 text-[12px] font-semibold relative transition-colors"
            style={{
              color: tab === 'broadcast' ? 'var(--nz-text)' : 'var(--nz-text-muted)',
            }}
          >
            <Megaphone className="w-3.5 h-3.5" strokeWidth={1.8} />
            <span>Broadcast</span>
            {tab === 'broadcast' && (
              <span
                className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
                style={{ background: 'var(--nz-btn-bg)' }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setTab('giveaway')}
            className="h-11 flex items-center justify-center gap-1.5 text-[12px] font-semibold relative transition-colors"
            style={{
              color: tab === 'giveaway' ? 'var(--nz-text)' : 'var(--nz-text-muted)',
            }}
          >
            <Gift className="w-3.5 h-3.5" strokeWidth={1.8} />
            <span>Bagi Coin</span>
            {tab === 'giveaway' && (
              <span
                className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
                style={{ background: 'var(--nz-btn-bg)' }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setTab('users')}
            className="h-11 flex items-center justify-center gap-1.5 text-[12px] font-semibold relative transition-colors"
            style={{
              color: tab === 'users' ? 'var(--nz-text)' : 'var(--nz-text-muted)',
            }}
          >
            <Coins className="w-3.5 h-3.5" strokeWidth={1.8} />
            <span>Coin User</span>
            {tab === 'users' && (
              <span
                className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
                style={{ background: 'var(--nz-btn-bg)' }}
              />
            )}
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-4">
          {tab === 'broadcast' ? (
            <>
              <form
                onSubmit={handleSaveBroadcast}
                className="p-3.5 rounded-xl border flex flex-col gap-3"
                style={{ background: 'var(--nz-card)', borderColor: 'var(--nz-border)' }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12.5px] font-bold">
                    {editingBroadcastId ? 'Edit Broadcast' : 'Buat Broadcast Home'}
                  </span>
                  {editingBroadcastId ? (
                    <button
                      type="button"
                      onClick={resetBroadcastForm}
                      className="text-[11px] font-semibold hover:opacity-80"
                      style={{ color: 'var(--nz-accent-text)' }}
                    >
                      Batal Edit
                    </button>
                  ) : (
                    <span className="text-[11px] tabular-nums" style={{ color: 'var(--nz-text-muted)' }}>
                      {bcMessage.length}/240
                    </span>
                  )}
                </div>

                <label className="flex flex-col gap-1 text-[11.5px]" style={{ color: 'var(--nz-text-muted)' }}>
                  <span>Judul</span>
                  <input
                    type="text"
                    maxLength={80}
                    value={bcTitle}
                    onChange={(e) => setBcTitle(e.target.value)}
                    placeholder="Pengumuman Owner"
                    className="h-9 rounded-lg border px-3 text-[13px] focus:outline-none"
                    style={{
                      background: 'var(--nz-elevated)',
                      borderColor: 'var(--nz-border)',
                      color: 'var(--nz-text)',
                    }}
                  />
                </label>

                <label className="flex flex-col gap-1 text-[11.5px]" style={{ color: 'var(--nz-text-muted)' }}>
                  <span>Isi Pesan</span>
                  <textarea
                    rows={2}
                    maxLength={240}
                    value={bcMessage}
                    onChange={(e) => {
                      setBcMessage(e.target.value);
                      setBcError(null);
                    }}
                    placeholder="Tulis pengumuman singkat untuk tampil di Home..."
                    className="w-full rounded-xl border px-3 py-2 text-[13px] resize-none focus:outline-none"
                    style={{
                      background: 'var(--nz-elevated)',
                      borderColor: 'var(--nz-border)',
                      color: 'var(--nz-text)',
                    }}
                  />
                </label>

                {/* Waktu Broadcast (WIB) */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11.5px] font-semibold" style={{ color: 'var(--nz-text-muted)' }}>
                    Waktu Broadcast (WIB)
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setBcScheduleMode('now')}
                      className="h-8 rounded-lg border text-[12px] font-semibold"
                      style={{
                        background: bcScheduleMode === 'now' ? 'var(--nz-btn-bg)' : 'var(--nz-elevated)',
                        color: bcScheduleMode === 'now' ? 'var(--nz-btn-text)' : 'var(--nz-text-muted)',
                        borderColor: 'var(--nz-border)',
                      }}
                    >
                      Langsung Sekarang
                    </button>
                    <button
                      type="button"
                      onClick={() => setBcScheduleMode('wib')}
                      className="h-8 rounded-lg border text-[12px] font-semibold"
                      style={{
                        background: bcScheduleMode === 'wib' ? 'var(--nz-btn-bg)' : 'var(--nz-elevated)',
                        color: bcScheduleMode === 'wib' ? 'var(--nz-btn-text)' : 'var(--nz-text-muted)',
                        borderColor: 'var(--nz-border)',
                      }}
                    >
                      Jadwalkan Jam WIB
                    </button>
                  </div>
                  {bcScheduleMode === 'wib' && (
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <input
                        type="date"
                        value={bcDate}
                        onChange={(e) => setBcDate(e.target.value)}
                        className="h-9 rounded-lg border px-2.5 text-[12px] focus:outline-none"
                        style={{
                          background: 'var(--nz-elevated)',
                          borderColor: 'var(--nz-border)',
                          color: 'var(--nz-text)',
                        }}
                      />
                      <input
                        type="time"
                        value={bcTime}
                        onChange={(e) => setBcTime(e.target.value)}
                        className="h-9 rounded-lg border px-2.5 text-[12px] focus:outline-none"
                        style={{
                          background: 'var(--nz-elevated)',
                          borderColor: 'var(--nz-border)',
                          color: 'var(--nz-text)',
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Status Aktif Toggle */}
                <button
                  type="button"
                  onClick={() => setBcActive((v) => !v)}
                  className="h-9 px-3 rounded-lg border flex items-center justify-between text-[12px] font-semibold"
                  style={{
                    background: 'var(--nz-elevated)',
                    borderColor: bcActive ? 'var(--nz-accent)' : 'var(--nz-border)',
                    color: 'var(--nz-text)',
                  }}
                >
                  <span>Status Aktif</span>
                  <span className={bcActive ? 'text-[#30D158]' : 'text-[#9CA3AF]'}>
                    {bcActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </button>

                {bcError && <p className="text-[12px] text-[#FF453A] font-medium">{bcError}</p>}

                <button
                  type="submit"
                  disabled={bcSaving}
                  className="h-9 rounded-xl text-[12.5px] font-bold flex items-center justify-center gap-1.5 hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'var(--nz-btn-bg)', color: 'var(--nz-btn-text)' }}
                >
                  <Plus className="w-4 h-4" strokeWidth={2.2} />
                  <span>
                    {bcSaving
                      ? 'Menyimpan...'
                      : editingBroadcastId
                        ? 'Simpan Perubahan'
                        : bcScheduleMode === 'wib'
                          ? 'Jadwalkan Broadcast'
                          : 'Simpan Broadcast'}
                  </span>
                </button>
              </form>

              {/* Broadcast List */}
              <div className="flex flex-col gap-2">
                <span className="text-[12px] font-bold" style={{ color: 'var(--nz-text-muted)' }}>
                  Daftar Broadcast ({broadcasts.length})
                </span>
                {broadcasts.length === 0 ? (
                  <div
                    className="py-6 text-center rounded-xl border text-[12.5px]"
                    style={{
                      background: 'var(--nz-card)',
                      borderColor: 'var(--nz-border)',
                      color: 'var(--nz-text-muted)',
                    }}
                  >
                    Belum ada broadcast
                  </div>
                ) : (
                  broadcasts.map((b) => {
                    const schedMs = new Date(b.scheduled_at).getTime();
                    const isScheduled = b.is_active && Number.isFinite(schedMs) && nowMs < schedMs;
                    const isBusy = bcBusyId === b.id;
                    return (
                      <div
                        key={b.id}
                        className="p-3 rounded-xl border flex flex-col gap-2"
                        style={{ background: 'var(--nz-card)', borderColor: 'var(--nz-border)' }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                  !b.is_active
                                    ? 'bg-[#27272A] text-[#9CA3AF]'
                                    : isScheduled
                                      ? 'bg-[#0A84FF]/20 text-[#60A5FA]'
                                      : 'bg-[#30D158]/20 text-[#30D158]'
                                }`}
                              >
                                {!b.is_active ? 'Nonaktif' : isScheduled ? 'Terjadwal' : 'Aktif'}
                              </span>
                              <span className="text-[11px]" style={{ color: 'var(--nz-text-muted)' }}>
                                {formatWibDateTimeLabel(b.scheduled_at)}
                              </span>
                            </div>
                            <p className="font-display text-[12.5px] font-bold truncate">{b.title}</p>
                            <p className="text-[12.5px] leading-snug break-words mt-0.5">{b.message}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-1.5 pt-1 border-t" style={{ borderColor: 'var(--nz-border)' }}>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => startEditBroadcast(b)}
                            className="h-7 px-2.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1 hover:opacity-85 disabled:opacity-50"
                            style={{
                              background: 'var(--nz-elevated)',
                              borderColor: 'var(--nz-border)',
                              color: 'var(--nz-text)',
                            }}
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleToggleBroadcastActive(b)}
                            className="h-7 px-2.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1 hover:opacity-85 disabled:opacity-50"
                            style={{
                              background: 'var(--nz-elevated)',
                              borderColor: 'var(--nz-border)',
                              color: b.is_active ? '#FACC15' : '#30D158',
                            }}
                          >
                            <Power className="w-3 h-3" />
                            <span>{b.is_active ? 'Nonaktifkan' : 'Aktifkan'}</span>
                          </button>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleDeleteBroadcast(b.id)}
                            className="h-7 px-2.5 rounded-lg border border-[#FF453A]/35 text-[#FF453A] text-[11px] font-semibold flex items-center gap-1 hover:bg-[#FF453A]/10 disabled:opacity-50"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : tab === 'giveaway' ? (
            <>
              <form
                onSubmit={handleCreateGiveaway}
                className="p-3.5 rounded-xl border flex flex-col gap-3"
                style={{ background: 'var(--nz-card)', borderColor: 'var(--nz-border)' }}
              >
                <span className="text-[12.5px] font-bold">Buat Event Bagi-Bagi Coin (WIB)</span>

                <div className="grid grid-cols-2 gap-2.5">
                  <label className="flex flex-col gap-1 text-[11.5px]" style={{ color: 'var(--nz-text-muted)' }}>
                    <span className="flex items-center gap-1">
                      <Coins className="w-3 h-3 text-[#FACC15]" /> Coin per Orang
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={amountPerUser}
                      onChange={(e) => {
                        setAmountPerUser(e.target.value.replace(/[^0-9]/g, ''));
                        setGwError(null);
                      }}
                      placeholder="100"
                      className="h-9 rounded-lg border px-3 text-[13px] font-semibold tabular-nums focus:outline-none"
                      style={{
                        background: 'var(--nz-elevated)',
                        borderColor: 'var(--nz-border)',
                        color: 'var(--nz-text)',
                      }}
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-[11.5px]" style={{ color: 'var(--nz-text-muted)' }}>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> Berapa Orang
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={maxWinners}
                      onChange={(e) => {
                        setMaxWinners(e.target.value.replace(/[^0-9]/g, ''));
                        setGwError(null);
                      }}
                      placeholder="10"
                      className="h-9 rounded-lg border px-3 text-[13px] font-semibold tabular-nums focus:outline-none"
                      style={{
                        background: 'var(--nz-elevated)',
                        borderColor: 'var(--nz-border)',
                        color: 'var(--nz-text)',
                      }}
                    />
                  </label>
                </div>

                {/* Waktu Jam WIB */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11.5px] font-semibold" style={{ color: 'var(--nz-text-muted)' }}>
                    Waktu Bagi-Bagi (WIB / Asia Jakarta)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={gwDate}
                      onChange={(e) => {
                        setGwDate(e.target.value);
                        setGwError(null);
                      }}
                      className="h-9 rounded-lg border px-2.5 text-[12.5px] focus:outline-none"
                      style={{
                        background: 'var(--nz-elevated)',
                        borderColor: 'var(--nz-border)',
                        color: 'var(--nz-text)',
                      }}
                    />
                    <input
                      type="time"
                      value={gwTime}
                      onChange={(e) => {
                        setGwTime(e.target.value);
                        setGwError(null);
                      }}
                      className="h-9 rounded-lg border px-2.5 text-[12.5px] focus:outline-none"
                      style={{
                        background: 'var(--nz-elevated)',
                        borderColor: 'var(--nz-border)',
                        color: 'var(--nz-text)',
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 mt-0.5">
                    {(
                      [
                        { key: 'now', label: 'Sekarang' },
                        { key: 'plus5', label: '+5 Menit' },
                        { key: '15:00', label: '15:00 WIB' },
                        { key: '20:00', label: '20:00 WIB' },
                      ] as const
                    ).map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setQuickWibTarget(p.key)}
                        className="h-7 rounded-lg border text-[11px] font-semibold hover:opacity-90"
                        style={{
                          background: 'var(--nz-elevated)',
                          borderColor: 'var(--nz-border)',
                          color: 'var(--nz-text-muted)',
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {scheduledGiveawayIso && (
                    <div
                      className="px-2.5 py-1.5 rounded-lg text-[11.5px] flex items-center justify-between"
                      style={{ background: 'var(--nz-elevated)', color: 'var(--nz-text-muted)' }}
                    >
                      <span>Jadwal: {formatWibDateTimeLabel(scheduledGiveawayIso)}</span>
                      <span className="font-bold tabular-nums text-[#FACC15]">
                        {new Date(scheduledGiveawayIso).getTime() > nowMs
                          ? `Timer: ${formatCountdown(scheduledGiveawayIso, nowMs)}`
                          : 'Langsung Live'}
                      </span>
                    </div>
                  )}
                </div>

                {gwError && <p className="text-[12px] text-[#FF453A] font-medium">{gwError}</p>}

                <button
                  type="submit"
                  disabled={gwSaving}
                  className="h-9 rounded-xl text-[12.5px] font-bold flex items-center justify-center gap-1.5 hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'var(--nz-btn-bg)', color: 'var(--nz-btn-text)' }}
                >
                  <Gift className="w-4 h-4" strokeWidth={2} />
                  <span>{gwSaving ? 'Menyimpan...' : 'Buat Event Bagi-Bagi'}</span>
                </button>
              </form>

              {/* List of Giveaways */}
              <div className="flex flex-col gap-2">
                <span className="text-[12px] font-bold" style={{ color: 'var(--nz-text-muted)' }}>
                  Daftar Event Bagi-Bagi Coin ({giveaways.length})
                </span>
                {giveaways.length === 0 ? (
                  <div
                    className="py-6 text-center rounded-xl border text-[12.5px]"
                    style={{
                      background: 'var(--nz-card)',
                      borderColor: 'var(--nz-border)',
                      color: 'var(--nz-text-muted)',
                    }}
                  >
                    Belum ada event bagi-bagi coin
                  </div>
                ) : (
                  giveaways.map((g) => {
                    const startMs = new Date(g.scheduled_at).getTime();
                    const isCancelled = g.status === 'cancelled';
                    const isFull = g.status === 'ended' || g.claimed_count >= g.max_winners;
                    const isWaiting = !isCancelled && !isFull && Number.isFinite(startMs) && nowMs < startMs;
                    const isBusy = gwBusyId === g.id;
                    const claims = g.claims || [];
                    const claimsOpen = Boolean(expandedClaims[g.id]);

                    return (
                      <div
                        key={g.id}
                        className="p-3 rounded-xl border flex flex-col gap-2"
                        style={{ background: 'var(--nz-card)', borderColor: 'var(--nz-border)' }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-display text-[13.5px] font-bold text-[#FACC15]">
                                +{formatNumber(g.amount_per_user)} Coin
                              </span>
                              <span className="text-[12px]" style={{ color: 'var(--nz-text-muted)' }}>
                                × {formatNumber(g.max_winners)} orang
                              </span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                  isCancelled
                                    ? 'bg-[#FF453A]/15 text-[#FF453A]'
                                    : isFull
                                      ? 'bg-[#27272A] text-[#9CA3AF]'
                                      : isWaiting
                                        ? 'bg-[#0A84FF]/20 text-[#60A5FA]'
                                        : 'bg-[#30D158]/20 text-[#30D158]'
                                }`}
                              >
                                {isCancelled
                                  ? 'Dibatalkan'
                                  : isFull
                                    ? 'Slot Habis'
                                    : isWaiting
                                      ? 'Terjadwal'
                                      : 'Live'}
                              </span>
                            </div>
                            <p className="text-[11.5px] mt-0.5" style={{ color: 'var(--nz-text-muted)' }}>
                              {formatWibDateTimeLabel(g.scheduled_at)}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {!isCancelled && !isFull && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleCancelGiveaway(g.id)}
                                className="h-7 px-2 rounded-lg border border-[#FF9F0A]/40 text-[#FF9F0A] text-[11px] font-semibold flex items-center gap-1 hover:bg-[#FF9F0A]/10 disabled:opacity-50"
                              >
                                <Ban className="w-3 h-3" />
                                <span>Batalkan</span>
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleDeleteGiveaway(g.id)}
                              className="h-7 px-2 rounded-lg border border-[#FF453A]/35 text-[#FF453A] text-[11px] font-semibold flex items-center gap-1 hover:bg-[#FF453A]/10 disabled:opacity-50"
                              aria-label="Hapus event"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <div
                          className="flex items-center justify-between text-[11.5px] px-2.5 py-1.5 rounded-lg"
                          style={{ background: 'var(--nz-elevated)' }}
                        >
                          <span style={{ color: 'var(--nz-text-muted)' }}>
                            Diklaim:{' '}
                            <strong style={{ color: 'var(--nz-text)' }}>
                              {g.claimed_count}/{g.max_winners}
                            </strong>
                          </span>
                          {isCancelled ? (
                            <span className="font-semibold text-[#FF453A]">Event dibatalkan</span>
                          ) : isWaiting ? (
                            <span className="font-bold tabular-nums text-[#FACC15]">
                              Timer: {formatCountdown(g.scheduled_at, nowMs)}
                            </span>
                          ) : (
                            <span className="font-semibold text-[#30D158]">
                              {isFull
                                ? 'Semua kuota terambil'
                                : `Sisa ${Math.max(0, g.max_winners - g.claimed_count)}/${g.max_winners}`}
                            </span>
                          )}
                        </div>

                        {/* Claimers List */}
                        {claims.length > 0 && (
                          <div className="pt-0.5">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedClaims((prev) => ({ ...prev, [g.id]: !prev[g.id] }))
                              }
                              className="w-full flex items-center justify-between text-[11.5px] font-semibold px-1 py-1 hover:opacity-80"
                              style={{ color: 'var(--nz-accent-text)' }}
                            >
                              <span>Lihat Daftar Pengklaim ({claims.length})</span>
                              {claimsOpen ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {claimsOpen && (
                              <div
                                className="mt-1 rounded-lg border divide-y max-h-[160px] overflow-y-auto"
                                style={{
                                  background: 'var(--nz-elevated)',
                                  borderColor: 'var(--nz-border)',
                                }}
                              >
                                {claims.map((c) => (
                                  <div
                                    key={c.id}
                                    className="px-2.5 py-1.5 flex items-center justify-between gap-2 text-[11.5px]"
                                    style={{ borderColor: 'var(--nz-border)' }}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Avatar player={c.player} size={28} />
                                      <span className="font-semibold truncate">
                                        @{c.player?.username || 'user'}
                                      </span>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className="text-[#FACC15] font-bold">
                                        +{formatNumber(c.amount)}
                                      </span>
                                      <span
                                        className="block text-[10px]"
                                        style={{ color: 'var(--nz-text-muted)' }}
                                      >
                                        {formatWibDateTimeLabel(c.claimed_at)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            /* Coin Semua User (Owner Only) */
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div
                  className="flex-1 flex items-center gap-2 px-3 h-9 rounded-xl border min-w-0"
                  style={{ background: 'var(--nz-card)', borderColor: 'var(--nz-border)' }}
                >
                  <Search className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--nz-text-muted)' }} />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Cari nama atau @username..."
                    className="flex-1 bg-transparent text-[12.5px] focus:outline-none min-w-0"
                    style={{ color: 'var(--nz-text)' }}
                  />
                  {userSearch && (
                    <button
                      type="button"
                      onClick={() => setUserSearch('')}
                      className="p-0.5 hover:opacity-80"
                      style={{ color: 'var(--nz-text-muted)' }}
                      aria-label="Hapus pencarian"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setUserSort((prev) =>
                      prev === 'highest' ? 'lowest' : prev === 'lowest' ? 'newest' : 'highest'
                    )
                  }
                  className="h-9 px-2.5 rounded-xl border text-[11.5px] font-semibold flex items-center gap-1 shrink-0 hover:opacity-90"
                  style={{
                    background: 'var(--nz-card)',
                    borderColor: 'var(--nz-border)',
                    color: 'var(--nz-text)',
                  }}
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>
                    {userSort === 'highest'
                      ? 'Terbanyak'
                      : userSort === 'lowest'
                        ? 'Tersedikit'
                        : 'Terbaru'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={loadUsersCoins}
                  disabled={usersLoading}
                  className="h-9 w-9 rounded-xl border flex items-center justify-center shrink-0 hover:opacity-90 disabled:opacity-50"
                  style={{
                    background: 'var(--nz-card)',
                    borderColor: 'var(--nz-border)',
                    color: 'var(--nz-text-muted)',
                  }}
                  aria-label="Muat ulang daftar coin"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${usersLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="flex items-center justify-between text-[11.5px] px-0.5" style={{ color: 'var(--nz-text-muted)' }}>
                <span>
                  Menampilkan <strong style={{ color: 'var(--nz-text)' }}>{filteredAndSortedUsers.length}</strong> pengguna
                </span>
                <span>
                  Total beredar:{' '}
                  <strong className="text-[#FACC15] tabular-nums">
                    {formatNumber(
                      usersList.reduce((sum, u) => {
                        const isOwnerUser = u.is_owner || u.role === 'owner' || u.telegram_id === 6189849073;
                        if (isOwnerUser || u.is_banned) return sum;
                        return sum + Number(u.coins || 0);
                      }, 0)
                    )}{' '}
                    Coin
                  </strong>
                </span>
              </div>

              {usersError && (
                <div
                  className="p-3 rounded-xl border border-[#FF453A]/35 text-[12px] text-[#FF453A] flex items-center justify-between gap-2"
                  style={{ background: 'var(--nz-card)' }}
                >
                  <span>{usersError}</span>
                  <button
                    type="button"
                    onClick={loadUsersCoins}
                    className="font-bold underline shrink-0"
                  >
                    Coba Lagi
                  </button>
                </div>
              )}

              {usersLoading && !usersLoadedOnce ? (
                <div className="flex flex-col gap-2">
                  {[1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className="h-14 rounded-xl border animate-pulse"
                      style={{ background: 'var(--nz-card)', borderColor: 'var(--nz-border)' }}
                    />
                  ))}
                </div>
              ) : filteredAndSortedUsers.length === 0 ? (
                <div
                  className="py-8 text-center rounded-xl border text-[12.5px]"
                  style={{
                    background: 'var(--nz-card)',
                    borderColor: 'var(--nz-border)',
                    color: 'var(--nz-text-muted)',
                  }}
                >
                  {userSearch ? 'Pengguna tidak ditemukan' : 'Belum ada pengguna'}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {filteredAndSortedUsers.map((u) => {
                    const isOwnerUser = Boolean(
                      u.is_owner || u.role === 'owner' || u.telegram_id === 6189849073
                    );
                    return (
                      <div
                        key={u.id}
                        className="p-2.5 rounded-xl border flex items-center justify-between gap-2.5"
                        style={{ background: 'var(--nz-card)', borderColor: 'var(--nz-border)' }}
                      >
                        <button
                          type="button"
                          onClick={() => onViewProfile?.(u.username)}
                          className="flex items-center gap-2.5 min-w-0 flex-1 text-left hover:opacity-90"
                        >
                          <Avatar player={u} size={36} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-display text-[13px] font-bold truncate">
                                {u.full_name || u.name}
                              </span>
                              {isOwnerUser && <OwnerBadge compact />}
                              {u.is_banned && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#FF453A]/15 text-[#FF453A] uppercase shrink-0">
                                  Banned
                                </span>
                              )}
                            </div>
                            <span
                              className="text-[11.5px] block truncate"
                              style={{ color: 'var(--nz-text-muted)' }}
                            >
                              @{u.username}
                            </span>
                          </div>
                        </button>

                        <div className="flex items-center gap-2 shrink-0">
                          <div
                            className="px-2.5 py-1 rounded-lg border text-[12px]"
                            style={{
                              background: 'var(--nz-elevated)',
                              borderColor: 'var(--nz-border)',
                            }}
                          >
                            <CoinDisplay coins={u.coins} isOwner={isOwnerUser} iconSize="sm" />
                          </div>

                          {!isOwnerUser && onTransferToUser && (
                            <button
                              type="button"
                              onClick={() => onTransferToUser(u)}
                              className="h-7 w-7 rounded-lg border flex items-center justify-center hover:opacity-90"
                              style={{
                                background: 'var(--nz-elevated)',
                                borderColor: 'var(--nz-border)',
                                color: 'var(--nz-accent-text)',
                              }}
                              title={`Transfer coin ke @${u.username}`}
                              aria-label={`Transfer coin ke @${u.username}`}
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
