import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Platform, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { api } from '../src/services/api';
import { Floating } from '../src/components/AnimatedVisuals';

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
      const fullName = `${selectedBadge} ${name.trim()}`;
      const res = await api.post('/addas', {
        name: fullName,
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

  const handleShare = async () => {
    if (!createdAdda?.inviteCode) return;
    const shareMessage = `Join my room "${createdAdda.name}" on AADDA! Use secret invite code: ${createdAdda.inviteCode}`;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && (navigator as any).share) {
        await (navigator as any).share({
          title: createdAdda.name,
          text: shareMessage,
        });
      } else {
        copyCode();
      }
    } catch {
      copyCode();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F2EB' }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: 20,
          maxWidth: 500,
          width: '100%',
          alignSelf: 'center',
          justifyContent: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        {createdAdda ? (
          /* SUCCESS CELEBRATION VIEW */
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 30,
              padding: 24,
              borderWidth: 1,
              borderColor: '#E8E5DD',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
            }}
          >
            <Floating distance={8} duration={2000}>
              <Text style={{ fontSize: 52, marginBottom: 8 }}>🎉</Text>
            </Floating>
            <Text style={{ color: '#18171C', fontSize: 24, fontWeight: '900', textAlign: 'center' }}>
              {createdAdda.name}
            </Text>
            <Text style={{ color: '#78716C', fontSize: 14, textAlign: 'center', marginTop: 4 }}>
              {isKn ? 'ನಿಮ್ಮ ಹೊಸ ಅಡ್ಡಾ ಯಶಸ್ವಿಯಾಗಿ ಸೃಷ್ಟಿಯಾಗಿದೆ!' : 'Your room is ready for real users across all devices!'}
            </Text>

            {/* Secret Code Box */}
            <View
              style={{
                backgroundColor: '#F5F2EB',
                borderRadius: 22,
                padding: 18,
                marginVertical: 20,
                width: '100%',
                alignItems: 'center',
                borderWidth: 1.5,
                borderColor: '#E5DFC8',
              }}
            >
              <Text style={{ color: '#78716C', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 }}>
                {isKn ? 'ಸ್ನೇಹಿತರಿಗಾಗಿ ಸೀಕ್ರೆಟ್ ಇನ್ವೈಟ್ ಕೋಡ್' : 'SECRET ROOM JOINING CODE'}
              </Text>
              <Text
                style={{
                  color: '#FF6464',
                  fontSize: 32,
                  fontWeight: '900',
                  letterSpacing: 3,
                  marginVertical: 8,
                }}
              >
                {createdAdda.inviteCode || 'ADDA-VIP'}
              </Text>

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                <TouchableOpacity
                  onPress={copyCode}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: copied ? '#10B981' : '#18171C',
                    paddingHorizontal: 16,
                    paddingVertical: 9,
                    borderRadius: 16,
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>
                    {copied ? '✓ COPIED TO CLIPBOARD' : '📋 COPY ROOM CODE'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleShare}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: '#3C97FF',
                    paddingHorizontal: 16,
                    paddingVertical: 9,
                    borderRadius: 16,
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>
                    🚀 SHARE
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

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
                backgroundColor: '#FF6464',
                borderRadius: 18,
                paddingVertical: 14,
                alignItems: 'center',
                marginBottom: 10,
                shadowColor: '#FF6464',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 15 }}>
                {isKn ? 'ಚಾಟ್ ಪ್ರಾರಂಭಿಸಿ 💬' : 'Open Room Chat 💬'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.replace('/(tabs)')}
              style={{
                paddingVertical: 12,
                width: '100%',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#78716C', fontWeight: '800', fontSize: 14 }}>
                {isKn ? 'ಮುಖಪುಟಕ್ಕೆ ಹೋಗಿ' : 'Back to Home'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ROOM CREATION FORM */
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 30,
              padding: 24,
              borderWidth: 1,
              borderColor: '#E8E5DD',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 10,
            }}
          >
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 10 }}>
                <Text style={{ color: '#18171C', fontSize: 24, fontWeight: '900' }}>←</Text>
              </TouchableOpacity>
              <Text style={{ color: '#18171C', fontSize: 22, fontWeight: '900' }}>
                {isKn ? 'ಹೊಸ ಕೊಠಡಿ ರಚಿಸಿ' : 'Create New Room'}
              </Text>
            </View>

            <Text style={{ color: '#78716C', fontSize: 13, fontWeight: '600', marginBottom: 18 }}>
              {isKn ? 'ನಿಮ್ಮ ಕ್ಲೋಸ್ ಫ್ರೆಂಡ್ಸ್‌ಗಾಗಿ ಪ್ರೈವೇಟ್ ರೂಮ್' : 'Invite-only hangout for your real friends & crew'}
            </Text>

            {errorMessage && (
              <View
                style={{
                  backgroundColor: '#FEE2E2',
                  padding: 12,
                  borderRadius: 14,
                  marginBottom: 16,
                }}
              >
                <Text style={{ color: '#DC2626', fontWeight: '700', textAlign: 'center', fontSize: 13 }}>
                  ⚠️ {errorMessage}
                </Text>
              </View>
            )}

            {/* Sticker / Badge Picker */}
            <Text style={{ color: '#18171C', fontSize: 13, fontWeight: '800', marginBottom: 10 }}>
              {isKn ? 'ರೂಮ್ ಐಕಾನ್ / ಸ್ಟಿಕ್ಕರ್ ಆಯ್ಕೆಮಾಡಿ:' : 'Choose Room Badge / Sticker:'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginBottom: 20 }}>
              {BADGE_OPTIONS.map((badge) => (
                <TouchableOpacity
                  key={badge}
                  onPress={() => setSelectedBadge(badge)}
                  activeOpacity={0.8}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: selectedBadge === badge ? '#FF6464' : '#F5F2EB',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 8,
                    borderWidth: 2,
                    borderColor: selectedBadge === badge ? '#FF6464' : '#E8E5DD',
                  }}
                >
                  <Text style={{ fontSize: 22 }}>{badge}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Room Name */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: '#18171C', fontSize: 13, fontWeight: '800', marginBottom: 6 }}>
                {isKn ? 'ರೂಮ್ ಹೆಸರು (Room Name) *' : 'Room Name *'}
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={isKn ? 'ಉದಾ: ಕಟ್ಟಿಂಗ್ ಚಾಯ್ ಕ್ಲಬ್' : 'e.g. Rager @Dunes / Chai Adda'}
                placeholderTextColor="#A8A29E"
                style={{
                  backgroundColor: '#F5F2EB',
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  color: '#18171C',
                  fontSize: 15,
                  fontWeight: '700',
                  borderWidth: 1,
                  borderColor: '#E8E5DD',
                }}
              />
            </View>

            {/* Description */}
            <View style={{ marginBottom: 22 }}>
              <Text style={{ color: '#18171C', fontSize: 13, fontWeight: '800', marginBottom: 6 }}>
                {isKn ? 'ವಿವರಣೆ (Description)' : 'Description (Optional)'}
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder={isKn ? 'ಪ್ಲಾನ್‌ಗಳು ಮತ್ತು ವೈಬ್ಸ್...' : 'Weekend plans, roasts, and hangouts...'}
                placeholderTextColor="#A8A29E"
                multiline
                numberOfLines={3}
                style={{
                  backgroundColor: '#F5F2EB',
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  color: '#18171C',
                  fontSize: 14,
                  height: 80,
                  textAlignVertical: 'top',
                  borderWidth: 1,
                  borderColor: '#E8E5DD',
                }}
              />
            </View>

            <TouchableOpacity
              onPress={handleCreate}
              disabled={creating}
              activeOpacity={0.88}
              style={{
                backgroundColor: '#FF6464',
                borderRadius: 18,
                paddingVertical: 15,
                alignItems: 'center',
                shadowColor: '#FF6464',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}
            >
              {creating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '900' }}>
                  {isKn ? 'ರೂಮ್ ಕ್ರಿಯೇಟ್ ಮಾಡಿ' : 'Create Room & Get Code'} 🚀
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
