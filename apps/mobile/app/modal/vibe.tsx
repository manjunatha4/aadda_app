import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { api } from '../../src/services/api';

const VIBE_OPTIONS = [
  { mood: 'CHILL_MODE', labelKn: 'ಚಿಲ್ ಮೋಡ್', labelEn: 'Chill Mode', emoji: '☕', desc: 'ಫಿಲ್ಟರ್ ಕಾಫಿ & ರಿಲ್ಯಾಕ್ಸ್' },
  { mood: 'NEED_GOSSIP', labelKn: 'ಗಾಸಿಪ್ ಬೇಕು', labelEn: 'Need Gossip', emoji: '👀', desc: 'ಬ್ರೇಕಿಂಗ್ ನ್ಯೂಸ್ ಹೇಳಿ' },
  { mood: 'MENTALLY_OFFLINE', labelKn: 'ಮೆಂಟಲಿ ಆಫ್‌ಲೈನ್', labelEn: 'Mentally Offline', emoji: '📴', desc: 'ಯಾರೂ ಕಾಲ್ ಮಾಡ್ಬೇಡಿ' },
  { mood: 'DEAD_INSIDE', labelKn: 'ಡೆಡ್ ಇನ್‌ಸೈಡ್', labelEn: 'Dead Inside', emoji: '💀', desc: 'ಸೋಮವಾರದ ಹ್ಯಾಂಗೊವರ್' },
  { mood: 'MAIN_CHARACTER', labelKn: 'ಮೇನ್ ಕ್ಯಾರೆಕ್ಟರ್', labelEn: 'Main Character', emoji: '💅', desc: 'ಇವತ್ತು ನಾನೇ ಹೀರೋ' },
  { mood: 'BATTERY_LOW', labelKn: 'ಬ್ಯಾಟರಿ 1%', labelEn: 'Social Battery 1%', emoji: '🪫', desc: 'ಎನರ್ಜಿ ಶೂನ್ಯ' },
];

export default function VibeModal() {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [selectedMood, setSelectedMood] = useState('CHILL_MODE');
  const [customNote, setCustomNote] = useState('');
  const [durationHours, setDurationHours] = useState(4);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const isKn = i18n.language === 'kn';

  const handleSaveVibe = async () => {
    try {
      setSaving(true);
      setStatusMsg(null);
      await api.post('/vibe', {
        mood: selectedMood,
        customNote: customNote.trim() || undefined,
        durationHours,
      });
      setStatusMsg('✓ Vibe check updated!');
      setTimeout(() => {
        router.back();
      }, 800);
    } catch (e: any) {
      setStatusMsg(`⚠️ ${e.message || 'Failed to update vibe'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: '#24183B', padding: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 10 }}>
          <Text style={{ color: '#D9FF67', fontSize: 24, fontWeight: '900' }}>←</Text>
        </TouchableOpacity>
        <Text style={{ color: '#D9FF67', fontSize: 24, fontWeight: '900' }}>
          {isKn ? 'ನಿಮ್ಮ ವೈಬ್ ಹಾಕಿ' : 'Set Your Vibe'} ⚡
        </Text>
      </View>

      <Text style={{ color: '#F4F0FF', opacity: 0.8, fontSize: 13, marginBottom: 20 }}>
        {isKn ? 'ನಿಮ್ಮ ಸರ್ಕಲ್‌ಗೆ ನೀವು ಹೇಗಿದ್ದೀರಿ ಎಂದು ತಿಳಿಸಿ' : 'Let your circle know your current wavelength'}
      </Text>

      {statusMsg && (
        <View style={{ backgroundColor: statusMsg.startsWith('✓') ? '#2ECC71' : '#FF5C4D', padding: 12, borderRadius: 12, marginBottom: 16 }}>
          <Text style={{ color: '#FFFFFF', fontWeight: '800', textAlign: 'center', fontSize: 13 }}>
            {statusMsg}
          </Text>
        </View>
      )}

      {/* Mood Selector Grid */}
      <View style={{ marginBottom: 20 }}>
        {VIBE_OPTIONS.map((opt) => {
          const isSelected = selectedMood === opt.mood;
          return (
            <TouchableOpacity
              key={opt.mood}
              onPress={() => setSelectedMood(opt.mood)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isSelected ? '#D9FF67' : '#352454',
                padding: 14,
                borderRadius: 14,
                marginBottom: 10,
                borderWidth: 2,
                borderColor: isSelected ? '#C7F54B' : '#47326B',
              }}
            >
              <Text style={{ fontSize: 26, marginRight: 12 }}>{opt.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: isSelected ? '#24183B' : '#FFFFFF',
                    fontSize: 16,
                    fontWeight: '800',
                  }}
                >
                  {isKn ? opt.labelKn : opt.labelEn}
                </Text>
                <Text
                  style={{
                    color: isSelected ? '#352454' : '#8C7D9E',
                    fontSize: 12,
                    marginTop: 2,
                  }}
                >
                  {opt.desc}
                </Text>
              </View>
              {isSelected && <Text style={{ fontSize: 18 }}>✓</Text>}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Custom Note */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ color: '#F4F0FF', fontSize: 13, fontWeight: '700', marginBottom: 6 }}>
          {isKn ? 'ಕಸ್ಟಮ್ ಸಂದೇಶ (Custom Status)' : 'Custom Status Note (Optional)'}
        </Text>
        <TextInput
          value={customNote}
          onChangeText={setCustomNote}
          placeholder={isKn ? 'ಉದಾ: CTR ಮಸಾಲೆ ದೋಸೆ ಮೂಡ್...' : 'e.g. Filter coffee + rain vibe...'}
          placeholderTextColor="#8C7D9E"
          style={{
            backgroundColor: '#352454',
            borderRadius: 12,
            padding: 12,
            color: '#FFFFFF',
            fontSize: 14,
            borderWidth: 1.5,
            borderColor: '#47326B',
          }}
        />
      </View>

      <TouchableOpacity
        onPress={handleSaveVibe}
        disabled={saving}
        style={{
          backgroundColor: '#FF786B',
          paddingVertical: 14,
          borderRadius: 12,
          alignItems: 'center',
        }}
      >
        {saving ? (
          <ActivityIndicator color="#24183B" />
        ) : (
          <Text style={{ color: '#24183B', fontSize: 16, fontWeight: '900' }}>
            {isKn ? 'ವೈಬ್ ಅಪ್‌ಡೇಟ್ ಮಾಡಿ' : 'Update My Vibe'} ⚡
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
