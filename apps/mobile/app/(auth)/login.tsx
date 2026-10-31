import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/stores/authStore';
import { api } from '../../src/services/api';
import { Floating, Pulse } from '../../src/components/AnimatedVisuals';

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
  const { t, i18n } = useTranslation();
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

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'kn' ? 'en' : 'kn';
    i18n.changeLanguage(nextLang);
  };

  const isKn = i18n.language === 'kn';

  // Email format validator
  const isValidEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  // Step 1: Continue to Name
  const handleStep1Continue = () => {
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

    setErrorMessage(null);
    // Auto-prefill username from email prefix if empty
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
      // If user exists, login directly
      try {
        const loginRes = await api.post('/auth/login', {
          login: email.trim(),
        });
        await setAuth(loginRes.user, loginRes.tokens.accessToken, loginRes.tokens.refreshToken);
        router.replace('/(tabs)');
      } catch (loginErr: any) {
        setErrorMessage(err.message || 'Registration failed. Please check your network.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#7047EB' }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: 36,
          paddingBottom: 24,
          justifyContent: 'space-between',
          maxWidth: 460,
          width: '100%',
          alignSelf: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Bar */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 20, letterSpacing: 1.2 }}>
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

        {/* Hero Title & Visuals */}
        <View style={{ marginVertical: 20 }}>
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 38,
              fontWeight: '900',
              lineHeight: 44,
              letterSpacing: -0.5,
              marginBottom: 16,
            }}
          >
            {step === 1 && (isKn ? 'ಎಲ್ಲಾ ಮಜಾ ಒಂದೇ ಜಾಗದಲ್ಲಿ' : 'One place for\neverything\nfun')}
            {step === 2 && (isKn ? 'ನಿಮ್ಮ ಹೆಸರೇನು?' : 'What should we\ncall you?')}
            {step === 3 && (isKn ? 'ನಿಮ್ಮ ಊರು ಯಾವುದು?' : 'Where are you\nchilling from?')}
          </Text>

          {/* Floating Sticker Visuals */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: 140, position: 'relative' }}>
            <Floating distance={10} duration={2600} style={{ position: 'absolute', left: 24, top: 12 }}>
              <Text style={{ fontSize: 38 }}>🍦</Text>
            </Floating>
            <Floating distance={8} duration={2200} delay={400} style={{ position: 'absolute', right: 30, top: 8 }}>
              <Text style={{ fontSize: 36 }}>💡</Text>
            </Floating>
            <Floating distance={12} duration={2800} delay={800} style={{ position: 'absolute', left: 36, bottom: 10 }}>
              <Text style={{ fontSize: 38 }}>👅</Text>
            </Floating>
            <Floating distance={10} duration={2400} delay={600} style={{ position: 'absolute', right: 34, bottom: 6 }}>
              <Text style={{ fontSize: 40 }}>🍓</Text>
            </Floating>

            <Pulse>
              <View
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: 'rgba(255,255,255,0.45)',
                }}
              >
                <Text style={{ fontSize: 48 }}>
                  {step === 1 ? '🎧' : step === 2 ? '👑' : '📍'}
                </Text>
              </View>
            </Pulse>
          </View>
        </View>

        {/* STEP FORM CONTAINER */}
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
          {/* STEP 1: EMAIL */}
          {step === 1 && (
            <View>
              <Text style={{ color: '#18171C', fontSize: 18, fontWeight: '900', marginBottom: 4 }}>
                {isKn ? 'ನಿಮ್ಮ ಇಮೇಲ್ ನಮೂದಿಸಿ' : 'Step 1: Your Email'}
              </Text>
              <Text style={{ color: '#78716C', fontSize: 13, fontWeight: '600', marginBottom: 16 }}>
                {isKn ? 'ಪ್ರಾರಂಭಿಸಲು ನಿಮ್ಮ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ' : 'Enter your email address to get started'}
              </Text>

              <TextInput
                value={email}
                onChangeText={(txt) => {
                  setEmail(txt);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="you@email.com"
                placeholderTextColor="#A8A29E"
                autoCapitalize="none"
                keyboardType="email-address"
                autoFocus
                style={{
                  backgroundColor: '#F5F2EB',
                  borderRadius: 20,
                  paddingHorizontal: 18,
                  paddingVertical: 14,
                  color: '#18171C',
                  fontSize: 16,
                  fontWeight: '700',
                  marginBottom: 14,
                  borderWidth: 1.5,
                  borderColor: errorMessage ? '#EF4444' : '#E8E5DD',
                }}
              />

              {errorMessage && (
                <Text style={{ color: '#EF4444', fontSize: 13, fontWeight: '700', marginBottom: 12 }}>
                  ⚠️ {errorMessage}
                </Text>
              )}

              <TouchableOpacity
                onPress={handleStep1Continue}
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
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '900', letterSpacing: 0.3 }}>
                  {isKn ? 'ಮುಂದುವರಿಯಿರಿ →' : 'Continue →'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: NAME */}
          {step === 2 && (
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: '#18171C', fontSize: 18, fontWeight: '900' }}>
                  {isKn ? 'ನಿಮ್ಮ ಹೆಸರು & ಯೂಸರ್‌ನೇಮ್' : 'Step 2: Your Name'}
                </Text>
                <TouchableOpacity onPress={() => setStep(1)} style={{ padding: 4 }}>
                  <Text style={{ color: '#7047EB', fontWeight: '800', fontSize: 13 }}>‹ Back</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ color: '#78716C', fontSize: 13, fontWeight: '600', marginBottom: 16 }}>
                {isKn ? 'ಚಾಟ್‌ಗಳಲ್ಲಿ ನಿಮ್ಮ ಸ್ನೇಹಿತರಿಗೆ ಈ ಹೆಸರು ಕಾಣಿಸುತ್ತದೆ' : 'This name will appear on your message cards'}
              </Text>

              <Text style={{ color: '#18171C', fontSize: 13, fontWeight: '800', marginBottom: 6 }}>
                {isKn ? 'ಪೂರ್ಣ ಹೆಸರು (Display Name) *' : 'Display Name *'}
              </Text>
              <TextInput
                value={displayName}
                onChangeText={(txt) => {
                  setDisplayName(txt);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="e.g. Manjunatha R"
                placeholderTextColor="#A8A29E"
                autoFocus
                style={{
                  backgroundColor: '#F5F2EB',
                  borderRadius: 18,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  color: '#18171C',
                  fontSize: 15,
                  fontWeight: '700',
                  marginBottom: 12,
                  borderWidth: 1.5,
                  borderColor: '#E8E5DD',
                }}
              />

              <Text style={{ color: '#18171C', fontSize: 13, fontWeight: '800', marginBottom: 6 }}>
                {isKn ? 'ಯೂಸರ್‌ನೇಮ್ (Username)' : 'Username'}
              </Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="e.g. manju46"
                placeholderTextColor="#A8A29E"
                autoCapitalize="none"
                style={{
                  backgroundColor: '#F5F2EB',
                  borderRadius: 18,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  color: '#18171C',
                  fontSize: 15,
                  fontWeight: '700',
                  marginBottom: 14,
                  borderWidth: 1.5,
                  borderColor: '#E8E5DD',
                }}
              />

              {errorMessage && (
                <Text style={{ color: '#EF4444', fontSize: 13, fontWeight: '700', marginBottom: 12 }}>
                  ⚠️ {errorMessage}
                </Text>
              )}

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={() => setStep(1)}
                  style={{
                    backgroundColor: '#F5F2EB',
                    borderRadius: 20,
                    paddingVertical: 15,
                    paddingHorizontal: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#78716C', fontSize: 15, fontWeight: '800' }}>‹ Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleStep2Continue}
                  activeOpacity={0.88}
                  style={{
                    flex: 1,
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
                  <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '900', letterSpacing: 0.3 }}>
                    {isKn ? 'ಮುಂದುವರಿಯಿರಿ →' : 'Continue →'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 3: DISTRICT */}
          {step === 3 && (
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: '#18171C', fontSize: 18, fontWeight: '900' }}>
                  {isKn ? 'ನಿಮ್ಮ ಜಿಲ್ಲೆ / ಊರು' : 'Step 3: Select District'}
                </Text>
                <TouchableOpacity onPress={() => setStep(2)} style={{ padding: 4 }}>
                  <Text style={{ color: '#7047EB', fontWeight: '800', fontSize: 13 }}>‹ Back</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ color: '#78716C', fontSize: 13, fontWeight: '600', marginBottom: 14 }}>
                {isKn ? 'ನಿಮ್ಮ ಸ್ಥಳೀಯ ಹ್ಯಾಂಗ್‌ಔಟ್ ಸರ್ಕಲ್ ಆಯ್ಕೆಮಾಡಿ' : 'Connect with nearby friends & local vibe circles'}
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
                        backgroundColor: isSelected ? '#7047EB' : '#F5F2EB',
                        borderRadius: 16,
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        borderWidth: 1.5,
                        borderColor: isSelected ? '#7047EB' : '#E8E5DD',
                      }}
                    >
                      <Text
                        style={{
                          color: isSelected ? '#FFFFFF' : '#18171C',
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
              <TextInput
                value={customDistrict}
                onChangeText={(txt) => {
                  setCustomDistrict(txt);
                  if (txt) setDistrict(txt);
                }}
                placeholder={isKn ? 'ಅಥವಾ ಬೇರೆ ಜಿಲ್ಲೆ ಟೈಪ್ ಮಾಡಿ...' : 'Or type another city/district...'}
                placeholderTextColor="#A8A29E"
                style={{
                  backgroundColor: '#F5F2EB',
                  borderRadius: 18,
                  paddingHorizontal: 16,
                  paddingVertical: 11,
                  color: '#18171C',
                  fontSize: 14,
                  fontWeight: '700',
                  marginBottom: 14,
                  borderWidth: 1.5,
                  borderColor: customDistrict ? '#7047EB' : '#E8E5DD',
                }}
              />

              {errorMessage && (
                <Text style={{ color: '#EF4444', fontSize: 13, fontWeight: '700', marginBottom: 12 }}>
                  ⚠️ {errorMessage}
                </Text>
              )}

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={() => setStep(2)}
                  style={{
                    backgroundColor: '#F5F2EB',
                    borderRadius: 20,
                    paddingVertical: 15,
                    paddingHorizontal: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#78716C', fontSize: 15, fontWeight: '800' }}>‹ Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleCompleteRegistration}
                  disabled={loading}
                  activeOpacity={0.88}
                  style={{
                    flex: 1,
                    backgroundColor: '#10B981',
                    borderRadius: 20,
                    paddingVertical: 15,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#10B981',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.35,
                    shadowRadius: 8,
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '900', letterSpacing: 0.3 }}>
                      {isKn ? 'ನೋಂದಣಿ ಪೂರ್ಣಗೊಳಿಸಿ 🎉' : 'Complete & Start 🎉'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* 3-DOT PAGINATION SLIDER WITH ACTIVE / COMPLETED / PENDING STATES */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 }}>
          {/* Dot 1 */}
          <TouchableOpacity
            onPress={() => setStep(1)}
            style={{
              width: step === 1 ? 26 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: step === 1 ? '#FFFFFF' : step > 1 ? '#A78BFA' : 'rgba(255,255,255,0.4)',
              marginRight: 8,
            }}
          />

          {/* Dot 2 */}
          <TouchableOpacity
            onPress={() => {
              if (email.trim() && isValidEmail(email.trim())) setStep(2);
            }}
            style={{
              width: step === 2 ? 26 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: step === 2 ? '#FFFFFF' : step > 2 ? '#A78BFA' : 'rgba(255,255,255,0.4)',
              marginRight: 8,
            }}
          />

          {/* Dot 3 */}
          <TouchableOpacity
            onPress={() => {
              if (email.trim() && displayName.trim()) setStep(3);
            }}
            style={{
              width: step === 3 ? 26 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: step === 3 ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
}
