import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { api } from '../../src/services/api';
import {
  MainLayout,
  PageHeader,
  GlassCard,
  PrimaryButton,
  SecondaryButton,
  InputField,
  ToastNotification,
  DS_TOKENS,
  DS_FONTS,
} from '../../src/components/DesignSystem';

const VIBE_OPTIONS = [
  { mood: 'CHILL_MODE', labelKn: 'ಚಿಲ್ ಮೋಡ್', labelEn: 'Chill Mode', emoji: '☕', desc: 'Relaxing with filter coffee' },
  { mood: 'NEED_GOSSIP', labelKn: 'ಗಾಸಿಪ್ ಬೇಕು', labelEn: 'Need Gossip', emoji: '👀', desc: 'Tell me the tea' },
  { mood: 'MENTALLY_OFFLINE', labelKn: 'ಮೆಂಟಲಿ ಆಫ್‌ಲೈನ್', labelEn: 'Mentally Offline', emoji: '📴', desc: 'DND mode on' },
  { mood: 'DEAD_INSIDE', labelKn: 'ಡೆಡ್ ಇನ್‌ಸೈಡ್', labelEn: 'Dead Inside', emoji: '💀', desc: 'Monday blues' },
  { mood: 'MAIN_CHARACTER', labelKn: 'ಮೇನ್ ಕ್ಯಾರೆಕ್ಟರ್', labelEn: 'Main Character', emoji: '💅', desc: 'Unstoppable vibe' },
  { mood: 'BATTERY_LOW', labelKn: 'ಬ್ಯಾಟರಿ 1%', labelEn: 'Social Battery 1%', emoji: '🪫', desc: 'Recharging energy' },
];

export default function VibeModal() {
  const { i18n } = useTranslation();
  const router = useRouter();

  const [selectedMood, setSelectedMood] = useState('CHILL_MODE');
  const [customNote, setCustomNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isKn = i18n.language === 'kn';

  const handleSaveVibe = async () => {
    try {
      setSaving(true);
      await api.post('/vibe', {
        mood: selectedMood,
        customNote: customNote.trim() || undefined,
      });
      setToastMessage(isKn ? 'ವೈಬ್ ಅಪ್‌ಡೇಟ್ ಆಗಿದೆ! ⚡' : 'Vibe updated successfully! ⚡');
      setTimeout(() => {
        router.back();
      }, 700);
    } catch (e: any) {
      setToastMessage(e.message || 'Failed to update vibe');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
      <ToastNotification
        visible={Boolean(toastMessage)}
        message={toastMessage || ''}
        onDismiss={() => setToastMessage(null)}
      />

      <PageHeader
        title={isKn ? 'ನಿಮ್ಮ ವೈಬ್ ಹಾಕಿ' : 'Update Your Vibe'}
        subtitle={isKn ? 'ನಿಮ್ಮ ಸ್ನೇಹಿತರಿಗೆ ನಿಮ್ಮ ಪ್ರಸ್ತುತ ವೈಬ್ ತಿಳಿಸಿ' : 'Let your circle know your current wavelength and mood'}
        actions={
          <SecondaryButton
            title={isKn ? '‹ ಹಿಂತಿರುಗಿ' : '‹ Back'}
            onPress={() => router.back()}
          />
        }
      />

      <View style={{ maxWidth: 540, width: '100%', alignSelf: 'center', gap: 14 }}>
        {/* Vibe Selection Cards Grid */}
        <View style={{ gap: 10 }}>
          {VIBE_OPTIONS.map((opt) => {
            const isSelected = selectedMood === opt.mood;
            return (
              <GlassCard
                key={opt.mood}
                onPress={() => setSelectedMood(opt.mood)}
                style={{
                  padding: 14,
                  backgroundColor: isSelected ? DS_TOKENS.colors.purpleLight : DS_TOKENS.colors.bgCard,
                  borderColor: isSelected ? DS_TOKENS.colors.purple : DS_TOKENS.colors.borderSubtle,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Text style={{ fontSize: 24 }}>{opt.emoji}</Text>
                    <View>
                      <Text style={{ fontFamily: DS_FONTS.heading, color: DS_TOKENS.colors.textPrimary, fontSize: 15, fontWeight: '800' }}>
                        {isKn ? opt.labelKn : opt.labelEn}
                      </Text>
                      <Text style={{ fontFamily: DS_FONTS.body, color: DS_TOKENS.colors.textSecondary, fontSize: 12, fontWeight: '600', marginTop: 2 }}>
                        {opt.desc}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: isSelected ? DS_TOKENS.colors.purple : '#CBD5E1',
                      backgroundColor: isSelected ? DS_TOKENS.colors.purple : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isSelected && <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '900' }}>✓</Text>}
                  </View>
                </View>
              </GlassCard>
            );
          })}
        </View>

        {/* Custom Note Input */}
        <GlassCard>
          <InputField
            label={isKn ? 'ಕಸ್ಟಮ್ ಸಂದೇಶ (ಐಚ್ಛಿಕ)' : 'Custom Status Note (Optional)'}
            value={customNote}
            onChangeText={setCustomNote}
            placeholder={isKn ? 'ಉದಾ: 5 ಗಂಟೆಯ ನಂತರ ಲಭ್ಯ...' : 'e.g. Free for chai after 5 PM...'}
          />

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <SecondaryButton
              title={isKn ? 'ರದ್ದು' : 'Cancel'}
              onPress={() => router.back()}
              style={{ flex: 1 }}
            />
            <PrimaryButton
              title={isKn ? 'ವೈಬ್ ಸೆಟ್ ಮಾಡಿ ⚡' : 'Set Vibe ⚡'}
              onPress={handleSaveVibe}
              loading={saving}
              style={{ flex: 1 }}
            />
          </View>
        </GlassCard>
      </View>
    </MainLayout>
  );
}
