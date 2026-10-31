import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, TextInput, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { api } from '../../src/services/api';
import { useAuthStore } from '../../src/stores/authStore';
import { Floating } from '../../src/components/AnimatedVisuals';

export default function TodayScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [addas, setAddas] = useState<any[]>([]);
  const [vibes, setVibes] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [joinStatus, setJoinStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isKn = i18n.language === 'kn';

  // Format dynamic date like "• Dec '21 / Wednesday"
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const dayFormatted = now.toLocaleDateString('en-US', { weekday: 'long' });

  const loadData = async () => {
    try {
      const [addasRes, vibesRes] = await Promise.all([
        api.get('/addas').catch(() => []),
        api.get('/vibe/circle').catch(() => []),
      ]);
      setAddas(addasRes || []);
      setVibes(vibesRes || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleJoinByCode = async () => {
    const code = inviteCode.trim();
    if (!code) {
      setJoinStatus({
        type: 'error',
        message: isKn ? 'ದಯವಿಟ್ಟು ಇನ್ವಿಟೇಶನ್ ಕೋಡ್ ನಮೂದಿಸಿ' : 'Please enter invite code',
      });
      return;
    }
    try {
      setJoining(true);
      setJoinStatus(null);
      const res = await api.post('/invitations/accept', { code });
      setJoinStatus({
        type: 'success',
        message: `Welcome to ${res.adda?.name || 'the Adda'}! 🎉`,
      });
      setInviteCode('');
      await loadData();
      if (res.conversationId) {
        setTimeout(() => {
          router.push(`/chat/${res.conversationId}`);
        }, 1000);
      }
    } catch (e: any) {
      setJoinStatus({
        type: 'error',
        message: e.message || 'Invalid or expired invite code',
      });
    } finally {
      setJoining(false);
    }
  };

  const copyCode = (code: string, id: string) => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const displayName = user?.displayName || user?.username || 'Friend';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#141416' }}
      contentContainerStyle={{ padding: 18, paddingBottom: 110 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FFA500" />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Top Header matching reference Screen 1 */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 36, fontWeight: '900', letterSpacing: -0.5 }}>
          {isKn ? 'ಇಂದು' : 'Today'}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF7A29', marginRight: 6 }} />
          <Text style={{ color: '#A1A1AA', fontSize: 13, fontWeight: '700' }}>
            • {dateFormatted} / {dayFormatted}
          </Text>
        </View>
      </View>

      {/* Hero Greeting Card with Playful Sticker Accents */}
      <View
        style={{
          backgroundColor: '#1E1E22',
          borderRadius: 28,
          padding: 22,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: '#2A2A30',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Text style={{ color: '#E4E4E7', fontSize: 17, lineHeight: 26, fontWeight: '600', maxWidth: '85%' }}>
          Hi, <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>{displayName}</Text>! Today you're going to{' '}
          <Text style={{ color: '#FF7A29', fontWeight: '800' }}>hangout</Text>, connect with your squad, and bring your real vibes.
        </Text>

        {/* Floating playful 3D sticker icons from the reference image */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14 }}>
          <Floating distance={5} duration={2400}>
            <View
              style={{
                backgroundColor: '#2A2A32',
                borderRadius: 16,
                paddingHorizontal: 12,
                paddingVertical: 6,
                marginRight: 8,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 18, marginRight: 6 }}>🐸</Text>
              <Text style={{ color: '#D4D4D8', fontSize: 12, fontWeight: '700' }}>Chillin'</Text>
            </View>
          </Floating>

          <Floating distance={4} duration={2100} delay={300}>
            <View
              style={{
                backgroundColor: '#2A2A32',
                borderRadius: 16,
                paddingHorizontal: 12,
                paddingVertical: 6,
                marginRight: 8,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 18, marginRight: 6 }}>🛵</Text>
              <Text style={{ color: '#D4D4D8', fontSize: 12, fontWeight: '700' }}>On the move</Text>
            </View>
          </Floating>

          <Floating distance={6} duration={2600} delay={600}>
            <View
              style={{
                backgroundColor: '#2A2A32',
                borderRadius: 16,
                paddingHorizontal: 12,
                paddingVertical: 6,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 18, marginRight: 6 }}>🍦</Text>
              <Text style={{ color: '#D4D4D8', fontSize: 12, fontWeight: '700' }}>Sweet</Text>
            </View>
          </Floating>
        </View>

        {/* Quick action: Create Adda button */}
        <TouchableOpacity
          onPress={() => router.push('/create-adda')}
          activeOpacity={0.85}
          style={{
            marginTop: 18,
            backgroundColor: '#FF6464',
            borderRadius: 18,
            paddingVertical: 12,
            alignItems: 'center',
            shadowColor: '#FF6464',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 14 }}>
            + {isKn ? 'ಹೊಸ ರೂಮ್ / ಅಡ್ಡಾ ರಚಿಸಿ' : 'Create New Room'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Secret Invite Code Join Box */}
      <View
        style={{
          backgroundColor: '#1E1E22',
          borderRadius: 24,
          padding: 18,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: '#2A2A30',
        }}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800', marginBottom: 10 }}>
          🔑 {isKn ? 'ಇನ್ವಿಟೇಶನ್ ಕೋಡ್ ಮೂಲಕ ಸೇರಿ' : 'Join with Invite Code'}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextInput
            value={inviteCode}
            onChangeText={(txt) => setInviteCode(txt.toUpperCase())}
            placeholder={isKn ? 'ಕೋಡ್ ನಮೂದಿಸಿ (ಉದಾ: ADDA-XYZ)' : 'Enter Code (e.g. ADDA-XYZ)'}
            placeholderTextColor="#71717A"
            autoCapitalize="characters"
            style={{
              flex: 1,
              backgroundColor: '#141416',
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 10,
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: '700',
              borderWidth: 1,
              borderColor: '#2D2D35',
              marginRight: 10,
            }}
          />
          <TouchableOpacity
            onPress={handleJoinByCode}
            disabled={joining}
            activeOpacity={0.8}
            style={{
              backgroundColor: '#3C97FF',
              borderRadius: 14,
              paddingHorizontal: 18,
              paddingVertical: 11,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 13 }}>
              {joining ? '...' : (isKn ? 'ಸೇರಿ' : 'Join')}
            </Text>
          </TouchableOpacity>
        </View>

        {joinStatus && (
          <Text
            style={{
              marginTop: 10,
              fontSize: 13,
              fontWeight: '700',
              color: joinStatus.type === 'success' ? '#34D399' : '#F87171',
            }}
          >
            {joinStatus.message}
          </Text>
        )}
      </View>

      {/* White Clean Container: "From your addas / chats" matching reference Screen 1 */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 30,
          padding: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ color: '#18181B', fontSize: 18, fontWeight: '900' }}>
            {isKn ? 'ನಿಮ್ಮ ಅಡ್ಡಾಗಳು' : 'From your addas'}
          </Text>
          <View
            style={{
              backgroundColor: '#F4F4F5',
              borderRadius: 12,
              paddingHorizontal: 10,
              paddingVertical: 3,
            }}
          >
            <Text style={{ color: '#71717A', fontSize: 12, fontWeight: '800' }}>
              {addas.length} {isKn ? 'ಕೊಠಡಿಗಳು' : 'rooms'}
            </Text>
          </View>
        </View>

        {addas.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>🛖</Text>
            <Text style={{ color: '#18181B', fontSize: 16, fontWeight: '800' }}>
              {isKn ? 'ಇನ್ನೂ ಯಾವುದೇ ಕೊಠಡಿಗಳಿಲ್ಲ' : 'No rooms joined yet'}
            </Text>
            <Text style={{ color: '#71717A', fontSize: 13, textAlign: 'center', marginTop: 4 }}>
              {isKn ? 'ಮೇಲಿರುವ ಬಟನ್ ಒತ್ತಿ ಹೊಸ ಅಡ್ಡಾ ಸೃಷ್ಟಿಸಿ!' : 'Tap Create New Room above to start your circle!'}
            </Text>
          </View>
        ) : (
          addas.map((adda, idx) => (
            <TouchableOpacity
              key={adda.id}
              onPress={() => router.push(adda.conversationId ? `/chat/${adda.conversationId}` : `/adda/${adda.id}`)}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                borderBottomWidth: idx === addas.length - 1 ? 0 : 1,
                borderBottomColor: '#F4F4F5',
              }}
            >
              {/* Member Avatar Circle */}
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: ['#FF6464', '#FFA834', '#3C97FF', '#9C75F7', '#31C390'][idx % 5],
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                }}
              >
                <Text style={{ fontSize: 20 }}>
                  {adda.name?.match(/[\p{Emoji}\u200d]+/gu)?.[0] || '🛖'}
                </Text>
              </View>

              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text
                  numberOfLines={1}
                  style={{ color: '#18181B', fontSize: 15, fontWeight: '800', marginBottom: 2 }}
                >
                  {adda.name}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{ color: '#71717A', fontSize: 13, fontWeight: '500' }}
                >
                  {adda.memberCount || 1} {isKn ? 'ಸದಸ್ಯರು' : 'members'} • {adda.description || 'Active circle'}
                </Text>
              </View>

              {/* Code copy or arrow */}
              {adda.inviteCode ? (
                <TouchableOpacity
                  onPress={() => copyCode(adda.inviteCode, adda.id)}
                  style={{
                    backgroundColor: copiedId === adda.id ? '#D1FAE5' : '#F4F4F5',
                    borderRadius: 12,
                    paddingHorizontal: 9,
                    paddingVertical: 5,
                    marginRight: 6,
                  }}
                >
                  <Text
                    style={{
                      color: copiedId === adda.id ? '#059669' : '#3F3F46',
                      fontSize: 11,
                      fontWeight: '800',
                    }}
                  >
                    {copiedId === adda.id ? 'Copied!' : adda.inviteCode}
                  </Text>
                </TouchableOpacity>
              ) : null}

              <Text style={{ color: '#A1A1AA', fontSize: 16, fontWeight: '800' }}>›</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}
