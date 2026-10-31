import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { api } from '../../src/services/api';
import {
  MainLayout,
  PageHeader,
  GlassCard,
  PrimaryButton,
  InputField,
  EmptyState,
  LoadingState,
  DS_TOKENS,
} from '../../src/components/DesignSystem';

export default function ChatsScreen() {
  const { i18n } = useTranslation();
  const router = useRouter();

  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isKn = i18n.language === 'kn';

  const loadConversations = async () => {
    try {
      const res = await api.get('/conversations');
      setConversations(res || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
  };

  const filteredConversations = conversations.filter((item) => {
    const name = item.adda?.name || item.name || 'Chat Room';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <MainLayout
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#7C3AED" />
      }
    >
      {/* Page Header */}
      <PageHeader
        title={isKn ? 'ಚಾಟ್‌ಗಳು' : 'Messages'}
        subtitle={isKn ? 'ನಿಮ್ಮ ರೂಮ್‌ಗಳು ಮತ್ತು ನೇರ ಸಂಭಾಷಣೆಗಳು' : 'Your real-time conversations & room channels'}
        badge={`${conversations.length} ${isKn ? 'ಸಂಭಾಷಣೆಗಳು' : 'active'}`}
        actions={
          <PrimaryButton
            title={isKn ? '+ ಹೊಸ ರೂಮ್' : '+ New Room'}
            icon="💬"
            onPress={() => router.push('/create-adda')}
          />
        }
      />

      {/* Search Bar */}
      <InputField
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder={isKn ? 'ಚಾಟ್‌ಗಳನ್ನು ಹುಡುಕಿ...' : 'Search conversations by name...'}
        icon="🔍"
        style={{ marginBottom: 16 }}
      />

      {/* Conversations List */}
      {loading ? (
        <LoadingState message={isKn ? 'ಚಾಟ್‌ಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...' : 'Loading conversations...'} />
      ) : filteredConversations.length === 0 ? (
        <EmptyState
          icon="💬"
          title={searchQuery ? (isKn ? 'ಯಾವುದೇ ಚಾಟ್ ಸಿಗಲಿಲ್ಲ' : 'No chats found') : (isKn ? 'ಯಾವುದೇ ಚಾಟ್‌ಗಳು ಪ್ರಾರಂಭವಾಗಿಲ್ಲ' : 'No conversations yet')}
          description={
            searchQuery
              ? (isKn ? 'ಬೇರೆ ಹೆಸರನ್ನು ಹುಡುಕಲು ಪ್ರಯತ್ನಿಸಿ.' : 'No conversations match your search query.')
              : (isKn ? 'ಹೊಸ ರೂಮ್ ರಚಿಸಿ ನಿಮ್ಮ ಮೊದಲ ಸಂಭಾಷಣೆಯನ್ನು ಪ್ರಾರಂಭಿಸಿ!' : 'Create a room or join one with an invite code to start messaging in real-time!')
          }
          actionLabel={searchQuery ? undefined : (isKn ? '+ ಹೊಸ ರೂಮ್ ರಚಿಸಿ' : '+ Start New Room')}
          onAction={searchQuery ? undefined : () => router.push('/create-adda')}
        />
      ) : (
        <View style={{ gap: 10 }}>
          {filteredConversations.map((item) => {
            const name = item.adda?.name || item.name || 'Chat Room';
            const lastMsg = item.lastMessage?.content || (isKn ? 'ಸಂಭಾಷಣೆ ಪ್ರಾರಂಭಿಸಿ...' : 'Tap to start chatting in this room');
            const time = item.lastMessage?.createdAt
              ? new Date(item.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Active';

            const roomEmoji = name.match(/[\p{Emoji}\u200d]+/gu)?.[0] || '💬';

            return (
              <GlassCard
                key={item.id}
                onPress={() => router.push(`/chat/${item.id}`)}
                style={{ padding: 16 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {/* Avatar Icon */}
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: 'rgba(124, 58, 237, 0.2)',
                      borderWidth: 1.5,
                      borderColor: 'rgba(124, 58, 237, 0.45)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 14,
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>{roomEmoji}</Text>
                  </View>

                  {/* Room Details */}
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text numberOfLines={1} style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800', flex: 1 }}>
                        {name}
                      </Text>
                      <Text style={{ color: '#64748B', fontSize: 11, fontWeight: '700', marginLeft: 8 }}>
                        {time}
                      </Text>
                    </View>

                    <Text numberOfLines={1} style={{ color: '#94A3B8', fontSize: 13, fontWeight: '500' }}>
                      {lastMsg}
                    </Text>
                  </View>

                  <Text style={{ color: '#64748B', fontSize: 16, fontWeight: '800' }}>›</Text>
                </View>
              </GlassCard>
            );
          })}
        </View>
      )}
    </MainLayout>
  );
}
