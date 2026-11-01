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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/stores/authStore';
import {
  MainLayout,
  GlassCard,
  PrimaryButton,
  SecondaryButton,
  ToastNotification,
  DS_TOKENS,
} from '../../src/components/DesignSystem';

const SCREEN_WIDTH = Dimensions.get('window').width;

export interface PhotoNewsPost {
  id: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  verified: boolean;
  timeAgo: string;
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
];

const INITIAL_NEWS_POSTS: PhotoNewsPost[] = [
  {
    id: 'news_1',
    authorName: 'Edward Morgan',
    authorHandle: '@edward · Ulsoor Eco-Park Bureau',
    authorAvatar: '📸',
    verified: true,
    timeAgo: '14m ago',
    category: 'OORU CITY NEWS',
    categoryIcon: '🏙️',
    categoryColor: '#0284C7',
    title: 'Sunset Boardwalk Opened at Ulsoor: New Eco-Corridor Opens To Morning Walkers',
    details:
      'BBMP and Lake Development Authority have officially completed the 1.8km eco-boardwalk around the eastern shoreline of Ulsoor Lake. Complete with solar lamp posts, bird-watching shelters, and cycling tracks. Open daily 5:30 AM to 9:30 AM.',
    photoUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    sourceName: 'deccanherald.com',
    sourceUrl: 'https://deccanherald.com',
    likesCount: 1240,
    commentsCount: 124,
    comments: [
      { id: 'c1', user: 'Rohit K', text: 'Visited today morning, the reflection on the water is stunning! 🌅', time: '10m ago' },
      { id: 'c2', user: 'Ananya S', text: 'Are cycles allowed on the lower deck as well?', time: '5m ago' },
    ],
  },
  {
    id: 'news_2',
    authorName: 'Deepa Rao',
    authorHandle: '@deepa · Western Ghats Desk',
    authorAvatar: '🌲',
    verified: true,
    timeAgo: '42m ago',
    category: 'NATURE & WEATHER',
    categoryIcon: '🌦️',
    categoryColor: '#15803D',
    title: 'Lush Green Western Ghats Rain Alert: Eco-Tourism Guidelines Released for Kodagu & Chikmagalur',
    details:
      'Karnataka Forest Department has updated eco-trekking guidelines for Kudremukha, Mullayanagiri, and Tadiandamol peaks. Advance digital passes are now required on weekends to protect sensitive forest biodiversity corridors.',
    photoUrl:
      'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
    sourceName: 'thehindu.com',
    sourceUrl: 'https://thehindu.com',
    likesCount: 842,
    commentsCount: 58,
    comments: [
      { id: 'c3', user: 'Karthik M', text: 'The greenery this season is unreal. Good initiative for passes.', time: '25m ago' },
    ],
  },
  {
    id: 'news_3',
    authorName: 'Suresh Patil',
    authorHandle: '@suresh · Coastal Highway Bureau',
    authorAvatar: '🌊',
    verified: true,
    timeAgo: '2h ago',
    category: 'COASTAL & TRANSIT',
    categoryIcon: '🏖️',
    categoryColor: '#D97706',
    title: 'Coastal Highway 4-Laning Near Karwar Enters Final Testing Phase',
    details:
      'The scenic coastal highway connecting Mangaluru, Udupi, and Karwar brings travel time down by 45 minutes with elevated scenic viewpoints overlooking the Arabian Sea sunset points.',
    photoUrl:
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    sourceName: 'bangaloremirror.com',
    sourceUrl: 'https://bangaloremirror.com',
    likesCount: 2430,
    commentsCount: 210,
    comments: [
      { id: 'c4', user: 'Pooja H', text: 'Road trip planned for next weekend! Best drive in South India.', time: '1h ago' },
    ],
  },
  {
    id: 'news_4',
    authorName: 'Karthik Murthy',
    authorHandle: '@karthik · Tech Radar Bureau',
    authorAvatar: '💻',
    verified: true,
    timeAgo: '3h ago',
    category: 'TECH & STARTUPS',
    categoryIcon: '🚀',
    categoryColor: '#7C3AED',
    title: 'Electronic City AI & Robotics Innovation Center Inaugurated',
    details:
      'A brand-new 50,000 sq ft research incubator opens for student startups, offering free high-speed compute clusters, hardware fabrication labs, and mentoring from Bengaluru industry founders.',
    photoUrl:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    sourceName: 'yourstory.com',
    sourceUrl: 'https://yourstory.com',
    likesCount: 950,
    commentsCount: 73,
    comments: [],
  },
  {
    id: 'news_5',
    authorName: 'Ananya Sharma',
    authorHandle: '@ananya · Campus Council Desk',
    authorAvatar: '🎓',
    verified: true,
    timeAgo: '5h ago',
    category: 'CAMPUS DESK',
    categoryIcon: '🎓',
    categoryColor: '#E11D48',
    title: 'VTU State-Level Hackathon 2026: Registrations Open with 5 Lakh Prize Pool',
    details:
      'Inter-collegiate 36-hour hackathon scheduled for November 14-16 at Campus Grounds. Top 10 teams receive direct interview fast-tracks with participating technology sponsors.',
    photoUrl:
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
    sourceName: 'campusbulletin.in',
    sourceUrl: 'https://campusbulletin.in',
    likesCount: 1820,
    commentsCount: 195,
    comments: [],
  },
];

const REPORTERS_STORIES = [
  { id: 'rep_1', name: 'Edward', avatar: '📸', role: 'Bangalore Photo' },
  { id: 'rep_2', name: 'Ananya S', avatar: '🎓', role: 'Campus Pulse' },
  { id: 'rep_3', name: 'Deepa R', avatar: '🌲', role: 'Nature Bureau' },
  { id: 'rep_4', name: 'Karthik', avatar: '💻', role: 'Tech Radar' },
  { id: 'rep_5', name: 'Suresh P', avatar: '🌊', role: 'Coastal Desk' },
  { id: 'rep_6', name: 'Pooja H', avatar: '🏙️', role: 'City Culture' },
];

const RECOMMENDED_FRIENDS = [
  { id: 'f1', name: 'Edward Morgan', handle: '@edward_m', avatar: '📸', role: 'Bangalore Beats', mutual: '14 mutual' },
  { id: 'f2', name: 'Sarah Connor', handle: '@sarah_c', avatar: '⚡', role: 'Campus Pulse', mutual: '9 mutual' },
  { id: 'f3', name: 'Alex Kumar', handle: '@alex_k', avatar: '💻', role: 'Tech Observer', mutual: '22 mutual' },
  { id: 'f4', name: 'Pooja Hegde', handle: '@pooja_h', avatar: '🌸', role: 'Ooru Culture', mutual: '18 mutual' },
  { id: 'f5', name: 'Naveen Gowda', handle: '@naveen_g', avatar: '🏃', role: 'Sports Desk', mutual: '7 mutual' },
];

const CATEGORIES = [
  'All News 🌟',
  'OORU CITY NEWS 🏙️',
  'NATURE & WEATHER 🌲',
  'CAMPUS DESK 🎓',
  'TECH & STARTUPS 💻',
  'COASTAL & TRANSIT 🏖️',
];

export default function RealNewsFeedScreen() {
  const router = useRouter();
  const { i18n } = useTranslation();
  const isKn = i18n.language === 'kn';
  const currentUser = useAuthStore((state) => state.user);

  const [posts, setPosts] = useState<PhotoNewsPost[]>(INITIAL_NEWS_POSTS);
  const [selectedCategory, setSelectedCategory] = useState('All News 🌟');
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Recommended connections state
  const [connectedUsers, setConnectedUsers] = useState<Record<string, boolean>>({});

  // Share News Modal state
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDetails, setFormDetails] = useState('');
  const [formCategory, setFormCategory] = useState('OORU CITY NEWS');
  const [formPhotoUrl, setFormPhotoUrl] = useState(PRESET_NEWS_PHOTOS[0].url);
  const [formSourceName, setFormSourceName] = useState('');
  const [formSourceUrl, setFormSourceUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Comments Sheet state
  const [activeCommentsPost, setActiveCommentsPost] = useState<PhotoNewsPost | null>(null);
  const [commentInput, setCommentInput] = useState('');

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      showToast(isKn ? 'ಫೀಡ್ ನವೀಕರಿಸಲಾಗಿದೆ ✨' : 'News feed refreshed ✨');
    }, 600);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleToggleLike = (postId: string) => {
    setPosts((prev) =>
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

  const handleToggleBookmark = (postId: string) => {
    setPosts((prev) =>
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

  const handleToggleConnect = (userId: string, name: string) => {
    setConnectedUsers((prev) => {
      const next = !prev[userId];
      showToast(
        next
          ? isKn
            ? `${name} ಅವರೊಂದಿಗೆ ಸಂಪರ್ಕಿಸಲಾಗಿದೆ! 🤝`
            : `Connected with ${name}! 🤝`
          : `Unfollowed ${name}`,
      );
      return { ...prev, [userId]: next };
    });
  };

  const handleAddComment = () => {
    if (!commentInput.trim() || !activeCommentsPost) return;
    const newComment = {
      id: `c_${Date.now()}`,
      user: currentUser?.displayName || currentUser?.username || 'You',
      text: commentInput.trim(),
      time: 'Just now',
    };

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== activeCommentsPost.id) return p;
        const comments = [newComment, ...(p.comments || [])];
        return {
          ...p,
          comments,
          commentsCount: p.commentsCount + 1,
        };
      }),
    );

    setActiveCommentsPost((prev) =>
      prev
        ? {
            ...prev,
            comments: [newComment, ...(prev.comments || [])],
            commentsCount: prev.commentsCount + 1,
          }
        : null,
    );

    setCommentInput('');
    showToast(isKn ? 'ಕಾಮೆಂಟ್ ಸೇರಿಸಲಾಗಿದೆ 💬' : 'Comment added! 💬');
  };

  const handlePublishNews = () => {
    if (!formTitle.trim()) {
      showToast(isKn ? 'ದಯವಿಟ್ಟು ಶೀರ್ಷಿಕೆ ನಮೂದಿಸಿ' : 'Please enter news headline');
      return;
    }
    if (!formDetails.trim()) {
      showToast(isKn ? 'ದಯವಿಟ್ಟು ಸುದ್ದಿ ವಿವರಗಳನ್ನು ನಮೂದಿಸಿ' : 'Please enter news details');
      return;
    }

    setSubmitting(true);
    const newPost: PhotoNewsPost = {
      id: `news_${Date.now()}`,
      authorName: currentUser?.displayName || currentUser?.username || 'Circle Reporter',
      authorHandle: `@${currentUser?.username || 'member'} · Circle News Desk`,
      authorAvatar: '📸',
      verified: true,
      timeAgo: 'Just now',
      category: formCategory,
      categoryIcon: '📰',
      categoryColor: '#6366F1',
      title: formTitle.trim(),
      details: formDetails.trim(),
      photoUrl: formPhotoUrl || PRESET_NEWS_PHOTOS[0].url,
      sourceName: formSourceName.trim() || 'Circle Verified Post',
      sourceUrl: formSourceUrl.trim() || undefined,
      likesCount: 1,
      commentsCount: 0,
      isLiked: true,
      comments: [],
    };

    setPosts([newPost, ...posts]);
    setSubmitting(false);
    setCreateModalVisible(false);
    setFormTitle('');
    setFormDetails('');
    setFormSourceName('');
    setFormSourceUrl('');
    showToast(isKn ? 'ಫೋಟೋ ಸುದ್ದಿ ಯಶಸ್ವಿಯಾಗಿ ಪ್ರಕಟಿಸಲಾಗಿದೆ! 🚀' : 'Photo News published to circle! 🚀');
  };

  const filteredPosts =
    selectedCategory === 'All News 🌟'
      ? posts
      : posts.filter((p) => selectedCategory.toLowerCase().includes(p.category.toLowerCase().split(' ')[0]));

  return (
    <MainLayout>
      <ToastNotification
        visible={Boolean(toastMessage)}
        message={toastMessage || ''}
        onDismiss={() => setToastMessage(null)}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* ------------------------------------------------------------- */}
        {/* 1. TOP HEADER (Dribbble Mockup: Menu, Large "Feed", User Avatar) */}
        {/* ------------------------------------------------------------- */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 10,
            marginBottom: 4,
          }}
        >
          {/* Menu Button */}
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/buzz' as any)}
            activeOpacity={0.75}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: '#FFFFFF',
              borderWidth: 1.5,
              borderColor: 'rgba(0, 0, 0, 0.08)',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <Text style={{ fontSize: 18, color: '#0F172A', fontWeight: '900' }}>☰</Text>
          </TouchableOpacity>

          {/* Share News Trigger Button */}
          <TouchableOpacity
            onPress={() => setCreateModalVisible(true)}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 9999,
              backgroundColor: '#EEF2FF',
              borderWidth: 1.5,
              borderColor: '#818CF8',
            }}
          >
            <Text style={{ fontSize: 14 }}>📷</Text>
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#4F46E5' }}>
              {isKn ? '+ ಸುದ್ದಿ ಹಂಚಿಕೊಳ್ಳಿ' : '+ Share News'}
            </Text>
          </TouchableOpacity>

          {/* User Profile Avatar */}
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile' as any)}
            activeOpacity={0.8}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: '#FFFFFF',
              borderWidth: 1.5,
              borderColor: '#E2E8F0',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <Text style={{ fontSize: 20 }}>👤</Text>
          </TouchableOpacity>
        </View>

        {/* Large "Feed" Title (Matching Dribbble Mockup) */}
        <Text
          style={{
            fontSize: 32,
            fontWeight: '900',
            color: '#0F172A',
            letterSpacing: -0.6,
            marginTop: 4,
          }}
        >
          {isKn ? 'ಸುದ್ದಿ ಫೀಡ್' : 'Feed'}
        </Text>
        <Text
          style={{
            fontSize: 12,
            fontWeight: '700',
            color: '#64748B',
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            marginBottom: 16,
          }}
        >
          {isKn ? 'ಸ್ಥಳೀಯ & ಕಾಲೇಜು ದೃಶ್ಯಾವಳಿಗಳು' : 'REAL NEWS & PHOTO SHARING RADAR'}
        </Text>

        {/* ------------------------------------------------------------- */}
        {/* 2. REPORTERS & CIRCLE STORIES BAR (Dribbble Mockup Avatars)  */}
        {/* ------------------------------------------------------------- */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 14, paddingRight: 8, marginBottom: 18 }}
        >
          {/* Current User Quick Story */}
          <TouchableOpacity
            onPress={() => setCreateModalVisible(true)}
            activeOpacity={0.75}
            style={{ alignItems: 'center', width: 66 }}
          >
            <View
              style={{
                width: 58,
                height: 58,
                borderRadius: 29,
                backgroundColor: '#EEF2FF',
                borderWidth: 2,
                borderColor: '#6366F1',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 22 }}>➕</Text>
            </View>
            <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: '800', color: '#4F46E5', marginTop: 4 }}>
              {isKn ? 'ನಿಮ್ಮ ಸುದ್ದಿ' : 'Your Story'}
            </Text>
          </TouchableOpacity>

          {REPORTERS_STORIES.map((rep) => (
            <TouchableOpacity
              key={rep.id}
              onPress={() => showToast(`Viewing verified updates from ${rep.name} (${rep.role})`)}
              activeOpacity={0.75}
              style={{ alignItems: 'center', width: 66 }}
            >
              <View
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 29,
                  padding: 2.5,
                  backgroundColor: '#818CF8',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 26,
                    backgroundColor: '#FFFFFF',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 24 }}>{rep.avatar}</Text>
                </View>
              </View>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: '#0F172A',
                  marginTop: 4,
                  textAlign: 'center',
                }}
              >
                {rep.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ------------------------------------------------------------- */}
        {/* 3. CATEGORY CHIPS                                            */}
        {/* ------------------------------------------------------------- */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 14 }}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.7}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 9999,
                  backgroundColor: isSelected ? '#4F46E5' : '#FFFFFF',
                  borderWidth: 1.5,
                  borderColor: isSelected ? '#4F46E5' : '#E2E8F0',
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: isSelected ? '800' : '600',
                    color: isSelected ? '#FFFFFF' : '#475569',
                  }}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ------------------------------------------------------------- */}
        {/* 4. REAL PHOTO NEWS FEED (Dribbble Mockup Cards)              */}
        {/* ------------------------------------------------------------- */}
        <View style={{ gap: 20 }}>
          {filteredPosts.map((post, idx) => (
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
              {/* Author Header Row */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
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
                  <View>
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
                </View>

                {/* Category Badge */}
                <View
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 9999,
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: '800', color: post.categoryColor }}>
                    {post.categoryIcon} {post.category.split(' ')[0]}
                  </Text>
                </View>
              </View>

              {/* Real High-Resolution Photo Card (Dribbble Mockup Style) */}
              <View
                style={{
                  borderRadius: 18,
                  overflow: 'hidden',
                  backgroundColor: '#0F172A',
                  marginBottom: 12,
                  aspectRatio: 16 / 10,
                  width: '100%',
                }}
              >
                <Image
                  source={{ uri: post.photoUrl }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              </View>

              {/* Interaction Bar (Like, Comment, Bookmark, Share) */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  {/* Like Button */}
                  <TouchableOpacity
                    onPress={() => handleToggleLike(post.id)}
                    activeOpacity={0.7}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                  >
                    <Text style={{ fontSize: 20 }}>{post.isLiked ? '❤️' : '🤍'}</Text>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '800',
                        color: post.isLiked ? '#E11D48' : '#334155',
                      }}
                    >
                      {post.likesCount.toLocaleString()}
                    </Text>
                  </TouchableOpacity>

                  {/* Comment Button */}
                  <TouchableOpacity
                    onPress={() => setActiveCommentsPost(post)}
                    activeOpacity={0.7}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                  >
                    <Text style={{ fontSize: 20 }}>💬</Text>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#334155' }}>
                      {post.commentsCount}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  {/* Bookmark Button */}
                  <TouchableOpacity
                    onPress={() => handleToggleBookmark(post.id)}
                    activeOpacity={0.7}
                    style={{ padding: 4 }}
                  >
                    <Text style={{ fontSize: 18 }}>{post.isBookmarked ? '🔖' : '📑'}</Text>
                  </TouchableOpacity>

                  {/* External Link */}
                  {post.sourceUrl && (
                    <TouchableOpacity
                      onPress={() => {
                        if (Platform.OS === 'web' && post.sourceUrl) {
                          window.open(post.sourceUrl, '_blank');
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
              </View>

              {/* News Headline & Story Details */}
              <Text
                style={{
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
                  fontSize: 13,
                  fontWeight: '500',
                  color: '#475569',
                  lineHeight: 19,
                }}
              >
                {post.details}
              </Text>

              {/* Inline Comments Preview (if any) */}
              {post.comments && post.comments.length > 0 && (
                <TouchableOpacity
                  onPress={() => setActiveCommentsPost(post)}
                  activeOpacity={0.75}
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderRadius: 14,
                    padding: 10,
                    marginTop: 10,
                    borderWidth: 1,
                    borderColor: '#F1F5F9',
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#6366F1' }}>
                    💬 {post.comments[0].user}: "{post.comments[0].text}"
                  </Text>
                  {post.comments.length > 1 && (
                    <Text style={{ fontSize: 10, color: '#94A3B8', marginTop: 2, fontWeight: '600' }}>
                      View all {post.commentsCount} comments...
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </GlassCard>
          ))}
        </View>

        {/* ------------------------------------------------------------- */}
        {/* 5. "MORE FRIENDS, MORE EXCITEMENT!" SECTION (Dribbble Mockup) */}
        {/* ------------------------------------------------------------- */}
        <View style={{ marginTop: 26, marginBottom: 12 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '900',
              color: '#0F172A',
              marginBottom: 4,
            }}
          >
            {isKn ? 'ಹೆಚ್ಚು ಸ್ನೇಹಿತರು, ಹೆಚ್ಚು ಉತ್ಸಾಹ!' : 'More friends, more excitement!'}
          </Text>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: '#64748B',
              marginBottom: 12,
              textTransform: 'uppercase',
            }}
          >
            {isKn ? 'ಶಿಫಾರಸು ಮಾಡಿದ ವರದಿಗಾರರು' : 'RECOMMENDED CIRCLE REPORTERS'}
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {RECOMMENDED_FRIENDS.map((f) => {
              const isConnected = Boolean(connectedUsers[f.id]);
              return (
                <View
                  key={f.id}
                  style={{
                    width: 120,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 20,
                    padding: 12,
                    alignItems: 'center',
                    borderWidth: 1.5,
                    borderColor: '#E2E8F0',
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: '#EEF2FF',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ fontSize: 24 }}>{f.avatar}</Text>
                  </View>
                  <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: '800', color: '#0F172A', textAlign: 'center' }}>
                    {f.name}
                  </Text>
                  <Text numberOfLines={1} style={{ fontSize: 10, fontWeight: '600', color: '#64748B', marginTop: 1 }}>
                    {f.role}
                  </Text>

                  <TouchableOpacity
                    onPress={() => handleToggleConnect(f.id, f.name)}
                    activeOpacity={0.8}
                    style={{
                      marginTop: 10,
                      width: '100%',
                      paddingVertical: 5,
                      borderRadius: 9999,
                      backgroundColor: isConnected ? '#F1F5F9' : '#6366F1',
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '800',
                        color: isConnected ? '#475569' : '#FFFFFF',
                      }}
                    >
                      {isConnected ? '✓ Added' : '+ Add'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </ScrollView>

      {/* ------------------------------------------------------------- */}
      {/* 6. MODAL: SHARE PHOTO NEWS (Interactive Creation)             */}
      {/* ------------------------------------------------------------- */}
      <Modal visible={createModalVisible} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            justifyContent: 'flex-end',
          }}
        >
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
                  {isKn ? 'ಫೋಟೋ ಸುದ್ದಿ ಹಂಚಿಕೊಳ್ಳಿ 📸' : 'Share Photo News 📸'}
                </Text>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B' }}>
                  {isKn ? 'ನಿಮ್ಮ ವೃತ್ತದೊಂದಿಗೆ ನೈಜ ಸುದ್ದಿ ಹಂಚಿಕೊಳ್ಳಿ' : 'Real-time photos & story updates for your circle'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#94A3B8' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 20 }}>
              {/* Photo Selector */}
              <View>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#0F172A', marginBottom: 6 }}>
                  1. {isKn ? 'ಫೋಟೋ ಆಯ್ಕೆಮಾಡಿ' : 'SELECT PHOTO'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {PRESET_NEWS_PHOTOS.map((p) => {
                    const isSelected = formPhotoUrl === p.url;
                    return (
                      <TouchableOpacity
                        key={p.url}
                        onPress={() => setFormPhotoUrl(p.url)}
                        activeOpacity={0.8}
                        style={{
                          borderRadius: 14,
                          borderWidth: 2,
                          borderColor: isSelected ? '#6366F1' : '#E2E8F0',
                          padding: 4,
                          backgroundColor: '#FFFFFF',
                        }}
                      >
                        <Image
                          source={{ uri: p.url }}
                          style={{ width: 80, height: 50, borderRadius: 10 }}
                          resizeMode="cover"
                        />
                        <Text style={{ fontSize: 10, fontWeight: '700', textAlign: 'center', marginTop: 4 }}>
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Custom Image URL fallback */}
              <View>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 4 }}>
                  {isKn ? 'ಅಥವಾ ಕಸ್ಟಮ್ ಇಮೇಜ್ URL ನಮೂದಿಸಿ' : 'OR ENTER IMAGE URL'}
                </Text>
                <TextInput
                  value={formPhotoUrl}
                  onChangeText={setFormPhotoUrl}
                  placeholder="https://images.unsplash.com/photo..."
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

              {/* Headline */}
              <View>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#0F172A', marginBottom: 4 }}>
                  2. {isKn ? 'ಸುದ್ದಿ ಶೀರ್ಷಿಕೆ *' : 'NEWS HEADLINE *'}
                </Text>
                <TextInput
                  value={formTitle}
                  onChangeText={setFormTitle}
                  placeholder={isKn ? 'ಆಕರ್ಷಕ ಮುಖ್ಯಾಂಶ...' : 'Catchy headline...'}
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

              {/* Story Details */}
              <View>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#0F172A', marginBottom: 4 }}>
                  3. {isKn ? 'ಸುದ್ದಿ ವಿವರಗಳು *' : 'FULL STORY DETAILS *'}
                </Text>
                <TextInput
                  value={formDetails}
                  onChangeText={setFormDetails}
                  placeholder={isKn ? 'ಘಟನೆಯ ಸಂಪೂರ್ಣ ವಿವರಗಳನ್ನು ಬರೆಯಿರಿ...' : 'What happened? Provide context, venue, and impact...'}
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

              {/* Category Pills */}
              <View>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#0F172A', marginBottom: 6 }}>
                  4. {isKn ? 'ವಿಭಾಗ' : 'CATEGORY'}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {['OORU CITY NEWS', 'CAMPUS DESK', 'TECH & STARTUPS', 'NATURE & WEATHER', 'COASTAL & TRANSIT'].map(
                    (cat) => {
                      const isSelected = formCategory === cat;
                      return (
                        <TouchableOpacity
                          key={cat}
                          onPress={() => setFormCategory(cat)}
                          style={{
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 9999,
                            backgroundColor: isSelected ? '#4F46E5' : '#F1F5F9',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: '800',
                              color: isSelected ? '#FFFFFF' : '#475569',
                            }}
                          >
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      );
                    },
                  )}
                </View>
              </View>

              {/* Source Attribution */}
              <View>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#0F172A', marginBottom: 4 }}>
                  5. {isKn ? 'ಮೂಲ / ವೆಬ್‌ಸೈಟ್ (ಐಚ್ಛಿಕ)' : 'SOURCE / WEBSITE (OPTIONAL)'}
                </Text>
                <TextInput
                  value={formSourceName}
                  onChangeText={setFormSourceName}
                  placeholder="e.g. Deccan Herald, The Hindu, Campus Circular"
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
                title={submitting ? (isKn ? 'ಪ್ರಕಟಿಸಲಾಗುತ್ತಿದೆ...' : 'Publishing...') : isKn ? 'ಸುದ್ದಿ ಪ್ರಕಟಿಸಿ 🚀' : 'Publish Photo News 🚀'}
                onPress={handlePublishNews}
                disabled={submitting}
                style={{ height: 48, marginTop: 8 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* 7. MODAL: COMMENTS SHEET                                     */}
      {/* ------------------------------------------------------------- */}
      {Boolean(activeCommentsPost) && (
        <Modal visible={Boolean(activeCommentsPost)} transparent animationType="slide">
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              justifyContent: 'flex-end',
            }}
          >
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                padding: 20,
                maxHeight: '80%',
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#0F172A' }}>
                  💬 Comments ({activeCommentsPost?.commentsCount || 0})
                </Text>
                <TouchableOpacity onPress={() => setActiveCommentsPost(null)}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#94A3B8' }}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Comments List */}
              <ScrollView style={{ maxHeight: 300, marginBottom: 14 }}>
                {activeCommentsPost?.comments && activeCommentsPost.comments.length > 0 ? (
                  activeCommentsPost.comments.map((c) => (
                    <View
                      key={c.id}
                      style={{
                        paddingVertical: 8,
                        borderBottomWidth: 1,
                        borderBottomColor: '#F1F5F9',
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A' }}>{c.user}</Text>
                        <Text style={{ fontSize: 10, color: '#94A3B8' }}>{c.time}</Text>
                      </View>
                      <Text style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>{c.text}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', paddingVertical: 20 }}>
                    No comments yet. Start the conversation!
                  </Text>
                )}
              </ScrollView>

              {/* Add Comment Input */}
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <TextInput
                  value={commentInput}
                  onChangeText={setCommentInput}
                  placeholder="Add a comment..."
                  placeholderTextColor="#94A3B8"
                  style={{
                    flex: 1,
                    backgroundColor: '#F8FAFC',
                    borderRadius: 9999,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    fontSize: 13,
                  }}
                />
                <TouchableOpacity
                  onPress={handleAddComment}
                  style={{
                    backgroundColor: '#4F46E5',
                    borderRadius: 9999,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFFFFF' }}>Post</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </MainLayout>
  );
}
