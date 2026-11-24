export interface Player {
  id: string;
  telegram_id: number | null;
  name: string;
  full_name?: string;
  username: string;
  avatar_url: string | null;
  telegram_avatar_url?: string | null;
  bio: string | null;
  coins: number;
  is_owner: boolean;
  is_banned: boolean;
  border_id: string | null;
  created_at: string;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
  is_following?: boolean;
  is_blocked_by_me?: boolean;
  has_blocked_me?: boolean;
  has_telegram_username?: boolean;
  follows_owner?: boolean;
}

export interface BorderItem {
  id: string;
  name: string;
  category: string;
  price_coins: number;
  is_owner_only: boolean;
  css_ring: string | null;
  icon_emoji: string | null;
  owned?: boolean;
}

export interface Post {
  id: string;
  player_id: string;
  caption: string | null;
  media_urls: string[] | null;
  media_type: 'text' | 'image' | 'video' | 'carousel' | string;
  tagged_usernames: string[] | null;
  original_post_id: string | null;
  repost_caption: string | null;
  is_deleted: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  player?: Player;
  original_post?: Post | null;
  liked_by_me?: boolean;
}

export interface PostComment {
  id: string;
  post_id: string;
  player_id: string;
  parent_comment_id: string | null;
  text: string;
  is_deleted: boolean;
  likes_count: number;
  created_at: string;
  player?: Player;
  liked_by_me?: boolean;
  replies?: PostComment[];
}

export interface Story {
  id: string;
  player_id: string;
  telegram_id?: number | null;
  media_url: string | null;
  media_type: 'text' | 'image' | 'video' | string;
  text?: string | null;
  caption: string | null;
  bg_color?: string | null;
  duration_hours?: number | null;
  song_title: string | null;
  song_url: string | null;
  song_artist: string | null;
  is_deleted: boolean;
  expires_at: string;
  created_at: string;
  player?: Player;
  viewed_by_me?: boolean;
  views_count?: number;
  reacts?: StoryReact[];
}

export interface StoryView {
  id: string;
  story_id: string;
  player_id: string;
  player?: Player;
}

export interface StoryReact {
  id: string;
  story_id: string;
  player_id: string;
  emoji: string;
  created_at: string;
  player?: Player;
}

export interface StoryGroup {
  player: Player;
  stories: Story[];
  has_unseen: boolean;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string | null;
  group_id: string | null;
  reply_to_id: string | null;
  text: string | null;
  media_url: string | null;
  media_type: 'image' | 'video' | 'text' | string | null;
  react_emoji: string | null;
  react_by: string | null;
  is_deleted_for_all: boolean;
  deleted_for_user_ids: string[] | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  sender?: Player;
  reply_to?: Message | null;
  delivered?: boolean;
}

export interface ChatGroup {
  id: string;
  name: string;
  avatar_url: string | null;
  created_by: string;
  created_at: string;
  members?: Player[];
  last_message?: Message | null;
  unread_count?: number;
}

export interface ConversationItem {
  type: 'dm' | 'group';
  id: string;
  peer?: Player;
  group?: ChatGroup;
  last_message: Message | null;
  unread_count: number;
}

export interface NotificationItem {
  id: string;
  to_player_id: string;
  from_player_id: string | null;
  type: 'like' | 'comment' | 'follow' | 'tag' | 'story_react' | 'story_reply' | 'mention' | string;
  title: string;
  post_id: string | null;
  is_read: boolean;
  created_at: string;
  from_player?: Player | null;
}
