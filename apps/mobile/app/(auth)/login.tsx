import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
  TextInput,
} from 'react-native';
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

export const INDIAN_STATES_AND_DISTRICTS: Record<string, string[]> = {
  Karnataka: [
    'Bengaluru Urban',
    'Bengaluru Rural',
    'Mysuru',
    'Hubballi-Dharwad',
    'Mangaluru (Dakshina Kannada)',
    'Belagavi',
    'Davanagere',
    'Ballari',
    'Kalaburagi',
    'Shivamogga',
    'Tumakuru',
    'Udupi',
    'Hassan',
    'Mandya',
    'Chikkamagaluru',
    'Kodagu',
    'Vijayapura',
    'Bagalkote',
    'Bidar',
    'Raichur',
    'Koppal',
    'Gadag',
    'Haveri',
    'Uttara Kannada',
    'Ramanagara',
    'Chikkaballapura',
    'Kolar',
    'Chitradurga',
    'Yadgir',
    'Chamarajanagar',
    'Vijayanagara',
  ],
  Maharashtra: [
    'Mumbai City',
    'Mumbai Suburban',
    'Pune',
    'Nagpur',
    'Thane',
    'Nashik',
    'Chhatrapati Sambhajinagar',
    'Solapur',
    'Kolhapur',
    'Amravati',
    'Navi Mumbai',
    'Jalgaon',
    'Satara',
    'Ahmednagar',
  ],
  'Tamil Nadu': [
    'Chennai',
    'Coimbatore',
    'Madurai',
    'Tiruchirappalli',
    'Salem',
    'Tirunelveli',
    'Vellore',
    'Erode',
    'Kanchipuram',
    'Thanjavur',
  ],
  Delhi: [
    'New Delhi',
    'Central Delhi',
    'South Delhi',
    'North Delhi',
    'West Delhi',
    'East Delhi',
  ],
  Kerala: [
    'Thiruvananthapuram',
    'Kochi (Ernakulam)',
    'Kozhikode',
    'Thrissur',
    'Kollam',
    'Palakkad',
    'Malappuram',
    'Kannur',
    'Kottayam',
    'Alappuzha',
  ],
  Gujarat: [
    'Ahmedabad',
    'Surat',
    'Vadodara',
    'Rajkot',
    'Bhavnagar',
    'Jamnagar',
    'Gandhinagar',
  ],
  Telangana: [
    'Hyderabad',
    'Warangal',
    'Nizamabad',
    'Karimnagar',
    'Khammam',
    'Rangareddy',
  ],
  'Andhra Pradesh': [
    'Visakhapatnam',
    'Vijayawada',
    'Guntur',
    'Nellore',
    'Kurnool',
    'Tirupati',
    'Rajahmundry',
  ],
  'Uttar Pradesh': [
    'Lucknow',
    'Kanpur',
    'Varanasi',
    'Agra',
    'Noida (Gautam Buddha Nagar)',
    'Prayagraj',
    'Ghaziabad',
    'Meerut',
    'Bareilly',
    'Aligarh',
  ],
  'West Bengal': [
    'Kolkata',
    'Howrah',
    'North 24 Parganas',
    'South 24 Parganas',
    'Darjeeling',
    'Siliguri',
    'Hooghly',
  ],
  Rajasthan: [
    'Jaipur',
    'Jodhpur',
    'Udaipur',
    'Kota',
    'Bikaner',
    'Ajmer',
    'Alwar',
  ],
};

const INDIAN_STATES = Object.keys(INDIAN_STATES_AND_DISTRICTS);

export default function AuthScreen() {
  const { i18n } = useTranslation();
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  // Mode: Sign Up vs Sign In
  const [isSignUp, setIsSignUp] = useState(true);

  // Multi-step signup: 1 = Email, 2 = Username, 3 = State & District, 4 = Password, 5 = Verification
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Form Fields
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedState, setSelectedState] = useState('Karnataka');
  const [selectedDistrict, setSelectedDistrict] = useState('Bengaluru Urban');
  const [districtSearch, setDistrictSearch] = useState('');
  const [customDistrict, setCustomDistrict] = useState('');

  // Password fields
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Verification fields
  const [verificationCode, setVerificationCode] = useState('');
  const [serverVerificationCode, setServerVerificationCode] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Sign In fields
  const [loginInput, setLoginInput] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Status & Validation
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{
    checking: boolean;
    available?: boolean;
    message?: string;
  }>({ checking: false });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isKn = i18n.language === 'kn';

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'kn' ? 'en' : 'kn';
    i18n.changeLanguage(nextLang);
  };

  // Cooldown countdown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Email format validator
  const isValidEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  // -------------------------------------------------------------------
  // STEP 1: EMAIL VALIDATION & AVAILABILITY CHECK
  // -------------------------------------------------------------------
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
        isKn
          ? 'ದಯವಿಟ್ಟು ಮಾನ್ಯ ಇಮೇಲ್ ನಮೂದಿಸಿ (ಉದಾ: name@example.com)'
          : 'Please enter a valid email address (e.g. name@example.com)',
      );
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      // Check email availability on backend API
      const res = await api.post('/auth/check-email', { email: cleanEmail });
      if (res && res.available === false) {
        setErrorMessage(
          res.message || (isKn ? 'ಈ ಇಮೇಲ್ ಈಗಾಗಲೇ ನೋಂದಾಯಿತವಾಗಿದೆ.' : 'This email is already registered. Please sign in.'),
        );
        return;
      }

      // Pre-fill username from email if not already set
      if (!username.trim()) {
        const derived = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
        setUsername(derived);
        setDisplayName(derived.charAt(0).toUpperCase() + derived.slice(1));
      }

      setStep(2);
    } catch (e: any) {
      // Seamless fallback if network drops
      const localCheck = await clientStore.checkEmail(cleanEmail);
      if (!localCheck.available) {
        setErrorMessage(localCheck.message || 'Email already registered');
        return;
      }
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------
  // STEP 2: USERNAME VALIDATION & AVAILABILITY CHECK
  // -------------------------------------------------------------------
  const handleCheckUsername = async (u: string) => {
    const clean = u.trim().toLowerCase();
    if (clean.length < 3) {
      setUsernameStatus({ checking: false, available: false, message: 'Minimum 3 characters required' });
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
      setUsernameStatus({
        checking: false,
        available: false,
        message: 'Only letters, numbers, and underscores allowed',
      });
      return;
    }

    try {
      setUsernameStatus({ checking: true });
      const res = await api.post('/auth/check-username', { username: clean });
      if (res && res.available) {
        setUsernameStatus({ checking: false, available: true, message: 'Username is available' });
      } else {
        setUsernameStatus({
          checking: false,
          available: false,
          message: res?.message || 'Username already taken',
        });
      }
    } catch {
      const local = await clientStore.checkUsername(clean);
      setUsernameStatus({
        checking: false,
        available: local.available,
        message: local.message,
      });
    }
  };

  const handleStep2Continue = async () => {
    const clean = username.trim().toLowerCase();
    if (!clean || clean.length < 3) {
      setErrorMessage(isKn ? 'ಯೂಸರ್‌ನೇಮ್ ಕನಿಷ್ಠ 3 ಅಕ್ಷರಗಳಾಗಿರಬೇಕು' : 'Username must be at least 3 characters');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
      setErrorMessage(
        isKn ? 'ಕೇವಲ ಅಕ್ಷರಗಳು, ಅಂಕಿಗಳು ಮತ್ತು _ ಮಾತ್ರ ಬಳಸಿ' : 'Username can only contain letters, numbers, and underscores',
      );
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.post('/auth/check-username', { username: clean });
      if (res && res.available === false) {
        setErrorMessage(res.message || 'Username already taken');
        return;
      }
      setStep(3);
    } catch {
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------
  // STEP 3: DISTRICT & STATE SELECTION
  // -------------------------------------------------------------------
  const handleStep3Continue = () => {
    const finalDistrict = customDistrict.trim() || selectedDistrict;
    if (!finalDistrict) {
      setErrorMessage(isKn ? 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಜಿಲ್ಲೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ' : 'Please select your district');
      return;
    }
    setErrorMessage(null);
    setStep(4);
  };

  // -------------------------------------------------------------------
  // STEP 4: PASSWORD CREATION & ACCOUNT SUBMISSION
  // -------------------------------------------------------------------
  const isPassLengthValid = password.length >= 8;
  const isPassUpperValid = /[A-Z]/.test(password);
  const isPassNumberOrSpecialValid = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const isPassMatch = password && password === confirmPassword;
  const isPasswordValid =
    isPassLengthValid && isPassUpperValid && isPassNumberOrSpecialValid && isPassMatch;

  const handleStep4CreateAccount = async () => {
    if (!isPassLengthValid) {
      setErrorMessage('Password must be at least 8 characters long');
      return;
    }
    if (!isPassUpperValid) {
      setErrorMessage('Password must contain at least one uppercase letter (A-Z)');
      return;
    }
    if (!isPassNumberOrSpecialValid) {
      setErrorMessage('Password must contain at least one number or special character');
      return;
    }
    if (!isPassMatch) {
      setErrorMessage('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      const finalDistrict = customDistrict.trim() || selectedDistrict;

      const res = await api.post('/auth/register', {
        email: email.trim().toLowerCase(),
        username: username.trim().toLowerCase(),
        displayName: displayName.trim() || username.trim(),
        state: selectedState,
        district: finalDistrict,
        password,
        language: i18n.language === 'kn' ? 'kn' : 'en',
      });

      if (res?.verificationCode) {
        setServerVerificationCode(res.verificationCode);
        setVerificationCode(res.verificationCode); // Pre-fill for ease of use
      }

      setResendCooldown(30);
      setStep(5);
    } catch (err: any) {
      // Seamless local registration fallback if network is unreachable
      try {
        const local = await clientStore.register({
          email: email.trim().toLowerCase(),
          username: username.trim().toLowerCase(),
          displayName: displayName.trim() || username.trim(),
          state: selectedState,
          district: customDistrict.trim() || selectedDistrict,
          password,
          language: i18n.language === 'kn' ? 'kn' : 'en',
        });
        if (local?.verificationCode) {
          setServerVerificationCode(local.verificationCode);
          setVerificationCode(local.verificationCode);
        }
        setResendCooldown(30);
        setStep(5);
        return;
      } catch (localErr: any) {
        setErrorMessage(localErr.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------
  // STEP 5: EMAIL VERIFICATION
  // -------------------------------------------------------------------
  const handleVerifyEmail = async () => {
    const code = verificationCode.trim();
    if (!code || code.length < 6) {
      setErrorMessage('Please enter the 6-digit verification code');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      const res = await api.post('/auth/verify-email', {
        email: email.trim().toLowerCase(),
        code,
      });

      if (res && res.tokens && res.user) {
        await setAuth(res.user, res.tokens.accessToken, res.tokens.refreshToken);
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      try {
        const local = await clientStore.verifyEmail(email.trim().toLowerCase(), code);
        if (local && local.tokens && local.user) {
          await setAuth(local.user as any, local.tokens.accessToken, local.tokens.refreshToken);
          router.replace('/(tabs)');
          return;
        }
      } catch {
        // continue
      }
      setErrorMessage(err.message || 'Invalid verification code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    try {
      setLoading(true);
      const res = await api.post('/auth/resend-code', { email: email.trim().toLowerCase() });
      if (res?.verificationCode) {
        setServerVerificationCode(res.verificationCode);
        setVerificationCode(res.verificationCode);
      }
      setResendCooldown(30);
      setToastMessage('A fresh verification code has been generated!');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (e: any) {
      try {
        const local = await clientStore.resendCode(email.trim().toLowerCase());
        if (local?.verificationCode) {
          setServerVerificationCode(local.verificationCode);
          setVerificationCode(local.verificationCode);
        }
        setResendCooldown(30);
        setToastMessage('A fresh verification code has been generated!');
        setTimeout(() => setToastMessage(null), 3000);
        return;
      } catch {
        // continue
      }
      setErrorMessage(e.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------
  // SIGN IN HANDLER
  // -------------------------------------------------------------------
  const handleSignIn = async () => {
    const cleanLogin = loginInput.trim();
    if (!cleanLogin) {
      setErrorMessage('Please enter your email or username');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      const res = await api.post('/auth/login', {
        login: cleanLogin,
        password: loginPassword,
      });

      if (res?.requiresVerification) {
        setEmail(res.email);
        if (res.verificationCode) {
          setServerVerificationCode(res.verificationCode);
          setVerificationCode(res.verificationCode);
        }
        setIsSignUp(true);
        setStep(5);
        return;
      }

      if (res?.user && res?.tokens) {
        await setAuth(res.user, res.tokens.accessToken, res.tokens.refreshToken);
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      try {
        const local = await clientStore.login(cleanLogin, loginPassword);
        if (local?.user && local?.tokens) {
          await setAuth(local.user as any, local.tokens.accessToken, local.tokens.refreshToken);
          router.replace('/(tabs)');
          return;
        }
      } catch {
        // continue
      }
      setErrorMessage(err.message || 'Sign in failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Filter districts based on search query
  const currentDistricts = (INDIAN_STATES_AND_DISTRICTS[selectedState] || []).filter((d) =>
    d.toLowerCase().includes(districtSearch.toLowerCase()),
  );

  return (
    <View style={{ flex: 1, backgroundColor: DS_TOKENS.colors.bg }}>
      {/* Subtle Pastel Ambient Highlights */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -100,
          left: '15%',
          width: 500,
          height: 500,
          borderRadius: 250,
          backgroundColor: 'rgba(99, 102, 241, 0.05)',
          ...(Platform.OS === 'web' ? ({ filter: 'blur(120px)' } as any) : {}),
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: 20,
          right: '15%',
          width: 400,
          height: 400,
          borderRadius: 200,
          backgroundColor: 'rgba(14, 165, 233, 0.04)',
          ...(Platform.OS === 'web' ? ({ filter: 'blur(100px)' } as any) : {}),
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
          paddingVertical: 32,
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
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: DS_TOKENS.colors.purple,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: DS_TOKENS.colors.purple,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
              }}
            >
              <Text style={{ fontSize: 18, color: '#FFFFFF' }}>⚡</Text>
            </View>
            <Text
              style={{
                color: DS_TOKENS.colors.textPrimary,
                fontWeight: '900',
                fontSize: 18,
                letterSpacing: 1.2,
              }}
            >
              AADDA
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              onPress={toggleLanguage}
              style={{
                backgroundColor: DS_TOKENS.colors.bgSecondary,
                borderWidth: 1,
                borderColor: DS_TOKENS.colors.borderSubtle,
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderRadius: DS_TOKENS.radii.pill,
              }}
            >
              <Text style={{ color: DS_TOKENS.colors.textPrimary, fontWeight: '800', fontSize: 12 }}>
                {isKn ? 'English' : 'ಕನ್ನಡ'} 🌐
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Section */}
        <View style={{ marginVertical: 20, alignItems: 'center' }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: DS_TOKENS.colors.purpleLight,
              borderWidth: 1.5,
              borderColor: DS_TOKENS.colors.purpleBorder,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 30 }}>
              {!isSignUp ? '🔑' : step === 1 ? '✉️' : step === 2 ? '👤' : step === 3 ? '📍' : step === 4 ? '🔒' : '✅'}
            </Text>
          </View>

          <Text
            style={{
              color: DS_TOKENS.colors.textPrimary,
              fontSize: 26,
              fontWeight: '900',
              textAlign: 'center',
              letterSpacing: -0.5,
            }}
          >
            {!isSignUp
              ? isKn
                ? 'ಖಾತೆಗೆ ಲಾಗಿನ್ ಆಗಿ'
                : 'Welcome Back'
              : step === 1
              ? isKn
                ? 'ಹೊಸ ಖಾತೆ ರಚಿಸಿ'
                : 'Create your account'
              : step === 2
              ? isKn
                ? 'ಯೂಸರ್‌ನೇಮ್ ಆಯ್ಕೆಮಾಡಿ'
                : 'Choose your unique username'
              : step === 3
              ? isKn
                ? 'ನಿಮ್ಮ ರಾಜ್ಯ ಮತ್ತು ಜಿಲ್ಲೆ'
                : 'Where are you based?'
              : step === 4
              ? isKn
                ? 'ಪಾಸ್‌ವರ್ಡ್ ರಚಿಸಿ'
                : 'Create a secure password'
              : isKn
              ? 'ಇಮೇಲ್ ದೃಢೀಕರಿಸಿ'
              : 'Verify your email'}
          </Text>

          <Text
            style={{
              color: DS_TOKENS.colors.textSecondary,
              fontSize: 13,
              fontWeight: '600',
              textAlign: 'center',
              marginTop: 4,
              maxWidth: 360,
              lineHeight: 18,
            }}
          >
            {!isSignUp
              ? isKn
                ? 'ನಿಮ್ಮ ಇಮೇಲ್ ಅಥವಾ ಯೂಸರ್‌ನೇಮ್ ಬಳಸಿ ಲಾಗಿನ್ ಆಗಿ'
                : 'Sign in to access your addas, chats, and daily chaos'
              : step === 1
              ? isKn
                ? 'ಪ್ರಾರಂಭಿಸಲು ನಿಮ್ಮ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ'
                : 'Join communities, daily chaos challenges, and hangout rooms'
              : step === 2
              ? isKn
                ? 'ಇದು ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಮತ್ತು ಚಾಟ್ ಹ್ಯಾಂಡಲ್ ಆಗಿರುತ್ತದೆ'
                : 'This is your unique handle across all rooms and chat channels'
              : step === 3
              ? isKn
                ? 'ಹತ್ತಿರದ ಗೆಳೆಯರು ಮತ್ತು ಲೋಕಲ್ ಅಡ್ಡಾಗಳೊಂದಿಗೆ ಸಂಪರ್ಕ ಸಾಧಿಸಿ'
                : 'Connect with nearby friends, local addas, and regional vibes'
              : step === 4
              ? isKn
                ? 'ಖಾತೆಯನ್ನು ಸುರಕ್ಷಿತವಾಗಿರಿಸಲು ಪ್ರಬಲ ಪಾಸ್‌ವರ್ಡ್ ಆಯ್ಕೆಮಾಡಿ'
                : 'Choose a strong password to protect your account'
              : isKn
              ? `ನಾವು ${email} ವಿಳಾಸಕ್ಕೆ 6 ಅಂಕಿಗಳ ಕೋಡ್ ಕಳುಹಿಸಿದ್ದೇವೆ`
              : `We sent a 6-digit verification code to ${email}`}
          </Text>

          {/* Step Progress Bar (For Signup) */}
          {isSignUp && (
            <View style={{ width: '100%', marginTop: 16 }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 6,
                }}
              >
                <Text style={{ color: DS_TOKENS.colors.purple, fontSize: 12, fontWeight: '800' }}>
                  STEP {step} OF 5
                </Text>
                <Text style={{ color: DS_TOKENS.colors.textSecondary, fontSize: 12, fontWeight: '700' }}>
                  {step === 1
                    ? 'Email'
                    : step === 2
                    ? 'Username'
                    : step === 3
                    ? 'Location'
                    : step === 4
                    ? 'Password'
                    : 'Verification'}
                </Text>
              </View>

              {/* Progress track */}
              <View
                style={{
                  height: 6,
                  width: '100%',
                  backgroundColor: DS_TOKENS.colors.bgSecondary,
                  borderRadius: 3,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: DS_TOKENS.colors.borderSubtle,
                }}
              >
                <View
                  style={{
                    height: '100%',
                    width: `${(step / 5) * 100}%`,
                    backgroundColor: DS_TOKENS.colors.purple,
                    borderRadius: 3,
                  }}
                />
              </View>
            </View>
          )}
        </View>

        {/* MAIN CARD CONTAINER */}
        <GlassCard elevated style={{ padding: 22, backgroundColor: '#FFFFFF' }}>
          {/* ========================================================= */}
          {/* SIGN IN FORM */}
          {/* ========================================================= */}
          {!isSignUp && (
            <View>
              <InputField
                label={isKn ? 'ಇಮೇಲ್ ಅಥವಾ ಯೂಸರ್‌ನೇಮ್ *' : 'Email or Username *'}
                value={loginInput}
                onChangeText={(txt) => {
                  setLoginInput(txt);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="you@email.com or @username"
                autoCapitalize="none"
                icon="👤"
              />

              <InputField
                label={isKn ? 'ಪಾಸ್‌ವರ್ಡ್' : 'Password'}
                value={loginPassword}
                onChangeText={(txt) => {
                  setLoginPassword(txt);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Enter password (or leave blank for direct login)"
                secureTextEntry={!showLoginPassword}
                icon="🔒"
                rightElement={
                  <TouchableOpacity
                    onPress={() => setShowLoginPassword(!showLoginPassword)}
                    style={{ paddingHorizontal: 6 }}
                  >
                    <Text style={{ fontSize: 16 }}>{showLoginPassword ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                }
                errorMessage={errorMessage}
              />

              <PrimaryButton
                title={isKn ? 'ಸೈನ್ ಇನ್ →' : 'Sign In →'}
                onPress={handleSignIn}
                loading={loading}
                style={{ marginTop: 8 }}
              />

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: 18,
                  gap: 6,
                }}
              >
                <Text style={{ color: DS_TOKENS.colors.textSecondary, fontSize: 13, fontWeight: '600' }}>
                  {isKn ? 'ಖಾತೆ ಇಲ್ಲವೇ?' : "Don't have an account?"}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setIsSignUp(true);
                    setStep(1);
                    setErrorMessage(null);
                  }}
                >
                  <Text style={{ color: DS_TOKENS.colors.purple, fontSize: 13, fontWeight: '800' }}>
                    {isKn ? 'ಹೊಸ ಖಾತೆ ರಚಿಸಿ' : 'Sign Up'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ========================================================= */}
          {/* SIGN UP STEP 1: EMAIL */}
          {/* ========================================================= */}
          {isSignUp && step === 1 && (
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

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: 18,
                  gap: 6,
                }}
              >
                <Text style={{ color: DS_TOKENS.colors.textSecondary, fontSize: 13, fontWeight: '600' }}>
                  {isKn ? 'ಈಗಾಗಲೇ ಖಾತೆ ಇದೆಯೇ?' : 'Already have an account?'}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setIsSignUp(false);
                    setErrorMessage(null);
                  }}
                >
                  <Text style={{ color: DS_TOKENS.colors.purple, fontSize: 13, fontWeight: '800' }}>
                    {isKn ? 'ಸೈನ್ ಇನ್ ಆಗಿ' : 'Sign In'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ========================================================= */}
          {/* SIGN UP STEP 2: USERNAME */}
          {/* ========================================================= */}
          {isSignUp && step === 2 && (
            <View>
              <InputField
                label={isKn ? 'ಯೂಸರ್‌ನೇಮ್ (Username) *' : 'Create Username *'}
                value={username}
                onChangeText={(txt) => {
                  const cleaned = txt.toLowerCase().replace(/[^a-z0-9_]/g, '');
                  setUsername(cleaned);
                  if (errorMessage) setErrorMessage(null);
                  handleCheckUsername(cleaned);
                }}
                placeholder="e.g. manjunath_46"
                autoCapitalize="none"
                icon="@"
                errorMessage={errorMessage}
                successMessage={usernameStatus.available ? 'Username is available' : null}
              />

              <InputField
                label={isKn ? 'ಪೂರ್ಣ ಹೆಸರು (Display Name)' : 'Display Name'}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="e.g. Manjunatha R"
                icon="👤"
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
                  loading={loading}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}

          {/* ========================================================= */}
          {/* SIGN UP STEP 3: STATE & DISTRICT */}
          {/* ========================================================= */}
          {isSignUp && step === 3 && (
            <View>
              {/* State Selection */}
              <Text style={{ color: DS_TOKENS.colors.textPrimary, fontSize: 13, fontWeight: '800', marginBottom: 6 }}>
                {isKn ? 'ರಾಜ್ಯ ಆಯ್ಕೆಮಾಡಿ (State) *' : 'Select State (India) *'}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingBottom: 10 }}
              >
                {INDIAN_STATES.map((s) => {
                  const isSelected = selectedState === s;
                  return (
                    <TouchableOpacity
                      key={s}
                      onPress={() => {
                        setSelectedState(s);
                        const firstDistrict = INDIAN_STATES_AND_DISTRICTS[s]?.[0] || '';
                        setSelectedDistrict(firstDistrict);
                        setCustomDistrict('');
                      }}
                      style={{
                        backgroundColor: isSelected
                          ? DS_TOKENS.colors.purpleLight
                          : DS_TOKENS.colors.bgSecondary,
                        borderRadius: DS_TOKENS.radii.pill,
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        borderWidth: 1.2,
                        borderColor: isSelected ? DS_TOKENS.colors.purple : DS_TOKENS.colors.borderSubtle,
                      }}
                    >
                      <Text
                        style={{
                          color: isSelected ? DS_TOKENS.colors.purple : DS_TOKENS.colors.textSecondary,
                          fontWeight: '800',
                          fontSize: 12,
                        }}
                      >
                        {s}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* District Filter & Selection */}
              <Text
                style={{
                  color: DS_TOKENS.colors.textPrimary,
                  fontSize: 13,
                  fontWeight: '800',
                  marginTop: 10,
                  marginBottom: 6,
                }}
              >
                {isKn ? `ಜಿಲ್ಲೆ (${selectedState}) *` : `Select District (${selectedState}) *`}
              </Text>

              {/* District Search Input */}
              <View
                style={{
                  backgroundColor: DS_TOKENS.colors.bgSecondary,
                  borderWidth: 1,
                  borderColor: DS_TOKENS.colors.borderSubtle,
                  borderRadius: DS_TOKENS.radii.md,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  marginBottom: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Text style={{ marginRight: 6 }}>🔍</Text>
                <TextInput
                  value={districtSearch}
                  onChangeText={setDistrictSearch}
                  placeholder={`Search in ${selectedState}...`}
                  placeholderTextColor={DS_TOKENS.colors.textMuted}
                  style={{ flex: 1, color: DS_TOKENS.colors.textPrimary, fontSize: 13 }}
                />
              </View>

              {/* District Chips */}
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 7,
                  maxHeight: 140,
                  overflow: 'scroll',
                  marginBottom: 12,
                }}
              >
                {currentDistricts.slice(0, 16).map((d) => {
                  const isSelected = selectedDistrict === d && !customDistrict;
                  return (
                    <TouchableOpacity
                      key={d}
                      onPress={() => {
                        setSelectedDistrict(d);
                        setCustomDistrict('');
                      }}
                      style={{
                        backgroundColor: isSelected
                          ? DS_TOKENS.colors.purpleLight
                          : DS_TOKENS.colors.bgSecondary,
                        borderRadius: DS_TOKENS.radii.pill,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderWidth: 1.2,
                        borderColor: isSelected
                          ? DS_TOKENS.colors.purple
                          : DS_TOKENS.colors.borderSubtle,
                      }}
                    >
                      <Text
                        style={{
                          color: isSelected ? DS_TOKENS.colors.purple : DS_TOKENS.colors.textSecondary,
                          fontWeight: '800',
                          fontSize: 11,
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
                  if (txt) setSelectedDistrict(txt);
                }}
                placeholder={isKn ? 'ಅಥವಾ ಬೇರೆ ಜಿಲ್ಲೆ ಟೈಪ್ ಮಾಡಿ...' : 'Or type another district / city...'}
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
                  title={isKn ? 'ಮುಂದುವರಿಯಿರಿ →' : 'Continue →'}
                  onPress={handleStep3Continue}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}

          {/* ========================================================= */}
          {/* SIGN UP STEP 4: PASSWORD CREATION */}
          {/* ========================================================= */}
          {isSignUp && step === 4 && (
            <View>
              <InputField
                label={isKn ? 'ಪಾಸ್‌ವರ್ಡ್ ರಚಿಸಿ *' : 'Create Password *'}
                value={password}
                onChangeText={(txt) => {
                  setPassword(txt);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="At least 8 characters"
                secureTextEntry={!showPassword}
                icon="🔒"
                rightElement={
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={{ paddingHorizontal: 6 }}
                  >
                    <Text style={{ fontSize: 16 }}>{showPassword ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                }
              />

              <InputField
                label={isKn ? 'ಪಾಸ್‌ವರ್ಡ್ ದೃಢೀಕರಿಸಿ *' : 'Confirm Password *'}
                value={confirmPassword}
                onChangeText={(txt) => {
                  setConfirmPassword(txt);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Re-enter password"
                secureTextEntry={!showConfirmPassword}
                icon="🔒"
                rightElement={
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ paddingHorizontal: 6 }}
                  >
                    <Text style={{ fontSize: 16 }}>{showConfirmPassword ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                }
                errorMessage={errorMessage}
              />

              {/* Password Requirements Checklist */}
              <View
                style={{
                  backgroundColor: DS_TOKENS.colors.bgSecondary,
                  padding: 12,
                  borderRadius: DS_TOKENS.radii.md,
                  borderWidth: 1,
                  borderColor: DS_TOKENS.colors.borderSubtle,
                  marginBottom: 14,
                  gap: 6,
                }}
              >
                <Text style={{ color: DS_TOKENS.colors.textPrimary, fontSize: 12, fontWeight: '800' }}>
                  Password Requirements:
                </Text>
                <Text
                  style={{
                    color: isPassLengthValid ? DS_TOKENS.colors.emerald : DS_TOKENS.colors.textMuted,
                    fontSize: 12,
                    fontWeight: '700',
                  }}
                >
                  {isPassLengthValid ? '✓' : '○'} At least 8 characters
                </Text>
                <Text
                  style={{
                    color: isPassUpperValid ? DS_TOKENS.colors.emerald : DS_TOKENS.colors.textMuted,
                    fontSize: 12,
                    fontWeight: '700',
                  }}
                >
                  {isPassUpperValid ? '✓' : '○'} Contains at least one uppercase letter (A-Z)
                </Text>
                <Text
                  style={{
                    color: isPassNumberOrSpecialValid ? DS_TOKENS.colors.emerald : DS_TOKENS.colors.textMuted,
                    fontSize: 12,
                    fontWeight: '700',
                  }}
                >
                  {isPassNumberOrSpecialValid ? '✓' : '○'} Contains a number or special symbol
                </Text>
                <Text
                  style={{
                    color: isPassMatch ? DS_TOKENS.colors.emerald : DS_TOKENS.colors.textMuted,
                    fontSize: 12,
                    fontWeight: '700',
                  }}
                >
                  {isPassMatch ? '✓' : '○'} Passwords match
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <SecondaryButton
                  title={isKn ? '‹ ಹಿಂದೆ' : '‹ Back'}
                  onPress={() => setStep(3)}
                  style={{ flex: 1 }}
                />
                <PrimaryButton
                  title={isKn ? 'ಖಾತೆ ರಚಿಸಿ 🎉' : 'Create Account 🎉'}
                  onPress={handleStep4CreateAccount}
                  loading={loading}
                  disabled={!isPasswordValid}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}

          {/* ========================================================= */}
          {/* SIGN UP STEP 5: EMAIL VERIFICATION */}
          {/* ========================================================= */}
          {isSignUp && step === 5 && (
            <View>
              {serverVerificationCode && (
                <View
                  style={{
                    backgroundColor: DS_TOKENS.colors.purpleLight,
                    borderWidth: 1,
                    borderColor: DS_TOKENS.colors.purpleBorder,
                    padding: 12,
                    borderRadius: DS_TOKENS.radii.md,
                    marginBottom: 16,
                  }}
                >
                  <Text style={{ color: DS_TOKENS.colors.purple, fontSize: 12, fontWeight: '800' }}>
                    📬 Verification Code Sent:
                  </Text>
                  <Text
                    style={{
                      color: DS_TOKENS.colors.textPrimary,
                      fontSize: 18,
                      fontWeight: '900',
                      letterSpacing: 2,
                      marginTop: 2,
                    }}
                  >
                    {serverVerificationCode}
                  </Text>
                  <Text style={{ color: DS_TOKENS.colors.textSecondary, fontSize: 11, marginTop: 2 }}>
                    Enter this 6-digit code below to activate your account.
                  </Text>
                </View>
              )}

              <InputField
                label={isKn ? '6-ಅಂಕಿಯ ಪರಿಶೀಲನಾ ಕೋಡ್ *' : '6-Digit Verification Code *'}
                value={verificationCode}
                onChangeText={(txt) => {
                  setVerificationCode(txt);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="e.g. 123456"
                keyboardType="number-pad"
                icon="🔢"
                errorMessage={errorMessage}
              />

              <PrimaryButton
                title={isKn ? 'ಖಾತೆ ಸಕ್ರಿಯಗೊಳಿಸಿ ✓' : 'Verify & Complete Signup ✓'}
                onPress={handleVerifyEmail}
                loading={loading}
                variant="emerald"
                style={{ marginTop: 6 }}
              />

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 16,
                }}
              >
                <TouchableOpacity onPress={() => setStep(4)}>
                  <Text style={{ color: DS_TOKENS.colors.textSecondary, fontSize: 12, fontWeight: '700' }}>
                    ‹ Back to Password
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleResendCode}
                  disabled={resendCooldown > 0}
                >
                  <Text
                    style={{
                      color: resendCooldown > 0 ? DS_TOKENS.colors.textMuted : DS_TOKENS.colors.purple,
                      fontSize: 12,
                      fontWeight: '800',
                    }}
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </GlassCard>

        {/* Footer info */}
        <View style={{ alignItems: 'center', marginTop: 24 }}>
          <Text style={{ color: DS_TOKENS.colors.textMuted, fontSize: 12, fontWeight: '600' }}>
            AADDA • The Ultimate Kannada & Regional Social Hangout
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
