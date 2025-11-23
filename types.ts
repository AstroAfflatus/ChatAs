export interface UserData {
  userId: string;
  displayName: string;
  email: string;
  phoneNumber?: string;
  bio: string;
  profilePicture: string;
  createdAt: number;
  status?: string;
  blockedUsers?: string[];
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  status: 'sent' | 'delivered' | 'seen';
  type: 'text' | 'deleted';
  isDeleted?: boolean;
}

export interface ChatContact {
  uid: string;
  displayName: string;
  profilePicture: string;
  lastMessage?: Message;
  unreadCount?: number;
  isPinned?: boolean;
}

export interface StatusItem {
  id: string;
  userId: string;
  type: 'text' | 'image';
  content: string; // Text content or Image URL
  background?: string; // CSS gradient for text status
  timestamp: number;
  expiresAt: number;
  viewers?: Record<string, number>;
}

export interface CallLog {
  id: string;
  callerId: string;
  calleeId: string;
  type: 'voice' | 'video';
  status: 'ringing' | 'active' | 'ended' | 'rejected' | 'missed';
  startTime: number;
  endTime?: number;
  offer?: any;
  answer?: any;
}