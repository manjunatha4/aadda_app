import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/stores/authStore';
import { api } from '../../src/services/api';
import { Floating, Pulse } from '../../src/components/AnimatedVisuals';

export default function AuthScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [district, setDistrict] = useState('');

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'kn' ? 'en' : 'kn';
    i18n.changeLanguage(nextLang);
  };

  const handleLogin = async () => {
    const l = loginInput.trim();
    if (!l) {
      setErrorMessage(
        i18n.language === 'kn'
          ? 'ದಯವಿಟ್ಟು ಯೂಸರ್ ನೇಮ್ ಅಥವಾ ಇಮೇಲ್ ನಮೂದಿಸಿ'
          : 'Please enter your username or email',
      );
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      // Direct login - if email exists, logs in directly without invalid email check!
      const res = await api.post('/auth/login', {
        login: l,
        password: password || 'defaultPass123',
      });

      await setAuth(res.user, res.tokens.accessToken, res.tokens.refreshToken);
      router.replace('/(tabs)');
    } catch (e: any) {
      try {
        const regRes = await api.post('/auth/register', {
          username: l.includes('@') ? l.split('@')[0] : l,
          displayName: l.includes('@') ? l.split('@')[0] : l,
          email: l.includes('@') ? l : `${l}@aadda.app`,
          password: password || 'defaultPass123',
          district: 'Bengaluru',
          language: i18n.language === 'kn' ? 'kn' : 'en',
        });
        await setAuth(regRes.user, regRes.tokens.accessToken, regRes.tokens.refreshToken);
        router.replace('/(tabs)');
      } catch {
        setErrorMessage(e.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    const em = email.trim() || loginInput.trim();
    if (!em) {
      setErrorMessage(
        i18n.language === 'kn'
          ? 'ದಯವಿಟ್ಟು ಇಮೇಲ್ ನಮೂದಿಸಿ'
          : 'Please enter email address',
      );
      return;
    }

    const u = username.trim() || (em.includes('@') ? em.split('@')[0] : em);
    const d = displayName.trim() || u;

    try {
      setLoading(true);
      setErrorMessage(null);

      const res = await api.post('/auth/register', {
        username: u,
        displayName: d,
        email: em,
        district: district.trim() || 'Bengaluru',
        password: password || 'defaultPass123',
        language: i18n.language === 'kn' ? 'kn' : 'en',
      });

      await setAuth(res.user, res.tokens.accessToken, res.tokens.refreshToken);
      router.replace('/(tabs)');
    } catch (e: any) {
      try {
        const loginRes = await api.post('/auth/login', {
          login: em,
          password: password || 'defaultPass123',
        });
        await setAuth(loginRes.user, loginRes.tokens.accessToken, loginRes.tokens.refreshToken);
        router.replace('/(tabs)');
      } catch {
        setErrorMessage(e.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const isKn = i18n.language === 'kn';

  return (
    <LinearGradient
      colors={['#1E0F33', '#120822', '#0A0414']}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: 24,
          justifyContent: 'center',
          maxWidth: 500,
          width: '100%',
          alignSelf: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Row with Language Switcher */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Floating distance={6} duration={2000}>
              <Text style={{ fontSize: 26 }}>⚡</Text>
            </Floating>
            <Text style={{ color: '#D9FF67', fontWeight: '900', fontSize: 20, marginLeft: 8, letterSpacing: 1.5 }}>
              AADDA
            </Text>
          </View>

          <TouchableOpacity
            onPress={toggleLanguage}
            style={{
              backgroundColor: 'rgba(217, 255, 103, 0.12)',
              borderWidth: 1.5,
              borderColor: '#D9FF67',
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 20,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#D9FF67', fontWeight: '800', fontSize: 12 }}>
              {isKn ? 'English' : 'ಕನ್ನಡ'} 🌐
            </Text>
          </TouchableOpacity>
        </View>

        {/* Hero Card with Floating Particles & Neon Glow */}
        <LinearGradient
          colors={['#381C5C', '#24123E', '#170928']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 28,
            padding: 24,
            marginBottom: 24,
            borderWidth: 1.5,
            borderColor: 'rgba(217, 255, 103, 0.35)',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
            shadowColor: '#D9FF67',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
          }}
        >
          {/* Background Ambient Glow Elements */}
          <Floating distance={10} duration={2800} style={{ position: 'absolute', top: 12, left: 16 }}>
            <Text style={{ fontSize: 20, opacity: 0.7 }}>✨</Text>
          </Floating>
          <Floating distance={12} duration={3200} delay={400} style={{ position: 'absolute', top: 18, right: 20 }}>
            <Text style={{ fontSize: 22, opacity: 0.7 }}>🔥</Text>
          </Floating>
          <Floating distance={8} duration={2600} delay={800} style={{ position: 'absolute', bottom: 12, left: 24 }}>
            <Text style={{ fontSize: 18, opacity: 0.6 }}>👑</Text>
          </Floating>
          <Floating distance={10} duration={3000} delay={600} style={{ position: 'absolute', bottom: 16, right: 24 }}>
            <Text style={{ fontSize: 20, opacity: 0.7 }}>🛖</Text>
          </Floating>

          {/* Central Pulsing Hero Icon */}
          <Pulse>
            <LinearGradient
              colors={['#E5FF8F', '#D9FF67', '#A3E635']}
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 14,
                shadowColor: '#D9FF67',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 16,
              }}
            >
              <Text style={{ fontSize: 36 }}>⚡</Text>
            </LinearGradient>
          </Pulse>

          <Text style={{ fontSize: 26, fontWeight: '900', color: '#FFFFFF', textAlign: 'center', letterSpacing: -0.3 }}>
            {isKn ? 'ನಿಮ್ಮ ಗ್ಯಾಂಗ್. ನಿಮ್ಮ ಚಾವಡಿ.' : 'Your people. Your chaos.'}
          </Text>
          <Text style={{ fontSize: 13, color: '#D9FF67', fontWeight: '700', marginTop: 6, textAlign: 'center' }}>
            {isKn ? 'ಪ್ರೈವೇಟ್ ಆಹ್ವಾನ-ಮಾತ್ರ ಹ್ಯಾಂಗ್‌ಔಟ್' : 'Invite-only Private Circle Hangout'}
          </Text>
        </LinearGradient>

        {/* Mode Switcher Tabs */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: '#160926',
            borderRadius: 16,
            padding: 4,
            marginBottom: 20,
            borderWidth: 1.5,
            borderColor: '#2F174B',
          }}
        >
          <TouchableOpacity
            onPress={() => {
              setMode('login');
              setErrorMessage(null);
            }}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: mode === 'login' ? '#D9FF67' : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontWeight: '900',
                fontSize: 14,
                color: mode === 'login' ? '#180B2E' : '#F4F0FF',
              }}
            >
              {isKn ? 'ಲಾಗಿನ್ (Login)' : 'Login'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setMode('register');
              setErrorMessage(null);
            }}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: mode === 'register' ? '#D9FF67' : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontWeight: '900',
                fontSize: 14,
                color: mode === 'register' ? '#180B2E' : '#F4F0FF',
              }}
            >
              {isKn ? 'ಖಾತೆ ರಚಿಸಿ (Sign Up)' : 'Sign Up'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Status Banner */}
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
            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13, textAlign: 'center' }}>
              ⚠️ {errorMessage}
            </Text>
          </View>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' ? (
          <View>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: '#F4F0FF', fontSize: 13, fontWeight: '700', marginBottom: 6 }}>
                {isKn ? 'ಇಮೇಲ್ ಅಥವಾ ಯೂಸರ್ ನೇಮ್' : 'Email or Username'}
              </Text>
              <TextInput
                value={loginInput}
                onChangeText={setLoginInput}
                placeholder={isKn ? 'ನಿಮ್ಮ ಇಮೇಲ್ ಅಥವಾ ಯೂಸರ್ ನೇಮ್' : 'Enter email or username'}
                placeholderTextColor="#7C6B94"
                autoCapitalize="none"
                style={{
                  backgroundColor: '#26143D',
                  borderWidth: 1.5,
                  borderColor: '#3D2061',
                  borderRadius: 14,
                  padding: 14,
                  color: '#FFFFFF',
                  fontSize: 15,
                }}
              />
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: '#F4F0FF', fontSize: 13, fontWeight: '700', marginBottom: 6 }}>
                {isKn ? 'ಪಾಸ್ವರ್ಡ್ (Password)' : 'Password (Optional)'}
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#7C6B94"
                secureTextEntry
                style={{
                  backgroundColor: '#26143D',
                  borderWidth: 1.5,
                  borderColor: '#3D2061',
                  borderRadius: 14,
                  padding: 14,
                  color: '#FFFFFF',
                  fontSize: 15,
                }}
              />
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
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
                {loading ? (
                  <ActivityIndicator color="#180B2E" />
                ) : (
                  <Text style={{ color: '#180B2E', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 }}>
                    {isKn ? 'ನೇರವಾಗಿ ಲಾಗಿನ್ ಆಗಿ' : 'Login Directly'} 🚀
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          /* REGISTER FORM */
          <View>
            <View style={{ marginBottom: 14 }}>
              <Text style={{ color: '#F4F0FF', fontSize: 13, fontWeight: '700', marginBottom: 4 }}>
                Email *
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                placeholderTextColor="#7C6B94"
                keyboardType="email-address"
                autoCapitalize="none"
                style={{
                  backgroundColor: '#26143D',
                  borderWidth: 1.5,
                  borderColor: '#3D2061',
                  borderRadius: 14,
                  padding: 12,
                  color: '#FFFFFF',
                  fontSize: 15,
                }}
              />
            </View>

            <View style={{ marginBottom: 14 }}>
              <Text style={{ color: '#F4F0FF', fontSize: 13, fontWeight: '700', marginBottom: 4 }}>
                {isKn ? 'ನಿಮ್ಮ ಹೆಸರು (Full Name)' : 'Display Name'}
              </Text>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder={isKn ? 'ಉದಾ: ರಾಹುಲ್ / ಕಾವ್ಯ' : 'e.g. Alex / Priya'}
                placeholderTextColor="#7C6B94"
                style={{
                  backgroundColor: '#26143D',
                  borderWidth: 1.5,
                  borderColor: '#3D2061',
                  borderRadius: 14,
                  padding: 12,
                  color: '#FFFFFF',
                  fontSize: 15,
                }}
              />
            </View>

            <View style={{ marginBottom: 14 }}>
              <Text style={{ color: '#F4F0FF', fontSize: 13, fontWeight: '700', marginBottom: 4 }}>
                {isKn ? 'ಯೂಸರ್ ನೇಮ್ (@handle)' : 'Username (@handle)'}
              </Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="e.g. alex_blr"
                placeholderTextColor="#7C6B94"
                autoCapitalize="none"
                style={{
                  backgroundColor: '#26143D',
                  borderWidth: 1.5,
                  borderColor: '#3D2061',
                  borderRadius: 14,
                  padding: 12,
                  color: '#FFFFFF',
                  fontSize: 15,
                }}
              />
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: '#F4F0FF', fontSize: 13, fontWeight: '700', marginBottom: 4 }}>
                {isKn ? 'ಪಾಸ್ವರ್ಡ್ (Password)' : 'Password'}
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#7C6B94"
                secureTextEntry
                style={{
                  backgroundColor: '#26143D',
                  borderWidth: 1.5,
                  borderColor: '#3D2061',
                  borderRadius: 14,
                  padding: 12,
                  color: '#FFFFFF',
                  fontSize: 15,
                }}
              />
            </View>

            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
              style={{
                borderRadius: 16,
                overflow: 'hidden',
                shadowColor: '#FF6E67',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 10,
              }}
            >
              <LinearGradient
                colors={['#FF8A82', '#FF6E67', '#E04840']}
                style={{
                  paddingVertical: 16,
                  alignItems: 'center',
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#180B2E" />
                ) : (
                  <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 }}>
                    {isKn ? 'ಖಾತೆ ರಚಿಸಿ / ಲಾಗಿನ್ ಆಗಿ' : 'Continue / Direct Login'} 🎉
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
