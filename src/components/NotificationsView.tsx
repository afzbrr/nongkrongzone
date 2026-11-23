import React from 'react';
import { ArrowLeft, Bell, CheckCheck } from 'lucide-react';
import type { NotificationItem } from '../types';
import { formatRelativeTime } from '../utils/format';
import { Avatar } from './Avatar';

interface NotificationsViewProps {
  notifications: NotificationItem[];
  onClose: () => void;
  onMarkAllRead: () => void;
  onSelectNotification: (notif: NotificationItem) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  onClose,
  onMarkAllRead,
  onSelectNotification,
}) => {
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
              aria-label="Kembali"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
            </button>
            <h2
              className="font-display text-[16px] font-bold tracking-[-0.5px]"
              style={{ color: 'var(--nz-text)' }}
            >
              Notifikasi
            </h2>
          </div>

          {notifications.some((n) => !n.is_read) && (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="h-8 px-3 rounded-full text-[12px] font-medium flex items-center gap-1 hover:opacity-80"
              style={{ color: 'var(--nz-accent-text)' }}
            >
              <CheckCheck className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Baca semua</span>
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center gap-2">
              <Bell className="w-6 h-6" style={{ color: 'var(--nz-text-muted)' }} strokeWidth={1.5} />
              <p className="text-[13px]" style={{ color: 'var(--nz-text-muted)' }}>
                Belum ada notifikasi
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => onSelectNotification(n)}
                className="w-full px-4 py-3 flex items-start gap-3 text-left border-b transition-opacity hover:opacity-90"
                style={{
                  borderColor: 'var(--nz-border)',
                  background: !n.is_read ? 'var(--nz-card)' : 'transparent',
                }}
              >
                <Avatar player={n.from_player} size={36} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] leading-[1.45]" style={{ color: 'var(--nz-text-body)' }}>
                    {n.title}
                  </p>
                  <span
                    className="text-[11px] uppercase mt-0.5 block"
                    style={{ color: 'var(--nz-text-muted)' }}
                  >
                    {formatRelativeTime(n.created_at)}
                  </span>
                </div>
                {!n.is_read && (
                  <span
                    className="w-2 h-2 rounded-full mt-2 shrink-0"
                    style={{ background: 'var(--nz-accent)' }}
                  />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
