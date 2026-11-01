import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  RefreshControl,
  Modal,
  TextInput,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { api } from '../../src/services/api';
import { useAuthStore } from '../../src/stores/authStore';
import {
  BuzzPost,
  BuzzCategory,
  BuzzCredibility,
  BuzzReactionEmoji,
} from '@aadda/shared';
import {
  MainLayout,
  GlassCard,
  PrimaryButton,
  SecondaryButton,
  ToastNotification,
  ConfirmationDialog,
  LoadingState,
  DS_TOKENS,
} from '../../src/components/DesignSystem';

const SCREEN_WIDTH = Dimensions.get('window').width;

const REACTION_EMOJIS = ['😂', '👀', '🍿', '☕', '🔥', '💀', '❤️'];

const CIRCLE_STORIES = [
  { id: 'st_my', name: 'My Story', avatar: '✨', mood: 'LIVE', isMe: true },
  { id: 'st_1', name: 'Rohit K', avatar: '☕', mood: 'Need Gossip 👀', hasUnread: true, storyContent: 'Canteen Coffee Saga: table 4 disappeared 😭' },
  { id: 'st_2', name: 'Deepa M', avatar: '🚇', mood: 'Metro Run', hasUnread: true, storyContent: 'Purple line peak trains every 3 mins now! 🚀' },
  { id: 'st_3', name: 'Karthik', avatar: '🎮', mood: 'Gaming Mode', hasUnread: true, storyContent: 'ChakraVyuh Hackathon mock interviews in Hall 2' },
  { id: 'st_4', name: 'Ananya S', avatar: '🥑', mood: 'Chill Mode 🌿', hasUnread: false, storyContent: 'Weekend Chai Adda playlist updated' },
  { id: 'st_5', name: 'Suresh', avatar: '🧈', mood: 'CTR Hunter', hasUnread: false, storyContent: 'CTR Benne Dosa is officially top tier' },
];

const CATEGORY_CHIPS: Array<{ key: BuzzCategory; labelEn: string; labelKn: string; icon: string }> = [
  { key: BuzzCategory.ALL, labelEn: 'All Buzz', labelKn: 'ಎಲ್ಲಾ ಬಜ್', icon: '🌟' },
  { key: BuzzCategory.SPILL_THE_TEA, labelEn: 'Spill the Tea', labelKn: 'ಟೀ ಕುಡಿತಾ ಹರಟೆ', icon: '☕' },
  { key: BuzzCategory.POLL_HOT_TAKE, labelEn: "What's the Verdict?", labelKn: 'ಮತದಾನ & ತೀರ್ಪು', icon: '🗳️' },
  { key: BuzzCategory.CONFESSION, labelEn: 'Confession Corner', labelKn: 'ಕನ್ಫೆಷನ್ ಕಾರ್ನರ್', icon: '👀' },
  { key: BuzzCategory.NEWS, labelEn: 'News & Links', labelKn: 'ಸುದ್ದಿ & ಲಿಂಕ್ಸ್', icon: '📰' },
  { key: BuzzCategory.OORU_UPDATES, labelEn: 'Ooru Updates', labelKn: 'ಊರು ಅಪ್‌ಡೇಟ್ಸ್', icon: '🏙️' },
  { key: BuzzCategory.COLLEGE_RADAR, labelEn: 'College Radar', labelKn: 'ಕಾಲೇಜು ರೇಡಾರ್', icon: '🎓' },
  { key: BuzzCategory.GUESS_WHO, labelEn: 'Guess Who?', labelKn: 'ಯಾರು ಅಂತ ಊಹಿಸಿ?', icon: '🎭' },
  { key: BuzzCategory.LATE_NIGHT_ADDA, labelEn: 'Late Night Adda', labelKn: 'ರಾತ್ರಿ ಹರಟೆ', icon: '🌙' },
  { key: BuzzCategory.HOT_TAKE, labelEn: 'Hot Take of the Day', labelKn: 'ಇಂದಿನ ಹಾಟ್ ಟೇಕ್', icon: '⚡' },
];

export default function BuzzFeedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ addaId?: string }>();
  const { i18n } = useTranslation();
  const currentUser = useAuthStore((state) => state.user);
  const isKn = i18n.language === 'kn';

  const [addas, setAddas] = useState<any[]>([]);
  const [selectedAddaId, setSelectedAddaId] = useState<string>(params.addaId || 'default');
  const [selectedCategory, setSelectedCategory] = useState<BuzzCategory>(BuzzCategory.ALL);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'trending' | 'saved'>('all');

  const [posts, setPosts] = useState<BuzzPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Story Modal
  const [activeStory, setActiveStory] = useState<any | null>(null);

  // Report Modal State
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<string>('Harassment / Bullying');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Delete Confirm State
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const fetchAddas = async () => {
    try {
      const res = await api.get('/addas');
      if (Array.isArray(res) && res.length > 0) {
        setAddas(res);
        if (!params.addaId && selectedAddaId === 'default') {
          setSelectedAddaId(res[0].id);
        }
      }
    } catch {
      // fallback
    }
  };

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        addaId: selectedAddaId,
        category: selectedCategory,
        filter: selectedFilter,
        userId: currentUser?.id || 'usr_default',
      }).toString();

      const data = await api.get(`/buzz?${query}`);
      if (Array.isArray(data)) {
        setPosts(data);
      }
    } catch (e: any) {
      console.error('Error fetching buzz feed:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedAddaId, selectedCategory, selectedFilter, currentUser?.id]);

  useEffect(() => {
    fetchAddas();
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  // Reactions Toggle
  const handleToggleReaction = async (postId: string, emoji: string) => {
    try {
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id !== postId) return post;
          const userReactions = [...(post.userReactions || [])];
          const reactions = { ...(post.reactions || {}) };
          const hasReacted = userReactions.includes(emoji);

          if (hasReacted) {
            const nextUserReactions = userReactions.filter((e) => e !== emoji);
            const count = Math.max(0, (reactions[emoji] || 1) - 1);
            if (count === 0) delete reactions[emoji];
            else reactions[emoji] = count;
            return { ...post, reactions, userReactions: nextUserReactions };
          } else {
            userReactions.push(emoji);
            reactions[emoji] = (reactions[emoji] || 0) + 1;
            return { ...post, reactions, userReactions };
          }
        }),
      );

      await api.post(`/buzz/${postId}/react`, { emoji });
    } catch (e: any) {
      console.error('Failed to react:', e);
    }
  };

  // Poll Vote
  const handleVotePoll = async (postId: string, optionId: string) => {
    try {
      const res = await api.post(`/buzz/${postId}/vote`, { optionId });
      if (res?.pollOptions) {
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, pollOptions: res.pollOptions } : p)),
        );
      }
      setToastMessage(isKn ? 'ನಿಮ್ಮ ಮತ ದಾಖಲಾಗಿದೆ! 🔥' : 'Vote recorded! 🔥');
      setTimeout(() => setToastMessage(null), 2000);
    } catch (e: any) {
      console.error('Vote failed:', e);
    }
  };

  // Bookmark / Save
  const handleToggleBookmark = async (postId: string) => {
    try {
      const res = await api.post(`/buzz/${postId}/bookmark`);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                isBookmarked: res.isBookmarked,
                bookmarksCount: res.bookmarksCount,
              }
            : p,
        ),
      );
      setToastMessage(
        res.isBookmarked
          ? isKn
            ? 'ಪೋಸ್ಟ್ ಉಳಿಸಲಾಗಿದೆ! 🔖'
            : 'Saved to your bookmarks! 🔖'
          : isKn
          ? 'ಬುಕ್‌ಮಾರ್ಕ್‌ನಿಂದ ತೆಗೆದುಹಾಕಲಾಗಿದೆ'
          : 'Removed from bookmarks',
      );
      setTimeout(() => setToastMessage(null), 2000);
    } catch (e: any) {
      console.error('Bookmark toggle failed:', e);
    }
  };

  // Delete
  const handleConfirmDelete = async () => {
    if (!deletingPostId) return;
    try {
      await api.delete(`/buzz/${deletingPostId}`);
      setPosts((prev) => prev.filter((p) => p.id !== deletingPostId));
      setToastMessage(isKn ? 'ಪೋಸ್ಟ್ ಅಳಿಸಲಾಗಿದೆ' : 'Post deleted successfully');
      setTimeout(() => setToastMessage(null), 2000);
    } catch (e: any) {
      console.error('Delete failed:', e);
    } finally {
      setDeletingPostId(null);
    }
  };

  // Submit Report
  const handleSubmitReport = async () => {
    if (!reportingPostId) return;
    try {
      setIsSubmittingReport(true);
      await api.post(`/buzz/${reportingPostId}/report`, {
        reason: reportReason,
        details: reportDetails,
      });
      setReportingPostId(null);
      setReportDetails('');
      setToastMessage(
        isKn
          ? 'ವರದಿ ಸಲ್ಲಿಸಲಾಗಿದೆ. ಅಡ್ಡ ನಿಯಂತ್ರಕರು ಪರಿಶೀಲಿಸುತ್ತಾರೆ.'
          : 'Report submitted. Circle moderators will review.',
      );
      setTimeout(() => setToastMessage(null), 3000);
    } catch (e: any) {
      console.error('Report failed:', e);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleSharePost = (post: BuzzPost) => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/buzz/${post.id}`);
    }
    setToastMessage(isKn ? 'ಲಿಂಕ್ ನಕಲಿಸಲಾಗಿದೆ!' : 'Circle link copied to clipboard!');
    setTimeout(() => setToastMessage(null), 2000);
  };

  return (
    <MainLayout>
      <ToastNotification
        visible={Boolean(toastMessage)}
        message={toastMessage || ''}
        onDismiss={() => setToastMessage(null)}
      />

      {/* ------------------------------------------------------------- */}
      {/* 1. TOP BAR (Unified Header without Hamburger Menu)            */}
      {/* ------------------------------------------------------------- */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 8,
          marginBottom: 12,
        }}
      >
        {/* Title: VARAVU ADDA + Private circle Badge */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '900',
              color: '#0F172A',
              letterSpacing: -0.4,
            }}
          >
            VARAVU ADDA
          </Text>
          <View
            style={{
              backgroundColor: '#F0FDF4',
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 9999,
              borderWidth: 1,
              borderColor: '#BBF7D0',
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#15803D' }}>
              {isKn ? 'ಖಾಸಗಿ ಸರ್ಕಲ್' : 'Private circle'}
            </Text>
          </View>
        </View>

        {/* Right Action Icons: Pencil / Create + Options */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity
            onPress={() => router.push('/buzz/create' as any)}
            activeOpacity={0.8}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
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
            <Text style={{ fontSize: 16 }}>✏️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setToastMessage(
                isKn
                  ? 'ಅಡ್ಡ ಬಜ್: ಖಾಸಗಿ ಹರಟೆ ಮತ್ತು ಸುರಕ್ಷಿತ ಸಂಭಾಷಣೆ ವೇದಿಕೆ'
                  : 'Adda Buzz: Safe, invite-only circle social sharing',
              );
              setTimeout(() => setToastMessage(null), 3000);
            }}
            activeOpacity={0.8}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
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
            <Text style={{ fontSize: 16, fontWeight: '900', color: '#0F172A' }}>⋮</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Giant Kannada Title (Screenshot 1) */}
      <Text
        style={{
          fontSize: 28,
          fontWeight: '900',
          color: '#0F172A',
          letterSpacing: -0.5,
          lineHeight: 36,
          marginTop: 2,
        }}
      >
        ಏನ್ ಸಮಾಚಾರ ಗುರು? 👀
      </Text>

      {/* Subtitle */}
      <Text
        style={{
          fontSize: 11,
          fontWeight: '800',
          color: '#64748B',
          letterSpacing: 0.9,
          textTransform: 'uppercase',
          marginTop: 4,
          marginBottom: 16,
        }}
      >
        YOUR FRIENDS ARE UP TO SOMETHING
      </Text>

      {/* ------------------------------------------------------------- */}
      {/* 3. 2x2 VIBRANT QUICK FEATURE GRID (SCREENSHOT 1 EXACT THEME)  */}
      {/* ------------------------------------------------------------- */}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 20,
        }}
      >
        {/* CARD 1: Spill the Tea ☕ (Deep Purple / Navy) */}
        <TouchableOpacity
          onPress={() => {
            setSelectedCategory(BuzzCategory.SPILL_THE_TEA);
            setSelectedFilter('all');
          }}
          activeOpacity={0.85}
          style={{
            width: '48%',
            height: 124,
            borderRadius: 22,
            backgroundColor: '#27204A',
            padding: 14,
            justifyContent: 'space-between',
            shadowColor: '#27204A',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.22,
            shadowRadius: 12,
            elevation: 5,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: 'rgba(255, 255, 255, 0.14)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 18 }}>☕</Text>
          </View>
          <View>
            <Text style={{ fontSize: 16, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.2 }}>
              Spill the Tea
            </Text>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#C4B5FD', marginTop: 2 }}>
              Gossip starts here
            </Text>
          </View>
        </TouchableOpacity>

        {/* CARD 2: Buzz Feed 📰 (Coral / Salmon) */}
        <TouchableOpacity
          onPress={() => {
            setSelectedCategory(BuzzCategory.ALL);
            setSelectedFilter('all');
          }}
          activeOpacity={0.85}
          style={{
            width: '48%',
            height: 124,
            borderRadius: 22,
            backgroundColor: '#FF6464',
            padding: 14,
            justifyContent: 'space-between',
            shadowColor: '#FF6464',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.22,
            shadowRadius: 12,
            elevation: 5,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: 'rgba(255, 255, 255, 0.22)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 18 }}>📰</Text>
          </View>
          <View>
            <Text style={{ fontSize: 16, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.2 }}>
              Buzz Feed
            </Text>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#FED7AA', marginTop: 2 }}>
              What's happening?
            </Text>
          </View>
        </TouchableOpacity>

        {/* CARD 3: Trending 🔥 (Electric Lime / Neon Yellow-Green) */}
        <TouchableOpacity
          onPress={() => {
            setSelectedFilter(selectedFilter === 'trending' ? 'all' : 'trending');
          }}
          activeOpacity={0.85}
          style={{
            width: '48%',
            height: 124,
            borderRadius: 22,
            backgroundColor: '#D4FF32',
            padding: 14,
            justifyContent: 'space-between',
            borderWidth: selectedFilter === 'trending' ? 2 : 0,
            borderColor: '#0F172A',
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.12,
            shadowRadius: 12,
            elevation: 5,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: 'rgba(0, 0, 0, 0.08)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 18 }}>🔥</Text>
          </View>
          <View>
            <Text style={{ fontSize: 16, fontWeight: '900', color: '#0F172A', letterSpacing: -0.2 }}>
              Trending
            </Text>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#334155', marginTop: 2 }}>
              Circle's hot topics
            </Text>
          </View>
        </TouchableOpacity>

        {/* CARD 4: Tribunal 🗳️ (Soft Lavender / What's the Verdict?) */}
        <TouchableOpacity
          onPress={() => {
            setSelectedCategory(BuzzCategory.POLL_HOT_TAKE);
            setSelectedFilter('all');
          }}
          activeOpacity={0.85}
          style={{
            width: '48%',
            height: 124,
            borderRadius: 22,
            backgroundColor: '#EDE9FE',
            padding: 14,
            justifyContent: 'space-between',
            borderWidth: 1,
            borderColor: '#DDD6FE',
            shadowColor: '#8B5CF6',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 10,
            elevation: 3,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 18 }}>🗳️</Text>
          </View>
          <View>
            <Text style={{ fontSize: 16, fontWeight: '900', color: '#4338CA', letterSpacing: -0.2 }}>
              Tribunal
            </Text>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#6366F1', marginTop: 2 }}>
              Let's vote, guru!
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ------------------------------------------------------------- */}
      {/* 4. CIRCLE MEMBER STORY BUBBLES (Screenshot 2 & 5)             */}
      {/* ------------------------------------------------------------- */}
      <View style={{ marginBottom: 16 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 14, paddingRight: 8 }}
        >
          {CIRCLE_STORIES.map((st) => (
            <TouchableOpacity
              key={st.id}
              onPress={() => setActiveStory(st)}
              activeOpacity={0.75}
              style={{ alignItems: 'center', width: 68 }}
            >
              <View
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 29,
                  padding: 2.5,
                  backgroundColor: st.hasUnread ? '#6366F1' : '#E2E8F0',
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
                  <Text style={{ fontSize: 24 }}>{st.avatar}</Text>
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
                {st.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ------------------------------------------------------------- */}
      {/* 5. FILTER CHIPS (All, Spill the Tea, Verdict, Confessions...) */}
      {/* ------------------------------------------------------------- */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 14 }}
      >
        {CATEGORY_CHIPS.map((cat) => {
          const isSelected = selectedCategory === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              onPress={() => setSelectedCategory(cat.key)}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 13,
                paddingVertical: 7,
                borderRadius: 9999,
                backgroundColor: isSelected ? '#EEF2FF' : '#FFFFFF',
                borderWidth: 1.5,
                borderColor: isSelected ? '#6366F1' : '#E2E8F0',
              }}
            >
              <Text style={{ fontSize: 14 }}>{cat.icon}</Text>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: isSelected ? '800' : '600',
                  color: isSelected ? '#6366F1' : '#475569',
                }}
              >
                {isKn ? cat.labelKn : cat.labelEn}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ------------------------------------------------------------- */}
      {/* 6. TODAY'S ADDA BUZZ SECTION (SCREENSHOT 1)                   */}
      {/* ------------------------------------------------------------- */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
          marginTop: 4,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A' }}>
          Today's Adda Buzz 👀
        </Text>
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#6366F1' }}>
          {posts.length} {isKn ? 'ಹರಟೆಗಳು' : 'stories'}
        </Text>
      </View>

      {loading ? (
        <LoadingState message={isKn ? 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...' : 'Loading Adda Buzz...'} />
      ) : posts.length === 0 ? (
        <GlassCard style={{ padding: 32, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 44, marginBottom: 10 }}>✨</Text>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A', textAlign: 'center' }}>
            {isKn ? 'ಯಾವುದೇ ಬಜ್ ಪೋಸ್ಟ್‌ಗಳಿಲ್ಲ' : 'No circle buzz right now'}
          </Text>
          <Text style={{ fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 4 }}>
            {isKn ? 'ಮೊದಲ ಹರಟೆ ಅಥವಾ ಮತದಾನ ಆರಂಭಿಸಿ!' : 'Start the tea or drop a hot take poll!'}
          </Text>
          <PrimaryButton
            title={isKn ? 'ಹೊಸ ಪೋಸ್ಟ್ ಮಾಡಿ' : 'Start Buzz 🚀'}
            style={{ marginTop: 14 }}
            onPress={() => router.push('/buzz/create' as any)}
          />
        </GlassCard>
      ) : (
        <View style={{ gap: 14, paddingBottom: 120 }}>
          {posts.map((post) => (
            <ModernBuzzCard
              key={post.id}
              post={post}
              isKn={isKn}
              currentUserId={currentUser?.id}
              onReact={(emoji) => handleToggleReaction(post.id, emoji)}
              onVote={(optionId) => handleVotePoll(post.id, optionId)}
              onBookmark={() => handleToggleBookmark(post.id)}
              onComment={() => router.push(`/buzz/${post.id}` as any)}
              onShare={() => handleSharePost(post)}
              onDelete={() => setDeletingPostId(post.id)}
              onReport={() => setReportingPostId(post.id)}
            />
          ))}
        </View>
      )}

      {/* Story View Modal */}
      {activeStory && (
        <Modal visible={Boolean(activeStory)} transparent animationType="fade">
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
            }}
          >
            <View
              style={{
                width: '100%',
                maxWidth: 380,
                backgroundColor: '#FFFFFF',
                borderRadius: 28,
                padding: 24,
                borderWidth: 1.5,
                borderColor: '#E2E8F0',
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.3,
                shadowRadius: 24,
                elevation: 10,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ fontSize: 32 }}>{activeStory.avatar}</Text>
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: '#0F172A' }}>
                      {activeStory.name}
                    </Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#6366F1' }}>
                      {activeStory.mood}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setActiveStory(null)}>
                  <Text style={{ fontSize: 18, color: '#94A3B8', fontWeight: '800' }}>✕</Text>
                </TouchableOpacity>
              </View>

              <View
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: 18,
                  padding: 18,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  marginBottom: 18,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E293B', lineHeight: 22 }}>
                  "{activeStory.storyContent || 'Chilling at the Adda ☕'}"
                </Text>
              </View>

              {/* Floating Story Reactions */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingTop: 6 }}>
                {['❤️', '🔥', '😂', '👏', '👀'].map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    onPress={() => {
                      setToastMessage(`Sent ${emoji} to ${activeStory.name}! ✨`);
                      setTimeout(() => setToastMessage(null), 2000);
                      setActiveStory(null);
                    }}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: '#EEF2FF',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        visible={Boolean(deletingPostId)}
        title={isKn ? 'ಪೋಸ್ಟ್ ಅಳಿಸಬೇಕೆ?' : 'Delete Buzz Post?'}
        message={isKn ? 'ಈ ಪೋಸ್ಟ್ ಅನ್ನು ಅಡ್ಡದಿಂದ ಶಾಶ್ವತವಾಗಿ ತೆಗೆದುಹಾಕಲಾಗುತ್ತದೆ.' : 'This post will be permanently deleted from the circle feed.'}
        confirmText={isKn ? 'ಅಳಿಸಿ' : 'Delete'}
        cancelText={isKn ? 'ರದ್ದು' : 'Cancel'}
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingPostId(null)}
      />

      {/* Report Modal */}
      <ReportModal
        visible={Boolean(reportingPostId)}
        isKn={isKn}
        submitting={isSubmittingReport}
        reason={reportReason}
        details={reportDetails}
        onSelectReason={setReportReason}
        onChangeDetails={setReportDetails}
        onSubmit={handleSubmitReport}
        onClose={() => setReportingPostId(null)}
      />
    </MainLayout>
  );
}

// ---------------------------------------------------------------------
// MODERN BUZZ CARD COMPONENT (SCREENSHOT 1 & SCREENSHOT 5 REFINEMENT)
// ---------------------------------------------------------------------
function ModernBuzzCard({
  post,
  isKn,
  currentUserId,
  onReact,
  onVote,
  onBookmark,
  onComment,
  onShare,
  onDelete,
  onReport,
}: {
  post: BuzzPost;
  isKn: boolean;
  currentUserId?: string;
  onReact: (emoji: string) => void;
  onVote: (optionId: string) => void;
  onBookmark: () => void;
  onComment: () => void;
  onShare: () => void;
  onDelete: () => void;
  onReport: () => void;
}) {
  const isAuthor = currentUserId === post.authorId;
  const timeAgo = formatTimeAgo(post.createdAt, isKn);

  // Total reactions count for summary
  const totalReactionsCount = Object.values(post.reactions || {}).reduce(
    (acc, c) => acc + (Number(c) || 0),
    0,
  );

  return (
    <GlassCard elevated style={{ padding: 18, borderRadius: 24, borderWidth: 1.5, borderColor: '#F1F5F9' }}>
      {/* Header: Author & Credibility Tag */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: post.isAnonymous ? '#FAF5FF' : '#EEF2FF',
              borderWidth: 1.5,
              borderColor: post.isAnonymous ? '#E9D5FF' : '#C7D2FE',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 18 }}>
              {post.isAnonymous ? '🦍' : '👤'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 14, fontWeight: '900', color: post.isAnonymous ? '#7E22CE' : '#0F172A' }}>
                {post.authorName}
              </Text>
              {post.isAnonymous && (
                <View style={{ backgroundColor: '#FAF5FF', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 9999 }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#9333EA' }}>ANON</Text>
                </View>
              )}
            </View>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#94A3B8' }}>
              {timeAgo} · {post.addaName || 'Private circle'}
            </Text>
          </View>
        </View>

        {/* Action Trigger */}
        <TouchableOpacity
          onPress={isAuthor ? onDelete : onReport}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ padding: 4 }}
        >
          <Text style={{ fontSize: 14, color: '#94A3B8' }}>{isAuthor ? '🗑️' : '🚩'}</Text>
        </TouchableOpacity>
      </View>

      {/* Main Quote / Headline (Screenshot 1: "Apparently, something crazy happened in college today...") */}
      <Text
        style={{
          fontSize: 16,
          fontWeight: '800',
          color: '#0F172A',
          lineHeight: 23,
          marginBottom: 8,
        }}
      >
        "{post.content}"
      </Text>

      {/* Link Preview (if present) */}
      {Boolean(post.linkPreview) && (
        <TouchableOpacity
          onPress={() => {
            if (Platform.OS === 'web' && post.linkPreview?.url) {
              window.open(post.linkPreview.url, '_blank');
            }
          }}
          activeOpacity={0.8}
          style={{
            backgroundColor: '#F8FAFC',
            borderRadius: 14,
            padding: 12,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            marginBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: '#0284C7' }}>
              🔗 {post.linkPreview?.siteName?.toUpperCase() || 'ARTICLE'}
            </Text>
            <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '700', color: '#0F172A', marginTop: 2 }}>
              {post.linkPreview?.title || post.linkPreview?.url}
            </Text>
          </View>
          <Text style={{ fontSize: 16, color: '#6366F1' }}>↗</Text>
        </TouchableOpacity>
      )}

      {/* Interactive Polls (Screenshot 5 Style: Option rows with real progress %, voter count, expires in 2d) */}
      {Array.isArray(post.pollOptions) && post.pollOptions.length > 0 && (
        <View style={{ marginBottom: 12, gap: 8 }}>
          {(() => {
            const totalVotes = post.pollOptions.reduce((acc, opt) => acc + (opt.votesCount || 0), 0);
            return (
              <>
                {post.pollOptions.map((opt) => {
                  const hasVotedThis = currentUserId ? (opt.voterIds || []).includes(currentUserId) : false;
                  const pct = totalVotes > 0 ? Math.round(((opt.votesCount || 0) / totalVotes) * 100) : 0;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => onVote(opt.id)}
                      activeOpacity={0.75}
                      style={{
                        position: 'relative',
                        backgroundColor: '#FFFFFF',
                        borderWidth: 1.5,
                        borderColor: hasVotedThis ? '#6366F1' : '#E2E8F0',
                        borderRadius: 14,
                        paddingVertical: 10,
                        paddingHorizontal: 14,
                        overflow: 'hidden',
                      }}
                    >
                      <View
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: `${pct}%`,
                          backgroundColor: hasVotedThis ? '#EEF2FF' : '#F1F5F9',
                        }}
                      />
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                          {hasVotedThis && <Text style={{ fontSize: 13, color: '#6366F1', fontWeight: '900' }}>✓</Text>}
                          <Text style={{ fontSize: 13, fontWeight: hasVotedThis ? '800' : '600', color: '#0F172A' }}>
                            {opt.text}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 12, fontWeight: '800', color: hasVotedThis ? '#6366F1' : '#64748B' }}>
                          {pct}%
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#94A3B8' }}>
                    👥 {totalVotes} {isKn ? 'ಒಟ್ಟು ಮತಗಳು' : 'votes'} · {isKn ? 'ಮುಕ್ತಾಯಕ್ಕೆ 2 ದಿನ' : 'Expires in 2d'}
                  </Text>
                </View>
              </>
            );
          })()}
        </View>
      )}

      {/* Metadata Row (Screenshot 1: "12 reactions · 8 comments      2 min ago") */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 4,
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          marginTop: 2,
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B' }}>
          {totalReactionsCount} {isKn ? 'ಪ್ರತಿಕ್ರಿಯೆಗಳು' : 'reactions'} · {post.commentsCount || 0} {isKn ? 'ಕಾಮೆಂಟ್‌ಗಳು' : 'comments'}
        </Text>
        <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600' }}>
          {timeAgo}
        </Text>
      </View>

      {/* Reaction Buttons & Comment Bar (Screenshot 1: "😂 8  👀 3  🍿 6      Comment") */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: '#F8FAFC',
        }}
      >
        {/* Top Reactions Emojis */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {REACTION_EMOJIS.map((emoji) => {
            const count = post.reactions?.[emoji] || 0;
            const userReacted = (post.userReactions || []).includes(emoji);
            return (
              <TouchableOpacity
                key={emoji}
                onPress={() => onReact(emoji)}
                activeOpacity={0.6}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 3,
                  paddingHorizontal: 7,
                  paddingVertical: 4,
                  borderRadius: 9999,
                  backgroundColor: userReacted ? '#EEF2FF' : '#F8FAFC',
                  borderWidth: 1,
                  borderColor: userReacted ? '#C7D2FE' : '#E2E8F0',
                }}
              >
                <Text style={{ fontSize: 13 }}>{emoji}</Text>
                {count > 0 && (
                  <Text style={{ fontSize: 11, fontWeight: '800', color: userReacted ? '#6366F1' : '#475569' }}>
                    {count}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Comment Action */}
        <TouchableOpacity
          onPress={onComment}
          activeOpacity={0.7}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 9999,
            backgroundColor: '#F1F5F9',
          }}
        >
          <Text style={{ fontSize: 12 }}>💬</Text>
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#334155' }}>
            {isKn ? 'ಕಾಮೆಂಟ್' : 'Comment'}
          </Text>
        </TouchableOpacity>
      </View>
    </GlassCard>
  );
}

// ---------------------------------------------------------------------
// REPORT INAPPROPRIATE CONTENT MODAL
// ---------------------------------------------------------------------
function ReportModal({
  visible,
  isKn,
  submitting,
  reason,
  details,
  onSelectReason,
  onChangeDetails,
  onSubmit,
  onClose,
}: {
  visible: boolean;
  isKn: boolean;
  submitting: boolean;
  reason: string;
  details: string;
  onSelectReason: (r: string) => void;
  onChangeDetails: (d: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  const reasons = [
    { en: 'Harassment / Bullying', kn: 'ಕಿರುಕುಳ / ಹೀಯಾಳಿಕೆ' },
    { en: 'Private Info / Doxxing', kn: 'ಖಾಸಗಿ ಮಾಹಿತಿ ಸೋರಿಕೆ' },
    { en: 'Unverified Misinformation', kn: 'ದೃಢಪಡಿಸದ ಸುಳ್ಳು ಸುದ್ದಿ' },
    { en: 'Inappropriate Media', kn: 'ಆಕ್ಷೇಪಾರ್ಹ ಚಿತ್ರ/ವಿಡಿಯೋ' },
    { en: 'Spam / Scam', kn: 'ಸ್ಪ್ಯಾಮ್ / ವಂಚನೆ' },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 16,
        }}
      >
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 24,
            maxWidth: 420,
            width: '100%',
            padding: 24,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.15,
            shadowRadius: 24,
            elevation: 10,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A' }}>
            {isKn ? 'ಅನುಚಿತ ವಿಷಯ ವರದಿ ಮಾಡಿ' : 'Report Inappropriate Content'}
          </Text>
          <Text style={{ fontSize: 13, color: '#64748B', marginTop: 4, marginBottom: 14 }}>
            {isKn
              ? 'ನಿಮ್ಮ ಅಡ್ಡವನ್ನು ಸುರಕ್ಷಿತವಾಗಿರಿಸಲು ಸಹಾಯ ಮಾಡಿ.'
              : 'Help keep this Adda circle safe, respectful, and friendly.'}
          </Text>

          <View style={{ gap: 8, marginBottom: 14 }}>
            {reasons.map((item) => {
              const isSelected = reason === item.en;
              return (
                <TouchableOpacity
                  key={item.en}
                  onPress={() => onSelectReason(item.en)}
                  activeOpacity={0.7}
                  style={{
                    padding: 10,
                    borderRadius: 12,
                    backgroundColor: isSelected ? '#FEF2F2' : '#F8FAFC',
                    borderWidth: 1,
                    borderColor: isSelected ? '#FECACA' : '#E2E8F0',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: isSelected ? '800' : '600',
                      color: isSelected ? '#EF4444' : '#0F172A',
                    }}
                  >
                    {isKn ? item.kn : item.en}
                  </Text>
                  {isSelected && <Text style={{ fontSize: 14, color: '#EF4444' }}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            placeholder={isKn ? 'ಹೆಚ್ಚುವರಿ ವಿವರಣೆ (ಐಚ್ಛಿಕ)...' : 'Additional context (optional)...'}
            value={details}
            onChangeText={onChangeDetails}
            multiline
            numberOfLines={3}
            placeholderTextColor="#94A3B8"
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              padding: 12,
              fontSize: 13,
              color: '#0F172A',
              minHeight: 60,
              marginBottom: 16,
            }}
          />

          <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>
            <SecondaryButton title={isKn ? 'ರದ್ದು' : 'Cancel'} onPress={onClose} />
            <PrimaryButton
              title={submitting ? (isKn ? 'ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ...' : 'Submitting...') : isKn ? 'ವರದಿ ಸಲ್ಲಿಸಿ' : 'Submit Report'}
              variant="rose"
              onPress={onSubmit}
              disabled={submitting}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function formatTimeAgo(dateString: string, isKn: boolean): string {
  const diffSec = Math.max(1, Math.floor((Date.now() - new Date(dateString).getTime()) / 1000));
  if (diffSec < 60) return isKn ? 'ಈಗಷ್ಟೇ' : 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return isKn ? `${diffMin}ನಿ ಹಿಂದೆ` : `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return isKn ? `${diffHr}ಗಂ ಹಿಂದೆ` : `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return isKn ? `${diffDays} ದಿನಗಳ ಹಿಂದೆ` : `${diffDays}d ago`;
}
