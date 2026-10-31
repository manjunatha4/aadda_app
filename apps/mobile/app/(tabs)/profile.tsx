import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/stores/authStore';
import { Floating } from '../../src/components/AnimatedVisuals';

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
    <View style={{ flex: 1, backgroundColor: '#F5F2EB' }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: 20,
          paddingBottom: 110,
          maxWidth: 500,
          width: '100%',
          alignSelf: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 30,
            padding: 24,
            alignItems: 'center',
            marginBottom: 20,
            borderWidth: 1,
            borderColor: '#E8E5DD',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 10,
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: '#FF6464',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
              borderWidth: 3,
              borderColor: '#FFFFFF',
              shadowColor: '#FF6464',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
          >
            <Text style={{ fontSize: 34, color: '#FFFFFF', fontWeight: '900' }}>
              {(user?.displayName || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>

          <Text style={{ color: '#18171C', fontSize: 24, fontWeight: '900', letterSpacing: -0.3 }}>
            {user?.displayName || 'User'}
          </Text>
          <Text style={{ color: '#78716C', fontSize: 14, fontWeight: '700', marginTop: 2 }}>
            @{user?.username || 'member'}
          </Text>

          <View
            style={{
              backgroundColor: '#F5F2EB',
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 12,
              marginTop: 10,
            }}
          >
            <Text style={{ color: '#78716C', fontSize: 12, fontWeight: '800' }}>
              📍 {user?.district || 'Bengaluru'}
            </Text>
          </View>
        </View>

        {/* Settings / Actions */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 24,
            padding: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: '#E8E5DD',
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
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: '#F5F2EB',
            }}
          >
            <Text style={{ color: '#18171C', fontSize: 15, fontWeight: '800' }}>
              🌐 {isKn ? 'ಭಾಷೆ' : 'Language'}
            </Text>
            <View
              style={{
                backgroundColor: '#F5F2EB',
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: '#18171C', fontWeight: '800', fontSize: 12 }}>
                {isKn ? 'ಕನ್ನಡ (KN)' : 'English (EN)'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Vibe check modal */}
          <TouchableOpacity
            onPress={() => router.push('/modal/vibe')}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 12,
            }}
          >
            <Text style={{ color: '#18171C', fontSize: 15, fontWeight: '800' }}>
              ⚡ {isKn ? 'ವೈಬ್ ಅಪ್‌ಡೇಟ್' : 'Update Vibe'}
            </Text>
            <Text style={{ color: '#A8A29E', fontSize: 16, fontWeight: '800' }}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          disabled={loggingOut}
          activeOpacity={0.85}
          style={{
            backgroundColor: '#FEE2E2',
            borderRadius: 18,
            paddingVertical: 14,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#DC2626', fontWeight: '900', fontSize: 14 }}>
            {loggingOut ? '...' : (isKn ? 'ಲಾಗ್ ಔಟ್' : 'Log Out')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
