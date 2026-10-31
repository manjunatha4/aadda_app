import { ActivityCategory, Language, MediaType, VibeMood } from '../enums';

export interface RegisterDto {
  email: string;
  phone?: string;
  username: string;
  displayName: string;
  password: string;
  language?: Language;
  district?: string;
}

export interface LoginDto {
  login: string; // username or email
  password: string;
  deviceToken?: string;
  platform?: 'android' | 'ios' | 'web';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface CreateAddaDto {
  name: string;
  description?: string;
  avatarUrl?: string;
}

export interface CreateInviteDto {
  maxUses?: number;
  expiresInHours?: number;
}

export interface AcceptInviteDto {
  inviteCode: string;
}

export interface SendMessageDto {
  conversationId: string;
  content: string;
  mediaUrl?: string;
  mediaType?: MediaType;
  replyToId?: string;
  idempotencyKey?: string;
}

export interface SetVibeDto {
  addaId?: string;
  mood: VibeMood;
  customNote?: string;
  durationHours?: number;
}

export interface CreateChaosPromptDto {
  addaId: string;
  promptText: string;
  promptTextKn?: string;
  category: ActivityCategory;
  durationMinutes?: number;
}

export interface SubmitChaosEntryDto {
  activityId: string;
  content?: string;
  mediaUrl?: string;
}

