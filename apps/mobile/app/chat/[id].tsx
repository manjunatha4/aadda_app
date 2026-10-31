import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../src/services/api';
import { socketService } from '../../src/services/socket';
import { useAuthStore } from '../../src/stores/authStore';
import { useChatStore } from '../../src/stores/chatStore';
import { MessageBubble } from '../../src/components/MessageBubble';
import { Floating } from '../../src/components/AnimatedVisuals';
import { SocketEvents } from '@aadda/shared';

// Gen-Z Sticker Tray
const STICKER_COLLECTION = [
  { id: 'icecream', char: '🍦', label: 'Chill' },
  { id: 'strawberry', char: '🍓', label: 'Sweet' },
  { id: 'frog', char: '🐸', label: 'Vibe' },
  { id: 'lightning', char: '⚡', label: 'Hyped' },
  { id: 'tongue', char: '👅', label: 'Sassy' },
  { id: 'lightbulb', char: '💡', label: 'Idea' },
  { id: 'diamond', char: '💎', label: 'Priceless' },
  { id: 'skate', char: '🛼', label: 'Rollin' },
  { id: 'cat', char: '🐱', label: 'Yeah!' },
  { id: 'octopus', char: '🐙', label: 'Chaos' },
  { id: 'fire', char: '🔥', label: 'Lit' },
  { id: 'skull', char: '💀', label: 'Dead' },
  { id: 'crown', char: '👑', label: 'Boss' },
  { id: 'pizza', char: '🍕', label: 'Treat' },
  { id: 'coffee', char: '☕', label: 'Chai' },
  { id: 'shaka', char: '🤙', label: 'Call me' },
];

const REACTION_EMOJIS = ['🔥', '🤣', '👑', '❤️', '💀', '☕'];

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

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [showStickers, setShowStickers] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<any>(null);
  const typingTimeoutRef = useRef<any>(null);

  const currentMessages = messages[conversationId] || [];
  const currentTyping = typingUsers[conversationId] || [];

  const isKn = i18n.language === 'kn';

  // Setup Socket & Load History
  useEffect(() => {
    let socket: any = null;

    const init = async () => {
      try {
        setLoading(true);
        const history = await api.get(`/messages/conversation/${conversationId}?limit=50`);
        setMessages(conversationId, history || []);

        socket = await socketService.connect();
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
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    if (conversationId) {
      init();
    }

    return () => {
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
    if (!socket) return;

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

    const socket = socketService.getSocket();
    if (socket) {
      socket.emit(SocketEvents.TYPING_STOP, { conversationId });
      socket.emit(SocketEvents.SEND_MESSAGE, {
        conversationId,
        content: content.trim(),
        mediaUrl: mediaUrl || undefined,
        clientMessageId: `temp-${Date.now()}`,
      });
    } else {
      api.post('/messages', { conversationId, content: content.trim(), mediaUrl }).then((msg) => {
        addMessage(msg);
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
    if (socket) {
      socket.emit(SocketEvents.ADD_REACTION, {
        messageId,
        conversationId,
        emoji,
      });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
      style={{ flex: 1, backgroundColor: '#130824' }}
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

      {/* Cosmic Gradient Header */}
      <LinearGradient
        colors={['#2D144A', '#1C0D30']}
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1.5,
          borderBottomColor: '#43216E',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Text style={{ color: '#D9FF67', fontSize: 22, fontWeight: '900' }}>←</Text>
          </TouchableOpacity>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '900' }}>
                {isKn ? 'ಅಡ್ಡಾ ಚಾಟ್ ರೂಮ್' : 'Adda Circle'} 🌙✨
              </Text>
            </View>
            <Text style={{ color: '#D9FF67', fontSize: 11, fontWeight: '700' }}>
              {isKn ? 'ಎಂಡ್-ಟು-ಎಂಡ್ ಪ್ರೈವೇಟ್ ಸ್ಪೇಸ್' : 'End-to-End Encrypted Hangout'}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={handleOpenGallery}
            style={{
              backgroundColor: 'rgba(255, 120, 107, 0.15)',
              paddingHorizontal: 11,
              paddingVertical: 5,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: '#FF786B',
            }}
          >
            <Text style={{ color: '#FF786B', fontWeight: '800', fontSize: 12 }}>
              🖼️ Photo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowStickers(!showStickers)}
            style={{
              backgroundColor: showStickers ? '#D9FF67' : 'rgba(217, 255, 103, 0.15)',
              paddingHorizontal: 11,
              paddingVertical: 5,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: '#D9FF67',
            }}
          >
            <Text style={{ color: showStickers ? '#180B2E' : '#D9FF67', fontWeight: '800', fontSize: 12 }}>
              🎨 {showStickers ? 'Close' : 'Stickers'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Messages List with Subtle Ambient Glow */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color="#D9FF67" />
        </View>
      ) : (
        <FlatList
          inverted
          data={currentMessages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          renderItem={({ item }) => {
            const isMe = item.senderId === user?.id;
            const isSingleSticker = !item.mediaUrl && item.content.length <= 4 && /\p{Extended_Pictographic}/u.test(item.content);

            return (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: isMe ? 'flex-end' : 'flex-start',
                  marginBottom: 14,
                  alignItems: 'flex-end',
                }}
              >
                {!isMe && (
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      backgroundColor: '#FF786B',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 8,
                      marginBottom: 2,
                      shadowColor: '#FF786B',
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.4,
                      shadowRadius: 6,
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 13 }}>
                      {(item.sender?.displayName || 'U')[0].toUpperCase()}
                    </Text>
                  </View>
                )}

                <View style={{ maxWidth: '80%' }}>
                  {!isMe && (
                    <Text style={{ color: '#A592C4', fontSize: 11, fontWeight: '700', marginLeft: 4, marginBottom: 3 }}>
                      {item.sender?.displayName || 'User'}
                    </Text>
                  )}

                  {isSingleSticker ? (
                    <Floating distance={6} duration={2400}>
                      <TouchableOpacity
                        onPress={() => handleToggleReaction(item.id, '❤️')}
                        style={{ padding: 4 }}
                      >
                        <Text style={{ fontSize: 52 }}>{item.content}</Text>
                      </TouchableOpacity>
                    </Floating>
                  ) : (
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
                  )}
                </View>

                {isMe && (
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      backgroundColor: '#D9FF67',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginLeft: 8,
                      marginBottom: 2,
                      shadowColor: '#D9FF67',
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.4,
                      shadowRadius: 6,
                    }}
                  >
                    <Text style={{ color: '#180B2E', fontWeight: '900', fontSize: 13 }}>
                      {(user?.displayName || 'ME')[0].toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 80, transform: [{ scaleY: -1 }] }}>
              <Floating distance={8} duration={2400}>
                <Text style={{ fontSize: 48, marginBottom: 8 }}>✨</Text>
              </Floating>
              <Text style={{ color: '#D9FF67', fontSize: 18, fontWeight: '900' }}>
                {isKn ? 'ಮಾತನಾಡಲು ಶುರುಮಾಡಿ!' : 'Start the Chaos!'}
              </Text>
              <Text style={{ color: '#A592C4', fontSize: 13, textAlign: 'center', marginTop: 4 }}>
                {isKn ? 'ಸಂದೇಶ, ಸ್ಟಿಕ್ಕರ್ ಅಥವಾ ಗ್ಯಾಲರಿ ಇಮೇಜ್ ಕಳುಹಿಸಿ' : 'Drop a message, sticker, or image from your gallery'}
              </Text>
            </View>
          }
        />
      )}

      {/* Typing indicator */}
      {currentTyping.length > 0 && (
        <View style={{ paddingHorizontal: 16, paddingVertical: 5, backgroundColor: 'rgba(38, 20, 61, 0.9)' }}>
          <Text style={{ color: '#D9FF67', fontSize: 11, fontStyle: 'italic', fontWeight: '700' }}>
            💬 {currentTyping.join(', ')} {isKn ? 'ಬರೆಯುತ್ತಿದ್ದಾರೆ...' : 'is typing...'}
          </Text>
        </View>
      )}

      {/* Selected Image Preview Box */}
      {selectedImage && (
        <View
          style={{
            backgroundColor: '#24103D',
            padding: 12,
            borderTopWidth: 1.5,
            borderTopColor: '#3E1C66',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image
              source={{ uri: selectedImage }}
              style={{ width: 56, height: 56, borderRadius: 10, marginRight: 12, borderWidth: 1.5, borderColor: '#D9FF67' }}
            />
            <View>
              <Text style={{ color: '#D9FF67', fontWeight: '800', fontSize: 13 }}>
                🖼️ Ready to send photo
              </Text>
              <Text style={{ color: '#A592C4', fontSize: 11 }}>
                Type an optional caption or hit send
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setSelectedImage(null)}
            style={{
              backgroundColor: '#FF5C4D',
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

      {/* STICKER TRAY DRAWER with Electric Blue Gradient */}
      {showStickers && (
        <LinearGradient
          colors={['#1D4ED8', '#1E3A8A']}
          style={{
            borderTopLeftRadius: 26,
            borderTopRightRadius: 26,
            padding: 16,
            borderWidth: 2,
            borderColor: '#60A5FA',
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 14 }}>
              🔥 {isKn ? 'ಮೂಡ್ ಸ್ಟಿಕ್ಕರ್‌ಗಳು' : 'Gen-Z Mood Stickers'}
            </Text>
            <TouchableOpacity onPress={() => setShowStickers(false)}>
              <Text style={{ color: '#D9FF67', fontWeight: '900', fontSize: 12 }}>✕ Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
            {STICKER_COLLECTION.map((stk) => (
              <TouchableOpacity
                key={stk.id}
                onPress={() => sendSticker(stk.char)}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  borderRadius: 16,
                  padding: 12,
                  alignItems: 'center',
                  marginRight: 10,
                  borderWidth: 1.5,
                  borderColor: 'rgba(255,255,255,0.25)',
                }}
              >
                <Text style={{ fontSize: 32 }}>{stk.char}</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800', marginTop: 4 }}>
                  {stk.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </LinearGradient>
      )}

      {/* Quick Reaction Bar */}
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: 12,
          paddingVertical: 6,
          backgroundColor: '#120722',
          justifyContent: 'space-around',
          borderTopWidth: 1,
          borderTopColor: '#250E42',
        }}
      >
        {REACTION_EMOJIS.map((emoji) => (
          <TouchableOpacity
            key={emoji}
            onPress={() => {
              if (currentMessages.length > 0) {
                handleToggleReaction(currentMessages[0].id, emoji);
              }
            }}
          >
            <Text style={{ fontSize: 19 }}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chat Input Bar */}
      <LinearGradient
        colors={['#24103D', '#160927']}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 10,
          borderTopWidth: 1.5,
          borderTopColor: '#3E1C66',
        }}
      >
        {/* Gallery Image Picker Button */}
        <TouchableOpacity
          onPress={handleOpenGallery}
          style={{
            backgroundColor: 'rgba(255, 120, 107, 0.18)',
            width: 42,
            height: 42,
            borderRadius: 21,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 6,
            borderWidth: 1.5,
            borderColor: '#FF786B',
          }}
        >
          <Text style={{ fontSize: 20 }}>🖼️</Text>
        </TouchableOpacity>

        {/* Sticker Tray Toggle Icon */}
        <TouchableOpacity
          onPress={() => setShowStickers(!showStickers)}
          style={{
            backgroundColor: showStickers ? '#D9FF67' : 'rgba(217, 255, 103, 0.18)',
            width: 42,
            height: 42,
            borderRadius: 21,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 8,
            borderWidth: 1.5,
            borderColor: '#D9FF67',
          }}
        >
          <Text style={{ fontSize: 20 }}>😊</Text>
        </TouchableOpacity>

        {/* Input Field */}
        <TextInput
          value={inputText}
          onChangeText={handleInputChange}
          placeholder={selectedImage ? (isKn ? 'ಕ್ಯಾಪ್ಷನ್ ಬರೆಯಿರಿ...' : 'Add a caption...') : (isKn ? 'ಸಂದೇಶ ಕಳುಹಿಸಿ...' : 'Drop your chaos...')}
          placeholderTextColor="#8C7D9E"
          onSubmitEditing={handleSend}
          style={{
            flex: 1,
            backgroundColor: '#120722',
            borderRadius: 22,
            paddingHorizontal: 16,
            paddingVertical: 10,
            color: '#FFFFFF',
            fontSize: 15,
            marginRight: 8,
            borderWidth: 1.5,
            borderColor: '#3E1C66',
          }}
        />

        {/* Send Button */}
        <TouchableOpacity
          onPress={handleSend}
          disabled={!inputText.trim() && !selectedImage}
          activeOpacity={0.85}
          style={{
            borderRadius: 21,
            overflow: 'hidden',
          }}
        >
          <LinearGradient
            colors={(inputText.trim() || selectedImage) ? ['#E5FF8F', '#D9FF67'] : ['#3A1F5E', '#2B1449']}
            style={{
              width: 42,
              height: 42,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 18 }}>🚀</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
