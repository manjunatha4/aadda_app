import { storage } from './storage';

export interface LocalUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  district?: string;
  language?: string;
  avatarUrl?: string;
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

const STORAGE_KEYS = {
  USERS: 'aadda_client_users',
  CURRENT_USER: 'aadda_client_current_user',
  ADDAS: 'aadda_client_addas',
  CONVERSATIONS: 'aadda_client_conversations',
  MESSAGES: 'aadda_client_messages',
};

class ClientStore {
  private users: LocalUser[] = [];
  private addas: LocalAdda[] = [];
  private conversations: LocalConversation[] = [];
  private messages: Record<string, LocalMessage[]> = {}; // conversationId -> messages
  private initialized = false;

  async init() {
    if (this.initialized) return;
    try {
      const [u, a, c, m] = await Promise.all([
        storage.getItem(STORAGE_KEYS.USERS),
        storage.getItem(STORAGE_KEYS.ADDAS),
        storage.getItem(STORAGE_KEYS.CONVERSATIONS),
        storage.getItem(STORAGE_KEYS.MESSAGES),
      ]);

      this.users = u ? JSON.parse(u) : [];
      this.addas = a ? JSON.parse(a) : [];
      this.conversations = c ? JSON.parse(c) : [];
      this.messages = m ? JSON.parse(m) : {};
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
      ]);
    } catch {
      // ignore
    }
  }

  async login(login: string) {
    await this.init();
    const clean = login.trim().toLowerCase();
    let user = this.users.find(
      (u) => u.email.toLowerCase() === clean || u.username.toLowerCase() === clean,
    );

    if (!user) {
      // Seamless auto-register for any real user without dummy accounts
      const username = clean.includes('@') ? clean.split('@')[0] : clean;
      const email = clean.includes('@') ? clean : `${clean}@aadda.app`;
      user = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        email,
        username,
        displayName: username,
        district: 'Bengaluru',
        language: 'en',
      };
      this.users.push(user);
      await this.persist();
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
    displayName: string;
    email: string;
    district?: string;
    language?: string;
  }) {
    await this.init();
    const cleanEmail = data.email.trim().toLowerCase();
    let user = this.users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (user) {
      user.displayName = data.displayName || user.displayName;
      user.username = data.username || user.username;
    } else {
      user = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        email: cleanEmail,
        username: data.username.trim(),
        displayName: data.displayName.trim() || data.username.trim(),
        district: data.district || 'Bengaluru',
        language: data.language || 'en',
      };
      this.users.push(user);
    }

    await this.persist();
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
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
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
    const adda = this.addas.find((a) => a.inviteCode.toUpperCase() === cleanCode);
    if (!adda) {
      throw new Error('Invalid or expired invite code');
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

  async addReaction(conversationId: string, messageId: string, emoji: string) {
    await this.init();
    const msgs = this.messages[conversationId];
    if (!msgs) return null;

    const msg = msgs.find((m) => m.id === messageId);
    if (msg) {
      const currentUser = await this.getCurrentUser();
      const userId = currentUser?.id || 'me';
      const existingIdx = msg.reactions.findIndex((r) => r.userId === userId && r.emoji === emoji);

      if (existingIdx >= 0) {
        msg.reactions.splice(existingIdx, 1);
      } else {
        msg.reactions.push({
          id: `react_${Date.now()}`,
          emoji,
          userId,
        });
      }
      await this.persist();
    }
    return msg;
  }
}

export const clientStore = new ClientStore();

