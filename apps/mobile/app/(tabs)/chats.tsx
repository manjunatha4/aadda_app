import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { api } from '../../src/services/api';
import { Floating } from '../../src/components/AnimatedVisuals';

// Speech bubble card palette & sticker accents inspired by the reference design
const BUBBLE_THEMES = [
  { bg: '#FF6464', text: '#FFFFFF', sub: 'rgba(255,255,255,0.85)', sticker: '🍓' },
  { bg: '#FFB323', text: '#261B05', sub: 'rgba(38,27,5,0.8)', sticker: '🐯' },
  { bg: '#FF8833', text: '#FFFFFF', sub: 'rgba(255,255,255,0.85)', sticker: '⚡' },
  { bg: '#3C97FF', text: '#FFFFFF', sub: 'rgba(255,255,255,0.85)', sticker: '🛼' },
  { bg: '#9C75F7', text: '#FFFFFF', sub: 'rgba(255,255,255,0.85)', sticker: '👅' },
  { bg: '#31C390', text: '#FFFFFF', sub: 'rgba(255,255,255,0.85)', sticker: '🐸' },
];

export default function ChatsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [conversations, setConversations] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isKn = i18n.language === 'kn';

  const loadConversations = async () => {
    try {
      const res = await api.get('/conversations');
      setConversations(res || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const filteredConversations = conversations.filter((item) => {
    const name = item.adda?.name || item.name || 'Chat Room';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F2EB', paddingHorizontal: 18, paddingTop: 16 }}>
      {/* Top Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: '#18171C', fontSize: 32, fontWeight: '900', letterSpacing: -0.5 }}>
            {isKn ? 'ಚಾಟ್‌ಗಳು' : 'Chats'}
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
              {conversations.length} {isKn ? 'ರೂಮ್ಸ್' : 'chats'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/create-adda')}
          activeOpacity={0.85}
          style={{
            backgroundColor: '#18171C',
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 9,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.15,
            shadowRadius: 5,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>
            + {isKn ? 'ಹೊಸ ರೂಮ್' : 'New Room'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 18,
          paddingHorizontal: 14,
          paddingVertical: 10,
          marginBottom: 16,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          borderWidth: 1,
          borderColor: '#E8E5DD',
        }}
      >
        <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={isKn ? 'ಚಾಟ್‌ಗಳನ್ನು ಹುಡುಕಿ...' : 'Search chats...'}
          placeholderTextColor="#9C9588"
          style={{
            flex: 1,
            fontSize: 14,
            color: '#18171C',
            fontWeight: '600',
          }}
        />
        {Boolean(searchQuery) && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={{ color: '#9C9588', fontWeight: '800', fontSize: 14 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Chat Speech Bubble Cards List */}
      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FF6464" />
        }
        renderItem={({ item, index }) => {
          const theme = BUBBLE_THEMES[index % BUBBLE_THEMES.length];
          const name = item.adda?.name || item.name || 'Chat Room';
          const lastMsg = item.lastMessage?.content || (isKn ? 'ಸಂಭಾಷಣೆ ಪ್ರಾರಂಭಿಸಿ...' : 'Hey there! Tap to join the chat.');
          const time = item.lastMessage?.createdAt
            ? new Date(item.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Just now';

          return (
            <TouchableOpacity
              onPress={() => router.push(`/chat/${item.id}`)}
              activeOpacity={0.88}
              style={{
                marginBottom: 14,
                position: 'relative',
              }}
            >
              {/* Organic Speech Bubble Container with bubble tail */}
              <View
                style={{
                  backgroundColor: theme.bg,
                  borderRadius: 26,
                  borderTopLeftRadius: 8, // playful speech bubble tail indicator
                  padding: 16,
                  shadowColor: theme.bg,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 4,
                  minHeight: 88,
                  justifyContent: 'center',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {/* User Avatar Circle */}
                  <View
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 23,
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 14,
                      borderWidth: 2.5,
                      borderColor: '#FFFFFF',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.15,
                      shadowRadius: 3,
                    }}
                  >
                    <Text style={{ fontSize: 20 }}>
                      {name.match(/[\p{Emoji}\u200d]+/gu)?.[0] || '💬'}
                    </Text>
                  </View>

                  {/* Content details */}
                  <View style={{ flex: 1, paddingRight: 32 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text
                        numberOfLines={1}
                        style={{
                          color: theme.text,
                          fontSize: 16,
                          fontWeight: '900',
                          letterSpacing: -0.2,
                        }}
                      >
                        {name.replace(/[\p{Emoji}\u200d]+/gu, '').trim() || name}
                      </Text>
                      <Text
                        style={{
                          color: theme.sub,
                          fontSize: 11,
                          fontWeight: '700',
                          marginLeft: 6,
                        }}
                      >
                        {time}
                      </Text>
                    </View>

                    <Text
                      numberOfLines={2}
                      style={{
                        color: theme.sub,
                        fontSize: 13,
                        fontWeight: '600',
                        lineHeight: 18,
                      }}
                    >
                      {lastMsg}
                    </Text>
                  </View>
                </View>

                {/* Floating Corner Sticker Accent */}
                <View
                  style={{
                    position: 'absolute',
                    bottom: 10,
                    right: 14,
                  }}
                >
                  <Floating distance={3} duration={2600 + index * 200}>
                    <Text style={{ fontSize: 18 }}>{theme.sticker}</Text>
                  </Floating>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 28,
              padding: 32,
              alignItems: 'center',
              marginTop: 40,
              borderWidth: 1,
              borderColor: '#E8E5DD',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 6,
            }}
          >
            <Floating distance={6} duration={2200}>
              <Text style={{ fontSize: 50, marginBottom: 12 }}>💬</Text>
            </Floating>
            <Text style={{ color: '#18171C', fontSize: 20, fontWeight: '900', textAlign: 'center' }}>
              {isKn ? 'ಯಾವುದೇ ಚಾಟ್ ಇಲ್ಲ' : 'No chats yet!'}
            </Text>
            <Text style={{ color: '#78716C', fontSize: 14, textAlign: 'center', marginTop: 6, lineHeight: 20 }}>
              {isKn
                ? 'ಹೊಸ ರೂಮ್ ರಚಿಸಿ ಅಥವಾ ನಿಮ್ಮ ಸ್ನೇಹಿತರನ್ನು ಸೇರಿಸಿಕೊಳ್ಳಿ'
                : 'Create your first room or join a circle to chat with real users!'}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/create-adda')}
              activeOpacity={0.85}
              style={{
                backgroundColor: '#FF6464',
                borderRadius: 20,
                paddingHorizontal: 22,
                paddingVertical: 12,
                marginTop: 20,
                shadowColor: '#FF6464',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 14 }}>
                + {isKn ? 'ಹೊಸ ರೂಮ್ ರಚಿಸಿ' : 'Create Room'}
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}
