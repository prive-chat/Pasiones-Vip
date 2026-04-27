export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  cover_url?: string;
  bio?: string;
  is_verified: boolean;
  is_private: boolean;
  role: 'user' | 'super_admin';
  created_at: string;
}

export interface MediaItem {
  id: string;
  user_id: string;
  url: string;
  type: 'image' | 'video';
  caption?: string;
  shares_count?: number;
  created_at: string;
  profiles?: UserProfile;
  likes_count?: number;
  is_liked?: boolean;
  reaction_type?: string | null;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  media_url?: string | null;
  media_type?: 'image' | 'video' | null;
  ref_post_id?: string | null;
  reactions?: Record<string, string>;
  is_read: boolean;
  read_at?: string;
  is_delivered?: boolean;
  delivered_at?: string;
  deleted_by_sender?: boolean;
  deleted_by_receiver?: boolean;
  created_at: string;
  sender?: UserProfile;
}

export interface Ad {
  id: string;
  title: string;
  description?: string;
  cta_text?: string;
  image_url: string;
  link_url?: string;
  type: 'image' | 'video';
  placement: 'feed' | 'sidebar' | 'interstitial';
  status: 'active' | 'paused' | 'scheduled';
  impressions: number;
  clicks: number;
  cost_per_click?: number;
  cost_per_impression?: number;
  total_budget?: number;
  spent_budget?: number;
  priority?: number;
  starts_at: string;
  ends_at?: string;
  created_at: string;
  shares_count?: number;
  likes_count?: number;
  is_liked?: boolean;
  reaction_type?: string | null;
}

export interface Like {
  id: string;
  user_id: string;
  media_id: string;
  created_at: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  status: 'pending' | 'accepted';
  created_at: string;
}

export interface Conversation {
  userId: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  profile?: UserProfile;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'message' | 'verification' | 'system' | 'like' | 'follow_request' | 'follow_accept';
  title: string;
  content: string;
  is_read: boolean;
  link?: string;
  created_at: string;
  sender_id?: string;
  sender?: UserProfile;
}
