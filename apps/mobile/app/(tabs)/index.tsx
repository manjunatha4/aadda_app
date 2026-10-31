import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, TextInput, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../src/services/api';
import { useAuthStore } from '../../src/stores/authStore';
import { VibePill } from '../../src/components/VibePill';
import { Floating, Pulse } from '../../src/components/AnimatedVisuals';

export default function AddasScreen() {
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

  return (
    <LinearGradient colors={['#1F0E33', '#150924', '#0D0517']} style={{ flex: 1, padding: 16 }}>
      {/* Vibe Check Carousel Header */}
      <View style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Floating distance={4} duration={2000}>
              <Text style={{ fontSize: 18, marginRight: 6 }}>⚡</Text>
            </Floating>
            <Text style={{ color: '#D9FF67', fontSize: 17, fontWeight: '900', letterSpacing: 0.5 }}>
              {isKn ? 'ಲೈವ್ ವೈಬ್ ಚೆಕ್' : 'Live Vibe Check'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/modal/vibe')}
            style={{
              backgroundColor: 'rgba(255, 120, 107, 0.15)',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: '#FF786B',
            }}
          >
            <Text style={{ color: '#FF786B', fontSize: 11, fontWeight: '800' }}>
              + {isKn ? 'ನಿಮ್ಮ ವೈಬ್ ಹಾಕಿ' : 'Set My Vibe'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
          {vibes.length === 0 ? (
            <View
              style={{
                backgroundColor: 'rgba(38, 20, 61, 0.7)',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: '#3D2061',
              }}
            >
              <Text style={{ color: '#A592C4', fontSize: 12, fontStyle: 'italic' }}>
                {isKn ? 'ಯಾರೂ ಇನ್ನೂ ವೈಬ್ ಹಾಕಿಲ್ಲ — ಮೊದಲಿಗೆ ನೀವೇ ಹಾಕಿ! ✨' : 'No active vibes in your circle yet — be the first to set one! ✨'}
              </Text>
            </View>
          ) : (
            vibes.map((v) => (
              <VibePill
                key={v.id}
                mood={v.mood}
                customNote={v.customNote}
                username={v.user.displayName.split(' ')[0]}
                isKannada={isKn}
              />
            ))
          )}
        </ScrollView>
      </View>

      {/* Join Adda with Code Banner */}
      <LinearGradient
        colors={['#2B1445', '#1C0C30']}
        style={{
          borderRadius: 20,
          padding: 16,
          marginBottom: 16,
          borderWidth: 1.5,
          borderColor: '#42216A',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
        }}
      >
        <Text style={{ color: '#F4F0FF', fontSize: 13, fontWeight: '800', marginBottom: 8 }}>
          🔑 {isKn ? 'ಸೀಕ್ರೆಟ್ ಕೋಡ್‌ನಿಂದ ಅಡ್ಡಾಗೆ ಜಾಯಿನ್ ಆಗಿ' : 'Join a Room with Secret Code'}
        </Text>
        <View style={{ flexDirection: 'row' }}>
          <TextInput
            value={inviteCode}
            onChangeText={setInviteCode}
            placeholder="e.g. ADDA-XXXX"
            placeholderTextColor="#8C7D9E"
            autoCapitalize="characters"
            style={{
              flex: 1,
              backgroundColor: '#120722',
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 10,
              color: '#D9FF67',
              fontWeight: '800',
              fontSize: 14,
              marginRight: 10,
              borderWidth: 1.5,
              borderColor: '#4A2576',
            }}
          />
          <TouchableOpacity
            onPress={handleJoinByCode}
            disabled={joining}
            activeOpacity={0.85}
            style={{
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <LinearGradient
              colors={['#E5FF8F', '#D9FF67', '#AEEB2A']}
              style={{
                paddingHorizontal: 18,
                paddingVertical: 11,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#180B2E', fontWeight: '900', fontSize: 13 }}>
                {joining ? '...' : (isKn ? 'ಸೇರಿ 🚀' : 'Join 🚀')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {joinStatus && (
          <View
            style={{
              marginTop: 10,
              padding: 8,
              borderRadius: 10,
              backgroundColor: joinStatus.type === 'success' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(255, 92, 77, 0.2)',
              borderWidth: 1,
              borderColor: joinStatus.type === 'success' ? '#2ECC71' : '#FF5C4D',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12, textAlign: 'center' }}>
              {joinStatus.type === 'success' ? '✓ ' : '⚠️ '} {joinStatus.message}
            </Text>
          </View>
        )}
      </LinearGradient>

      {/* Header and Create Button */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '900' }}>
          {isKn ? 'ನಿಮ್ಮ ಅಡ್ಡಾಗಳು' : 'My Hangouts'} ({addas.length})
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/create-adda')}
          activeOpacity={0.85}
          style={{
            borderRadius: 14,
            overflow: 'hidden',
            shadowColor: '#FF6E67',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.35,
            shadowRadius: 6,
          }}
        >
          <LinearGradient
            colors={['#FF8A82', '#FF6E67', '#E04840']}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 13 }}>
              + {isKn ? 'ಹೊಸ ಅಡ್ಡಾ' : 'Create Room'} 🛖
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Addas List with Gradient Cards */}
      <FlatList
        data={addas}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#D9FF67" />
        }
        renderItem={({ item }) => (
          <LinearGradient
            colors={['#2D1549', '#1C0C30']}
            style={{
              borderRadius: 22,
              padding: 18,
              marginBottom: 14,
              borderWidth: 1.5,
              borderColor: '#4A2576',
              shadowColor: '#D9FF67',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={{ color: '#D9FF67', fontSize: 19, fontWeight: '900' }}>
                  {item.name}
                </Text>
                {item.description ? (
                  <Text style={{ color: '#E8DFF5', opacity: 0.85, fontSize: 13, marginTop: 4, lineHeight: 18 }}>
                    {item.description}
                  </Text>
                ) : null}
              </View>

              <View
                style={{
                  backgroundColor: 'rgba(217, 255, 103, 0.12)',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: '#D9FF67',
                }}
              >
                <Text style={{ color: '#D9FF67', fontSize: 11, fontWeight: '800' }}>
                  {item.myRole || 'MEMBER'}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', marginTop: 14, justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                <Text style={{ color: '#A592C4', fontSize: 12 }}>
                  👥 {item.memberCount || item.members?.length || 1} {isKn ? 'ಜನರು' : 'members'}
                </Text>

                {item.inviteCode && (
                  <TouchableOpacity
                    onPress={() => copyCode(item.inviteCode, item.id)}
                    style={{
                      backgroundColor: copiedId === item.id ? '#2ECC71' : 'rgba(255, 120, 107, 0.15)',
                      paddingHorizontal: 10,
                      paddingVertical: 3,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: copiedId === item.id ? '#2ECC71' : '#FF786B',
                    }}
                  >
                    <Text style={{ color: copiedId === item.id ? '#FFFFFF' : '#FF786B', fontSize: 11, fontWeight: '800' }}>
                      {copiedId === item.id ? '✓ COPIED' : `🔑 ${item.inviteCode}`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                onPress={() => {
                  if (item.conversationId) {
                    router.push(`/chat/${item.conversationId}`);
                  } else {
                    router.push(`/adda/${item.id}`);
                  }
                }}
                activeOpacity={0.85}
                style={{
                  borderRadius: 12,
                  overflow: 'hidden',
                }}
              >
                <LinearGradient
                  colors={['#E5FF8F', '#D9FF67', '#AEEB2A']}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                  }}
                >
                  <Text style={{ color: '#180B2E', fontWeight: '900', fontSize: 12 }}>
                    Open Chat 💬
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        )}
        ListEmptyComponent={
          <LinearGradient
            colors={['#2D1549', '#1B0B2E']}
            style={{
              borderRadius: 24,
              padding: 28,
              alignItems: 'center',
              marginTop: 20,
              borderWidth: 1.5,
              borderColor: '#4A2576',
            }}
          >
            <Floating distance={10} duration={2500}>
              <Text style={{ fontSize: 56, marginBottom: 8 }}>🛖</Text>
            </Floating>
            <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '900', textAlign: 'center', marginTop: 8 }}>
              {isKn ? 'ಇನ್ನೂ ಯಾವುದೇ ಅಡ್ಡಾಗಳಿಲ್ಲ!' : 'No Adda Rooms Yet!'}
            </Text>
            <Text style={{ color: '#A592C4', fontSize: 13, textAlign: 'center', marginTop: 6, marginBottom: 22, lineHeight: 18 }}>
              {isKn
                ? 'ನಿಮ್ಮ ಗ್ಯಾಂಗ್‌ಗಾಗಿ ಮೊದಲ ಅಡ್ಡಾ ಕ್ರಿಯೇಟ್ ಮಾಡಿ ಅಥವಾ ಇನ್ವೈಟ್ ಕೋಡ್ ಬಳಸಿ ಜಾಯಿನ್ ಆಗಿ.'
                : 'Create your very first private hangout room or join your friends with a secret invite code.'}
            </Text>

            <TouchableOpacity
              onPress={() => router.push('/create-adda')}
              activeOpacity={0.85}
              style={{
                borderRadius: 16,
                overflow: 'hidden',
                shadowColor: '#D9FF67',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 10,
              }}
            >
              <LinearGradient
                colors={['#E5FF8F', '#D9FF67', '#AEEB2A']}
                style={{
                  paddingVertical: 14,
                  paddingHorizontal: 26,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#180B2E', fontWeight: '900', fontSize: 15 }}>
                  + {isKn ? 'ಮೊದಲ ಅಡ್ಡಾ ರಚಿಸಿ' : 'Create First Adda Room'} 🚀
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        }
      />
    </LinearGradient>
  );
}
