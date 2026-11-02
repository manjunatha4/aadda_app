import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  RefreshControl,
  Dimensions,
  Linking,
} from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/stores/authStore';
import { storage } from '../../src/services/storage';
import {
  MainLayout,
  GlassCard,
  PrimaryButton,
  SecondaryButton,
  ToastNotification,
  ConfirmationDialog,
  DS_TOKENS,
  DS_FONTS,
} from '../../src/components/DesignSystem';

const SCREEN_WIDTH = Dimensions.get('window').width;

export type NewsCategoryId = 'ALL' | 'INDIA' | 'OORU' | 'CAMPUS' | 'TECH';

export interface PhotoNewsPost {
  id: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  verified: boolean;
  timeAgo: string;
  categoryId: NewsCategoryId;
  category: string;
  categoryIcon: string;
  categoryColor: string;
  title: string;
  details: string;
  photoUrl: string;
  sourceName: string;
  sourceUrl?: string;
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  comments?: Array<{ id: string; user: string; text: string; time: string }>;
}

export interface CircleGossipPost {
  id: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  isAnonymous: boolean;
  timeAgo: string;
  title: string;
  details: string;
  photoUrl: string;
  likesCount: number;
  isLiked?: boolean;
  reactions: Record<string, number>;
  userReactions: string[];
  commentsCount: number;
  comments: Array<{ id: string; user: string; text: string; time: string }>;
  isCircleOnly: true;
}

const PRESET_NEWS_PHOTOS = [
  {
    label: 'Lake Pier Sunset 🌅',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Lush Forest 🌲',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Sunset Ocean 🌄',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Tech Campus 🏙️',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'College Fest 🎓',
    url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Campus Canteen ☕',
    url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80',
  },
];

const PRESET_GOSSIP_PHOTOS = [
  {
    label: 'Campus Canteen ☕',
    url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Library Corner 📚',
    url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Evening Adda Hangout 🌆',
    url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Nandi Hills Sunrise 🌄',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Tech Corridor Food Street 🍜',
    url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Campus Fest Stage 🎸',
    url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
  },
];

const REAL_NEWS_CATEGORIES: Array<{ id: NewsCategoryId; labelEn: string; labelKn: string; icon: string }> = [
  { id: 'ALL', labelEn: 'All News 🌟', labelKn: 'ಎಲ್ಲಾ ಸುದ್ದಿ 🌟', icon: '🌟' },
  { id: 'INDIA', labelEn: 'Latest Indian News 🇮🇳', labelKn: 'ಭಾರತೀಯ ಮುಖ್ಯ ಸುದ್ದಿ 🇮🇳', icon: '🇮🇳' },
  { id: 'OORU', labelEn: 'Ooru City News 🏙️', labelKn: 'ನಮ್ಮ ಊರು ಸುದ್ದಿ 🏙️', icon: '🏙️' },
  { id: 'CAMPUS', labelEn: 'Campus Desk 🎓', labelKn: 'ಕಾಲೇಜು & ಪರೀಕ್ಷೆ 🎓', icon: '🎓' },
  { id: 'TECH', labelEn: 'Tech & Startups 💻', labelKn: 'ಟೆಕ್ & ಸ್ಟಾರ್ಟಪ್ 💻', icon: '💻' },
];

const DEFAULT_INDIA_NEWS: PhotoNewsPost[] = [
  {
    id: 'in_news_1',
    authorName: 'NDTV India',
    authorHandle: '@ndtvindia · National Wire',
    authorAvatar: '🇮🇳',
    verified: true,
    timeAgo: '1h ago',
    categoryId: 'INDIA',
    category: 'LATEST INDIAN NEWS',
    categoryIcon: '🇮🇳',
    categoryColor: '#E11D48',
    title: 'GGSIPU Gives Final Chance To Students To Complete Pending Degrees',
    details: 'The university is providing a one-time special relaxation to graduate and postgraduate students to complete their pending degrees. Forms open till November 6.',
    photoUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
    sourceName: 'NDTV India',
    sourceUrl: 'https://www.ndtv.com/education',
    likesCount: 64,
    commentsCount: 12,
    isLiked: false,
    isBookmarked: false,
    comments: [{ id: 'c1', user: 'Adarsh K.', text: 'Super helpful for our batchmates!', time: '30m ago' }],
  },
  {
    id: 'in_news_2',
    authorName: 'Times of India',
    authorHandle: '@timesofindia · National Desk',
    authorAvatar: '🇮🇳',
    verified: true,
    timeAgo: '3h ago',
    categoryId: 'INDIA',
    category: 'LATEST INDIAN NEWS',
    categoryIcon: '🇮🇳',
    categoryColor: '#E11D48',
    title: 'Indian Space Tech: ISRO Completes Critical Testing For Next Exploration Phase',
    details: 'ISRO mission scientists successfully conclude high-thrust engine trials as preparations accelerate for upcoming planetary and human spaceflight milestones.',
    photoUrl: 'https://images.unsplash.com/photo-1517976487502-53a56cf9e334?auto=format&fit=crop&w=1200&q=80',
    sourceName: 'Times of India',
    sourceUrl: 'https://timesofindia.indiatimes.com/india',
    likesCount: 142,
    commentsCount: 29,
    isLiked: false,
    isBookmarked: false,
    comments: [],
  },
];

const DEFAULT_OORU_NEWS: PhotoNewsPost[] = [
  {
    id: 'ooru_news_1',
    authorName: 'Times of India',
    authorHandle: '@timesofindia · Bengaluru Desk',
    authorAvatar: '🏙️',
    verified: true,
    timeAgo: '2h ago',
    categoryId: 'OORU',
    category: 'OORU CITY NEWS',
    categoryIcon: '🏙️',
    categoryColor: '#2563EB',
    title: 'Bengaluru Metro Purple & Yellow Line Interchange Accelerates Commutes',
    details: 'BMRCL reports significant ridership growth as feeder electric buses and expanded parking stations go live across East & South tech corridors.',
    photoUrl: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1200&q=80',
    sourceName: 'Times of India Bengaluru',
    sourceUrl: 'https://timesofindia.indiatimes.com/city/bengaluru',
    likesCount: 89,
    commentsCount: 19,
    isLiked: false,
    isBookmarked: false,
    comments: [],
  },
  {
    id: 'ooru_news_2',
    authorName: 'Karnataka Civic Wire',
    authorHandle: '@karupdates · Urban Bureau',
    authorAvatar: '🏙️',
    verified: true,
    timeAgo: '4h ago',
    categoryId: 'OORU',
    category: 'OORU CITY NEWS',
    categoryIcon: '🏙️',
    categoryColor: '#2563EB',
    title: 'BBMP Initiates White-Topping On Key Tech Corridors Ahead Of Monsoon Review',
    details: 'Key link roads connecting Outer Ring Road, Silk Board, and Bellandur undergo rapid resurfacing to reduce commute delays.',
    photoUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    sourceName: 'Bengaluru Civic Bulletin',
    sourceUrl: 'https://karnataka.gov.in',
    likesCount: 78,
    commentsCount: 14,
    isLiked: false,
    isBookmarked: false,
    comments: [],
  },
];

const DEFAULT_CAMPUS_NEWS: PhotoNewsPost[] = [
  {
    id: 'campus_news_1',
    authorName: 'Karnataka Desk',
    authorHandle: '@karupdates · Verified Wire',
    authorAvatar: '🎓',
    verified: true,
    timeAgo: '3h ago',
    categoryId: 'CAMPUS',
    category: 'CAMPUS DESK',
    categoryIcon: '🎓',
    categoryColor: '#7C3AED',
    title: 'Karnataka State Hackathon & Tech Innovation Summit 2026 Announced',
    details: 'Over 120 engineering colleges across Karnataka to participate in AI and regional problem-solving hackathons with funding grants for top 10 finalists.',
    photoUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
    sourceName: 'Karnataka Tech Bureau',
    sourceUrl: 'https://karnataka.gov.in',
    likesCount: 112,
    commentsCount: 28,
    isLiked: false,
    isBookmarked: false,
    comments: [],
  },
  {
    id: 'campus_news_2',
    authorName: 'Times Education Desk',
    authorHandle: '@toieducation · National Wire',
    authorAvatar: '🎓',
    verified: true,
    timeAgo: '5h ago',
    categoryId: 'CAMPUS',
    category: 'CAMPUS DESK',
    categoryIcon: '🎓',
    categoryColor: '#7C3AED',
    title: 'NEET PG Counselling & Seat Allotment Schedule Released: Direct Link Active',
    details: 'Candidates can now check the allotment round guidelines, document verification schedule, and college reporting timeline directly on the portal.',
    photoUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80',
    sourceName: 'Education Times',
    sourceUrl: 'https://timesofindia.indiatimes.com/education',
    likesCount: 95,
    commentsCount: 22,
    isLiked: false,
    isBookmarked: false,
    comments: [],
  },
];

const DEFAULT_TECH_NEWS: PhotoNewsPost[] = [
  {
    id: 'tech_news_1',
    authorName: 'Gadgets360 Tech',
    authorHandle: '@gadgets360 · Innovation Desk',
    authorAvatar: '💻',
    verified: true,
    timeAgo: '2h ago',
    categoryId: 'TECH',
    category: 'TECH & STARTUPS',
    categoryIcon: '💻',
    categoryColor: '#059669',
    title: 'Bengaluru AI Startup Ecosystem Secures $140M In Q3 2026 Funding Surge',
    details: 'Domestic generative AI models, semiconductor packaging, and enterprise SaaS startups drive the latest investment momentum in the tech capital.',
    photoUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    sourceName: 'Gadgets360 Tech',
    sourceUrl: 'https://gadgets360.com',
    likesCount: 134,
    commentsCount: 31,
    isLiked: false,
    isBookmarked: false,
    comments: [],
  },
  {
    id: 'tech_news_2',
    authorName: 'Tech Wire Karnataka',
    authorHandle: '@techkar · Startup Corridor',
    authorAvatar: '💻',
    verified: true,
    timeAgo: '4h ago',
    categoryId: 'TECH',
    category: 'TECH & STARTUPS',
    categoryIcon: '💻',
    categoryColor: '#059669',
    title: 'India UPI Global Network Expands Across 12 Countries With Real-Time Settlement',
    details: 'Students and travellers can now make seamless instant payments directly using domestic UPI apps in major travel hubs worldwide.',
    photoUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80',
    sourceName: 'National Payments Bulletin',
    sourceUrl: 'https://gadgets360.com',
    likesCount: 156,
    commentsCount: 39,
    isLiked: false,
    isBookmarked: false,
    comments: [],
  },
];

const DEFAULT_FRIENDS_GOSSIP: CircleGossipPost[] = [
  {
    id: 'gossip_1',
    authorId: 'usr_pooja',
    authorName: 'Pooja Hegde',
    authorHandle: '@pooja_h · Adda Circle',
    authorAvatar: '☕',
    isAnonymous: false,
    timeAgo: '15m ago',
    title: 'Canteen Samosa Price Hike Controversy! 🥟👀',
    details: 'Management just quietly bumped samosa from ₹15 to ₹20! Half the CS gang is currently staging a diplomatic protest by refusing to buy chai until chutney quantity is doubled. Who approved this inflation?! 😂',
    photoUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80',
    likesCount: 28,
    isLiked: true,
    reactions: { '😂': 24, '☕': 18, '👀': 15, '🤫': 9 },
    userReactions: ['😂'],
    commentsCount: 14,
    comments: [
      { id: 'gc1', user: 'Varun K.', text: 'Boycotting until benne dosa price is verified!', time: '10m ago' },
      { id: 'gc2', user: 'Sneha R.', text: 'The auntie gave me free extra chutney though lol', time: '5m ago' },
    ],
    isCircleOnly: true,
  },
  {
    id: 'gossip_2',
    authorId: 'usr_kiran',
    authorName: 'Kiran R.',
    authorHandle: '@kiran_r · Adda Circle',
    authorAvatar: '💃',
    isAnonymous: false,
    timeAgo: '1h ago',
    title: 'Caught 4th Year Seniors Practicing Secret Flashmob Behind Library! 🎶',
    details: 'Walked past the old botanical garden and caught the entire final year dance crew doing Kannada hook steps to Pushpa 2 and Kantara tracks. They swore me to secrecy but this will definitely win the fest trophy! 🏆',
    photoUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
    likesCount: 46,
    isLiked: false,
    reactions: { '🔥': 32, '🍿': 20, '👀': 19, '😂': 12 },
    userReactions: [],
    commentsCount: 8,
    comments: [
      { id: 'gc3', user: 'Rohit M.', text: 'Wait till they see our mechanical department routine!', time: '40m ago' },
    ],
    isCircleOnly: true,
  },
  {
    id: 'gossip_3',
    authorId: 'usr_anon_g',
    authorName: 'Anonymous Circle Friend',
    authorHandle: '@secret_member · Circle Friend Only',
    authorAvatar: '🕶️',
    isAnonymous: true,
    timeAgo: '2h ago',
    title: 'Prof Brought Actual Cake to 8 AM Monday Lecture! 🎂🎉',
    details: 'Everyone was dreading the surprise quiz in Microprocessors. Turns out today is Sir’s 50th birthday and he brought Iyengar bakery plum cake and piping hot filter coffee for the entire front three rows! Best Monday morning ever.',
    photoUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
    likesCount: 68,
    isLiked: false,
    reactions: { '❤️': 45, '☕': 30, '😂': 18, '🔥': 22 },
    userReactions: [],
    commentsCount: 19,
    comments: [],
    isCircleOnly: true,
  },
];

async function fetchRealNewsByCategory(
  categoryId: NewsCategoryId,
  url: string,
  sourceName: string,
  categoryLabel: string,
  categoryColor: string,
  categoryIcon: string,
): Promise<PhotoNewsPost[]> {
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === 'ok' && Array.isArray(data.items)) {
      return data.items.slice(0, 8).map((item: any, i: number) => {
        let photoUrl = item.enclosure?.link || item.thumbnail || '';
        if (!photoUrl || !photoUrl.startsWith('http')) {
          photoUrl = PRESET_NEWS_PHOTOS[i % PRESET_NEWS_PHOTOS.length].url;
        }

        let timeAgo = 'Today';
        if (item.pubDate) {
          const diffHours = Math.round((Date.now() - new Date(item.pubDate).getTime()) / (1000 * 60 * 60));
          if (diffHours <= 1) timeAgo = 'Just now';
          else if (diffHours < 24) timeAgo = `${diffHours}h ago`;
          else timeAgo = `${Math.round(diffHours / 24)}d ago`;
        }

        const cleanTitle = (item.title || '').replace(/<[^>]*>?/gm, '').trim();
        const cleanDetails = (item.description || item.content || item.title || '').replace(/<[^>]*>?/gm, '').trim();

        return {
          id: `news_${categoryId.toLowerCase()}_${Date.now()}_${i}`,
          authorName: sourceName,
          authorHandle: `@${sourceName.toLowerCase().replace(/[^a-z0-9]/g, '')} · Verified Desk`,
          authorAvatar: categoryIcon,
          verified: true,
          timeAgo,
          categoryId,
          category: categoryLabel,
          categoryIcon,
          categoryColor,
          title: cleanTitle,
          details: cleanDetails || cleanTitle,
          photoUrl,
          sourceName,
          sourceUrl: item.link,
          likesCount: 35 + i * 7,
          commentsCount: 3 + (i % 5),
          isLiked: false,
          isBookmarked: false,
          comments: [],
        };
      });
    }
  } catch (e) {
    console.error(`Failed to fetch ${categoryId} news:`, e);
  }
  return [];
}

export default function RealNewsFeedScreen() {
  const router = useRouter();
  const { i18n } = useTranslation();
  const isKn = i18n.language === 'kn';
  const { isAuthenticated, isLoading, user: currentUser } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 14, color: '#4F46E5', fontWeight: '800' }}>Loading News...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Sub-sections: 'real_news' (Verified Indian Wires) vs 'friends_gossip' (Circle Only 🔒)
  const [subSection, setSubSection] = useState<'real_news' | 'friends_gossip'>('real_news');

  // Real News State
  const [realNewsPosts, setRealNewsPosts] = useState<PhotoNewsPost[]>([
    ...DEFAULT_INDIA_NEWS,
    ...DEFAULT_OORU_NEWS,
    ...DEFAULT_CAMPUS_NEWS,
    ...DEFAULT_TECH_NEWS,
  ]);
  const [selectedCategory, setSelectedCategory] = useState<NewsCategoryId>('ALL');

  // Friends Gossip State (Circle Only 🔒)
  const [friendsGossipPosts, setFriendsGossipPosts] = useState<CircleGossipPost[]>(DEFAULT_FRIENDS_GOSSIP);

  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Author Profile Modal state
  const [selectedAuthor, setSelectedAuthor] = useState<{
    name: string;
    handle: string;
    avatar: string;
    verified: boolean;
    isCircleMember: boolean;
  } | null>(null);

  // Connected Users state
  const [connectedUsers, setConnectedUsers] = useState<Record<string, boolean>>({});

  // Share Real News Modal state
  const [createNewsModalVisible, setCreateNewsModalVisible] = useState(false);
  const [newsTitle, setNewsTitle] = useState('');
  const [newsDetails, setNewsDetails] = useState('');
  const [newsCategoryId, setNewsCategoryId] = useState<NewsCategoryId>('OORU');
  const [newsPhotoUrl, setNewsPhotoUrl] = useState(PRESET_NEWS_PHOTOS[0].url);
  const [newsSourceName, setNewsSourceName] = useState('');
  const [newsSourceUrl, setNewsSourceUrl] = useState('');

  // Share Friends Gossip Modal state (Circle Only 🔒)
  const [createGossipModalVisible, setCreateGossipModalVisible] = useState(false);
  const [gossipTitle, setGossipTitle] = useState('');
  const [gossipDetails, setGossipDetails] = useState('');
  const [gossipPhotoUrl, setGossipPhotoUrl] = useState(PRESET_GOSSIP_PHOTOS[0].url);
  const [gossipIsAnonymous, setGossipIsAnonymous] = useState(false);

  // Delete Confirm State
  const [deletingPost, setDeletingPost] = useState<{ id: string; type: 'news' | 'gossip' } | null>(null);

  // Comments Sheet state
  const [activeCommentsItem, setActiveCommentsItem] = useState<{
    id: string;
    type: 'news' | 'gossip';
    title: string;
    comments: Array<{ id: string; user: string; text: string; time: string }>;
  } | null>(null);
  const [commentInput, setCommentInput] = useState('');

  // Load Real News & Friends Gossip on mount
  const loadAllFeeds = async () => {
    try {
      // 1. Load Local Saved Real News
      let localNews: PhotoNewsPost[] = [];
      const storedNews = await storage.getItem('aadda_user_photo_news');
      if (storedNews) {
        const parsed = JSON.parse(storedNews);
        if (Array.isArray(parsed)) localNews = parsed;
      }

      // 2. Load Circle Friends Gossip
      let storedGossip: CircleGossipPost[] = [];
      const gossipRaw = await storage.getItem('aadda_circle_friends_gossip');
      if (gossipRaw) {
        const parsedGossip = JSON.parse(gossipRaw);
        if (Array.isArray(parsedGossip)) storedGossip = parsedGossip;
      }
      setFriendsGossipPosts(storedGossip.length > 0 ? storedGossip : DEFAULT_FRIENDS_GOSSIP);

      // 3. Fetch Distinct Real News Feeds in Parallel
      const [indiaArticles, ooruArticles, campusArticles, techArticles] = await Promise.all([
        fetchRealNewsByCategory(
          'INDIA',
          'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Ffeeds.feedburner.com%2Fndtvnews-india-news',
          'NDTV India',
          'LATEST INDIAN NEWS',
          '#E11D48',
          '🇮🇳',
        ),
        fetchRealNewsByCategory(
          'OORU',
          'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Ftimesofindia.indiatimes.com%2Frssfeeds%2F-2128833038.cms',
          'Times of India Bengaluru',
          'OORU CITY NEWS',
          '#2563EB',
          '🏙️',
        ),
        fetchRealNewsByCategory(
          'CAMPUS',
          'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Ftimesofindia.indiatimes.com%2Frssfeeds%2F913168846.cms',
          'Times Education Desk',
          'CAMPUS DESK',
          '#7C3AED',
          '🎓',
        ),
        fetchRealNewsByCategory(
          'TECH',
          'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Ffeeds.feedburner.com%2Fgadgets360-latest',
          'Gadgets360 Tech',
          'TECH & STARTUPS',
          '#059669',
          '💻',
        ),
      ]);

      const mergedNews: PhotoNewsPost[] = [
        ...localNews,
        ...(indiaArticles.length > 0 ? indiaArticles : DEFAULT_INDIA_NEWS),
        ...(ooruArticles.length > 0 ? ooruArticles : DEFAULT_OORU_NEWS),
        ...(campusArticles.length > 0 ? campusArticles : DEFAULT_CAMPUS_NEWS),
        ...(techArticles.length > 0 ? techArticles : DEFAULT_TECH_NEWS),
      ];

      setRealNewsPosts(mergedNews);
    } catch (e) {
      console.error('Error loading feeds:', e);
      setRealNewsPosts([
        ...DEFAULT_INDIA_NEWS,
        ...DEFAULT_OORU_NEWS,
        ...DEFAULT_CAMPUS_NEWS,
        ...DEFAULT_TECH_NEWS,
      ]);
    }
  };

  useEffect(() => {
    loadAllFeeds();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllFeeds();
    setRefreshing(false);
    showToast(isKn ? 'ಫೀಡ್ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ ✨' : 'Feeds refreshed successfully ✨');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handlePickFromGallery = (setter: (url: string) => void) => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          if (file.size > 10 * 1024 * 1024) {
            showToast(isKn ? 'ಚಿತ್ರದ ಗಾತ್ರ 10MB ಗಿಂತ ಕಡಿಮೆಯಿರಬೇಕು' : 'Image size must be under 10MB');
            return;
          }
          const reader = new FileReader();
          reader.onload = (readerEvt) => {
            const dataUrl = readerEvt.target?.result as string;
            if (dataUrl) {
              setter(dataUrl);
              showToast(isKn ? 'ಗ್ಯಾಲರಿಯಿಂದ ಫೋಟೋ ಸೇರಿಸಲಾಗಿದೆ! 📸' : 'Photo picked from device gallery! 📸');
            }
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      showToast(isKn ? 'ಗ್ಯಾಲರಿ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಲಭ್ಯವಿದೆ' : 'Gallery picker ready');
    }
  };

  // -------------------------------------------------------------
  // REAL NEWS ACTIONS
  // -------------------------------------------------------------
  const handlePublishRealNews = async () => {
    if (!newsTitle.trim()) {
      showToast(isKn ? 'ದಯವಿಟ್ಟು ಶೀರ್ಷಿಕೆ ನಮೂದಿಸಿ' : 'Please enter news headline');
      return;
    }
    if (!newsDetails.trim()) {
      showToast(isKn ? 'ದಯವಿಟ್ಟು ಸುದ್ದಿ ವಿವರಗಳನ್ನು ನಮೂದಿಸಿ' : 'Please enter news details');
      return;
    }

    const catMeta = REAL_NEWS_CATEGORIES.find((c) => c.id === newsCategoryId) || REAL_NEWS_CATEGORIES[1];
    const newPost: PhotoNewsPost = {
      id: `news_user_${Date.now()}`,
      authorName: currentUser?.displayName || currentUser?.username || 'Circle Reporter',
      authorHandle: `@${currentUser?.username || 'member'} · Circle News Desk`,
      authorAvatar: '📸',
      verified: true,
      timeAgo: 'Just now',
      categoryId: newsCategoryId,
      category: catMeta.labelEn.toUpperCase(),
      categoryIcon: catMeta.icon,
      categoryColor: '#4F46E5',
      title: newsTitle.trim(),
      details: newsDetails.trim(),
      photoUrl: newsPhotoUrl || PRESET_NEWS_PHOTOS[0].url,
      sourceName: newsSourceName.trim() || 'Circle Verified Post',
      sourceUrl: newsSourceUrl.trim() || undefined,
      likesCount: 1,
      commentsCount: 0,
      isLiked: true,
      comments: [],
    };

    const nextNews = [newPost, ...realNewsPosts];
    setRealNewsPosts(nextNews);

    try {
      const userOnly = nextNews.filter((p) => p.id.startsWith('news_user_'));
      await storage.setItem('aadda_user_photo_news', JSON.stringify(userOnly));
    } catch (e) {
      console.error(e);
    }

    setCreateNewsModalVisible(false);
    setNewsTitle('');
    setNewsDetails('');
    setNewsSourceName('');
    setNewsSourceUrl('');
    showToast(isKn ? 'ನೈಜ ಸುದ್ದಿ ಪ್ರಕಟಿಸಲಾಗಿದೆ! 🚀' : 'Real News published! 🚀');
  };

  const handleToggleNewsLike = (postId: string) => {
    setRealNewsPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const isLiked = !p.isLiked;
        return {
          ...p,
          isLiked,
          likesCount: isLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1),
        };
      }),
    );
  };

  const handleToggleNewsBookmark = (postId: string) => {
    setRealNewsPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const isBookmarked = !p.isBookmarked;
        showToast(
          isBookmarked
            ? isKn
              ? 'ಸುದ್ದಿ ಉಳಿಸಲಾಗಿದೆ! 🔖'
              : 'Article saved to bookmarks! 🔖'
            : isKn
            ? 'ಬುಕ್‌ಮಾರ್ಕ್‌ನಿಂದ ತೆಗೆದುಹಾಕಲಾಗಿದೆ'
            : 'Removed from bookmarks',
        );
        return { ...p, isBookmarked };
      }),
    );
  };

  // -------------------------------------------------------------
  // FRIENDS GOSSIP ACTIONS (Circle Only 🔒)
  // -------------------------------------------------------------
  const handlePublishGossip = async () => {
    if (!gossipTitle.trim()) {
      showToast(isKn ? 'ದಯವಿಟ್ಟು ಹರಟೆ ಶೀರ್ಷಿಕೆ ನಮೂದಿಸಿ' : 'Please enter gossip title');
      return;
    }
    if (!gossipDetails.trim()) {
      showToast(isKn ? 'ದಯವಿಟ್ಟು ವಿವರಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಿ' : 'Please share what happened');
      return;
    }

    const newGossip: CircleGossipPost = {
      id: `gossip_${Date.now()}`,
      authorId: currentUser?.id || 'usr_me',
      authorName: gossipIsAnonymous
        ? isKn
          ? 'ಅನಾಮಿಕ ವೃತ್ತ ಗೆಳೆಯ'
          : 'Anonymous Circle Friend'
        : currentUser?.displayName || currentUser?.username || 'You',
      authorHandle: gossipIsAnonymous ? '@secret_friend · Circle Only 🔒' : `@${currentUser?.username || 'member'} · Adda Circle 🔒`,
      authorAvatar: gossipIsAnonymous ? '🕶️' : '🤫',
      isAnonymous: gossipIsAnonymous,
      timeAgo: 'Just now',
      title: gossipTitle.trim(),
      details: gossipDetails.trim(),
      photoUrl: gossipPhotoUrl || PRESET_GOSSIP_PHOTOS[0].url,
      likesCount: 1,
      isLiked: true,
      reactions: { '🤫': 1 },
      userReactions: ['🤫'],
      commentsCount: 0,
      comments: [],
      isCircleOnly: true,
    };

    const nextGossip = [newGossip, ...friendsGossipPosts];
    setFriendsGossipPosts(nextGossip);

    try {
      await storage.setItem('aadda_circle_friends_gossip', JSON.stringify(nextGossip));
    } catch (e) {
      console.error(e);
    }

    setCreateGossipModalVisible(false);
    setGossipTitle('');
    setGossipDetails('');
    setGossipIsAnonymous(false);
    showToast(isKn ? 'ಗೆಳೆಯರ ಹರಟೆ ವೃತ್ತಕ್ಕೆ ಹಂಚಲಾಗಿದೆ! 🤫🔒' : 'Friends gossip shared with circle friends only! 🤫🔒');
  };

  const handleToggleGossipReaction = (postId: string, emoji: string) => {
    setFriendsGossipPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const userReactions = [...(post.userReactions || [])];
        const reactions = { ...(post.reactions || {}) };
        const hasReacted = userReactions.includes(emoji);

        if (hasReacted) {
          const nextReactions = userReactions.filter((e) => e !== emoji);
          const count = Math.max(0, (reactions[emoji] || 1) - 1);
          if (count === 0) delete reactions[emoji];
          else reactions[emoji] = count;
          return { ...post, reactions, userReactions: nextReactions };
        } else {
          userReactions.push(emoji);
          reactions[emoji] = (reactions[emoji] || 0) + 1;
          return { ...post, reactions, userReactions };
        }
      }),
    );
  };

  // -------------------------------------------------------------
  // DELETE POST (For Author)
  // -------------------------------------------------------------
  const handleConfirmDelete = async () => {
    if (!deletingPost) return;
    const { id, type } = deletingPost;

    if (type === 'news') {
      const updated = realNewsPosts.filter((p) => p.id !== id);
      setRealNewsPosts(updated);
      try {
        const userOnly = updated.filter((p) => p.id.startsWith('news_user_'));
        await storage.setItem('aadda_user_photo_news', JSON.stringify(userOnly));
      } catch (e) {
        console.error(e);
      }
      showToast(isKn ? 'ಸುದ್ದಿ ಪೋಸ್ಟ್ ಅಳಿಸಲಾಗಿದೆ 🗑️' : 'News post deleted 🗑️');
    } else {
      const updated = friendsGossipPosts.filter((p) => p.id !== id);
      setFriendsGossipPosts(updated);
      try {
        await storage.setItem('aadda_circle_friends_gossip', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      showToast(isKn ? 'ಗೆಳೆಯರ ಹರಟೆ ಅಳಿಸಲಾಗಿದೆ 🗑️' : 'Friends gossip post deleted 🗑️');
    }

    setDeletingPost(null);
  };

  // -------------------------------------------------------------
  // COMMENT THREAD
  // -------------------------------------------------------------
  const handleAddComment = () => {
    if (!commentInput.trim() || !activeCommentsItem) return;
    const newComment = {
      id: `c_${Date.now()}`,
      user: currentUser?.displayName || currentUser?.username || 'You',
      text: commentInput.trim(),
      time: 'Just now',
    };

    if (activeCommentsItem.type === 'news') {
      setRealNewsPosts((prev) =>
        prev.map((p) => {
          if (p.id !== activeCommentsItem.id) return p;
          return {
            ...p,
            comments: [newComment, ...(p.comments || [])],
            commentsCount: p.commentsCount + 1,
          };
        }),
      );
    } else {
      setFriendsGossipPosts((prev) =>
        prev.map((p) => {
          if (p.id !== activeCommentsItem.id) return p;
          return {
            ...p,
            comments: [newComment, ...(p.comments || [])],
            commentsCount: p.commentsCount + 1,
          };
        }),
      );
    }

    setActiveCommentsItem((prev) =>
      prev
        ? {
            ...prev,
            comments: [newComment, ...prev.comments],
          }
        : null,
    );

    setCommentInput('');
    showToast(isKn ? 'ಕಾಮೆಂಟ್ ಸೇರಿಸಲಾಗಿದೆ 💬' : 'Comment added! 💬');
  };

  // Filtered Real News based on category selection
  const filteredRealNews =
    selectedCategory === 'ALL'
      ? realNewsPosts
      : realNewsPosts.filter((p) => p.categoryId === selectedCategory);

  return (
    <MainLayout
      scrollable={true}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={{ paddingBottom: 120 }}
    >
      <ToastNotification
        visible={Boolean(toastMessage)}
        message={toastMessage || ''}
        onDismiss={() => setToastMessage(null)}
      />

      {/* ------------------------------------------------------------- */}
      {/* 1. TOP HEADER (Responsive & Never Cut Off)                     */}
      {/* ------------------------------------------------------------- */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 8,
          marginBottom: 10,
          gap: 10,
        }}
      >
        {/* Title & Badge */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Text
              style={{
                fontSize: 22,
                fontWeight: '900',
                color: '#0F172A',
                letterSpacing: -0.5,
              }}
            >
              {isKn ? 'ಸುದ್ದಿ & ಹರಟೆ' : 'Photo News'}
            </Text>
            <View
              style={{
                backgroundColor: subSection === 'friends_gossip' ? '#FEF3C7' : '#EEF2FF',
                paddingHorizontal: 8,
                paddingVertical: 2.5,
                borderRadius: 9999,
                borderWidth: 1,
                borderColor: subSection === 'friends_gossip' ? '#FDE68A' : '#C7D2FE',
              }}
            >
              <Text
                style={{
                  color: subSection === 'friends_gossip' ? '#B45309' : '#4F46E5',
                  fontSize: 10,
                  fontWeight: '800',
                }}
              >
                {subSection === 'friends_gossip' ? '🔒 Circle Friends Only' : '🇮🇳 Verified Indian News'}
              </Text>
            </View>
          </View>
        </View>

        {/* Right Action: Share button */}
        <TouchableOpacity
          onPress={() => {
            if (subSection === 'friends_gossip') {
              setCreateGossipModalVisible(true);
            } else {
              setCreateNewsModalVisible(true);
            }
          }}
          activeOpacity={0.8}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 13,
            paddingVertical: 7,
            borderRadius: 9999,
            backgroundColor: subSection === 'friends_gossip' ? '#FDF2F8' : '#EEF2FF',
            borderWidth: 1.5,
            borderColor: subSection === 'friends_gossip' ? '#F472B6' : '#818CF8',
            flexShrink: 0,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <Text style={{ fontSize: 13 }}>{subSection === 'friends_gossip' ? '🤫' : '📸'}</Text>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '800',
              color: subSection === 'friends_gossip' ? '#DB2777' : '#4F46E5',
            }}
          >
            {subSection === 'friends_gossip'
              ? isKn
                ? '+ ಹರಟೆ'
                : '+ Gossip'
              : isKn
              ? '+ ಸುದ್ದಿ'
              : '+ News'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ------------------------------------------------------------- */}
      {/* 2. REPORTERS & CIRCLE STORIES BAR (Horizontal Avatar Row)     */}
      {/* ------------------------------------------------------------- */}
      <View style={{ marginBottom: 14 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingRight: 24, paddingLeft: 2 }}
        >
          {/* Quick Add Story Button */}
          <TouchableOpacity
            onPress={() => (subSection === 'friends_gossip' ? setCreateGossipModalVisible(true) : setCreateNewsModalVisible(true))}
            activeOpacity={0.75}
            style={{ alignItems: 'center', width: 62 }}
          >
            <View
              style={{
                width: 54,
                height: 54,
                borderRadius: 27,
                backgroundColor: '#EEF2FF',
                borderWidth: 2,
                borderColor: '#6366F1',
                borderStyle: 'dashed',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 20 }}>📸</Text>
            </View>
            <Text numberOfLines={1} style={{ fontSize: 10, fontWeight: '800', color: '#4F46E5', marginTop: 4 }}>
              {isKn ? 'ನಿಮ್ಮ ಸುದ್ದಿ' : 'Your Story'}
            </Text>
          </TouchableOpacity>

          {/* Active Circle Members / Reporters with Colorful Story Rings */}
          {(subSection === 'friends_gossip' ? friendsGossipPosts : realNewsPosts)
            .filter((p, index, self) => index === self.findIndex((t) => t.authorName === p.authorName))
            .map((rep) => (
              <TouchableOpacity
                key={rep.id}
                onPress={() => showToast(`Viewing updates from ${rep.authorName}`)}
                activeOpacity={0.75}
                style={{ alignItems: 'center', width: 62 }}
              >
                <View
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 27,
                    padding: 2.5,
                    backgroundColor: subSection === 'friends_gossip' ? '#F472B6' : '#818CF8',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <View
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: 24,
                      backgroundColor: '#FFFFFF',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>{rep.authorAvatar || '📸'}</Text>
                  </View>
                </View>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 10,
                    fontWeight: '700',
                    color: '#0F172A',
                    marginTop: 4,
                    textAlign: 'center',
                  }}
                >
                  {rep.authorName}
                </Text>
              </TouchableOpacity>
            ))}
        </ScrollView>
      </View>

        {/* ------------------------------------------------------------- */}
        {/* 2. SUB-SECTIONS SEGMENTED TAB SWITCHER                         */}
        {/*    (1) Real News  vs  (2) Friends Gossip (Circle Only 🔒)    */}
        {/* ------------------------------------------------------------- */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: '#F1F5F9',
            padding: 4,
            borderRadius: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#E2E8F0',
          }}
        >
          {/* Tab 1: Real News */}
          <TouchableOpacity
            onPress={() => setSubSection('real_news')}
            activeOpacity={0.8}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: subSection === 'real_news' ? '#FFFFFF' : 'transparent',
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: subSection === 'real_news' ? 2 : 0 },
              shadowOpacity: subSection === 'real_news' ? 0.08 : 0,
              shadowRadius: 4,
              elevation: subSection === 'real_news' ? 3 : 0,
            }}
          >
            <Text style={{ fontSize: 16 }}>📰</Text>
            <Text
              style={{
                fontSize: 13,
                fontWeight: subSection === 'real_news' ? '900' : '700',
                color: subSection === 'real_news' ? '#0F172A' : '#64748B',
              }}
            >
              {isKn ? 'ನೈಜ ಭಾರತೀಯ ಸುದ್ದಿ' : 'Real News'}
            </Text>
          </TouchableOpacity>

          {/* Tab 2: Friends Gossip News (Circle Friends Only 🔒) */}
          <TouchableOpacity
            onPress={() => setSubSection('friends_gossip')}
            activeOpacity={0.8}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: subSection === 'friends_gossip' ? '#FFFFFF' : 'transparent',
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: subSection === 'friends_gossip' ? 2 : 0 },
              shadowOpacity: subSection === 'friends_gossip' ? 0.08 : 0,
              shadowRadius: 4,
              elevation: subSection === 'friends_gossip' ? 3 : 0,
            }}
          >
            <Text style={{ fontSize: 16 }}>🤫</Text>
            <Text
              style={{
                fontSize: 13,
                fontWeight: subSection === 'friends_gossip' ? '900' : '700',
                color: subSection === 'friends_gossip' ? '#0F172A' : '#64748B',
              }}
            >
              {isKn ? 'ಗೆಳೆಯರ ಹರಟೆ' : 'Friends Gossip'}
            </Text>
            <View
              style={{
                backgroundColor: '#FEF3C7',
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 9999,
                borderWidth: 1,
                borderColor: '#FDE68A',
              }}
            >
              <Text style={{ fontSize: 9, fontWeight: '900', color: '#B45309' }}>🔒 Circle</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ============================================================= */}
        {/* SUB-SECTION 1: REAL NEWS 📰                                   */}
        {/* Distinct feeds: National, Ooru City, Campus Desk, Tech        */}
        {/* ============================================================= */}
        {subSection === 'real_news' && (
          <View>
            {/* Category Filter Pills (Distinct categories) */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingBottom: 14 }}
            >
              {REAL_NEWS_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setSelectedCategory(cat.id)}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 9999,
                      backgroundColor: isSelected ? '#4F46E5' : '#FFFFFF',
                      borderWidth: 1.5,
                      borderColor: isSelected ? '#4F46E5' : '#E2E8F0',
                      shadowColor: '#4F46E5',
                      shadowOffset: { width: 0, height: isSelected ? 2 : 0 },
                      shadowOpacity: isSelected ? 0.15 : 0,
                      shadowRadius: 4,
                      elevation: isSelected ? 2 : 0,
                    }}
                  >
                    <Text style={{ fontSize: 13 }}>{cat.icon}</Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: isSelected ? '800' : '600',
                        color: isSelected ? '#FFFFFF' : '#475569',
                      }}
                    >
                      {isKn ? cat.labelKn : cat.labelEn}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Real News Cards */}
            <View style={{ gap: 18 }}>
              {filteredRealNews.length === 0 ? (
                <GlassCard
                  style={{
                    borderRadius: 24,
                    padding: 32,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1.5,
                    borderColor: '#E2E8F0',
                  }}
                >
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>📰</Text>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }}>
                    {isKn ? 'ಈ ವಿಭಾಗದಲ್ಲಿ ಯಾವುದೇ ಸುದ್ದಿ ಇಲ್ಲ' : 'No news in this category'}
                  </Text>
                </GlassCard>
              ) : (
                filteredRealNews.map((post) => (
                  <GlassCard
                    key={post.id}
                    elevated
                    style={{
                      borderRadius: 24,
                      overflow: 'hidden',
                      padding: 16,
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2E8F0',
                    }}
                  >
                    {/* Header Row: Author & Category */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 12,
                      }}
                    >
                      <TouchableOpacity
                        onPress={() =>
                          setSelectedAuthor({
                            name: post.authorName,
                            handle: post.authorHandle,
                            avatar: post.authorAvatar,
                            verified: post.verified,
                            isCircleMember: false,
                          })
                        }
                        activeOpacity={0.75}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}
                      >
                        <View
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 21,
                            backgroundColor: '#F1F5F9',
                            borderWidth: 1.5,
                            borderColor: '#E2E8F0',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text style={{ fontSize: 20 }}>{post.authorAvatar}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                            <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>
                              {post.authorName}
                            </Text>
                            {post.verified && (
                              <View
                                style={{
                                  backgroundColor: '#E0F2FE',
                                  paddingHorizontal: 6,
                                  paddingVertical: 1,
                                  borderRadius: 9999,
                                }}
                              >
                                <Text style={{ fontSize: 10, fontWeight: '800', color: '#0284C7' }}>✓ Verified</Text>
                              </View>
                            )}
                          </View>
                          <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748B' }}>
                            {post.authorHandle} · {post.timeAgo}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {/* Delete for user-published posts */}
                        {post.id.startsWith('news_user_') && (
                          <TouchableOpacity
                            onPress={() => setDeletingPost({ id: post.id, type: 'news' })}
                            activeOpacity={0.75}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 4,
                              backgroundColor: '#FEF2F2',
                              borderWidth: 1,
                              borderColor: '#FECACA',
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 9999,
                            }}
                          >
                            <Text style={{ fontSize: 11 }}>🗑️</Text>
                            <Text style={{ fontSize: 10, fontWeight: '800', color: '#DC2626' }}>Delete</Text>
                          </TouchableOpacity>
                        )}

                        {/* Category Pill */}
                        <View
                          style={{
                            backgroundColor: '#F8FAFC',
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 9999,
                            borderWidth: 1,
                            borderColor: '#E2E8F0',
                          }}
                        >
                          <Text style={{ fontSize: 10, fontWeight: '800', color: post.categoryColor || '#4F46E5' }}>
                            {post.categoryIcon} {post.category}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* News Photo */}
                    <View
                      style={{
                        borderRadius: 18,
                        overflow: 'hidden',
                        marginBottom: 12,
                        backgroundColor: '#F8FAFC',
                        borderWidth: 1,
                        borderColor: '#E2E8F0',
                      }}
                    >
                      <Image
                        source={{ uri: post.photoUrl }}
                        style={{ width: '100%', height: 210 }}
                        resizeMode="cover"
                      />
                    </View>

                    {/* Action Bar */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingVertical: 6,
                        marginBottom: 8,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                        {/* Like */}
                        <TouchableOpacity
                          onPress={() => handleToggleNewsLike(post.id)}
                          activeOpacity={0.7}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
                        >
                          <Text style={{ fontSize: 18 }}>{post.isLiked ? '❤️' : '🤍'}</Text>
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: '700',
                              color: post.isLiked ? '#E11D48' : '#64748B',
                            }}
                          >
                            {post.likesCount}
                          </Text>
                        </TouchableOpacity>

                        {/* Comments */}
                        <TouchableOpacity
                          onPress={() =>
                            setActiveCommentsItem({
                              id: post.id,
                              type: 'news',
                              title: post.title,
                              comments: post.comments || [],
                            })
                          }
                          activeOpacity={0.7}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
                        >
                          <Text style={{ fontSize: 18 }}>💬</Text>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: '#64748B' }}>
                            {post.commentsCount}
                          </Text>
                        </TouchableOpacity>

                        {/* Bookmark */}
                        <TouchableOpacity
                          onPress={() => handleToggleNewsBookmark(post.id)}
                          activeOpacity={0.7}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
                        >
                          <Text style={{ fontSize: 18 }}>{post.isBookmarked ? '🔖' : '📑'}</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Source Link */}
                      {post.sourceUrl && (
                        <TouchableOpacity
                          onPress={() => {
                            if (Platform.OS === 'web' && post.sourceUrl) {
                              window.open(post.sourceUrl, '_blank');
                            } else if (post.sourceUrl) {
                              Linking.openURL(post.sourceUrl);
                            }
                          }}
                          activeOpacity={0.7}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 9999,
                            backgroundColor: '#F1F5F9',
                          }}
                        >
                          <Text style={{ fontSize: 10, fontWeight: '800', color: '#0284C7' }}>
                            🔗 {post.sourceName}
                          </Text>
                          <Text style={{ fontSize: 10, color: '#0284C7' }}>↗</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Headline & Details */}
                    <Text
                      style={{
                        fontFamily: DS_FONTS.heading,
                        fontSize: 16,
                        fontWeight: '900',
                        color: '#0F172A',
                        lineHeight: 22,
                        marginBottom: 6,
                      }}
                    >
                      {post.title}
                    </Text>
                    <Text
                      style={{
                        fontFamily: DS_FONTS.body,
                        fontSize: 13,
                        fontWeight: '500',
                        color: '#475569',
                        lineHeight: 19,
                      }}
                    >
                      {post.details}
                    </Text>
                  </GlassCard>
                ))
              )}
            </View>
          </View>
        )}

        {/* ============================================================= */}
        {/* SUB-SECTION 2: FRIENDS GOSSIP NEWS (Circle Friends Only 🔒)   */}
        {/* Sharing friends gossip with photos · Circle exclusive         */}
        {/* ============================================================= */}
        {subSection === 'friends_gossip' && (
          <View>
            {/* Privacy Guarantee Banner */}
            <View
              style={{
                backgroundColor: '#FEF3C7',
                borderRadius: 18,
                padding: 14,
                marginBottom: 16,
                borderWidth: 1.5,
                borderColor: '#FDE68A',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#F59E0B',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 20 }}>🔒</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '900', color: '#92400E' }}>
                  {isKn ? 'ಖಾಸಗಿ ವೃತ್ತ ಹರಟೆ · ಸ್ನೇಹಿತರಿಗೆ ಮಾತ್ರ' : 'Circle Friends Exclusive 🔒'}
                </Text>
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#B45309', marginTop: 2, lineHeight: 15 }}>
                  {isKn
                    ? 'ಇಲ್ಲಿ ಹಂಚಿಕೊಂಡ ಫೋಟೋಗಳು ಮತ್ತು ಹರಟೆ ನಿಮ್ಮ ಅಡ್ಡ ವೃತ್ತದ ಗೆಳೆಯರಿಗೆ ಮಾತ್ರ ಗೋಚರಿಸುತ್ತವೆ.'
                    : 'Photos and gossip shared here are private and visible ONLY to members of your Adda circle.'}
                </Text>
              </View>
            </View>

            {/* Quick Share Action Card */}
            <TouchableOpacity
              onPress={() => setCreateGossipModalVisible(true)}
              activeOpacity={0.85}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                padding: 16,
                marginBottom: 18,
                borderWidth: 1.5,
                borderColor: '#F472B6',
                borderStyle: 'dashed',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                shadowColor: '#DB2777',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 6,
                elevation: 2,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: '#FDF2F8',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 22 }}>🤫</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: '#0F172A' }}>
                    {isKn ? 'ಗೆಳೆಯರ ಹರಟೆ & ಫೋಟೋ ಹಂಚಿಕೊಳ್ಳಿ' : 'Share Friends Gossip with Photo'}
                  </Text>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#DB2777' }}>
                    🔒 {isKn ? 'ನಿಮ್ಮ ವೃತ್ತದವರಿಗೆ ಮಾತ್ರ ಲಭ್ಯ' : 'Visible to circle friends only'}
                  </Text>
                </View>
              </View>
              <View
                style={{
                  backgroundColor: '#DB2777',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 9999,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}>
                  {isKn ? '+ ಹಂಚಿ' : '+ Share'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Friends Gossip Cards List */}
            <View style={{ gap: 18 }}>
              {friendsGossipPosts.length === 0 ? (
                <GlassCard
                  style={{
                    borderRadius: 24,
                    padding: 32,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1.5,
                    borderColor: '#E2E8F0',
                  }}
                >
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>🤫</Text>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }}>
                    {isKn ? 'ಯಾವುದೇ ಗೆಳೆಯರ ಹರಟೆ ಇಲ್ಲ' : 'No circle gossip yet'}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 4 }}>
                    {isKn
                      ? 'ನಿಮ್ಮ ವೃತ್ತದ ಗೆಳೆಯರೊಂದಿಗೆ ಮೊದಲ ಫೋಟೋ ಮತ್ತು ಹರಟೆ ಹಂಚಿಕೊಳ್ಳಿ.'
                      : 'Be the first to share funny moments, candid photos, and spicy canteen tea with your circle.'}
                  </Text>
                </GlassCard>
              ) : (
                friendsGossipPosts.map((gossip) => {
                  const isAuthor =
                    gossip.authorId === (currentUser?.id || 'usr_me') ||
                    gossip.authorName === (currentUser?.displayName || currentUser?.username) ||
                    gossip.authorName === 'You';

                  return (
                    <GlassCard
                      key={gossip.id}
                      elevated
                      style={{
                        borderRadius: 24,
                        overflow: 'hidden',
                        padding: 16,
                        backgroundColor: '#FFFFFF',
                        borderColor: '#FBCFE8',
                        borderWidth: 1.5,
                      }}
                    >
                      {/* Gossip Author Header */}
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 12,
                        }}
                      >
                        <TouchableOpacity
                          onPress={() =>
                            setSelectedAuthor({
                              name: gossip.authorName,
                              handle: gossip.authorHandle,
                              avatar: gossip.authorAvatar,
                              verified: !gossip.isAnonymous,
                              isCircleMember: true,
                            })
                          }
                          activeOpacity={0.75}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}
                        >
                          <View
                            style={{
                              width: 42,
                              height: 42,
                              borderRadius: 21,
                              backgroundColor: gossip.isAnonymous ? '#F1F5F9' : '#FDF2F8',
                              borderWidth: 1.5,
                              borderColor: gossip.isAnonymous ? '#CBD5E1' : '#F472B6',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Text style={{ fontSize: 20 }}>{gossip.authorAvatar}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>
                                {gossip.authorName}
                              </Text>
                              <View
                                style={{
                                  backgroundColor: '#FEF3C7',
                                  paddingHorizontal: 6,
                                  paddingVertical: 1,
                                  borderRadius: 9999,
                                }}
                              >
                                <Text style={{ fontSize: 9, fontWeight: '900', color: '#B45309' }}>
                                  🔒 Circle Only
                                </Text>
                              </View>
                            </View>
                            <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748B' }}>
                              {gossip.authorHandle} · {gossip.timeAgo}
                            </Text>
                          </View>
                        </TouchableOpacity>

                        {/* Delete for Author */}
                        {isAuthor && (
                          <TouchableOpacity
                            onPress={() => setDeletingPost({ id: gossip.id, type: 'gossip' })}
                            activeOpacity={0.75}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 4,
                              backgroundColor: '#FEF2F2',
                              borderWidth: 1,
                              borderColor: '#FECACA',
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 9999,
                            }}
                          >
                            <Text style={{ fontSize: 11 }}>🗑️</Text>
                            <Text style={{ fontSize: 10, fontWeight: '800', color: '#DC2626' }}>Delete</Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* Gossip Attached Photo */}
                      <View
                        style={{
                          borderRadius: 18,
                          overflow: 'hidden',
                          marginBottom: 12,
                          backgroundColor: '#FDF2F8',
                          borderWidth: 1,
                          borderColor: '#FBCFE8',
                          position: 'relative',
                        }}
                      >
                        <Image
                          source={{ uri: gossip.photoUrl }}
                          style={{ width: '100%', height: 220 }}
                          resizeMode="cover"
                        />
                        <View
                          style={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            backgroundColor: 'rgba(15, 23, 42, 0.75)',
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Text style={{ fontSize: 10 }}>🔒</Text>
                          <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800' }}>
                            Circle Friends Only
                          </Text>
                        </View>
                      </View>

                      {/* Headline & Details */}
                      <Text
                        style={{
                          fontFamily: DS_FONTS.heading,
                          fontSize: 16,
                          fontWeight: '900',
                          color: '#0F172A',
                          lineHeight: 22,
                          marginBottom: 6,
                        }}
                      >
                        {gossip.title}
                      </Text>
                      <Text
                        style={{
                          fontFamily: DS_FONTS.body,
                          fontSize: 13,
                          fontWeight: '500',
                          color: '#475569',
                          lineHeight: 19,
                          marginBottom: 12,
                        }}
                      >
                        {gossip.details}
                      </Text>

                      {/* Interactive Gossip Reactions Bar */}
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderTopWidth: 1,
                          borderTopColor: '#F1F5F9',
                          paddingTop: 10,
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          {['🤫', '☕', '👀', '😂', '🔥'].map((emoji) => {
                            const count = gossip.reactions?.[emoji] || 0;
                            const hasReacted = gossip.userReactions?.includes(emoji);
                            return (
                              <TouchableOpacity
                                key={emoji}
                                onPress={() => handleToggleGossipReaction(gossip.id, emoji)}
                                activeOpacity={0.7}
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  gap: 4,
                                  backgroundColor: hasReacted ? '#FDF2F8' : '#F8FAFC',
                                  borderWidth: 1,
                                  borderColor: hasReacted ? '#F472B6' : '#E2E8F0',
                                  paddingHorizontal: 8,
                                  paddingVertical: 4,
                                  borderRadius: 9999,
                                }}
                              >
                                <Text style={{ fontSize: 14 }}>{emoji}</Text>
                                {count > 0 && (
                                  <Text
                                    style={{
                                      fontSize: 11,
                                      fontWeight: '800',
                                      color: hasReacted ? '#DB2777' : '#64748B',
                                    }}
                                  >
                                    {count}
                                  </Text>
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </View>

                        {/* Comments button */}
                        <TouchableOpacity
                          onPress={() =>
                            setActiveCommentsItem({
                              id: gossip.id,
                              type: 'gossip',
                              title: gossip.title,
                              comments: gossip.comments || [],
                            })
                          }
                          activeOpacity={0.7}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                        >
                          <Text style={{ fontSize: 16 }}>💬</Text>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B' }}>
                            {gossip.commentsCount}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </GlassCard>
                  );
                })
              )}
            </View>
          </View>
        )}

      {/* ------------------------------------------------------------- */}
      {/* 3. MODAL: SHARE REAL NEWS                                     */}
      {/* ------------------------------------------------------------- */}
      <Modal visible={createNewsModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.75)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 20,
              maxHeight: '90%',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A' }}>
                  {isKn ? 'ನೈಜ ಸುದ್ದಿ ಹಂಚಿಕೊಳ್ಳಿ 📸' : 'Share Real News 📸'}
                </Text>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B' }}>
                  {isKn ? 'ಸ್ಥಳೀಯ ಮತ್ತು ಕಾಲೇಜು ನೈಜ ಸುದ್ದಿ' : 'Verified regional & campus news updates'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setCreateNewsModalVisible(false)}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#94A3B8' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 20 }}>
              {/* Category Selection */}
              <View>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#0F172A', marginBottom: 6 }}>
                  1. {isKn ? 'ಸುದ್ದಿ ವಿಭಾಗ ಆಯ್ಕೆಮಾಡಿ *' : 'SELECT NEWS CATEGORY *'}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {REAL_NEWS_CATEGORIES.filter((c) => c.id !== 'ALL').map((c) => {
                    const isSelected = newsCategoryId === c.id;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        onPress={() => setNewsCategoryId(c.id)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 9999,
                          backgroundColor: isSelected ? '#4F46E5' : '#F1F5F9',
                        }}
                      >
                        <Text style={{ fontSize: 12 }}>{c.icon}</Text>
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: '800',
                            color: isSelected ? '#FFFFFF' : '#475569',
                          }}
                        >
                          {c.labelEn}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Photo Picker */}
              <View>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#0F172A', marginBottom: 6 }}>
                  2. {isKn ? 'ಫೋಟೋ ಆಯ್ಕೆಮಾಡಿ (ಗ್ಯಾಲರಿ ಅಥವಾ ಪ್ರಿಸೆಟ್)' : 'PICK NEWS PHOTO'}
                </Text>
                <TouchableOpacity
                  onPress={() => handlePickFromGallery(setNewsPhotoUrl)}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    backgroundColor: '#EEF2FF',
                    borderWidth: 1.5,
                    borderColor: '#6366F1',
                    borderStyle: 'dashed',
                    borderRadius: 16,
                    paddingVertical: 12,
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ fontSize: 18 }}>📁</Text>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#4F46E5' }}>
                    {isKn ? 'ಸಾಧನದ ಗ್ಯಾಲರಿಯಿಂದ ಆಯ್ಕೆಮಾಡಿ' : 'Choose Photo from Device Gallery'}
                  </Text>
                </TouchableOpacity>

                {newsPhotoUrl ? (
                  <View style={{ marginBottom: 10, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' }}>
                    <Image source={{ uri: newsPhotoUrl }} style={{ width: '100%', height: 140 }} resizeMode="cover" />
                  </View>
                ) : null}

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {PRESET_NEWS_PHOTOS.map((p) => (
                    <TouchableOpacity
                      key={p.url}
                      onPress={() => setNewsPhotoUrl(p.url)}
                      style={{
                        borderRadius: 12,
                        borderWidth: newsPhotoUrl === p.url ? 2 : 1,
                        borderColor: newsPhotoUrl === p.url ? '#4F46E5' : '#E2E8F0',
                        padding: 3,
                      }}
                    >
                      <Image source={{ uri: p.url }} style={{ width: 70, height: 46, borderRadius: 8 }} />
                      <Text style={{ fontSize: 9, fontWeight: '700', textAlign: 'center', marginTop: 2 }}>{p.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Headline */}
              <View>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#0F172A', marginBottom: 4 }}>
                  3. {isKn ? 'ಸುದ್ದಿ ಶೀರ್ಷಿಕೆ *' : 'NEWS HEADLINE *'}
                </Text>
                <TextInput
                  value={newsTitle}
                  onChangeText={setNewsTitle}
                  placeholder={isKn ? 'ಆಕರ್ಷಕ ಮುಖ್ಯಾಂಶ...' : 'Catchy news headline...'}
                  placeholderTextColor="#94A3B8"
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    fontSize: 14,
                    fontWeight: '700',
                    color: '#0F172A',
                  }}
                />
              </View>

              {/* Details */}
              <View>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#0F172A', marginBottom: 4 }}>
                  4. {isKn ? 'ಸುದ್ದಿ ವಿವರಗಳು *' : 'FULL STORY DETAILS *'}
                </Text>
                <TextInput
                  value={newsDetails}
                  onChangeText={setNewsDetails}
                  placeholder={isKn ? 'ಘಟನೆಯ ಸಂಪೂರ್ಣ ವಿವರಗಳನ್ನು ಬರೆಯಿರಿ...' : 'Provide complete context, venue, and impact...'}
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={3}
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    fontSize: 13,
                    color: '#0F172A',
                    minHeight: 70,
                  }}
                />
              </View>

              {/* Source Name */}
              <View>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#0F172A', marginBottom: 4 }}>
                  5. {isKn ? 'ಮೂಲ / ವೆಬ್‌ಸೈಟ್ (ಐಚ್ಛಿಕ)' : 'SOURCE / WEBSITE (OPTIONAL)'}
                </Text>
                <TextInput
                  value={newsSourceName}
                  onChangeText={setNewsSourceName}
                  placeholder="e.g. Deccan Herald, Times of India, VTU Circular"
                  placeholderTextColor="#94A3B8"
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    fontSize: 12,
                  }}
                />
              </View>

              <PrimaryButton
                title={isKn ? 'ಸುದ್ದಿ ಪ್ರಕಟಿಸಿ 🚀' : 'Publish Real News 🚀'}
                onPress={handlePublishRealNews}
                style={{ marginTop: 10 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* 4. MODAL: SHARE FRIENDS GOSSIP (Circle Only 🔒)               */}
      {/* ------------------------------------------------------------- */}
      <Modal visible={createGossipModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.75)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 20,
              maxHeight: '90%',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A' }}>
                    {isKn ? 'ಗೆಳೆಯರ ಹರಟೆ ಹಂಚಿಕೊಳ್ಳಿ 🤫' : 'Share Friends Gossip 🤫'}
                  </Text>
                  <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#B45309' }}>🔒 Circle Only</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#DB2777', marginTop: 2 }}>
                  {isKn ? 'ನಿಮ್ಮ ಅಡ್ಡ ವೃತ್ತದ ಗೆಳೆಯರಿಗೆ ಮಾತ್ರ ಕಾಣಿಸುತ್ತದೆ' : 'Accessible exclusively to your Adda circle friends'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setCreateGossipModalVisible(false)}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#94A3B8' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 20 }}>
              {/* Device Gallery Photo Picker */}
              <View>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#0F172A', marginBottom: 6 }}>
                  1. {isKn ? 'ಫೋಟೋ ಸೇರಿಸಿ (ಗ್ಯಾಲರಿ ಅಥವಾ ಪ್ರಿಸೆಟ್) *' : 'ATTACH GOSSIP PHOTO *'}
                </Text>

                <TouchableOpacity
                  onPress={() => handlePickFromGallery(setGossipPhotoUrl)}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    backgroundColor: '#FDF2F8',
                    borderWidth: 1.5,
                    borderColor: '#F472B6',
                    borderStyle: 'dashed',
                    borderRadius: 16,
                    paddingVertical: 12,
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ fontSize: 18 }}>📸</Text>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#DB2777' }}>
                    {isKn ? 'ಸಾಧನದ ಗ್ಯಾಲರಿಯಿಂದ ಫೋಟೋ ಆರಿಸಿ' : 'Choose Photo from Device Gallery'}
                  </Text>
                </TouchableOpacity>

                {gossipPhotoUrl ? (
                  <View style={{ marginBottom: 10, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#FBCFE8' }}>
                    <Image source={{ uri: gossipPhotoUrl }} style={{ width: '100%', height: 160 }} resizeMode="cover" />
                  </View>
                ) : null}

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {PRESET_GOSSIP_PHOTOS.map((p) => (
                    <TouchableOpacity
                      key={p.url}
                      onPress={() => setGossipPhotoUrl(p.url)}
                      style={{
                        borderRadius: 12,
                        borderWidth: gossipPhotoUrl === p.url ? 2 : 1,
                        borderColor: gossipPhotoUrl === p.url ? '#DB2777' : '#E2E8F0',
                        padding: 3,
                      }}
                    >
                      <Image source={{ uri: p.url }} style={{ width: 70, height: 46, borderRadius: 8 }} />
                      <Text style={{ fontSize: 9, fontWeight: '700', textAlign: 'center', marginTop: 2 }}>{p.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Title */}
              <View>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#0F172A', marginBottom: 4 }}>
                  2. {isKn ? 'ಹರಟೆ ಮುಖ್ಯಾಂಶ *' : 'GOSSIP HEADLINE *'}
                </Text>
                <TextInput
                  value={gossipTitle}
                  onChangeText={setGossipTitle}
                  placeholder={isKn ? 'ಏನಾಯ್ತು ಗುರು? ಆಕರ್ಷಕ ಶೀರ್ಷಿಕೆ...' : 'What is the tea? Catchy headline...'}
                  placeholderTextColor="#94A3B8"
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    fontSize: 14,
                    fontWeight: '700',
                    color: '#0F172A',
                  }}
                />
              </View>

              {/* Story */}
              <View>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#0F172A', marginBottom: 4 }}>
                  3. {isKn ? 'ಸಂಪೂರ್ಣ ಹರಟೆ ವಿವರ *' : 'SPILL THE DETAILS *'}
                </Text>
                <TextInput
                  value={gossipDetails}
                  onChangeText={setGossipDetails}
                  placeholder={isKn ? 'ಕ್ಯಾಂಟೀನ್, ಕಾಲೇಜು ಅಥವಾ ವೀಕೆಂಡ್ ಹರಟೆ ವಿವರಗಳನ್ನು ಬರೆಯಿರಿ...' : 'What happened, who was there, and the funny aftermath...'}
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={4}
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    fontSize: 13,
                    color: '#0F172A',
                    minHeight: 80,
                  }}
                />
              </View>

              {/* Anonymous Toggle */}
              <TouchableOpacity
                onPress={() => setGossipIsAnonymous(!gossipIsAnonymous)}
                activeOpacity={0.8}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  backgroundColor: gossipIsAnonymous ? '#FDF2F8' : '#F8FAFC',
                  padding: 12,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: gossipIsAnonymous ? '#F472B6' : '#E2E8F0',
                }}
              >
                <Text style={{ fontSize: 20 }}>{gossipIsAnonymous ? '🕶️' : '👤'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A' }}>
                    {gossipIsAnonymous
                      ? isKn
                        ? 'ಅನಾಮಿಕವಾಗಿ ಹಂಚಿಕೊಳ್ಳಿ'
                        : 'Posting Anonymously'
                      : isKn
                      ? 'ನಿಮ್ಮ ಪ್ರೊಫೈಲ್‌ನೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳಿ'
                      : 'Posting as ' + (currentUser?.displayName || currentUser?.username || 'You')}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#64748B' }}>
                    {gossipIsAnonymous
                      ? 'Your name and handle will be masked as @secret_friend.'
                      : 'Friends will see your username and profile badge.'}
                  </Text>
                </View>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: 2,
                    borderColor: gossipIsAnonymous ? '#DB2777' : '#94A3B8',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: gossipIsAnonymous ? '#DB2777' : 'transparent',
                  }}
                >
                  {gossipIsAnonymous && <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '900' }}>✓</Text>}
                </View>
              </TouchableOpacity>

              <PrimaryButton
                title={isKn ? 'ಹರಟೆ ಪ್ರಕಟಿಸಿ 🤫🚀' : 'Publish to Circle Friends 🤫🚀'}
                onPress={handlePublishGossip}
                style={{ marginTop: 10, backgroundColor: '#DB2777' }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* 5. MODAL: AUTHOR PROFILE CARD                                 */}
      {/* ------------------------------------------------------------- */}
      {selectedAuthor && (
        <Modal visible={Boolean(selectedAuthor)} transparent animationType="fade">
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 24,
            }}
          >
            <View
              style={{
                width: '100%',
                maxWidth: 360,
                backgroundColor: '#FFFFFF',
                borderRadius: 24,
                padding: 22,
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.18,
                shadowRadius: 20,
                elevation: 10,
              }}
            >
              {/* Avatar & Close */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: '#EEF2FF',
                    borderWidth: 2,
                    borderColor: '#C7D2FE',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 28 }}>{selectedAuthor.avatar}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedAuthor(null)} style={{ padding: 6 }}>
                  <Text style={{ fontSize: 20, color: '#94A3B8', fontWeight: '800' }}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Name & Handle */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A' }}>
                  {selectedAuthor.name}
                </Text>
                {selectedAuthor.verified && (
                  <View style={{ backgroundColor: '#E0F2FE', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 9999 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#0284C7' }}>✓ Verified</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748B', marginTop: 2 }}>
                {selectedAuthor.handle}
              </Text>

              {/* Bio */}
              <View style={{ backgroundColor: '#F8FAFC', borderRadius: 14, padding: 12, marginVertical: 14 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#4F46E5', textTransform: 'uppercase', marginBottom: 4 }}>
                  {selectedAuthor.isCircleMember ? 'Adda Circle Member' : 'News Desk Wire'}
                </Text>
                <Text style={{ fontSize: 13, color: '#334155', lineHeight: 18 }}>
                  {selectedAuthor.isCircleMember
                    ? 'Active member of your private Adda circle sharing genuine moments, canteen tea, and campus banter.'
                    : 'Verified wire desk covering policy, education, civic infrastructure, and tech developments in India.'}
                </Text>
              </View>

              {/* Connect Button */}
              <TouchableOpacity
                onPress={() => {
                  const key = selectedAuthor.name;
                  const next = !connectedUsers[key];
                  setConnectedUsers((prev) => ({ ...prev, [key]: next }));
                  showToast(next ? `Connected with ${selectedAuthor.name}! 🤝` : `Unfollowed ${selectedAuthor.name}`);
                  setSelectedAuthor(null);
                }}
                activeOpacity={0.8}
                style={{
                  backgroundColor: connectedUsers[selectedAuthor.name] ? '#F1F5F9' : '#4F46E5',
                  paddingVertical: 12,
                  borderRadius: 14,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '800',
                    color: connectedUsers[selectedAuthor.name] ? '#475569' : '#FFFFFF',
                  }}
                >
                  {connectedUsers[selectedAuthor.name] ? '✓ Connected' : '🤝 Connect'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. MODAL: COMMENTS SHEET                                      */}
      {/* ------------------------------------------------------------- */}
      {activeCommentsItem && (
        <Modal visible={Boolean(activeCommentsItem)} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.75)', justifyContent: 'flex-end' }}>
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                padding: 20,
                maxHeight: '75%',
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: '900', color: '#0F172A' }}>
                    💬 {activeCommentsItem.title}
                  </Text>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B' }}>
                    {activeCommentsItem.comments.length} {isKn ? 'ಕಾಮೆಂಟ್‌ಗಳು' : 'Comments'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setActiveCommentsItem(null)}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#94A3B8' }}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 280 }} contentContainerStyle={{ gap: 10, paddingVertical: 6 }}>
                {activeCommentsItem.comments.length === 0 ? (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, color: '#94A3B8' }}>
                      {isKn ? 'ಇನ್ನೂ ಯಾವುದೇ ಕಾಮೆಂಟ್‌ಗಳಿಲ್ಲ. ಮೊದಲಿಗರಾಗಿ!' : 'No comments yet. Be the first to comment!'}
                    </Text>
                  </View>
                ) : (
                  activeCommentsItem.comments.map((c) => (
                    <View key={c.id} style={{ backgroundColor: '#F8FAFC', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9' }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 12, fontWeight: '800', color: '#0F172A' }}>{c.user}</Text>
                        <Text style={{ fontSize: 10, color: '#94A3B8' }}>{c.time}</Text>
                      </View>
                      <Text style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{c.text}</Text>
                    </View>
                  ))
                )}
              </ScrollView>

              {/* Add Comment Input */}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
                <TextInput
                  value={commentInput}
                  onChangeText={setCommentInput}
                  placeholder={isKn ? 'ಕಾಮೆಂಟ್ ಬರೆಯಿರಿ...' : 'Add a circle comment...'}
                  placeholderTextColor="#94A3B8"
                  style={{
                    flex: 1,
                    backgroundColor: '#F8FAFC',
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    fontSize: 13,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                  }}
                />
                <TouchableOpacity
                  onPress={handleAddComment}
                  style={{
                    backgroundColor: '#4F46E5',
                    paddingHorizontal: 16,
                    borderRadius: 14,
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800' }}>
                    {isKn ? 'ಕಳುಹಿಸಿ' : 'Post'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 7. CONFIRMATION DIALOG: DELETE POST                           */}
      {/* ------------------------------------------------------------- */}
      <ConfirmationDialog
        visible={Boolean(deletingPost)}
        title={isKn ? 'ಪೋಸ್ಟ್ ಅಳಿಸಬೇಕೆ?' : 'Delete Post?'}
        message={
          isKn
            ? 'ಈ ಪೋಸ್ಟ್ ಅನ್ನು ನಿಮ್ಮ ವೃತ್ತದಿಂದ ಶಾಶ್ವತವಾಗಿ ತೆಗೆದುಹಾಕಲಾಗುತ್ತದೆ.'
            : 'Are you sure you want to permanently delete this post from the circle?'
        }
        confirmText={isKn ? 'ಅಳಿಸಿ' : 'Delete'}
        cancelText={isKn ? 'ರದ್ದು' : 'Cancel'}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingPost(null)}
        destructive
      />
    </MainLayout>
  );
}
