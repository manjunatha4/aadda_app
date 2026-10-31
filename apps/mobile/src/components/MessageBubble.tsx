import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';

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
        alignSelf: isMe ? 'flex-end' : 'flex-start',
        maxWidth: '82%',
        marginVertical: 4,
      }}
    >
      {!isMe && (
        <Text style={{ color: '#D9FF67', fontSize: 11, fontWeight: '700', marginLeft: 4, marginBottom: 2 }}>
          {senderName}
        </Text>
      )}

      <View
        style={{
          backgroundColor: isMe ? '#FFFFFF' : '#352454',
          borderRadius: 20,
          borderBottomRightRadius: isMe ? 4 : 20,
          borderBottomLeftRadius: isMe ? 20 : 4,
          padding: mediaUrl ? 6 : 14,
          borderWidth: isMe ? 0 : 1,
          borderColor: '#4A3370',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.12,
          shadowRadius: 4,
        }}
      >
        {replyTo && (
          <View
            style={{
              borderLeftWidth: 3,
              borderLeftColor: isMe ? '#24183B' : '#FF786B',
              paddingLeft: 6,
              marginBottom: 6,
              opacity: 0.8,
            }}
          >
            <Text style={{ color: isMe ? '#24183B' : '#FF786B', fontSize: 11, fontWeight: '700' }}>
              {replyTo.sender.displayName}
            </Text>
            <Text
              numberOfLines={1}
              style={{ color: isMe ? '#24183B' : '#F4F0FF', fontSize: 11 }}
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
                backgroundColor: '#1E1430',
              }}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Text Content */}
        {Boolean(content) && (
          <Text
            style={{
              color: isMe ? '#24183B' : '#FFFFFF',
              fontSize: 15,
              lineHeight: 20,
              fontWeight: '500',
              paddingHorizontal: mediaUrl ? 6 : 0,
            }}
          >
            {content}
          </Text>
        )}

        <Text
          style={{
            color: isMe ? '#8C7D9E' : '#A392B8',
            fontSize: 10,
            alignSelf: 'flex-end',
            marginTop: 4,
            paddingRight: mediaUrl ? 6 : 0,
          }}
        >
          {timeStr}
        </Text>
      </View>

      {/* Reaction Badges */}
      {Object.keys(reactionCounts).length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: -6, marginLeft: isMe ? 0 : 8, alignSelf: isMe ? 'flex-end' : 'flex-start' }}>
          {Object.entries(reactionCounts).map(([emoji, count]) => (
            <TouchableOpacity
              key={emoji}
              onPress={() => onAddReaction && onAddReaction(emoji)}
              style={{
                backgroundColor: '#24183B',
                borderWidth: 1,
                borderColor: '#D9FF67',
                borderRadius: 12,
                paddingHorizontal: 6,
                paddingVertical: 2,
                marginRight: 4,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 11 }}>{emoji}</Text>
              <Text style={{ color: '#D9FF67', fontSize: 10, fontWeight: '700', marginLeft: 3 }}>
                {count}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};
