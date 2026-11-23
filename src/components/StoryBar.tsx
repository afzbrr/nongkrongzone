import React from 'react';
import { Crown, Plus } from 'lucide-react';
import type { Player, StoryGroup } from '../types';
import { formatRemainingTime } from '../utils/format';
import { Avatar } from './Avatar';

interface StoryBarProps {
  currentUser: Player;
  storyGroups: StoryGroup[];
  onOpenStoryGroup: (groupIndex: number) => void;
  onCreateStory: () => void;
}

export const StoryBar: React.FC<StoryBarProps> = ({
  currentUser,
  storyGroups,
  onOpenStoryGroup,
  onCreateStory,
}) => {
  const now = Date.now();
  const activeGroups = storyGroups
    .map((g) => ({
      ...g,
      stories: g.stories.filter((s) => new Date(s.expires_at).getTime() > now),
    }))
    .filter((g) => g.stories.length > 0);

  const myGroup = activeGroups.find((g) => g.player.id === currentUser.id) || null;
  const myOriginalIndex = storyGroups.findIndex((g) => g.player.id === currentUser.id);
  const otherGroups = activeGroups.filter((g) => g.player.id !== currentUser.id);
  const myLatestStory = myGroup?.stories[myGroup.stories.length - 1];

  return (
    <div
      className="w-full border-b px-4 py-3 flex items-start gap-3 overflow-x-auto no-scrollbar"
      style={{ borderColor: 'var(--nz-border)' }}
    >
      {/* Leftmost: Story Kamu + */}
      <div className="flex flex-col items-center gap-1 shrink-0 w-[68px]">
        <div className="relative">
          {myGroup ? (
            <div
              className={
                currentUser.is_owner
                  ? 'rounded-full p-[2.5px] bg-gradient-to-tr from-[#B45309] via-[#FFD60A] to-[#FEF08A]'
                  : ''
              }
            >
              <Avatar
                player={currentUser}
                size={56}
                storyRing={currentUser.is_owner ? 'none' : myGroup.has_unseen ? 'unseen' : 'seen'}
                onClick={() => myOriginalIndex >= 0 && onOpenStoryGroup(myOriginalIndex)}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={onCreateStory}
              className="w-[56px] h-[56px] rounded-full border flex items-center justify-center hover:opacity-90 transition-opacity"
              style={{
                background: 'var(--nz-card)',
                borderColor: 'var(--nz-border)',
                color: 'var(--nz-text-muted)',
              }}
              aria-label="Buat Story Kamu"
            >
              <Plus className="w-5 h-5" strokeWidth={1.5} />
            </button>
          )}

          {myGroup && currentUser.is_owner && (
            <span
              aria-hidden="true"
              className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[#111111] border border-[#FFD60A] flex items-center justify-center shadow"
            >
              <Crown className="w-3 h-3 text-[#FFD60A] fill-[#FFD60A]" strokeWidth={1.8} />
            </span>
          )}

          <button
            type="button"
            onClick={onCreateStory}
            aria-label="Tambah Story Baru"
            className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center hover:scale-105 transition-transform"
            style={{
              background: 'var(--nz-btn-bg)',
              color: 'var(--nz-btn-text)',
              borderColor: 'var(--nz-bg-solid)',
            }}
          >
            <Plus className="w-3 h-3" strokeWidth={2.5} />
          </button>
        </div>

        <span
          className="text-[11px] font-medium truncate w-full text-center"
          style={{ color: 'var(--nz-text-body)' }}
        >
          Story Kamu +
        </span>
        {myLatestStory && (
          <span
            className="text-[10px] leading-none truncate w-full text-center"
            style={{ color: 'var(--nz-text-muted)' }}
          >
            {formatRemainingTime(myLatestStory.expires_at)}
          </span>
        )}
      </div>

      {/* Friend Active Stories */}
      {otherGroups.map((group) => {
        const realIndex = storyGroups.findIndex((g) => g.player.id === group.player.id);
        const latestStory = group.stories[group.stories.length - 1];
        const isOwner = Boolean(group.player.is_owner);

        return (
          <div
            key={group.player.id}
            className="flex flex-col items-center gap-1 shrink-0 w-[68px]"
          >
            <div className="relative">
              <div
                className={
                  isOwner
                    ? 'rounded-full p-[2.5px] bg-gradient-to-tr from-[#B45309] via-[#FFD60A] to-[#FEF08A] shadow-[0_0_12px_rgba(255,214,10,0.45)]'
                    : ''
                }
              >
                <Avatar
                  player={group.player}
                  size={56}
                  storyRing={isOwner ? 'none' : group.has_unseen ? 'unseen' : 'seen'}
                  onClick={() => realIndex >= 0 && onOpenStoryGroup(realIndex)}
                />
              </div>

              {isOwner && (
                <span
                  aria-hidden="true"
                  className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[#111111] border border-[#FFD60A] flex items-center justify-center shadow"
                >
                  <Crown className="w-3 h-3 text-[#FFD60A] fill-[#FFD60A]" strokeWidth={1.8} />
                </span>
              )}
            </div>

            <span
              className="text-[11px] font-medium truncate w-full text-center"
              style={{ color: 'var(--nz-text-body)' }}
            >
              {group.player.name || group.player.username}
            </span>
            {latestStory && (
              <span
                className="text-[10px] leading-none truncate w-full text-center"
                style={{ color: isOwner ? '#FACC15' : 'var(--nz-text-muted)' }}
              >
                {formatRemainingTime(latestStory.expires_at)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
