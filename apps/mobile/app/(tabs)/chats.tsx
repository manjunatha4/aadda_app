import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../src/services/api';
import { Floating } from '../../src/components/AnimatedVisuals';

export default function ChatsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [conversations, setConversations] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

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

  return (
    <LinearGradient colors={['#1F0E33', '#150924', '#0D0517']} style={{ flex: 1, padding: 16 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Floating distance={4} duration={2200}>
            <Text style={{ fontSize: 24, marginRight: 8 }}>💬</Text>
          </Floating>
          <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '900', letterSpacing: -0.3 }}>
            {isKn ? 'ಚಾಟ್‌ಗಳು' : 'Circle Chats'} ({conversations.length})
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/create-adda')}
          activeOpacity={0.85}
          style={{
            borderRadius: 14,
            overflow: 'hidden',
          }}
        >
          <LinearGradient
            colors={['#FF8A82', '#FF6E67', '#E04840']}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 7,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 12 }}>
              + {isKn ? 'ಹೊಸ ಕೊಠಡಿ' : 'New Room'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#D9FF67" />
        }
        renderItem={({ item, index }) => (
          <TouchableOpacity
            onPress={() => router.push(`/chat/${item.id}`)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#2E164A', '#1C0D30']}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderRadius: 20,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1.5,
                borderColor: '#462370',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 6,
              }}
            >
              {/* Avatar Chip with Glowing Halo */}
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: item.type === 'ADDA' ? '#D9FF67' : '#FF786B',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 14,
                  borderWidth: 2,
                  borderColor: 'rgba(255,255,255,0.2)',
                  shadowColor: item.type === 'ADDA' ? '#D9FF67' : '#FF786B',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.5,
                  shadowRadius: 8,
                }}
              >
                <Text style={{ fontSize: 24 }}>
                  {item.type === 'ADDA' ? '🛖' : '👤'}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '800' }} numberOfLines={1}>
                    {item.addaName || 'Private Hangout'}
                  </Text>
                  {item.lastMessage && (
                    <Text style={{ color: '#A592C4', fontSize: 11, fontWeight: '600' }}>
                      {new Date(item.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  )}
                </View>

                <Text
                  style={{
                    color: '#E0D5F0',
                    opacity: 0.8,
                    fontSize: 13,
                    marginTop: 4,
                  }}
                  numberOfLines={1}
                >
                  {item.lastMessage
                    ? `${item.lastMessage.senderName}: ${item.lastMessage.content}`
                    : (isKn ? 'ಚಾಟ್ ಮಾಡಲು ಟ್ಯಾಪ್ ಮಾಡಿ...' : 'Tap to open chat...')}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <LinearGradient
            colors={['#2D1549', '#1B0B2E']}
            style={{
              borderRadius: 24,
              padding: 28,
              alignItems: 'center',
              marginTop: 30,
              borderWidth: 1.5,
              borderColor: '#4A2576',
            }}
          >
            <Floating distance={10} duration={2600}>
              <Text style={{ fontSize: 56, marginBottom: 10 }}>💬</Text>
            </Floating>
            <Text style={{ color: '#FFFFFF', fontSize: 19, fontWeight: '900', marginTop: 6 }}>
              {isKn ? 'ಯಾವುದೇ ಚಾಟ್‌ಗಳಿಲ್ಲ' : 'No Conversations Yet'}
            </Text>
            <Text style={{ color: '#A592C4', fontSize: 13, textAlign: 'center', marginTop: 6, marginBottom: 20, lineHeight: 18 }}>
              {isKn
                ? 'ಅಡ್ಡಾ ರೂಮ್ ಕ್ರಿಯೇಟ್ ಮಾಡಿದಾಗ ಅಥವಾ ಜಾಯಿನ್ ಆದಾಗ ಚಾಟ್ ಇಲ್ಲಿ ತಕ್ಷಣ ಕಾಣಿಸುತ್ತದೆ.'
                : 'Create an Adda room or join with a code to start chatting in real time with your circle.'}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/create-adda')}
              activeOpacity={0.85}
              style={{
                borderRadius: 14,
                overflow: 'hidden',
                shadowColor: '#D9FF67',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}
            >
              <LinearGradient
                colors={['#E5FF8F', '#D9FF67', '#AEEB2A']}
                style={{
                  paddingVertical: 13,
                  paddingHorizontal: 24,
                }}
              >
                <Text style={{ color: '#180B2E', fontWeight: '900', fontSize: 14 }}>
                  + {isKn ? 'ಅಡ್ಡಾ ರೂಮ್ ರಚಿಸಿ' : 'Create Room Now'} 🚀
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        }
      />
    </LinearGradient>
  );
}
