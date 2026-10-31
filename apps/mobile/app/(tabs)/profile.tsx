import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/stores/authStore';
import { Floating, Pulse } from '../../src/components/AnimatedVisuals';

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user, logout, updateLanguage } = useAuthStore();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleToggleLang = async () => {
    const next = i18n.language === 'kn' ? 'en' : 'kn';
    await updateLanguage(next);
  };

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

  const isKn = i18n.language === 'kn';

  return (
    <LinearGradient colors={['#1F0E33', '#150924', '#0D0517']} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, maxWidth: 520, width: '100%', alignSelf: 'center' }}>
        {/* Profile Header Card */}
        <LinearGradient
          colors={['#351A57', '#200D36']}
          style={{
            borderRadius: 24,
            padding: 24,
            alignItems: 'center',
            marginBottom: 20,
            borderWidth: 1.5,
            borderColor: 'rgba(217, 255, 103, 0.4)',
            shadowColor: '#D9FF67',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
          }}
        >
          <Pulse>
            <LinearGradient
              colors={['#E5FF8F', '#D9FF67', '#AEEB2A']}
              style={{
                width: 84,
                height: 84,
                borderRadius: 42,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 14,
                shadowColor: '#D9FF67',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5,
                shadowRadius: 14,
              }}
            >
              <Text style={{ fontSize: 40 }}>⚡</Text>
            </LinearGradient>
          </Pulse>

          <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '900', letterSpacing: -0.3 }}>
            {user?.displayName || 'Adda Member'}
          </Text>
          <Text style={{ color: '#D9FF67', fontSize: 14, fontWeight: '700', marginTop: 3 }}>
            @{user?.username || 'member'}
          </Text>

          {user?.district && (
            <View
              style={{
                backgroundColor: 'rgba(255, 120, 107, 0.15)',
                paddingHorizontal: 14,
                paddingVertical: 5,
                borderRadius: 14,
                marginTop: 12,
                borderWidth: 1.5,
                borderColor: '#FF786B',
              }}
            >
              <Text style={{ color: '#FF786B', fontSize: 12, fontWeight: '800' }}>
                📍 {user.district}
              </Text>
            </View>
          )}

          {user?.bio && (
            <Text style={{ color: '#E8DFF5', opacity: 0.85, fontSize: 13, textAlign: 'center', marginTop: 12, lineHeight: 18 }}>
              {user.bio}
            </Text>
          )}
        </LinearGradient>

        {/* Settings / Actions */}
        <LinearGradient
          colors={['#2B1445', '#1B0B2E']}
          style={{
            borderRadius: 20,
            padding: 16,
            marginBottom: 24,
            borderWidth: 1.5,
            borderColor: '#422068',
          }}
        >
          {/* Language Switcher */}
          <TouchableOpacity
            onPress={handleToggleLang}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: '#3B1B5C',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>
              🌐 {t('profile.language')}
            </Text>
            <View
              style={{
                backgroundColor: '#D9FF67',
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: '#180B2E', fontWeight: '900', fontSize: 12 }}>
                {isKn ? 'ಕನ್ನಡ (KN)' : 'English (EN)'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Vibe check trigger */}
          <TouchableOpacity
            onPress={() => router.push('/modal/vibe')}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 14,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>
              ⚡ {t('vibe.title')}
            </Text>
            <Text style={{ color: '#FF786B', fontWeight: '800', fontSize: 13 }}>
              {isKn ? 'ಬದಲಿಸಿ' : 'Change'} &gt;
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Log out Button */}
        <TouchableOpacity
          onPress={handleLogout}
          disabled={loggingOut}
          activeOpacity={0.85}
          style={{
            borderRadius: 16,
            overflow: 'hidden',
            marginTop: 'auto',
            borderWidth: 1.5,
            borderColor: '#FF5C4D',
          }}
        >
          <View
            style={{
              backgroundColor: 'rgba(255, 92, 77, 0.15)',
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#FF5C4D', fontWeight: '900', fontSize: 15 }}>
              {loggingOut ? 'Logging out...' : `${t('profile.logout')} 🚪`}
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}
