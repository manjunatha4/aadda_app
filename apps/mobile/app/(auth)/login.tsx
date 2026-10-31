import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/stores/authStore';
import { api } from '../../src/services/api';
import { Floating, Pulse } from '../../src/components/AnimatedVisuals';

export default function AuthScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loginInput, setLoginInput] = useState('');

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'kn' ? 'en' : 'kn';
    i18n.changeLanguage(nextLang);
  };

  const handleContinue = async () => {
    const l = loginInput.trim();
    if (!l) {
      setErrorMessage(
        i18n.language === 'kn'
          ? 'ದಯವಿಟ್ಟು ಇಮೇಲ್ ಅಥವಾ ಯೂಸರ್ ನೇಮ್ ನಮೂದಿಸಿ'
          : 'Please enter your email or username',
      );
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      // Attempt direct login first
      const res = await api.post('/auth/login', {
        login: l,
        password: 'defaultPass123',
      });

      await setAuth(res.user, res.tokens.accessToken, res.tokens.refreshToken);
      router.replace('/(tabs)');
    } catch (e: any) {
      // Auto-register real user seamlessly if they are new!
      try {
        const usernameClean = l.includes('@') ? l.split('@')[0] : l;
        const regRes = await api.post('/auth/register', {
          username: usernameClean,
          displayName: usernameClean,
          email: l.includes('@') ? l : `${usernameClean}@aadda.app`,
          password: 'defaultPass123',
          district: 'Bengaluru',
          language: i18n.language === 'kn' ? 'kn' : 'en',
        });
        await setAuth(regRes.user, regRes.tokens.accessToken, regRes.tokens.refreshToken);
        router.replace('/(tabs)');
      } catch (err: any) {
        setErrorMessage(err.message || 'Authentication error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isKn = i18n.language === 'kn';

  return (
    <View style={{ flex: 1, backgroundColor: '#7047EB' }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: 40,
          paddingBottom: 30,
          justifyContent: 'space-between',
          maxWidth: 460,
          width: '100%',
          alignSelf: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar with language switcher */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 18, letterSpacing: 1 }}>
              AADDA
            </Text>
          </View>

          <TouchableOpacity
            onPress={toggleLanguage}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 16,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>
              {isKn ? 'English' : 'ಕನ್ನಡ'} 🌐
            </Text>
          </TouchableOpacity>
        </View>

        {/* Hero Title & Visuals matching reference image 42db9945.jpg */}
        <View style={{ marginVertical: 30 }}>
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 42,
              fontWeight: '900',
              lineHeight: 48,
              letterSpacing: -0.5,
              marginBottom: 20,
            }}
          >
            {isKn ? 'ಎಲ್ಲಾ ಮಜಾ ಒಂದೇ ಜಾಗದಲ್ಲಿ' : 'One place for\neverything\nfun'}
          </Text>

          {/* Floating Playful Stickers */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: 180, position: 'relative' }}>
            <Floating distance={12} duration={2600} style={{ position: 'absolute', left: 20, top: 20 }}>
              <Text style={{ fontSize: 44 }}>🍦</Text>
            </Floating>

            <Floating distance={10} duration={2200} delay={400} style={{ position: 'absolute', right: 30, top: 10 }}>
              <Text style={{ fontSize: 42 }}>💡</Text>
            </Floating>

            <Floating distance={14} duration={2800} delay={800} style={{ position: 'absolute', left: 40, bottom: 20 }}>
              <Text style={{ fontSize: 44 }}>👅</Text>
            </Floating>

            <Floating distance={12} duration={2400} delay={600} style={{ position: 'absolute', right: 40, bottom: 10 }}>
              <Text style={{ fontSize: 48 }}>🍓</Text>
            </Floating>

            <Pulse>
              <View
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: 55,
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: 'rgba(255,255,255,0.4)',
                }}
              >
                <Text style={{ fontSize: 56 }}>🎧</Text>
              </View>
            </Pulse>
          </View>
        </View>

        {/* Form Container */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 30,
            padding: 22,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.15,
            shadowRadius: 14,
          }}
        >
          <Text style={{ color: '#18171C', fontSize: 18, fontWeight: '900', marginBottom: 4 }}>
            {isKn ? 'ನಿಮ್ಮ ಖಾತೆಗೆ ಲಾಗಿನ್ ಆಗಿ' : 'Jump right in'}
          </Text>
          <Text style={{ color: '#78716C', fontSize: 13, fontWeight: '600', marginBottom: 16 }}>
            {isKn ? 'ನಿಮ್ಮ ಇಮೇಲ್ ಅಥವಾ ಯೂಸರ್ ನೇಮ್ ನಮೂದಿಸಿ' : 'Enter your email to enter or create your account'}
          </Text>

          {/* Email / Username Input */}
          <TextInput
            value={loginInput}
            onChangeText={setLoginInput}
            placeholder="you@email.com"
            placeholderTextColor="#A8A29E"
            autoCapitalize="none"
            keyboardType="email-address"
            style={{
              backgroundColor: '#F5F2EB',
              borderRadius: 20,
              paddingHorizontal: 18,
              paddingVertical: 14,
              color: '#18171C',
              fontSize: 16,
              fontWeight: '700',
              marginBottom: 14,
              borderWidth: 1,
              borderColor: '#E8E5DD',
            }}
          />

          {errorMessage && (
            <Text style={{ color: '#EF4444', fontSize: 13, fontWeight: '700', marginBottom: 12, textAlign: 'center' }}>
              {errorMessage}
            </Text>
          )}

          {/* Continue Button */}
          <TouchableOpacity
            onPress={handleContinue}
            disabled={loading}
            activeOpacity={0.88}
            style={{
              backgroundColor: '#7047EB',
              borderRadius: 20,
              paddingVertical: 15,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#7047EB',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius: 8,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '900', letterSpacing: 0.3 }}>
                {isKn ? 'ಮುಂದುವರಿಯಿರಿ →' : 'Continue →'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 3-Dot Pagination Slider matching reference image 42db9945.jpg */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 }}>
          <View style={{ width: 20, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF', marginRight: 6 }} />
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)', marginRight: 6 }} />
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' }} />
        </View>
      </ScrollView>
    </View>
  );
}
