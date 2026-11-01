import type { IncomingMessage, ServerResponse } from 'http';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// Shared Cloud Database Object for Vercel Cross-Device Persistence
const CLOUD_STORE_URL = 'https://api.restful-api.dev/objects/ff808181a09d98f701a19413d89279c4';

interface CloudData {
  users: any[];
  addas: any[];
  conversations: any[];
  messages: Record<string, any[]>;
  folders: any[];
  folderItems: Record<string, any[]>;
  invitations: any[];
  dailyChaos: Record<string, any[]>;
  buzzPosts?: Record<string, any[]>;
  buzzComments?: Record<string, any[]>;
  buzzBookmarks?: Record<string, string[]>;
  buzzReports?: any[];
}

const SEED_BUZZ_POSTS: any[] = [
  {
    id: 'buzz_featured_today',
    addaId: 'default',
    authorId: 'usr_seed_1',
    authorName: 'Rohit K',
    authorAvatar: null,
    isAnonymous: false,
    category: 'COLLEGE_RADAR',
    credibility: 'UNVERIFIED_CLAIM',
    expiry: 'PERMANENT',
    expiresAt: null,
    title: "Today's Adda Buzz 👀",
    content: "Apparently, something crazy happened in college today...",
    mediaUrl: null,
    mediaType: null,
    linkPreview: null,
    pollOptions: null,
    reactions: { '😂': 8, '👀': 3, '🍿': 6, '☕': 4, '🔥': 2 },
    userReactions: [],
    commentsCount: 8,
    bookmarksCount: 5,
    isTrending: true,
    engagementScore: 18.5,
    createdAt: new Date(Date.now() - 120000).toISOString(),
    updatedAt: new Date(Date.now() - 120000).toISOString(),
  },
  {
    id: 'buzz_tea_1',
    addaId: 'default',
    authorId: 'usr_seed_2',
    authorName: 'Ananya S',
    authorAvatar: null,
    isAnonymous: false,
    category: 'SPILL_THE_TEA',
    credibility: 'PERSONAL_EXPERIENCE',
    expiry: 'PERMANENT',
    expiresAt: null,
    title: 'Canteen Counter 4 Coffee Drama ☕',
    content: 'Someone in our block ordered 14 filter coffees for table 4 and vanished into thin air the exact second the bill arrived. We ended up doing a UPI split roulette 😂',
    mediaUrl: null,
    mediaType: null,
    linkPreview: null,
    pollOptions: null,
    reactions: { '😂': 14, '☕': 11, '🍿': 7, '💀': 9 },
    userReactions: [],
    commentsCount: 4,
    bookmarksCount: 6,
    isTrending: true,
    engagementScore: 16.2,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'buzz_verdict_1',
    addaId: 'default',
    authorId: 'usr_seed_3',
    authorName: 'Campus Council',
    authorAvatar: null,
    isAnonymous: false,
    category: 'POLL_HOT_TAKE',
    credibility: 'VERIFIED_NEWS',
    expiry: 'PERMANENT',
    expiresAt: null,
    title: "What's the Verdict? 🗳️",
    content: "Turn circle debate into a verdict: Should the strict 75% college attendance rule be abolished or maintained? Let's vote, guru!",
    mediaUrl: null,
    mediaType: null,
    linkPreview: null,
    pollOptions: [
      { id: 'opt_v1', text: 'Abolish it! Knowledge > Biometrics 🚀', votesCount: 54, voterIds: [] },
      { id: 'opt_v2', text: 'Keep it, otherwise 9 AM classes are empty 😴', votesCount: 16, voterIds: [] },
    ],
    reactions: { '🔥': 28, '👀': 14, '🍿': 19 },
    userReactions: [],
    commentsCount: 12,
    bookmarksCount: 15,
    isTrending: true,
    engagementScore: 24.8,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'buzz_trending_1',
    addaId: 'default',
    authorId: 'usr_seed_4',
    authorName: 'Suresh Rao',
    authorAvatar: null,
    isAnonymous: false,
    category: 'HOT_TAKE',
    credibility: 'PERSONAL_EXPERIENCE',
    expiry: 'PERMANENT',
    expiresAt: null,
    title: 'Bengaluru Masala Dosa Championship 🧈',
    content: 'Settle the eternal debate once and for all: CTR Malleshwaram Benne Masala or Vidyarthi Bhavan Gandhi Bazaar? Pick your champion.',
    mediaUrl: null,
    mediaType: null,
    linkPreview: null,
    pollOptions: [
      { id: 'opt_d1', text: 'CTR Malleshwaram (Benne Masala) 🧈', votesCount: 68, voterIds: [] },
      { id: 'opt_d2', text: 'Vidyarthi Bhavan Gandhi Bazaar ☕', votesCount: 41, voterIds: [] },
      { id: 'opt_d3', text: 'Taaza Thindi Jayanagar 🌿', votesCount: 29, voterIds: [] },
      { id: 'opt_d4', text: 'MTR Near Lalbagh ❤️', votesCount: 17, voterIds: [] },
    ],
    reactions: { '🔥': 42, '❤️': 35, '🍿': 21, '😂': 12 },
    userReactions: [],
    commentsCount: 18,
    bookmarksCount: 14,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'buzz_confession_1',
    addaId: 'default',
    authorId: 'usr_seed_5',
    authorName: 'Blue Gorilla 🦍',
    authorAvatar: null,
    isAnonymous: true,
    category: 'CONFESSION',
    credibility: 'PERSONAL_EXPERIENCE',
    expiry: 'PERMANENT',
    expiresAt: null,
    title: 'Confession Corner 👀',
    content: "I'd like to think money wouldn't change me, but when I'm winning Monopoly I'm a terrible person. Also I submitted an unedited Kannada meme audio as my final design presentation soundtrack 😂",
    mediaUrl: null,
    mediaType: null,
    linkPreview: null,
    pollOptions: null,
    reactions: { '💀': 48, '😂': 62, '🍿': 24, '❤️': 19 },
    userReactions: [],
    commentsCount: 9,
    bookmarksCount: 11,
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    updatedAt: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: 'buzz_guesswho_1',
    addaId: 'default',
    authorId: 'usr_seed_3',
    authorName: 'Karthik B',
    authorAvatar: null,
    isAnonymous: false,
    category: 'GUESS_WHO',
    credibility: 'UNVERIFIED_CLAIM',
    expiry: 'PERMANENT',
    expiresAt: null,
    title: 'Guess Who? 🎭',
    content: 'Who in our circle locked their keys inside their scooter boot at 1 AM outside Empire Koramangala and had to take an auto back?',
    mediaUrl: null,
    mediaType: null,
    linkPreview: null,
    pollOptions: [
      { id: 'opt_gw1', text: 'Rohit K 🛵', votesCount: 31, voterIds: [] },
      { id: 'opt_gw2', text: 'Deepa M 🤦‍♀️', votesCount: 14, voterIds: [] },
      { id: 'opt_gw3', text: 'Karthik himself 😂', votesCount: 45, voterIds: [] },
    ],
    reactions: { '😂': 38, '👀': 19, '🍿': 22 },
    userReactions: [],
    commentsCount: 7,
    bookmarksCount: 8,
    createdAt: new Date(Date.now() - 21600000).toISOString(),
    updatedAt: new Date(Date.now() - 21600000).toISOString(),
  },
  {
    id: 'buzz_latenight_1',
    addaId: 'default',
    authorId: 'usr_seed_6',
    authorName: 'Night Owl 🦉',
    authorAvatar: null,
    isAnonymous: false,
    category: 'LATE_NIGHT_ADDA',
    credibility: 'PERSONAL_EXPERIENCE',
    expiry: 'PERMANENT',
    expiresAt: null,
    title: 'Late Night Adda 🌙',
    content: '2 AM check-in: Who else is wide awake staring at their ceiling questioning every life choice since 10th standard? Voice notes open 🎧',
    mediaUrl: null,
    mediaType: null,
    linkPreview: null,
    pollOptions: null,
    reactions: { '💀': 29, '☕': 18, '❤️': 21 },
    userReactions: [],
    commentsCount: 6,
    bookmarksCount: 9,
    createdAt: new Date(Date.now() - 28800000).toISOString(),
    updatedAt: new Date(Date.now() - 28800000).toISOString(),
  },
];

const SEED_BUZZ_COMMENTS: Record<string, any[]> = {
  buzz_featured_today: [
    {
      id: 'comm_feat_1',
      postId: 'buzz_featured_today',
      authorId: 'usr_seed_2',
      authorName: 'Ananya S',
      authorAvatar: null,
      content: 'Wait @Rohit K is this about the lab projector catching fire?! 😂',
      parentId: null,
      mentions: ['Rohit K'],
      createdAt: new Date(Date.now() - 90000).toISOString(),
    },
    {
      id: 'comm_feat_2',
      postId: 'buzz_featured_today',
      authorId: 'usr_seed_3',
      authorName: 'Karthik B',
      authorAvatar: null,
      content: '@Ananya S no bro, HOD walked into the 3rd floor cafeteria right when the flash mob started 💀',
      parentId: 'comm_feat_1',
      mentions: ['Ananya S'],
      createdAt: new Date(Date.now() - 45000).toISOString(),
    },
    {
      id: 'comm_feat_3',
      postId: 'buzz_featured_today',
      authorId: 'usr_seed_4',
      authorName: 'Deepa M',
      authorAvatar: null,
      content: 'I have the full video on my phone, ask in direct chat before admin sees it 👀',
      parentId: null,
      mentions: [],
      createdAt: new Date(Date.now() - 20000).toISOString(),
    },
  ],
  buzz_confession_1: [
    {
      id: 'comm_conf_1',
      postId: 'buzz_confession_1',
      authorId: 'usr_seed_5',
      authorName: 'Green Dino 🦕',
      authorAvatar: null,
      content: "It's not the money, it's the power... and those tiny plastic houses 😂",
      parentId: null,
      mentions: [],
      createdAt: new Date(Date.now() - 10000000).toISOString(),
    },
    {
      id: 'comm_conf_2',
      postId: 'buzz_confession_1',
      authorId: 'usr_seed_6',
      authorName: 'Pink Starfish ⭐',
      authorAvatar: null,
      content: "I'm with you @Blue Gorilla. I bet I'd be different 💀",
      parentId: null,
      mentions: ['Blue Gorilla'],
      createdAt: new Date(Date.now() - 8000000).toISOString(),
    },
  ],
};

// In-memory cache for fast response times
let memoryCache: CloudData = {
  users: [],
  addas: [],
  conversations: [],
  messages: {},
  dailyChaos: {},
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
  buzzPosts: {
    default: SEED_BUZZ_POSTS,
  },
  buzzComments: SEED_BUZZ_COMMENTS,
  buzzBookmarks: {},
  buzzReports: [],
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
    // Keep cloud payload lightweight to ensure sub-500ms response time
    const syncPayload = {
      users: (data.users || []).slice(0, 100),
      addas: (data.addas || []).slice(0, 100),
      invitations: (data.invitations || []).slice(0, 100),
      conversations: (data.conversations || []).slice(0, 50),
    };

    await fetch(CLOUD_STORE_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'aadda_room_store',
        data: syncPayload,
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

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
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

  const rawUrl = req.headers?.['x-matched-path'] || req.url || '';
  const method = req.method || 'GET';
  let pathname = rawUrl.split('?')[0];

  if (pathname.startsWith('/api')) {
    pathname = pathname.substring(4);
  }

  // Fallback to query parameter when URL was rewritten to /api
  if (!pathname || pathname === '/' || pathname === '') {
    const qRoute = req.query?._route || req.query?.slug || req.query?.path;
    if (qRoute) {
      if (Array.isArray(qRoute)) {
        pathname = '/' + qRoute.join('/');
      } else {
        pathname = qRoute.startsWith('/') ? qRoute : '/' + qRoute;
      }
    } else if (rawUrl.includes('?')) {
      const searchParams = new URLSearchParams(rawUrl.split('?')[1]);
      const r = searchParams.get('_route') || searchParams.get('path') || searchParams.get('slug');
      if (r) {
        pathname = r.startsWith('/') ? r : '/' + r;
      }
    }
  }

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
    if (pathname === '/auth/check-email' && method === 'POST') {
      const email = (body.email || '').trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return json({ available: false, message: 'Please enter a valid email address' }, 400);
      }
      const existing = store.users.find(
        (u) => u.email && u.email.toLowerCase() === email && u.isEmailVerified !== false,
      );
      if (existing) {
        return json({ available: false, message: 'This email is already registered. Please sign in instead.' });
      }
      return json({ available: true, message: 'Email is available' });
    }

    if (pathname === '/auth/check-username' && method === 'POST') {
      const username = (body.username || '').trim().toLowerCase();
      if (!username || username.length < 3 || username.length > 20) {
        return json({ available: false, message: 'Username must be 3-20 characters long' }, 400);
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return json({ available: false, message: 'Username can only contain letters, numbers, and underscores' }, 400);
      }
      const existing = store.users.find(
        (u) => u.username && u.username.toLowerCase() === username,
      );
      if (existing) {
        return json({ available: false, message: 'Username is already taken' });
      }
      return json({ available: true, message: 'Username is available' });
    }

    if (pathname === '/auth/register' && method === 'POST') {
      const email = (body.email || '').trim().toLowerCase();
      const username = (body.username || '').trim().toLowerCase();
      const displayName = (body.displayName || body.username || email.split('@')[0]).trim();
      const state = (body.state || 'Karnataka').trim();
      const district = (body.district || 'Bengaluru Urban').trim();
      const password = body.password || '';

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return json({ message: 'Valid email is required' }, 400);
      }
      if (!username || username.length < 3) {
        return json({ message: 'Username must be at least 3 characters' }, 400);
      }

      // Check existing email
      const existingEmail = store.users.find(
        (u) => u.email && u.email.toLowerCase() === email && u.isEmailVerified !== false,
      );
      if (existingEmail) {
        return json({ message: 'This email is already registered. Please sign in.' }, 400);
      }

      // Check existing username
      const existingUsername = store.users.find(
        (u) => u.username && u.username.toLowerCase() === username && u.id !== existingEmail?.id,
      );
      if (existingUsername) {
        return json({ message: 'Username is already taken' }, 400);
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

      await saveToCloud(store);

      return json({
        success: true,
        message: 'Account created! Please verify your email.',
        email: user.email,
        verificationCode,
      });
    }

    if (pathname === '/auth/verify-email' && method === 'POST') {
      const email = (body.email || '').trim().toLowerCase();
      const code = (body.code || '').trim();

      const user = store.users.find((u) => u.email && u.email.toLowerCase() === email);
      if (!user) {
        return json({ message: 'User account not found' }, 404);
      }

      if (!user.verificationCode || user.verificationCode !== code) {
        return json({ message: 'Invalid verification code. Please check and try again.' }, 400);
      }

      if (user.verificationExpires && new Date(user.verificationExpires).getTime() < Date.now()) {
        return json({ message: 'Verification code has expired. Please request a new one.' }, 400);
      }

      user.isEmailVerified = true;
      delete user.verificationCode;
      delete user.verificationExpires;

      await saveToCloud(store);

      const safeUser = { ...user };
      delete safeUser.passwordHash;
      delete safeUser.salt;

      return json({
        success: true,
        user: safeUser,
        tokens: {
          accessToken: `token_${user.id}`,
          refreshToken: `ref_${user.id}`,
        },
      });
    }

    if (pathname === '/auth/resend-code' && method === 'POST') {
      const email = (body.email || '').trim().toLowerCase();
      const user = store.users.find((u) => u.email && u.email.toLowerCase() === email);
      if (!user) {
        return json({ message: 'User account not found' }, 404);
      }

      const code = generateVerificationCode();
      user.verificationCode = code;
      user.verificationExpires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      await saveToCloud(store);

      return json({
        success: true,
        message: 'Verification code resent successfully',
        verificationCode: code,
      });
    }

    if (pathname === '/auth/login' && method === 'POST') {
      const login = (body.login || '').trim().toLowerCase();
      const password = body.password || '';

      let user = store.users.find(
        (u) => (u.email && u.email.toLowerCase() === login) || (u.username && u.username.toLowerCase() === login),
      );

      if (!user) {
        // Direct instant login fallback if no password provided (backward compatibility)
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
          await saveToCloud(store);
        } else {
          return json({ message: 'Account not found. Please register.' }, 404);
        }
      }

      // Check password if account has one set
      if (user.passwordHash && user.salt && password) {
        const hash = hashPassword(password, user.salt);
        const bufHash = Buffer.from(hash, 'hex');
        const bufStored = Buffer.from(user.passwordHash, 'hex');
        if (bufHash.length !== bufStored.length || !crypto.timingSafeEqual(bufHash, bufStored)) {
          return json({ message: 'Incorrect password. Please try again.' }, 401);
        }
      }

      // Check email verification status
      if (user.isEmailVerified === false) {
        return json({
          requiresVerification: true,
          email: user.email,
          verificationCode: user.verificationCode,
          message: 'Please verify your email address to continue.',
        }, 403);
      }

      const safeUser = { ...user };
      delete safeUser.passwordHash;
      delete safeUser.salt;

      return json({
        user: safeUser,
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
      if (user) {
        const safeUser = { ...user };
        delete safeUser.passwordHash;
        delete safeUser.salt;
        return json(safeUser);
      }
      return json(null);
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

      // Check case-insensitive against store.addas and store.invitations with prefix flexibility
      const cleanNoPrefix = rawCode.replace(/^ADDA-?/, '');
      const variants = [rawCode, cleanNoPrefix, `ADDA-${cleanNoPrefix}`];

      let targetAdda = store.addas.find(
        (a) => a.inviteCode && variants.includes(a.inviteCode.toUpperCase()),
      );

      if (!targetAdda) {
        const inv = store.invitations.find((i) => i.code && variants.includes(i.code.toUpperCase()));
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
    // DAILY CHAOS FULL PRODUCTION CRUD & REAL STATS
    // -------------------------------------------------------------
    if (pathname === '/chaos' || pathname.startsWith('/chaos/')) {
      if (!store.dailyChaos) {
        store.dailyChaos = {};
      }

      // Helper to identify user from header or query or body
      const authHeader = req.headers.authorization || '';
      const token = authHeader.replace('Bearer ', '').trim();
      const queryParams = new URL(req.url || '', 'http://localhost').searchParams;
      const currentUserId =
        token.replace('token_', '') ||
        queryParams.get('userId') ||
        body.userId ||
        store.users[0]?.id ||
        'usr_default';

      if (!store.dailyChaos[currentUserId]) {
        store.dailyChaos[currentUserId] = [];
      }

      // 1. LIST & FILTER CHAOS ENTRIES
      if (pathname === '/chaos' && method === 'GET') {
        let userItems = [...store.dailyChaos[currentUserId]];

        // Calculate REAL statistics across all user records before filtering
        const stats = {
          total: userItems.length,
          pending: userItems.filter((i) => i.status === 'PENDING').length,
          inProgress: userItems.filter((i) => i.status === 'IN_PROGRESS').length,
          completed: userItems.filter((i) => i.status === 'COMPLETED').length,
        };

        // Filter by status
        const statusFilter = queryParams.get('status');
        if (statusFilter && statusFilter !== 'ALL') {
          userItems = userItems.filter((i) => i.status === statusFilter);
        }

        // Filter by priority
        const priorityFilter = queryParams.get('priority');
        if (priorityFilter && priorityFilter !== 'ALL') {
          userItems = userItems.filter((i) => i.priority === priorityFilter);
        }

        // Filter by category
        const categoryFilter = queryParams.get('category');
        if (categoryFilter && categoryFilter !== 'ALL') {
          userItems = userItems.filter((i) => i.category === categoryFilter);
        }

        // Filter by date
        const dateFilter = queryParams.get('date');
        if (dateFilter) {
          userItems = userItems.filter((i) => i.date === dateFilter);
        }

        // Search in title, description, and tags
        const searchQuery = queryParams.get('search');
        if (searchQuery) {
          const q = searchQuery.toLowerCase().trim();
          userItems = userItems.filter(
            (i) =>
              i.title?.toLowerCase().includes(q) ||
              i.description?.toLowerCase().includes(q) ||
              i.tags?.some((t: string) => t.toLowerCase().includes(q)),
          );
        }

        // Sort: newest first
        userItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return json({ items: userItems, stats });
      }

      // 2. CREATE CHAOS ENTRY
      if (pathname === '/chaos' && method === 'POST') {
        const title = (body.title || '').trim();
        if (!title) {
          return json({ message: 'Title is required' }, 400);
        }

        const newChaosItem = {
          id: `chaos_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId: currentUserId,
          title,
          description: (body.description || '').trim(),
          date: body.date || new Date().toISOString().split('T')[0],
          deadline: body.deadline || '',
          priority: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(body.priority)
            ? body.priority
            : 'MEDIUM',
          category: (body.category || 'General').trim(),
          tags: Array.isArray(body.tags) ? body.tags : [],
          status: ['PENDING', 'IN_PROGRESS', 'COMPLETED'].includes(body.status)
            ? body.status
            : 'PENDING',
          completedAt: body.status === 'COMPLETED' ? new Date().toISOString() : null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        store.dailyChaos[currentUserId].unshift(newChaosItem);
        await saveToCloud(store);
        return json(newChaosItem, 201);
      }

      // 3. UPDATE / TOGGLE CHAOS ENTRY
      if (pathname.startsWith('/chaos/') && method === 'PATCH') {
        const chaosId = pathname.replace('/chaos/', '').split('?')[0];
        const userItems = store.dailyChaos[currentUserId];
        const itemIndex = userItems.findIndex((i) => i.id === chaosId);

        if (itemIndex === -1) {
          return json({ message: 'Chaos entry not found' }, 404);
        }

        const existing = userItems[itemIndex];
        const nextStatus = body.status !== undefined ? body.status : existing.status;
        const isNowCompleted = nextStatus === 'COMPLETED';

        const updated = {
          ...existing,
          title: body.title !== undefined ? body.title.trim() : existing.title,
          description: body.description !== undefined ? body.description.trim() : existing.description,
          date: body.date !== undefined ? body.date : existing.date,
          deadline: body.deadline !== undefined ? body.deadline : existing.deadline,
          priority: body.priority !== undefined ? body.priority : existing.priority,
          category: body.category !== undefined ? body.category : existing.category,
          tags: body.tags !== undefined ? (Array.isArray(body.tags) ? body.tags : existing.tags) : existing.tags,
          status: nextStatus,
          completedAt: isNowCompleted ? (existing.completedAt || new Date().toISOString()) : null,
          updatedAt: new Date().toISOString(),
        };

        userItems[itemIndex] = updated;
        await saveToCloud(store);
        return json(updated);
      }

      // 4. DELETE CHAOS ENTRY
      if (pathname.startsWith('/chaos/') && method === 'DELETE') {
        const chaosId = pathname.replace('/chaos/', '').split('?')[0];
        const userItems = store.dailyChaos[currentUserId];
        const itemIndex = userItems.findIndex((i) => i.id === chaosId);

        if (itemIndex === -1) {
          return json({ message: 'Chaos entry not found' }, 404);
        }

        userItems.splice(itemIndex, 1);
        await saveToCloud(store);
        return json({ success: true, id: chaosId });
      }
    }

    // -------------------------------------------------------------
    // ADDA BUZZ FULL PRODUCTION REST API & REAL ENGAGEMENT
    // -------------------------------------------------------------
    if (pathname === '/buzz' || pathname.startsWith('/buzz/')) {
      if (!store.buzzPosts) store.buzzPosts = {};
      if (!store.buzzComments) store.buzzComments = {};
      if (!store.buzzBookmarks) store.buzzBookmarks = {};
      if (!store.buzzReports) store.buzzReports = [];

      // Identify current user
      const authHeader = req.headers.authorization || '';
      const token = authHeader.replace('Bearer ', '').trim();
      const queryParams = new URL(req.url || '', 'http://localhost').searchParams;
      const currentUserId =
        token.replace('token_', '') ||
        queryParams.get('userId') ||
        body.userId ||
        store.users[0]?.id ||
        'usr_default';
      const currentUser = store.users.find((u) => u.id === currentUserId) || {
        id: currentUserId,
        displayName: 'Circle Member',
        username: 'circle_member',
      };

      // 1. GET /buzz - FEED, TRENDING, SAVED FILTERING
      if (pathname === '/buzz' && method === 'GET') {
        const rawAddaId = queryParams.get('addaId');
        const category = queryParams.get('category') || 'ALL';
        const filter = queryParams.get('filter') || 'all'; // 'all' | 'trending' | 'saved'

        const targetAddaId = rawAddaId || store.addas[0]?.id || 'default';

        // Initialize posts for this adda if not present
        if (!store.buzzPosts[targetAddaId] || store.buzzPosts[targetAddaId].length === 0) {
          const addaName = store.addas.find((a) => a.id === targetAddaId)?.name || 'Circle Adda';
          store.buzzPosts[targetAddaId] = SEED_BUZZ_POSTS.map((p) => ({
            ...p,
            addaId: targetAddaId,
            addaName,
          }));
        }

        let posts = [...(store.buzzPosts[targetAddaId] || [])];

        // Filter out expired posts
        const now = Date.now();
        posts = posts.filter((p) => {
          if (p.expiresAt) {
            return new Date(p.expiresAt).getTime() > now;
          }
          return true;
        });

        // Filter by category
        if (category && category !== 'ALL') {
          posts = posts.filter((p) => p.category === category);
        }

        // Filter by saved if requested
        const userSaved = store.buzzBookmarks[currentUserId] || [];
        if (filter === 'saved') {
          posts = posts.filter((p) => userSaved.includes(p.id));
        }

        // Calculate engagement score & enrich posts
        const userBookmarksSet = new Set(userSaved);
        const enriched = posts.map((p) => {
          const totalReactions: number = Object.values(p.reactions || {}).reduce(
            (sum: number, count: any) => sum + (Number(count) || 0),
            0,
          ) as number;
          const hoursOld = Math.max(1, (now - new Date(p.createdAt).getTime()) / 3600000);
          const score: number =
            Number((totalReactions * 2 + (Number(p.commentsCount) || 0) * 3 + (Number(p.bookmarksCount) || 0) * 1.5)) /
            Math.pow(hoursOld + 2, 1.2);

          const userReactions = p.reactionsByUser?.[currentUserId] || [];
          const isAnon = Boolean(p.isAnonymous);

          return {
            ...p,
            authorId: isAnon ? 'anonymous_masked' : p.authorId,
            authorAvatar: isAnon ? null : p.authorAvatar,
            authorName: isAnon
              ? (p.authorName?.includes('Gorilla') || p.authorName?.includes('Dino') || p.authorName?.includes('Starfish')
                  ? p.authorName
                  : 'Anonymous Member 🤫')
              : p.authorName,
            engagementScore: Number(score.toFixed(2)),
            isBookmarked: userBookmarksSet.has(p.id),
            userReactions,
          };
        });

        if (filter === 'trending') {
          enriched.sort((a, b) => (b.engagementScore || 0) - (a.engagementScore || 0));
        } else {
          // Chronological default
          enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        // Mark top 3 as trending
        enriched.forEach((p, idx) => {
          p.isTrending = idx < 3 && (p.engagementScore || 0) > 2;
        });

        return json(enriched);
      }

      // 2. POST /buzz - CREATE NEW POST WITH SAFETY & MODERATION
      if (pathname === '/buzz' && method === 'POST') {
        const {
          addaId,
          category = 'SPILL_THE_TEA',
          credibility = 'PERSONAL_EXPERIENCE',
          expiry = 'PERMANENT',
          isAnonymous = false,
          anonymousPersona,
          title,
          content,
          mediaUrl,
          mediaType,
          linkUrl,
          pollOptions,
        } = body;

        if (!content || !content.trim()) {
          return json({ message: 'Post content is required' }, 400);
        }

        // Anti-Doxxing & Spam Filter: detect phone numbers or forbidden terms
        const phoneRegex = /\b[6-9]\d{9}\b/;
        if (phoneRegex.test(content) || (title && phoneRegex.test(title))) {
          return json(
            { message: 'Sharing private phone numbers or personal contact info is strictly prohibited in Adda Buzz.' },
            400,
          );
        }

        const targetAddaId = addaId || store.addas[0]?.id || 'default';
        const targetAdda = store.addas.find((a) => a.id === targetAddaId);

        // Expiry calculation
        let expiresAt: string | null = null;
        if (expiry === 'EXP_24H') {
          expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
        } else if (expiry === 'EXP_48H') {
          expiresAt = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
        }

        // Poll Options builder
        let formattedPollOptions: any[] | null = null;
        if (category === 'POLL_HOT_TAKE' && Array.isArray(pollOptions) && pollOptions.length >= 2) {
          formattedPollOptions = pollOptions.filter((o) => typeof o === 'string' && o.trim()).map((o, idx) => ({
            id: `opt_${Date.now()}_${idx}`,
            text: o.trim(),
            votesCount: 0,
            voterIds: [],
          }));
        }

        // Link Preview builder
        let linkPreview: any = null;
        if (linkUrl && typeof linkUrl === 'string' && linkUrl.startsWith('http')) {
          try {
            const urlObj = new URL(linkUrl);
            linkPreview = {
              url: linkUrl,
              title: (urlObj.hostname.replace('www.', '') + ' Article').toUpperCase(),
              description: `Shared link via ${urlObj.hostname}`,
              siteName: urlObj.hostname,
            };
          } catch {
            linkPreview = { url: linkUrl, siteName: 'External Link' };
          }
        }

        const newPost = {
          id: `buzz_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          addaId: targetAddaId,
          addaName: targetAdda?.name || 'Circle Adda',
          authorId: currentUserId,
          authorName: isAnonymous ? (anonymousPersona || 'Anonymous Member') : currentUser.displayName || currentUser.username,
          authorAvatar: isAnonymous ? null : currentUser.avatarUrl || null,
          isAnonymous: Boolean(isAnonymous),
          category,
          credibility,
          expiry,
          expiresAt,
          title: title ? title.trim() : null,
          content: content.trim(),
          mediaUrl: mediaUrl || null,
          mediaType: mediaType || null,
          linkPreview,
          pollOptions: formattedPollOptions,
          reactions: {},
          reactionsByUser: {},
          userReactions: [],
          commentsCount: 0,
          bookmarksCount: 0,
          isBookmarked: false,
          isTrending: false,
          engagementScore: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (!store.buzzPosts[targetAddaId]) {
          store.buzzPosts[targetAddaId] = [];
        }

        store.buzzPosts[targetAddaId].unshift(newPost);
        await saveToCloud(store);
        return json(newPost, 201);
      }

      // 3. DELETE /buzz/:id
      if (pathname.startsWith('/buzz/') && method === 'DELETE') {
        const postId = pathname.replace('/buzz/', '').split('?')[0];

        let found = false;
        for (const addaKey of Object.keys(store.buzzPosts)) {
          const list = store.buzzPosts[addaKey];
          const idx = list.findIndex((p) => p.id === postId);
          if (idx !== -1) {
            list.splice(idx, 1);
            found = true;
            break;
          }
        }

        if (found) {
          await saveToCloud(store);
          return json({ success: true, id: postId });
        }
        return json({ message: 'Buzz post not found' }, 404);
      }

      // 4. POST /buzz/:id/react - TOGGLE REACTION (😂, 👀, 🍿, ☕, 🔥, 💀, ❤️)
      if (pathname.startsWith('/buzz/') && pathname.endsWith('/react') && method === 'POST') {
        const postId = pathname.replace('/buzz/', '').replace('/react', '').split('?')[0];
        const emoji = body.emoji;
        const validEmojis = ['😂', '👀', '🍿', '☕', '🔥', '💀', '❤️'];

        if (!emoji || !validEmojis.includes(emoji)) {
          return json({ message: 'Invalid reaction emoji' }, 400);
        }

        let targetPost: any = null;
        for (const addaKey of Object.keys(store.buzzPosts)) {
          const p = store.buzzPosts[addaKey].find((x: any) => x.id === postId);
          if (p) {
            targetPost = p;
            break;
          }
        }

        if (!targetPost) {
          return json({ message: 'Buzz post not found' }, 404);
        }

        if (!targetPost.reactions) targetPost.reactions = {};
        if (!targetPost.reactionsByUser) targetPost.reactionsByUser = {};
        if (!targetPost.reactionsByUser[currentUserId]) {
          targetPost.reactionsByUser[currentUserId] = [];
        }

        const userReactions: string[] = targetPost.reactionsByUser[currentUserId];
        const hasReacted = userReactions.includes(emoji);

        if (hasReacted) {
          // Toggle off
          targetPost.reactionsByUser[currentUserId] = userReactions.filter((e) => e !== emoji);
          targetPost.reactions[emoji] = Math.max(0, (targetPost.reactions[emoji] || 1) - 1);
          if (targetPost.reactions[emoji] === 0) {
            delete targetPost.reactions[emoji];
          }
        } else {
          // Toggle on
          userReactions.push(emoji);
          targetPost.reactions[emoji] = (targetPost.reactions[emoji] || 0) + 1;
        }

        await saveToCloud(store);
        return json({
          reactions: targetPost.reactions,
          userReactions: targetPost.reactionsByUser[currentUserId],
        });
      }

      // 5. COMMENTS: GET /buzz/:id/comments & POST /buzz/:id/comments
      if (pathname.startsWith('/buzz/') && pathname.endsWith('/comments')) {
        const postId = pathname.replace('/buzz/', '').replace('/comments', '').split('?')[0];

        if (method === 'GET') {
          const comments = store.buzzComments[postId] || [];
          return json(comments);
        }

        if (method === 'POST') {
          const { content, parentId } = body;
          if (!content || !content.trim()) {
            return json({ message: 'Comment content is required' }, 400);
          }

          // Extract mentions (@username)
          const mentions = (content.match(/@([a-zA-Z0-9_]+)/g) || []).map((m: string) => m.substring(1));

          const newComment = {
            id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            postId,
            authorId: currentUserId,
            authorName: currentUser.displayName || currentUser.username,
            authorAvatar: currentUser.avatarUrl || null,
            content: content.trim(),
            parentId: parentId || null,
            mentions,
            createdAt: new Date().toISOString(),
          };

          if (!store.buzzComments[postId]) {
            store.buzzComments[postId] = [];
          }
          store.buzzComments[postId].push(newComment);

          // Update comment count on post
          for (const addaKey of Object.keys(store.buzzPosts)) {
            const p = store.buzzPosts[addaKey].find((x: any) => x.id === postId);
            if (p) {
              p.commentsCount = (p.commentsCount || 0) + 1;
              break;
            }
          }

          await saveToCloud(store);
          return json(newComment, 201);
        }
      }

      // 6. POST /buzz/:id/vote - POLL VOTING
      if (pathname.startsWith('/buzz/') && pathname.endsWith('/vote') && method === 'POST') {
        const postId = pathname.replace('/buzz/', '').replace('/vote', '').split('?')[0];
        const { optionId } = body;

        let targetPost: any = null;
        for (const addaKey of Object.keys(store.buzzPosts)) {
          const p = store.buzzPosts[addaKey].find((x: any) => x.id === postId);
          if (p) {
            targetPost = p;
            break;
          }
        }

        if (!targetPost || !targetPost.pollOptions) {
          return json({ message: 'Poll not found on this post' }, 404);
        }

        // Remove vote from previous option if any
        targetPost.pollOptions.forEach((opt: any) => {
          if (!opt.voterIds) opt.voterIds = [];
          opt.voterIds = opt.voterIds.filter((uid: string) => uid !== currentUserId);
        });

        // Add vote to chosen option
        const targetOption = targetPost.pollOptions.find((opt: any) => opt.id === optionId);
        if (targetOption) {
          targetOption.voterIds.push(currentUserId);
        }

        // Recalculate counts
        targetPost.pollOptions.forEach((opt: any) => {
          opt.votesCount = opt.voterIds.length;
        });

        await saveToCloud(store);
        return json({ pollOptions: targetPost.pollOptions });
      }

      // 7. POST /buzz/:id/bookmark - SAVE / BOOKMARK TOGGLE
      if (pathname.startsWith('/buzz/') && pathname.endsWith('/bookmark') && method === 'POST') {
        const postId = pathname.replace('/buzz/', '').replace('/bookmark', '').split('?')[0];

        if (!store.buzzBookmarks[currentUserId]) {
          store.buzzBookmarks[currentUserId] = [];
        }

        const bookmarks: string[] = store.buzzBookmarks[currentUserId];
        const isBookmarked = bookmarks.includes(postId);

        let targetPost: any = null;
        for (const addaKey of Object.keys(store.buzzPosts)) {
          const p = store.buzzPosts[addaKey].find((x: any) => x.id === postId);
          if (p) {
            targetPost = p;
            break;
          }
        }

        if (isBookmarked) {
          store.buzzBookmarks[currentUserId] = bookmarks.filter((id) => id !== postId);
          if (targetPost) {
            targetPost.bookmarksCount = Math.max(0, (targetPost.bookmarksCount || 1) - 1);
          }
        } else {
          bookmarks.push(postId);
          if (targetPost) {
            targetPost.bookmarksCount = (targetPost.bookmarksCount || 0) + 1;
          }
        }

        await saveToCloud(store);
        return json({
          isBookmarked: !isBookmarked,
          bookmarksCount: targetPost?.bookmarksCount || 0,
        });
      }

      // 8. POST /buzz/:id/report - REPORT INAPPROPRIATE CONTENT
      if (pathname.startsWith('/buzz/') && pathname.endsWith('/report') && method === 'POST') {
        const postId = pathname.replace('/buzz/', '').replace('/report', '').split('?')[0];
        const { reason, details } = body;

        store.buzzReports.push({
          id: `rep_${Date.now()}`,
          postId,
          reporterId: currentUserId,
          reason: reason || 'Inappropriate content',
          details: details || '',
          createdAt: new Date().toISOString(),
        });

        await saveToCloud(store);
        return json({
          success: true,
          message: 'Report submitted. Circle moderators have been notified.',
        });
      }
    }

    if (pathname.startsWith('/vibe')) {
      return json([]);
    }

    // Default 404 for unknown routes
    return json({ message: `API route not found: ${pathname}` }, 404);
  } catch (err: any) {
    console.error('API Error:', err);
    return json({ message: err.message || 'Internal Server Error' }, 500);
  }
}

