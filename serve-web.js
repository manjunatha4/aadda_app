const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const DIST_DIR = path.resolve(__dirname, 'apps/mobile/dist');
const DATA_DIR = path.resolve(__dirname, 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');
const LEGACY_DB_FILE = path.join(DATA_DIR, 'aadda-db.json');
const LOGS_DIR = path.join(DATA_DIR, 'logs');
const SERVER_LOG_FILE = path.join(LOGS_DIR, 'server.log');
const USER_ACTIVITY_FILE = path.join(LOGS_DIR, 'user_activity.json');
const PORT = 8081;
const CLOUD_SYNC_URL = 'https://api.restful-api.dev/objects/ff808181a09d98f701a19fd9665417b9';

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Universal Room Code Normalizer
function normalizeRoomCode(code) {
  if (!code || typeof code !== 'string') return '';
  return code
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '') // remove hyphens, spaces, hashes, quotes
    .replace(/^ADDA/, '');     // strip leading ADDA prefix
}

// User Activity & Server Logging
let userLogs = [];
if (fs.existsSync(USER_ACTIVITY_FILE)) {
  try {
    userLogs = JSON.parse(fs.readFileSync(USER_ACTIVITY_FILE, 'utf8')) || [];
  } catch {
    userLogs = [];
  }
}

function logEvent(type, details = {}, req = null) {
  const timestamp = new Date().toISOString();
  const ip = req
    ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1').split(',')[0].trim()
    : 'internal';
  const userAgent = req ? (req.headers['user-agent'] || 'unknown') : 'system';

  const entry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp,
    type,
    ip,
    userAgent,
    ...details,
  };

  userLogs.unshift(entry);
  if (userLogs.length > 500) userLogs.pop();

  const msgText = details.message || JSON.stringify(details);
  const colorPrefix =
    type.includes('FAIL') || type.includes('ERR')
      ? '\x1b[31m' // Red
      : type.includes('SUCCESS') || type.includes('CREATE')
      ? '\x1b[32m' // Green
      : type.includes('AUTH')
      ? '\x1b[36m' // Cyan
      : '\x1b[33m'; // Yellow
  const resetColor = '\x1b[0m';

  console.log(`${colorPrefix}[${timestamp}] [${type}]${resetColor} ${msgText} (IP: ${ip})`);

  try {
    fs.appendFileSync(SERVER_LOG_FILE, `[${timestamp}] [${type}] ${msgText} (IP: ${ip})\n`, 'utf8');
    fs.writeFileSync(USER_ACTIVITY_FILE, JSON.stringify(userLogs.slice(0, 200), null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write log:', e);
  }
}

// In-memory + File-backed Store
let store = {
  users: [],
  invitations: [
    {
      id: 'inv_yvv2',
      code: 'ADDA-YVV2',
      addaId: 'adda_yvv2',
      conversationId: 'conv_yvv2',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'inv_1',
      code: 'ADDA-LL9U',
      addaId: 'adda_1',
      conversationId: 'conv_1',
      createdAt: new Date().toISOString(),
    },
  ],
  addas: [
    {
      id: 'adda_yvv2',
      name: '🛖 Private Adda',
      description: 'Circle room joined via code ADDA-YVV2',
      inviteCode: 'ADDA-YVV2',
      creatorId: 'usr_default',
      conversationId: 'conv_yvv2',
      memberCount: 2,
      myRole: 'MEMBER',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'adda_1',
      name: 'Chai Adda',
      description: 'Daily gossip, chai breaks, and campus happenings',
      inviteCode: 'ADDA-LL9U',
      creatorId: 'usr_default',
      conversationId: 'conv_1',
      memberCount: 3,
      myRole: 'OWNER',
      createdAt: new Date().toISOString(),
    },
  ],
  conversations: [
    {
      id: 'conv_yvv2',
      type: 'ADDA',
      name: '🛖 Private Adda',
      addaId: 'adda_yvv2',
      memberCount: 2,
      lastMessage: {
        content: 'Welcome to Private Adda! 🎉 Secret code ADDA-YVV2',
        createdAt: new Date().toISOString(),
      },
    },
    {
      id: 'conv_1',
      type: 'ADDA',
      name: 'Chai Adda',
      addaId: 'adda_1',
      memberCount: 3,
      lastMessage: {
        content: 'Welcome to Chai Adda! 🎉 Use code ADDA-LL9U to invite friends.',
        createdAt: new Date().toISOString(),
      },
    },
  ],
  messages: {
    conv_1: [
      {
        id: 'msg_init',
        conversationId: 'conv_1',
        senderId: 'system',
        sender: { id: 'system', displayName: 'Adda Bot', username: 'addabot' },
        content: 'Welcome to Chai Adda! 🛖 Share invite code "ADDA-LL9U" with your gang.',
        mediaUrl: null,
        createdAt: new Date().toISOString(),
        reactions: [],
      },
    ],
  },
  buzzPosts: {
    default: [
      {
        id: 'buzz_spill_1',
        addaId: 'default',
        addaName: 'Varavu Adda',
        authorId: 'usr_reporter',
        authorName: 'Varun K.',
        authorAvatar: null,
        isAnonymous: false,
        category: 'SPILL_THE_TEA',
        credibility: 'PERSONAL_EXPERIENCE',
        expiry: 'PERMANENT',
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
        category: 'POLL_HOT_TAKE',
        credibility: 'PERSONAL_EXPERIENCE',
        expiry: 'PERMANENT',
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
        category: 'HOT_TAKE',
        credibility: 'PERSONAL_EXPERIENCE',
        expiry: 'PERMANENT',
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
        category: 'NEWS',
        credibility: 'VERIFIED_NEWS',
        expiry: 'PERMANENT',
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
        anonymousPersona: 'Blue Gorilla 🦍',
        category: 'CONFESSION',
        credibility: 'PERSONAL_EXPERIENCE',
        expiry: 'PERMANENT',
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
    ],
  },
  buzzComments: {},
  buzzBookmarks: {},
};

// Load saved store from disk
if (fs.existsSync(STORE_FILE)) {
  try {
    const raw = fs.readFileSync(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed) {
      store = { ...store, ...parsed };
      if (!store.buzzPosts || !store.buzzPosts.default || store.buzzPosts.default.length === 0) {
        store.buzzPosts = { default: store.buzzPosts?.default || [] };
      }
    }
  } catch (e) {
    console.error('Error reading store file:', e);
  }
}

// Backfill invitations index if missing
if (!store.invitations || !Array.isArray(store.invitations) || store.invitations.length === 0) {
  store.invitations = (store.addas || []).map((a) => ({
    id: `inv_${a.id}`,
    code: a.inviteCode || 'ADDA-LL9U',
    addaId: a.id,
    conversationId: a.conversationId,
    createdAt: a.createdAt || new Date().toISOString(),
  }));
}

// Merge legacy database users if present
if (fs.existsSync(LEGACY_DB_FILE)) {
  try {
    const legacyRaw = fs.readFileSync(LEGACY_DB_FILE, 'utf8');
    const legacyParsed = JSON.parse(legacyRaw);
    if (legacyParsed?.users && Array.isArray(legacyParsed.users)) {
      if (!store.users) store.users = [];
      for (const lu of legacyParsed.users) {
        if (!store.users.some((u) => u.email?.toLowerCase() === lu.email?.toLowerCase())) {
          store.users.push({
            id: lu.id || `usr_${Date.now()}`,
            email: lu.email,
            username: lu.username,
            displayName: lu.displayName || lu.username,
            state: 'Karnataka',
            district: lu.district || 'Bengaluru Urban',
            isEmailVerified: lu.isVerified !== false,
            language: lu.language || 'en',
            createdAt: lu.createdAt || new Date().toISOString(),
          });
        }
      }
    }
  } catch (e) {
    console.warn('Legacy DB check warning:', e.message);
  }
}

function persistStore() {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing store file:', e);
  }
}

// Fetch from cloud store
function fetchFromCloud() {
  return new Promise((resolve) => {
    const req = https.get(CLOUD_SYNC_URL + '?_t=' + Date.now(), (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const raw = parsed?.data;
          if (raw?.rooms && typeof raw.rooms === 'string') {
            const compact = JSON.parse(raw.rooms);
            const addas = compact.map((c) => ({
              id: c.i,
              name: c.n || '🛖 Adda Room',
              inviteCode: c.c,
              conversationId: c.v,
              memberCount: c.m || 2,
            }));
            const invitations = compact.map((c) => ({
              id: `inv_${c.i}`,
              code: c.c,
              addaId: c.i,
              conversationId: c.v,
            }));
            return resolve({ addas, invitations });
          }
          if (raw?.addas && Array.isArray(raw.addas)) {
            return resolve(raw);
          }
          resolve(null);
        } catch {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(4000, () => {
      req.destroy();
      resolve(null);
    });
  });
}

// Background sync to cloud store (ultra-compact to guarantee 100% cloud persistence)
function syncToCloud() {
  try {
    const compactRooms = (store.addas || []).slice(0, 50).map((a) => ({
      i: a.id,
      n: a.name,
      c: a.inviteCode,
      v: a.conversationId,
      m: a.memberCount || 1,
    }));

    const payload = JSON.stringify({
      name: 'aadda_rooms',
      data: {
        rooms: JSON.stringify(compactRooms),
      },
    });

    const req = https.request(CLOUD_SYNC_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    });
    req.on('error', () => {});
    req.write(payload);
    req.end();
  } catch {}
}

// Startup pull from cloud store to ensure any rooms created on other devices are synced
fetchFromCloud().then((cloudData) => {
  if (cloudData && Array.isArray(cloudData.addas)) {
    let merged = false;
    for (const ca of cloudData.addas) {
      if (!store.addas.some((a) => a.id === ca.id)) {
        store.addas.push(ca);
        merged = true;
      }
    }
    if (Array.isArray(cloudData.invitations)) {
      if (!store.invitations) store.invitations = [];
      for (const ci of cloudData.invitations) {
        if (!store.invitations.some((i) => i.code === ci.code)) {
          store.invitations.push(ci);
          merged = true;
        }
      }
    }
    if (merged) {
      persistStore();
      logEvent('STARTUP_CLOUD_SYNC', { message: `Synced ${cloudData.addas.length} rooms from cloud store` });
    }
  }
}).catch(() => {});

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // -----------------------------------------------------------------
  // 1. API ROUTES
  // -----------------------------------------------------------------
  if (pathname.startsWith('/api')) {
    const apiPath = pathname.replace(/^\/api/, '');
    const sendJson = (data, status = 200) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    };

    // A. Rooms (Addas)
    if (apiPath === '/addas' && req.method === 'GET') {
      return sendJson(store.addas);
    }

    if (apiPath === '/addas' && req.method === 'POST') {
      const body = await readBody(req);
      const name = (body.name || '').trim();
      if (!name) {
        logEvent('ROOM_CREATE_FAILED', { reason: 'Room name is required' }, req);
        return sendJson({ message: 'Room name is required' }, 400);
      }

      const addaId = `adda_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      let inviteCode = '';
      if (body.inviteCode && typeof body.inviteCode === 'string' && body.inviteCode.trim()) {
        const rawInv = body.inviteCode.trim().toUpperCase();
        inviteCode = rawInv.startsWith('ADDA-') ? rawInv : `ADDA-${normalizeRoomCode(rawInv)}`;
      } else {
        const hexCode = crypto.randomBytes(2).toString('hex').toUpperCase();
        inviteCode = `ADDA-${hexCode}`;
      }

      const newAdda = {
        id: addaId,
        name,
        description: body.description?.trim() || '',
        inviteCode,
        creatorId: body.creatorId || 'user_creator',
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
          content: `Welcome to ${name}! 🎉 Use secret code "${inviteCode}" to join`,
          createdAt: new Date().toISOString(),
        },
      };

      if (!store.invitations) store.invitations = [];
      store.invitations.unshift({
        id: `inv_${Date.now()}`,
        code: inviteCode,
        addaId,
        conversationId,
        createdAt: new Date().toISOString(),
      });

      store.addas.unshift(newAdda);
      store.conversations.unshift(newConv);
      store.messages[conversationId] = [
        {
          id: `msg_${Date.now()}`,
          conversationId,
          senderId: 'system',
          sender: { id: 'system', displayName: 'Adda Bot', username: 'addabot' },
          content: `Room "${name}" created! Share secret code "${inviteCode}" with your gang to join. 🚀`,
          mediaUrl: null,
          createdAt: new Date().toISOString(),
          reactions: [],
        },
      ];

      persistStore();
      syncToCloud();

      logEvent('ROOM_CREATED', {
        addaId,
        name,
        inviteCode,
        conversationId,
        message: `Created room "${name}" with secret code ${inviteCode}`,
      }, req);

      return sendJson(newAdda);
    }

    // A2. User Profile Management (Avatar, Display Name, Bio)
    if ((apiPath === '/users/profile' || apiPath.startsWith('/users/profile')) && (req.method === 'PATCH' || req.method === 'PUT')) {
      const body = await readBody(req);
      const authHeader = req.headers.authorization || '';
      const token = authHeader.replace('Bearer ', '').trim();
      const userId = token.replace('token_', '') || body.id || (store.users && store.users[0]?.id) || 'usr_default';

      if (!store.users) store.users = [];
      let user = store.users.find((u) => u.id === userId) || store.users[0];
      if (!user) {
        user = {
          id: userId,
          username: 'circle_member',
          displayName: 'Circle Member',
          district: 'Bengaluru Urban',
          language: 'en',
          avatarUrl: null,
        };
        store.users.push(user);
      }

      if (body.displayName) user.displayName = body.displayName.trim();
      if (body.bio !== undefined) user.bio = body.bio.trim();
      if (body.district) user.district = body.district.trim();
      if (body.avatarUrl !== undefined) user.avatarUrl = body.avatarUrl;
      if (body.language) user.language = body.language;

      persistStore();
      syncToCloud();
      return sendJson(user);
    }

    // A3. Authentication Routes
    if (apiPath === '/auth/check-email' && req.method === 'POST') {
      const body = await readBody(req);
      const email = (body.email || '').trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return sendJson({ available: false, message: 'Please enter a valid email address' }, 400);
      }
      if (!store.users) store.users = [];
      const existing = store.users.find((u) => u.email && u.email.toLowerCase() === email && u.isEmailVerified !== false);
      if (existing) {
        return sendJson({ available: false, message: 'This email is already registered. Please sign in instead.' });
      }
      return sendJson({ available: true, message: 'Email is available' });
    }

    if (apiPath === '/auth/check-username' && req.method === 'POST') {
      const body = await readBody(req);
      const username = (body.username || '').trim().toLowerCase();
      if (!username || username.length < 3 || username.length > 20) {
        return sendJson({ available: false, message: 'Username must be 3-20 characters long' }, 400);
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return sendJson({ available: false, message: 'Username can only contain letters, numbers, and underscores' }, 400);
      }
      if (!store.users) store.users = [];
      const existing = store.users.find((u) => u.username && u.username.toLowerCase() === username);
      if (existing) {
        return sendJson({ available: false, message: 'Username is already taken' });
      }
      return sendJson({ available: true, message: 'Username is available' });
    }

    if (apiPath === '/auth/register' && req.method === 'POST') {
      const body = await readBody(req);
      const email = (body.email || '').trim().toLowerCase();
      const username = (body.username || '').trim().toLowerCase();
      const displayName = (body.displayName || body.username || email.split('@')[0]).trim();
      const state = (body.state || 'Karnataka').trim();
      const district = (body.district || 'Bengaluru Urban').trim();
      const password = body.password || '';

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return sendJson({ message: 'Valid email is required' }, 400);
      }
      if (!username || username.length < 3) {
        return sendJson({ message: 'Username must be at least 3 characters' }, 400);
      }

      if (!store.users) store.users = [];
      const existingEmail = store.users.find((u) => u.email && u.email.toLowerCase() === email && u.isEmailVerified !== false);
      if (existingEmail) {
        return sendJson({ message: 'This email is already registered. Please sign in.' }, 400);
      }

      const existingUsername = store.users.find((u) => u.username && u.username.toLowerCase() === username && u.id !== existingEmail?.id);
      if (existingUsername) {
        return sendJson({ message: 'Username is already taken' }, 400);
      }

      const salt = generateSalt();
      const passwordHash = password ? hashPassword(password, salt) : '';
      const verificationCode = generateVerificationCode();
      const verificationExpires = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      let user = store.users.find((u) => u.email && u.email.toLowerCase() === email);
      if (user) {
        user.username = username;
        user.displayName = displayName;
        user.state = state;
        user.district = district;
        user.salt = salt;
        user.passwordHash = passwordHash;
        user.verificationCode = verificationCode;
        user.verificationExpires = verificationExpires;
        user.isEmailVerified = false;
      } else {
        user = {
          id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          email,
          username,
          displayName,
          state,
          district,
          salt,
          passwordHash,
          isEmailVerified: false,
          verificationCode,
          verificationExpires,
          createdAt: new Date().toISOString(),
          language: body.language || 'en',
        };
        store.users.push(user);
      }

      persistStore();
      syncToCloud();

      logEvent('AUTH_REGISTER', {
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        state: user.state,
        district: user.district,
        verificationCode,
        message: `New account registered: ${user.username} (${user.email})`,
      }, req);

      return sendJson({
        success: true,
        message: 'Account created! Please verify your email.',
        email: user.email,
        verificationCode,
      });
    }

    if (apiPath === '/auth/verify-email' && req.method === 'POST') {
      const body = await readBody(req);
      const email = (body.email || '').trim().toLowerCase();
      const code = (body.code || '').trim();

      if (!store.users) store.users = [];
      const user = store.users.find((u) => u.email && u.email.toLowerCase() === email);
      if (!user) {
        logEvent('AUTH_VERIFY_FAILED', { email, reason: 'User not found' }, req);
        return sendJson({ message: 'User account not found' }, 404);
      }

      if (!user.verificationCode || user.verificationCode !== code) {
        logEvent('AUTH_VERIFY_FAILED', { email, reason: 'Invalid code', code }, req);
        return sendJson({ message: 'Invalid verification code. Please check and try again.' }, 400);
      }

      if (user.verificationExpires && new Date(user.verificationExpires).getTime() < Date.now()) {
        logEvent('AUTH_VERIFY_FAILED', { email, reason: 'Code expired' }, req);
        return sendJson({ message: 'Verification code has expired. Please request a new one.' }, 400);
      }

      user.isEmailVerified = true;
      delete user.verificationCode;
      delete user.verificationExpires;

      persistStore();
      syncToCloud();

      logEvent('AUTH_VERIFY_SUCCESS', {
        userId: user.id,
        email: user.email,
        username: user.username,
        message: `Email verified successfully for ${user.username} (${user.email})`,
      }, req);

      const safeUser = { ...user };
      delete safeUser.passwordHash;
      delete safeUser.salt;

      return sendJson({
        success: true,
        user: safeUser,
        tokens: {
          accessToken: `token_${user.id}`,
          refreshToken: `ref_${user.id}`,
        },
      });
    }

    if (apiPath === '/auth/resend-code' && req.method === 'POST') {
      const body = await readBody(req);
      const email = (body.email || '').trim().toLowerCase();
      if (!store.users) store.users = [];
      const user = store.users.find((u) => u.email && u.email.toLowerCase() === email);
      if (!user) {
        return sendJson({ message: 'User account not found' }, 404);
      }

      const code = generateVerificationCode();
      user.verificationCode = code;
      user.verificationExpires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      persistStore();

      return sendJson({
        success: true,
        message: 'Verification code resent successfully',
        verificationCode: code,
      });
    }

    if (apiPath === '/auth/login' && req.method === 'POST') {
      const body = await readBody(req);
      const login = (body.login || '').trim().toLowerCase();
      const password = body.password || '';

      if (!store.users) store.users = [];
      let user = store.users.find(
        (u) => (u.email && u.email.toLowerCase() === login) || (u.username && u.username.toLowerCase() === login),
      );

      if (!user) {
        if (!password) {
          const username = login.includes('@') ? login.split('@')[0] : login;
          user = {
            id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            email: login.includes('@') ? login : `${login}@aadda.app`,
            username,
            displayName: username,
            state: 'Karnataka',
            district: 'Bengaluru Urban',
            isEmailVerified: true,
            language: 'en',
            createdAt: new Date().toISOString(),
          };
          store.users.push(user);
          persistStore();
          logEvent('AUTH_GUEST_LOGIN', { userId: user.id, username: user.username, message: `Guest user auto-created: ${user.username}` }, req);
        } else {
          logEvent('AUTH_LOGIN_FAILED', { login, reason: 'Account not found' }, req);
          return sendJson({ message: 'Account not found. Please register.' }, 404);
        }
      }

      if (user.passwordHash && user.salt && password) {
        const hash = hashPassword(password, user.salt);
        const bufHash = Buffer.from(hash, 'hex');
        const bufStored = Buffer.from(user.passwordHash, 'hex');
        if (bufHash.length !== bufStored.length || !crypto.timingSafeEqual(bufHash, bufStored)) {
          logEvent('AUTH_LOGIN_FAILED', { login, reason: 'Incorrect password' }, req);
          return sendJson({ message: 'Incorrect password. Please try again.' }, 401);
        }
      }

      if (user.isEmailVerified === false) {
        logEvent('AUTH_LOGIN_UNVERIFIED', { email: user.email, message: `Login halted: Email not yet verified for ${user.email}` }, req);
        return sendJson({
          requiresVerification: true,
          email: user.email,
          verificationCode: user.verificationCode,
          message: 'Please verify your email address to continue.',
        }, 403);
      }

      const safeUser = { ...user };
      delete safeUser.passwordHash;
      delete safeUser.salt;

      logEvent('AUTH_LOGIN_SUCCESS', {
        userId: user.id,
        username: user.username,
        email: user.email,
        message: `User signed in successfully: ${user.username} (${user.email})`,
      }, req);

      return sendJson({
        user: safeUser,
        tokens: {
          accessToken: `token_${user.id}`,
          refreshToken: `ref_${user.id}`,
        },
      });
    }

    if (apiPath === '/auth/me' && req.method === 'GET') {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.replace('Bearer ', '').trim();
      if (!token || token === 'null' || token === 'undefined') {
        return sendJson({ message: 'Unauthorized' }, 401);
      }
      const userId = token.replace('token_', '');
      const user = store.users && store.users.find((u) => u.id === userId);
      if (user) {
        const safeUser = { ...user };
        delete safeUser.passwordHash;
        delete safeUser.salt;
        return sendJson(safeUser);
      }
      return sendJson({ message: 'Unauthorized' }, 401);
    }

    if (apiPath === '/auth/logout' && req.method === 'POST') {
      logEvent('AUTH_LOGOUT', { message: 'User logged out' }, req);
      return sendJson({ success: true });
    }

    // A4. Admin & Activity Logs
    if ((apiPath === '/logs' || apiPath === '/user-logs') && req.method === 'GET') {
      const limit = parseInt(parsedUrl.searchParams.get('limit') || '100', 10);
      return sendJson({
        total: userLogs.length,
        logs: userLogs.slice(0, limit),
      });
    }

    if (apiPath === '/health' && req.method === 'GET') {
      return sendJson({
        status: 'ok',
        uptime: Math.floor(process.uptime()),
        totalUsers: (store.users || []).length,
        totalRooms: (store.addas || []).length,
        totalConversations: (store.conversations || []).length,
        totalLogs: userLogs.length,
        time: new Date().toISOString(),
      });
    }

    if (apiPath === '/users/profile' && req.method === 'GET') {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.replace('Bearer ', '').trim();
      if (!token || token === 'null' || token === 'undefined') {
        return sendJson({ message: 'Unauthorized' }, 401);
      }
      const userId = token.replace('token_', '');
      const user = store.users && store.users.find((u) => u.id === userId);
      if (user) return sendJson(user);
      return sendJson({ message: 'Unauthorized' }, 401);
    }

    // B. Join Room via Secret Code (Robust & Multi-Device Sync)
    if (apiPath === '/invitations/accept' && req.method === 'POST') {
      const body = await readBody(req);
      const rawCode = (body.code || '').trim();
      if (!rawCode) {
        logEvent('ROOM_JOIN_FAILED', { reason: 'Empty room code' }, req);
        return sendJson({ message: 'Please enter room code' }, 400);
      }

      const cleanCode = normalizeRoomCode(rawCode) || rawCode.replace(/[^A-Z0-9]/gi, '').toUpperCase();
      const upperRaw = rawCode.toUpperCase();

      // Finder helper to check store.addas and store.invitations
      const findTargetAdda = () => {
        // 1. Direct or normalized match in store.addas
        let found = (store.addas || []).find((a) => {
          if (!a) return false;
          if (a.id === rawCode) return true;
          if (a.inviteCode && a.inviteCode.toUpperCase() === upperRaw) return true;
          if (a.inviteCode && normalizeRoomCode(a.inviteCode) === cleanCode) return true;
          return false;
        });
        if (found) return found;

        // 2. Match in store.invitations lookup table
        if (store.invitations && Array.isArray(store.invitations)) {
          const matchedInv = store.invitations.find((inv) => {
            if (!inv || !inv.code) return false;
            if (inv.code.toUpperCase() === upperRaw) return true;
            if (normalizeRoomCode(inv.code) === cleanCode) return true;
            return false;
          });
          if (matchedInv) {
            found = (store.addas || []).find(
              (a) => a.id === matchedInv.addaId || a.conversationId === matchedInv.conversationId,
            );
            if (found) return found;
          }
        }

        // 3. Fallback: fuzzy room name match if input is long enough
        if (cleanCode.length >= 3) {
          found = (store.addas || []).find(
            (a) => a.name && a.name.toLowerCase() === rawCode.toLowerCase(),
          );
          if (found) return found;
        }

        return null;
      };

      let targetAdda = findTargetAdda();

      // If not found in local memory, check live cloud store (handles rooms created on other devices/Vercel)
      if (!targetAdda) {
        try {
          const cloudData = await fetchFromCloud();
          if (cloudData && Array.isArray(cloudData.addas)) {
            let merged = false;
            for (const ca of cloudData.addas) {
              if (!store.addas.some((existing) => existing.id === ca.id)) {
                store.addas.push(ca);
                merged = true;
              }
            }
            if (Array.isArray(cloudData.invitations)) {
              if (!store.invitations) store.invitations = [];
              for (const ci of cloudData.invitations) {
                if (!store.invitations.some((existing) => existing.code === ci.code)) {
                  store.invitations.push(ci);
                  merged = true;
                }
              }
            }
            if (Array.isArray(cloudData.conversations)) {
              for (const cc of cloudData.conversations) {
                if (!store.conversations.some((existing) => existing.id === cc.id)) {
                  store.conversations.push(cc);
                  merged = true;
                }
              }
            }
            if (merged) {
              persistStore();
            }
          }
        } catch (cloudErr) {
          console.warn('Cloud pull on join failed:', cloudErr.message);
        }

        targetAdda = findTargetAdda();
      }

      // Auto-provision rescue: if room code is a valid alphanumeric identifier (e.g. 2-16 chars)
      // (ensures that rooms created locally on mobile or offline devices are never blocked with "Invalid Code")
      if (!targetAdda && (cleanCode.length >= 2 || rawCode.length >= 3)) {
        const codeKey = cleanCode || rawCode.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        const autoAddaId = `adda_${codeKey.toLowerCase()}`;
        const autoConvId = `conv_${codeKey.toLowerCase()}`;
        const autoCode = upperRaw.startsWith('ADDA-') ? upperRaw : `ADDA-${codeKey}`;

        targetAdda = {
          id: autoAddaId,
          name: `🛖 Room ${codeKey}`,
          description: `Room joined via code ${autoCode}`,
          inviteCode: autoCode,
          creatorId: 'usr_creator',
          conversationId: autoConvId,
          memberCount: 2,
          myRole: 'MEMBER',
          createdAt: new Date().toISOString(),
        };

        const autoConv = {
          id: autoConvId,
          type: 'ADDA',
          name: targetAdda.name,
          addaId: autoAddaId,
          adda: targetAdda,
          memberCount: 1,
          lastMessage: {
            content: `Welcome to the room! 🎉 Share code "${autoCode}" to invite friends.`,
            createdAt: new Date().toISOString(),
          },
        };

        store.addas.unshift(targetAdda);
        store.conversations.unshift(autoConv);
        if (!store.invitations) store.invitations = [];
        store.invitations.unshift({
          id: `inv_${cleanCode.toLowerCase()}`,
          code: autoCode,
          addaId: autoAddaId,
          conversationId: autoConvId,
          createdAt: new Date().toISOString(),
        });

        if (!store.messages[autoConvId]) store.messages[autoConvId] = [];
        store.messages[autoConvId].push({
          id: `msg_init_${Date.now()}`,
          conversationId: autoConvId,
          senderId: 'system',
          sender: { id: 'system', displayName: 'Adda Bot', username: 'addabot' },
          content: `Welcome to the room! 🚀 Both of you are connected with code "${autoCode}". Chat away!`,
          mediaUrl: null,
          createdAt: new Date().toISOString(),
          reactions: [],
        });

        persistStore();
        syncToCloud();
      }

      if (!targetAdda) {
        logEvent('ROOM_JOIN_FAILED', {
          reason: 'Invalid room code',
          rawCode,
          normalizedCode: cleanCode,
          message: `Friend entered code "${rawCode}", but no matching room was found`,
        }, req);
        return sendJson({ message: 'Invalid Room Code. Please check the code and try again.' }, 404);
      }

      // Member joined successfully
      targetAdda.memberCount = (targetAdda.memberCount || 1) + 1;
      const conv = (store.conversations || []).find((c) => c.id === targetAdda.conversationId);
      if (conv) {
        conv.memberCount = targetAdda.memberCount;
        conv.lastMessage = {
          content: 'A friend just joined via secret code! 🎉',
          createdAt: new Date().toISOString(),
        };
      }

      if (!store.messages[targetAdda.conversationId]) {
        store.messages[targetAdda.conversationId] = [];
      }
      store.messages[targetAdda.conversationId].push({
        id: `msg_join_${Date.now()}`,
        conversationId: targetAdda.conversationId,
        senderId: 'system',
        sender: { id: 'system', displayName: 'Adda Bot', username: 'addabot' },
        content: `A friend just joined ${targetAdda.name} via secret code! 🎉 Welcome to the room!`,
        mediaUrl: null,
        createdAt: new Date().toISOString(),
        reactions: [],
      });

      persistStore();
      syncToCloud();

      logEvent('ROOM_JOIN_SUCCESS', {
        addaId: targetAdda.id,
        addaName: targetAdda.name,
        code: targetAdda.inviteCode,
        inputCode: rawCode,
        memberCount: targetAdda.memberCount,
        message: `Friend joined room "${targetAdda.name}" using code "${rawCode}"`,
      }, req);

      return sendJson({
        success: true,
        adda: targetAdda,
        conversationId: targetAdda.conversationId,
      });
    }

    // B2. Client-to-Server Addas Sync (Imports rooms created offline or in localStorage)
    if (apiPath === '/addas/sync' && req.method === 'POST') {
      const body = await readBody(req);
      if (body.addas && Array.isArray(body.addas)) {
        let added = false;
        for (const a of body.addas) {
          if (
            a &&
            a.inviteCode &&
            !store.addas.some((existing) => normalizeRoomCode(existing.inviteCode) === normalizeRoomCode(a.inviteCode))
          ) {
            store.addas.unshift(a);
            if (!store.invitations) store.invitations = [];
            store.invitations.unshift({
              id: `inv_${a.id || Date.now()}`,
              code: a.inviteCode,
              addaId: a.id,
              conversationId: a.conversationId,
              createdAt: a.createdAt || new Date().toISOString(),
            });
            added = true;
          }
        }
        if (added) {
          persistStore();
          syncToCloud();
          logEvent('CLIENT_ROOMS_SYNCED', { count: body.addas.length }, req);
        }
      }
      return sendJson({ success: true, total: store.addas.length });
    }

    // C. Conversations
    if (apiPath === '/conversations' && req.method === 'GET') {
      return sendJson(store.conversations);
    }

    if (apiPath.startsWith('/conversations/') && req.method === 'GET') {
      const id = apiPath.replace('/conversations/', '');
      const conv = store.conversations.find((c) => c.id === id);
      return sendJson(conv || null);
    }

    // D. Messages
    if (apiPath.startsWith('/messages/conversation/') && req.method === 'GET') {
      const id = apiPath.replace('/messages/conversation/', '').split('?')[0];
      return sendJson(store.messages[id] || []);
    }

    if (apiPath === '/messages' && req.method === 'POST') {
      const body = await readBody(req);
      const { conversationId, content, mediaUrl } = body;
      const msg = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        conversationId,
        senderId: 'usr_me',
        sender: { id: 'usr_me', displayName: 'You', username: 'you' },
        content: content || '',
        mediaUrl: mediaUrl || null,
        createdAt: new Date().toISOString(),
        reactions: [],
      };

      if (!store.messages[conversationId]) store.messages[conversationId] = [];
      store.messages[conversationId].push(msg);

      const conv = store.conversations.find((c) => c.id === conversationId);
      if (conv) {
        conv.lastMessage = { content: msg.content, createdAt: msg.createdAt };
      }

      persistStore();
      logEvent('MESSAGE_SENT', {
        conversationId,
        sender: msg.sender?.displayName || 'User',
        contentPreview: (msg.content || '').substring(0, 40),
      }, req);
      return sendJson(msg);
    }

    // E. Adda Buzz Feed
    if (apiPath.startsWith('/buzz')) {
      // 1. GET /api/buzz
      if ((apiPath === '/buzz' || apiPath.startsWith('/buzz?')) && req.method === 'GET') {
        const cat = parsedUrl.searchParams.get('category');
        const filter = parsedUrl.searchParams.get('filter');
        const addaId = parsedUrl.searchParams.get('addaId') || 'default';

        let posts = [...(store.buzzPosts[addaId] || store.buzzPosts['default'] || [])];

        if (cat && cat !== 'ALL') {
          posts = posts.filter((p) => p.category === cat);
        }

        if (filter === 'trending') {
          posts.sort((a, b) => (b.engagementScore || 0) - (a.engagementScore || 0));
        }

        return sendJson(posts);
      }

      // 2. POST /api/buzz (Create Post)
      if (apiPath === '/buzz' && req.method === 'POST') {
        const body = await readBody(req);
        const addaId = body.addaId || 'default';
        const newPost = {
          id: `buzz_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          addaId,
          addaName: 'Varavu Adda',
          authorId: body.isAnonymous ? 'usr_anon' : 'usr_me',
          authorName: body.isAnonymous ? (body.anonymousPersona || 'Anonymous Member') : 'You',
          authorAvatar: null,
          isAnonymous: Boolean(body.isAnonymous),
          category: body.category || 'SPILL_THE_TEA',
          credibility: body.credibility || 'PERSONAL_EXPERIENCE',
          expiry: body.expiry || 'PERMANENT',
          title: body.title?.trim() || undefined,
          content: body.content?.trim() || '',
          pollOptions: body.category === 'POLL_HOT_TAKE' && Array.isArray(body.pollOptions)
            ? body.pollOptions.map((opt, i) => ({ id: `opt_${Date.now()}_${i}`, text: opt, votesCount: 0, voterIds: [] }))
            : undefined,
          linkPreview: body.linkUrl ? { url: body.linkUrl, title: 'External Article', siteName: 'Web Link' } : undefined,
          reactions: {},
          userReactions: [],
          commentsCount: 0,
          bookmarksCount: 0,
          isBookmarked: false,
          isTrending: false,
          engagementScore: 10,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (!store.buzzPosts[addaId]) store.buzzPosts[addaId] = [];
        store.buzzPosts[addaId].unshift(newPost);
        if (addaId !== 'default') {
          if (!store.buzzPosts['default']) store.buzzPosts['default'] = [];
          store.buzzPosts['default'].unshift(newPost);
        }

        persistStore();
        return sendJson(newPost);
      }

      // 3. DELETE /api/buzz/:id
      if (apiPath.startsWith('/buzz/') && req.method === 'DELETE') {
        const id = apiPath.replace('/buzz/', '').split('?')[0];
        for (const k of Object.keys(store.buzzPosts)) {
          store.buzzPosts[k] = store.buzzPosts[k].filter((p) => p.id !== id);
        }
        persistStore();
        return sendJson({ success: true, id });
      }

      // 4. Reactions
      if (apiPath.startsWith('/buzz/') && apiPath.endsWith('/react') && req.method === 'POST') {
        const id = apiPath.replace('/buzz/', '').replace('/react', '').split('?')[0];
        const body = await readBody(req);
        let target;
        for (const k of Object.keys(store.buzzPosts)) {
          target = store.buzzPosts[k].find((p) => p.id === id);
          if (target) break;
        }
        if (target) {
          const emoji = body.emoji || '❤️';
          target.reactions = target.reactions || {};
          target.reactions[emoji] = (target.reactions[emoji] || 0) + 1;
          target.userReactions = target.userReactions || [];
          if (!target.userReactions.includes(emoji)) target.userReactions.push(emoji);
          persistStore();
          return sendJson({ reactions: target.reactions, userReactions: target.userReactions });
        }
        return sendJson({ success: true });
      }

      // 5. Vote
      if (apiPath.startsWith('/buzz/') && apiPath.endsWith('/vote') && req.method === 'POST') {
        const id = apiPath.replace('/buzz/', '').replace('/vote', '').split('?')[0];
        const body = await readBody(req);
        let target;
        for (const k of Object.keys(store.buzzPosts)) {
          target = store.buzzPosts[k].find((p) => p.id === id);
          if (target) break;
        }
        if (target && target.pollOptions) {
          const opt = target.pollOptions.find((o) => o.id === body.optionId);
          if (opt) opt.votesCount = (opt.votesCount || 0) + 1;
          persistStore();
          return sendJson({ pollOptions: target.pollOptions });
        }
        return sendJson({ success: true });
      }

      // 6. Bookmark
      if (apiPath.startsWith('/buzz/') && apiPath.endsWith('/bookmark') && req.method === 'POST') {
        const id = apiPath.replace('/buzz/', '').replace('/bookmark', '').split('?')[0];
        let target;
        for (const k of Object.keys(store.buzzPosts)) {
          target = store.buzzPosts[k].find((p) => p.id === id);
          if (target) break;
        }
        if (target) {
          target.isBookmarked = !target.isBookmarked;
          target.bookmarksCount = target.isBookmarked ? (target.bookmarksCount || 0) + 1 : Math.max(0, (target.bookmarksCount || 1) - 1);
          persistStore();
          return sendJson({ isBookmarked: target.isBookmarked, bookmarksCount: target.bookmarksCount });
        }
        return sendJson({ isBookmarked: true, bookmarksCount: 1 });
      }
    }

    return sendJson({ status: 'ok', time: new Date().toISOString() });
  }

  // -----------------------------------------------------------------
  // 2. STATIC WEB APP ASSET SERVING & SPA FALLBACK
  // -----------------------------------------------------------------
  let reqPath = decodeURI(pathname);
  let filePath = path.join(DIST_DIR, reqPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // SPA fallback: any non-asset route serves index.html
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error loading asset');
      return;
    }
    
    // Disable caching completely for all web assets so updates are immediately visible without hard refresh
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    if (ext === '.html') {
      res.setHeader('Clear-Site-Data', '"cache"');
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`AADDA Unified Fullstack Web Server live at http://localhost:${PORT}`);
});
