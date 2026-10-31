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
    accent: '#8B5CF6',
    bg: 'rgba(139, 92, 246, 0.16)',
    text: '#E9D5FF',
  },
  NEED_GOSSIP: {
    labelKn: 'ಗಾಸಿಪ್ ಬೇಕು',
    labelEn: 'Need Gossip',
    emoji: '👀',
    accent: '#F43F5E',
    bg: 'rgba(244, 63, 94, 0.16)',
    text: '#FECDD3',
  },
  DEAD_INSIDE: {
    labelKn: 'ಡೆಡ್ ಇನ್‌ಸೈಡ್',
    labelEn: 'Dead Inside',
    emoji: '💀',
    accent: '#64748B',
    bg: 'rgba(100, 116, 139, 0.2)',
    text: '#E2E8F0',
  },
  CHILL_MODE: {
    labelKn: 'ಚಿಲ್ ಮೋಡ್',
    labelEn: 'Chill Mode',
    emoji: '☕',
    accent: '#10B981',
    bg: 'rgba(16, 185, 129, 0.16)',
    text: '#A7F3D0',
  },
  MAIN_CHARACTER: {
    labelKn: 'ಮೇನ್ ಕ್ಯಾರೆಕ್ಟರ್',
    labelEn: 'Main Character',
    emoji: '💅',
    accent: '#EC4899',
    bg: 'rgba(236, 72, 153, 0.16)',
    text: '#FBCFE8',
  },
  BATTERY_LOW: {
    labelKn: 'ಬ್ಯಾಟರಿ 1%',
    labelEn: 'Battery 1%',
    emoji: '🪫',
    accent: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.18)',
    text: '#FCA5A5',
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
    accent: '#8B5CF6',
    bg: 'rgba(139, 92, 246, 0.16)',
    text: '#E9D5FF',
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
          borderWidth: 1.2,
          borderColor: meta.accent + '55',
        },
        Platform.OS === 'web'
          ? ({
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
            } as any)
          : {},
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
              color: '#94A3B8',
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
