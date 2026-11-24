import React, { useEffect, useMemo, useState } from 'react';
import {
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
  Trash2,
  Users,
  X,
} from 'lucide-react';
import type { Giveaway, OwnerBroadcast, OwnerPanelStats } from '../types';
import { api } from '../services/api';
import { formatNumber } from '../utils/format';
import {
  formatCountdown,
  formatWibDateTimeLabel,
  getWibParts,
  parseWibDateTimeToIso,
} from '../utils/wib';
import { Avatar } from './Avatar';

interface OwnerPanelModalProps {
  broadcasts: OwnerBroadcast[];
  giveaways: Giveaway[];
  stats?: OwnerPanelStats | null;
  onClose: () => void;
  onStateChanged: () => Promise<void> | void;
}

export const OwnerPanelModal: React.FC<OwnerPanelModalProps> = ({
  broadcasts,
  giveaways,
  stats,
  onClose,
  onStateChanged,
}) => {
  const [tab, setTab] = useState<'broadcast' | 'giveaway'>('broadcast');
  const [nowMs, setNowMs] = useState(() => Date.now());

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
          <div
            className="px-2.5 py-1.5 rounded-lg border"
            style={{ background: 'var(--nz-elevated)', borderColor: 'var(--nz-border)' }}
          >
            <span className="text-[10px] block" style={{ color: 'var(--nz-text-muted)' }}>
              Total User
            </span>
            <span className="font-display text-[13.5px] font-bold tabular-nums">
              {formatNumber(stats?.totalUsers ?? 0)}
            </span>
          </div>
          <div
            className="px-2.5 py-1.5 rounded-lg border"
            style={{ background: 'var(--nz-elevated)', borderColor: 'var(--nz-border)' }}
          >
            <span className="text-[10px] block" style={{ color: 'var(--nz-text-muted)' }}>
              Coin Beredar
            </span>
            <span className="font-display text-[13.5px] font-bold tabular-nums text-[#FACC15]">
              {formatNumber(stats?.totalCoinsCirculating ?? 0)}
            </span>
          </div>
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
        <div className="grid grid-cols-2 border-b shrink-0" style={{ borderColor: 'var(--nz-border)' }}>
          <button
            type="button"
            onClick={() => setTab('broadcast')}
            className="h-11 flex items-center justify-center gap-1.5 text-[12.5px] font-semibold relative transition-colors"
            style={{
              color: tab === 'broadcast' ? 'var(--nz-text)' : 'var(--nz-text-muted)',
            }}
          >
            <Megaphone className="w-4 h-4" strokeWidth={1.8} />
            <span>Broadcast</span>
            {tab === 'broadcast' && (
              <span
                className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full"
                style={{ background: 'var(--nz-btn-bg)' }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setTab('giveaway')}
            className="h-11 flex items-center justify-center gap-1.5 text-[12.5px] font-semibold relative transition-colors"
            style={{
              color: tab === 'giveaway' ? 'var(--nz-text)' : 'var(--nz-text-muted)',
            }}
          >
            <Gift className="w-4 h-4" strokeWidth={1.8} />
            <span>Bagi-Bagi Coin</span>
            {tab === 'giveaway' && (
              <span
                className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full"
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
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
};
