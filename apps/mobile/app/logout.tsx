import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../src/stores/authStore';
import { MainLayout, GlassCard, PageHeader, DS_FONTS } from '../src/components/DesignSystem';

export default function LogoutScreen() {
  const { i18n } = useTranslation();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [loggingOut, setLoggingOut] = useState(false);
  const isKn = i18n.language === 'kn';

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
      router.replace('/(auth)/login');
    } catch (e) {
      console.error(e);
    } finally {
      setLoggingOut(false);
    }
  };

  const displayName = user?.displayName || user?.username || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <MainLayout>
      <PageHeader
        title={isKn ? 'ಖಾತೆಯಿಂದ ಲಾಗ್ ಔಟ್' : 'Sign Out of AADDA'}
        subtitle={isKn ? 'ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಸೆಶನ್ ಮುಗಿಸಿ' : 'Safely end your session across this device'}
        showBack
        onBack={() => router.back()}
      />

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
        <GlassCard
          elevated
          style={{
            width: '100%',
            maxWidth: 420,
            padding: 28,
            alignItems: 'center',
            backgroundColor: '#FFFFFF',
            borderColor: '#FECDD3',
            borderRadius: 24,
            shadowColor: '#E11D48',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.12,
            shadowRadius: 20,
            elevation: 8,
          }}
        >
          {/* Badge Icon */}
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: '#FFE4E6',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
              borderWidth: 2,
              borderColor: '#FDA4AF',
            }}
          >
            <Text style={{ fontSize: 36 }}>🚪</Text>
          </View>

          <Text style={{ fontFamily: DS_FONTS.heading, fontSize: 20, fontWeight: '900', color: '#0F172A', textAlign: 'center', marginBottom: 6 }}>
            {isKn ? 'ಖಾತೆಯಿಂದ ಲಾಗ್ ಔಟ್ ಮಾಡಬೇಕೆ?' : 'Sign out of your account?'}
          </Text>

          {user && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                backgroundColor: '#F8FAFC',
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 9999,
                marginVertical: 12,
                borderWidth: 1,
                borderColor: '#E2E8F0',
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: '#4F46E5',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {user.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <Text style={{ fontFamily: DS_FONTS.heading, color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>{initial}</Text>
                )}
              </View>
              <Text style={{ fontFamily: DS_FONTS.mono, fontSize: 13, fontWeight: '700', color: '#334155' }}>
                {displayName} (@{user.username})
              </Text>
            </View>
          )}

          <Text
            style={{
              fontFamily: DS_FONTS.body,
              fontSize: 13,
              fontWeight: '500',
              color: '#64748B',
              textAlign: 'center',
              lineHeight: 19,
              marginBottom: 26,
            }}
          >
            {isKn
              ? 'ನಿಮ್ಮ ಖಾತೆಯಿಂದ ಲಾಗ್ ಔಟ್ ಆದ ನಂತರ, ನಿಮ್ಮ ಇಮೇಲ್ ಅಥವಾ ಯೂಸರ್‌ನೇಮ್ ಬಳಸಿ ಯಾವುದೇ ಸಮಯದಲ್ಲಿ ಮತ್ತೆ ಲಾಗಿನ್ ಆಗಬಹುದು.'
              : 'You are about to sign out of AADDA. You can log right back in anytime using your credentials.'}
          </Text>

          <View style={{ width: '100%', gap: 12 }}>
            <TouchableOpacity
              onPress={handleLogout}
              disabled={loggingOut}
              activeOpacity={0.85}
              style={{
                width: '100%',
                backgroundColor: '#E11D48',
                paddingVertical: 14,
                borderRadius: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                shadowColor: '#E11D48',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              {loggingOut ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={{ fontSize: 18, color: '#FFFFFF' }}>🚪</Text>
                  <Text style={{ fontFamily: DS_FONTS.body, color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>
                    {isKn ? 'ಹೌದು, ಲಾಗ್ ಔಟ್ ಮಾಡಿ' : 'Yes, Sign Out of Account'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              disabled={loggingOut}
              activeOpacity={0.8}
              style={{
                width: '100%',
                backgroundColor: '#F1F5F9',
                paddingVertical: 13,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: DS_FONTS.body, color: '#475569', fontSize: 14, fontWeight: '700' }}>
                {isKn ? 'ರದ್ದು (ಖಾತೆಯಲ್ಲಿಯೇ ಇರಿ)' : 'Cancel (Stay Signed In)'}
              </Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      </View>
    </MainLayout>
  );
}

