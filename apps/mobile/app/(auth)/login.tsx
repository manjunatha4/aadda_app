import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/stores/authStore';
import { api } from '../../src/services/api';
import { clientStore } from '../../src/services/clientStore';
import {
  GlassCard,
  PrimaryButton,
  SecondaryButton,
  InputField,
  ToastNotification,
  DS_TOKENS,
} from '../../src/components/DesignSystem';

const KARNATAKA_DISTRICTS = [
  'Bengaluru',
  'Mysuru',
  'Hubballi-Dharwad',
  'Mangaluru',
  'Belagavi',
  'Davanagere',
  'Ballari',
  'Kalaburagi',
  'Shivamogga',
  'Tumakuru',
  'Udupi',
  'Hassan',
];

export default function AuthScreen() {
  const { i18n } = useTranslation();
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  // Step state: 1 = Email, 2 = Name, 3 = District
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [district, setDistrict] = useState('Bengaluru');
  const [customDistrict, setCustomDistrict] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'kn' ? 'en' : 'kn';
    i18n.changeLanguage(nextLang);
  };

  const isKn = i18n.language === 'kn';

  // Email format validator
  const isValidEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  // Direct instant login for returning users
  const handleDirectLogin = async (targetEmail?: string) => {
    const rawEmail = (targetEmail || email).trim();
    if (!rawEmail) {
      setErrorMessage(
        isKn ? 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ' : 'Please enter your email address',
      );
      return;
    }
    try {
      setLoading(true);
      setErrorMessage(null);
      const loginRes = await api.post('/auth/login', {
        login: rawEmail,
      });
      await setAuth(loginRes.user, loginRes.tokens.accessToken, loginRes.tokens.refreshToken);
      router.replace('/(tabs)');
    } catch (err: any) {
      try {
        const local = await clientStore.login(rawEmail);
        await setAuth(local.user, local.tokens.accessToken, local.tokens.refreshToken);
        router.replace('/(tabs)');
      } catch (localErr: any) {
        setErrorMessage(
          isKn ? 'ಲಾಗಿನ್ ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮರುಪ್ರಯತ್ನಿಸಿ.' : 'Login failed. Please try again.',
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Continue to Name or Login directly if already registered
  const handleStep1Continue = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage(
        isKn ? 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ' : 'Please enter your email address',
      );
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setErrorMessage(
        isKn ? 'ದಯವಿಟ್ಟು ಮಾನ್ಯ ಇಮೇಲ್ ನಮೂದಿಸಿ (ಉದಾ: name@example.com)' : 'Please enter a valid email format (e.g. name@example.com)',
      );
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      // Check local store first for returning user
      const localExisting = await clientStore.findUserByLogin(cleanEmail);
      if (localExisting) {
        const loginRes = await clientStore.login(cleanEmail);
        await setAuth(loginRes.user, loginRes.tokens.accessToken, loginRes.tokens.refreshToken);
        router.replace('/(tabs)');
        return;
      }

      // Check cloud API for returning user
      try {
        const cloudRes = await api.post('/auth/login', { login: cleanEmail });
        if (cloudRes && cloudRes.user && cloudRes.tokens) {
          await setAuth(cloudRes.user, cloudRes.tokens.accessToken, cloudRes.tokens.refreshToken);
          router.replace('/(tabs)');
          return;
        }
      } catch {
        // Not yet registered on backend -> proceed to onboarding steps
      }
    } catch {
      // Continue to onboarding if check fails
    } finally {
      setLoading(false);
    }

    setErrorMessage(null);
    if (!username.trim()) {
      const derived = cleanEmail.split('@')[0];
      setUsername(derived);
      if (!displayName.trim()) {
        setDisplayName(derived.charAt(0).toUpperCase() + derived.slice(1));
      }
    }
    setStep(2);
  };

  // Step 2: Continue to District
  const handleStep2Continue = () => {
    const cleanName = displayName.trim();
    if (!cleanName) {
      setErrorMessage(
        isKn ? 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಹೆಸರನ್ನು ನಮೂದಿಸಿ' : 'Please enter your name',
      );
      return;
    }
    if (cleanName.length < 2) {
      setErrorMessage(
        isKn ? 'ಹೆಸರು ಕನಿಷ್ಠ 2 ಅಕ್ಷರಗಳಾಗಿರಬೇಕು' : 'Name must be at least 2 characters long',
      );
      return;
    }

    setErrorMessage(null);
    setStep(3);
  };

  // Step 3: Complete Registration & Save
  const handleCompleteRegistration = async () => {
    const selectedDistrict = customDistrict.trim() || district;
    if (!selectedDistrict) {
      setErrorMessage(
        isKn ? 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಜಿಲ್ಲೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ' : 'Please select your district',
      );
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      const cleanEmail = email.trim().toLowerCase();
      const cleanUsername = username.trim() || cleanEmail.split('@')[0];
      const cleanDisplayName = displayName.trim() || cleanUsername;

      // Register or Login via shared API
      const res = await api.post('/auth/register', {
        email: cleanEmail,
        username: cleanUsername,
        displayName: cleanDisplayName,
        district: selectedDistrict,
        language: i18n.language === 'kn' ? 'kn' : 'en',
      });

      await setAuth(res.user, res.tokens.accessToken, res.tokens.refreshToken);
      router.replace('/(tabs)');
    } catch (err: any) {
      try {
        const loginRes = await clientStore.login(cleanEmail);
        await setAuth(loginRes.user, loginRes.tokens.accessToken, loginRes.tokens.refreshToken);
        router.replace('/(tabs)');
      } catch (loginErr: any) {
        setErrorMessage(isKn ? 'ದೋಷ ಸಂಭವಿಸಿದೆ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.' : 'An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: DS_TOKENS.colors.bg }}>
      {/* Background ambient light */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -100,
          alignSelf: 'center',
          width: 500,
          height: 500,
          borderRadius: 250,
          backgroundColor: 'rgba(124, 58, 237, 0.1)',
          ...(Platform.OS === 'web' ? ({ filter: 'blur(120px)' } as any) : {}),
        }}
      />

      <ToastNotification
        visible={Boolean(toastMessage)}
        message={toastMessage || ''}
        onDismiss={() => setToastMessage(null)}
      />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingVertical: 36,
          justifyContent: 'space-between',
          maxWidth: 480,
          width: '100%',
          alignSelf: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Bar */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                backgroundColor: '#7C3AED',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 16 }}>⚡</Text>
            </View>
            <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 18, letterSpacing: 1.2 }}>
              AADDA
            </Text>
          </View>

          <TouchableOpacity
            onPress={toggleLanguage}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderWidth: 1,
              borderColor: DS_TOKENS.colors.borderSubtle,
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: DS_TOKENS.radii.pill,
            }}
          >
            <Text style={{ color: '#E2E8F0', fontWeight: '800', fontSize: 12 }}>
              {isKn ? 'English' : 'ಕನ್ನಡ'} 🌐
            </Text>
          </TouchableOpacity>
        </View>

        {/* Hero Title */}
        <View style={{ marginVertical: 24, alignItems: 'center' }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: 'rgba(124, 58, 237, 0.2)',
              borderWidth: 1.5,
              borderColor: '#7C3AED',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 34 }}>
              {step === 1 ? '⚡' : step === 2 ? '👑' : '📍'}
            </Text>
          </View>

          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 28,
              fontWeight: '900',
              textAlign: 'center',
              letterSpacing: -0.5,
              lineHeight: 34,
            }}
          >
            {step === 1 && (isKn ? 'ಎಲ್ಲಾ ಮಜಾ ಒಂದೇ ಜಾಗದಲ್ಲಿ' : 'Welcome to AADDA')}
            {step === 2 && (isKn ? 'ನಿಮ್ಮ ಹೆಸರೇನು?' : 'What should we call you?')}
            {step === 3 && (isKn ? 'ನಿಮ್ಮ ಊರು ಯಾವುದು?' : 'Select your district')}
          </Text>
          <Text
            style={{
              color: '#94A3B8',
              fontSize: 13,
              fontWeight: '600',
              textAlign: 'center',
              marginTop: 6,
            }}
          >
            {step === 1 && (isKn ? 'ಮುಂದುವರಿಯಲು ನಿಮ್ಮ ಇಮೇಲ್ ನಮೂದಿಸಿ' : 'Enter your email to sign in or get started')}
            {step === 2 && (isKn ? 'ಸ್ನೇಹಿತರೊಂದಿಗೆ ಸಂಭಾಷಣೆಗೆ ನಿಮ್ಮ ಹೆಸರು' : 'Your name will appear across room channels')}
            {step === 3 && (isKn ? 'ಸ್ಥಳೀಯ ವೈಬ್ ಸರ್ಕಲ್ ಆಯ್ಕೆಮಾಡಿ' : 'Connect with nearby friends and local rooms')}
          </Text>
        </View>

        {/* STEP FORM CONTAINER */}
        <GlassCard elevated style={{ padding: 22 }}>
          {/* STEP 1: EMAIL */}
          {step === 1 && (
            <View>
              <InputField
                label={isKn ? 'ಇಮೇಲ್ ವಿಳಾಸ *' : 'Email Address *'}
                value={email}
                onChangeText={(txt) => {
                  setEmail(txt);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="you@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                icon="✉️"
                errorMessage={errorMessage}
              />

              <PrimaryButton
                title={isKn ? 'ಮುಂದುವರಿಯಿರಿ →' : 'Continue →'}
                onPress={handleStep1Continue}
                loading={loading}
                style={{ marginTop: 6 }}
              />

              {/* Direct Login for returning users */}
              <TouchableOpacity
                onPress={() => handleDirectLogin()}
                disabled={loading}
                activeOpacity={0.8}
                style={{
                  marginTop: 12,
                  paddingVertical: 11,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(124, 58, 237, 0.12)',
                  borderRadius: DS_TOKENS.radii.md,
                  borderWidth: 1,
                  borderColor: 'rgba(124, 58, 237, 0.3)',
                }}
              >
                <Text style={{ color: '#C4B5FD', fontSize: 13, fontWeight: '800' }}>
                  ⚡ {isKn ? 'ಈಗಾಗಲೇ ಖಾತೆ ಇದೆಯೇ? ನೇರವಾಗಿ ಲಾಗಿನ್ ಆಗಿ' : 'Already registered? Login directly'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: NAME */}
          {step === 2 && (
            <View>
              <InputField
                label={isKn ? 'ಪೂರ್ಣ ಹೆಸರು (Display Name) *' : 'Full Name *'}
                value={displayName}
                onChangeText={(txt) => {
                  setDisplayName(txt);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="e.g. Manjunatha R"
                icon="👤"
                errorMessage={errorMessage}
              />

              <InputField
                label={isKn ? 'ಯೂಸರ್‌ನೇಮ್ (Username)' : 'Username'}
                value={username}
                onChangeText={setUsername}
                placeholder="e.g. manju46"
                autoCapitalize="none"
                icon="@"
              />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                <SecondaryButton
                  title={isKn ? '‹ ಹಿಂದೆ' : '‹ Back'}
                  onPress={() => setStep(1)}
                  style={{ flex: 1 }}
                />
                <PrimaryButton
                  title={isKn ? 'ಮುಂದುವರಿಯಿರಿ →' : 'Continue →'}
                  onPress={handleStep2Continue}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}

          {/* STEP 3: DISTRICT */}
          {step === 3 && (
            <View>
              <Text style={{ color: '#CBD5E1', fontSize: 13, fontWeight: '800', marginBottom: 10 }}>
                {isKn ? 'ಕರ್ನಾಟಕದ ಜಿಲ್ಲೆ ಆಯ್ಕೆಮಾಡಿ *' : 'Select District in Karnataka *'}
              </Text>

              {/* District Chips */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                {KARNATAKA_DISTRICTS.map((d) => {
                  const isSelected = district === d && !customDistrict;
                  return (
                    <TouchableOpacity
                      key={d}
                      onPress={() => {
                        setDistrict(d);
                        setCustomDistrict('');
                      }}
                      style={{
                        backgroundColor: isSelected ? '#7C3AED' : 'rgba(255, 255, 255, 0.08)',
                        borderRadius: DS_TOKENS.radii.pill,
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        borderWidth: 1.2,
                        borderColor: isSelected ? '#7C3AED' : DS_TOKENS.colors.borderSubtle,
                      }}
                    >
                      <Text
                        style={{
                          color: isSelected ? '#FFFFFF' : '#94A3B8',
                          fontWeight: '800',
                          fontSize: 12,
                        }}
                      >
                        {d}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Custom District Input */}
              <InputField
                value={customDistrict}
                onChangeText={(txt) => {
                  setCustomDistrict(txt);
                  if (txt) setDistrict(txt);
                }}
                placeholder={isKn ? 'ಅಥವಾ ಬೇರೆ ಜಿಲ್ಲೆ ಟೈಪ್ ಮಾಡಿ...' : 'Or type another city/district...'}
                icon="📍"
                errorMessage={errorMessage}
              />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                <SecondaryButton
                  title={isKn ? '‹ ಹಿಂದೆ' : '‹ Back'}
                  onPress={() => setStep(2)}
                  style={{ flex: 1 }}
                />
                <PrimaryButton
                  title={isKn ? 'ಪ್ರಾರಂಭಿಸಿ 🎉' : 'Get Started 🎉'}
                  onPress={handleCompleteRegistration}
                  loading={loading}
                  variant="emerald"
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}
        </GlassCard>

        {/* 3-DOT PAGINATION SLIDER */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 }}>
          {/* Dot 1 */}
          <TouchableOpacity
            onPress={() => setStep(1)}
            style={{
              width: step === 1 ? 28 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: step === 1 ? '#FFFFFF' : step > 1 ? '#7C3AED' : 'rgba(255,255,255,0.25)',
              marginRight: 8,
            }}
          />

          {/* Dot 2 */}
          <TouchableOpacity
            onPress={() => {
              if (email.trim() && isValidEmail(email.trim())) setStep(2);
            }}
            style={{
              width: step === 2 ? 28 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: step === 2 ? '#FFFFFF' : step > 2 ? '#7C3AED' : 'rgba(255,255,255,0.25)',
              marginRight: 8,
            }}
          />

          {/* Dot 3 */}
          <TouchableOpacity
            onPress={() => {
              if (email.trim() && displayName.trim()) setStep(3);
            }}
            style={{
              width: step === 3 ? 28 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: step === 3 ? '#FFFFFF' : 'rgba(255,255,255,0.25)',
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
}
