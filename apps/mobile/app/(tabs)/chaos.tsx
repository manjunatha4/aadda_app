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
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/stores/authStore';
import { storage } from '../../src/services/storage';
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

const INITIAL_NEWS_POSTS: PhotoNewsPost[] = [];

const CATEGORIES = [
  'All News 🌟',
  'WORLD & SPACE NEWS 🚀',
  'OORU CITY NEWS 🏙️',
  'NATURE & WEATHER 🌲',
  'CAMPUS DESK 🎓',
  'TECH & STARTUPS 💻',
  'COASTAL & TRANSIT 🏖️',
];

async function fetchSpaceNews(): Promise<PhotoNewsPost[]> {
  try {
    const res = await fetch('https://api.spaceflightnewsapi.net/v4/articles/?limit=15');
    if (!res.ok) return [];
    const data = await res.json();
    if (!data || !Array.isArray(data.results)) return [];

    return data.results.map((item: any) => {
      let timeAgo = 'Today';
      if (item.published_at) {
        const diffHours = Math.round((Date.now() - new Date(item.published_at).getTime()) / (1000 * 60 * 60));
        if (diffHours <= 1) timeAgo = 'Just now';
        else if (diffHours < 24) timeAgo = `${diffHours}h ago`;
        else {
          const diffDays = Math.round(diffHours / 24);
          timeAgo = `${diffDays}d ago`;
        }
      }

      return {
        id: `space_${item.id}`,
        authorName: item.news_site || 'World News Desk',
        authorHandle: `@${(item.news_site || 'world').toLowerCase().replace(/[^a-z0-9]/g, '')} · Verified Wire`,
        authorAvatar: '🛰️',
        verified: true,
        timeAgo,
        category: 'WORLD & SPACE NEWS',
        categoryIcon: '🚀',
        categoryColor: '#2563EB',
        title: item.title,
        details: item.summary,
        photoUrl: item.image_url || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
        sourceName: item.news_site || 'World Wire',
        sourceUrl: item.url,
        likesCount: 16 + (Number(item.id) % 37),
        commentsCount: 2 + (Number(item.id) % 9),
        isLiked: false,
        isBookmarked: false,
        comments: [],
      };
    });
  } catch (e) {
    console.error('Failed to fetch real-time space & world news:', e);
    return [];
  }
}

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

  const loadAllNews = async () => {
    try {
      let localPosts: PhotoNewsPost[] = [];
      const stored = await storage.getItem('aadda_user_photo_news');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          localPosts = parsed;
        }
      }

      // Live real-time world/space news from Spaceflight News API
      const spaceNews = await fetchSpaceNews();
      const merged = [...localPosts, ...spaceNews];
      setPosts(merged);
    } catch (e) {
      console.error('Error loading stored & live news:', e);
    }
  };

  // Load saved posts and live world news on mount
  useEffect(() => {
    loadAllNews();
  }, []);

  const savePostsToStorage = async (updated: PhotoNewsPost[]) => {
    try {
      const userOnly = updated.filter((p) => !p.id.startsWith('space_'));
      await storage.setItem('aadda_user_photo_news', JSON.stringify(userOnly));
    } catch (e) {
      console.error('Error saving news to storage:', e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllNews();
    setRefreshing(false);
    showToast(isKn ? 'ದೈನಂದಿನ ಜಾಗತಿಕ & ಸ್ಥಳೀಯ ಸುದ್ದಿ ನವೀಕರಿಸಲಾಗಿದೆ ✨' : 'Daily world & circle news refreshed ✨');
  };

  const handlePickFromGallery = () => {
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
              setFormPhotoUrl(dataUrl);
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleToggleLike = (postId: string) => {
    setPosts((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== postId) return p;
        const isLiked = !p.isLiked;
        return {
          ...p,
          isLiked,
          likesCount: isLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1),
        };
      });
      savePostsToStorage(updated);
      return updated;
    });
  };

  const handleToggleBookmark = (postId: string) => {
    setPosts((prev) => {
      const updated = prev.map((p) => {
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
      });
      savePostsToStorage(updated);
      return updated;
    });
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

    setPosts((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== activeCommentsPost.id) return p;
        const comments = [newComment, ...(p.comments || [])];
        return {
          ...p,
          comments,
          commentsCount: p.commentsCount + 1,
        };
      });
      savePostsToStorage(updated);
      return updated;
    });

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

    const nextPosts = [newPost, ...posts];
    setPosts(nextPosts);
    savePostsToStorage(nextPosts);
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
        {/* 1. TOP HEADER (Unified White Theme Header without Hamburger) */}
        {/* ------------------------------------------------------------- */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 10,
            marginBottom: 12,
          }}
        >
          {/* Title & Badge */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text
              style={{
                fontSize: 26,
                fontWeight: '900',
                color: '#0F172A',
                letterSpacing: -0.6,
              }}
            >
              {isKn ? 'ಸುದ್ದಿ ಫೀಡ್' : 'Photo News'}
            </Text>
            <View
              style={{
                backgroundColor: '#EEF2FF',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 9999,
                borderWidth: 1,
                borderColor: '#C7D2FE',
              }}
            >
              <Text style={{ color: '#4F46E5', fontSize: 11, fontWeight: '800' }}>
                📍 {isKn ? 'ಕರ್ನಾಟಕ ವೃತ್ತ' : 'Circle'}
              </Text>
            </View>
          </View>

          {/* Right Action: "+ Share News" (No profile icon in header; dedicated 4th tab is Profile) */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              onPress={() => setCreateModalVisible(true)}
              activeOpacity={0.8}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 9999,
                backgroundColor: '#EEF2FF',
                borderWidth: 1.5,
                borderColor: '#818CF8',
              }}
            >
              <Text style={{ fontSize: 14 }}>📷</Text>
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#4F46E5' }}>
                {isKn ? '+ ಸುದ್ದಿ' : '+ Share'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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

          {/* Active Circle Reporters (dynamically loaded from circle posts) */}
          {posts
            .filter((p, index, self) => index === self.findIndex((t) => t.authorName === p.authorName))
            .map((rep) => (
              <TouchableOpacity
                key={rep.id}
                onPress={() => showToast(`Viewing news from ${rep.authorName}`)}
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
                    <Text style={{ fontSize: 24 }}>{rep.authorAvatar || '📸'}</Text>
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
                  {rep.authorName}
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
          {filteredPosts.length === 0 ? (
            <GlassCard
              style={{
                borderRadius: 24,
                padding: 36,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#FFFFFF',
                borderWidth: 1.5,
                borderColor: '#E2E8F0',
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.04,
                shadowRadius: 10,
                elevation: 2,
              }}
            >
              <View
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: 34,
                  backgroundColor: '#EEF2FF',
                  borderWidth: 2,
                  borderColor: '#C7D2FE',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                }}
              >
                <Text style={{ fontSize: 32 }}>📷</Text>
              </View>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '900',
                  color: '#0F172A',
                  textAlign: 'center',
                  letterSpacing: -0.3,
                }}
              >
                {isKn ? 'ಯಾವುದೇ ಫೋಟೋ ಸುದ್ದಿ ಇಲ್ಲ' : 'No photo news yet'}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '500',
                  color: '#64748B',
                  textAlign: 'center',
                  marginTop: 6,
                  lineHeight: 19,
                  maxWidth: 290,
                }}
              >
                {isKn
                  ? 'ನಿಮ್ಮ ವೃತ್ತದಲ್ಲಿ ಮೊದಲ ಫೋಟೋ ಸುದ್ದಿ, ಸ್ಥಳೀಯ ಘಟನೆ ಅಥವಾ ಕಾಲೇಜು ಅಪ್‌ಡೇಟ್ ಹಂಚಿಕೊಳ್ಳಿ.'
                  : 'Be the first to share breaking campus updates, local ooru news, or high-res photos with your circle.'}
              </Text>
              <TouchableOpacity
                onPress={() => setCreateModalVisible(true)}
                activeOpacity={0.85}
                style={{
                  marginTop: 18,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: '#4F46E5',
                  paddingHorizontal: 22,
                  paddingVertical: 12,
                  borderRadius: 9999,
                  shadowColor: '#4F46E5',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Text style={{ fontSize: 16 }}>📸</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '800' }}>
                  {isKn ? 'ಮೊದಲ ಸುದ್ದಿ ಹಂಚಿಕೊಳ್ಳಿ' : '+ Share Photo News'}
                </Text>
              </TouchableOpacity>
            </GlassCard>
          ) : (
            filteredPosts.map((post, idx) => (
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
            ))
          )}
        </View>

        {/* ------------------------------------------------------------- */}
        {/* 5. GROW YOUR CIRCLE SECTION (Real Actionable Invitation)     */}
        {/* ------------------------------------------------------------- */}
        <View style={{ marginTop: 24, marginBottom: 12 }}>
          <GlassCard
            style={{
              borderRadius: 24,
              padding: 20,
              backgroundColor: '#FFFFFF',
              borderWidth: 1.5,
              borderColor: '#E2E8F0',
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 }}>
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: '#EEF2FF',
                  borderWidth: 1.5,
                  borderColor: '#C7D2FE',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 26 }}>👥</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#0F172A' }}>
                  {isKn ? 'ನಿಮ್ಮ ವೃತ್ತದ ಸ್ನೇಹಿತರನ್ನು ಆಹ್ವಾನಿಸಿ' : 'Grow Your Circle'}
                </Text>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#64748B', marginTop: 2, lineHeight: 17 }}>
                  {isKn
                    ? 'ಖಾಸಗಿ ಅಡ್ಡ ವೃತ್ತದಲ್ಲಿ ನೈಜ ಹರಟೆ ಮತ್ತು ಫೋಟೋ ಸುದ್ದಿಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಲು ನಿಮ್ಮ ಸ್ನೇಹಿತರನ್ನು ಸೇರಿಸಿ.'
                    : 'Invite close friends to your Adda room to see updates, debate polls, and share local news together.'}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <TouchableOpacity
                onPress={() => {
                  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
                    navigator.clipboard.writeText('Join my private circle on Varavu Adda! 🛖');
                  }
                  showToast(isKn ? 'ಆಹ್ವಾನ ಲಿಂಕ್ ನಕಲಿಸಲಾಗಿದೆ! 📋' : 'Circle invite link copied! 📋');
                }}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  backgroundColor: '#EEF2FF',
                  paddingVertical: 10,
                  borderRadius: 14,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#C7D2FE',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#4F46E5' }}>
                  📋 {isKn ? 'ಲಿಂಕ್ ನಕಲಿಸಿ' : 'Copy Invite Link'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/(tabs)/chats')}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  backgroundColor: '#4F46E5',
                  paddingVertical: 10,
                  borderRadius: 14,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>
                  🛖 {isKn ? 'ಅಡ್ಡ ರೂಮ್‌ಗಳು' : 'Open Rooms'}
                </Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
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
              {/* Photo Selector with Device Gallery Picker */}
              <View>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#0F172A', marginBottom: 6 }}>
                  1. {isKn ? 'ಸಾಧನದ ಗ್ಯಾಲರಿಯಿಂದ ಫೋಟೋ ಆಯ್ಕೆಮಾಡಿ' : 'PICK PHOTO FROM DEVICE GALLERY'}
                </Text>

                {/* Prominent Gallery Button */}
                <TouchableOpacity
                  onPress={handlePickFromGallery}
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
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ fontSize: 20 }}>📁</Text>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#4F46E5' }}>
                    {isKn ? 'ಗ್ಯಾಲರಿಯಿಂದ ಫೋಟೋ ಆಯ್ಕೆಮಾಡಿ' : 'Choose Photo from Device Gallery'}
                  </Text>
                </TouchableOpacity>

                {/* Selected Photo Live Preview */}
                {formPhotoUrl ? (
                  <View
                    style={{
                      marginBottom: 12,
                      borderRadius: 16,
                      overflow: 'hidden',
                      borderWidth: 1.5,
                      borderColor: '#E2E8F0',
                      position: 'relative',
                    }}
                  >
                    <Image
                      source={{ uri: formPhotoUrl }}
                      style={{ width: '100%', height: 160 }}
                      resizeMode="cover"
                    />
                    <View
                      style={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        backgroundColor: 'rgba(15, 23, 42, 0.75)',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}>
                        ✓ {isKn ? 'ಆಯ್ಕೆಯಾದ ಚಿತ್ರ' : 'Selected Photo'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setFormPhotoUrl('')}
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        backgroundColor: 'rgba(239, 68, 68, 0.9)',
                        width: 26,
                        height: 26,
                        borderRadius: 13,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '900' }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 6 }}>
                  {isKn ? 'ಅಥವಾ ತ್ವರಿತ ಪ್ರಿಸೆಟ್‌ಗಳಿಂದ ಆರಿಸಿ' : 'OR CHOOSE FROM QUICK PRESETS'}
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
