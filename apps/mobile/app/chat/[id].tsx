import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { api } from '../../src/services/api';
import { socketService } from '../../src/services/socket';
import { useAuthStore } from '../../src/stores/authStore';
import { useChatStore } from '../../src/stores/chatStore';
import { MessageBubble } from '../../src/components/MessageBubble';
import { Floating } from '../../src/components/AnimatedVisuals';
import { SocketEvents } from '@aadda/shared';

// Gen-Z Sticker Collection matching the reference image
const STICKER_COLLECTION = [
  { id: 'icecream', char: '🍦', label: 'Chill' },
  { id: 'strawberry', char: '🍓', label: 'Sweet' },
  { id: 'alien', char: '🐸', label: 'Vibe' },
  { id: 'lightning', char: '⚡', label: 'Hyped' },
  { id: 'tongue', char: '👅', label: 'Sassy' },
  { id: 'lightbulb', char: '💡', label: 'Idea' },
  { id: 'diamond', char: '💎', label: 'Priceless' },
  { id: 'skate', char: '🛼', label: 'Rollin' },
  { id: 'shaka', char: '🤙', label: 'Hangout' },
  { id: 'cat', char: '🐱', label: 'Yeah!' },
  { id: 'fire', char: '🔥', label: 'Lit' },
  { id: 'crown', char: '👑', label: 'Boss' },
];

export default function ChatScreen() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const {
    messages,
    setMessages,
    addMessage,
    typingUsers,
    setUserTyping,
    updateReaction,
  } = useChatStore();

  const [conversationInfo, setConversationInfo] = useState<any>(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [showStickers, setShowStickers] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [stickerTab, setStickerTab] = useState<'stickers' | 'smileys' | 'abc'>('stickers');
  const fileInputRef = useRef<any>(null);
  const typingTimeoutRef = useRef<any>(null);

  const currentMessages = messages[conversationId] || [];
  const currentTyping = typingUsers[conversationId] || [];

  const isKn = i18n.language === 'kn';

  // Load conversation details
  useEffect(() => {
    api.get(`/conversations/${conversationId}`)
      .then((res) => setConversationInfo(res))
      .catch(() => {});
  }, [conversationId]);

  // Setup Socket & Load History with multi-device background polling
  useEffect(() => {
    let socket: any = null;

    const fetchHistory = async () => {
      try {
        const history = await api.get(`/messages/conversation/${conversationId}?limit=50`);
        if (Array.isArray(history)) {
          setMessages(conversationId, history);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();

    // Cross-device synchronization interval for serverless / multi-device support
    const syncInterval = setInterval(() => {
      api.get(`/messages/conversation/${conversationId}?limit=50`)
        .then((history) => {
          if (Array.isArray(history)) {
            setMessages(conversationId, history);
          }
        })
        .catch(() => {});
    }, 2500);

    // Socket real-time connection
    socketService.connect().then((s) => {
      socket = s;
      if (socket) {
        socket.emit(SocketEvents.JOIN_ROOM, { conversationId });

        socket.on(SocketEvents.NEW_MESSAGE, (msg: any) => {
          if (msg.conversationId === conversationId) {
            addMessage(msg);
            if (msg.senderId !== user?.id) {
              socket.emit(SocketEvents.MESSAGE_READ, {
                conversationId,
                messageId: msg.id,
              });
            }
          }
        });

        socket.on(SocketEvents.USER_TYPING, (data: any) => {
          if (data.conversationId === conversationId && data.userId !== user?.id) {
            setUserTyping(conversationId, data.username, data.isTyping);
          }
        });

        socket.on(SocketEvents.REACTION_UPDATED, (data: any) => {
          if (data.conversationId === conversationId) {
            updateReaction(conversationId, data.messageId, data);
          }
        });
      }
    }).catch(() => {});

    return () => {
      clearInterval(syncInterval);
      if (socket) {
        socket.emit(SocketEvents.LEAVE_ROOM, { conversationId });
        socket.off(SocketEvents.NEW_MESSAGE);
        socket.off(SocketEvents.USER_TYPING);
        socket.off(SocketEvents.REACTION_UPDATED);
      }
    };
  }, [conversationId]);

  const handleInputChange = (text: string) => {
    setInputText(text);

    const socket = socketService.getSocket();
    if (!socket || !socket.connected) return;

    socket.emit(SocketEvents.TYPING_START, { conversationId });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit(SocketEvents.TYPING_STOP, { conversationId });
    }, 2000);
  };

  const sendMessageContent = (content: string, mediaUrl?: string) => {
    if (!content.trim() && !mediaUrl) return;

    // 1. Post to API / shared database
    api.post('/messages', {
      conversationId,
      content: content.trim(),
      mediaUrl,
    }).then((msg) => {
      addMessage(msg);
    }).catch(() => {});

    // 2. Real-time emit if socket connected
    const socket = socketService.getSocket();
    if (socket && socket.connected) {
      socket.emit(SocketEvents.TYPING_STOP, { conversationId });
      socket.emit(SocketEvents.SEND_MESSAGE, {
        conversationId,
        content: content.trim(),
        mediaUrl: mediaUrl || undefined,
        clientMessageId: `temp-${Date.now()}`,
      });
    }
  };

  const handleSend = () => {
    if (!inputText.trim() && !selectedImage) return;

    const content = inputText.trim();
    const media = selectedImage;

    setInputText('');
    setSelectedImage(null);

    sendMessageContent(content, media || undefined);
  };

  const sendSticker = (stickerChar: string) => {
    sendMessageContent(stickerChar);
    setShowStickers(false);
  };

  const handleOpenGallery = () => {
    if (Platform.OS === 'web') {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      } else {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e: any) => handleFileInputChange(e);
        input.click();
      }
    }
  };

  const handleFileInputChange = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64Uri = reader.result as string;
      setSelectedImage(base64Uri);
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleToggleReaction = (messageId: string, emoji: string) => {
    const socket = socketService.getSocket();
    if (socket && socket.connected) {
      socket.emit(SocketEvents.ADD_REACTION, {
        messageId,
        conversationId,
        emoji,
      });
    }
  };

  const roomTitle = (conversationInfo?.adda?.name || conversationInfo?.name || 'RAGER @DUNES').toUpperCase();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
      style={{ flex: 1, backgroundColor: '#FFF6D6' }}
    >
      {Platform.OS === 'web' && (
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileInputChange}
        />
      )}

      {/* Top Header matching reference image */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#EBE5D3',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: '#F5F2EB',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#18171C', fontSize: 18, fontWeight: '900' }}>‹</Text>
        </TouchableOpacity>

        {/* Room Title with Navigation Arrow */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text
            numberOfLines={1}
            style={{
              color: '#18171C',
              fontSize: 16,
              fontWeight: '900',
              letterSpacing: 0.5,
              maxWidth: 220,
            }}
          >
            {roomTitle}
          </Text>
          <Text style={{ color: '#3C97FF', fontSize: 16, fontWeight: '900', marginLeft: 6 }}>›</Text>
        </View>

        {/* Right Info Avatar */}
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: '#3C97FF',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 14 }}>
            {roomTitle.charAt(0)}
          </Text>
        </View>
      </View>

      {/* Center "TODAY" Date Divider Capsule */}
      <View style={{ alignItems: 'center', marginVertical: 10 }}>
        <View
          style={{
            backgroundColor: 'rgba(255,255,255,0.7)',
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 3,
            borderWidth: 1,
            borderColor: '#E8E2CD',
          }}
        >
          <Text style={{ color: '#8C8573', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 }}>
            TODAY
          </Text>
        </View>
      </View>

      {/* Messages List */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color="#3C97FF" />
        </View>
      ) : (
        <FlatList
          inverted
          data={currentMessages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 14, paddingBottom: 20 }}
          renderItem={({ item }) => {
            const isMe = item.senderId === user?.id;
            const isSingleSticker = !item.mediaUrl && item.content.length <= 4 && /\p{Extended_Pictographic}/u.test(item.content);

            if (isSingleSticker) {
              return (
                <View
                  style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    marginVertical: 6,
                    paddingHorizontal: 12,
                  }}
                >
                  <Floating distance={5} duration={2200}>
                    <TouchableOpacity
                      onPress={() => handleToggleReaction(item.id, '❤️')}
                      style={{ padding: 4 }}
                    >
                      <Text style={{ fontSize: 52 }}>{item.content}</Text>
                    </TouchableOpacity>
                  </Floating>
                </View>
              );
            }

            return (
              <MessageBubble
                id={item.id}
                content={item.content}
                mediaUrl={item.mediaUrl}
                senderName={item.sender?.displayName || 'User'}
                isMe={isMe}
                createdAt={item.createdAt}
                replyTo={item.replyTo}
                reactions={item.reactions}
                onAddReaction={(emoji) => handleToggleReaction(item.id, emoji)}
              />
            );
          }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 80, transform: [{ scaleY: -1 }] }}>
              <Floating distance={6} duration={2400}>
                <Text style={{ fontSize: 44, marginBottom: 8 }}>💬</Text>
              </Floating>
              <Text style={{ color: '#18171C', fontSize: 18, fontWeight: '900' }}>
                {isKn ? 'ಮಾತನಾಡಲು ಶುರುಮಾಡಿ!' : 'Start the conversation!'}
              </Text>
              <Text style={{ color: '#8C8573', fontSize: 13, textAlign: 'center', marginTop: 4 }}>
                {isKn ? 'ಸಂದೇಶ, ಸ್ಟಿಕ್ಕರ್ ಅಥವಾ ಗ್ಯಾಲರಿ ಚಿತ್ರ ಕಳುಹಿಸಿ' : 'Send a message, tap stickers, or share a photo'}
              </Text>
            </View>
          }
        />
      )}

      {/* Typing indicator */}
      {currentTyping.length > 0 && (
        <View style={{ paddingHorizontal: 18, paddingVertical: 4 }}>
          <Text style={{ color: '#3C97FF', fontSize: 11, fontStyle: 'italic', fontWeight: '700' }}>
            💬 {currentTyping.join(', ')} {isKn ? 'ಬರೆಯುತ್ತಿದ್ದಾರೆ...' : 'is typing...'}
          </Text>
        </View>
      )}

      {/* Selected Image Preview Box */}
      {selectedImage && (
        <View
          style={{
            backgroundColor: '#FFFFFF',
            padding: 12,
            borderTopWidth: 1,
            borderTopColor: '#EBE5D3',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image
              source={{ uri: selectedImage }}
              style={{ width: 52, height: 52, borderRadius: 12, marginRight: 12, borderWidth: 1.5, borderColor: '#3C97FF' }}
            />
            <View>
              <Text style={{ color: '#18171C', fontWeight: '800', fontSize: 13 }}>
                🖼️ Ready to send
              </Text>
              <Text style={{ color: '#8C8573', fontSize: 11 }}>
                Tap send to share with the room
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setSelectedImage(null)}
            style={{
              backgroundColor: '#FF6464',
              width: 28,
              height: 28,
              borderRadius: 14,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 12 }}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* STICKER TRAY DRAWER (Electric Blue Card matching reference image) */}
      {showStickers && (
        <View
          style={{
            backgroundColor: '#2563EB',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingTop: 16,
            paddingBottom: 20,
            paddingHorizontal: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.2,
            shadowRadius: 10,
          }}
        >
          {/* Header row inside drawer */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 }}>
              STICKERS
            </Text>
            <TouchableOpacity onPress={() => setShowStickers(false)}>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontWeight: '900', fontSize: 13 }}>✕ Done</Text>
            </TouchableOpacity>
          </View>

          {/* Sticker Grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', marginBottom: 16 }}>
            {STICKER_COLLECTION.map((stk) => (
              <TouchableOpacity
                key={stk.id}
                onPress={() => sendSticker(stk.char)}
                activeOpacity={0.7}
                style={{
                  width: '22%',
                  aspectRatio: 1,
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginVertical: 6,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.2)',
                }}
              >
                <Floating distance={3} duration={2200}>
                  <Text style={{ fontSize: 32 }}>{stk.char}</Text>
                </Floating>
              </TouchableOpacity>
            ))}
          </View>

          {/* Bottom Tabs Selector */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0,0,0,0.15)',
              borderRadius: 20,
              padding: 4,
              alignSelf: 'center',
            }}
          >
            <TouchableOpacity
              onPress={() => {
                setShowStickers(false);
                setStickerTab('abc');
              }}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 6,
                borderRadius: 16,
                backgroundColor: stickerTab === 'abc' ? '#FFFFFF' : 'transparent',
              }}
            >
              <Text
                style={{
                  color: stickerTab === 'abc' ? '#2563EB' : '#FFFFFF',
                  fontSize: 11,
                  fontWeight: '800',
                }}
              >
                ABC
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setStickerTab('stickers')}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 6,
                borderRadius: 16,
                backgroundColor: stickerTab === 'stickers' ? '#FFFFFF' : 'transparent',
                marginHorizontal: 4,
              }}
            >
              <Text
                style={{
                  color: stickerTab === 'stickers' ? '#2563EB' : '#FFFFFF',
                  fontSize: 13,
                  fontWeight: '800',
                }}
              >
                🎨
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setStickerTab('smileys')}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 6,
                borderRadius: 16,
                backgroundColor: stickerTab === 'smileys' ? '#FFFFFF' : 'transparent',
              }}
            >
              <Text
                style={{
                  color: stickerTab === 'smileys' ? '#2563EB' : '#FFFFFF',
                  fontSize: 13,
                  fontWeight: '800',
                }}
              >
                😊
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Chat Input Bar */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#EBE5D3',
          paddingHorizontal: 12,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        {/* Gallery Image Picker Button */}
        <TouchableOpacity
          onPress={handleOpenGallery}
          activeOpacity={0.7}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#F5F2EB',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 8,
          }}
        >
          <Text style={{ fontSize: 18 }}>📷</Text>
        </TouchableOpacity>

        {/* Input Field Capsule: SAY SOMETHING... */}
        <TextInput
          value={inputText}
          onChangeText={handleInputChange}
          placeholder={selectedImage ? 'Add a caption...' : 'SAY SOMETHING...'}
          placeholderTextColor="#A39C8D"
          onSubmitEditing={handleSend}
          style={{
            flex: 1,
            backgroundColor: '#F5F2EB',
            borderRadius: 22,
            paddingHorizontal: 16,
            paddingVertical: 10,
            color: '#18171C',
            fontSize: 14,
            fontWeight: '600',
            marginRight: 8,
          }}
        />

        {/* Sticker Tray Toggle Icon */}
        <TouchableOpacity
          onPress={() => setShowStickers(!showStickers)}
          activeOpacity={0.7}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: showStickers ? '#2563EB' : '#F5F2EB',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 8,
          }}
        >
          <Text style={{ fontSize: 18 }}>{showStickers ? '✕' : '😊'}</Text>
        </TouchableOpacity>

        {/* Send Button */}
        <TouchableOpacity
          onPress={handleSend}
          disabled={!inputText.trim() && !selectedImage}
          activeOpacity={0.8}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: (inputText.trim() || selectedImage) ? '#2563EB' : '#E0DDD3',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '900' }}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
