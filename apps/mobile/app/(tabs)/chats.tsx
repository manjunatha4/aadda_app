import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { api } from '../../src/services/api';
import { clientStore } from '../../src/services/clientStore';
import { useAuthStore } from '../../src/stores/authStore';
import {
  MainLayout,
  PageHeader,
  GlassCard,
  PrimaryButton,
  SecondaryButton,
  InputField,
  EmptyState,
  LoadingState,
  ToastNotification,
  DS_TOKENS,
  DS_FONTS,
} from '../../src/components/DesignSystem';

export default function ChatsScreen() {
  const { i18n } = useTranslation();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingState message={i18n.language === 'kn' ? 'ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...' : 'Loading Rooms...'} />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  const [conversations, setConversations] = useState<any[]>([]);
  const [addas, setAddas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Secret code join state
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinStatus, setJoinStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isKn = i18n.language === 'kn';

  const loadData = async () => {
    try {
      const [convRes, addasRes] = await Promise.all([
        api.get('/conversations').catch(() => []),
        api.get('/addas').catch(() => []),
      ]);
      setConversations(convRes || []);
      setAddas(addasRes || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const handleJoinByCode = async () => {
    const code = inviteCode.trim().toUpperCase();
    if (!code) {
      setJoinStatus({
        type: 'error',
        message: isKn ? 'ದಯವಿಟ್ಟು ರೂಮ್ ಕೋಡ್ ನಮೂದಿಸಿ' : 'Please enter room code',
      });
      return;
    }
    try {
      setJoining(true);
      setJoinStatus(null);
      let res;
      try {
        res = await api.post('/invitations/accept', { code });
      } catch {
        res = await clientStore.acceptInvite(code);
      }

      setJoinStatus({
        type: 'success',
        message: `Joined ${res?.adda?.name || 'the Room'}! 🎉`,
      });
      setInviteCode('');
      await loadData();
      if (res?.conversationId) {
        setTimeout(() => {
          router.push(`/chat/${res.conversationId}`);
        }, 800);
      }
    } catch (e: any) {
      setJoinStatus({
        type: 'error',
        message:
          e.message ||
          (isKn
            ? 'ಅಮಾನ್ಯ ರೂಮ್ ಕೋಡ್. ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.'
            : 'Invalid Room Code. Please check the code and try again.'),
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
    setToastMessage(isKn ? 'ಕೋಡ್ ನಕಲಿಸಲಾಗಿದೆ!' : `Copied code ${code} to clipboard!`);
    setTimeout(() => {
      setCopiedId(null);
      setToastMessage(null);
    }, 2500);
  };

  const filteredConversations = conversations.filter((item) => {
    const name = item.adda?.name || item.name || 'Chat Room';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <MainLayout
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={DS_TOKENS.colors.purple} />
      }
    >
      <ToastNotification
        visible={Boolean(toastMessage)}
        message={toastMessage || ''}
        onDismiss={() => setToastMessage(null)}
      />

      {/* Page Header with unified "+ Create Room" button */}
      <PageHeader
        title={isKn ? 'ರೂಮ್ಸ್ ಮತ್ತು ಚಾಟ್‌ಗಳು' : 'Rooms & Chats'}
        subtitle={isKn ? 'ನಿಮ್ಮ ಎಲ್ಲಾ ಖಾಸಗಿ ಅಡ್ಡಗಳು ಮತ್ತು ನೇರ ಸಂಭಾಷಣೆಗಳು' : 'Create rooms, join via secret code, and chat'}
        badge={`${conversations.length} ${isKn ? 'ಸಕ್ರಿಯ' : 'active'}`}
        actions={
          <PrimaryButton
            title={isKn ? '+ ಹೊಸ ರೂಮ್ ರಚಿಸಿ' : '+ Create Room'}
            icon="🛖"
            onPress={() => router.push('/create-adda')}
          />
        }
      />

      {/* Secret Invite Code Join Box */}
      <GlassCard elevated style={{ marginBottom: 16 }}>
        <Text style={{ color: DS_TOKENS.colors.textPrimary, fontSize: 14, fontWeight: '800', marginBottom: 8 }}>
          🔑 {isKn ? 'ಸೀಕ್ರೆಟ್ ಕೋಡ್ ಮೂಲಕ ರೂಮ್‌ಗೆ ಸೇರಿ' : 'Join a Room with Secret Code'}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <InputField
              value={inviteCode}
              onChangeText={(txt) => setInviteCode(txt.toUpperCase())}
              placeholder={isKn ? 'ಕೋಡ್ ನಮೂದಿಸಿ (ಉದಾ: ADDA-XYZ)' : 'Enter Room Code (e.g. ADDA-XYZ)'}
              autoCapitalize="characters"
              style={{ marginBottom: 0 }}
            />
          </View>
          <PrimaryButton
            title={joining ? '...' : isKn ? 'ಸೇರಿ' : 'Join'}
            onPress={handleJoinByCode}
            disabled={joining}
            style={{ paddingVertical: 10, paddingHorizontal: 16 }}
          />
        </View>

        {joinStatus && (
          <Text
            style={{
              marginTop: 8,
              fontSize: 12,
              fontWeight: '700',
              color: joinStatus.type === 'success' ? DS_TOKENS.colors.emerald : DS_TOKENS.colors.rose,
            }}
          >
            {joinStatus.message}
          </Text>
        )}
      </GlassCard>

      {/* Search Bar */}
      <InputField
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder={isKn ? 'ರೂಮ್ಸ್ & ಚಾಟ್‌ಗಳನ್ನು ಹುಡುಕಿ...' : 'Search rooms by name...'}
        icon="🔍"
        style={{ marginBottom: 14 }}
      />

      {/* Active Rooms & Conversations List */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Text style={{ fontSize: 16, fontWeight: '900', color: '#0F172A' }}>
          {isKn ? 'ನಿಮ್ಮ ರೂಮ್‌ಗಳು' : 'Your Rooms'}
        </Text>
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#6366F1' }}>
          {filteredConversations.length} {isKn ? 'ಕೊಠಡಿಗಳು' : 'rooms'}
        </Text>
      </View>

      {loading ? (
        <LoadingState message={isKn ? 'ಚಾಟ್‌ಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...' : 'Loading conversations...'} />
      ) : filteredConversations.length === 0 ? (
        <EmptyState
          icon="🛖"
          title={searchQuery ? (isKn ? 'ಯಾವುದೇ ರೂಮ್ ಸಿಗಲಿಲ್ಲ' : 'No rooms found') : isKn ? 'ಯಾವುದೇ ರೂಮ್ ಇಲ್ಲ' : 'No rooms yet'}
          description={
            searchQuery
              ? isKn
                ? 'ಬೇರೆ ಹೆಸರನ್ನು ಹುಡುಕಲು ಪ್ರಯತ್ನಿಸಿ.'
                : 'No rooms match your search query.'
              : isKn
              ? 'ಹೊಸ ರೂಮ್ ರಚಿಸಿ ನಿಮ್ಮ ಮೊದಲ ಸಂಭಾಷಣೆಯನ್ನು ಪ್ರಾರಂಭಿಸಿ!'
              : 'Create your private room above or enter a secret code to join!'
          }
          actionLabel={searchQuery ? undefined : isKn ? '+ ಹೊಸ ರೂಮ್ ರಚಿಸಿ' : '+ Create Room'}
          onAction={searchQuery ? undefined : () => router.push('/create-adda')}
        />
      ) : (
        <View style={{ gap: 10, paddingBottom: 110 }}>
          {filteredConversations.map((item) => {
            const name = item.adda?.name || item.name || 'Hangout Room';
            const lastMsg = item.lastMessage?.content || (isKn ? 'ಸಂಭಾಷಣೆ ಪ್ರಾರಂಭಿಸಿ...' : 'Tap to open chat in this room');
            const time = item.lastMessage?.createdAt
              ? new Date(item.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Active';

            const roomEmoji = name.match(/[\p{Emoji}\u200d]+/gu)?.[0] || '🛖';
            const matchingAdda = addas.find((a) => a.conversationId === item.id || a.id === item.addaId);

            return (
              <GlassCard
                key={item.id}
                onPress={() => router.push(`/chat/${item.id}`)}
                style={{ padding: 14 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {/* Avatar Icon */}
                  <View
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 23,
                      backgroundColor: '#EEF2FF',
                      borderWidth: 1.5,
                      borderColor: '#C7D2FE',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>{roomEmoji}</Text>
                  </View>

                  {/* Room Details */}
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <Text numberOfLines={1} style={{ fontFamily: DS_FONTS.heading, color: '#0F172A', fontSize: 15, fontWeight: '800', flex: 1 }}>
                        {name}
                      </Text>
                      <Text style={{ fontFamily: DS_FONTS.mono, color: '#94A3B8', fontSize: 11, fontWeight: '700', marginLeft: 6 }}>
                        {time}
                      </Text>
                    </View>

                    <Text numberOfLines={1} style={{ fontFamily: DS_FONTS.body, color: '#64748B', fontSize: 12, fontWeight: '500' }}>
                      {lastMsg}
                    </Text>

                    {matchingAdda?.inviteCode && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            copyCode(matchingAdda.inviteCode, item.id);
                          }}
                          style={{
                            backgroundColor: '#F8FAFC',
                            borderWidth: 1,
                            borderColor: '#E2E8F0',
                            paddingHorizontal: 7,
                            paddingVertical: 2,
                            borderRadius: 6,
                          }}
                        >
                          <Text style={{ fontFamily: DS_FONTS.mono, fontSize: 10, fontWeight: '800', color: '#4F46E5' }}>
                            🔑 {matchingAdda.inviteCode} {copiedId === item.id ? '✓' : '📋'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  <Text style={{ color: '#94A3B8', fontSize: 16, fontWeight: '800' }}>›</Text>
                </View>
              </GlassCard>
            );
          })}
        </View>
      )}
    </MainLayout>
  );
}
