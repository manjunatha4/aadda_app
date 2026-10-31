import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { api } from '../../src/services/api';
import { ChaosCard } from '../../src/components/ChaosCard';
import { Floating } from '../../src/components/AnimatedVisuals';

const SAVED_FOLDERS = [
  { id: '1', title: 'Friends', color: '#FFB82E', emoji: '💛', count: '12 items' },
  { id: '2', title: 'Astronomy', color: '#3C97FF', emoji: '🚀', count: '8 items' },
  { id: '3', title: 'Tech & Code', color: '#FF7A29', emoji: '💻', count: '15 items' },
  { id: '4', title: 'Cartoons', color: '#9C75F7', emoji: '🦄', count: '9 items' },
  { id: '5', title: 'Tasty food', color: '#FF6464', emoji: '🍕', count: '24 items' },
  { id: '6', title: 'Sport', color: '#31C390', emoji: '⚽', count: '7 items' },
];

const SAMPLE_CHALLENGES = [
  {
    id: 'ch-1',
    promptText: 'Most likely to order Swiggy at 2 AM and sleep before it arrives',
    promptTextKn: 'ರಾತ್ರಿ 2 ಗಂಟೆಗೆ ಸ್ವಿಗ್ಗಿ ಆರ್ಡರ್ ಮಾಡಿ ಡೆಲಿವರಿ ಬರೋ ಮುಂಚೆ ನಿದ್ರೆ ಹೋಗುವವರು ಯಾರು?',
    category: 'MOST_LIKELY_TO',
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    entries: [
      { id: 'e1', content: 'Alex 100% does this every weekend', voteCount: 14, user: { displayName: 'Kavya' } },
      { id: 'e2', content: 'Me tbh, happened yesterday 😂', voteCount: 9, user: { displayName: 'Alex' } },
    ],
  },
  {
    id: 'ch-2',
    promptText: 'Describe your best friend using only ONE dramatic word',
    promptTextKn: 'ನಿಮ್ಮ ಬೆಸ್ಟ್ ಫ್ರೆಂಡ್‌ನ ಒಂದೇ ನಾಟಕೀಯ ಪದದಲ್ಲಿ ವಿವರಿಸಿ',
    category: 'ONE_WORD_ROAST',
    expiresAt: new Date(Date.now() + 172800000).toISOString(),
    entries: [
      { id: 'e3', content: 'Unpredictable 🌪️', voteCount: 18, user: { displayName: 'Rahul' } },
      { id: 'e4', content: 'Drama-Queen 💅', voteCount: 12, user: { displayName: 'Pooja' } },
    ],
  },
];

export default function ChaosScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [challenges, setChallenges] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  const isKn = i18n.language === 'kn';

  const loadChallenges = async () => {
    try {
      const addas = await api.get('/addas').catch(() => []);
      const allChallenges: any[] = [];

      for (const a of addas) {
        const cList = await api.get(`/chaos/adda/${a.id}`).catch(() => []);
        allChallenges.push(...cList);
      }

      setChallenges(allChallenges.length > 0 ? allChallenges : SAMPLE_CHALLENGES);
    } catch (e) {
      setChallenges(SAMPLE_CHALLENGES);
    }
  };

  useEffect(() => {
    loadChallenges();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadChallenges();
    setRefreshing(false);
  };

  const handleVote = async (entryId: string) => {
    try {
      await api.post(`/chaos/vote/${entryId}`).catch(() => {});
      setChallenges((prev) =>
        prev.map((c) => ({
          ...c,
          entries: c.entries?.map((e: any) =>
            e.id === entryId ? { ...e, voteCount: e.voteCount + 1 } : e,
          ),
        })),
      );
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#F5F2EB' }}
      contentContainerStyle={{ padding: 18, paddingBottom: 110 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FFB82E" />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header matching reference Screen 2 */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: '#18171C', fontSize: 32, fontWeight: '900', letterSpacing: -0.5 }}>
            {isKn ? 'ಉಳಿಸಲಾಗಿದೆ' : 'Saved'}
          </Text>
          <View
            style={{
              backgroundColor: '#E6E1D4',
              borderRadius: 14,
              paddingHorizontal: 10,
              paddingVertical: 3,
              marginLeft: 10,
            }}
          >
            <Text style={{ color: '#686055', fontSize: 13, fontWeight: '700' }}>
              {SAVED_FOLDERS.length} {isKn ? 'ಫೋಲ್ಡರ್‌ಗಳು' : 'folders'} +
            </Text>
          </View>
        </View>

        <Floating distance={4} duration={2400}>
          <Text style={{ fontSize: 26 }}>🐸</Text>
        </Floating>
      </View>

      {/* Colorful Folder Cards Grid matching reference Screen 2 */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 }}>
        {SAVED_FOLDERS.map((folder) => {
          const isSelected = selectedFolder === folder.id;
          return (
            <TouchableOpacity
              key={folder.id}
              onPress={() => setSelectedFolder(isSelected ? null : folder.id)}
              activeOpacity={0.85}
              style={{
                width: '48%',
                backgroundColor: folder.color,
                borderRadius: 22,
                padding: 14,
                marginBottom: 12,
                shadowColor: folder.color,
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.25,
                shadowRadius: 6,
                elevation: 3,
                borderTopLeftRadius: 10, // Playful folder tab shape
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 22 }}>{folder.emoji}</Text>
                <View
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    borderRadius: 10,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800' }}>
                    {folder.count}
                  </Text>
                </View>
              </View>
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 16,
                  fontWeight: '900',
                  letterSpacing: -0.2,
                }}
              >
                {folder.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Daily Chaos / Burning Polls Section */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <Text style={{ color: '#18171C', fontSize: 20, fontWeight: '900' }}>
          🔥 {isKn ? 'ಕೇಯಾಸ್ ಪೋಲ್‌ಗಳು' : 'Daily Chaos Polls'}
        </Text>
        <Text style={{ color: '#78716C', fontSize: 12, fontWeight: '700' }}>
          {challenges.length} active
        </Text>
      </View>

      {challenges.map((c) => (
        <ChaosCard
          key={c.id}
          id={c.id}
          promptText={isKn && c.promptTextKn ? c.promptTextKn : c.promptText}
          category={c.category}
          expiresAt={c.expiresAt}
          entries={c.entries || []}
          onVote={handleVote}
          onSubmitEntry={(text) => {}}
        />
      ))}
    </ScrollView>
  );
}
