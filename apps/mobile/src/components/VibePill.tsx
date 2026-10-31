import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

const VIBE_METADATA: Record<string, { labelKn: string; labelEn: string; emoji: string; bg: string; text: string }> = {
  MENTALLY_OFFLINE: { labelKn: 'ಮೆಂಟಲಿ ಆಫ್‌ಲೈನ್', labelEn: 'Mentally Offline', emoji: '📴', bg: '#352454', text: '#F4F0FF' },
  NEED_GOSSIP: { labelKn: 'ಗಾಸಿಪ್ ಬೇಕು', labelEn: 'Need Gossip', emoji: '👀', bg: '#FF786B', text: '#24183B' },
  DEAD_INSIDE: { labelKn: 'ಡೆಡ್ ಇನ್‌ಸೈಡ್', labelEn: 'Dead Inside', emoji: '💀', bg: '#160E24', text: '#D9FF67' },
  CHILL_MODE: { labelKn: 'ಚಿಲ್ ಮೋಡ್', labelEn: 'Chill Mode', emoji: '☕', bg: '#D9FF67', text: '#24183B' },
  MAIN_CHARACTER: { labelKn: 'ಮೇನ್ ಕ್ಯಾರೆಕ್ಟರ್', labelEn: 'Main Character', emoji: '💅', bg: '#F4F0FF', text: '#24183B' },
  BATTERY_LOW: { labelKn: 'ಬ್ಯಾಟರಿ 1%', labelEn: 'Battery 1%', emoji: '🪫', bg: '#FF5C4D', text: '#FFFFFF' },
};

interface VibePillProps {
  mood: string;
  customNote?: string | null;
  username?: string;
  isKannada?: boolean;
  onPress?: () => void;
  compact?: boolean;
}

export const VibePill: React.FC<VibePillProps> = ({
  mood,
  customNote,
  username,
  isKannada = true,
  onPress,
  compact = false,
}) => {
  const meta = VIBE_METADATA[mood] || {
    labelKn: mood,
    labelEn: mood,
    emoji: '✨',
    bg: '#352454',
    text: '#F4F0FF',
  };

  const label = isKannada ? meta.labelKn : meta.labelEn;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={!onPress}
      style={{
        backgroundColor: meta.bg,
        borderRadius: 20,
        paddingHorizontal: compact ? 10 : 14,
        paddingVertical: compact ? 4 : 8,
        marginRight: 8,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#24183B',
      }}
    >
      <Text style={{ fontSize: compact ? 12 : 16, marginRight: 6 }}>{meta.emoji}</Text>
      <View>
        <Text
          style={{
            color: meta.text,
            fontWeight: '700',
            fontSize: compact ? 11 : 13,
          }}
        >
          {username ? `${username}: ` : ''}
          {label}
        </Text>
        {customNote && !compact && (
          <Text
            style={{
              color: meta.text,
              fontSize: 11,
              opacity: 0.85,
              marginTop: 1,
            }}
            numberOfLines={1}
          >
            "{customNote}"
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

