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
  ActivityIndicator,
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

const CATEGORY_ITEMS: Array<{ key: BuzzCategory; labelEn: string; labelKn: string; icon: string }> = [
  { key: BuzzCategory.ALL, labelEn: 'All Buzz', labelKn: 'ಎಲ್ಲಾ ಬಜ್', icon: '🌟' },
  { key: BuzzCategory.SPILL_THE_TEA, labelEn: 'Spill the Tea', labelKn: 'ಟೀ ಕುಡಿತಾ ಹರಟೆ', icon: '☕' },
  { key: BuzzCategory.NEWS, labelEn: 'News & Links', labelKn: 'ಸುದ್ದಿ & ಲಿಂಕ್ಸ್', icon: '📰' },
  { key: BuzzCategory.OORU_UPDATES, labelEn: 'Ooru Updates', labelKn: 'ಊರು ಅಪ್‌ಡೇಟ್ಸ್', icon: '🏙️' },
  { key: BuzzCategory.COLLEGE_RADAR, labelEn: 'College Radar', labelKn: 'ಕಾಲೇಜು ರೇಡಾರ್', icon: '🎓' },
  { key: BuzzCategory.POLL_HOT_TAKE, labelEn: 'Polls & Hot Takes', labelKn: 'ಮತದಾನ & ಚರ್ಚೆ', icon: '🔥' },
  { key: BuzzCategory.CONFESSION, labelEn: 'Confession Corner', labelKn: 'ಕನ್ಫೆಷನ್ ಕಾರ್ನರ್', icon: '🤫' },
];

const REACTION_EMOJIS = ['😂', '👀', '🍿', '☕', '🔥', '💀', '❤️'];

export default function BuzzFeedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ addaId?: string }>();
  const { t, i18n } = useTranslation();
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

  // Reactions
  const handleToggleReaction = async (postId: string, emoji: string) => {
    try {
      // Optimistic update
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

  // Copy share link
  const handleSharePost = (post: BuzzPost) => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/buzz/${post.id}`);
    }
    setToastMessage(isKn ? 'ಪೋಸ್ಟ್ ಲಿಂಕ್ ನಕಲಿಸಲಾಗಿದೆ!' : 'Circle link copied to clipboard!');
    setTimeout(() => setToastMessage(null), 2000);
  };

  const currentAddaName = addas.find((a) => a.id === selectedAddaId)?.name || 'Chai Adda 🔥';

  return (
    <MainLayout>
      <ToastNotification
        visible={Boolean(toastMessage)}
        message={toastMessage || ''}
        onDismiss={() => setToastMessage(null)}
      />

      {/* Top Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: DS_TOKENS.colors.textPrimary }}>
              {isKn ? 'ಅಡ್ಡ ಬಜ್' : 'ADDA BUZZ'}
            </Text>
            <View
              style={{
                backgroundColor: DS_TOKENS.colors.purpleLight,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: DS_TOKENS.radii.pill,
                borderWidth: 1,
                borderColor: DS_TOKENS.colors.purpleBorder,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '800',
                  color: DS_TOKENS.colors.purple,
                  letterSpacing: 0.5,
                }}
              >
                LIVE CIRCLE
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 13, color: DS_TOKENS.colors.textSecondary, fontWeight: '500', marginTop: 2 }}>
            {isKn ? `${currentAddaName} ಖಾಸಗಿ ಹರಟೆ ಮತ್ತು ಸುದ್ದಿ` : `Private social feed for ${currentAddaName}`}
          </Text>
        </View>

        {/* Post Buzz Action Button */}
        <TouchableOpacity
          onPress={() => router.push('/buzz/create' as any)}
          style={{
            backgroundColor: DS_TOKENS.colors.purple,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: DS_TOKENS.radii.pill,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            shadowColor: '#6366F1',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 10,
            elevation: 4,
          }}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 16 }}>✨</Text>
          <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>
            {isKn ? 'ಹೊಸ ಬಜ್ ಪೋಸ್ಟ್' : 'Post Buzz'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Circle Selector Chips (if user belongs to multiple Addas) */}
      {addas.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 10 }}
        >
          {addas.map((adda) => {
            const isSelected = adda.id === selectedAddaId;
            return (
              <TouchableOpacity
                key={adda.id}
                onPress={() => setSelectedAddaId(adda.id)}
                activeOpacity={0.7}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: DS_TOKENS.radii.pill,
                  backgroundColor: isSelected ? DS_TOKENS.colors.purple : '#FFFFFF',
                  borderWidth: 1.5,
                  borderColor: isSelected ? DS_TOKENS.colors.purple : DS_TOKENS.colors.borderSubtle,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: isSelected ? '800' : '600',
                    color: isSelected ? '#FFFFFF' : DS_TOKENS.colors.textPrimary,
                  }}
                >
                  🛖 {adda.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Feed Filters: Latest vs Trending vs Saved */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
          backgroundColor: DS_TOKENS.colors.bgSecondary,
          padding: 4,
          borderRadius: DS_TOKENS.radii.md,
          borderWidth: 1,
          borderColor: DS_TOKENS.colors.borderSubtle,
          alignSelf: 'flex-start',
        }}
      >
        {[
          { key: 'all', labelEn: 'Latest Feed ⚡', labelKn: 'ಇತ್ತೀಚಿನ ⚡' },
          { key: 'trending', labelEn: 'Trending in Circle 🔥', labelKn: 'ಟ್ರೆಂಡಿಂಗ್ 🔥' },
          { key: 'saved', labelEn: 'Saved 🔖', labelKn: 'ಉಳಿಸಿದವು 🔖' },
        ].map((tab) => {
          const isActive = selectedFilter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setSelectedFilter(tab.key as any)}
              activeOpacity={0.7}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: DS_TOKENS.radii.sm,
                backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: isActive ? 0.08 : 0,
                shadowRadius: 3,
                elevation: isActive ? 2 : 0,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: isActive ? '800' : '600',
                  color: isActive ? DS_TOKENS.colors.purple : DS_TOKENS.colors.textSecondary,
                }}
              >
                {isKn ? tab.labelKn : tab.labelEn}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Categories Horizontal Scroller */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 14 }}
      >
        {CATEGORY_ITEMS.map((cat) => {
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
                borderRadius: DS_TOKENS.radii.pill,
                backgroundColor: isSelected ? DS_TOKENS.colors.purpleLight : '#FFFFFF',
                borderWidth: 1.5,
                borderColor: isSelected ? DS_TOKENS.colors.purple : DS_TOKENS.colors.borderSubtle,
              }}
            >
              <Text style={{ fontSize: 14 }}>{cat.icon}</Text>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: isSelected ? '800' : '600',
                  color: isSelected ? DS_TOKENS.colors.purple : DS_TOKENS.colors.textSecondary,
                }}
              >
                {isKn ? cat.labelKn : cat.labelEn}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Posts Feed */}
      {loading ? (
        <LoadingState message={isKn ? 'ಬಜ್ ಪೋಸ್ಟ್‌ಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...' : 'Loading Adda Buzz feed...'} />
      ) : posts.length === 0 ? (
        <GlassCard style={{ padding: 32, alignItems: 'center', justifyContent: 'center', marginTop: 12 }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>✨</Text>
          <Text style={{ fontSize: 18, fontWeight: '800', color: DS_TOKENS.colors.textPrimary, textAlign: 'center' }}>
            {selectedFilter === 'saved'
              ? isKn
                ? 'ಯಾವುದೇ ಉಳಿಸಿದ ಪೋಸ್ಟ್‌ಗಳಿಲ್ಲ'
                : 'No bookmarked posts yet'
              : isKn
              ? 'ಈ ವಿಭಾಗದಲ್ಲಿ ಇನ್ನೂ ಯಾವುದೇ ಪೋಸ್ಟ್ ಇಲ್ಲ'
              : 'No buzz in this category yet'}
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: DS_TOKENS.colors.textSecondary,
              textAlign: 'center',
              marginTop: 6,
              maxWidth: 320,
            }}
          >
            {isKn
              ? 'ನಿಮ್ಮ ಅಡ್ಡ ಸದಸ್ಯರೊಂದಿಗೆ ಮೊದಲ ಸುದ್ದಿ ಅಥವಾ ಹರಟೆಯನ್ನು ಹಂಚಿಕೊಳ್ಳಿ!'
              : 'Be the first to spill the tea, drop campus news, or ask a hot take poll!'}
          </Text>
          <PrimaryButton
            title={isKn ? 'ಮೊದಲ ಬಜ್ ಪೋಸ್ಟ್ ಮಾಡಿ' : 'Start the Buzz 🚀'}
            style={{ marginTop: 16 }}
            onPress={() => router.push('/buzz/create' as any)}
          />
        </GlassCard>
      ) : (
        <View style={{ gap: 16, paddingBottom: 110 }}>
          {posts.map((post) => (
            <BuzzPostCard
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

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        visible={Boolean(deletingPostId)}
        title={isKn ? 'ಪೋಸ್ಟ್ ಅಳಿಸಬೇಕೆ?' : 'Delete Buzz Post?'}
        message={
          isKn
            ? 'ಈ ಪೋಸ್ಟ್ ಅನ್ನು ನಿಮ್ಮ ಅಡ್ಡದಿಂದ ಶಾಶ್ವತವಾಗಿ ತೆಗೆದುಹಾಕಲಾಗುತ್ತದೆ.'
            : 'This post and its reactions will be permanently deleted from this Adda circle.'
        }
        confirmText={isKn ? 'ಅಳಿಸಿ' : 'Delete'}
        cancelText={isKn ? 'ರದ್ದು' : 'Cancel'}
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingPostId(null)}
      />

      {/* Report Modal */}
      <RNReportModal
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
// BUZZ POST CARD COMPONENT
// ---------------------------------------------------------------------
function BuzzPostCard({
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

  // Credibility Badge Configuration
  const credibilityConfig = {
    [BuzzCredibility.VERIFIED_NEWS]: {
      labelEn: 'Verified News',
      labelKn: 'ಖಚಿತ ಸುದ್ದಿ',
      icon: '✓',
      bg: '#EFF6FF',
      border: '#BFDBFE',
      text: '#1D4ED8',
    },
    [BuzzCredibility.PERSONAL_EXPERIENCE]: {
      labelEn: 'Personal Experience',
      labelKn: 'ಸ್ವಂತ ಅನುಭವ',
      icon: '🗣️',
      bg: '#F0FDF4',
      border: '#BBF7D0',
      text: '#15803D',
    },
    [BuzzCredibility.UNVERIFIED_CLAIM]: {
      labelEn: 'Unverified Gossip',
      labelKn: 'ದೃಢಪಡಿಸದ ಮಾತು',
      icon: '⚠️',
      bg: '#FEF3C7',
      border: '#FDE68A',
      text: '#B45309',
    },
  }[post.credibility] || {
    labelEn: 'Personal Experience',
    labelKn: 'ಸ್ವಂತ ಅನುಭವ',
    icon: '🗣️',
    bg: '#F0FDF4',
    border: '#BBF7D0',
    text: '#15803D',
  };

  // Expiry Pill
  const expiryPill = post.expiresAt ? (
    <View
      style={{
        backgroundColor: '#FFF1F2',
        borderWidth: 1,
        borderColor: '#FECDD3',
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: DS_TOKENS.radii.pill,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
      }}
    >
      <Text style={{ fontSize: 10 }}>⏳</Text>
      <Text style={{ fontSize: 10, fontWeight: '700', color: '#BE123C' }}>
        {post.expiry === 'EXP_24H' ? '24h' : '48h'}
      </Text>
    </View>
  ) : null;

  return (
    <GlassCard elevated style={{ padding: 18 }}>
      {/* Header Row: Author, Circle, Credibility, Menu */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          {/* Avatar or Mask */}
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: post.isAnonymous ? '#F3E8FF' : DS_TOKENS.colors.purpleLight,
              borderWidth: 1.5,
              borderColor: post.isAnonymous ? '#D8B4FE' : DS_TOKENS.colors.purpleBorder,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 20 }}>{post.isAnonymous ? '🤫' : '👤'}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '800',
                  color: post.isAnonymous ? '#7E22CE' : DS_TOKENS.colors.textPrimary,
                }}
              >
                {post.authorName}
              </Text>
              {post.isTrending && (
                <View
                  style={{
                    backgroundColor: '#FEF3C7',
                    paddingHorizontal: 6,
                    paddingVertical: 1,
                    borderRadius: DS_TOKENS.radii.pill,
                    borderWidth: 1,
                    borderColor: '#FDE68A',
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#B45309' }}>
                    🔥 TRENDING
                  </Text>
                </View>
              )}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <Text style={{ fontSize: 12, color: DS_TOKENS.colors.textMuted }}>{timeAgo}</Text>
              <Text style={{ fontSize: 10, color: DS_TOKENS.colors.textMuted }}>•</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: DS_TOKENS.colors.purple }}>
                {post.addaName || 'Circle Adda'}
              </Text>
            </View>
          </View>
        </View>

        {/* Right tags & options */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {expiryPill}

          {/* Credibility Badge */}
          <View
            style={{
              backgroundColor: credibilityConfig.bg,
              borderWidth: 1,
              borderColor: credibilityConfig.border,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: DS_TOKENS.radii.pill,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Text style={{ fontSize: 11 }}>{credibilityConfig.icon}</Text>
            <Text style={{ fontSize: 11, fontWeight: '700', color: credibilityConfig.text }}>
              {isKn ? credibilityConfig.labelKn : credibilityConfig.labelEn}
            </Text>
          </View>

          {/* Action trigger: Delete or Report */}
          <TouchableOpacity
            onPress={isAuthor ? onDelete : onReport}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ padding: 4 }}
          >
            <Text style={{ fontSize: 14, color: DS_TOKENS.colors.textMuted }}>
              {isAuthor ? '🗑️' : '🚩'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Post Title */}
      {Boolean(post.title) && (
        <Text
          style={{
            fontSize: 17,
            fontWeight: '900',
            color: DS_TOKENS.colors.textPrimary,
            marginBottom: 6,
            lineHeight: 23,
          }}
        >
          {post.title}
        </Text>
      )}

      {/* Post Body Content */}
      <Text
        style={{
          fontSize: 14,
          lineHeight: 21,
          color: DS_TOKENS.colors.textSecondary,
          marginBottom: 12,
        }}
      >
        {post.content}
      </Text>

      {/* External Link Preview */}
      {Boolean(post.linkPreview) && (
        <TouchableOpacity
          onPress={() => {
            if (Platform.OS === 'web' && post.linkPreview?.url) {
              window.open(post.linkPreview.url, '_blank');
            }
          }}
          activeOpacity={0.8}
          style={{
            backgroundColor: DS_TOKENS.colors.bgSecondary,
            borderRadius: DS_TOKENS.radii.md,
            padding: 12,
            borderWidth: 1,
            borderColor: DS_TOKENS.colors.borderSubtle,
            marginBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: DS_TOKENS.colors.sky, letterSpacing: 0.5 }}>
              🔗 {post.linkPreview?.siteName?.toUpperCase() || 'ARTICLE'}
            </Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: DS_TOKENS.colors.textPrimary, marginTop: 2 }}>
              {post.linkPreview?.title || post.linkPreview?.url}
            </Text>
            {Boolean(post.linkPreview?.description) && (
              <Text
                numberOfLines={1}
                style={{ fontSize: 12, color: DS_TOKENS.colors.textMuted, marginTop: 2 }}
              >
                {post.linkPreview?.description}
              </Text>
            )}
          </View>
          <Text style={{ fontSize: 18, color: DS_TOKENS.colors.purple }}>↗</Text>
        </TouchableOpacity>
      )}

      {/* Interactive Polls & Hot Takes */}
      {Array.isArray(post.pollOptions) && post.pollOptions.length > 0 && (
        <View style={{ marginBottom: 14, gap: 8 }}>
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
                        borderColor: hasVotedThis ? DS_TOKENS.colors.purple : DS_TOKENS.colors.borderSubtle,
                        borderRadius: DS_TOKENS.radii.md,
                        paddingVertical: 10,
                        paddingHorizontal: 14,
                        overflow: 'hidden',
                      }}
                    >
                      {/* Percentage fill bar background */}
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
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          zIndex: 1,
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                          {hasVotedThis && <Text style={{ fontSize: 14 }}>✓</Text>}
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: hasVotedThis ? '800' : '600',
                              color: DS_TOKENS.colors.textPrimary,
                            }}
                          >
                            {opt.text}
                          </Text>
                        </View>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '700',
                            color: hasVotedThis ? DS_TOKENS.colors.purple : DS_TOKENS.colors.textSecondary,
                            marginLeft: 8,
                          }}
                        >
                          {pct}% ({opt.votesCount || 0})
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
                <Text style={{ fontSize: 11, color: DS_TOKENS.colors.textMuted, textAlign: 'right' }}>
                  👥 {totalVotes} {isKn ? 'ಒಟ್ಟು ಮತಗಳು' : 'total votes'}
                </Text>
              </>
            );
          })()}
        </View>
      )}

      {/* 7 Specific Reaction Buttons (😂, 👀, 🍿, ☕, 🔥, 💀, ❤️) */}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 6,
          paddingVertical: 8,
          borderTopWidth: 1,
          borderTopColor: DS_TOKENS.colors.borderSubtle,
          marginBottom: 10,
        }}
      >
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
                gap: 4,
                paddingHorizontal: 9,
                paddingVertical: 5,
                borderRadius: DS_TOKENS.radii.pill,
                backgroundColor: userReacted ? DS_TOKENS.colors.purpleLight : '#F8FAFC',
                borderWidth: 1,
                borderColor: userReacted ? DS_TOKENS.colors.purpleBorder : DS_TOKENS.colors.borderSubtle,
              }}
            >
              <Text style={{ fontSize: 15 }}>{emoji}</Text>
              {count > 0 && (
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '800',
                    color: userReacted ? DS_TOKENS.colors.purple : DS_TOKENS.colors.textSecondary,
                  }}
                >
                  {count}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Action Bar: Comments, Save / Bookmark, Share */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 6,
        }}
      >
        <TouchableOpacity
          onPress={onComment}
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Text style={{ fontSize: 16 }}>💬</Text>
          <Text style={{ fontSize: 13, fontWeight: '700', color: DS_TOKENS.colors.textSecondary }}>
            {post.commentsCount || 0} {isKn ? 'ಕಾಮೆಂಟ್‌ಗಳು' : 'Comments'}
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          {/* Bookmark Button */}
          <TouchableOpacity
            onPress={onBookmark}
            activeOpacity={0.7}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          >
            <Text style={{ fontSize: 16 }}>{post.isBookmarked ? '🔖' : '🏷️'}</Text>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '700',
                color: post.isBookmarked ? DS_TOKENS.colors.purple : DS_TOKENS.colors.textSecondary,
              }}
            >
              {post.bookmarksCount || 0}
            </Text>
          </TouchableOpacity>

          {/* Share Button */}
          <TouchableOpacity
            onPress={onShare}
            activeOpacity={0.7}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          >
            <Text style={{ fontSize: 16 }}>📤</Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: DS_TOKENS.colors.textSecondary }}>
              {isKn ? 'ಹಂಚಿ' : 'Share'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </GlassCard>
  );
}

// ---------------------------------------------------------------------
// REPORT INAPPROPRIATE CONTENT MODAL
// ---------------------------------------------------------------------
function RNReportModal({
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
            borderRadius: DS_TOKENS.radii.xl,
            maxWidth: 440,
            width: '100%',
            padding: 24,
            borderWidth: 1,
            borderColor: DS_TOKENS.colors.borderSubtle,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.15,
            shadowRadius: 24,
            elevation: 10,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '900', color: DS_TOKENS.colors.textPrimary }}>
            {isKn ? 'ಅನುಚಿತ ವಿಷಯ ವರದಿ ಮಾಡಿ' : 'Report Inappropriate Content'}
          </Text>
          <Text style={{ fontSize: 13, color: DS_TOKENS.colors.textSecondary, marginTop: 4, marginBottom: 14 }}>
            {isKn
              ? 'ನಿಮ್ಮ ಅಡ್ಡವನ್ನು ಸುರಕ್ಷಿತ ಹಾಗೂ ಸ್ನೇಹಪರವಾಗಿರಿಸಲು ಸಹಾಯ ಮಾಡಿ.'
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
                    borderRadius: DS_TOKENS.radii.md,
                    backgroundColor: isSelected ? DS_TOKENS.colors.roseLight : '#F8FAFC',
                    borderWidth: 1,
                    borderColor: isSelected ? DS_TOKENS.colors.roseBorder : DS_TOKENS.colors.borderSubtle,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: isSelected ? '800' : '600',
                      color: isSelected ? DS_TOKENS.colors.rose : DS_TOKENS.colors.textPrimary,
                    }}
                  >
                    {isKn ? item.kn : item.en}
                  </Text>
                  {isSelected && <Text style={{ fontSize: 14, color: DS_TOKENS.colors.rose }}>✓</Text>}
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
            placeholderTextColor={DS_TOKENS.colors.textMuted}
            style={{
              backgroundColor: DS_TOKENS.colors.bgSecondary,
              borderRadius: DS_TOKENS.radii.md,
              borderWidth: 1,
              borderColor: DS_TOKENS.colors.borderSubtle,
              padding: 12,
              fontSize: 13,
              color: DS_TOKENS.colors.textPrimary,
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
  if (diffMin < 60) return isKn ? `${diffMin}ನಿ ಹಿಂದೆ` : `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return isKn ? `${diffHr}ಗಂ ಹಿಂದೆ` : `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return isKn ? `${diffDays} ದಿನಗಳ ಹಿಂದೆ` : `${diffDays}d ago`;
}

