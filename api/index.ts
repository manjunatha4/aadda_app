import type { IncomingMessage, ServerResponse } from 'http';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// Shared Cloud Database Object for Vercel Cross-Device Persistence
const CLOUD_STORE_URL = 'https://api.restful-api.dev/objects/ff808181a09d98f701a192e8702d785c';

interface CloudData {
  users: any[];
  addas: any[];
  conversations: any[];
  messages: Record<string, any[]>;
  folders: any[];
  folderItems: Record<string, any[]>;
  invitations: any[];
}

// In-memory cache for fast response times
let memoryCache: CloudData = {
  users: [],
  addas: [],
  conversations: [],
  messages: {},
  folders: [
    { id: '1', title: 'Friends', color: '#FFB82E', emoji: '💛', count: 12 },
    { id: '2', title: 'Astronomy', color: '#3C97FF', emoji: '🚀', count: 8 },
    { id: '3', title: 'Tech & Code', color: '#FF7A29', emoji: '💻', count: 15 },
    { id: '4', title: 'Cartoons', color: '#9C75F7', emoji: '🦄', count: 9 },
    { id: '5', title: 'Tasty Food', color: '#FF6464', emoji: '🍕', count: 24 },
    { id: '6', title: 'Sport', color: '#31C390', emoji: '⚽', count: 7 },
  ],
  folderItems: {
    '1': [
      { id: 'f1-1', title: 'Weekend Chai Adda', description: 'Plans for Saturday evening hangout', tag: 'Hangout', date: 'Oct 31' },
      { id: 'f1-2', title: 'Birthday Playlist', description: 'Curated vibe playlist for party', tag: 'Music', date: 'Oct 28' },
    ],
    '2': [
      { id: 'f2-1', title: 'James Webb Nebula Shot', description: 'High-res infrared deep field photo', tag: 'NASA', date: 'Oct 30' },
      { id: 'f2-2', title: 'Meteor Shower Dates', description: 'Best viewing time 2 AM this Friday', tag: 'Events', date: 'Oct 25' },
    ],
    '3': [
      { id: 'f3-1', title: 'React 19 & Expo Router', description: 'Notes on server components & mobile linking', tag: 'Architecture', date: 'Oct 31' },
      { id: 'f3-2', title: 'PostgreSQL Indexing Tips', description: 'B-tree vs GIN indexes for chat search', tag: 'Database', date: 'Oct 27' },
    ],
    '4': [
      { id: 'f4-1', title: 'Ghibli Background Art', description: 'Spirited Away aesthetics collection', tag: 'Anime', date: 'Oct 29' },
    ],
    '5': [
      { id: 'f5-1', title: 'Best Dosa Spots in Bengaluru', description: 'CTR, Vidyarthi Bhavan & Taaza Thindi', tag: 'Foodie', date: 'Oct 31' },
    ],
    '6': [
      { id: 'f6-1', title: 'IPL 2026 Mega Auction', description: 'Player retention list & team budget stats', tag: 'Cricket', date: 'Oct 31' },
    ],
  },
  invitations: [],
};

let lastSyncTime = 0;

async function syncFromCloud(): Promise<CloudData> {
  // Sync if cache older than 4 seconds
  if (Date.now() - lastSyncTime < 4000 && memoryCache.addas.length > 0) {
    return memoryCache;
  }

  try {
    const res = await fetch(CLOUD_STORE_URL, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.data && Array.isArray(data.data.addas)) {
        memoryCache = {
          ...memoryCache,
          ...data.data,
        };
        lastSyncTime = Date.now();
        return memoryCache;
      }
    }
  } catch (e) {
    // Ignore network error in fallback
  }
  return memoryCache;
}

async function saveToCloud(data: CloudData) {
  memoryCache = data;
  lastSyncTime = Date.now();

  try {
    await fetch(CLOUD_STORE_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'aadda_room_store',
        data,
      }),
    });
  } catch (e) {
    // ignore
  }

  // Also sync to local disk if running locally
  try {
    const localPath = path.join(process.cwd(), 'data', 'aadda-db.json');
    if (fs.existsSync(path.dirname(localPath))) {
      fs.writeFileSync(localPath, JSON.stringify(data, null, 2), 'utf-8');
    }
  } catch {
    // ignore
  }
}

function parseJsonBody(req: any): Promise<any> {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === 'object') {
      return resolve(req.body);
    }
    if (req.body && typeof req.body === 'string') {
      try {
        return resolve(JSON.parse(req.body));
      } catch {
        return resolve({});
      }
    }
    let body = '';
    req.on('data', (chunk: any) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

export default async function handler(req: any, res: any) {
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  const url = req.url || '';
  const method = req.method || 'GET';
  const pathname = url.split('?')[0].replace(/^\/api/, '');

  const store = await syncFromCloud();

  // Helper response
  const json = (data: any, status = 200) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  };

  const body = ['POST', 'PUT', 'PATCH'].includes(method) ? await parseJsonBody(req) : {};

  try {
    // -------------------------------------------------------------
    // AUTH ROUTES
    // -------------------------------------------------------------
    if (pathname === '/auth/login' && method === 'POST') {
      const login = (body.login || '').trim().toLowerCase();
      let user = store.users.find(
        (u) => u.email.toLowerCase() === login || u.username.toLowerCase() === login,
      );

      if (!user) {
        const username = login.includes('@') ? login.split('@')[0] : login;
        user = {
          id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          email: login.includes('@') ? login : `${login}@aadda.app`,
          username,
          displayName: username,
          district: 'Bengaluru',
          language: 'en',
          createdAt: new Date().toISOString(),
        };
        store.users.push(user);
        await saveToCloud(store);
      }

      return json({
        user,
        tokens: {
          accessToken: `token_${user.id}`,
          refreshToken: `ref_${user.id}`,
        },
      });
    }

    if (pathname === '/auth/register' && method === 'POST') {
      const email = (body.email || '').trim().toLowerCase();
      let user = store.users.find((u) => u.email.toLowerCase() === email);

      if (user) {
        user.displayName = body.displayName || user.displayName;
        user.username = body.username || user.username;
        user.district = body.district || user.district;
      } else {
        user = {
          id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          email,
          username: body.username || email.split('@')[0],
          displayName: body.displayName || body.username || email.split('@')[0],
          district: body.district || 'Bengaluru',
          language: body.language || 'en',
          createdAt: new Date().toISOString(),
        };
        store.users.push(user);
      }

      await saveToCloud(store);
      return json({
        user,
        tokens: {
          accessToken: `token_${user.id}`,
          refreshToken: `ref_${user.id}`,
        },
      });
    }

    if (pathname === '/auth/me' && method === 'GET') {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.replace('Bearer ', '').trim();
      const userId = token.replace('token_', '');
      const user = store.users.find((u) => u.id === userId) || store.users[0] || null;
      return json(user);
    }

    // -------------------------------------------------------------
    // ROOM / ADDA CREATION & LISTING
    // -------------------------------------------------------------
    if (pathname === '/addas' && method === 'GET') {
      return json(store.addas || []);
    }

    if (pathname === '/addas' && method === 'POST') {
      const name = (body.name || '').trim();
      if (!name) {
        return json({ message: 'Room name is required' }, 400);
      }

      const addaId = `adda_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      // Generate clean 4-character uppercase alphanumeric code: e.g. ADDA-7K2X
      const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
      const inviteCode = `ADDA-${randomHex}`;

      const newAdda = {
        id: addaId,
        name,
        description: body.description?.trim() || '',
        inviteCode,
        creatorId: 'user_creator',
        conversationId,
        memberCount: 1,
        myRole: 'OWNER',
        createdAt: new Date().toISOString(),
      };

      const newConv = {
        id: conversationId,
        type: 'ADDA',
        name,
        addaId,
        adda: newAdda,
        memberCount: 1,
        lastMessage: {
          content: `Welcome to ${name}! 🎉 Share invite code ${inviteCode}`,
          createdAt: new Date().toISOString(),
        },
      };

      store.addas.unshift(newAdda);
      store.conversations.unshift(newConv);

      store.messages[conversationId] = [
        {
          id: `msg_welcome_${Date.now()}`,
          conversationId,
          senderId: 'system',
          sender: { displayName: 'Adda Bot', username: 'addabot' },
          content: `Welcome to ${name}! Share code "${inviteCode}" with your crew to join. 🚀`,
          mediaUrl: null,
          createdAt: new Date().toISOString(),
          reactions: [],
        },
      ];

      // Save invitation lookup index
      store.invitations.unshift({
        id: `inv_${Date.now()}`,
        code: inviteCode,
        addaId,
        conversationId,
      });

      await saveToCloud(store);
      return json(newAdda);
    }

    // -------------------------------------------------------------
    // ROOM JOINING VIA INVITE CODE (CRITICAL REQUIREMENT)
    // -------------------------------------------------------------
    if (pathname === '/invitations/accept' && method === 'POST') {
      const rawCode = (body.code || '').trim().toUpperCase();
      if (!rawCode) {
        return json({ message: 'Please enter invite code' }, 400);
      }

      // Check case-insensitive against store.addas and store.invitations
      let targetAdda = store.addas.find(
        (a) => a.inviteCode && a.inviteCode.toUpperCase() === rawCode,
      );

      if (!targetAdda) {
        const inv = store.invitations.find((i) => i.code && i.code.toUpperCase() === rawCode);
        if (inv) {
          targetAdda = store.addas.find((a) => a.id === inv.addaId);
        }
      }

      if (!targetAdda) {
        return json({ message: 'Invalid Room Code. Please check the code and try again.' }, 404);
      }

      // Increment participant count
      targetAdda.memberCount = (targetAdda.memberCount || 1) + 1;

      // Update conversation lastMessage
      const conv = store.conversations.find((c) => c.id === targetAdda.conversationId);
      if (conv) {
        conv.memberCount = targetAdda.memberCount;
      }

      // Add system announcement in chat
      if (!store.messages[targetAdda.conversationId]) {
        store.messages[targetAdda.conversationId] = [];
      }
      store.messages[targetAdda.conversationId].push({
        id: `msg_join_${Date.now()}`,
        conversationId: targetAdda.conversationId,
        senderId: 'system',
        sender: { displayName: 'Adda Bot', username: 'addabot' },
        content: `A new member joined ${targetAdda.name} via code! 🎉`,
        mediaUrl: null,
        createdAt: new Date().toISOString(),
        reactions: [],
      });

      await saveToCloud(store);

      return json({
        success: true,
        adda: targetAdda,
        conversationId: targetAdda.conversationId,
      });
    }

    // -------------------------------------------------------------
    // CONVERSATIONS & CHAT MESSAGES
    // -------------------------------------------------------------
    if (pathname === '/conversations' && method === 'GET') {
      return json(store.conversations || []);
    }

    if (pathname.startsWith('/conversations/') && method === 'GET') {
      const convId = pathname.replace('/conversations/', '');
      const conv = store.conversations.find((c) => c.id === convId);
      if (!conv) {
        return json({ message: 'Conversation not found' }, 404);
      }
      return json(conv);
    }

    if (pathname.startsWith('/messages/conversation/') && method === 'GET') {
      const convId = pathname.split('?')[0].replace('/messages/conversation/', '');
      const msgs = store.messages[convId] || [];
      return json(msgs);
    }

    if (pathname === '/messages' && method === 'POST') {
      const { conversationId, content, mediaUrl, senderId } = body;
      if (!conversationId) {
        return json({ message: 'conversationId required' }, 400);
      }

      const authHeader = req.headers.authorization || '';
      const token = authHeader.replace('Bearer ', '').trim();
      const currentUserId = token.replace('token_', '') || senderId || 'user_anon';
      const senderUser = store.users.find((u) => u.id === currentUserId);

      const newMsg = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        conversationId,
        senderId: currentUserId,
        sender: {
          id: currentUserId,
          displayName: senderUser?.displayName || 'Friend',
          username: senderUser?.username || 'user',
          avatarUrl: senderUser?.avatarUrl,
        },
        content: (content || '').trim(),
        mediaUrl: mediaUrl || null,
        createdAt: new Date().toISOString(),
        reactions: [],
      };

      if (!store.messages[conversationId]) {
        store.messages[conversationId] = [];
      }
      store.messages[conversationId].push(newMsg);

      const conv = store.conversations.find((c) => c.id === conversationId);
      if (conv) {
        conv.lastMessage = {
          content: newMsg.content || 'Sent a photo',
          createdAt: newMsg.createdAt,
        };
      }

      await saveToCloud(store);
      return json(newMsg);
    }

    // -------------------------------------------------------------
    // SAVED FOLDERS & FOLDER ITEMS (REQUIREMENT 3)
    // -------------------------------------------------------------
    if (pathname === '/folders' && method === 'GET') {
      return json(store.folders || []);
    }

    if (pathname === '/folders' && method === 'POST') {
      const { title, emoji, color } = body;
      if (!title || !title.trim()) {
        return json({ message: 'Folder title is required' }, 400);
      }

      const newFolder = {
        id: `fld_${Date.now()}`,
        title: title.trim(),
        emoji: emoji || '📁',
        color: color || '#FFB82E',
        count: 0,
      };

      store.folders.push(newFolder);
      store.folderItems[newFolder.id] = [];
      await saveToCloud(store);

      return json(newFolder);
    }

    if (pathname.startsWith('/folders/') && pathname.endsWith('/items')) {
      const folderId = pathname.replace('/folders/', '').replace('/items', '');

      if (method === 'GET') {
        const items = store.folderItems[folderId] || [];
        return json(items);
      }

      if (method === 'POST') {
        const { title, description, tag } = body;
        if (!title || !title.trim()) {
          return json({ message: 'Item title is required' }, 400);
        }

        const newItem = {
          id: `item_${Date.now()}`,
          title: title.trim(),
          description: description?.trim() || '',
          tag: tag?.trim() || 'General',
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        };

        if (!store.folderItems[folderId]) {
          store.folderItems[folderId] = [];
        }
        store.folderItems[folderId].unshift(newItem);

        // Update folder count
        const f = store.folders.find((x) => x.id === folderId);
        if (f) {
          f.count = store.folderItems[folderId].length;
        }

        await saveToCloud(store);
        return json(newItem);
      }
    }

    // -------------------------------------------------------------
    // VIBE CHECK & CHAOS
    // -------------------------------------------------------------
    if (pathname.startsWith('/vibe')) {
      return json([]);
    }

    if (pathname.startsWith('/chaos')) {
      return json([]);
    }

    // Default 404 for unknown routes
    return json({ message: `API route not found: ${pathname}` }, 404);
  } catch (err: any) {
    console.error('API Error:', err);
    return json({ message: err.message || 'Internal Server Error' }, 500);
  }
}

