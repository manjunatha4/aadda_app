import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';

const VIBE_METADATA: Record<
  string,
  { labelKn: string; labelEn: string; emoji: string; accent: string; bg: string; text: string }
> = {
  MENTALLY_OFFLINE: {
    labelKn: 'ಮೆಂಟಲಿ ಆಫ್‌ಲೈನ್',
    labelEn: 'Mentally Offline',
    emoji: '📴',
    accent: '#6366F1',
    bg: '#EEF2FF',
    text: '#4F46E5',
  },
  NEED_GOSSIP: {
    labelKn: 'ಗಾಸಿಪ್ ಬೇಕು',
    labelEn: 'Need Gossip',
    emoji: '👀',
    accent: '#F43F5E',
    bg: '#FFF1F2',
    text: '#E11D48',
  },
  DEAD_INSIDE: {
    labelKn: 'ಡೆಡ್ ಇನ್‌ಸೈಡ್',
    labelEn: 'Dead Inside',
    emoji: '💀',
    accent: '#64748B',
    bg: '#F1F5F9',
    text: '#475569',
  },
  CHILL_MODE: {
    labelKn: 'ಚಿಲ್ ಮೋಡ್',
    labelEn: 'Chill Mode',
    emoji: '☕',
    accent: '#10B981',
    bg: '#ECFDF5',
    text: '#059669',
  },
  MAIN_CHARACTER: {
    labelKn: 'ಮೇನ್ ಕ್ಯಾರೆಕ್ಟರ್',
    labelEn: 'Main Character',
    emoji: '💅',
    accent: '#EC4899',
    bg: '#FDF2F8',
    text: '#DB2777',
  },
  BATTERY_LOW: {
    labelKn: 'ಬ್ಯಾಟರಿ 1%',
    labelEn: 'Battery 1%',
    emoji: '🪫',
    accent: '#EF4444',
    bg: '#FEF2F2',
    text: '#DC2626',
  },
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
    accent: '#6366F1',
    bg: '#EEF2FF',
    text: '#4F46E5',
  };

  const label = isKannada ? meta.labelKn : meta.labelEn;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={!onPress}
      style={[
        {
          backgroundColor: meta.bg,
          borderRadius: 20,
          paddingHorizontal: compact ? 10 : 14,
          paddingVertical: compact ? 4 : 8,
          marginRight: 8,
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: meta.accent + '40',
        },
      ]}
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
              color: '#64748B',
              fontSize: 11,
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
