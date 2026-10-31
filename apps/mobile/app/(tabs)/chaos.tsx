import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../src/services/api';
import { ChaosCard } from '../../src/components/ChaosCard';
import { Floating, Pulse } from '../../src/components/AnimatedVisuals';

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
  const [preset, setPreset] = useState<any>(null);

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
      const p = await api.get('/chaos/presets').catch(() => null);
      setPreset(p);
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
      // Optimistic local update
      setChallenges((prev) =>
        prev.map((c) => ({
          ...c,
          entries: c.entries?.map((e: any) =>
            e.id === entryId ? { ...e, voteCount: (e.voteCount || 0) + 1 } : e,
          ),
        })),
      );
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <LinearGradient colors={['#1F0E33', '#150924', '#0D0517']} style={{ flex: 1, padding: 16 }}>
      {/* Animated Hero Banner */}
      <LinearGradient
        colors={['#FF6E67', '#FF9A3D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 22,
          padding: 20,
          marginBottom: 18,
          shadowColor: '#FF6E67',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 10,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Floating distance={6} duration={1800}>
            <Text style={{ fontSize: 32, marginRight: 8 }}>🔥</Text>
          </Floating>
          <Text style={{ color: '#180B2E', fontSize: 22, fontWeight: '900', letterSpacing: -0.3 }}>
            {t('chaos.title')}
          </Text>
        </View>

        <Text style={{ color: '#2C0E05', fontSize: 13, fontWeight: '700', marginTop: 4 }}>
          {t('chaos.subtitle')}
        </Text>

        {preset && (
          <View style={{ marginTop: 12, backgroundColor: 'rgba(255,255,255,0.92)', padding: 10, borderRadius: 12 }}>
            <Text style={{ color: '#180B2E', fontWeight: '800', fontSize: 12 }}>
              💡 Preset: {isKn && preset.promptTextKn ? preset.promptTextKn : preset.promptText}
            </Text>
          </View>
        )}
      </LinearGradient>

      <FlatList
        data={challenges}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#D9FF67" />
        }
        renderItem={({ item }) => (
          <ChaosCard
            promptText={item.promptText}
            promptTextKn={item.promptTextKn}
            category={item.category}
            expiresAt={item.expiresAt}
            entries={item.entries}
            isKannada={isKn}
            onVote={handleVote}
            onSubmitAnswer={() => router.push(`/chaos/${item.id}`)}
          />
        )}
      />
    </LinearGradient>
  );
}
