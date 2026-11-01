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

const DEFAULT_FOLDERS: SavedFolder[] = [
  { id: '1', title: 'Friends', color: '#FFB82E', emoji: '💛', count: 12 },
  { id: '2', title: 'Astronomy', color: '#3C97FF', emoji: '🚀', count: 8 },
  { id: '3', title: 'Tech & Code', color: '#FF7A29', emoji: '💻', count: 15 },
  { id: '4', title: 'Cartoons', color: '#9C75F7', emoji: '🦄', count: 9 },
  { id: '5', title: 'Tasty Food', color: '#FF6464', emoji: '🍕', count: 24 },
  { id: '6', title: 'Sport', color: '#31C390', emoji: '⚽', count: 7 },
];

const DEFAULT_FOLDER_ITEMS: Record<string, SavedItem[]> = {
  '1': [
    { id: 'item_1_1', title: 'Weekend Chai Adda', description: 'Plans for Saturday evening hangout', tag: 'Hangout', date: 'Oct 31' },
    { id: 'item_1_2', title: 'Birthday Playlist', description: 'Curated vibe playlist for party', tag: 'Music', date: 'Oct 28' },
    { id: 'item_1_3', title: 'Secret Goa Trip Plan', description: 'Villa booking notes and budget spreadsheet', tag: 'Travel', date: 'Oct 20' },
  ],
  '2': [
    { id: 'item_2_1', title: 'James Webb Nebula Shot', description: 'High-res infrared deep field photo', tag: 'NASA', date: 'Oct 30' },
    { id: 'item_2_2', title: 'Meteor Shower Dates', description: 'Best viewing time 2 AM this Friday', tag: 'Events', date: 'Oct 25' },
    { id: 'item_2_3', title: 'Mars Rover Sample 42', description: 'Sedimentary rock findings and water traces', tag: 'Science', date: 'Oct 14' },
  ],
  '3': [
    { id: 'item_3_1', title: 'React 19 & Expo Router', description: 'Notes on server components & mobile linking', tag: 'Architecture', date: 'Oct 31' },
    { id: 'item_3_2', title: 'PostgreSQL Indexing Tips', description: 'B-tree vs GIN indexes for chat search', tag: 'Database', date: 'Oct 27' },
    { id: 'item_3_3', title: 'Tailwind CSS Grid Tricks', description: 'Auto-fill vs auto-fit responsive patterns', tag: 'CSS', date: 'Oct 22' },
  ],
  '4': [
    { id: 'item_4_1', title: 'Ghibli Background Art', description: 'Spirited Away aesthetics collection', tag: 'Anime', date: 'Oct 29' },
    { id: 'item_4_2', title: 'Avatar Last Airbender Rewatch', description: 'Favorite episodes and character arcs', tag: 'Animation', date: 'Oct 19' },
  ],
  '5': [
    { id: 'item_5_1', title: 'Best Dosa Spots in Bengaluru', description: 'CTR, Vidyarthi Bhavan & Taaza Thindi', tag: 'Foodie', date: 'Oct 31' },
    { id: 'item_5_2', title: 'Midnight Maggi Recipe', description: 'Butter garlic chili flakes secret mix', tag: 'Recipe', date: 'Oct 24' },
  ],
  '6': [
    { id: 'item_6_1', title: 'IPL 2026 Mega Auction', description: 'Player retention list & team budget stats', tag: 'Cricket', date: 'Oct 31' },
    { id: 'item_6_2', title: 'Bengaluru Marathon Route', description: '21K route map and hydration points', tag: 'Running', date: 'Oct 26' },
  ],
};

const CLOUD_SYNC_URL = 'https://api.restful-api.dev/objects/ff808181a09d98f701a19413d89279c4';

const DEFAULT_BUZZ_POSTS: BuzzPost[] = [
  {
    id: 'buzz_seed_1',
    addaId: 'default',
    addaName: 'Chai Adda',
    authorId: 'usr_seed_1',
    authorName: 'Rohit K',
    authorAvatar: null,
    isAnonymous: false,
    category: BuzzCategory.SPILL_THE_TEA,
    credibility: BuzzCredibility.PERSONAL_EXPERIENCE,
    expiry: BuzzExpiry.PERMANENT,
    expiresAt: null,
    title: 'Spicy Canteen Coffee Saga ☕',
    content: 'Someone in our block ordered 14 filter coffees for table 4 and vanished into thin air the exact second the bill arrived. We ended up doing a UPI split roulette 😂',
    mediaUrl: null,
    mediaType: null,
    linkPreview: null,
    pollOptions: undefined,
    reactions: { '😂': 14, '☕': 9, '🍿': 7, '🔥': 5 },
    userReactions: [],
    commentsCount: 2,
    bookmarksCount: 4,
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'buzz_seed_2',
    addaId: 'default',
    addaName: 'Chai Adda',
    authorId: 'usr_seed_2',
    authorName: 'Deepa M',
    authorAvatar: null,
    isAnonymous: false,
    category: BuzzCategory.NEWS,
    credibility: BuzzCredibility.VERIFIED_NEWS,
    expiry: BuzzExpiry.PERMANENT,
    expiresAt: null,
    title: 'Namma Metro Purple Line Updates 🚇',
    content: 'BMRCL confirmed train frequency is increased to every 3.5 minutes during peak hours from Majestic to Whitefield. Commute times are finally cut by 25 minutes!',
    mediaUrl: null,
    mediaType: null,
    linkPreview: {
      url: 'https://bmrcl.co.in',
      title: 'BMRCL Peak Frequency Expansion',
      description: 'Higher frequency operations active starting this Monday.',
      siteName: 'Namma Metro',
    },
    pollOptions: undefined,
    reactions: { '🔥': 22, '❤️': 16, '👀': 8 },
    userReactions: [],
    commentsCount: 0,
    bookmarksCount: 9,
    createdAt: new Date(Date.now() - 3600000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 7).toISOString(),
  },
  {
    id: 'buzz_seed_3',
    addaId: 'default',
    addaName: 'Chai Adda',
    authorId: 'usr_seed_3',
    authorName: 'Campus Lead',
    authorAvatar: null,
    isAnonymous: false,
    category: BuzzCategory.COLLEGE_RADAR,
    credibility: BuzzCredibility.VERIFIED_NEWS,
    expiry: BuzzExpiry.PERMANENT,
    expiresAt: null,
    title: "Campus Tech Fest 'ChakraVyuh 2026' Registrations Open! 🎓",
    content: '₹1,00,000 total prize pool across AI & Web3 tracks. Placement cell is also conducting tech mock interviews this Thursday at Seminar Hall 2. Don\'t miss out!',
    mediaUrl: null,
    mediaType: null,
    linkPreview: null,
    pollOptions: undefined,
    reactions: { '🔥': 31, '👀': 15, '❤️': 24 },
    userReactions: [],
    commentsCount: 0,
    bookmarksCount: 12,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'buzz_seed_4',
    addaId: 'default',
    addaName: 'Chai Adda',
    authorId: 'usr_seed_4',
    authorName: 'Suresh Rao',
    authorAvatar: null,
    isAnonymous: false,
    category: BuzzCategory.POLL_HOT_TAKE,
    credibility: BuzzCredibility.UNVERIFIED_CLAIM,
    expiry: BuzzExpiry.PERMANENT,
    expiresAt: null,
    title: 'HOT TAKE: Masala Dosa Championship 🧈',
    content: 'Settle the eternal debate once and for all. Which one reigns supreme in Bengaluru?',
    mediaUrl: null,
    mediaType: null,
    linkPreview: null,
    pollOptions: [
      { id: 'opt_1', text: 'CTR Malleshwaram (Benne Masala) 🧈', votesCount: 28, voterIds: [] },
      { id: 'opt_2', text: 'Vidyarthi Bhavan Gandhi Bazaar ☕', votesCount: 19, voterIds: [] },
      { id: 'opt_3', text: 'Taaza Thindi Jayanagar 🌿', votesCount: 14, voterIds: [] },
      { id: 'opt_4', text: 'MTR Near Lalbagh ❤️', votesCount: 8, voterIds: [] },
    ],
    reactions: { '🍿': 18, '🔥': 26, '😂': 9 },
    userReactions: [],
    commentsCount: 1,
    bookmarksCount: 6,
    createdAt: new Date(Date.now() - 3600000 * 16).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 16).toISOString(),
  },
  {
    id: 'buzz_seed_5',
    addaId: 'default',
    addaName: 'Chai Adda',
    authorId: 'usr_seed_5',
    authorName: 'Anonymous Adda Member',
    authorAvatar: null,
    isAnonymous: true,
    category: BuzzCategory.CONFESSION,
    credibility: BuzzCredibility.PERSONAL_EXPERIENCE,
    expiry: BuzzExpiry.PERMANENT,
    expiresAt: null,
    title: 'Confession Corner 🤫',
    content: 'I accidentally submitted an unedited Kannada meme audio as the background soundtrack for my final design project video presentation. The professor laughed and gave me an A- 😂',
    mediaUrl: null,
    mediaType: null,
    linkPreview: null,
    pollOptions: undefined,
    reactions: { '💀': 35, '😂': 49, '🍿': 18 },
    userReactions: [],
    commentsCount: 0,
    bookmarksCount: 7,
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
];

const DEFAULT_BUZZ_COMMENTS: Record<string, BuzzComment[]> = {
  buzz_seed_1: [
    {
      id: 'comm_1_1',
      postId: 'buzz_seed_1',
      authorId: 'usr_seed_2',
      authorName: 'Ananya S',
      authorAvatar: null,
      content: 'Classic table 4 behavior lmao! Next time make everyone scan the QR first 💀',
      parentId: null,
      mentions: [],
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'comm_1_2',
      postId: 'buzz_seed_1',
      authorId: 'usr_seed_3',
      authorName: 'Karthik B',
      authorAvatar: null,
      content: '@Ananya S exactly, the UPI split roulette was brutal 😂',
      parentId: 'comm_1_1',
      mentions: ['Ananya S'],
      createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    },
  ],
  buzz_seed_4: [
    {
      id: 'comm_4_1',
      postId: 'buzz_seed_4',
      authorId: 'usr_seed_2',
      authorName: 'Pooja V',
      authorAvatar: null,
      content: 'CTR Benne Dosa with that mint chutney is unbeatable, no contest! 🧈',
      parentId: null,
      mentions: [],
      createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
    },
  ],
};

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

      if (!this.buzzPosts.default || this.buzzPosts.default.length === 0) {
        this.buzzPosts.default = DEFAULT_BUZZ_POSTS;
      }

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

    // Cross-device cloud sync: ensure rooms are instantly joinable by friends
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

  async acceptInvite(code: string) {
    await this.init();
    const raw = code.trim().toUpperCase();
    const cleanNoPrefix = raw.replace(/^ADDA-?/, '');
    const variants = [raw, cleanNoPrefix, `ADDA-${cleanNoPrefix}`];

    let adda = this.addas.find(
      (a) => a.inviteCode && variants.includes(a.inviteCode.toUpperCase()),
    );

    if (!adda) {
      // Check cloud store with cache busting
      try {
        const r = await fetch(`${CLOUD_SYNC_URL}?_t=${Date.now()}`, { cache: 'no-store' });
        if (r.ok) {
          const cloud = await r.json();
          if (cloud?.data?.addas) {
            const match = cloud.data.addas.find(
              (x: any) => x.inviteCode && variants.includes(x.inviteCode.toUpperCase()),
            );
            if (match) {
              adda = match;
              if (!this.addas.find((a) => a.id === match.id)) {
                this.addas.unshift(match);
              }
              if (!this.conversations.find((c) => c.id === match.conversationId)) {
                this.conversations.unshift({
                  id: match.conversationId,
                  type: 'ADDA',
                  name: match.name,
                  addaId: match.id,
                  adda: match,
                  members: [],
                  lastMessage: {
                    content: `Welcome to ${match.name}! 🎉`,
                    createdAt: new Date().toISOString(),
                  },
                });
              }
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

    if (!this.buzzPosts[targetAddaId] || this.buzzPosts[targetAddaId].length === 0) {
      const addaName = this.addas.find((a) => a.id === targetAddaId)?.name || 'Chai Adda';
      this.buzzPosts[targetAddaId] = DEFAULT_BUZZ_POSTS.map((p) => ({
        ...p,
        addaId: targetAddaId,
        addaName,
      }));
    }

    let posts = [...(this.buzzPosts[targetAddaId] || [])];
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
        ? 'Anonymous Member'
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
