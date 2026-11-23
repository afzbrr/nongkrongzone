import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  ImagePlus,
  MessageSquarePlus,
  Reply,
  Send,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import type { ChatGroup, ConversationItem, Message, Player } from '../types';
import { api, uploadMediaFile } from '../services/api';
import { formatClockTime, formatRelativeTime, sanitizeMediaUrl } from '../utils/format';
import { Avatar } from './Avatar';
import { OwnerBadge } from './PlayerBadges';

interface ChatViewProps {
  currentUser: Player;
  allPlayers: Player[];
  initialDmPeer?: Player | null;
  wsEvents: { event: string; payload: any; seq: number } | null;
  onClose: () => void;
  onOpenProfile: (username: string) => void;
}

const CHAT_REACTION_EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🙏'];

export const ChatView: React.FC<ChatViewProps> = ({
  currentUser,
  allPlayers,
  initialDmPeer,
  wsEvents,
  onClose,
  onOpenProfile,
}) => {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [filterTab, setFilterTab] = useState<'all' | 'dm' | 'group'>('all');

  // Active thread
  const [activeDmPeer, setActiveDmPeer] = useState<Player | null>(initialDmPeer || null);
  const [activeGroup, setActiveGroup] = useState<ChatGroup | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [threadBlocked, setThreadBlocked] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);

  // Composer
  const [text, setText] = useState('');
  const [replyTarget, setReplyTarget] = useState<Message | null>(null);
  const [pendingMedia, setPendingMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(
    null
  );
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedMsgId, setSelectedMsgId] = useState<string | null>(null);

  // Modals: New DM, New Group, Add Member
  const [newDmOpen, setNewDmOpen] = useState(false);
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedGroupMemberIds, setSelectedGroupMemberIds] = useState<string[]>([]);
  const [addMemberOpen, setAddMemberOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const loadConversations = async () => {
    try {
      const res = await api.getConversations();
      setConversations(res.conversations);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [currentUser.id]);

  useEffect(() => {
    if (initialDmPeer) {
      openDm(initialDmPeer);
    }
  }, [initialDmPeer?.id]);

  const openDm = async (peer: Player) => {
    setActiveGroup(null);
    setActiveDmPeer(peer);
    setReplyTarget(null);
    setSelectedMsgId(null);
    setLoadingThread(true);
    try {
      const res = await api.getDmMessages(peer.id);
      setActiveDmPeer(res.peer);
      setMessages(res.messages);
      setThreadBlocked(res.blocked);
      loadConversations();
    } finally {
      setLoadingThread(false);
    }
  };

  const openGroup = async (group: ChatGroup) => {
    setActiveDmPeer(null);
    setActiveGroup(group);
    setThreadBlocked(false);
    setReplyTarget(null);
    setSelectedMsgId(null);
    setLoadingThread(true);
    try {
      const res = await api.getGroupMessages(group.id);
      setActiveGroup(res.group);
      setMessages(res.messages);
    } finally {
      setLoadingThread(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeDmPeer?.id, activeGroup?.id]);

  useEffect(() => {
    if (!wsEvents) return;
    const { event, payload } = wsEvents;

    if (event === 'message:new' && payload) {
      const incoming: Message = payload;
      const belongsToActiveDm =
        activeDmPeer &&
        !incoming.group_id &&
        ((incoming.sender_id === activeDmPeer.id && incoming.receiver_id === currentUser.id) ||
          (incoming.sender_id === currentUser.id && incoming.receiver_id === activeDmPeer.id));
      const belongsToActiveGroup = activeGroup && incoming.group_id === activeGroup.id;

      if (belongsToActiveDm || belongsToActiveGroup) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === incoming.id)) return prev;
          return [...prev, incoming];
        });
        if (belongsToActiveDm && incoming.sender_id === activeDmPeer?.id) {
          api.markDmRead(activeDmPeer.id).catch(() => {});
        }
      }
      loadConversations();
    } else if (event === 'message:updated' && payload) {
      const updated: Message = payload;
      setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      loadConversations();
    } else if (event === 'chat:read' && payload) {
      const { reader_id, message_ids, read_at } = payload;
      if (activeDmPeer && reader_id === activeDmPeer.id) {
        setMessages((prev) =>
          prev.map((m) =>
            m.sender_id === currentUser.id &&
            (!message_ids || message_ids.includes(m.id))
              ? { ...m, is_read: true, read_at }
              : m
          )
        );
      }
      loadConversations();
    }
  }, [wsEvents?.seq]);

  const handleUploadChatMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadMediaFile(file);
      setPendingMedia({
        url: res.url,
        type: res.mediaType === 'video' ? 'video' : 'image',
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && !pendingMedia) || sending || uploading) return;
    if (!activeDmPeer && !activeGroup) return;

    setSending(true);
    try {
      const res = await api.sendMessage({
        receiver_id: activeDmPeer?.id || null,
        group_id: activeGroup?.id || null,
        reply_to_id: replyTarget?.id || null,
        text: text.trim() || null,
        media_url: pendingMedia?.url || null,
        media_type: pendingMedia?.type || 'text',
      });
      setMessages((prev) => {
        if (prev.some((m) => m.id === res.message.id)) return prev;
        return [...prev, res.message];
      });
      setText('');
      setPendingMedia(null);
      setReplyTarget(null);
      loadConversations();
    } finally {
      setSending(false);
    }
  };

  const handleReact = async (messageId: string, emoji: string) => {
    const res = await api.reactMessage(messageId, emoji);
    setMessages((prev) => prev.map((m) => (m.id === messageId ? res.message : m)));
    setSelectedMsgId(null);
  };

  const handleDeleteMessage = async (messageId: string, scope: 'me' | 'all') => {
    const res = await api.deleteMessage(messageId, scope);
    if (scope === 'me') {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } else if (res.message) {
      setMessages((prev) => prev.map((m) => (m.id === messageId ? res.message! : m)));
    }
    setSelectedMsgId(null);
    loadConversations();
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    const res = await api.createGroup({
      name: groupName.trim(),
      member_ids: selectedGroupMemberIds,
    });
    setNewGroupOpen(false);
    setGroupName('');
    setSelectedGroupMemberIds([]);
    await loadConversations();
    openGroup(res.group);
  };

  const handleAddMember = async (playerId: string) => {
    if (!activeGroup) return;
    await api.addGroupMember(activeGroup.id, playerId);
    const refreshed = await api.getGroupMessages(activeGroup.id);
    setActiveGroup(refreshed.group);
    setAddMemberOpen(false);
  };

  const filteredConversations = useMemo(() => {
    if (filterTab === 'all') return conversations;
    return conversations.filter((c) => c.type === filterTab);
  }, [conversations, filterTab]);

  const otherPlayers = useMemo(
    () => allPlayers.filter((p) => p.id !== currentUser.id && !p.is_blocked_by_me && !p.has_blocked_me),
    [allPlayers, currentUser.id]
  );

  // THREAD VIEW
  if (activeDmPeer || activeGroup) {
    return (
      <div className="fixed inset-0 z-40 flex justify-center" style={{ background: 'var(--nz-bg)' }}>
        <div
          className="w-full max-w-[480px] h-full sm:border-x flex flex-col"
          style={{
            background: 'var(--nz-bg)',
            borderColor: 'var(--nz-border)',
            color: 'var(--nz-text)',
          }}
        >
          {/* Thread Header */}
          <div
            className="h-12 px-2 border-b flex items-center justify-between gap-2 shrink-0 backdrop-blur-md"
            style={{ background: 'var(--nz-header-bg)', borderColor: 'var(--nz-border)' }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => {
                  setActiveDmPeer(null);
                  setActiveGroup(null);
                  loadConversations();
                }}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center"
                style={{ color: 'var(--nz-text)' }}
                aria-label="Kembali ke daftar chat"
              >
                <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
              </button>

              {activeDmPeer ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenProfile(activeDmPeer.username);
                  }}
                  className="flex items-center gap-2.5 min-w-0 text-left"
                >
                  <Avatar player={activeDmPeer} size={32} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="font-display text-[14px] font-bold truncate"
                        style={{ color: 'var(--nz-text)' }}
                      >
                        {activeDmPeer.name}
                      </span>
                      {activeDmPeer.is_owner && <OwnerBadge compact />}
                    </div>
                    <div className="text-[11px] truncate" style={{ color: 'var(--nz-text-muted)' }}>
                      @{activeDmPeer.username}
                    </div>
                  </div>
                </button>
              ) : activeGroup ? (
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-full border flex items-center justify-center shrink-0"
                    style={{ background: 'var(--nz-card)', borderColor: 'var(--nz-border)' }}
                  >
                    <Users className="w-4 h-4" style={{ color: 'var(--nz-text-muted)' }} strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0">
                    <div
                      className="font-display text-[14px] font-bold truncate"
                      style={{ color: 'var(--nz-text)' }}
                    >
                      {activeGroup.name}
                    </div>
                    <div className="text-[11px] tabular-nums" style={{ color: 'var(--nz-text-muted)' }}>
                      {activeGroup.members?.length || 0} anggota
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {activeGroup && (
              <button
                type="button"
                onClick={() => setAddMemberOpen(true)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center"
                style={{ color: 'var(--nz-text-muted)' }}
                aria-label="Tambah anggota grup"
              >
                <UserPlus className="w-[18px] h-[18px]" strokeWidth={1.5} />
              </button>
            )}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
            {loadingThread ? (
              <div className="py-12 text-center text-[13px]" style={{ color: 'var(--nz-text-muted)' }}>
                Memuat pesan...
              </div>
            ) : threadBlocked ? (
              <div className="py-16 text-center px-6 flex flex-col items-center gap-3">
                <p className="text-[13px]" style={{ color: 'var(--nz-text-muted)' }}>
                  Kamu tidak bisa mengirim atau menerima pesan dengan pengguna ini karena status blokir.
                </p>
                {activeDmPeer?.is_blocked_by_me && (
                  <button
                    type="button"
                    onClick={async () => {
                      await api.unblock(activeDmPeer.id);
                      openDm(activeDmPeer);
                    }}
                    className="h-8 px-4 rounded-full border text-[12px] font-medium"
                    style={{
                      background: 'var(--nz-card)',
                      borderColor: 'var(--nz-border)',
                      color: 'var(--nz-text)',
                    }}
                  >
                    Buka Blokir
                  </button>
                )}
              </div>
            ) : messages.length === 0 ? (
              <div className="py-16 text-center text-[13px]" style={{ color: 'var(--nz-text-muted)' }}>
                Belum ada pesan. Mulai obrolan sekarang.
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.sender_id === currentUser.id;
                const mediaUrl = sanitizeMediaUrl(msg.media_url);
                const isSelected = selectedMsgId === msg.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                  >
                    {!isMine && activeGroup && (
                      <div className="flex items-center gap-1.5 ml-2 mb-0.5">
                        <span
                          className="text-[11px] font-semibold"
                          style={{ color: 'var(--nz-accent-text)' }}
                        >
                          {msg.sender?.name || 'Anggota'}
                        </span>
                        {msg.sender?.is_owner && <OwnerBadge compact />}
                        <span className="text-[10.5px]" style={{ color: 'var(--nz-text-muted)' }}>
                          @{msg.sender?.username || 'anggota'}
                        </span>
                      </div>
                    )}

                    <div className="relative max-w-[80%]">
                      <div
                        onClick={() => setSelectedMsgId(isSelected ? null : msg.id)}
                        className="px-3.5 py-2 rounded-[16px] cursor-pointer transition-opacity border"
                        style={
                          isMine
                            ? {
                                background: 'var(--nz-bubble-mine-bg)',
                                color: 'var(--nz-bubble-mine-text)',
                                borderColor: 'transparent',
                              }
                            : {
                                background: 'var(--nz-bubble-other-bg)',
                                color: 'var(--nz-bubble-other-text)',
                                borderColor: 'var(--nz-border)',
                              }
                        }
                      >
                        {/* Quoted Reply Snippet */}
                        {msg.reply_to && !msg.is_deleted_for_all && (
                          <div className="mb-1.5 px-2.5 py-1.5 rounded-[10px] text-[11.5px] bg-black/15 opacity-90">
                            <div className="font-semibold text-[11px]">
                              Membalas @{msg.reply_to.sender?.username || 'user'}
                            </div>
                            <div className="truncate">
                              {msg.reply_to.is_deleted_for_all
                                ? 'Pesan ini dihapus'
                                : msg.reply_to.text || 'Media'}
                            </div>
                          </div>
                        )}

                        {msg.is_deleted_for_all ? (
                          <p className="text-[13px] italic opacity-65">Pesan ini dihapus</p>
                        ) : (
                          <>
                            {mediaUrl && (
                              <div className="mb-1.5 rounded-[10px] overflow-hidden bg-black">
                                {msg.media_type === 'video' ? (
                                  <video
                                    src={mediaUrl}
                                    controls
                                    className="w-full max-h-64 object-contain bg-black"
                                  />
                                ) : (
                                  <img
                                    src={mediaUrl}
                                    alt="Media chat"
                                    referrerPolicy="no-referrer"
                                    className="w-full max-h-64 object-contain bg-black"
                                  />
                                )}
                              </div>
                            )}

                            {msg.text && (
                              <p className="text-[13.5px] leading-[1.45] whitespace-pre-wrap break-words">
                                {msg.text}
                              </p>
                            )}
                          </>
                        )}

                        {/* Timestamp + Read Checkmarks */}
                        <div className="mt-1 flex items-center justify-end gap-1 text-[10px] tabular-nums opacity-70">
                          <span>{formatClockTime(msg.created_at)}</span>
                          {isMine && !msg.is_deleted_for_all && (
                            msg.is_read ? (
                              <CheckCheck className="w-3 h-3 text-[#38BDF8]" strokeWidth={2} />
                            ) : msg.delivered ? (
                              <CheckCheck className="w-3 h-3 opacity-75" strokeWidth={2} />
                            ) : (
                              <Check className="w-3 h-3 opacity-75" strokeWidth={2} />
                            )
                          )}
                        </div>
                      </div>

                      {/* Message Reaction Badge */}
                      {msg.react_emoji && !msg.is_deleted_for_all && (
                        <div
                          className={`absolute -bottom-2.5 ${
                            isMine ? 'left-2' : 'right-2'
                          } px-1.5 py-0.5 rounded-full border text-[11px] leading-none`}
                          style={{ background: 'var(--nz-modal-bg)', borderColor: 'var(--nz-border)' }}
                        >
                          {msg.react_emoji}
                        </div>
                      )}
                    </div>

                    {/* Message Context Action Bar */}
                    {isSelected && (
                      <div
                        className="mt-2 p-1.5 rounded-[12px] border flex items-center gap-1 flex-wrap z-10 shadow-md"
                        style={{ background: 'var(--nz-modal-bg)', borderColor: 'var(--nz-border)' }}
                      >
                        {!msg.is_deleted_for_all && (
                          <>
                            {CHAT_REACTION_EMOJIS.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => handleReact(msg.id, emoji)}
                                className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-[14px]"
                              >
                                {emoji}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                setReplyTarget(msg);
                                setSelectedMsgId(null);
                              }}
                              className="px-2.5 h-7 rounded-[8px] text-[11.5px] flex items-center gap-1"
                              style={{ color: 'var(--nz-text)' }}
                            >
                              <Reply className="w-3.5 h-3.5" strokeWidth={1.5} />
                              <span>Balas</span>
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(msg.id, 'me')}
                          className="px-2.5 h-7 rounded-[8px] text-[11.5px] text-[#FF453A] flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                          <span>Hapus utk Saya</span>
                        </button>
                        {isMine && !msg.is_deleted_for_all && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(msg.id, 'all')}
                            className="px-2.5 h-7 rounded-[8px] text-[11.5px] text-[#FF453A] font-medium"
                          >
                            Hapus utk Semua
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer */}
          {!threadBlocked && (
            <form
              onSubmit={handleSend}
              className="border-t p-2.5 pb-safe flex flex-col gap-2 backdrop-blur-md"
              style={{ background: 'var(--nz-header-bg)', borderColor: 'var(--nz-border)' }}
            >
              {replyTarget && (
                <div
                  className="px-3 py-1.5 rounded-[10px] border flex items-center justify-between gap-2 text-[12px]"
                  style={{ background: 'var(--nz-card)', borderColor: 'var(--nz-border)' }}
                >
                  <div className="min-w-0">
                    <span className="font-medium" style={{ color: 'var(--nz-accent-text)' }}>
                      Membalas @{replyTarget.sender?.username}
                    </span>
                    <p className="truncate" style={{ color: 'var(--nz-text-muted)' }}>
                      {replyTarget.text || 'Media'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyTarget(null)}
                    style={{ color: 'var(--nz-text-muted)' }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {pendingMedia && (
                <div
                  className="relative w-28 rounded-[10px] overflow-hidden border bg-black"
                  style={{ borderColor: 'var(--nz-border)' }}
                >
                  {pendingMedia.type === 'video' ? (
                    <video src={pendingMedia.url} className="w-full h-20 object-contain bg-black" />
                  ) : (
                    <img
                      src={pendingMedia.url}
                      alt="Lampiran"
                      referrerPolicy="no-referrer"
                      className="w-full h-20 object-contain bg-black"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setPendingMedia(null)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/80 text-white flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleUploadChatMedia}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="min-w-[40px] min-h-[40px] rounded-full border flex items-center justify-center"
                  style={{
                    background: 'var(--nz-card)',
                    borderColor: 'var(--nz-border)',
                    color: 'var(--nz-text-muted)',
                  }}
                  aria-label="Lampirkan foto atau video"
                >
                  <ImagePlus className="w-[18px] h-[18px]" strokeWidth={1.5} />
                </button>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={uploading ? 'Mengunggah media...' : 'Tulis pesan...'}
                  className="flex-1 border rounded-full px-4 py-2 text-[13.5px] focus:outline-none"
                  style={{
                    background: 'var(--nz-card)',
                    borderColor: 'var(--nz-border)',
                    color: 'var(--nz-text)',
                  }}
                />
                <button
                  type="submit"
                  disabled={(!text.trim() && !pendingMedia) || sending || uploading}
                  className="min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center disabled:opacity-40"
                  style={{ background: 'var(--nz-btn-bg)', color: 'var(--nz-btn-text)' }}
                  aria-label="Kirim pesan"
                >
                  <Send className="w-4 h-4" strokeWidth={1.75} />
                </button>
              </div>
            </form>
          )}

          {/* Add Group Member Modal */}
          {addMemberOpen && activeGroup && (
            <div className="fixed inset-0 z-50 bg-black/75 flex items-end justify-center">
              <div
                className="w-full max-w-[480px] max-h-[65dvh] border-t rounded-t-[16px] flex flex-col"
                style={{ background: 'var(--nz-modal-bg)', borderColor: 'var(--nz-border)' }}
              >
                <div
                  className="px-4 h-12 border-b flex items-center justify-between"
                  style={{ borderColor: 'var(--nz-border)' }}
                >
                  <span className="font-display text-[14px] font-bold" style={{ color: 'var(--nz-text)' }}>
                    Tambah Anggota Grup
                  </span>
                  <button type="button" onClick={() => setAddMemberOpen(false)}>
                    <X className="w-5 h-5" style={{ color: 'var(--nz-text-muted)' }} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-2">
                  {otherPlayers
                    .filter((p) => !(activeGroup.members || []).some((m) => m.id === p.id))
                    .map((p) => (
                      <div
                        key={p.id}
                        className="py-2.5 flex items-center justify-between border-b last:border-0"
                        style={{ borderColor: 'var(--nz-border)' }}
                      >
                        <div className="flex items-center gap-2.5">
                          <Avatar player={p} size={36} />
                          <div>
                            <div className="text-[13px] font-semibold" style={{ color: 'var(--nz-text)' }}>
                              {p.name}
                            </div>
                            <div className="text-[12px]" style={{ color: 'var(--nz-text-muted)' }}>
                              @{p.username}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddMember(p.id)}
                          className="h-7 px-3.5 rounded-full text-[12px] font-semibold"
                          style={{ background: 'var(--nz-btn-bg)', color: 'var(--nz-btn-text)' }}
                        >
                          Tambah
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // INBOX VIEW
  return (
    <div className="fixed inset-0 z-40 flex justify-center" style={{ background: 'var(--nz-bg)' }}>
      <div
        className="w-full max-w-[480px] h-full sm:border-x flex flex-col"
        style={{
          background: 'var(--nz-bg)',
          borderColor: 'var(--nz-border)',
          color: 'var(--nz-text)',
        }}
      >
        {/* Top Bar */}
        <div
          className="h-12 px-3 border-b flex items-center justify-between shrink-0 backdrop-blur-md"
          style={{ background: 'var(--nz-header-bg)', borderColor: 'var(--nz-border)' }}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center"
              style={{ color: 'var(--nz-text)' }}
              aria-label="Tutup chat"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
            </button>
            <h2
              className="font-display text-[16px] font-bold tracking-[-0.5px]"
              style={{ color: 'var(--nz-text)' }}
            >
              Obrolan
            </h2>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setNewDmOpen(true)}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center"
              style={{ color: 'var(--nz-text-muted)' }}
              aria-label="Chat baru"
            >
              <MessageSquarePlus className="w-[19px] h-[19px]" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => setNewGroupOpen(true)}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center"
              style={{ color: 'var(--nz-text-muted)' }}
              aria-label="Buat grup baru"
            >
              <Users className="w-[19px] h-[19px]" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 py-2 border-b flex items-center gap-2" style={{ borderColor: 'var(--nz-border)' }}>
          {(['all', 'dm', 'group'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilterTab(tab)}
              className="h-7 px-3 rounded-full text-[12px] font-semibold transition-colors border"
              style={
                filterTab === tab
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
              {tab === 'all' ? 'Semua' : tab === 'dm' ? 'Pribadi' : 'Grup'}
            </button>
          ))}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {loadingList ? (
            <div className="py-12 text-center text-[13px]" style={{ color: 'var(--nz-text-muted)' }}>
              Memuat obrolan...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center gap-2 px-6">
              <MessageSquarePlus className="w-6 h-6" style={{ color: 'var(--nz-text-muted)' }} strokeWidth={1.5} />
              <p className="text-[13px]" style={{ color: 'var(--nz-text-muted)' }}>
                Belum ada obrolan
              </p>
            </div>
          ) : (
            filteredConversations.map((item) => {
              const title = item.type === 'dm' ? item.peer?.name : item.group?.name;
              const last = item.last_message;
              const isMineLast = last?.sender_id === currentUser.id;

              return (
                <button
                  key={`${item.type}-${item.id}`}
                  type="button"
                  onClick={() => {
                    if (item.type === 'dm' && item.peer) openDm(item.peer);
                    else if (item.type === 'group' && item.group) openGroup(item.group);
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left border-b transition-opacity hover:opacity-85"
                  style={{ borderColor: 'var(--nz-border)' }}
                >
                  {item.type === 'dm' ? (
                    <Avatar player={item.peer} size={44} />
                  ) : (
                    <div
                      className="w-[44px] h-[44px] rounded-full border flex items-center justify-center shrink-0"
                      style={{ background: 'var(--nz-card)', borderColor: 'var(--nz-border)' }}
                    >
                      <Users className="w-5 h-5" style={{ color: 'var(--nz-text-muted)' }} strokeWidth={1.5} />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="font-display text-[14px] font-bold truncate"
                          style={{ color: 'var(--nz-text)' }}
                        >
                          {title || 'Obrolan'}
                        </span>
                        {item.type === 'dm' && item.peer?.is_owner && <OwnerBadge compact />}
                      </div>
                      {last && (
                        <span className="text-[11px] shrink-0" style={{ color: 'var(--nz-text-muted)' }}>
                          {formatRelativeTime(last.created_at)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <div
                        className="flex items-center gap-1 min-w-0 text-[12.5px]"
                        style={{ color: 'var(--nz-text-muted)' }}
                      >
                        {isMineLast && last && !last.is_deleted_for_all && (
                          last.is_read ? (
                            <CheckCheck className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" strokeWidth={1.75} />
                          ) : last.delivered ? (
                            <CheckCheck className="w-3.5 h-3.5 opacity-75 shrink-0" strokeWidth={1.75} />
                          ) : (
                            <Check className="w-3.5 h-3.5 opacity-75 shrink-0" strokeWidth={1.75} />
                          )
                        )}
                        <span className="truncate">
                          {last
                            ? last.text || (last.media_url ? 'Media' : 'Pesan')
                            : 'Belum ada pesan'}
                        </span>
                      </div>

                      {item.unread_count > 0 && (
                        <span
                          className="min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-semibold flex items-center justify-center tabular-nums shrink-0"
                          style={{ background: 'var(--nz-btn-bg)', color: 'var(--nz-btn-text)' }}
                        >
                          {item.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* New DM Picker Modal */}
        {newDmOpen && (
          <div className="fixed inset-0 z-50 bg-black/75 flex items-end justify-center">
            <div
              className="w-full max-w-[480px] max-h-[70dvh] border-t rounded-t-[16px] flex flex-col"
              style={{ background: 'var(--nz-modal-bg)', borderColor: 'var(--nz-border)' }}
            >
              <div
                className="px-4 h-12 border-b flex items-center justify-between"
                style={{ borderColor: 'var(--nz-border)' }}
              >
                <span className="font-display text-[14px] font-bold" style={{ color: 'var(--nz-text)' }}>
                  Mulai Chat Pribadi
                </span>
                <button type="button" onClick={() => setNewDmOpen(false)}>
                  <X className="w-5 h-5" style={{ color: 'var(--nz-text-muted)' }} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-2">
                {otherPlayers.length === 0 ? (
                  <p className="py-10 text-center text-[13px]" style={{ color: 'var(--nz-text-muted)' }}>
                    Belum ada pengguna lain
                  </p>
                ) : (
                  otherPlayers.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setNewDmOpen(false);
                        openDm(p);
                      }}
                      className="w-full py-2.5 flex items-center gap-2.5 text-left hover:opacity-80 border-b last:border-b-0"
                      style={{ borderColor: 'var(--nz-border)' }}
                    >
                      <Avatar player={p} size={36} />
                      <div>
                        <div className="text-[13px] font-semibold" style={{ color: 'var(--nz-text)' }}>
                          {p.name}
                        </div>
                        <div className="text-[12px]" style={{ color: 'var(--nz-text-muted)' }}>
                          @{p.username}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Create Group Modal */}
        {newGroupOpen && (
          <div className="fixed inset-0 z-50 bg-black/75 flex items-end justify-center">
            <form
              onSubmit={handleCreateGroup}
              className="w-full max-w-[480px] max-h-[75dvh] border-t rounded-t-[16px] flex flex-col"
              style={{ background: 'var(--nz-modal-bg)', borderColor: 'var(--nz-border)' }}
            >
              <div
                className="px-4 h-12 border-b flex items-center justify-between"
                style={{ borderColor: 'var(--nz-border)' }}
              >
                <span className="font-display text-[14px] font-bold" style={{ color: 'var(--nz-text)' }}>
                  Buat Grup Nongkrong
                </span>
                <button type="button" onClick={() => setNewGroupOpen(false)}>
                  <X className="w-5 h-5" style={{ color: 'var(--nz-text-muted)' }} />
                </button>
              </div>

              <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-3">
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Nama grup..."
                  required
                  className="w-full border rounded-[10px] px-3.5 py-2 text-[13px] focus:outline-none"
                  style={{
                    background: 'var(--nz-elevated)',
                    borderColor: 'var(--nz-border)',
                    color: 'var(--nz-text)',
                  }}
                />

                <div className="text-[12px]" style={{ color: 'var(--nz-text-muted)' }}>
                  Pilih Anggota:
                </div>
                <div
                  className="border rounded-[10px]"
                  style={{ background: 'var(--nz-elevated)', borderColor: 'var(--nz-border)' }}
                >
                  {otherPlayers.map((p) => {
                    const checked = selectedGroupMemberIds.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() =>
                          setSelectedGroupMemberIds((prev) =>
                            checked ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                          )
                        }
                        className="w-full px-3 py-2.5 flex items-center justify-between text-left border-b last:border-b-0"
                        style={{ borderColor: 'var(--nz-border)' }}
                      >
                        <div className="flex items-center gap-2.5">
                          <Avatar player={p} size={32} />
                          <div>
                            <div className="text-[13px] font-medium" style={{ color: 'var(--nz-text)' }}>
                              {p.name}
                            </div>
                            <div className="text-[11.5px]" style={{ color: 'var(--nz-text-muted)' }}>
                              @{p.username}
                            </div>
                          </div>
                        </div>
                        <div
                          className="w-5 h-5 rounded-full border flex items-center justify-center"
                          style={
                            checked
                              ? {
                                  background: 'var(--nz-btn-bg)',
                                  borderColor: 'var(--nz-btn-bg)',
                                  color: 'var(--nz-btn-text)',
                                }
                              : { borderColor: 'var(--nz-border)' }
                          }
                        >
                          {checked && <Check className="w-3 h-3" strokeWidth={2.5} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 border-t flex justify-end" style={{ borderColor: 'var(--nz-border)' }}>
                <button
                  type="submit"
                  disabled={!groupName.trim()}
                  className="h-9 px-5 rounded-full text-[12.5px] font-semibold disabled:opacity-40"
                  style={{ background: 'var(--nz-btn-bg)', color: 'var(--nz-btn-text)' }}
                >
                  Buat Grup
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
