import { storage } from './storage';
import { DailyChaosItem, DailyChaosStats, ChaosPriority, ChaosStatus } from '@aadda/shared';

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

const CLOUD_SYNC_URL = 'https://api.restful-api.dev/objects/ff808181a09d98f701a192e8702d785c';

class ClientStore {
  private users: LocalUser[] = [];
  private addas: LocalAdda[] = [];
  private conversations: LocalConversation[] = [];
  private messages: Record<string, LocalMessage[]> = {};
  private folders: SavedFolder[] = DEFAULT_FOLDERS;
  private folderItems: Record<string, SavedItem[]> = DEFAULT_FOLDER_ITEMS;
  private dailyChaos: Record<string, DailyChaosItem[]> = {};
  private initialized = false;

  async init() {
    if (this.initialized) return;

    try {
      const [u, a, c, m, f, fi, dc] = await Promise.all([
        storage.getItem(STORAGE_KEYS.USERS),
        storage.getItem(STORAGE_KEYS.ADDAS),
        storage.getItem(STORAGE_KEYS.CONVERSATIONS),
        storage.getItem(STORAGE_KEYS.MESSAGES),
        storage.getItem(STORAGE_KEYS.FOLDERS),
        storage.getItem(STORAGE_KEYS.FOLDER_ITEMS),
        storage.getItem(STORAGE_KEYS.DAILY_CHAOS),
      ]);

      this.users = u ? JSON.parse(u) : [];
      this.addas = a ? JSON.parse(a) : [];
      this.conversations = c ? JSON.parse(c) : [];
      this.messages = m ? JSON.parse(m) : {};
      this.folders = f ? JSON.parse(f) : DEFAULT_FOLDERS;
      this.folderItems = fi ? JSON.parse(fi) : DEFAULT_FOLDER_ITEMS;
      this.dailyChaos = dc ? JSON.parse(dc) : {};

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
        accessToken: `token_${user.id}`,
        refreshToken: `ref_${user.id}`,
      },
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
    return newAdda;
  }

  async acceptInvite(code: string) {
    await this.init();
    const cleanCode = code.trim().toUpperCase();
    let adda = this.addas.find((a) => a.inviteCode.toUpperCase() === cleanCode);

    if (!adda) {
      // Check cloud store
      try {
        const r = await fetch(CLOUD_SYNC_URL);
        const cloud = await r.json();
        if (cloud?.data?.addas) {
          const match = cloud.data.addas.find(
            (x: any) => x.inviteCode && x.inviteCode.toUpperCase() === cleanCode,
          );
          if (match) {
            adda = match;
            this.addas.unshift(match);
          }
        }
      } catch {}
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
}

export const clientStore = new ClientStore();
