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
  InputField,
  ToastNotification,
  ConfirmationDialog,
  LoadingState,
  DS_TOKENS,
} from '../../src/components/DesignSystem';

const SCREEN_WIDTH = Dimensions.get('window').width;

const REACTION_EMOJIS = ['😂', '👀', '🍿', '☕', '🔥', '💀', '❤️'];

const CIRCLE_STORIES: Array<{ id: string; name: string; avatar: string; mood: string; isMe: boolean; hasUnread?: boolean }> = [
  { id: 'st_my', name: 'My Story', avatar: '✨', mood: 'LIVE', isMe: true, hasUnread: false },
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
  const { user: currentUser, updateLanguage, updateProfile, logout } = useAuthStore();
  const isKn = i18n.language === 'kn';

  const [addas, setAddas] = useState<any[]>([]);
  const [selectedAddaId, setSelectedAddaId] = useState<string>(params.addaId || 'default');
  const [selectedCategory, setSelectedCategory] = useState<BuzzCategory>(BuzzCategory.ALL);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'trending' | 'saved'>('all');

  const [posts, setPosts] = useState<BuzzPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Profile Modal & Edit States
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState(currentUser?.displayName || '');
  const [editBio, setEditBio] = useState(currentUser?.bio || '');
  const [editDistrict, setEditDistrict] = useState(currentUser?.district || 'Bengaluru Urban');
  const [savingProfile, setSavingProfile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setEditDisplayName(currentUser.displayName || currentUser.username || '');
      setEditBio(currentUser.bio || '');
      setEditDistrict(currentUser.district || 'Bengaluru Urban');
    }
  }, [currentUser]);

  const handleToggleLanguage = async () => {
    const nextLang = isKn ? 'en' : 'kn';
    await updateLanguage(nextLang);
    setToastMessage(nextLang === 'kn' ? 'ಭಾಷೆಯನ್ನು ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಲಾಗಿದೆ 🌐' : 'Language changed to English 🌐');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveProfile = async () => {
    if (!editDisplayName.trim()) {
      setToastMessage(isKn ? 'ಹೆಸರನ್ನು ಖಾಲಿ ಬಿಡುವಂತಿಲ್ಲ' : 'Display name cannot be empty');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    try {
      setSavingProfile(true);
      await updateProfile({
        displayName: editDisplayName.trim(),
        bio: editBio.trim(),
        district: editDistrict.trim(),
      });
      setIsEditingProfile(false);
      setToastMessage(isKn ? 'ಪ್ರೊಫೈಲ್ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ! ✨' : 'Profile updated successfully! ✨');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (e: any) {
      setToastMessage(e.message || (isKn ? 'ನವೀಕರಣ ವಿಫಲವಾಗಿದೆ' : 'Failed to update profile'));
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleConfirmLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
      setShowProfileModal(false);
      setShowLogoutConfirm(false);
      router.replace('/(auth)/login');
    } catch (e) {
      console.error(e);
    } finally {
      setLoggingOut(false);
    }
  };

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

        {/* Right Action: "+ Buzz" Create Button (No profile icon in header; dedicated 4th tab is Profile) */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            onPress={() => router.push('/buzz/create' as any)}
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
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <Text style={{ fontSize: 14 }}>✏️</Text>
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#4F46E5' }}>
              {isKn ? '+ ಬಜ್' : '+ Buzz'}
            </Text>
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
            setToastMessage(isKn ? 'ಟೀ ಕುಡಿತಾ ಹರಟೆ ಸಕ್ರಿಯ ☕' : 'Spill the Tea active ☕');
            setTimeout(() => setToastMessage(null), 2500);
          }}
          activeOpacity={0.85}
          style={{
            width: '48%',
            height: 124,
            borderRadius: 22,
            backgroundColor: '#27204A',
            padding: 14,
            justifyContent: 'space-between',
            borderWidth: selectedCategory === BuzzCategory.SPILL_THE_TEA ? 2.5 : 0,
            borderColor: '#FFFFFF',
            shadowColor: '#27204A',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.22,
            shadowRadius: 12,
            elevation: 5,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
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
            {selectedCategory === BuzzCategory.SPILL_THE_TEA && (
              <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.22)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 9999 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800' }}>✓ Active</Text>
              </View>
            )}
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
            setToastMessage(isKn ? 'ಎಲ್ಲಾ ಹರಟೆಗಳು & ಬಜ್ 📰' : 'All Buzz Feed active 📰');
            setTimeout(() => setToastMessage(null), 2500);
          }}
          activeOpacity={0.85}
          style={{
            width: '48%',
            height: 124,
            borderRadius: 22,
            backgroundColor: '#FF6464',
            padding: 14,
            justifyContent: 'space-between',
            borderWidth: selectedCategory === BuzzCategory.ALL && selectedFilter === 'all' ? 2.5 : 0,
            borderColor: '#FFFFFF',
            shadowColor: '#FF6464',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.22,
            shadowRadius: 12,
            elevation: 5,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
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
            {selectedCategory === BuzzCategory.ALL && selectedFilter === 'all' && (
              <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.25)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 9999 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800' }}>✓ Active</Text>
              </View>
            )}
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
            const next = selectedFilter === 'trending' ? 'all' : 'trending';
            setSelectedFilter(next);
            setToastMessage(next === 'trending' ? (isKn ? 'ಹಾಟ್ ಟಾಪಿಕ್ಸ್ & ಟ್ರೆಂಡಿಂಗ್ 🔥' : 'Trending topics active 🔥') : (isKn ? 'ಎಲ್ಲಾ ಪೋಸ್ಟ್‌ಗಳು 🌟' : 'All circle posts 🌟'));
            setTimeout(() => setToastMessage(null), 2500);
          }}
          activeOpacity={0.85}
          style={{
            width: '48%',
            height: 124,
            borderRadius: 22,
            backgroundColor: '#D4FF32',
            padding: 14,
            justifyContent: 'space-between',
            borderWidth: selectedFilter === 'trending' ? 2.5 : 0,
            borderColor: '#0F172A',
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.12,
            shadowRadius: 12,
            elevation: 5,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
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
            {selectedFilter === 'trending' && (
              <View style={{ backgroundColor: 'rgba(0, 0, 0, 0.14)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 9999 }}>
                <Text style={{ color: '#0F172A', fontSize: 10, fontWeight: '800' }}>✓ Active</Text>
              </View>
            )}
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
            setToastMessage(isKn ? 'ಮತದಾನ & ತೀರ್ಪು ಸಕ್ರಿಯ 🗳️' : 'Tribunal & Polls active 🗳️');
            setTimeout(() => setToastMessage(null), 2500);
          }}
          activeOpacity={0.85}
          style={{
            width: '48%',
            height: 124,
            borderRadius: 22,
            backgroundColor: '#EDE9FE',
            padding: 14,
            justifyContent: 'space-between',
            borderWidth: selectedCategory === BuzzCategory.POLL_HOT_TAKE ? 2.5 : 1,
            borderColor: selectedCategory === BuzzCategory.POLL_HOT_TAKE ? '#4338CA' : '#DDD6FE',
            shadowColor: '#8B5CF6',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 10,
            elevation: 3,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
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
            {selectedCategory === BuzzCategory.POLL_HOT_TAKE && (
              <View style={{ backgroundColor: '#4338CA', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 9999 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800' }}>✓ Active</Text>
              </View>
            )}
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
        <GlassCard style={{ padding: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 24 }}>
          <Text style={{ fontSize: 44, marginBottom: 10 }}>
            {selectedCategory === BuzzCategory.SPILL_THE_TEA
              ? '☕'
              : selectedCategory === BuzzCategory.POLL_HOT_TAKE
              ? '🗳️'
              : selectedFilter === 'trending'
              ? '🔥'
              : selectedCategory === BuzzCategory.CONFESSION
              ? '👀'
              : '✨'}
          </Text>
          <Text style={{ fontSize: 17, fontWeight: '900', color: '#0F172A', textAlign: 'center' }}>
            {selectedCategory === BuzzCategory.SPILL_THE_TEA
              ? (isKn ? 'ಯಾವುದೇ ಟೀ ಹರಟೆ ಇಲ್ಲ ☕' : 'No tea spilled yet ☕')
              : selectedCategory === BuzzCategory.POLL_HOT_TAKE
              ? (isKn ? 'ಯಾವುದೇ ಮತದಾನ ಅಥವಾ ತೀರ್ಪುಗಳಿಲ್ಲ 🗳️' : 'No verdict or polls active 🗳️')
              : selectedFilter === 'trending'
              ? (isKn ? 'ಯಾವುದೇ ಟ್ರೆಂಡಿಂಗ್ ವಿಷಯಗಳಿಲ್ಲ 🔥' : 'No trending topics yet 🔥')
              : selectedCategory === BuzzCategory.CONFESSION
              ? (isKn ? 'ಯಾವುದೇ ಕನ್ಫೆಷನ್‌ಗಳಿಲ್ಲ 👀' : 'No anonymous confessions yet 👀')
              : (isKn ? 'ಯಾವುದೇ ಬಜ್ ಪೋಸ್ಟ್‌ಗಳಿಲ್ಲ' : 'No circle buzz right now')}
          </Text>
          <Text style={{ fontSize: 12, fontWeight: '500', color: '#64748B', textAlign: 'center', marginTop: 6, maxWidth: 320, lineHeight: 18 }}>
            {selectedCategory === BuzzCategory.SPILL_THE_TEA
              ? (isKn ? 'ನಿಮ್ಮ ಸ್ನೇಹಿತರ ವೃತ್ತದಲ್ಲಿ ಮೊದಲ ಗೋಸಿಪ್ ಅಥವಾ ಅನಿರೀಕ್ಷಿತ ಕಥೆ ಹಂಚಿಕೊಳ್ಳಿ!' : 'Be the first one in your circle to spill fresh gossip or funny incidents!')
              : selectedCategory === BuzzCategory.POLL_HOT_TAKE
              ? (isKn ? 'ಸ್ನೇಹಿತರ ಅಭಿಪ್ರಾಯ ತಿಳಿಯಲು ಹೊಸ ಮತದಾನ ಆರಂಭಿಸಿ!' : 'Put gossip to vote! Ask your friends to decide the verdict.')
              : selectedFilter === 'trending'
              ? (isKn ? 'ಹೆಚ್ಚು ಪ್ರತಿಕ್ರಿಯೆ ಪಡೆದ ಪೋಸ್ಟ್‌ಗಳು ಇಲ್ಲಿ ಕಾಣಿಸಿಕೊಳ್ಳುತ್ತವೆ.' : 'Posts with high reactions and discussions will appear here!')
              : selectedCategory === BuzzCategory.CONFESSION
              ? (isKn ? 'ಅನಾಮಧೇಯವಾಗಿ ನಿಮ್ಮ ರಹಸ್ಯ ಕನ್ಫೆಷನ್ ಹಂಚಿಕೊಳ್ಳಿ.' : 'Drop an anonymous confession safely without revealing your identity.')
              : (isKn ? 'ಮೊದಲ ಹರಟೆ ಅಥವಾ ಮತದಾನ ಆರಂಭಿಸಿ!' : 'Start the tea, drop a hot take poll, or share circle news!')}
          </Text>
          <PrimaryButton
            title={
              selectedCategory === BuzzCategory.SPILL_THE_TEA
                ? (isKn ? '+ ಟೀ ಹರಟೆ ಹಂಚಿಕೊಳ್ಳಿ ☕' : '+ Spill the Tea ☕')
                : selectedCategory === BuzzCategory.POLL_HOT_TAKE
                ? (isKn ? '+ ಹೊಸ ಪೋಲ್ ರಚಿಸಿ 🗳️' : '+ Create a Poll 🗳️')
                : selectedFilter === 'trending'
                ? (isKn ? '+ ಹಾಟ್ ಟಾಪಿಕ್ ಆರಂಭಿಸಿ 🔥' : '+ Start Hot Topic 🔥')
                : selectedCategory === BuzzCategory.CONFESSION
                ? (isKn ? '+ ಕನ್ಫೆಷನ್ ಬರೆಯಿರಿ 👀' : '+ Write Confession 👀')
                : (isKn ? '+ ಹೊಸ ಬಜ್ ಪೋಸ್ಟ್ ಮಾಡಿ 🚀' : '+ Start Buzz 🚀')
            }
            style={{ marginTop: 16 }}
            onPress={() => {
              const targetCat =
                selectedCategory === BuzzCategory.ALL
                  ? selectedFilter === 'trending'
                    ? BuzzCategory.HOT_TAKE
                    : BuzzCategory.SPILL_THE_TEA
                  : selectedCategory;
              router.push(`/buzz/create?category=${targetCat}&addaId=${selectedAddaId}` as any);
            }}
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
              currentUserName={currentUser?.displayName || currentUser?.username}
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

      {/* QUICK PROFILE & LANGUAGE MODAL SHEET */}
      <Modal visible={showProfileModal} transparent animationType="slide">
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowProfileModal(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            justifyContent: 'flex-end',
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 20,
              maxHeight: '85%',
              borderWidth: 1.5,
              borderColor: '#E2E8F0',
            }}
          >
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: '#6366F1',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 20, color: '#FFFFFF', fontWeight: '900' }}>
                    {(currentUser?.displayName || currentUser?.username || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#0F172A' }}>
                    {currentUser?.displayName || currentUser?.username || 'User'}
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748B' }}>
                    @{currentUser?.username || 'member'} · 📍 {currentUser?.district || 'Bengaluru Urban'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowProfileModal(false)}>
                <Text style={{ fontSize: 20, color: '#94A3B8', fontWeight: '800' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {/* SECTION 1: LANGUAGE SWITCHER */}
              <View
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: 18,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  marginBottom: 14,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A' }}>
                      🌐 {isKn ? 'ಅಪ್ಲಿಕೇಶನ್ ಭಾಷೆ' : 'Application Language'}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2, fontWeight: '600' }}>
                      {isKn ? 'ಪ್ರಸ್ತುತ: ಕನ್ನಡ (KN)' : 'Current: English (EN)'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleToggleLanguage}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: '#EEF2FF',
                      borderWidth: 1.5,
                      borderColor: '#818CF8',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 9999,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#4F46E5' }}>
                      {isKn ? 'Switch to English' : 'ಕನ್ನಡಕ್ಕೆ ಬದಲಿಸಿ'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* SECTION 2: EDIT PROFILE */}
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 18,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  marginBottom: 14,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A' }}>
                    👤 {isKn ? 'ಪ್ರೊಫೈಲ್ ಮಾಹಿತಿ' : 'Profile Information'}
                  </Text>
                  {!isEditingProfile && (
                    <TouchableOpacity
                      onPress={() => setIsEditingProfile(true)}
                      style={{
                        backgroundColor: '#F1F5F9',
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 9999,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#334155' }}>
                        ✏️ {isKn ? 'ಸಂಪಾದಿಸಿ' : 'Edit'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {isEditingProfile ? (
                  <View style={{ gap: 10 }}>
                    <InputField
                      label={isKn ? 'ಪ್ರದರ್ಶನ ಹೆಸರು' : 'Display Name'}
                      value={editDisplayName}
                      onChangeText={setEditDisplayName}
                      placeholder={isKn ? 'ನಿಮ್ಮ ಹೆಸರು' : 'Your name'}
                    />
                    <InputField
                      label={isKn ? 'ಜಿಲ್ಲೆ / ಊರು' : 'District / Town'}
                      value={editDistrict}
                      onChangeText={setEditDistrict}
                      placeholder="e.g. Bengaluru, Mysuru, Mangaluru"
                    />
                    <InputField
                      label={isKn ? 'ಬಯೋ / ಸ್ಟೇಟಸ್' : 'Bio / Status Note'}
                      value={editBio}
                      onChangeText={setEditBio}
                      placeholder={isKn ? 'ನಿಮ್ಮ ಬಗ್ಗೆ ಚಿಕ್ಕ ವಿವರ...' : 'A brief note about yourself...'}
                    />
                    <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                      <SecondaryButton
                        title={isKn ? 'ರದ್ದು' : 'Cancel'}
                        onPress={() => setIsEditingProfile(false)}
                      />
                      <PrimaryButton
                        title={savingProfile ? (isKn ? 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...' : 'Saving...') : (isKn ? 'ಉಳಿಸಿ' : 'Save Changes')}
                        onPress={handleSaveProfile}
                        disabled={savingProfile}
                      />
                    </View>
                  </View>
                ) : (
                  <View style={{ gap: 4 }}>
                    <Text style={{ fontSize: 12, color: '#64748B' }}>
                      <Text style={{ fontWeight: '700', color: '#0F172A' }}>{isKn ? 'ಹೆಸರು: ' : 'Name: '}</Text>
                      {currentUser?.displayName || currentUser?.username || 'User'}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#64748B' }}>
                      <Text style={{ fontWeight: '700', color: '#0F172A' }}>{isKn ? 'ಜಿಲ್ಲೆ: ' : 'District: '}</Text>
                      {currentUser?.district || 'Bengaluru Urban'}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#64748B' }}>
                      <Text style={{ fontWeight: '700', color: '#0F172A' }}>{isKn ? 'ಬಯೋ: ' : 'Bio: '}</Text>
                      {currentUser?.bio || (isKn ? 'ಇನ್ನೂ ವಿವರಣೆ ಸೇರಿಸಿಲ್ಲ' : 'No bio added yet')}
                    </Text>
                  </View>
                )}
              </View>

              {/* SECTION 3: MORE ACTIONS (Full Profile Link + Logout) */}
              <View style={{ gap: 8 }}>
                <TouchableOpacity
                  onPress={() => {
                    setShowProfileModal(false);
                    router.push('/(tabs)/profile');
                  }}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 12,
                    borderRadius: 14,
                    backgroundColor: '#F8FAFC',
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155' }}>
                    ⚙️ {isKn ? 'ಪೂರ್ಣ ಪ್ರೊಫೈಲ್ ಮತ್ತು ಸೆಟ್ಟಿಂಗ್ಸ್' : 'Full Account & Profile Settings'}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#94A3B8', fontWeight: '800' }}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowLogoutConfirm(true)}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: 12,
                    borderRadius: 14,
                    backgroundColor: '#FEF2F2',
                    borderWidth: 1,
                    borderColor: '#FECACA',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#EF4444' }}>
                    🚪 {isKn ? 'ಖಾತೆಯಿಂದ ಲಾಗ್ ಔಟ್' : 'Sign Out of Account'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* LOGOUT CONFIRMATION DIALOG */}
      <ConfirmationDialog
        visible={showLogoutConfirm}
        title={isKn ? 'ಖಾತೆಯಿಂದ ನಿರ್ಗಮಿಸಬೇಕೆ?' : 'Sign out of your account?'}
        message={
          isKn
            ? 'ನಿಮ್ಮ ಖಾತೆಯಿಂದ ಲಾಗ್ ಔಟ್ ಆಗಲು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ?'
            : 'Are you sure you want to log out? You can sign right back in anytime using your credentials.'
        }
        confirmText={loggingOut ? (isKn ? 'ನಿರ್ಗಮಿಸಲಾಗುತ್ತಿದೆ...' : 'Signing out...') : (isKn ? 'ಲಾಗ್ ಔಟ್' : 'Log Out')}
        cancelText={isKn ? 'ರದ್ದು' : 'Cancel'}
        destructive
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
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
  currentUserName,
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
  currentUserName?: string;
  onReact: (emoji: string) => void;
  onVote: (optionId: string) => void;
  onBookmark: () => void;
  onComment: () => void;
  onShare: () => void;
  onDelete: () => void;
  onReport: () => void;
}) {
  const isAuthor =
    currentUserId === post.authorId ||
    post.authorId === 'usr_me' ||
    post.authorName === 'You' ||
    (Boolean(currentUserName) && post.authorName === currentUserName);
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

        {/* Action Trigger (Delete for Author, Report for Others) */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {isAuthor ? (
            <TouchableOpacity
              onPress={onDelete}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: '#FEF2F2',
                borderWidth: 1,
                borderColor: '#FECACA',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 9999,
              }}
            >
              <Text style={{ fontSize: 12 }}>🗑️</Text>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#EF4444' }}>
                {isKn ? 'ಅಳಿಸಿ' : 'Delete'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={onReport}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ padding: 4 }}
            >
              <Text style={{ fontSize: 14, color: '#94A3B8' }}>🚩</Text>
            </TouchableOpacity>
          )}
        </View>
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
