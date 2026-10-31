import React from 'react';
import { View, Text, TouchableOpacity, Image, Platform } from 'react-native';

interface Reaction {
  id: string;
  emoji: string;
  userId: string;
}

interface MessageBubbleProps {
  id: string;
  content: string;
  mediaUrl?: string | null;
  senderName: string;
  isMe: boolean;
  createdAt: string;
  replyTo?: {
    sender: { displayName: string };
    content: string;
  } | null;
  reactions?: Reaction[];
  onAddReaction?: (emoji: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  content,
  mediaUrl,
  senderName,
  isMe,
  createdAt,
  replyTo,
  reactions = [],
  onAddReaction,
}) => {
  const timeStr = new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Group reactions by emoji
  const reactionCounts: Record<string, number> = {};
  reactions.forEach((r) => {
    reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
  });

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: isMe ? 'flex-end' : 'flex-start',
        alignItems: 'flex-end',
        marginVertical: 4,
        paddingHorizontal: 8,
      }}
    >
      {/* Receiver Avatar circle on the left */}
      {!isMe && (
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: '#6366F1',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 8,
            marginBottom: 2,
            borderWidth: 1.5,
            borderColor: 'rgba(255, 255, 255, 0.3)',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '900' }}>
            {senderName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      <View style={{ maxWidth: '80%' }}>
        {/* Sender Name for other users */}
        {!isMe && (
          <Text
            style={{
              color: '#C4B5FD',
              fontSize: 11,
              fontWeight: '700',
              marginLeft: 8,
              marginBottom: 3,
            }}
          >
            {senderName}
          </Text>
        )}

        {/* Message Bubble Card */}
        <View
          style={[
            {
              backgroundColor: isMe ? '#7C3AED' : 'rgba(28, 28, 42, 0.88)',
              borderRadius: 22,
              borderBottomRightRadius: isMe ? 4 : 22,
              borderBottomLeftRadius: isMe ? 22 : 4,
              paddingHorizontal: mediaUrl ? 6 : 14,
              paddingVertical: mediaUrl ? 6 : 10,
              borderWidth: isMe ? 1 : 1.2,
              borderColor: isMe ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.12)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 3,
            },
            Platform.OS === 'web'
              ? ({
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                } as any)
              : {},
          ]}
        >
          {/* Reply context */}
          {replyTo && (
            <View
              style={{
                borderLeftWidth: 3,
                borderLeftColor: isMe ? '#C4B5FD' : '#818CF8',
                paddingLeft: 8,
                marginBottom: 6,
                opacity: 0.9,
              }}
            >
              <Text style={{ color: isMe ? '#E9D5FF' : '#C4B5FD', fontSize: 11, fontWeight: '800' }}>
                {replyTo.sender.displayName}
              </Text>
              <Text
                numberOfLines={1}
                style={{ color: isMe ? '#F3E8FF' : '#94A3B8', fontSize: 11 }}
              >
                {replyTo.content}
              </Text>
            </View>
          )}

          {/* Gallery Image Display */}
          {mediaUrl && (
            <View style={{ borderRadius: 16, overflow: 'hidden', marginBottom: content ? 8 : 2 }}>
              <Image
                source={{ uri: mediaUrl }}
                style={{
                  width: 240,
                  height: 200,
                  borderRadius: 14,
                  backgroundColor: '#1E1B2E',
                }}
                resizeMode="cover"
              />
            </View>
          )}

          {/* Text Content */}
          {Boolean(content) && (
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 15,
                lineHeight: 21,
                fontWeight: '500',
                paddingHorizontal: mediaUrl ? 6 : 2,
              }}
            >
              {content}
            </Text>
          )}

          {/* Time & Badges */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              alignItems: 'center',
              marginTop: 4,
              paddingRight: mediaUrl ? 6 : 2,
            }}
          >
            {isMe && (
              <View
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  paddingHorizontal: 5,
                  paddingVertical: 1,
                  borderRadius: 6,
                  marginRight: 6,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '800' }}>YOU</Text>
              </View>
            )}
            <Text
              style={{
                color: isMe ? 'rgba(255, 255, 255, 0.75)' : '#94A3B8',
                fontSize: 10,
                fontWeight: '600',
              }}
            >
              {timeStr}
            </Text>
          </View>
        </View>

        {/* Reaction Badges */}
        {Object.keys(reactionCounts).length > 0 && (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              marginTop: -8,
              marginLeft: isMe ? 0 : 8,
              alignSelf: isMe ? 'flex-end' : 'flex-start',
            }}
          >
            {Object.entries(reactionCounts).map(([emoji, count]) => (
              <TouchableOpacity
                key={emoji}
                onPress={() => onAddReaction && onAddReaction(emoji)}
                style={{
                  backgroundColor: 'rgba(28, 28, 42, 0.95)',
                  borderWidth: 1.2,
                  borderColor: 'rgba(255, 255, 255, 0.16)',
                  borderRadius: 14,
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  marginRight: 4,
                  flexDirection: 'row',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                }}
              >
                <Text style={{ fontSize: 11 }}>{emoji}</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800', marginLeft: 3 }}>
                  {count}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Sender Avatar circle on the right */}
      {isMe && (
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: '#7C3AED',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 8,
            marginBottom: 2,
            borderWidth: 1.5,
            borderColor: 'rgba(255, 255, 255, 0.4)',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '900' }}>
            {senderName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
    </View>
  );
};
