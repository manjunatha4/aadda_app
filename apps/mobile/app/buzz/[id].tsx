import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { api } from '../../src/services/api';
import { useAuthStore } from '../../src/stores/authStore';
import {
  BuzzPost,
  BuzzComment,
  BuzzCredibility,
} from '@aadda/shared';
import {
  MainLayout,
  PageHeader,
  GlassCard,
  PrimaryButton,
  SecondaryButton,
  ToastNotification,
  LoadingState,
  DS_TOKENS,
} from '../../src/components/DesignSystem';

const REACTION_EMOJIS = ['😂', '👀', '🍿', '☕', '🔥', '💀', '❤️'];

export default function BuzzDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { i18n } = useTranslation();
  const isKn = i18n.language === 'kn';
  const currentUser = useAuthStore((state) => state.user);

  const [post, setPost] = useState<BuzzPost | null>(null);
  const [comments, setComments] = useState<BuzzComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<BuzzComment | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const inputRef = useRef<TextInput>(null);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      // Fetch feed to get target post
      const feed = await api.get(`/buzz?filter=all&userId=${currentUser?.id || 'usr_default'}`);
      if (Array.isArray(feed)) {
        const found = feed.find((p: BuzzPost) => p.id === id);
        if (found) setPost(found);
      }

      // Fetch comments
      const comms = await api.get(`/buzz/${id}/comments`);
      if (Array.isArray(comms)) {
        setComments(comms);
      }
    } catch (e: any) {
      console.error('Error loading buzz post detail:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleToggleReaction = async (emoji: string) => {
    if (!post) return;
    try {
      const userReactions = [...(post.userReactions || [])];
      const reactions = { ...(post.reactions || {}) };
      const hasReacted = userReactions.includes(emoji);

      if (hasReacted) {
        const nextUser = userReactions.filter((e) => e !== emoji);
        const count = Math.max(0, (reactions[emoji] || 1) - 1);
        if (count === 0) delete reactions[emoji];
        else reactions[emoji] = count;
        setPost({ ...post, reactions, userReactions: nextUser });
      } else {
        userReactions.push(emoji);
        reactions[emoji] = (reactions[emoji] || 0) + 1;
        setPost({ ...post, reactions, userReactions });
      }

      await api.post(`/buzz/${post.id}/react`, { emoji });
    } catch (e) {
      console.error('React failed:', e);
    }
  };

  const handleVotePoll = async (optionId: string) => {
    if (!post) return;
    try {
      const res = await api.post(`/buzz/${post.id}/vote`, { optionId });
      if (res?.pollOptions) {
        setPost({ ...post, pollOptions: res.pollOptions });
      }
      setToastMessage(isKn ? 'ನಿಮ್ಮ ಮತ ದಾಖಲಾಗಿದೆ! 🔥' : 'Vote recorded! 🔥');
      setTimeout(() => setToastMessage(null), 2000);
    } catch (e) {
      console.error('Vote failed:', e);
    }
  };

  const handleToggleBookmark = async () => {
    if (!post) return;
    try {
      const res = await api.post(`/buzz/${post.id}/bookmark`);
      setPost({
        ...post,
        isBookmarked: res.isBookmarked,
        bookmarksCount: res.bookmarksCount,
      });
      setToastMessage(
        res.isBookmarked
          ? isKn
            ? 'ಉಳಿಸಲಾಗಿದೆ! 🔖'
            : 'Saved to bookmarks! 🔖'
          : isKn
          ? 'ತೆಗೆದುಹಾಕಲಾಗಿದೆ'
          : 'Removed from bookmarks',
      );
      setTimeout(() => setToastMessage(null), 2000);
    } catch (e) {
      console.error('Bookmark toggle failed:', e);
    }
  };

  const handleReplyTo = (comment: BuzzComment) => {
    setReplyingTo(comment);
    setCommentText(`@${comment.authorName} `);
    inputRef.current?.focus();
  };

  const handleSendComment = async () => {
    if (!commentText.trim() || !post) return;
    try {
      setSubmittingComment(true);
      const newComm = await api.post(`/buzz/${post.id}/comments`, {
        content: commentText.trim(),
        parentId: replyingTo ? replyingTo.id : null,
      });

      setComments((prev) => [...prev, newComm]);
      setPost({
        ...post,
        commentsCount: (post.commentsCount || 0) + 1,
      });
      setCommentText('');
      setReplyingTo(null);
    } catch (e) {
      console.error('Add comment failed:', e);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading || !post) {
    return (
      <MainLayout>
        <LoadingState message={isKn ? 'ಪೋಸ್ಟ್ ಲೋಡ್ ಆಗುತ್ತಿದೆ...' : 'Loading buzz thread...'} />
      </MainLayout>
    );
  }

  // Credibility Badge info
  const credibilityBadge = {
    [BuzzCredibility.VERIFIED_NEWS]: { label: isKn ? 'ಖಚಿತ ಸುದ್ದಿ' : 'Verified News', color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
    [BuzzCredibility.PERSONAL_EXPERIENCE]: { label: isKn ? 'ಸ್ವಂತ ಅನುಭವ' : 'Personal Experience', color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0' },
    [BuzzCredibility.UNVERIFIED_CLAIM]: { label: isKn ? 'ದೃಢಪಡಿಸದ ಮಾತು' : 'Unverified Gossip', color: '#B45309', bg: '#FEF3C7', border: '#FDE68A' },
  }[post.credibility] || { label: 'Personal Experience', color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0' };

  return (
    <MainLayout>
      <ToastNotification
        visible={Boolean(toastMessage)}
        message={toastMessage || ''}
        onDismiss={() => setToastMessage(null)}
      />

      <PageHeader
        title={isKn ? 'ಅಡ್ಡ ಸಂಭಾಷಣೆ' : 'Circle Buzz Thread'}
        subtitle={isKn ? `${post.addaName || 'ಅಡ್ಡ'} ಪೋಸ್ಟ್ ಮತ್ತು ಕಾಮೆಂಟ್‌ಗಳು` : `Comments & reactions in ${post.addaName || 'Adda'}`}
        actions={<SecondaryButton title={isKn ? '‹ ಹಿಂತಿರುಗಿ' : '‹ Back'} onPress={() => router.back()} />}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 120, gap: 16 }}>
          {/* Main Post Card */}
          <GlassCard elevated style={{ padding: 18 }}>
            {/* Author Row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
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
                  <Text style={{ fontSize: 15, fontWeight: '800', color: post.isAnonymous ? '#7E22CE' : DS_TOKENS.colors.textPrimary }}>
                    {post.authorName}
                  </Text>
                  <Text style={{ fontSize: 12, color: DS_TOKENS.colors.textMuted }}>
                    {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {post.addaName || 'Circle'}
                  </Text>
                </View>
              </View>

              <View
                style={{
                  backgroundColor: credibilityBadge.bg,
                  borderWidth: 1,
                  borderColor: credibilityBadge.border,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: DS_TOKENS.radii.pill,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: credibilityBadge.color }}>
                  {credibilityBadge.label}
                </Text>
              </View>
            </View>

            {/* Title & Content */}
            {Boolean(post.title) && (
              <Text style={{ fontSize: 18, fontWeight: '900', color: DS_TOKENS.colors.textPrimary, marginBottom: 6 }}>
                {post.title}
              </Text>
            )}

            <Text style={{ fontSize: 15, lineHeight: 22, color: DS_TOKENS.colors.textSecondary, marginBottom: 14 }}>
              {post.content}
            </Text>

            {/* Link Preview */}
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
                  marginBottom: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: DS_TOKENS.colors.sky }}>
                    🔗 {post.linkPreview?.siteName?.toUpperCase() || 'ARTICLE'}
                  </Text>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: DS_TOKENS.colors.textPrimary, marginTop: 2 }}>
                    {post.linkPreview?.title || post.linkPreview?.url}
                  </Text>
                </View>
                <Text style={{ fontSize: 18, color: DS_TOKENS.colors.purple }}>↗</Text>
              </TouchableOpacity>
            )}

            {/* Poll Options */}
            {Array.isArray(post.pollOptions) && post.pollOptions.length > 0 && (
              <View style={{ marginBottom: 14, gap: 8 }}>
                {(() => {
                  const totalVotes = post.pollOptions.reduce((acc, opt) => acc + (opt.votesCount || 0), 0);
                  return post.pollOptions.map((opt) => {
                    const hasVotedThis = currentUser?.id ? (opt.voterIds || []).includes(currentUser.id) : false;
                    const pct = totalVotes > 0 ? Math.round(((opt.votesCount || 0) / totalVotes) * 100) : 0;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        onPress={() => handleVotePoll(opt.id)}
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
                          <Text style={{ fontSize: 13, fontWeight: hasVotedThis ? '800' : '600', color: DS_TOKENS.colors.textPrimary }}>
                            {hasVotedThis ? '✓ ' : ''}{opt.text}
                          </Text>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: DS_TOKENS.colors.purple }}>
                            {pct}% ({opt.votesCount || 0})
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  });
                })()}
              </View>
            )}

            {/* 7 Specific Reactions */}
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
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
                    onPress={() => handleToggleReaction(emoji)}
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
                      <Text style={{ fontSize: 12, fontWeight: '800', color: userReacted ? DS_TOKENS.colors.purple : DS_TOKENS.colors.textSecondary }}>
                        {count}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Footer with Bookmark */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
              <Text style={{ fontSize: 12, color: DS_TOKENS.colors.textMuted }}>
                💬 {comments.length} {isKn ? 'ಕಾಮೆಂಟ್‌ಗಳು' : 'Comments'}
              </Text>
              <TouchableOpacity onPress={handleToggleBookmark} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 16 }}>{post.isBookmarked ? '🔖' : '🏷️'}</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: post.isBookmarked ? DS_TOKENS.colors.purple : DS_TOKENS.colors.textSecondary }}>
                  {post.isBookmarked ? (isKn ? 'ಉಳಿಸಲಾಗಿದೆ' : 'Saved') : (isKn ? 'ಉಳಿಸಿ' : 'Bookmark')}
                </Text>
              </TouchableOpacity>
            </View>
          </GlassCard>

          {/* Comments Section */}
          <View style={{ gap: 10 }}>
            <Text style={{ fontSize: 15, fontWeight: '900', color: DS_TOKENS.colors.textPrimary, paddingHorizontal: 4 }}>
              {isKn ? `ಕಾಮೆಂಟ್‌ಗಳು (${comments.length})` : `Comments (${comments.length})`}
            </Text>

            {comments.length === 0 ? (
              <GlassCard style={{ padding: 24, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>💬</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: DS_TOKENS.colors.textPrimary }}>
                  {isKn ? 'ಇನ್ನೂ ಕಾಮೆಂಟ್‌ಗಳಿಲ್ಲ' : 'No comments yet'}
                </Text>
                <Text style={{ fontSize: 12, color: DS_TOKENS.colors.textSecondary, marginTop: 4 }}>
                  {isKn ? 'ಮೊದಲ ಕಾಮೆಂಟ್ ಬರೆದು ಹರಟೆ ಆರಂಭಿಸಿ!' : 'Be the first to share your take or reply!'}
                </Text>
              </GlassCard>
            ) : (
              comments.map((comm) => {
                const isReply = Boolean(comm.parentId);
                return (
                  <GlassCard
                    key={comm.id}
                    elevated
                    style={{
                      padding: 14,
                      marginLeft: isReply ? 24 : 0,
                      backgroundColor: isReply ? '#FAFAFA' : '#FFFFFF',
                      borderLeftWidth: isReply ? 3 : 1,
                      borderLeftColor: isReply ? DS_TOKENS.colors.purple : DS_TOKENS.colors.borderSubtle,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            backgroundColor: DS_TOKENS.colors.purpleLight,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text style={{ fontSize: 14 }}>👤</Text>
                        </View>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: DS_TOKENS.colors.textPrimary }}>
                          {comm.authorName}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 11, color: DS_TOKENS.colors.textMuted }}>
                        {new Date(comm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>

                    <Text style={{ fontSize: 13, color: DS_TOKENS.colors.textSecondary, lineHeight: 19 }}>
                      {comm.content.split(' ').map((word, wIdx) => {
                        if (word.startsWith('@')) {
                          return (
                            <Text key={wIdx} style={{ color: DS_TOKENS.colors.purple, fontWeight: '800' }}>
                              {word}{' '}
                            </Text>
                          );
                        }
                        return word + ' ';
                      })}
                    </Text>

                    <TouchableOpacity
                      onPress={() => handleReplyTo(comm)}
                      activeOpacity={0.7}
                      style={{ alignSelf: 'flex-start', marginTop: 8 }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '800', color: DS_TOKENS.colors.purple }}>
                        ↳ {isKn ? 'ಉತ್ತರಿಸಿ' : 'Reply'}
                      </Text>
                    </TouchableOpacity>
                  </GlassCard>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* Sticky Comment Input Bar at Bottom */}
        <View
          style={{
            position: Platform.OS === 'web' ? ('fixed' as any) : 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: DS_TOKENS.colors.borderSubtle,
            paddingHorizontal: 16,
            paddingVertical: 12,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.06,
            shadowRadius: 10,
            elevation: 8,
          }}
        >
          {replyingTo && (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: 6,
                paddingHorizontal: 4,
              }}
            >
              <Text style={{ fontSize: 12, color: DS_TOKENS.colors.purple, fontWeight: '700' }}>
                ↳ {isKn ? 'ಉತ್ತರಿಸಲಾಗುತ್ತಿದೆ:' : 'Replying to'} @{replyingTo.authorName}
              </Text>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <Text style={{ fontSize: 12, color: DS_TOKENS.colors.rose, fontWeight: '800' }}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, maxWidth: 640, alignSelf: 'center', width: '100%' }}>
            <TextInput
              ref={inputRef}
              placeholder={isKn ? 'ಕಾಮೆಂಟ್ ಬರೆಯಿರಿ... (@ ಬಳಸಿ)' : 'Add a circle comment... (@ to tag)'}
              value={commentText}
              onChangeText={setCommentText}
              placeholderTextColor={DS_TOKENS.colors.textMuted}
              style={{
                flex: 1,
                backgroundColor: DS_TOKENS.colors.bgSecondary,
                borderRadius: DS_TOKENS.radii.pill,
                borderWidth: 1,
                borderColor: DS_TOKENS.colors.borderSubtle,
                paddingHorizontal: 16,
                paddingVertical: 10,
                fontSize: 14,
                color: DS_TOKENS.colors.textPrimary,
              }}
            />
            <TouchableOpacity
              onPress={handleSendComment}
              disabled={!commentText.trim() || submittingComment}
              activeOpacity={0.8}
              style={{
                backgroundColor: commentText.trim() ? DS_TOKENS.colors.purple : '#E2E8F0',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: DS_TOKENS.radii.pill,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {submittingComment ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={{ color: commentText.trim() ? '#FFFFFF' : '#94A3B8', fontWeight: '800', fontSize: 14 }}>
                  {isKn ? 'ಕಳುಹಿಸಿ' : 'Send'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </MainLayout>
  );
}
