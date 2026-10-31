import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { api } from '../src/services/api';
import { clientStore } from '../src/services/clientStore';
import {
  MainLayout,
  PageHeader,
  GlassCard,
  PrimaryButton,
  SecondaryButton,
  InputField,
  ToastNotification,
  DS_TOKENS,
} from '../src/components/DesignSystem';

const BADGE_OPTIONS = ['🛖', '⚡', '☕', '🔥', '👑', '🍕', '🎮', '🚀', '💎', '🐸', '🍓', '🍦', '👅', '💡', '🛼'];

export default function CreateAddaScreen() {
  const { i18n } = useTranslation();
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedBadge, setSelectedBadge] = useState('🛖');
  const [creating, setCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdAdda, setCreatedAdda] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isKn = i18n.language === 'kn';

  const handleCreate = async () => {
    if (!name.trim()) {
      setErrorMessage(isKn ? 'ದಯವಿಟ್ಟು ರೂಮ್ ಹೆಸರು ನಮೂದಿಸಿ' : 'Please enter room / adda name');
      return;
    }

    try {
      setCreating(true);
      setErrorMessage(null);
      const fullName = `${selectedBadge} ${name.trim()}`;
      let res;
      try {
        res = await api.post('/addas', {
          name: fullName,
          description: description.trim() || undefined,
        });
      } catch (apiErr) {
        res = await clientStore.createAdda(fullName, description.trim() || undefined);
      }

      setCreatedAdda(res);
      setToastMessage(isKn ? 'ರೂಮ್ ರಚಿಸಲಾಗಿದೆ! 🎉' : 'Room created successfully! 🎉');
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
      setToastMessage(isKn ? 'ಕೋಡ್ ನಕಲಿಸಲಾಗಿದೆ!' : 'Secret code copied to clipboard!');
      setTimeout(() => {
        setCopied(false);
        setToastMessage(null);
      }, 2500);
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
    <MainLayout>
      <ToastNotification
        visible={Boolean(toastMessage)}
        message={toastMessage || ''}
        onDismiss={() => setToastMessage(null)}
      />

      {/* Page Header */}
      <PageHeader
        title={isKn ? 'ಹೊಸ ರೂಮ್ ರಚಿಸಿ' : 'Create New Room'}
        subtitle={isKn ? 'ಸ್ನೇಹಿತರೊಂದಿಗೆ ಹರಟೆ ಹೊಡೆಯಲು ಹೊಸ ಕೊಠಡಿ ಸೃಷ್ಟಿಸಿ' : 'Create a real-time room and invite your friends with a secret code'}
      />

      <View style={{ maxWidth: 540, width: '100%', alignSelf: 'center' }}>
        {createdAdda ? (
          /* SUCCESS CELEBRATION CARD */
          <GlassCard elevated style={{ alignItems: 'center', paddingVertical: 32 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: DS_TOKENS.colors.emeraldLight,
                borderWidth: 1.5,
                borderColor: DS_TOKENS.colors.emeraldBorder,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 36 }}>🎉</Text>
            </View>

            <Text style={{ color: DS_TOKENS.colors.textPrimary, fontSize: 24, fontWeight: '900', textAlign: 'center' }}>
              {createdAdda.name}
            </Text>
            <Text style={{ color: DS_TOKENS.colors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 4, maxWidth: 360 }}>
              {isKn ? 'ನಿಮ್ಮ ಹೊಸ ರೂಮ್ ಸಿದ್ಧವಾಗಿದೆ! ಸ್ನೇಹಿತರೊಂದಿಗೆ ಸೀಕ್ರೆಟ್ ಕೋಡ್ ಹಂಚಿಕೊಳ್ಳಿ.' : 'Your room is live across all devices! Share the secret invite code with your crew.'}
            </Text>

            {/* Secret Code Box */}
            <View
              style={{
                backgroundColor: DS_TOKENS.colors.bgSecondary,
                borderRadius: 20,
                padding: 20,
                marginVertical: 22,
                width: '100%',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: DS_TOKENS.colors.borderSubtle,
              }}
            >
              <Text style={{ color: DS_TOKENS.colors.purple, fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>
                {isKn ? 'ಸೀಕ್ರೆಟ್ ಕೊಠಡಿ ಕೋಡ್' : 'SECRET ROOM JOINING CODE'}
              </Text>
              <Text
                style={{
                  color: DS_TOKENS.colors.textPrimary,
                  fontSize: 32,
                  fontWeight: '900',
                  letterSpacing: 3,
                  marginVertical: 10,
                }}
              >
                {createdAdda.inviteCode || 'ADDA-VIP'}
              </Text>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                <PrimaryButton
                  title={copied ? '✓ COPIED' : '📋 Copy Code'}
                  onPress={copyCode}
                  variant={copied ? 'emerald' : 'purple'}
                />
                <SecondaryButton title="🚀 Share" onPress={handleShare} />
              </View>
            </View>

            {/* Navigation options */}
            <View style={{ width: '100%', gap: 10 }}>
              <PrimaryButton
                title={isKn ? 'ಚಾಟ್‌ಗೆ ಹೋಗಿ →' : 'Enter Room Chat →'}
                onPress={() => {
                  if (createdAdda.conversationId) {
                    router.replace(`/chat/${createdAdda.conversationId}`);
                  } else {
                    router.replace('/(tabs)');
                  }
                }}
              />
              <SecondaryButton
                title={isKn ? 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ' : 'Back to Dashboard'}
                onPress={() => router.replace('/(tabs)')}
              />
            </View>
          </GlassCard>
        ) : (
          /* ROOM CREATION FORM */
          <GlassCard elevated>
            {/* Room Icon / Badge Picker */}
            <Text style={{ color: DS_TOKENS.colors.textPrimary, fontSize: 13, fontWeight: '800', marginBottom: 8 }}>
              {isKn ? 'ರೂಮ್ ಐಕಾನ್ ಆಯ್ಕೆಮಾಡಿ' : 'Choose Room Icon'}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {BADGE_OPTIONS.map((badge) => {
                const isSelected = selectedBadge === badge;
                return (
                  <TouchableOpacity
                    key={badge}
                    onPress={() => setSelectedBadge(badge)}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: isSelected ? DS_TOKENS.colors.purpleLight : DS_TOKENS.colors.bgSecondary,
                      borderWidth: 1.5,
                      borderColor: isSelected ? DS_TOKENS.colors.purple : DS_TOKENS.colors.borderSubtle,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 20 }}>{badge}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Room Name Input */}
            <InputField
              label={isKn ? 'ರೂಮ್ ಹೆಸರು (Room Name) *' : 'Room / Adda Name *'}
              value={name}
              onChangeText={setName}
              placeholder={isKn ? 'ಉದಾ: ಬೆಂಗಳೂರು ಟೆಕ್ ಸರ್ಕಲ್, ವೀಕೆಂಡ್ ಹರಟೆ...' : 'e.g. Chai Adda, Night Owls, Weekend Plans'}
              errorMessage={errorMessage}
            />

            {/* Room Description Input */}
            <InputField
              label={isKn ? 'ವಿವರಣೆ (Description)' : 'Room Description'}
              value={description}
              onChangeText={setDescription}
              placeholder={isKn ? 'ರೂಮ್‌ನ ಉದ್ದೇಶವೇನು?...' : 'What is this room about?...'}
              multiline
              numberOfLines={3}
            />

            {/* Submit & Cancel Buttons */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <SecondaryButton
                title={isKn ? 'ರದ್ದು' : 'Cancel'}
                onPress={() => router.back()}
                style={{ flex: 1 }}
              />
              <PrimaryButton
                title={isKn ? 'ರೂಮ್ ರಚಿಸಿ 🎉' : 'Create Room 🎉'}
                onPress={handleCreate}
                loading={creating}
                style={{ flex: 1 }}
              />
            </View>
          </GlassCard>
        )}
      </View>
    </MainLayout>
  );
}
