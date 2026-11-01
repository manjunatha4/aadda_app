import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { api } from '../../src/services/api';
import { useAuthStore } from '../../src/stores/authStore';
import {
  BuzzCategory,
  BuzzCredibility,
  BuzzExpiry,
  CreateBuzzPostDto,
} from '@aadda/shared';
import {
  MainLayout,
  PageHeader,
  GlassCard,
  PrimaryButton,
  SecondaryButton,
  ToastNotification,
  DS_TOKENS,
} from '../../src/components/DesignSystem';

const CATEGORIES = [
  { key: BuzzCategory.SPILL_THE_TEA, labelEn: 'Spill the Tea', labelKn: 'ಟೀ ಕುಡಿತಾ ಹರಟೆ', icon: '☕' },
  { key: BuzzCategory.POLL_HOT_TAKE, labelEn: "What's the Verdict?", labelKn: 'ಮತದಾನ & ತೀರ್ಪು', icon: '🗳️' },
  { key: BuzzCategory.CONFESSION, labelEn: 'Confession Corner', labelKn: 'ಕನ್ಫೆಷನ್ ಕಾರ್ನರ್', icon: '👀' },
  { key: BuzzCategory.NEWS, labelEn: 'News & Links', labelKn: 'ಸುದ್ದಿ & ಲಿಂಕ್ಸ್', icon: '📰' },
  { key: BuzzCategory.OORU_UPDATES, labelEn: 'Ooru Updates', labelKn: 'ಊರು ಅಪ್‌ಡೇಟ್ಸ್', icon: '🏙️' },
  { key: BuzzCategory.COLLEGE_RADAR, labelEn: 'College Radar', labelKn: 'ಕಾಲೇಜು ರೇಡಾರ್', icon: '🎓' },
  { key: BuzzCategory.GUESS_WHO, labelEn: 'Guess Who?', labelKn: 'ಯಾರು ಅಂತ ಊಹಿಸಿ?', icon: '🎭' },
  { key: BuzzCategory.HOT_TAKE, labelEn: 'Hot Take of the Day', labelKn: 'ಹಾಟ್ ಟೇಕ್', icon: '⚡' },
  { key: BuzzCategory.LATE_NIGHT_ADDA, labelEn: 'Late Night Adda', labelKn: 'ರಾತ್ರಿ ಹರಟೆ', icon: '🌙' },
  { key: BuzzCategory.THROWBACK_TEA, labelEn: 'Throwback Tea', labelKn: 'ಹಳೆಯ ಹರಟೆ', icon: '🕰️' },
  { key: BuzzCategory.SCREENSHOT_OF_DAY, labelEn: 'Screenshot of the Day', labelKn: 'ಸ್ಕ್ರೀನ್‌ಶಾಟ್', icon: '📸' },
];

const ANONYMOUS_PERSONAS = [
  { name: 'Blue Gorilla 🦍', icon: '🦍' },
  { name: 'Green Dino 🦕', icon: '🦕' },
  { name: 'Pink Starfish ⭐', icon: '⭐' },
  { name: 'Purple Butterfly 🦋', icon: '🦋' },
  { name: 'Golden Eagle 🦅', icon: '🦅' },
];

const CREDIBILITIES = [
  {
    key: BuzzCredibility.PERSONAL_EXPERIENCE,
    labelEn: 'Personal Experience',
    labelKn: 'ಸ್ವಂತ ಅನುಭವ',
    icon: '🗣️',
    bg: '#F0FDF4',
    border: '#BBF7D0',
    color: '#15803D',
  },
  {
    key: BuzzCredibility.VERIFIED_NEWS,
    labelEn: 'Verified News',
    labelKn: 'ಖಚಿತ ಸುದ್ದಿ',
    icon: '✓',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    color: '#1D4ED8',
  },
  {
    key: BuzzCredibility.UNVERIFIED_CLAIM,
    labelEn: 'Unverified Claim',
    labelKn: 'ದೃಢಪಡಿಸದ ಮಾತು',
    icon: '⚠️',
    bg: '#FEF3C7',
    border: '#FDE68A',
    color: '#B45309',
  },
];

const EXPIRIES = [
  { key: BuzzExpiry.PERMANENT, labelEn: 'Permanent', labelKn: 'ಶಾಶ್ವತ', icon: '♾️' },
  { key: BuzzExpiry.EXP_24H, labelEn: '24 Hours', labelKn: '24 ಗಂಟೆ', icon: '⏳' },
  { key: BuzzExpiry.EXP_48H, labelEn: '48 Hours', labelKn: '48 ಗಂಟೆ', icon: '⏳' },
];

export default function CreateBuzzScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ addaId?: string; category?: string }>();
  const { i18n } = useTranslation();
  const isKn = i18n.language === 'kn';
  const currentUser = useAuthStore((state) => state.user);

  const initialCat =
    params.category && Object.values(BuzzCategory).includes(params.category as BuzzCategory)
      ? (params.category as BuzzCategory)
      : BuzzCategory.SPILL_THE_TEA;

  const [addas, setAddas] = useState<any[]>([]);
  const [selectedAddaId, setSelectedAddaId] = useState<string>(params.addaId || '');
  const [category, setCategory] = useState<BuzzCategory>(initialCat);
  const [credibility, setCredibility] = useState<BuzzCredibility>(BuzzCredibility.PERSONAL_EXPERIENCE);
  const [expiry, setExpiry] = useState<BuzzExpiry>(BuzzExpiry.PERMANENT);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [anonymousPersona, setAnonymousPersona] = useState('Blue Gorilla 🦍');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['Option 1', 'Option 2']);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (params.category && Object.values(BuzzCategory).includes(params.category as BuzzCategory)) {
      setCategory(params.category as BuzzCategory);
    }
  }, [params.category]);

  useEffect(() => {
    async function loadAddas() {
      try {
        const res = await api.get('/addas');
        if (Array.isArray(res) && res.length > 0) {
          setAddas(res);
          if (!selectedAddaId) {
            setSelectedAddaId(res[0].id);
          }
        }
      } catch {
        // fallback
      }
    }
    loadAddas();
  }, [selectedAddaId]);

  // When category changes to CONFESSION, default anonymous to true
  const handleSelectCategory = (cat: BuzzCategory) => {
    setCategory(cat);
    if (cat === BuzzCategory.CONFESSION) {
      setIsAnonymous(true);
      setCredibility(BuzzCredibility.PERSONAL_EXPERIENCE);
    } else if (cat === BuzzCategory.NEWS) {
      setCredibility(BuzzCredibility.VERIFIED_NEWS);
    }
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, `Option ${pollOptions.length + 1}`]);
    }
  };

  const handleRemovePollOption = (idx: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== idx));
    }
  };

  const handlePollOptionChange = (text: string, idx: number) => {
    const updated = [...pollOptions];
    updated[idx] = text;
    setPollOptions(updated);
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      setErrorMessage(isKn ? 'ದಯವಿಟ್ಟು ವಿಷಯವನ್ನು ನಮೂದಿಸಿ' : 'Please enter post content');
      return;
    }

    if (category === BuzzCategory.POLL_HOT_TAKE) {
      const validOptions = pollOptions.filter((o) => o.trim().length > 0);
      if (validOptions.length < 2) {
        setErrorMessage(
          isKn
            ? 'ಮತದಾನಕ್ಕೆ ಕನಿಷ್ಠ 2 ಆಯ್ಕೆಗಳು ಬೇಕು'
            : 'Please provide at least 2 poll options',
        );
        return;
      }
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);

      const payload: CreateBuzzPostDto = {
        addaId: selectedAddaId || 'default',
        category,
        credibility,
        expiry,
        isAnonymous,
        anonymousPersona: isAnonymous ? anonymousPersona : undefined,
        title: title.trim() || undefined,
        content: content.trim(),
        linkUrl: linkUrl.trim() || undefined,
        pollOptions: category === BuzzCategory.POLL_HOT_TAKE ? pollOptions : undefined,
      };

      await api.post('/buzz', payload);
      router.back();
    } catch (e: any) {
      setErrorMessage(e.message || (isKn ? 'ಪೋಸ್ಟ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ' : 'Failed to publish post'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <PageHeader
        title={isKn ? 'ಹೊಸ ಬಜ್ ಪೋಸ್ಟ್' : 'Create Buzz Post'}
        subtitle={isKn ? 'ನಿಮ್ಮ ಅಡ್ಡ ವೃತ್ತದೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳಿ' : 'Share updates, gossip, news or hot takes with your circle'}
        actions={<SecondaryButton title={isKn ? '‹ ರದ್ದು' : '‹ Cancel'} onPress={() => router.back()} />}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 60, gap: 16 }}>
        <ToastNotification
          visible={Boolean(errorMessage)}
          message={errorMessage || ''}
          type="error"
          onDismiss={() => setErrorMessage(null)}
        />

        {/* 1. Circle Selection */}
        {addas.length > 1 && (
          <GlassCard elevated style={{ padding: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: DS_TOKENS.colors.textPrimary, marginBottom: 8 }}>
              {isKn ? 'ಅಡ್ಡ ಆಯ್ಕೆಮಾಡಿ' : '1. SELECT CIRCLE'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {addas.map((a) => {
                const isSelected = a.id === selectedAddaId;
                return (
                  <TouchableOpacity
                    key={a.id}
                    onPress={() => setSelectedAddaId(a.id)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 7,
                      borderRadius: DS_TOKENS.radii.pill,
                      backgroundColor: isSelected ? DS_TOKENS.colors.purple : '#F8FAFC',
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
                      🛖 {a.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </GlassCard>
        )}

        {/* 2. Category Selector */}
        <GlassCard elevated style={{ padding: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: DS_TOKENS.colors.textPrimary, marginBottom: 8 }}>
            {isKn ? 'ವಿಭಾಗ ಆಯ್ಕೆಮಾಡಿ' : 'CATEGORY'}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  onPress={() => handleSelectCategory(cat.key)}
                  activeOpacity={0.75}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: DS_TOKENS.radii.pill,
                    backgroundColor: isSelected ? DS_TOKENS.colors.purpleLight : '#FFFFFF',
                    borderWidth: 1.5,
                    borderColor: isSelected ? DS_TOKENS.colors.purple : DS_TOKENS.colors.borderSubtle,
                  }}
                >
                  <Text style={{ fontSize: 16 }}>{cat.icon}</Text>
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
          </View>
        </GlassCard>

        {/* 3. Credibility Tag Selector */}
        <GlassCard elevated style={{ padding: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: DS_TOKENS.colors.textPrimary, marginBottom: 8 }}>
            {isKn ? 'ವಿಶ್ವಾಸಾರ್ಹತೆ ಲೇಬಲ್' : 'CREDIBILITY BADGE'}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {CREDIBILITIES.map((c) => {
              const isSelected = credibility === c.key;
              return (
                <TouchableOpacity
                  key={c.key}
                  onPress={() => setCredibility(c.key)}
                  activeOpacity={0.75}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: DS_TOKENS.radii.pill,
                    backgroundColor: isSelected ? c.bg : '#FFFFFF',
                    borderWidth: 1.5,
                    borderColor: isSelected ? c.border : DS_TOKENS.colors.borderSubtle,
                  }}
                >
                  <Text style={{ fontSize: 13 }}>{c.icon}</Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: isSelected ? '800' : '600',
                      color: isSelected ? c.color : DS_TOKENS.colors.textSecondary,
                    }}
                  >
                    {isKn ? c.labelKn : c.labelEn}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </GlassCard>

        {/* 4. Anonymous Confession Toggle */}
        <GlassCard
          elevated
          style={{
            padding: 16,
            backgroundColor: isAnonymous ? '#FAF5FF' : '#FFFFFF',
            borderColor: isAnonymous ? '#E9D5FF' : DS_TOKENS.colors.borderSubtle,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 16 }}>🤫</Text>
                <Text style={{ fontSize: 14, fontWeight: '800', color: isAnonymous ? '#7E22CE' : DS_TOKENS.colors.textPrimary }}>
                  {isKn ? 'ಗುಪ್ತವಾಗಿ ಪೋಸ್ಟ್ ಮಾಡಿ (Confession)' : 'Post Anonymously (Confession)'}
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: DS_TOKENS.colors.textMuted, marginTop: 3 }}>
                {isKn
                  ? 'ನಿಮ್ಮ ಹೆಸರು ಮರೆಯಾಗುತ್ತದೆ. ನಿಂದನೆ ಮತ್ತು ಸೋರಿಕೆ ನಿಷೇಧಿಸಲಾಗಿದೆ.'
                  : 'Your identity is hidden from friends. Anti-harassment policies apply.'}
              </Text>
            </View>
            <Switch
              value={isAnonymous}
              onValueChange={setIsAnonymous}
              trackColor={{ false: '#E2E8F0', true: '#C084FC' }}
              thumbColor={isAnonymous ? '#9333EA' : '#FFFFFF'}
            />
          </View>

          {isAnonymous && (
            <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3E8FF' }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#7E22CE', marginBottom: 8 }}>
                {isKn ? 'ನಿಮ್ಮ ಅನಾಮಧೇಯ ಪ್ರಾಣಿ ಅವತಾರ (Screenshot 3 Style)' : 'CHOOSE SECRET ANIMAL AVATAR'}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {ANONYMOUS_PERSONAS.map((p) => {
                  const isSelected = anonymousPersona === p.name;
                  return (
                    <TouchableOpacity
                      key={p.name}
                      onPress={() => setAnonymousPersona(p.name)}
                      activeOpacity={0.75}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        borderRadius: DS_TOKENS.radii.pill,
                        backgroundColor: isSelected ? '#7E22CE' : '#FFFFFF',
                        borderWidth: 1.5,
                        borderColor: isSelected ? '#7E22CE' : '#E9D5FF',
                      }}
                    >
                      <Text style={{ fontSize: 14 }}>{p.icon}</Text>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: isSelected ? '800' : '600',
                          color: isSelected ? '#FFFFFF' : '#7E22CE',
                        }}
                      >
                        {p.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </GlassCard>

        {/* 5. Title & Body Content */}
        <GlassCard elevated style={{ padding: 16, gap: 12 }}>
          <View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: DS_TOKENS.colors.textSecondary, marginBottom: 4 }}>
              {isKn ? 'ಶೀರ್ಷಿಕೆ (ಐಚ್ಛಿಕ)' : 'HEADLINE (OPTIONAL)'}
            </Text>
            <TextInput
              placeholder={isKn ? 'ಆಕರ್ಷಕ ಶೀರ್ಷಿಕೆ ನೀಡಿ...' : 'Short catchy headline...'}
              value={title}
              onChangeText={setTitle}
              placeholderTextColor={DS_TOKENS.colors.textMuted}
              style={{
                backgroundColor: DS_TOKENS.colors.bgSecondary,
                borderRadius: DS_TOKENS.radii.md,
                borderWidth: 1,
                borderColor: DS_TOKENS.colors.borderSubtle,
                paddingHorizontal: 14,
                paddingVertical: 10,
                fontSize: 15,
                fontWeight: '700',
                color: DS_TOKENS.colors.textPrimary,
              }}
            />
          </View>

          <View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: DS_TOKENS.colors.textSecondary, marginBottom: 4 }}>
              {isKn ? 'ಬಜ್ ವಿವರ *' : 'WHAT\'S THE BUZZ? *'}
            </Text>
            <TextInput
              placeholder={
                category === BuzzCategory.SPILL_THE_TEA
                  ? isKn
                    ? 'ಟೀ ಕುಡಿಯುತ್ತಾ ಹೊಸ ಹರಟೆ ಹಂಚಿಕೊಳ್ಳಿ...'
                    : 'Spill the gossip or incident here...'
                  : isKn
                  ? 'ಇಂದು ನಿಮ್ಮ ಅಡ್ಡದಲ್ಲಿ ಏನು ಸುದ್ದಿ?'
                  : 'Write your story, local update, or discussion topic...'
              }
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={4}
              placeholderTextColor={DS_TOKENS.colors.textMuted}
              style={{
                backgroundColor: DS_TOKENS.colors.bgSecondary,
                borderRadius: DS_TOKENS.radii.md,
                borderWidth: 1,
                borderColor: DS_TOKENS.colors.borderSubtle,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 14,
                color: DS_TOKENS.colors.textPrimary,
                minHeight: 90,
              }}
            />
          </View>

          {/* External Link URL Input (for News category) */}
          {category === BuzzCategory.NEWS && (
            <View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: DS_TOKENS.colors.textSecondary, marginBottom: 4 }}>
                {isKn ? 'ಸುದ್ದಿ ಲಿಂಕ್ (URL)' : 'SOURCE LINK / URL'}
              </Text>
              <TextInput
                placeholder="https://news.example.com/article"
                value={linkUrl}
                onChangeText={setLinkUrl}
                autoCapitalize="none"
                placeholderTextColor={DS_TOKENS.colors.textMuted}
                style={{
                  backgroundColor: DS_TOKENS.colors.bgSecondary,
                  borderRadius: DS_TOKENS.radii.md,
                  borderWidth: 1,
                  borderColor: DS_TOKENS.colors.borderSubtle,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  fontSize: 13,
                  color: DS_TOKENS.colors.textPrimary,
                }}
              />
            </View>
          )}

          {/* Poll Options Builder (for Polls & Hot Takes) */}
          {category === BuzzCategory.POLL_HOT_TAKE && (
            <View style={{ gap: 8, marginTop: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: DS_TOKENS.colors.textSecondary }}>
                {isKn ? 'ಮತದಾನ ಆಯ್ಕೆಗಳು (2 - 4)' : 'POLL OPTIONS (2 - 4)'}
              </Text>
              {pollOptions.map((opt, idx) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TextInput
                    value={opt}
                    onChangeText={(t) => handlePollOptionChange(t, idx)}
                    placeholder={`Option ${idx + 1}`}
                    placeholderTextColor={DS_TOKENS.colors.textMuted}
                    style={{
                      flex: 1,
                      backgroundColor: DS_TOKENS.colors.bgSecondary,
                      borderRadius: DS_TOKENS.radii.md,
                      borderWidth: 1,
                      borderColor: DS_TOKENS.colors.borderSubtle,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      fontSize: 13,
                      color: DS_TOKENS.colors.textPrimary,
                    }}
                  />
                  {pollOptions.length > 2 && (
                    <TouchableOpacity
                      onPress={() => handleRemovePollOption(idx)}
                      style={{ padding: 6 }}
                    >
                      <Text style={{ color: DS_TOKENS.colors.rose, fontSize: 16 }}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {pollOptions.length < 4 && (
                <TouchableOpacity
                  onPress={handleAddPollOption}
                  style={{
                    paddingVertical: 8,
                    borderRadius: DS_TOKENS.radii.md,
                    backgroundColor: '#F1F5F9',
                    alignItems: 'center',
                    marginTop: 4,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: DS_TOKENS.colors.purple }}>
                    + {isKn ? 'ಮತ್ತೊಂದು ಆಯ್ಕೆ ಸೇರಿಸಿ' : 'Add Option'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </GlassCard>

        {/* 6. Post Expiry Selector */}
        <GlassCard elevated style={{ padding: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: DS_TOKENS.colors.textPrimary, marginBottom: 8 }}>
            {isKn ? 'ಪೋಸ್ಟ್ ಜೀವಿತಾವಧಿ' : 'POST EXPIRY'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {EXPIRIES.map((exp) => {
              const isSelected = expiry === exp.key;
              return (
                <TouchableOpacity
                  key={exp.key}
                  onPress={() => setExpiry(exp.key)}
                  activeOpacity={0.75}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    paddingVertical: 9,
                    borderRadius: DS_TOKENS.radii.md,
                    backgroundColor: isSelected ? DS_TOKENS.colors.purpleLight : '#FFFFFF',
                    borderWidth: 1.5,
                    borderColor: isSelected ? DS_TOKENS.colors.purple : DS_TOKENS.colors.borderSubtle,
                  }}
                >
                  <Text style={{ fontSize: 13 }}>{exp.icon}</Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: isSelected ? '800' : '600',
                      color: isSelected ? DS_TOKENS.colors.purple : DS_TOKENS.colors.textSecondary,
                    }}
                  >
                    {isKn ? exp.labelKn : exp.labelEn}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </GlassCard>

        {/* Submit Button */}
        <PrimaryButton
          title={submitting ? (isKn ? 'ಹಂಚಲಾಗುತ್ತಿದೆ...' : 'Publishing...') : isKn ? 'ಅಡ್ಡದಲ್ಲಿ ಹಂಚಿಕೊಳ್ಳಿ 🚀' : 'Share to Circle 🚀'}
          onPress={handleSubmit}
          disabled={submitting}
          style={{ height: 50 }}
        />
      </ScrollView>
    </MainLayout>
  );
}
