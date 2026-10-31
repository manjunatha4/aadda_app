import { AddaRole, ConversationType, Language, VibeMood } from '../enums';

export interface UserProfile {
  id: string;
  email: string;
  phone?: string | null;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  district?: string | null;
  language: Language;
  isVerified: boolean;
  createdAt: string;
}

export interface AddaSummary {
  id: string;
  name: string;
  description?: string | null;
  avatarUrl?: string | null;
  creatorId: string;
  memberCount: number;
  role?: AddaRole;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  type: ConversationType;
  addaId?: string | null;
  addaName?: string | null;
  addaAvatarUrl?: string | null;
  lastMessage?: {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

export interface VibeStatusDto {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  addaId?: string | null;
  mood: VibeMood;
  customNote?: string | null;
  expiresAt: string;
  createdAt: string;
}

export type ChaosPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ChaosStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface DailyChaosItem {
  id: string;
  userId: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  deadline?: string; // HH:mm or formatted
  priority: ChaosPriority;
  category: string;
  tags: string[];
  status: ChaosStatus;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DailyChaosStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
}

