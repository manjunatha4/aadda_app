import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
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

export default function ProfileScreen() {
  const { i18n } = useTranslation();
  const router = useRouter();
  const { user, logout, updateLanguage, updateProfile } = useAuthStore();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState(user?.displayName || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editDistrict, setEditDistrict] = useState(user?.district || 'Bengaluru Urban');
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setEditDisplayName(user.displayName || user.username || '');
      setEditBio(user.bio || '');
      setEditDistrict(user.district || 'Bengaluru Urban');
    }
  }, [user]);

  const isKn = i18n.language === 'kn';

  const handleToggleLang = async () => {
    const next = i18n.language === 'kn' ? 'en' : 'kn';
    await updateLanguage(next);
    setToastMessage(next === 'kn' ? 'ಭಾಷೆಯನ್ನು ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಲಾಗಿದೆ 🌐' : 'Language switched to English 🌐');
    setTimeout(() => setToastMessage(null), 3000);
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
      });
      setShowEditModal(false);
      setToastMessage(isKn ? 'ಪ್ರೊಫೈಲ್ ನವೀಕರಿಸಲಾಗಿದೆ! ✨' : 'Profile updated successfully! ✨');
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
        subtitle={isKn ? 'ನಿಮ್ಮ ಖಾತೆ ಮಾಹಿತಿ ಮತ್ತು ಸೆಟ್ಟಿಂಗ್ಸ್' : 'Manage your identity, regional vibe, and preferences'}
      />

      {/* Main Profile Glass Card */}
      <GlassCard elevated style={{ alignItems: 'center', paddingVertical: 28, marginBottom: 20 }}>
        {/* User Avatar Circle */}
        <View
          style={{
            width: 84,
            height: 84,
            borderRadius: 42,
            backgroundColor: DS_TOKENS.colors.purple,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 3,
            borderColor: '#FFFFFF',
            marginBottom: 14,
            shadowColor: DS_TOKENS.colors.purple,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 4,
          }}
        >
          <Text style={{ fontSize: 36, color: '#FFFFFF', fontWeight: '900' }}>{initial}</Text>
        </View>

        <Text style={{ color: DS_TOKENS.colors.textPrimary, fontSize: 22, fontWeight: '900', letterSpacing: -0.3 }}>
          {displayName}
        </Text>
        <Text style={{ color: DS_TOKENS.colors.textSecondary, fontSize: 14, fontWeight: '700', marginTop: 3 }}>
          @{user?.username || 'member'}
        </Text>

        {/* User Badges */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
          <View
            style={{
              backgroundColor: DS_TOKENS.colors.purpleLight,
              borderWidth: 1,
              borderColor: DS_TOKENS.colors.purpleBorder,
              borderRadius: DS_TOKENS.radii.pill,
              paddingHorizontal: 12,
              paddingVertical: 4,
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
              paddingVertical: 4,
            }}
          >
            <Text style={{ color: DS_TOKENS.colors.emerald, fontSize: 12, fontWeight: '800' }}>✓ Verified</Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowEditModal(true)}
            activeOpacity={0.8}
            style={{
              backgroundColor: '#EEF2FF',
              borderWidth: 1,
              borderColor: '#C7D2FE',
              borderRadius: DS_TOKENS.radii.pill,
              paddingHorizontal: 12,
              paddingVertical: 4,
            }}
          >
            <Text style={{ color: '#4F46E5', fontSize: 12, fontWeight: '800' }}>
              ✏️ {isKn ? 'ತಿದ್ದುಪಡಿ' : 'Edit Profile'}
            </Text>
          </TouchableOpacity>
        </View>

        {Boolean(user?.bio) && (
          <Text style={{ color: '#64748B', fontSize: 13, fontStyle: 'italic', marginTop: 10, textAlign: 'center', paddingHorizontal: 20 }}>
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
          <View>
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
          <View>
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

      {/* Logout Action */}
      <GlassCard style={{ padding: 16, borderColor: DS_TOKENS.colors.roseBorder, backgroundColor: DS_TOKENS.colors.roseLight }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ color: DS_TOKENS.colors.rose, fontSize: 15, fontWeight: '800' }}>
              {isKn ? 'ಖಾತೆಯಿಂದ ಲಾಗ್ ಔಟ್' : 'Sign Out of AADDA'}
            </Text>
            <Text style={{ color: DS_TOKENS.colors.textSecondary, fontSize: 12, fontWeight: '600', marginTop: 2 }}>
              {isKn ? 'ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಸೆಶನ್ ಮುಗಿಸಿ' : 'You can log back in anytime with your credentials'}
            </Text>
          </View>
          <SecondaryButton
            title={isKn ? 'ಲಾಗ್ ಔಟ್' : 'Log Out'}
            icon="🚪"
            onPress={() => setShowLogoutConfirm(true)}
          />
        </View>
      </GlassCard>

      {/* Logout Confirmation Dialog */}
      <ConfirmationDialog
        visible={showLogoutConfirm}
        title={isKn ? 'ಲಾಗ್ ಔಟ್ ಮಾಡಬೇಕೆ?' : 'Sign out of your account?'}
        message={
          isKn
            ? 'ನಿಮ್ಮ ಖಾತೆಯಿಂದ ಲಾಗ್ ಔಟ್ ಆಗಲು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ?'
            : 'Are you sure you want to log out? You can sign right back in anytime using your credentials.'
        }
        confirmText={isKn ? 'ಲಾಗ್ ಔಟ್' : 'Log Out'}
        cancelText={isKn ? 'ರದ್ದು' : 'Cancel'}
        destructive
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowEditModal(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 18,
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 28,
              padding: 24,
              width: '100%',
              maxWidth: 420,
              borderWidth: 1.5,
              borderColor: '#E2E8F0',
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.2,
              shadowRadius: 24,
              elevation: 12,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A' }}>
                ✏️ {isKn ? 'ಪ್ರೊಫೈಲ್ ತಿದ್ದುಪಡಿ' : 'Edit Your Profile'}
              </Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Text style={{ fontSize: 18, color: '#94A3B8', fontWeight: '800' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={{ gap: 12 }}>
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

              <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
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
