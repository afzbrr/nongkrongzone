import React from 'react';

interface RichCaptionProps {
  text?: string | null;
  onSelectUsername?: (username: string) => void;
  className?: string;
}

export const RichCaption: React.FC<RichCaptionProps> = ({
  text,
  onSelectUsername,
  className = '',
}) => {
  if (!text) return null;

  const parts = text.split(/(@[a-zA-Z0-9_]+)/g);

  return (
    <p
      className={`text-[13.5px] leading-[1.5] whitespace-pre-wrap break-words ${className}`}
      style={{ color: 'var(--nz-text-body)' }}
    >
      {parts.map((part, idx) => {
        if (part.startsWith('@') && part.length > 1) {
          const username = part.slice(1);
          return (
            <button
              key={`${idx}-${part}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectUsername?.(username);
              }}
              className="font-medium hover:underline focus:outline-none"
              style={{ color: 'var(--nz-accent-text)' }}
            >
              {part}
            </button>
          );
        }
        return <React.Fragment key={idx}>{part}</React.Fragment>;
      })}
    </p>
  );
};
