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
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          padding: 16,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 14,
          elevation: 2,
        },
        Platform.OS === 'web'
          ? ({
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.03)',
            } as any)
          : {},
      ]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <View style={{ backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#C7D2FE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
          <Text style={{ color: '#6366F1', fontWeight: '800', fontSize: 10 }}>
            CHAOS 🔥 {category}
          </Text>
        </View>
        <Text style={{ color: '#64748B', fontSize: 11, fontWeight: '600' }}>Active Round</Text>
      </View>

      <Text style={{ color: '#0F172A', fontSize: 16, fontWeight: '700', marginBottom: 12, lineHeight: 22 }}>
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
                backgroundColor: '#F8FAFC',
                padding: 10,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#E2E8F0',
              }}
            >
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={{ color: '#6366F1', fontSize: 11, fontWeight: '800' }}>
                  {entry.user.displayName}
                </Text>
                <Text style={{ color: '#334155', fontSize: 13, marginTop: 2 }}>{entry.content}</Text>
              </View>

              {onVote && (
                <TouchableOpacity
                  onPress={() => onVote(entry.id)}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    borderRadius: 12,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Text style={{ fontSize: 12 }}>🔥</Text>
                  <Text style={{ color: '#0F172A', fontSize: 11, fontWeight: '800' }}>
                    {entry.voteCount}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Action CTA */}
      {onSubmitAnswer && (
        <TouchableOpacity
          onPress={onSubmitAnswer}
          style={{
            backgroundColor: '#6366F1',
            borderRadius: 12,
            paddingVertical: 10,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>
            {isKannada ? 'ಉತ್ತರಿಸಿ ⚡' : 'Drop Your Answer ⚡'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
