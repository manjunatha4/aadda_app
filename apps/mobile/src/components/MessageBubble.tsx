import React from 'react';
import { View, Text, TouchableOpacity, Image, Platform } from 'react-native';
import { DS_FONTS } from './DesignSystem';

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
            backgroundColor: '#EEF2FF',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 8,
            marginBottom: 2,
            borderWidth: 1,
            borderColor: '#C7D2FE',
          }}
        >
          <Text style={{ color: '#6366F1', fontSize: 13, fontWeight: '900' }}>
            {senderName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      <View style={{ maxWidth: '80%' }}>
        {/* Sender Name for other users */}
        {!isMe && (
          <Text
            style={{
              fontFamily: DS_FONTS.heading,
              color: '#6366F1',
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
              backgroundColor: isMe ? '#6366F1' : '#F8FAFC',
              borderRadius: 20,
              borderBottomRightRadius: isMe ? 4 : 20,
              borderBottomLeftRadius: isMe ? 20 : 4,
              paddingHorizontal: mediaUrl ? 6 : 14,
              paddingVertical: mediaUrl ? 6 : 10,
              borderWidth: 1,
              borderColor: isMe ? '#4F46E5' : '#E2E8F0',
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isMe ? 0.2 : 0.04,
              shadowRadius: 6,
              elevation: 2,
            },
          ]}
        >
          {/* Reply context */}
          {replyTo && (
            <View
              style={{
                borderLeftWidth: 3,
                borderLeftColor: isMe ? '#C7D2FE' : '#818CF8',
                paddingLeft: 8,
                marginBottom: 6,
                opacity: 0.9,
              }}
            >
              <Text style={{ color: isMe ? '#EEF2FF' : '#6366F1', fontSize: 11, fontWeight: '800' }}>
                {replyTo.sender.displayName}
              </Text>
              <Text
                numberOfLines={1}
                style={{ color: isMe ? '#E0E7FF' : '#64748B', fontSize: 11 }}
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
                  backgroundColor: '#E2E8F0',
                }}
                resizeMode="cover"
              />
            </View>
          )}

          {/* Text Content */}
          {Boolean(content) && (
            <Text
              style={{
                fontFamily: DS_FONTS.body,
                color: isMe ? '#FFFFFF' : '#0F172A',
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
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  paddingHorizontal: 5,
                  paddingVertical: 1,
                  borderRadius: 6,
                  marginRight: 6,
                }}
              >
                <Text style={{ fontFamily: DS_FONTS.mono, color: '#FFFFFF', fontSize: 9, fontWeight: '800' }}>YOU</Text>
              </View>
            )}
            <Text
              style={{
                fontFamily: DS_FONTS.mono,
                color: isMe ? 'rgba(255, 255, 255, 0.8)' : '#94A3B8',
                fontSize: 10,
                fontWeight: '600',
              }}
            >
              {timeStr}
            </Text>
          </View>
        </View>

        {/* Reaction badges pill row */}
        {Object.keys(reactionCounts).length > 0 && (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 4,
              marginTop: 4,
              marginLeft: isMe ? 0 : 8,
              justifyContent: isMe ? 'flex-end' : 'flex-start',
            }}
          >
            {Object.entries(reactionCounts).map(([emoji, count]) => (
              <TouchableOpacity
                key={emoji}
                onPress={() => onAddReaction && onAddReaction(emoji)}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  borderRadius: 14,
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  flexDirection: 'row',
                  alignItems: 'center',
                  shadowColor: '#0F172A',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 3,
                }}
              >
                <Text style={{ fontSize: 11 }}>{emoji}</Text>
                <Text style={{ fontFamily: DS_FONTS.mono, color: '#0F172A', fontSize: 10, fontWeight: '800', marginLeft: 3 }}>
                  {count}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Sender Avatar circle on the right for current user */}
      {isMe && (
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: '#6366F1',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 8,
            marginBottom: 2,
            borderWidth: 1.5,
            borderColor: '#FFFFFF',
            shadowColor: '#6366F1',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
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
