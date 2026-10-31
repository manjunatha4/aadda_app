import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { api } from '../../src/services/api';
import { useAuthStore } from '../../src/stores/authStore';
import {
  MainLayout,
  PageHeader,
  GlassCard,
  PrimaryButton,
  SecondaryButton,
  ConfirmationDialog,
  LoadingState,
  ToastNotification,
  DS_TOKENS,
} from '../../src/components/DesignSystem';

export default function AddaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { i18n } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [adda, setAdda] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isKn = i18n.language === 'kn';

  const loadDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/addas/${id}`);
      setAdda(res);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadDetails();
    }
  }, [id]);

  const copyCode = (code: string) => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopied(true);
    setToastMessage(isKn ? 'ಕೋಡ್ ನಕಲಿಸಲಾಗಿದೆ!' : 'Secret code copied to clipboard!');
    setTimeout(() => {
      setCopied(false);
      setToastMessage(null);
    }, 2500);
  };

  const handleConfirmLeave = async () => {
    try {
      setLeaving(true);
      await api.delete(`/addas/${id}/leave`).catch(() => {});
      router.replace('/(tabs)');
    } catch (e: any) {
      console.error(e);
      router.replace('/(tabs)');
    } finally {
      setLeaving(false);
      setShowLeaveConfirm(false);
    }
  };

  if (loading || !adda) {
    return (
      <MainLayout>
        <LoadingState message={isKn ? 'ರೂಮ್ ವಿವರ ಲೋಡ್ ಆಗುತ್ತಿದೆ...' : 'Loading room details...'} />
      </MainLayout>
    );
  }

  const activeInvite = adda.inviteCode || 'ADDA-VIP';

  return (
    <MainLayout>
      <ToastNotification
        visible={Boolean(toastMessage)}
        message={toastMessage || ''}
        onDismiss={() => setToastMessage(null)}
      />

      {/* Page Header */}
      <PageHeader
        title={adda.name}
        subtitle={isKn ? 'ಕೊಠಡಿ ವಿವರಗಳು ಮತ್ತು ಸದಸ್ಯರು' : 'Room details, members, and channel settings'}
        actions={
          <SecondaryButton
            title={isKn ? '‹ ಹಿಂತಿರುಗಿ' : '‹ Back'}
            onPress={() => router.back()}
          />
        }
      />

      <View style={{ maxWidth: 640, width: '100%', alignSelf: 'center', gap: 16 }}>
        {/* Room Information Glass Card */}
        <GlassCard elevated>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: DS_TOKENS.colors.purpleLight,
                borderWidth: 1.5,
                borderColor: DS_TOKENS.colors.purpleBorder,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 26 }}>
                {adda.name?.match(/[\p{Emoji}\u200d]+/gu)?.[0] || '🛖'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: DS_TOKENS.colors.textPrimary, fontSize: 20, fontWeight: '900' }}>
                {adda.name}
              </Text>
              <Text style={{ color: DS_TOKENS.colors.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 2 }}>
                👥 {adda.memberCount || 1} {isKn ? 'ಸದಸ್ಯರು' : 'members'} · Created {new Date(adda.createdAt || Date.now()).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {Boolean(adda.description) && (
            <Text style={{ color: DS_TOKENS.colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 4 }}>
              {adda.description}
            </Text>
          )}

          {/* Secret Invite Code Box */}
          <View
            style={{
              backgroundColor: DS_TOKENS.colors.bgSecondary,
              borderRadius: 18,
              padding: 16,
              marginTop: 18,
              borderWidth: 1,
              borderColor: DS_TOKENS.colors.borderSubtle,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View>
              <Text style={{ color: DS_TOKENS.colors.purple, fontSize: 11, fontWeight: '800', letterSpacing: 0.8 }}>
                {isKn ? 'ಇನ್ವೈಟ್ ಕೋಡ್' : 'SECRET INVITE CODE'}
              </Text>
              <Text style={{ color: DS_TOKENS.colors.textPrimary, fontSize: 22, fontWeight: '900', letterSpacing: 2, marginTop: 4 }}>
                {activeInvite}
              </Text>
            </View>

            <PrimaryButton
              title={copied ? '✓ COPIED' : '📋 Copy'}
              onPress={() => copyCode(activeInvite)}
              variant={copied ? 'emerald' : 'purple'}
            />
          </View>
        </GlassCard>

        {/* Enter Chat Action */}
        <GlassCard style={{ padding: 18 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: DS_TOKENS.colors.textPrimary, fontSize: 16, fontWeight: '800' }}>
                {isKn ? 'ರೂಮ್ ಚಾಟ್‌ಗೆ ಪ್ರವೇಶಿಸಿ' : 'Join Conversation'}
              </Text>
              <Text style={{ color: DS_TOKENS.colors.textSecondary, fontSize: 12, fontWeight: '600', marginTop: 2 }}>
                {isKn ? 'ನೈಜ ಸಮಯದಲ್ಲಿ ಸಂದೇಶ ಕಳುಹಿಸಿ' : 'Real-time group chat and sticker reactions'}
              </Text>
            </View>
            <PrimaryButton
              title={isKn ? 'ಚಾಟ್ ತೆರೆಯಿರಿ →' : 'Open Chat →'}
              onPress={() => {
                if (adda.conversationId) {
                  router.push(`/chat/${adda.conversationId}`);
                }
              }}
            />
          </View>
        </GlassCard>

        {/* Leave Room Option */}
        <GlassCard style={{ padding: 18, borderColor: DS_TOKENS.colors.roseBorder, backgroundColor: DS_TOKENS.colors.roseLight }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: DS_TOKENS.colors.rose, fontSize: 15, fontWeight: '800' }}>
                {isKn ? 'ರೂಮ್‌ನಿಂದ ನಿರ್ಗಮಿಸಿ' : 'Leave this Room'}
              </Text>
              <Text style={{ color: DS_TOKENS.colors.textSecondary, fontSize: 12, fontWeight: '600', marginTop: 2 }}>
                {isKn ? 'ನೀವು ನಂತರ ಕೋಡ್ ಬಳಸಿ ಮತ್ತೆ ಸೇರಬಹುದು' : 'You can rejoin later using the invite code'}
              </Text>
            </View>
            <SecondaryButton
              title={isKn ? 'ನಿರ್ಗಮಿಸಿ' : 'Leave'}
              onPress={() => setShowLeaveConfirm(true)}
            />
          </View>
        </GlassCard>
      </View>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        visible={showLeaveConfirm}
        title={isKn ? 'ರೂಮ್‌ನಿಂದ ಹೊರಡಬೇಕೆ?' : `Leave "${adda.name}"?`}
        message={
          isKn
            ? 'ನೀವು ಈ ಕೊಠಡಿಯಿಂದ ನಿರ್ಗಮಿಸಲು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ?'
            : 'Are you sure you want to leave this room? You can always rejoin using the invite code.'
        }
        confirmText={isKn ? 'ನಿರ್ಗಮಿಸಿ' : 'Leave Room'}
        cancelText={isKn ? 'ರದ್ದು' : 'Cancel'}
        destructive
        onConfirm={handleConfirmLeave}
        onCancel={() => setShowLeaveConfirm(false)}
      />
    </MainLayout>
  );
}
