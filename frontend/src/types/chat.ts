export interface User {
  id: number;
  username: string;
  avatar?: string;
}

export interface Message {
  id?: number;
  fromUserId: number;
  content: string;
  timestamp: Date;
  type?: 'text' | 'image' | 'file';
}

export interface ChatSession {
  id: number;
  type: 'private' | 'group';
  targetUser?: User;
  lastMessage?: string;
  lastTime?: Date;
  unreadCount?: number;
}