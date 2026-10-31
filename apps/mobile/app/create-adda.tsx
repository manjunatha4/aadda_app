import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../src/services/api';
import { Floating, Pulse } from '../src/components/AnimatedVisuals';

const BADGE_OPTIONS = ['🛖', '⚡', '☕', '🔥', '👑', '🍕', '🎮', '🚀', '💎', '🐸', '🍓', '🍦', '👅', '💡', '🛼'];

export default function CreateAddaScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedBadge, setSelectedBadge] = useState('🛖');
  const [creating, setCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdAdda, setCreatedAdda] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const isKn = i18n.language === 'kn';

  const handleCreate = async () => {
    if (!name.trim()) {
      setErrorMessage(isKn ? 'ದಯವಿಟ್ಟು ಅಡ್ಡಾ ಹೆಸರು ನಮೂದಿಸಿ' : 'Please enter Adda / Room name');
      return;
    }

    try {
      setCreating(true);
      setErrorMessage(null);
      const res = await api.post('/addas', {
        name: `${selectedBadge} ${name.trim()}`,
        description: description.trim() || undefined,
      });

      setCreatedAdda(res);
    } catch (e: any) {
      setErrorMessage(e.message || 'Failed to create room. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const copyCode = () => {
    if (createdAdda?.inviteCode) {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(createdAdda.inviteCode);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <LinearGradient colors={['#1F0E33', '#150924', '#0D0517']} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, maxWidth: 520, width: '100%', alignSelf: 'center' }}>
        {createdAdda ? (
          /* SUCCESS CELEBRATION VIEW WITH FLOATING ANIMATION */
          <LinearGradient
            colors={['#321752', '#1E0C33']}
            style={{
              borderRadius: 28,
              padding: 24,
              borderWidth: 2,
              borderColor: '#D9FF67',
              alignItems: 'center',
              marginTop: 30,
              shadowColor: '#D9FF67',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 16,
            }}
          >
            <Floating distance={10} duration={2000}>
              <Text style={{ fontSize: 56, marginBottom: 8 }}>🎉</Text>
            </Floating>
            <Text style={{ color: '#D9FF67', fontSize: 26, fontWeight: '900', textAlign: 'center' }}>
              {createdAdda.name}
            </Text>
            <Text style={{ color: '#E8DFF5', opacity: 0.85, fontSize: 14, textAlign: 'center', marginTop: 6 }}>
              {isKn ? 'ನಿಮ್ಮ ಹೊಸ ಅಡ್ಡಾ ಯಶಸ್ವಿಯಾಗಿ ಸೃಷ್ಟಿಯಾಗಿದೆ!' : 'Your exclusive room has been created!'}
            </Text>

            {/* Glowing Secret Code Box */}
            <LinearGradient
              colors={['#170828', '#110520']}
              style={{
                borderRadius: 20,
                padding: 20,
                marginVertical: 22,
                width: '100%',
                alignItems: 'center',
                borderWidth: 2,
                borderColor: '#FF786B',
                shadowColor: '#FF786B',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.35,
                shadowRadius: 12,
              }}
            >
              <Text style={{ color: '#A592C4', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
                {isKn ? 'ಫ್ರೆಂಡ್ಸ್‌ಗಾಗಿ ಸೀಕ್ರೆಟ್ ಇನ್ವೈಟ್ ಕೋಡ್' : 'Secret Invite Code for Friends'}
              </Text>
              <Text
                style={{
                  color: '#D9FF67',
                  fontSize: 32,
                  fontWeight: '900',
                  letterSpacing: 4,
                  marginVertical: 10,
                }}
              >
                {createdAdda.inviteCode || 'ADDA-VIP'}
              </Text>

              <TouchableOpacity
                onPress={copyCode}
                activeOpacity={0.85}
                style={{
                  backgroundColor: copied ? '#2ECC71' : '#FF786B',
                  paddingHorizontal: 18,
                  paddingVertical: 9,
                  borderRadius: 20,
                  marginTop: 4,
                }}
              >
                <Text style={{ color: '#180B2E', fontWeight: '900', fontSize: 12 }}>
                  {copied ? '✓ COPIED TO CLIPBOARD!' : '📋 COPY INVITE CODE'}
                </Text>
              </TouchableOpacity>
            </LinearGradient>

            {/* Action Buttons */}
            <TouchableOpacity
              onPress={() => {
                if (createdAdda.conversationId) {
                  router.replace(`/chat/${createdAdda.conversationId}`);
                } else {
                  router.replace(`/adda/${createdAdda.id}`);
                }
              }}
              activeOpacity={0.85}
              style={{
                width: '100%',
                borderRadius: 16,
                overflow: 'hidden',
                marginBottom: 12,
                shadowColor: '#D9FF67',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 10,
              }}
            >
              <LinearGradient
                colors={['#E5FF8F', '#D9FF67', '#AEEB2A']}
                style={{
                  paddingVertical: 16,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#180B2E', fontWeight: '900', fontSize: 16 }}>
                  {isKn ? 'ಚಾಟ್ ಪ್ರಾರಂಭಿಸಿ 💬' : 'Open Room Chat 💬'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.replace('/(tabs)')}
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                paddingVertical: 13,
                width: '100%',
                borderRadius: 14,
                alignItems: 'center',
                borderWidth: 1.5,
                borderColor: '#4A2576',
              }}
            >
              <Text style={{ color: '#F4F0FF', fontWeight: '800', fontSize: 14 }}>
                {isKn ? 'ಮುಖಪುಟಕ್ಕೆ ಹೋಗಿ' : 'Back to Addas List'}
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        ) : (
          /* ROOM CREATION FORM */
          <View>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
                <Text style={{ color: '#D9FF67', fontSize: 24, fontWeight: '900' }}>←</Text>
              </TouchableOpacity>
              <Text style={{ color: '#D9FF67', fontSize: 24, fontWeight: '900' }}>
                {isKn ? 'ಹೊಸ ಅಡ್ಡಾ ರಚಿಸಿ' : 'Create New Room'} 🛖
              </Text>
            </View>

            <Text style={{ color: '#E0D5F0', opacity: 0.8, fontSize: 13, marginBottom: 20 }}>
              {isKn ? 'ನಿಮ್ಮ ಕ್ಲೋಸ್ ಫ್ರೆಂಡ್ಸ್‌ಗಾಗಿ ಪ್ರೈವೇಟ್ ರೂಮ್' : 'Invite-only digital sanctuary for your gang'}
            </Text>

            {errorMessage && (
              <View
                style={{
                  backgroundColor: '#FF5C4D',
                  padding: 12,
                  borderRadius: 14,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: '#FF786B',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '800', textAlign: 'center', fontSize: 13 }}>
                  ⚠️ {errorMessage}
                </Text>
              </View>
            )}

            {/* Sticker / Badge Picker */}
            <Text style={{ color: '#F4F0FF', fontSize: 13, fontWeight: '800', marginBottom: 10 }}>
              {isKn ? 'ಅಡ್ಡಾ ಐಕಾನ್ / ಸ್ಟಿಕ್ಕರ್ ಆಯ್ಕೆಮಾಡಿ:' : 'Choose Room Badge / Sticker:'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginBottom: 22 }}>
              {BADGE_OPTIONS.map((badge) => (
                <TouchableOpacity
                  key={badge}
                  onPress={() => setSelectedBadge(badge)}
                  activeOpacity={0.8}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: selectedBadge === badge ? '#D9FF67' : '#2A1444',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 10,
                    borderWidth: 2,
                    borderColor: selectedBadge === badge ? '#E5FF8F' : '#452270',
                    shadowColor: selectedBadge === badge ? '#D9FF67' : 'transparent',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.5,
                    shadowRadius: 8,
                  }}
                >
                  <Text style={{ fontSize: 26 }}>{badge}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Room Name */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: '#F4F0FF', fontSize: 13, fontWeight: '800', marginBottom: 6 }}>
                {isKn ? 'ಅಡ್ಡಾ ಹೆಸರು (Room Name) *' : 'Room Name *'}
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={isKn ? 'ಉದಾ: ಕಟ್ಟಿಂಗ್ ಚಾಯ್ ಕ್ಲಬ್ / ನೈಟ್ ರೈಡರ್ಸ್' : 'e.g. Cutting Chai Club / Night Owls'}
                placeholderTextColor="#7C6B94"
                style={{
                  backgroundColor: '#26143D',
                  borderRadius: 14,
                  padding: 14,
                  color: '#FFFFFF',
                  fontSize: 16,
                  borderWidth: 1.5,
                  borderColor: '#3E2063',
                }}
              />
            </View>

            {/* Description */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: '#F4F0FF', fontSize: 13, fontWeight: '800', marginBottom: 6 }}>
                {isKn ? 'ವಿವರಣೆ (Description)' : 'Description (Optional)'}
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder={isKn ? 'ವೀಕೆಂಡ್ ರೋಸ್ಟ್, ಪ್ಲಾನ್‌ಗಳು ಮತ್ತು ಗಾಸಿಪ್...' : 'Roasts, gaming, gossip, and weekend vibes...'}
                placeholderTextColor="#7C6B94"
                multiline
                numberOfLines={3}
                style={{
                  backgroundColor: '#26143D',
                  borderRadius: 14,
                  padding: 14,
                  color: '#FFFFFF',
                  fontSize: 15,
                  height: 90,
                  textAlignVertical: 'top',
                  borderWidth: 1.5,
                  borderColor: '#3E2063',
                }}
              />
            </View>

            <TouchableOpacity
              onPress={handleCreate}
              disabled={creating}
              activeOpacity={0.85}
              style={{
                borderRadius: 16,
                overflow: 'hidden',
                shadowColor: '#D9FF67',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 10,
              }}
            >
              <LinearGradient
                colors={['#E5FF8F', '#D9FF67', '#AEEB2A']}
                style={{
                  paddingVertical: 16,
                  alignItems: 'center',
                }}
              >
                {creating ? (
                  <ActivityIndicator color="#180B2E" />
                ) : (
                  <Text style={{ color: '#180B2E', fontSize: 16, fontWeight: '900' }}>
                    {isKn ? 'ರೂಮ್ ಕ್ರಿಯೇಟ್ ಮಾಡಿ' : 'Create Room & Get Invite Code'} 🚀
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}
