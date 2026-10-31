import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

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
      style={{
        backgroundColor: '#352454',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#D9FF67',
        shadowColor: '#D9FF67',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <View style={{ backgroundColor: '#D9FF67', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
          <Text style={{ color: '#24183B', fontWeight: '800', fontSize: 10 }}>
            CHAOS 🔥 {category}
          </Text>
        </View>
        <Text style={{ color: '#F4F0FF', opacity: 0.7, fontSize: 11 }}>Active Round</Text>
      </View>

      <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 12, lineHeight: 22 }}>
        {displayPrompt}
      </Text>

      {/* Submissions list */}
      {entries.length > 0 && (
        <View style={{ marginBottom: 12 }}>
          {entries.map((entry) => (
            <View
              key={entry.id}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#24183B',
                padding: 10,
                borderRadius: 10,
                marginBottom: 6,
              }}
            >
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={{ color: '#D9FF67', fontSize: 11, fontWeight: '600' }}>
                  {entry.user.displayName}
                </Text>
                <Text style={{ color: '#F4F0FF', fontSize: 13, marginTop: 2 }}>
                  {entry.content}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => onVote && onVote(entry.id)}
                style={{
                  backgroundColor: '#FF786B',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#24183B', fontWeight: '800', fontSize: 12 }}>
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
            backgroundColor: '#D9FF67',
            paddingVertical: 10,
            borderRadius: 10,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#24183B', fontWeight: '800', fontSize: 13 }}>
            {isKannada ? 'ಉತ್ತರಿಸಿ (Respond)' : 'Submit Answer'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

