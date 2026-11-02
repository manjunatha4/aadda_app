import { storage } from './storage';
import {
  DailyChaosItem,
  DailyChaosStats,
  ChaosPriority,
  ChaosStatus,
  BuzzPost,
  BuzzCategory,
  BuzzCredibility,
  BuzzExpiry,
  BuzzComment,
  CreateBuzzPostDto,
} from '@aadda/shared';

export interface LocalUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  state?: string;
  district?: string;
  language?: string;
  avatarUrl?: string;
  isEmailVerified?: boolean;
  verificationCode?: string;
  verificationExpires?: string;
  passwordHash?: string;
  salt?: string;
  createdAt?: string;
}

export interface LocalAdda {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  inviteCode: string;
  creatorId: string;
  conversationId: string;
  memberCount: number;
  myRole: 'OWNER' | 'ADMIN' | 'MEMBER';
}

export interface LocalMessage {
  id: string;
  conversationId: string;
  senderId: string;
  sender: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl?: string;
  };
  content: string;
  mediaUrl?: string | null;
  createdAt: string;
  reactions: Array<{ id: string; emoji: string; userId: string }>;
}

export interface LocalConversation {
  id: string;
  type: 'ADDA' | 'DIRECT';
  name: string;
  addaId?: string;
  adda?: LocalAdda;
  lastMessage?: {
    content: string;
    createdAt: string;
  };
  members: LocalUser[];
}

function normalizeRoomCode(code: string): string {
  if (!code || typeof code !== 'string') return '';
  return code
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .replace(/^ADDA/, '');
}

export interface SavedFolder {
  id: string;
  title: string;
  color: string;
  emoji: string;
  count: number;
}

export interface SavedItem {
  id: string;
  title: string;
  description: string;
  tag: string;
  date: string;
}

const STORAGE_KEYS = {
  USERS: 'aadda_client_users',
  CURRENT_USER: 'aadda_client_current_user',
  ADDAS: 'aadda_client_addas',
  CONVERSATIONS: 'aadda_client_conversations',
  MESSAGES: 'aadda_client_messages',
  FOLDERS: 'aadda_client_folders',
  FOLDER_ITEMS: 'aadda_client_folder_items',
  DAILY_CHAOS: 'aadda_client_daily_chaos',
  BUZZ_POSTS: 'aadda_client_buzz_posts',
  BUZZ_COMMENTS: 'aadda_client_buzz_comments',
  BUZZ_BOOKMARKS: 'aadda_client_buzz_bookmarks',
  BUZZ_REPORTS: 'aadda_client_buzz_reports',
};

const DEFAULT_FOLDERS: SavedFolder[] = [];

const DEFAULT_FOLDER_ITEMS: Record<string, SavedItem[]> = {};

const CLOUD_SYNC_URL = 'https://api.restful-api.dev/objects/ff808181a09d98f701a19413d89279c4';

const DEFAULT_BUZZ_POSTS: BuzzPost[] = [
  {
    id: 'buzz_spill_1',
    addaId: 'default',
    addaName: 'Varavu Adda',
    authorId: 'usr_reporter',
    authorName: 'Varun K.',
    authorAvatar: null,
    isAnonymous: false,
    category: BuzzCategory.SPILL_THE_TEA,
    credibility: BuzzCredibility.PERSONAL_EXPERIENCE,
    expiry: BuzzExpiry.PERMANENT,
    title: 'Apparently, something crazy happened in college today... 👀',
    content: 'Prof announced a surprise viva right after fest practice! Half the gang pretended their webcams and mics were broken 😂. Anyone got the Unit 3 notes? Spill below! ☕',
    reactions: { '😂': 14, '👀': 8, '🍿': 12, '☕': 9 },
    userReactions: [],
    commentsCount: 8,
    bookmarksCount: 4,
    isBookmarked: false,
    isTrending: true,
    engagementScore: 18.5,
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: 'buzz_tribunal_1',
    addaId: 'default',
    addaName: 'Varavu Adda',
    authorId: 'usr_circle',
    authorName: 'Sneha Rao',
    authorAvatar: null,
    isAnonymous: false,
    category: BuzzCategory.POLL_HOT_TAKE,
    credibility: BuzzCredibility.PERSONAL_EXPERIENCE,
    expiry: BuzzExpiry.PERMANENT,
    title: "What's the Verdict? 🗳️",
    content: "Debate of the semester: Late-night canteen Maggi vs Morning hot crispy masala dosa? Let's vote, guru!",
    pollOptions: [
      { id: 'opt_1', text: 'Late-night Canteen Maggi 🍜', votesCount: 42, voterIds: [] },
      { id: 'opt_2', text: 'Crispy Masala Dosa 🥞', votesCount: 38, voterIds: [] },
      { id: 'opt_3', text: 'Filter Coffee only ☕', votesCount: 19, voterIds: [] },
    ],
    reactions: { '🔥': 22, '🍿': 15, '😂': 9 },
    userReactions: [],
    commentsCount: 14,
    bookmarksCount: 6,
    isBookmarked: false,
    isTrending: true,
    engagementScore: 24.2,
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: 'buzz_trending_1',
    addaId: 'default',
    addaName: 'Varavu Adda',
    authorId: 'usr_rohit',
    authorName: 'Rohit M.',
    authorAvatar: null,
    isAnonymous: false,
    category: BuzzCategory.HOT_TAKE,
    credibility: BuzzCredibility.PERSONAL_EXPERIENCE,
    expiry: BuzzExpiry.PERMANENT,
    title: 'Hot Take of the Day 🔥',
    content: 'Weekend group study always ends up as a food crawl. Started DBMS at 4 PM, by 5:30 we were at CTR eating benne dosa discussing IPL auctions! Every single time. 🔥',
    reactions: { '😂': 31, '🔥': 24, '❤️': 18 },
    userReactions: [],
    commentsCount: 11,
    bookmarksCount: 7,
    isBookmarked: false,
    isTrending: true,
    engagementScore: 32.1,
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: 'buzz_news_1',
    addaId: 'default',
    addaName: 'Varavu Adda',
    authorId: 'usr_desk',
    authorName: 'Adda Campus Desk',
    authorAvatar: null,
    isAnonymous: false,
    category: BuzzCategory.NEWS,
    credibility: BuzzCredibility.VERIFIED_NEWS,
    expiry: BuzzExpiry.PERMANENT,
    title: 'Karnataka State Inter-College Fest Registrations Open! 📰',
    content: 'Cultural events, technical hackathons, and esports registrations are officially open. Teams of 4 allowed. Let us represent our Adda! 🚀',
    linkPreview: {
      url: 'https://karnataka.gov.in',
      title: 'State Inter-College Youth Festival 2026',
      description: 'Official schedule and registration portal.',
      siteName: 'CAMPUS RADAR',
    },
    reactions: { '🔥': 19, '❤️': 14, '🍿': 7 },
    userReactions: [],
    commentsCount: 5,
    bookmarksCount: 8,
    isBookmarked: false,
    isTrending: false,
    engagementScore: 16.0,
    createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
  },
  {
    id: 'buzz_confession_1',
    addaId: 'default',
    addaName: 'Varavu Adda',
    authorId: 'usr_anon_1',
    authorName: 'Blue Gorilla 🦍',
    authorAvatar: null,
    isAnonymous: true,
    category: BuzzCategory.CONFESSION,
    credibility: BuzzCredibility.PERSONAL_EXPERIENCE,
    expiry: BuzzExpiry.PERMANENT,
    title: 'Anonymous Confession #42 🤫',
    content: 'I was the one who hid the lab projector remote during the 8 AM lecture last Friday... I just needed 30 mins of extra sleep.',
    reactions: { '😂': 28, '💀': 16, '👀': 11 },
    userReactions: [],
    commentsCount: 9,
    bookmarksCount: 3,
    isBookmarked: false,
    isTrending: true,
    engagementScore: 21.4,
    createdAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
  },
];

const DEFAULT_BUZZ_COMMENTS: Record<string, BuzzComment[]> = {};

class ClientStore {
  private users: LocalUser[] = [];
  private addas: LocalAdda[] = [];
  private conversations: LocalConversation[] = [];
  private messages: Record<string, LocalMessage[]> = {};
  private folders: SavedFolder[] = DEFAULT_FOLDERS;
  private folderItems: Record<string, SavedItem[]> = DEFAULT_FOLDER_ITEMS;
  private dailyChaos: Record<string, DailyChaosItem[]> = {};
  private buzzPosts: Record<string, BuzzPost[]> = {};
  private buzzComments: Record<string, BuzzComment[]> = {};
  private buzzBookmarks: Record<string, string[]> = {};
  private buzzReports: any[] = [];
  private initialized = false;

  async init() {
    if (this.initialized) return;

    try {
      const [u, a, c, m, f, fi, dc, bp, bc, bb, br] = await Promise.all([
        storage.getItem(STORAGE_KEYS.USERS),
        storage.getItem(STORAGE_KEYS.ADDAS),
        storage.getItem(STORAGE_KEYS.CONVERSATIONS),
        storage.getItem(STORAGE_KEYS.MESSAGES),
        storage.getItem(STORAGE_KEYS.FOLDERS),
        storage.getItem(STORAGE_KEYS.FOLDER_ITEMS),
        storage.getItem(STORAGE_KEYS.DAILY_CHAOS),
        storage.getItem(STORAGE_KEYS.BUZZ_POSTS),
        storage.getItem(STORAGE_KEYS.BUZZ_COMMENTS),
        storage.getItem(STORAGE_KEYS.BUZZ_BOOKMARKS),
        storage.getItem(STORAGE_KEYS.BUZZ_REPORTS),
      ]);

      this.users = u ? JSON.parse(u) : [];
      this.addas = a ? JSON.parse(a) : [];
      this.conversations = c ? JSON.parse(c) : [];
      this.messages = m ? JSON.parse(m) : {};
      this.folders = f ? JSON.parse(f) : DEFAULT_FOLDERS;
      this.folderItems = fi ? JSON.parse(fi) : DEFAULT_FOLDER_ITEMS;
      this.dailyChaos = dc ? JSON.parse(dc) : {};
      this.buzzPosts = bp ? JSON.parse(bp) : { default: DEFAULT_BUZZ_POSTS };
      this.buzzComments = bc ? JSON.parse(bc) : DEFAULT_BUZZ_COMMENTS;
      this.buzzBookmarks = bb ? JSON.parse(bb) : {};
      this.buzzReports = br ? JSON.parse(br) : [];

      

      // Try background sync with global cloud store
      if (typeof fetch !== 'undefined') {
        fetch(CLOUD_SYNC_URL)
          .then((r) => r.json())
          .then((cloud) => {
            if (cloud?.data?.addas && Array.isArray(cloud.data.addas)) {
              // Merge cloud addas
              const existingIds = new Set(this.addas.map((x) => x.id));
              for (const ca of cloud.data.addas) {
                if (!existingIds.has(ca.id)) {
                  this.addas.unshift(ca);
                }
              }
            }
            if (cloud?.data?.dailyChaos && typeof cloud.data.dailyChaos === 'object') {
              for (const [uid, items] of Object.entries(cloud.data.dailyChaos)) {
                if (Array.isArray(items)) {
                  const localItems = this.dailyChaos[uid] || [];
                  const existingItemIds = new Set(localItems.map((x) => x.id));
                  for (const ci of items as DailyChaosItem[]) {
                    if (!existingItemIds.has(ci.id)) {
                      localItems.push(ci);
                    }
                  }
                  this.dailyChaos[uid] = localItems;
                }
              }
            }
          })
          .catch(() => {});
      }
    } catch {
      // ignore
    }
    this.initialized = true;
  }

  private async persist() {
    try {
      await Promise.all([
        storage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.users)),
        storage.setItem(STORAGE_KEYS.ADDAS, JSON.stringify(this.addas)),
        storage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(this.conversations)),
        storage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(this.messages)),
        storage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(this.folders)),
        storage.setItem(STORAGE_KEYS.FOLDER_ITEMS, JSON.stringify(this.folderItems)),
        storage.setItem(STORAGE_KEYS.DAILY_CHAOS, JSON.stringify(this.dailyChaos)),
        storage.setItem(STORAGE_KEYS.BUZZ_POSTS, JSON.stringify(this.buzzPosts)),
        storage.setItem(STORAGE_KEYS.BUZZ_COMMENTS, JSON.stringify(this.buzzComments)),
        storage.setItem(STORAGE_KEYS.BUZZ_BOOKMARKS, JSON.stringify(this.buzzBookmarks)),
        storage.setItem(STORAGE_KEYS.BUZZ_REPORTS, JSON.stringify(this.buzzReports)),
      ]);
    } catch {
      // ignore
    }
  }

  async checkEmail(email: string) {
    await this.init();
    const clean = email.trim().toLowerCase();
    const existing = this.users.find(
      (u) => u.email.toLowerCase() === clean && u.isEmailVerified !== false,
    );
    if (existing) {
      return { available: false, message: 'This email is already registered. Please sign in.' };
    }
    return { available: true, message: 'Email is available' };
  }

  async checkUsername(username: string) {
    await this.init();
    const clean = username.trim().toLowerCase();
    const existing = this.users.find((u) => u.username.toLowerCase() === clean);
    if (existing) {
      return { available: false, message: 'Username is already taken' };
    }
    return { available: true, message: 'Username is available' };
  }

  async findUserByLogin(login: string) {
    await this.init();
    const clean = login.trim().toLowerCase();
    return this.users.find(
      (u) => u.email.toLowerCase() === clean || u.username.toLowerCase() === clean,
    );
  }

  async login(login: string, password?: string) {
    await this.init();
    const clean = login.trim().toLowerCase();
    let user = this.users.find(
      (u) => u.email.toLowerCase() === clean || u.username.toLowerCase() === clean,
    );

    if (!user) {
      const username = clean.includes('@') ? clean.split('@')[0] : clean;
      const email = clean.includes('@') ? clean : `${clean}@aadda.app`;
      user = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        email,
        username,
        displayName: username,
        state: 'Karnataka',
        district: 'Bengaluru Urban',
        isEmailVerified: true,
        language: 'en',
      };
      this.users.push(user);
      await this.persist();
    }

    if (user.isEmailVerified === false) {
      return {
        requiresVerification: true,
        email: user.email,
        verificationCode: user.verificationCode,
        message: 'Please verify your email address to continue.',
      };
    }

    await storage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    await storage.setItem('accessToken', `token_${user.id}`);
    await storage.setItem('refreshToken', `ref_${user.id}`);

    return {
      user,
      tokens: {
        accessToken: `token_${user.id}`,
        refreshToken: `ref_${user.id}`,
      },
    };
  }

  async register(data: {
    username: string;
    displayName?: string;
    email: string;
    state?: string;
    district?: string;
    password?: string;
    language?: string;
  }) {
    await this.init();
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanUsername = data.username.trim().toLowerCase();
    let user = this.users.find((u) => u.email.toLowerCase() === cleanEmail);

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    if (user) {
      user.displayName = data.displayName || cleanUsername;
      user.username = cleanUsername;
      user.state = data.state || user.state || 'Karnataka';
      user.district = data.district || user.district || 'Bengaluru Urban';
      user.verificationCode = code;
      user.verificationExpires = expires;
      user.isEmailVerified = false;
    } else {
      user = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        email: cleanEmail,
        username: cleanUsername,
        displayName: data.displayName?.trim() || cleanUsername,
        state: data.state || 'Karnataka',
        district: data.district || 'Bengaluru Urban',
        isEmailVerified: false,
        verificationCode: code,
        verificationExpires: expires,
        language: data.language || 'en',
        createdAt: new Date().toISOString(),
      };
      this.users.push(user);
    }

    await this.persist();

    return {
      success: true,
      email: user.email,
      verificationCode: code,
      message: 'Account created! Please verify your email.',
    };
  }

  async verifyEmail(email: string, code: string) {
    await this.init();
    const cleanEmail = email.trim().toLowerCase();
    const user = this.users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      throw new Error('User not found');
    }

    if (user.verificationCode && user.verificationCode !== code.trim()) {
      throw new Error('Invalid verification code');
    }

    user.isEmailVerified = true;
    delete user.verificationCode;
    delete user.verificationExpires;
    await this.persist();

    await storage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    await storage.setItem('accessToken', `token_${user.id}`);
    await storage.setItem('refreshToken', `ref_${user.id}`);

    return {
      success: true,
      user,
      tokens: {
        accessToken: `token_${user.id}`,
        refreshToken: `ref_${user.id}`,
      },
    };
  }

  async resendCode(email: string) {
    await this.init();
    const cleanEmail = email.trim().toLowerCase();
    const user = this.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      throw new Error('User not found');
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = code;
    user.verificationExpires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    await this.persist();
    return {
      success: true,
      verificationCode: code,
      message: 'Verification code resent successfully',
    };
  }

  async getCurrentUser() {
    await this.init();
    const str = await storage.getItem(STORAGE_KEYS.CURRENT_USER);
    return str ? JSON.parse(str) : null;
  }

  async getAddas() {
    await this.init();
    return this.addas;
  }

  async createAdda(name: string, description?: string) {
    await this.init();
    const currentUser = await this.getCurrentUser();
    const addaId = `adda_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const inviteCode = `ADDA-${randomHex}`;

    const newAdda: LocalAdda = {
      id: addaId,
      name: name.trim(),
      description: description?.trim() || '',
      inviteCode,
      creatorId: currentUser?.id || 'me',
      conversationId,
      memberCount: 1,
      myRole: 'OWNER',
    };

    const newConv: LocalConversation = {
      id: conversationId,
      type: 'ADDA',
      name: name.trim(),
      addaId,
      adda: newAdda,
      members: currentUser ? [currentUser] : [],
      lastMessage: {
        content: `Welcome to ${name.trim()}! 🎉 Invite friends using code ${inviteCode}`,
        createdAt: new Date().toISOString(),
      },
    };

    this.addas.unshift(newAdda);
    this.conversations.unshift(newConv);

    this.messages[conversationId] = [
      {
        id: `msg_welcome_${Date.now()}`,
        conversationId,
        senderId: 'system',
        sender: {
          id: 'system',
          displayName: 'Adda Bot',
          username: 'addabot',
        },
        content: `Room created! Share secret code "${inviteCode}" with your gang to invite them. 💬`,
        mediaUrl: null,
        createdAt: new Date().toISOString(),
        reactions: [],
      },
    ];

    await this.persist();

    // 1. Sync with local server API if running in browser
    if (typeof window !== 'undefined' && window.location) {
      try {
        await fetch(`${window.location.origin}/api/addas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newAdda.name,
            description: newAdda.description,
            inviteCode: newAdda.inviteCode,
          }),
        });
      } catch {
        // ignore
      }
    }

    // 2. Cross-device cloud sync: ensure rooms are instantly joinable by friends
    try {
      const syncRes = await fetch(`${CLOUD_SYNC_URL}?_t=${Date.now()}`, { cache: 'no-store' });
      if (syncRes.ok) {
        const cloudObj = await syncRes.json();
        const existingData = cloudObj?.data || {};
        const cloudAddas = existingData.addas || [];
        const cloudInvs = existingData.invitations || [];
        const cloudConvs = existingData.conversations || [];

        const updatedAddas = [newAdda, ...cloudAddas.filter((a: any) => a.id !== newAdda.id)];
        const updatedInvs = [
          { code: inviteCode, addaId, conversationId },
          ...cloudInvs.filter((i: any) => i.code !== inviteCode),
        ];
        const updatedConvs = [newConv, ...cloudConvs.filter((c: any) => c.id !== newConv.id)];

        await fetch(CLOUD_SYNC_URL, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'aadda_room_store',
            data: {
              ...existingData,
              addas: updatedAddas.slice(0, 100),
              invitations: updatedInvs.slice(0, 100),
              conversations: updatedConvs.slice(0, 50),
            },
          }),
        });
      }
    } catch (e) {
      console.warn('Cross-device room sync:', e);
    }

    return newAdda;
  }

  async saveAddaLocally(adda: any) {
    if (!adda || !adda.id) return;
    await this.init();
    if (!this.addas.some((a) => a.id === adda.id)) {
      this.addas.unshift(adda);
    }
    if (adda.conversationId && !this.conversations.some((c) => c.id === adda.conversationId)) {
      this.conversations.unshift({
        id: adda.conversationId,
        type: 'ADDA',
        name: adda.name,
        addaId: adda.id,
        adda,
        members: [],
        lastMessage: {
          content: `Welcome to ${adda.name}! 🎉`,
          createdAt: adda.createdAt || new Date().toISOString(),
        },
      });
    }
    await this.persist();
  }

  async acceptInvite(code: string) {
    await this.init();
    const raw = (code || '').trim();
    if (!raw) {
      throw new Error('Please enter room code');
    }

    const cleanCode = normalizeRoomCode(raw);
    const upperRaw = raw.toUpperCase();

    // 1. Try local server API first (fastest and handles multi-device sync)
    if (typeof window !== 'undefined' && window.location) {
      try {
        const localApiRes = await fetch(`${window.location.origin}/api/invitations/accept`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: raw }),
        });
        if (localApiRes.ok) {
          const apiData = await localApiRes.json();
          if (apiData?.adda) {
            const matchedAdda: LocalAdda = apiData.adda;
            await this.saveAddaLocally(matchedAdda);
            return {
              adda: matchedAdda,
              conversationId: matchedAdda.conversationId,
            };
          }
        }
      } catch {
        // Continue to local offline check
      }
    }

    // 2. Search local memory/storage using robust normalized match
    let adda = this.addas.find((a) => {
      if (!a) return false;
      if (a.id === raw) return true;
      if (a.inviteCode && a.inviteCode.toUpperCase() === upperRaw) return true;
      if (a.inviteCode && normalizeRoomCode(a.inviteCode) === cleanCode) return true;
      return false;
    });

    // 3. Fallback to cloud store
    if (!adda) {
      try {
        const r = await fetch(`${CLOUD_SYNC_URL}?_t=${Date.now()}`, { cache: 'no-store' });
        if (r.ok) {
          const cloud = await r.json();
          if (cloud?.data?.addas && Array.isArray(cloud.data.addas)) {
            const match = cloud.data.addas.find((x: any) => {
              if (!x) return false;
              if (x.id === raw) return true;
              if (x.inviteCode && x.inviteCode.toUpperCase() === upperRaw) return true;
              if (x.inviteCode && normalizeRoomCode(x.inviteCode) === cleanCode) return true;
              return false;
            });
            if (match) {
              adda = match;
              await this.saveAddaLocally(match);
            }
          }
        }
      } catch (e) {
        console.warn('Cloud store lookup warning:', e);
      }
    }

    if (!adda) {
      throw new Error('Invalid Room Code. Please check the code and try again.');
    }

    adda.memberCount = (adda.memberCount || 1) + 1;
    await this.persist();

    return {
      adda,
      conversationId: adda.conversationId,
    };
  }

  async getConversations() {
    await this.init();
    return this.conversations;
  }

  async getConversationById(id: string) {
    await this.init();
    return this.conversations.find((c) => c.id === id) || null;
  }

  async getMessages(conversationId: string) {
    await this.init();
    return this.messages[conversationId] || [];
  }

  async sendMessage(conversationId: string, content: string, mediaUrl?: string) {
    await this.init();
    const currentUser = await this.getCurrentUser();
    const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newMsg: LocalMessage = {
      id: msgId,
      conversationId,
      senderId: currentUser?.id || 'me',
      sender: {
        id: currentUser?.id || 'me',
        displayName: currentUser?.displayName || 'Me',
        username: currentUser?.username || 'me',
        avatarUrl: currentUser?.avatarUrl,
      },
      content: content.trim(),
      mediaUrl: mediaUrl || null,
      createdAt: new Date().toISOString(),
      reactions: [],
    };

    if (!this.messages[conversationId]) {
      this.messages[conversationId] = [];
    }
    this.messages[conversationId].push(newMsg);

    const conv = this.conversations.find((c) => c.id === conversationId);
    if (conv) {
      conv.lastMessage = {
        content: content || 'Sent a photo',
        createdAt: newMsg.createdAt,
      };
    }

    await this.persist();
    return newMsg;
  }

  // Folders & Folder Items Methods
  async getFolders(): Promise<SavedFolder[]> {
    await this.init();
    return this.folders;
  }

  async createFolder(title: string, emoji?: string, color?: string): Promise<SavedFolder> {
    await this.init();
    const newFolder: SavedFolder = {
      id: `fld_${Date.now()}`,
      title: title.trim(),
      emoji: emoji || '📁',
      color: color || '#FFB82E',
      count: 0,
    };
    this.folders.push(newFolder);
    this.folderItems[newFolder.id] = [];
    await this.persist();
    return newFolder;
  }

  async getFolderItems(folderId: string): Promise<SavedItem[]> {
    await this.init();
    return this.folderItems[folderId] || [];
  }

  async addFolderItem(
    folderId: string,
    title: string,
    description: string,
    tag: string,
  ): Promise<SavedItem> {
    await this.init();
    const newItem: SavedItem = {
      id: `item_${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      tag: tag.trim() || 'General',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };

    if (!this.folderItems[folderId]) {
      this.folderItems[folderId] = [];
    }
    this.folderItems[folderId].unshift(newItem);

    const folder = this.folders.find((f) => f.id === folderId);
    if (folder) {
      folder.count = this.folderItems[folderId].length;
    }

    await this.persist();
    return newItem;
  }

  // -------------------------------------------------------------
  // DAILY CHAOS METHODS
  // -------------------------------------------------------------
  async getDailyChaos(
    userId?: string,
    filters?: {
      status?: string;
      priority?: string;
      category?: string;
      date?: string;
      search?: string;
    },
  ): Promise<{ items: DailyChaosItem[]; stats: DailyChaosStats }> {
    await this.init();
    const uid = userId || this.users[0]?.id || 'usr_default';
    let userItems = [...(this.dailyChaos[uid] || [])];

    const stats: DailyChaosStats = {
      total: userItems.length,
      pending: userItems.filter((i) => i.status === 'PENDING').length,
      inProgress: userItems.filter((i) => i.status === 'IN_PROGRESS').length,
      completed: userItems.filter((i) => i.status === 'COMPLETED').length,
    };

    if (filters?.status && filters.status !== 'ALL') {
      userItems = userItems.filter((i) => i.status === filters.status);
    }
    if (filters?.priority && filters.priority !== 'ALL') {
      userItems = userItems.filter((i) => i.priority === filters.priority);
    }
    if (filters?.category && filters.category !== 'ALL') {
      userItems = userItems.filter((i) => i.category === filters.category);
    }
    if (filters?.date) {
      userItems = userItems.filter((i) => i.date === filters.date);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      userItems = userItems.filter(
        (i) =>
          i.title?.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q) ||
          i.tags?.some((t) => t.toLowerCase().includes(q)),
      );
    }

    userItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { items: userItems, stats };
  }

  async createDailyChaos(
    userId: string,
    data: {
      title: string;
      description?: string;
      date?: string;
      deadline?: string;
      priority?: ChaosPriority;
      category?: string;
      tags?: string[];
      status?: ChaosStatus;
    },
  ): Promise<DailyChaosItem> {
    await this.init();
    const uid = userId || this.users[0]?.id || 'usr_default';
    const newItem: DailyChaosItem = {
      id: `chaos_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: uid,
      title: data.title.trim(),
      description: data.description?.trim() || '',
      date: data.date || new Date().toISOString().split('T')[0],
      deadline: data.deadline || '',
      priority: data.priority || 'MEDIUM',
      category: data.category?.trim() || 'General',
      tags: Array.isArray(data.tags) ? data.tags : [],
      status: data.status || 'PENDING',
      completedAt: data.status === 'COMPLETED' ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!this.dailyChaos[uid]) {
      this.dailyChaos[uid] = [];
    }
    this.dailyChaos[uid].unshift(newItem);
    await this.persist();
    return newItem;
  }

  async updateDailyChaos(
    userId: string,
    id: string,
    updates: Partial<DailyChaosItem>,
  ): Promise<DailyChaosItem> {
    await this.init();
    const uid = userId || this.users[0]?.id || 'usr_default';
    const items = this.dailyChaos[uid] || [];
    const index = items.findIndex((i) => i.id === id);

    if (index === -1) {
      throw new Error('Chaos entry not found');
    }

    const existing = items[index];
    const nextStatus = updates.status !== undefined ? updates.status : existing.status;
    const isNowCompleted = nextStatus === 'COMPLETED';

    const updated: DailyChaosItem = {
      ...existing,
      ...updates,
      status: nextStatus,
      completedAt: isNowCompleted ? (existing.completedAt || new Date().toISOString()) : null,
      updatedAt: new Date().toISOString(),
    };

    items[index] = updated;
    await this.persist();
    return updated;
  }

  async deleteDailyChaos(userId: string, id: string): Promise<boolean> {
    await this.init();
    const uid = userId || this.users[0]?.id || 'usr_default';
    const items = this.dailyChaos[uid] || [];
    const index = items.findIndex((i) => i.id === id);

    if (index === -1) {
      return false;
    }

    items.splice(index, 1);
    await this.persist();
    return true;
  }

  // -------------------------------------------------------------
  // ADDA BUZZ CLIENT STORE METHODS
  // -------------------------------------------------------------
  async getBuzzFeed(
    addaId?: string,
    category?: string,
    filter?: string,
  ): Promise<BuzzPost[]> {
    await this.init();
    const currentUser = await this.getCurrentUser();
    const currentUserId = currentUser?.id || this.users[0]?.id || 'usr_default';
    const targetAddaId = addaId || this.addas[0]?.id || 'default';

    if (!this.buzzPosts[targetAddaId]) { this.buzzPosts[targetAddaId] = []; }

    let allAddaPosts = [...(this.buzzPosts[targetAddaId] || [])];
    if (allAddaPosts.length === 0 && this.buzzPosts['default'] && this.buzzPosts['default'].length > 0) {
      allAddaPosts = [...this.buzzPosts['default']];
    }
    if (allAddaPosts.length === 0) {
      const collected: BuzzPost[] = [];
      Object.values(this.buzzPosts).forEach((arr) => {
        if (Array.isArray(arr)) collected.push(...arr);
      });
      allAddaPosts = collected.length > 0 ? collected : [...DEFAULT_BUZZ_POSTS];
      this.buzzPosts[targetAddaId] = [...allAddaPosts];
    }

    let posts = allAddaPosts;
    const now = Date.now();

    // Exclude expired posts
    posts = posts.filter((p) => {
      if (p.expiresAt) {
        return new Date(p.expiresAt).getTime() > now;
      }
      return true;
    });

    // Category filter
    if (category && category !== 'ALL') {
      posts = posts.filter((p) => p.category === category);
    }

    // Saved filter
    const userSaved = this.buzzBookmarks[currentUserId] || [];
    if (filter === 'saved') {
      posts = posts.filter((p) => userSaved.includes(p.id));
    }

    const savedSet = new Set(userSaved);
    const enriched = posts.map((p) => {
      const totalReactions = Object.values(p.reactions || {}).reduce(
        (sum, count) => sum + (Number(count) || 0),
        0,
      );
      const hoursOld = Math.max(1, (now - new Date(p.createdAt).getTime()) / 3600000);
      const score =
        (totalReactions * 2 + (p.commentsCount || 0) * 3 + (p.bookmarksCount || 0) * 1.5) /
        Math.pow(hoursOld + 2, 1.2);

      const userReactions = (p as any).reactionsByUser?.[currentUserId] || p.userReactions || [];

      return {
        ...p,
        engagementScore: Number(score.toFixed(2)),
        isBookmarked: savedSet.has(p.id),
        userReactions,
      };
    });

    if (filter === 'trending') {
      enriched.sort((a, b) => (b.engagementScore || 0) - (a.engagementScore || 0));
    } else {
      enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    enriched.forEach((p, idx) => {
      p.isTrending = idx < 3 && (p.engagementScore || 0) > 2;
    });

    return enriched;
  }

  async createBuzzPost(dto: CreateBuzzPostDto): Promise<BuzzPost> {
    await this.init();
    const currentUser = await this.getCurrentUser();
    const currentUserId = currentUser?.id || this.users[0]?.id || 'usr_default';
    const targetAddaId = dto.addaId || this.addas[0]?.id || 'default';
    const targetAdda = this.addas.find((a) => a.id === targetAddaId);

    let expiresAt: string | null = null;
    if (dto.expiry === BuzzExpiry.EXP_24H) {
      expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    } else if (dto.expiry === BuzzExpiry.EXP_48H) {
      expiresAt = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
    }

    let pollOptions = undefined;
    if (
      dto.category === BuzzCategory.POLL_HOT_TAKE &&
      Array.isArray(dto.pollOptions) &&
      dto.pollOptions.length >= 2
    ) {
      pollOptions = dto.pollOptions.map((text, idx) => ({
        id: `opt_${Date.now()}_${idx}`,
        text: text.trim(),
        votesCount: 0,
        voterIds: [],
      }));
    }

    let linkPreview = null;
    if (dto.linkUrl && dto.linkUrl.startsWith('http')) {
      try {
        const urlObj = new URL(dto.linkUrl);
        linkPreview = {
          url: dto.linkUrl,
          title: (urlObj.hostname.replace('www.', '') + ' Article').toUpperCase(),
          description: `Shared via ${urlObj.hostname}`,
          siteName: urlObj.hostname,
        };
      } catch {
        linkPreview = { url: dto.linkUrl, siteName: 'External Link' };
      }
    }

    const newPost: BuzzPost = {
      id: `buzz_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      addaId: targetAddaId,
      addaName: targetAdda?.name || 'Circle Adda',
      authorId: currentUserId,
      authorName: dto.isAnonymous
        ? (dto.anonymousPersona || 'Anonymous Member')
        : currentUser?.displayName || currentUser?.username || 'Circle Member',
      authorAvatar: dto.isAnonymous ? null : currentUser?.avatarUrl || null,
      isAnonymous: Boolean(dto.isAnonymous),
      category: dto.category || BuzzCategory.SPILL_THE_TEA,
      credibility: dto.credibility || BuzzCredibility.PERSONAL_EXPERIENCE,
      expiry: dto.expiry || BuzzExpiry.PERMANENT,
      expiresAt,
      title: dto.title ? dto.title.trim() : undefined,
      content: dto.content.trim(),
      mediaUrl: dto.mediaUrl || null,
      mediaType: dto.mediaType || null,
      linkPreview,
      pollOptions,
      reactions: {},
      userReactions: [],
      commentsCount: 0,
      bookmarksCount: 0,
      isBookmarked: false,
      isTrending: false,
      engagementScore: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!this.buzzPosts[targetAddaId]) {
      this.buzzPosts[targetAddaId] = [];
    }
    this.buzzPosts[targetAddaId].unshift(newPost);
    await this.persist();
    return newPost;
  }

  async deleteBuzzPost(id: string): Promise<boolean> {
    await this.init();
    let found = false;
    for (const key of Object.keys(this.buzzPosts)) {
      const idx = this.buzzPosts[key].findIndex((p) => p.id === id);
      if (idx !== -1) {
        this.buzzPosts[key].splice(idx, 1);
        found = true;
        break;
      }
    }
    if (found) {
      await this.persist();
    }
    return found;
  }

  async toggleBuzzReaction(
    id: string,
    emoji: string,
  ): Promise<{ reactions: Record<string, number>; userReactions: string[] }> {
    await this.init();
    const currentUser = await this.getCurrentUser();
    const currentUserId = currentUser?.id || this.users[0]?.id || 'usr_default';

    let targetPost: BuzzPost | undefined;
    for (const key of Object.keys(this.buzzPosts)) {
      const p = this.buzzPosts[key].find((x) => x.id === id);
      if (p) {
        targetPost = p;
        break;
      }
    }

    if (!targetPost) {
      throw new Error('Buzz post not found');
    }

    if (!targetPost.reactions) targetPost.reactions = {};
    if (!(targetPost as any).reactionsByUser) (targetPost as any).reactionsByUser = {};
    if (!(targetPost as any).reactionsByUser[currentUserId]) {
      (targetPost as any).reactionsByUser[currentUserId] = [];
    }

    const userReactions: string[] = (targetPost as any).reactionsByUser[currentUserId];
    const hasReacted = userReactions.includes(emoji);

    if (hasReacted) {
      (targetPost as any).reactionsByUser[currentUserId] = userReactions.filter((e) => e !== emoji);
      targetPost.reactions[emoji] = Math.max(0, (targetPost.reactions[emoji] || 1) - 1);
      if (targetPost.reactions[emoji] === 0) {
        delete targetPost.reactions[emoji];
      }
    } else {
      userReactions.push(emoji);
      targetPost.reactions[emoji] = (targetPost.reactions[emoji] || 0) + 1;
    }

    targetPost.userReactions = (targetPost as any).reactionsByUser[currentUserId];
    await this.persist();
    return {
      reactions: targetPost.reactions,
      userReactions: targetPost.userReactions,
    };
  }

  async getBuzzComments(postId: string): Promise<BuzzComment[]> {
    await this.init();
    return this.buzzComments[postId] || [];
  }

  async addBuzzComment(
    postId: string,
    content: string,
    parentId?: string | null,
  ): Promise<BuzzComment> {
    await this.init();
    const currentUser = await this.getCurrentUser();
    const currentUserId = currentUser?.id || this.users[0]?.id || 'usr_default';

    const mentions = (content.match(/@([a-zA-Z0-9_]+)/g) || []).map((m) => m.substring(1));

    const newComment: BuzzComment = {
      id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      postId,
      authorId: currentUserId,
      authorName: currentUser?.displayName || currentUser?.username || 'Circle Member',
      authorAvatar: currentUser?.avatarUrl || null,
      content: content.trim(),
      parentId: parentId || null,
      mentions,
      createdAt: new Date().toISOString(),
    };

    if (!this.buzzComments[postId]) {
      this.buzzComments[postId] = [];
    }
    this.buzzComments[postId].push(newComment);

    for (const key of Object.keys(this.buzzPosts)) {
      const p = this.buzzPosts[key].find((x) => x.id === postId);
      if (p) {
        p.commentsCount = (p.commentsCount || 0) + 1;
        break;
      }
    }

    await this.persist();
    return newComment;
  }

  async voteBuzzPoll(postId: string, optionId: string): Promise<{ pollOptions: any[] }> {
    await this.init();
    const currentUser = await this.getCurrentUser();
    const currentUserId = currentUser?.id || this.users[0]?.id || 'usr_default';

    let targetPost: BuzzPost | undefined;
    for (const key of Object.keys(this.buzzPosts)) {
      const p = this.buzzPosts[key].find((x) => x.id === postId);
      if (p) {
        targetPost = p;
        break;
      }
    }

    if (!targetPost || !targetPost.pollOptions) {
      throw new Error('Poll not found');
    }

    targetPost.pollOptions.forEach((opt) => {
      if (!opt.voterIds) opt.voterIds = [];
      opt.voterIds = opt.voterIds.filter((uid) => uid !== currentUserId);
    });

    const opt = targetPost.pollOptions.find((o) => o.id === optionId);
    if (opt) {
      opt.voterIds.push(currentUserId);
    }

    targetPost.pollOptions.forEach((o) => {
      o.votesCount = o.voterIds.length;
    });

    await this.persist();
    return { pollOptions: targetPost.pollOptions };
  }

  async toggleBuzzBookmark(
    postId: string,
  ): Promise<{ isBookmarked: boolean; bookmarksCount: number }> {
    await this.init();
    const currentUser = await this.getCurrentUser();
    const currentUserId = currentUser?.id || this.users[0]?.id || 'usr_default';

    if (!this.buzzBookmarks[currentUserId]) {
      this.buzzBookmarks[currentUserId] = [];
    }

    const bookmarks = this.buzzBookmarks[currentUserId];
    const isBookmarked = bookmarks.includes(postId);

    let targetPost: BuzzPost | undefined;
    for (const key of Object.keys(this.buzzPosts)) {
      const p = this.buzzPosts[key].find((x) => x.id === postId);
      if (p) {
        targetPost = p;
        break;
      }
    }

    if (isBookmarked) {
      this.buzzBookmarks[currentUserId] = bookmarks.filter((id) => id !== postId);
      if (targetPost) {
        targetPost.bookmarksCount = Math.max(0, (targetPost.bookmarksCount || 1) - 1);
        targetPost.isBookmarked = false;
      }
    } else {
      bookmarks.push(postId);
      if (targetPost) {
        targetPost.bookmarksCount = (targetPost.bookmarksCount || 0) + 1;
        targetPost.isBookmarked = true;
      }
    }

    await this.persist();
    return {
      isBookmarked: !isBookmarked,
      bookmarksCount: targetPost?.bookmarksCount || 0,
    };
  }

  async reportBuzzPost(
    postId: string,
    reason: string,
    details?: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.init();
    const currentUser = await this.getCurrentUser();
    const currentUserId = currentUser?.id || this.users[0]?.id || 'usr_default';

    this.buzzReports.push({
      id: `rep_${Date.now()}`,
      postId,
      reporterId: currentUserId,
      reason,
      details: details || '',
      createdAt: new Date().toISOString(),
    });

    await this.persist();
    return {
      success: true,
      message: 'Report submitted. Circle moderators have been notified.',
    };
  }
}

export const clientStore = new ClientStore();
