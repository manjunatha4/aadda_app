import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';

interface Entry {
  id: string;
  content?: string | null;
  mediaUrl?: string | null;
  voteCount: number;
  user: {
    displayName: string;
    username: string;
  };
}

interface ChaosCardProps {
  promptText: string;
  promptTextKn?: string | null;
  category: string;
  expiresAt: string;
  entries?: Entry[];
  isKannada?: boolean;
  onVote?: (entryId: string) => void;
  onSubmitAnswer?: () => void;
}

export const ChaosCard: React.FC<ChaosCardProps> = ({
  promptText,
  promptTextKn,
  category,
  entries = [],
  isKannada = true,
  onVote,
  onSubmitAnswer,
}) => {
  const displayPrompt = isKannada && promptTextKn ? promptTextKn : promptText;

  return (
    <View
      style={[
        {
          backgroundColor: 'rgba(28, 28, 42, 0.82)',
          borderRadius: 20,
          padding: 16,
          marginBottom: 16,
          borderWidth: 1.2,
          borderColor: 'rgba(124, 58, 237, 0.35)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
        },
        Platform.OS === 'web'
          ? ({
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            } as any)
          : {},
      ]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <View style={{ backgroundColor: 'rgba(124, 58, 237, 0.25)', borderWidth: 1, borderColor: '#7C3AED', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
          <Text style={{ color: '#C4B5FD', fontWeight: '800', fontSize: 10 }}>
            CHAOS 🔥 {category}
          </Text>
        </View>
        <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '600' }}>Active Round</Text>
      </View>

      <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 12, lineHeight: 22 }}>
        {displayPrompt}
      </Text>

      {/* Submissions list */}
      {entries.length > 0 && (
        <View style={{ marginBottom: 12, gap: 6 }}>
          {entries.map((entry) => (
            <View
              key={entry.id}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                padding: 10,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.08)',
              }}
            >
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={{ color: '#C4B5FD', fontSize: 11, fontWeight: '700' }}>
                  {entry.user.displayName}
                </Text>
                <Text style={{ color: '#FFFFFF', fontSize: 13, marginTop: 2 }}>
                  {entry.content}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => onVote && onVote(entry.id)}
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  borderWidth: 1,
                  borderColor: 'rgba(239, 68, 68, 0.4)',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#F87171', fontWeight: '800', fontSize: 12 }}>
                  🔥 {entry.voteCount}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {onSubmitAnswer && (
        <TouchableOpacity
          onPress={onSubmitAnswer}
          style={{
            backgroundColor: '#7C3AED',
            paddingVertical: 10,
            borderRadius: 12,
            alignItems: 'center',
            shadowColor: '#7C3AED',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>
            {isKannada ? 'ಉತ್ತರಿಸಿ (Respond)' : 'Submit Answer'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
