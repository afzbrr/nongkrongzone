import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRightLeft, Coins, Search, Send, X } from 'lucide-react';
import type { Player } from '../types';
import { api } from '../services/api';
import { formatNumber } from '../utils/format';
import { Avatar } from './Avatar';
import { CoinDisplay, OwnerBadge } from './PlayerBadges';

interface TransferCoinModalProps {
  currentUser: Player;
  allPlayers: Player[];
  initialRecipient?: Player | null;
  onClose: () => void;
  onTransferSuccess: (result: {
    senderCoins: number;
    recipient: Player;
    amount: number;
  }) => void;
}

const QUICK_AMOUNTS = [50, 100, 250, 500];

export const TransferCoinModal: React.FC<TransferCoinModalProps> = ({
  currentUser,
  allPlayers,
  initialRecipient = null,
  onClose,
  onTransferSuccess,
}) => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Player[]>(() =>
    allPlayers.filter((p) => p.id !== currentUser.id)
  );
  const [searching, setSearching] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<Player | null>(() =>
    initialRecipient && initialRecipient.id !== currentUser.id ? initialRecipient : null
  );
  const [amountInput, setAmountInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isSenderOwner = Boolean(
    currentUser.is_owner ||
      currentUser.role === 'owner' ||
      currentUser.telegram_id === 6189849073
  );

  const cleanQuery = query.trim().replace(/^@/, '');

  // Live search users from Supabase (with instant local filter fallback)
  useEffect(() => {
    if (selectedRecipient) return;

    const lower = cleanQuery.toLowerCase();
    const localMatches = allPlayers.filter((p) => {
      if (p.id === currentUser.id) return false;
      if (!lower) return true;
      return (
        p.username.toLowerCase().includes(lower) ||
        (p.name || '').toLowerCase().includes(lower)
      );
    });
    setSearchResults(localMatches);

    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.getPlayers(cleanQuery);
        if (cancelled) return;
        const filtered = (res.players || []).filter((p) => p.id !== currentUser.id);
        setSearchResults(filtered);
      } catch {
        // Keep local matches if network call fails
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 180);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [cleanQuery, selectedRecipient, allPlayers, currentUser.id]);

  const parsedAmount = useMemo(() => {
    const digits = amountInput.replace(/[^0-9]/g, '');
    if (!digits) return 0;
    const n = Number(digits);
    return Number.isSafeInteger(n) ? n : 0;
  }, [amountInput]);

  const isTypingOwnUsername = Boolean(
    !selectedRecipient &&
      cleanQuery &&
      cleanQuery.toLowerCase() === String(currentUser.username || '').toLowerCase() &&
      searchResults.length === 0
  );

  const validateTransfer = (): string | null => {
    if (!selectedRecipient) {
      return 'Pilih pengguna penerima terlebih dahulu';
    }
    if (selectedRecipient.id === currentUser.id) {
      return 'Tidak boleh transfer ke diri sendiri';
    }
    if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
      return 'Jumlah coin harus lebih dari 0';
    }
    if (!isSenderOwner && parsedAmount > Number(currentUser.balance ?? currentUser.coins ?? 0)) {
      return 'Saldo tidak cukup';
    }
    return null;
  };

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateTransfer();
    if (err) {
      setErrorMsg(err);
      return;
    }
    setErrorMsg(null);
    setConfirmOpen(true);
  };

  const handleConfirmSend = async () => {
    if (!selectedRecipient || submitting) return;
    const err = validateTransfer();
    if (err) {
      setErrorMsg(err);
      setConfirmOpen(false);
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await api.transferCoins({
        to_player_id: selectedRecipient.id,
        amount: parsedAmount,
      });
      onTransferSuccess({
        senderCoins: res.senderCoins,
        recipient: res.recipient || selectedRecipient,
        amount: res.amount || parsedAmount,
      });
    } catch (apiErr: any) {
      setConfirmOpen(false);
      setErrorMsg(apiErr?.message || 'Gagal mengirim coin');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[440px] border rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col max-h-[88dvh] shadow-2xl"
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
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'var(--nz-elevated)' }}
            >
              <Send className="w-4 h-4" style={{ color: 'var(--nz-accent)' }} strokeWidth={1.9} />
            </div>
            <div className="min-w-0">
              <h2
                className="font-display text-[15px] font-bold tracking-[-0.4px] leading-tight"
                style={{ color: 'var(--nz-text)' }}
              >
                Transfer Coin
              </h2>
              <div className="flex items-center gap-1.5 text-[11px] mt-0.5" style={{ color: 'var(--nz-text-muted)' }}>
                <span>Saldo Kamu:</span>
                <CoinDisplay coins={currentUser.balance ?? currentUser.coins} isOwner={isSenderOwner} iconSize="sm" />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full hover:opacity-80"
            style={{ color: 'var(--nz-text-muted)' }}
            aria-label="Tutup"
          >
            <X className="w-5 h-5" strokeWidth={1.6} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-3.5">
          {!selectedRecipient ? (
            <>
              {/* Step 1: Cari Username Tujuan */}
              <div>
                <label
                  htmlFor="transfer-search-user"
                  className="block text-[12px] font-semibold mb-1.5"
                  style={{ color: 'var(--nz-text-muted)' }}
                >
                  Cari Username Tujuan
                </label>
                <div
                  className="flex items-center gap-2 px-3 h-10 rounded-xl border"
                  style={{
                    background: 'var(--nz-card)',
                    borderColor: 'var(--nz-border)',
                  }}
                >
                  <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--nz-text-muted)' }} strokeWidth={1.7} />
                  <input
                    id="transfer-search-user"
                    type="text"
                    autoFocus
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder="Ketik username tujuan..."
                    className="flex-1 bg-transparent text-[13.5px] focus:outline-none min-w-0"
                    style={{ color: 'var(--nz-text)' }}
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="p-1 hover:opacity-80"
                      style={{ color: 'var(--nz-text-muted)' }}
                      aria-label="Hapus pencarian"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Step 2: Live Search Results */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11px]" style={{ color: 'var(--nz-text-muted)' }}>
                  <span>{cleanQuery ? 'Hasil Pencarian' : 'Pilih Pengguna'}</span>
                  {searching && <span>Mencari...</span>}
                </div>

                {isTypingOwnUsername ? (
                  <div
                    className="p-4 rounded-xl border text-center text-[12.5px] text-[#FF9F0A]"
                    style={{ background: 'var(--nz-card)', borderColor: 'var(--nz-border)' }}
                  >
                    Tidak boleh transfer ke diri sendiri
                  </div>
                ) : searchResults.length === 0 ? (
                  <div
                    className="py-8 px-4 rounded-xl border text-center text-[12.5px]"
                    style={{
                      background: 'var(--nz-card)',
                      borderColor: 'var(--nz-border)',
                      color: 'var(--nz-text-muted)',
                    }}
                  >
                    {searching ? 'Mencari pengguna...' : 'Pengguna tidak ditemukan'}
                  </div>
                ) : (
                  <div
                    className="border rounded-xl overflow-hidden divide-y max-h-[280px] overflow-y-auto"
                    style={{
                      background: 'var(--nz-card)',
                      borderColor: 'var(--nz-border)',
                    }}
                  >
                    {searchResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedRecipient(p);
                          setErrorMsg(null);
                          setConfirmOpen(false);
                        }}
                        className="w-full px-3.5 py-2.5 flex items-center justify-between gap-3 text-left hover:opacity-90 active:scale-[0.99] transition-all"
                        style={{ borderColor: 'var(--nz-border)' }}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar player={p} size={36} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                className="font-display text-[13.5px] font-bold truncate"
                                style={{ color: 'var(--nz-text)' }}
                              >
                                {p.name}
                              </span>
                              {p.is_owner && <OwnerBadge compact />}
                            </div>
                            <span
                              className="text-[12px] block truncate"
                              style={{ color: 'var(--nz-text-muted)' }}
                            >
                              @{p.username}
                            </span>
                          </div>
                        </div>
                        <span
                          className="text-[11px] font-semibold px-2.5 py-1 rounded-lg shrink-0"
                          style={{
                            background: 'var(--nz-elevated)',
                            color: 'var(--nz-accent-text)',
                          }}
                        >
                          Pilih
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <form onSubmit={handleOpenConfirm} className="flex flex-col gap-3.5">
              {/* Step 3: Selected Recipient Card */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] font-semibold" style={{ color: 'var(--nz-text-muted)' }}>
                    Penerima Dipilih
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRecipient(null);
                      setConfirmOpen(false);
                      setErrorMsg(null);
                    }}
                    className="text-[11.5px] font-semibold flex items-center gap-1 hover:opacity-80"
                    style={{ color: 'var(--nz-accent-text)' }}
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                    <span>Ganti</span>
                  </button>
                </div>

                <div
                  className="p-3 rounded-xl border flex items-center gap-3"
                  style={{
                    background: 'var(--nz-elevated)',
                    borderColor: 'var(--nz-border)',
                  }}
                >
                  <Avatar player={selectedRecipient} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="font-display text-[14px] font-bold truncate"
                        style={{ color: 'var(--nz-text)' }}
                      >
                        {selectedRecipient.name}
                      </span>
                      {selectedRecipient.is_owner && <OwnerBadge compact />}
                    </div>
                    <span
                      className="text-[12.5px] font-medium block truncate"
                      style={{ color: 'var(--nz-accent-text)' }}
                    >
                      @{selectedRecipient.username}
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 4: Input Jumlah Coin */}
              <div>
                <label
                  htmlFor="transfer-coin-amount"
                  className="block text-[12px] font-semibold mb-1.5"
                  style={{ color: 'var(--nz-text-muted)' }}
                >
                  Jumlah Coin
                </label>
                <div
                  className="flex items-center gap-2 px-3 h-11 rounded-xl border"
                  style={{
                    background: 'var(--nz-card)',
                    borderColor: 'var(--nz-border)',
                  }}
                >
                  <Coins className="w-4 h-4 shrink-0 text-[#FACC15]" strokeWidth={1.8} />
                  <input
                    id="transfer-coin-amount"
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    value={amountInput}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/[^0-9]/g, '');
                      setAmountInput(digits);
                      setErrorMsg(null);
                      setConfirmOpen(false);
                    }}
                    placeholder="Masukkan jumlah coin..."
                    className="flex-1 bg-transparent text-[15px] font-semibold tabular-nums focus:outline-none min-w-0"
                    style={{ color: 'var(--nz-text)' }}
                  />
                  {parsedAmount > 0 && (
                    <span className="text-[12px] font-medium shrink-0" style={{ color: 'var(--nz-text-muted)' }}>
                      Coin
                    </span>
                  )}
                </div>

                {/* Quick amount buttons */}
                <div className="grid grid-cols-4 gap-1.5 mt-2">
                  {QUICK_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setAmountInput(String(amt));
                        setErrorMsg(null);
                        setConfirmOpen(false);
                      }}
                      className="h-7 rounded-lg border text-[11.5px] font-semibold tabular-nums hover:opacity-90 transition-opacity"
                      style={{
                        background:
                          parsedAmount === amt ? 'var(--nz-btn-bg)' : 'var(--nz-card)',
                        color:
                          parsedAmount === amt ? 'var(--nz-btn-text)' : 'var(--nz-text-muted)',
                        borderColor: 'var(--nz-border)',
                      }}
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
              </div>

              {errorMsg && (
                <div className="px-3 py-2 rounded-xl border border-[#FF453A]/40 bg-[#FF453A]/10 text-[12.5px] font-medium text-[#FF453A]">
                  {errorMsg}
                </div>
              )}

              {/* Confirmation Prompt vs Send Button */}
              {confirmOpen ? (
                <div
                  className="p-3.5 rounded-xl border flex flex-col gap-3"
                  style={{
                    background: 'var(--nz-elevated)',
                    borderColor: 'var(--nz-accent)',
                  }}
                >
                  <p className="text-[13.5px] font-semibold text-center" style={{ color: 'var(--nz-text)' }}>
                    Kirim{' '}
                    <span className="text-[#FACC15] font-bold tabular-nums">
                      {formatNumber(parsedAmount)} coin
                    </span>{' '}
                    ke{' '}
                    <span style={{ color: 'var(--nz-accent-text)' }}>
                      @{selectedRecipient.username}
                    </span>
                    ?
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => setConfirmOpen(false)}
                      className="flex-1 h-9 rounded-xl border text-[12.5px] font-semibold hover:opacity-90 disabled:opacity-50"
                      style={{
                        background: 'var(--nz-card)',
                        borderColor: 'var(--nz-border)',
                        color: 'var(--nz-text-muted)',
                      }}
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleConfirmSend}
                      className="flex-1 h-9 rounded-xl text-[12.5px] font-bold flex items-center justify-center gap-1.5 hover:opacity-90 disabled:opacity-50"
                      style={{
                        background: 'var(--nz-btn-bg)',
                        color: 'var(--nz-btn-text)',
                      }}
                    >
                      <Send className="w-3.5 h-3.5" strokeWidth={2} />
                      <span>{submitting ? 'Mengirim...' : 'Ya'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="submit"
                  className="w-full h-10 rounded-xl text-[13.5px] font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.99] transition-all"
                  style={{
                    background: 'var(--nz-btn-bg)',
                    color: 'var(--nz-btn-text)',
                  }}
                >
                  <Send className="w-4 h-4" strokeWidth={2} />
                  <span>Kirim</span>
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
