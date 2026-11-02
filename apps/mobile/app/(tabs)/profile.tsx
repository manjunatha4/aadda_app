import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/stores/authStore';
import {
  MainLayout,
  PageHeader,
  GlassCard,
  PrimaryButton,
  SecondaryButton,
  InputField,
  ConfirmationDialog,
  ToastNotification,
  DS_TOKENS,
} from '../../src/components/DesignSystem';

const PRESET_AVATARS = [
  {
    id: 'preset_1',
    label: 'Modern Aesthetic',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'preset_2',
    label: 'Casual Guy',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'preset_3',
    label: 'Vibrant Smile',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'preset_4',
    label: 'Urban Minimal',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'preset_5',
    label: 'Warm Tone',
    url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'preset_6',
    label: 'Classic Indigo',
    url: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=400&q=80',
  },
];

export default function ProfileScreen() {
  const { i18n } = useTranslation();
  const router = useRouter();
  const { isAuthenticated, isLoading, user, logout, updateLanguage, updateProfile } = useAuthStore();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState(user?.displayName || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editDistrict, setEditDistrict] = useState(user?.district || 'Bengaluru Urban');
  const [editAvatarUrl, setEditAvatarUrl] = useState<string>(user?.avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  useEffect(() => {
    if (user) {
      setEditDisplayName(user.displayName || user.username || '');
      setEditBio(user.bio || '');
      setEditDistrict(user.district || 'Bengaluru Urban');
      setEditAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  const isKn = i18n.language === 'kn';

  const handleToggleLang = async () => {
    const next = i18n.language === 'kn' ? 'en' : 'kn';
    await updateLanguage(next);
    setToastMessage(next === 'kn' ? 'ಭಾಷೆಯನ್ನು ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಲಾಗಿದೆ 🌐' : 'Language switched to English 🌐');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePickAvatarFromGallery = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          if (file.size > 8 * 1024 * 1024) {
            setToastMessage(isKn ? 'ಫೋಟೋ ಗಾತ್ರ 8MB ಗಿಂತ ಕಡಿಮೆಯಿರಬೇಕು' : 'Photo size must be under 8MB');
            setTimeout(() => setToastMessage(null), 3000);
            return;
          }
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            if (dataUrl) {
              setEditAvatarUrl(dataUrl);
              setToastMessage(isKn ? 'ಗ್ಯಾಲರಿಯಿಂದ ಫೋಟೋ ಆಯ್ಕೆ ಮಾಡಲಾಗಿದೆ! 📸' : 'Photo chosen from gallery! 📸');
              setTimeout(() => setToastMessage(null), 2500);
            }
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      setToastMessage(isKn ? 'ಸಾಧನದ ಗ್ಯಾಲರಿ ಬೆಂಬಲಿತವಾಗಿದೆ' : 'Device gallery picker ready');
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  const handleSaveProfile = async () => {
    if (!editDisplayName.trim()) {
      setToastMessage(isKn ? 'ದಯವಿಟ್ಟು ಹೆಸರನ್ನು ನಮೂದಿಸಿ' : 'Please enter a display name');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    try {
      setSaving(true);
      await updateProfile({
        displayName: editDisplayName.trim(),
        bio: editBio.trim(),
        district: editDistrict.trim(),
        avatarUrl: editAvatarUrl || null,
      });
      setShowEditModal(false);
      setToastMessage(isKn ? 'ಪ್ರೊಫೈಲ್ ಮತ್ತು ಫೋಟೋ ನವೀಕರಿಸಲಾಗಿದೆ! ✨' : 'Profile & photo updated successfully! ✨');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (e: any) {
      setToastMessage(e.message || (isKn ? 'ನವೀಕರಣ ವಿಫಲವಾಗಿದೆ' : 'Update failed'));
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
      router.replace('/(auth)/login');
    } catch (e) {
      console.error(e);
    } finally {
      setLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  const displayName = user?.displayName || user?.username || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <MainLayout>
      {/* Page Header */}
      <PageHeader
        title={isKn ? 'ಪ್ರೊಫೈಲ್' : 'Account & Profile'}
        subtitle={isKn ? 'ನಿಮ್ಮ ಖಾತೆ ಮಾಹಿತಿ ಮತ್ತು ಸೆಟ್ಟಿಂಗ್ಸ್' : 'Manage your identity, photo, regional vibe, and preferences'}
      />

      {/* Main Profile Glass Card */}
      <GlassCard elevated style={{ alignItems: 'center', paddingVertical: 28, marginBottom: 20 }}>
        {/* User Avatar Circle with Camera Overlay */}
        <TouchableOpacity
          onPress={() => setShowEditModal(true)}
          activeOpacity={0.85}
          style={{ position: 'relative', marginBottom: 14 }}
        >
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: DS_TOKENS.colors.purple,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 3.5,
              borderColor: '#FFFFFF',
              overflow: 'hidden',
              shadowColor: DS_TOKENS.colors.purple,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 14,
              elevation: 6,
            }}
          >
            {user?.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <Text style={{ fontSize: 40, color: '#FFFFFF', fontWeight: '900' }}>{initial}</Text>
            )}
          </View>

          {/* Camera Badge Icon */}
          <View
            style={{
              position: 'absolute',
              bottom: 2,
              right: 2,
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: '#4F46E5',
              borderWidth: 2.5,
              borderColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <Text style={{ fontSize: 14, color: '#FFFFFF' }}>📷</Text>
          </View>
        </TouchableOpacity>

        <Text style={{ color: DS_TOKENS.colors.textPrimary, fontSize: 22, fontWeight: '900', letterSpacing: -0.3 }}>
          {displayName}
        </Text>
        <Text style={{ color: DS_TOKENS.colors.textSecondary, fontSize: 14, fontWeight: '700', marginTop: 3 }}>
          @{user?.username || 'member'}
        </Text>

        {/* User Badges & Action */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <View
            style={{
              backgroundColor: DS_TOKENS.colors.purpleLight,
              borderWidth: 1,
              borderColor: DS_TOKENS.colors.purpleBorder,
              borderRadius: DS_TOKENS.radii.pill,
              paddingHorizontal: 12,
              paddingVertical: 5,
            }}
          >
            <Text style={{ color: DS_TOKENS.colors.purple, fontSize: 12, fontWeight: '800' }}>
              📍 {user?.district || 'Bengaluru'}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: DS_TOKENS.colors.emeraldLight,
              borderWidth: 1,
              borderColor: DS_TOKENS.colors.emeraldBorder,
              borderRadius: DS_TOKENS.radii.pill,
              paddingHorizontal: 10,
              paddingVertical: 5,
            }}
          >
            <Text style={{ color: DS_TOKENS.colors.emerald, fontSize: 12, fontWeight: '800' }}>✓ Verified</Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowEditModal(true)}
            activeOpacity={0.8}
            style={{
              backgroundColor: '#4F46E5',
              borderRadius: DS_TOKENS.radii.pill,
              paddingHorizontal: 14,
              paddingVertical: 5,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              shadowColor: '#4F46E5',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 6,
              elevation: 3,
            }}
          >
            <Text style={{ fontSize: 12 }}>✏️</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '800' }}>
              {isKn ? 'ಪ್ರೊಫೈಲ್ & ಫೋಟೋ ತಿದ್ದುಪಡಿ' : 'Edit Profile & Photo'}
            </Text>
          </TouchableOpacity>
        </View>

        {Boolean(user?.bio) && (
          <Text style={{ color: '#64748B', fontSize: 13, fontStyle: 'italic', marginTop: 12, textAlign: 'center', paddingHorizontal: 20 }}>
            "{user?.bio}"
          </Text>
        )}
      </GlassCard>

      {/* Account Settings List */}
      <GlassCard style={{ padding: 6, marginBottom: 20 }}>
        {/* Email Address */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: DS_TOKENS.colors.borderSubtle,
          }}
        >
          <View>
            <Text style={{ color: DS_TOKENS.colors.textSecondary, fontSize: 12, fontWeight: '700' }}>
              {isKn ? 'ಇಮೇಲ್ ವಿಳಾಸ' : 'Email Address'}
            </Text>
            <Text style={{ color: DS_TOKENS.colors.textPrimary, fontSize: 14, fontWeight: '800', marginTop: 2 }}>
              {user?.email || 'user@aadda.app'}
            </Text>
          </View>
          <Text style={{ fontSize: 18 }}>✉️</Text>
        </View>

        {/* Change Photo Option */}
        <TouchableOpacity
          onPress={() => setShowEditModal(true)}
          activeOpacity={0.8}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: DS_TOKENS.colors.borderSubtle,
          }}
        >
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={{ color: DS_TOKENS.colors.textPrimary, fontSize: 14, fontWeight: '800' }}>
              🖼️ {isKn ? 'ಪ್ರೊಫೈಲ್ ಫೋಟೋ ಬದಲಾಯಿಸಿ' : 'Change Profile Picture'}
            </Text>
            <Text style={{ color: DS_TOKENS.colors.textSecondary, fontSize: 12, fontWeight: '600', marginTop: 2 }}>
              {isKn ? 'ಸಾಧನದ ಗ್ಯಾಲರಿಯಿಂದ ಫೋಟೋ ಅಥವಾ ಅವತಾರ ಆಯ್ಕೆಮಾಡಿ' : 'Upload photo from device gallery or choose avatar'}
            </Text>
          </View>
          <Text style={{ color: '#4F46E5', fontSize: 14, fontWeight: '800' }}>
            {user?.avatarUrl ? (isKn ? 'ಬದಲಾಯಿಸಿ ›' : 'Change ›') : (isKn ? '+ ಸೇರಿಸಿ ›' : '+ Add ›')}
          </Text>
        </TouchableOpacity>

        {/* Language Switcher */}
        <TouchableOpacity
          onPress={handleToggleLang}
          activeOpacity={0.8}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: DS_TOKENS.colors.borderSubtle,
          }}
        >
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={{ color: DS_TOKENS.colors.textPrimary, fontSize: 14, fontWeight: '800' }}>
              🌐 {isKn ? 'ಅಪ್ಲಿಕೇಶನ್ ಭಾಷೆ' : 'Application Language'}
            </Text>
            <Text style={{ color: DS_TOKENS.colors.textSecondary, fontSize: 12, fontWeight: '600', marginTop: 2 }}>
              {isKn ? 'ಕನ್ನಡದಲ್ಲಿ ಬಳಸಲಾಗುತ್ತಿದೆ' : 'Currently in English'}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: DS_TOKENS.colors.purpleLight,
              borderWidth: 1,
              borderColor: DS_TOKENS.colors.purpleBorder,
              borderRadius: DS_TOKENS.radii.pill,
              paddingHorizontal: 12,
              paddingVertical: 5,
            }}
          >
            <Text style={{ color: DS_TOKENS.colors.purple, fontSize: 12, fontWeight: '800' }}>
              {isKn ? 'ಕನ್ನಡ (KN)' : 'English (EN)'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* News Feed Shortcut */}
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/chaos')}
          activeOpacity={0.8}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 14,
          }}
        >
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={{ color: DS_TOKENS.colors.textPrimary, fontSize: 14, fontWeight: '800' }}>
              📰 {isKn ? 'ಸುದ್ದಿ ಮತ್ತು ಫೋಟೋ ಫೀಡ್' : 'Real Photo News Feed'}
            </Text>
            <Text style={{ color: DS_TOKENS.colors.textSecondary, fontSize: 12, fontWeight: '600', marginTop: 2 }}>
              {isKn ? 'ನಿಮ್ಮ ವೃತ್ತದ ನೈಜ ಸ್ಥಳೀಯ & ಕಾಲೇಜು ಸುದ್ದಿ' : 'View verified circle news and photos'}
            </Text>
          </View>
          <Text style={{ color: DS_TOKENS.colors.textMuted, fontSize: 16, fontWeight: '800' }}>›</Text>
        </TouchableOpacity>
      </GlassCard>

      {/* Logout Action (Prominent & Clear, Never Overflowing) */}
      <GlassCard
        style={{
          padding: 18,
          borderColor: '#FECDD3',
          backgroundColor: '#FFF1F2',
          marginBottom: 36,
          borderRadius: 20,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: '#FFE4E6',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
              borderWidth: 1,
              borderColor: '#FDA4AF',
            }}
          >
            <Text style={{ fontSize: 22 }}>🚪</Text>
          </View>
          <View style={{ flex: 1, paddingRight: 4 }}>
            <Text style={{ color: '#E11D48', fontSize: 16, fontWeight: '900', letterSpacing: -0.2 }}>
              {isKn ? 'ಖಾತೆಯಿಂದ ಲಾಗ್ ಔಟ್' : 'Sign Out of AADDA'}
            </Text>
            <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '600', marginTop: 2, lineHeight: 17 }}>
              {isKn ? 'ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಸೆಶನ್ ಮುಗಿಸಿ. ಯಾವುದೇ ಸಮಯದಲ್ಲಿ ಮತ್ತೆ ಲಾಗಿನ್ ಆಗಬಹುದು.' : 'End your current session. You can log back in anytime with your credentials.'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setShowLogoutConfirm(true)}
          disabled={loggingOut}
          activeOpacity={0.85}
          style={{
            width: '100%',
            backgroundColor: '#E11D48',
            paddingVertical: 13,
            paddingHorizontal: 16,
            borderRadius: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            shadowColor: '#E11D48',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.25,
            shadowRadius: 6,
            elevation: 3,
          }}
        >
          {loggingOut ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={{ fontSize: 16, color: '#FFFFFF' }}>🚪</Text>
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '800', letterSpacing: 0.3 }}>
                {isKn ? 'ಖಾತೆಯಿಂದ ಲಾಗ್ ಔಟ್ ಮಾಡಿ' : 'Log Out of Account'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </GlassCard>

      {/* Logout Confirmation Dialog */}
      <ConfirmationDialog
        visible={showLogoutConfirm}
        title={isKn ? 'ಖಾತೆಯಿಂದ ಲಾಗ್ ಔಟ್ ಮಾಡಬೇಕೆ?' : 'Sign out of your account?'}
        message={
          isKn
            ? 'ನಿಮ್ಮ ಖಾತೆಯಿಂದ ಲಾಗ್ ಔಟ್ ಆಗಲು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ? ನಿಮ್ಮ ರುಜುವಾತುಗಳನ್ನು ಬಳಸಿ ಯಾವುದೇ ಸಮಯದಲ್ಲಿ ಮತ್ತೆ ಲಾಗಿನ್ ಆಗಬಹುದು.'
            : 'Are you sure you want to log out of AADDA? You can sign right back in anytime using your credentials.'
        }
        confirmText={loggingOut ? (isKn ? 'ನಿರ್ಗಮಿಸಲಾಗುತ್ತಿದೆ...' : 'Signing out...') : (isKn ? 'ಖಚಿತವಾಗಿ ಲಾಗ್ ಔಟ್' : 'Yes, Log Out')}
        cancelText={isKn ? 'ರದ್ದು' : 'Stay Logged In'}
        destructive
        icon="🚪"
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      {/* Edit Profile & Photo Modal */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowEditModal(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 16,
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 28,
              padding: 22,
              width: '100%',
              maxWidth: 440,
              maxHeight: '90%',
              borderWidth: 1.5,
              borderColor: '#E2E8F0',
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.2,
              shadowRadius: 24,
              elevation: 12,
            }}
          >
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
              {/* Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A' }}>
                  ✏️ {isKn ? 'ಪ್ರೊಫೈಲ್ & ಫೋಟೋ ತಿದ್ದುಪಡಿ' : 'Edit Profile & Photo'}
                </Text>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <Text style={{ fontSize: 18, color: '#94A3B8', fontWeight: '800' }}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* 1. PHOTO PICKER / PREVIEW SECTION */}
              <View
                style={{
                  alignItems: 'center',
                  paddingVertical: 14,
                  paddingHorizontal: 12,
                  backgroundColor: '#F8FAFC',
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  gap: 12,
                }}
              >
                {/* Avatar Preview */}
                <View
                  style={{
                    width: 90,
                    height: 90,
                    borderRadius: 45,
                    backgroundColor: '#6366F1',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    borderWidth: 3,
                    borderColor: '#818CF8',
                    shadowColor: '#6366F1',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 10,
                  }}
                >
                  {editAvatarUrl ? (
                    <Image
                      source={{ uri: editAvatarUrl }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={{ fontSize: 36, color: '#FFFFFF', fontWeight: '900' }}>{initial}</Text>
                  )}
                </View>

                {/* Device Gallery Picker & Remove Buttons */}
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <TouchableOpacity
                    onPress={handlePickAvatarFromGallery}
                    activeOpacity={0.8}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 9999,
                      backgroundColor: '#EEF2FF',
                      borderWidth: 1.5,
                      borderColor: '#818CF8',
                    }}
                  >
                    <Text style={{ fontSize: 14 }}>📁</Text>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#4F46E5' }}>
                      {isKn ? 'ಗ್ಯಾಲರಿಯಿಂದ ಫೋಟೋ ಆರಿಸಿ' : 'Choose from Gallery'}
                    </Text>
                  </TouchableOpacity>

                  {Boolean(editAvatarUrl) && (
                    <TouchableOpacity
                      onPress={() => setEditAvatarUrl('')}
                      activeOpacity={0.8}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 9999,
                        backgroundColor: '#FEF2F2',
                        borderWidth: 1,
                        borderColor: '#FECACA',
                      }}
                    >
                      <Text style={{ fontSize: 12 }}>🗑️</Text>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#DC2626' }}>
                        {isKn ? 'ಫೋಟೋ ತೆಗೆಯಿರಿ' : 'Remove Photo'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Quick Presets */}
                <View style={{ width: '100%' }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#64748B', marginBottom: 6, textAlign: 'center' }}>
                    {isKn ? 'ಅಥವಾ ಪ್ರೊಫೈಲ್ ಅವತಾರ ಆರಿಸಿ:' : 'Or pick an aesthetic avatar preset:'}
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}>
                    {PRESET_AVATARS.map((p) => {
                      const isSelected = editAvatarUrl === p.url;
                      return (
                        <TouchableOpacity
                          key={p.id}
                          onPress={() => setEditAvatarUrl(p.url)}
                          activeOpacity={0.8}
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            overflow: 'hidden',
                            borderWidth: isSelected ? 3 : 1.5,
                            borderColor: isSelected ? '#4F46E5' : '#CBD5E1',
                          }}
                        >
                          <Image source={{ uri: p.url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>

              {/* 2. TEXT FIELDS */}
              <View style={{ gap: 10 }}>
                <InputField
                  label={isKn ? 'ಪ್ರದರ್ಶನ ಹೆಸರು' : 'Display Name'}
                  value={editDisplayName}
                  onChangeText={setEditDisplayName}
                  placeholder={isKn ? 'ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರು' : 'Your display name'}
                />
                <InputField
                  label={isKn ? 'ಜಿಲ್ಲೆ / ಊರು' : 'District / Town'}
                  value={editDistrict}
                  onChangeText={setEditDistrict}
                  placeholder="e.g. Bengaluru Urban, Mysuru, Mangaluru"
                />
                <InputField
                  label={isKn ? 'ಬಯೋ / ಸ್ಟೇಟಸ್' : 'Bio / Status'}
                  value={editBio}
                  onChangeText={setEditBio}
                  placeholder={isKn ? 'ನಿಮ್ಮ ಬಗ್ಗೆ ಒಂದು ಸಾಲು...' : 'A brief description...'}
                />

                <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
                  <SecondaryButton
                    title={isKn ? 'ರದ್ದು' : 'Cancel'}
                    onPress={() => setShowEditModal(false)}
                  />
                  <PrimaryButton
                    title={saving ? (isKn ? 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...' : 'Saving...') : (isKn ? 'ಉಳಿಸಿ' : 'Save Changes')}
                    onPress={handleSaveProfile}
                    disabled={saving}
                  />
                </View>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <ToastNotification
        visible={Boolean(toastMessage)}
        message={toastMessage || ''}
        onDismiss={() => setToastMessage(null)}
      />
    </MainLayout>
  );
}
