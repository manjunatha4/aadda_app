import { AddaRole, BuzzCategory, BuzzCredibility, BuzzExpiry, ConversationType, Language, VibeMood } from '../enums';
export interface UserProfile {
    id: string;
    email: string;
    phone?: string | null;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
    bio?: string | null;
    state?: string | null;
    district?: string | null;
    language: Language;
    isVerified: boolean;
    isEmailVerified?: boolean;
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
    date: string;
    deadline?: string;
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
export interface BuzzPollOption {
    id: string;
    text: string;
    votesCount: number;
    voterIds: string[];
}
export interface BuzzLinkPreview {
    url: string;
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
}
export interface BuzzComment {
    id: string;
    postId: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string | null;
    content: string;
    parentId?: string | null;
    mentions: string[];
    createdAt: string;
    replies?: BuzzComment[];
}
export interface BuzzPost {
    id: string;
    addaId: string;
    addaName?: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string | null;
    isAnonymous: boolean;
    category: BuzzCategory;
    credibility: BuzzCredibility;
    expiry: BuzzExpiry;
    expiresAt?: string | null;
    title?: string;
    content: string;
    mediaUrl?: string | null;
    mediaType?: 'IMAGE' | 'VIDEO' | 'AUDIO' | null;
    linkPreview?: BuzzLinkPreview | null;
    pollOptions?: BuzzPollOption[];
    reactions: Record<string, number>;
    userReactions: string[];
    commentsCount: number;
    bookmarksCount: number;
    isBookmarked?: boolean;
    isTrending?: boolean;
    engagementScore?: number;
    createdAt: string;
    updatedAt: string;
}
export interface CreateBuzzPostDto {
    addaId: string;
    category: BuzzCategory;
    credibility?: BuzzCredibility;
    expiry?: BuzzExpiry;
    isAnonymous?: boolean;
    anonymousPersona?: string;
    title?: string;
    content: string;
    mediaUrl?: string;
    mediaType?: 'IMAGE' | 'VIDEO' | 'AUDIO';
    linkUrl?: string;
    pollOptions?: string[];
}
export interface AddBuzzCommentDto {
    content: string;
    parentId?: string | null;
}
export interface VoteBuzzPollDto {
    optionId: string;
}
export interface ToggleBuzzReactionDto {
    emoji: string;
}
export interface ReportBuzzPostDto {
    reason: string;
    details?: string;
}
