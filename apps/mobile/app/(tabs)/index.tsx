import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, RefreshControl, Platform, Modal, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { api } from '../../src/services/api';
import { useAuthStore } from '../../src/stores/authStore';
import {
  MainLayout,
  PageHeader,
  GlassCard,
  PrimaryButton,
  SecondaryButton,
  InputField,
  ConfirmationDialog,
  LoadingState,
  ToastNotification,
  DS_TOKENS,
} from '../../src/components/DesignSystem';

export default function TodayScreen() {
  const { i18n } = useTranslation();
  const router = useRouter();
  const { user, updateLanguage, updateProfile, logout } = useAuthStore();

  const [addas, setAddas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Profile Modal & Edit States
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState(user?.displayName || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editDistrict, setEditDistrict] = useState(user?.district || 'Bengaluru Urban');
  const [savingProfile, setSavingProfile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isKn = i18n.language === 'kn';

  // Format dynamic date
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const dayFormatted = now.toLocaleDateString('en-US', { weekday: 'long' });

  const loadData = async () => {
    try {
      const addasRes = await api.get('/addas').catch(() => []);
      setAddas(addasRes || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync edit form with user when opening
  useEffect(() => {
    if (user) {
      setEditDisplayName(user.displayName || user.username || '');
      setEditBio(user.bio || '');
      setEditDistrict(user.district || 'Bengaluru Urban');
    }
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const handleToggleLanguage = async () => {
    const nextLang = isKn ? 'en' : 'kn';
    await updateLanguage(nextLang);
    setToastMessage(nextLang === 'kn' ? 'ಭಾಷೆಯನ್ನು ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಲಾಗಿದೆ 🌐' : 'Language changed to English 🌐');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveProfile = async () => {
    if (!editDisplayName.trim()) {
      setToastMessage(isKn ? 'ಹೆಸರನ್ನು ಖಾಲಿ ಬಿಡುವಂತಿಲ್ಲ' : 'Display name cannot be empty');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    try {
      setSavingProfile(true);
      await updateProfile({
        displayName: editDisplayName.trim(),
        bio: editBio.trim(),
        district: editDistrict.trim(),
      });
      setIsEditingProfile(false);
      setToastMessage(isKn ? 'ಪ್ರೊಫೈಲ್ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ! ✨' : 'Profile updated successfully! ✨');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (e: any) {
      setToastMessage(e.message || (isKn ? 'ನವೀಕರಣ ವಿಫಲವಾಗಿದೆ' : 'Failed to update profile'));
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleConfirmLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
      setShowProfileModal(false);
      setShowLogoutConfirm(false);
      router.replace('/(auth)/login');
    } catch (e) {
      console.error(e);
    } finally {
      setLoggingOut(false);
    }
  };

  const displayName = user?.displayName || user?.username || 'Friend';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <MainLayout
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={DS_TOKENS.colors.purple} />
      }
    >
      <ToastNotification
        visible={Boolean(toastMessage)}
        message={toastMessage || ''}
        onDismiss={() => setToastMessage(null)}
      />

      {/* Top Header with Profile Icon on Top Right */}
      <PageHeader
        title={isKn ? 'ಇಂದು' : 'Dashboard'}
        subtitle={`${dateFormatted} · ${dayFormatted}`}
        badge={`📍 ${user?.district || 'Bengaluru'}`}
        actions={
          <TouchableOpacity
            onPress={() => setShowProfileModal(true)}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: '#FFFFFF',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 24,
              borderWidth: 1.5,
              borderColor: '#E2E8F0',
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 6,
              elevation: 3,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#6366F1',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 15, color: '#FFFFFF', fontWeight: '900' }}>
                {initial}
              </Text>
            </View>
            <View>
              <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '800', color: '#0F172A', maxWidth: 90 }}>
                {displayName}
              </Text>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#6366F1' }}>
                {isKn ? 'ಕನ್ನಡ' : 'EN'} · ⚙️
              </Text>
            </View>
          </TouchableOpacity>
        }
      />

      {/* Hero Welcome Glass Card */}
      <GlassCard elevated style={{ marginBottom: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: '#EEF2FF',
              borderWidth: 1.5,
              borderColor: '#C7D2FE',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 24 }}>👋</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#0F172A', fontSize: 18, fontWeight: '900' }}>
              {isKn ? `ನಮಸ್ಕಾರ, ${displayName}!` : `Welcome back, ${displayName}!`}
            </Text>
            <Text style={{ color: '#64748B', fontSize: 13, fontWeight: '600', marginTop: 2 }}>
              {isKn
                ? 'ನಿಮ್ಮ ಖಾಸಗಿ ಅಡ್ಡ ವೃತ್ತ ಮತ್ತು ಇಂದಿನ ಸುದ್ದಿ ಕೇಂದ್ರ'
                : 'Your private circle hangout & real-time updates hub'}
            </Text>
          </View>
        </View>

        {/* Quick Navigation Chips */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/chaos')}
            activeOpacity={0.75}
            style={{
              backgroundColor: '#EFF6FF',
              borderWidth: 1,
              borderColor: '#BFDBFE',
              borderRadius: 9999,
              paddingHorizontal: 12,
              paddingVertical: 6,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Text style={{ fontSize: 13 }}>📰</Text>
            <Text style={{ color: '#1D4ED8', fontSize: 12, fontWeight: '800' }}>
              {isKn ? 'ನೈಜ ಫೋಟೋ ಸುದ್ದಿ' : 'Real Photo News'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/buzz')}
            activeOpacity={0.75}
            style={{
              backgroundColor: '#FAF5FF',
              borderWidth: 1,
              borderColor: '#E9D5FF',
              borderRadius: 9999,
              paddingHorizontal: 12,
              paddingVertical: 6,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Text style={{ fontSize: 13 }}>☕</Text>
            <Text style={{ color: '#7E22CE', fontSize: 12, fontWeight: '800' }}>
              {isKn ? 'ಟೀ ಕುಡಿತಾ ಹರಟೆ & ಮತದಾನ' : 'Spill Tea & Polls'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/chats')}
            activeOpacity={0.75}
            style={{
              backgroundColor: '#ECFDF5',
              borderWidth: 1,
              borderColor: '#A7F3D0',
              borderRadius: 9999,
              paddingHorizontal: 12,
              paddingVertical: 6,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Text style={{ fontSize: 13 }}>💬</Text>
            <Text style={{ color: '#047857', fontSize: 12, fontWeight: '800' }}>
              {isKn ? 'ರೂಮ್ಸ್ ಮತ್ತು ಚಾಟ್' : 'Rooms & Chats'}
            </Text>
          </TouchableOpacity>
        </View>
      </GlassCard>

      {/* Unified Link to Rooms & Chats Banner */}
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/chats')}
        activeOpacity={0.85}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          borderWidth: 1.5,
          borderColor: '#E2E8F0',
          padding: 16,
          marginBottom: 18,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 2,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 8 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: '#EEF2FF',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 22 }}>🛖</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>
              {isKn ? 'ರೂಮ್‌ಗಳು ಮತ್ತು ಸೀಕ್ರೆಟ್ ಕೋಡ್' : 'Your Hangout Rooms & Chats'}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748B', marginTop: 2 }}>
              {isKn
                ? 'ಹೊಸ ರೂಮ್ ರಚಿಸಲು ಅಥವಾ ಕೋಡ್ ಬಳಸಿ ಸೇರಲು ಇಲ್ಲಿ ಟ್ಯಾಪ್ ಮಾಡಿ'
                : 'Create new rooms or join friends using a secret invite code'}
            </Text>
          </View>
        </View>
        <Text style={{ fontSize: 20, color: '#6366F1', fontWeight: '900' }}>›</Text>
      </TouchableOpacity>

      {/* Primary Active Room Quick Launcher */}
      <View style={{ marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: '#0F172A', fontSize: 17, fontWeight: '900' }}>
          {isKn ? 'ಸಕ್ರಿಯ ರೂಮ್ ಕ್ವಿಕ್ ಲಾಂಚರ್' : 'Quick Room Launcher'}
        </Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/chats')}>
          <Text style={{ color: '#6366F1', fontSize: 12, fontWeight: '800' }}>
            {isKn ? 'ಎಲ್ಲಾ ರೂಮ್‌ಗಳು ›' : 'View All Rooms ›'}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <LoadingState message={isKn ? 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...' : 'Loading active rooms...'} />
      ) : addas.length === 0 ? (
        <GlassCard style={{ padding: 24, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 36, marginBottom: 8 }}>🛖</Text>
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A', textAlign: 'center' }}>
            {isKn ? 'ಯಾವುದೇ ರೂಮ್ ಸೇರಿಲ್ಲ' : 'No active rooms yet'}
          </Text>
          <Text style={{ fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 4 }}>
            {isKn ? 'ರೂಮ್ಸ್ ಟ್ಯಾಬ್‌ನಲ್ಲಿ ಹೊಸ ರೂಮ್ ರಚಿಸಿ ಅಥವಾ ಸೇರಿ!' : 'Hop into the Rooms & Chats tab to create or join!'}
          </Text>
          <PrimaryButton
            title={isKn ? 'ರೂಮ್ಸ್ ಮತ್ತು ಚಾಟ್‌ಗೆ ಹೋಗಿ 💬' : 'Go to Rooms & Chats 💬'}
            onPress={() => router.push('/(tabs)/chats')}
            style={{ marginTop: 14 }}
          />
        </GlassCard>
      ) : (
        <View style={{ gap: 10, paddingBottom: 110 }}>
          {addas.slice(0, 3).map((adda) => (
            <GlassCard
              key={adda.id}
              onPress={() => {
                if (adda.conversationId) {
                  router.push(`/chat/${adda.conversationId}`);
                } else {
                  router.push(`/adda/${adda.id}`);
                }
              }}
              style={{ padding: 14 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: '#F8FAFC',
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    <Text style={{ fontSize: 20 }}>
                      {adda.name?.match(/[\p{Emoji}\u200d]+/gu)?.[0] || '🛖'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={{ color: '#0F172A', fontSize: 15, fontWeight: '800' }}>
                      {adda.name}
                    </Text>
                    <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '600', marginTop: 2 }}>
                      👥 {adda.memberCount || 1} {isKn ? 'ಸದಸ್ಯರು' : 'members'} · Active now
                    </Text>
                  </View>
                </View>

                <View
                  style={{
                    backgroundColor: '#EEF2FF',
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 9999,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#4F46E5' }}>Open 💬</Text>
                </View>
              </View>
            </GlassCard>
          ))}
        </View>
      )}

      {/* ------------------------------------------------------------- */}
      {/* QUICK PROFILE, LANGUAGE, EDIT & LOGOUT MODAL SHEET           */}
      {/* ------------------------------------------------------------- */}
      <Modal visible={showProfileModal} transparent animationType="fade">
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowProfileModal(false)}
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
              padding: 22,
              width: '100%',
              maxWidth: 420,
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
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header: User Avatar & Close */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 26,
                      backgroundColor: '#6366F1',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 24, color: '#FFFFFF', fontWeight: '900' }}>{initial}</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 17, fontWeight: '900', color: '#0F172A' }}>{displayName}</Text>
                    <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '600' }}>
                      @{user?.username || 'member'} · 📍 {user?.district || 'Bengaluru'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => setShowProfileModal(false)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#F1F5F9',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 16, color: '#64748B', fontWeight: '800' }}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* SECTION 1: LANGUAGE SWITCHER */}
              <View
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: 18,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  marginBottom: 14,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A' }}>
                      🌐 {isKn ? 'ಅಪ್ಲಿಕೇಶನ್ ಭಾಷೆ' : 'Application Language'}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2, fontWeight: '600' }}>
                      {isKn ? 'ಪ್ರಸ್ತುತ: ಕನ್ನಡ (KN)' : 'Current: English (EN)'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleToggleLanguage}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: '#EEF2FF',
                      borderWidth: 1.5,
                      borderColor: '#818CF8',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 9999,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#4F46E5' }}>
                      {isKn ? 'Switch to English' : 'ಕನ್ನಡಕ್ಕೆ ಬದಲಿಸಿ'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* SECTION 2: EDIT PROFILE */}
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 18,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  marginBottom: 14,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A' }}>
                    👤 {isKn ? 'ಪ್ರೊಫೈಲ್ ಮಾಹಿತಿ' : 'Profile Information'}
                  </Text>
                  {!isEditingProfile && (
                    <TouchableOpacity
                      onPress={() => setIsEditingProfile(true)}
                      style={{
                        backgroundColor: '#F1F5F9',
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 9999,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#334155' }}>
                        ✏️ {isKn ? 'ಸಂಪಾದಿಸಿ' : 'Edit'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {isEditingProfile ? (
                  <View style={{ gap: 10 }}>
                    <InputField
                      label={isKn ? 'ಪ್ರದರ್ಶನ ಹೆಸರು' : 'Display Name'}
                      value={editDisplayName}
                      onChangeText={setEditDisplayName}
                      placeholder={isKn ? 'ನಿಮ್ಮ ಹೆಸರು' : 'Your name'}
                    />
                    <InputField
                      label={isKn ? 'ಜಿಲ್ಲೆ / ಊರು' : 'District / Town'}
                      value={editDistrict}
                      onChangeText={setEditDistrict}
                      placeholder="e.g. Bengaluru, Mysuru, Mangaluru"
                    />
                    <InputField
                      label={isKn ? 'ಬಯೋ / ಸ್ಟೇಟಸ್' : 'Bio / Status Note'}
                      value={editBio}
                      onChangeText={setEditBio}
                      placeholder={isKn ? 'ನಿಮ್ಮ ಬಗ್ಗೆ ಚಿಕ್ಕ ವಿವರ...' : 'A brief note about yourself...'}
                    />
                    <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                      <SecondaryButton
                        title={isKn ? 'ರದ್ದು' : 'Cancel'}
                        onPress={() => setIsEditingProfile(false)}
                      />
                      <PrimaryButton
                        title={savingProfile ? (isKn ? 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...' : 'Saving...') : (isKn ? 'ಉಳಿಸಿ' : 'Save Changes')}
                        onPress={handleSaveProfile}
                        disabled={savingProfile}
                      />
                    </View>
                  </View>
                ) : (
                  <View style={{ gap: 4 }}>
                    <Text style={{ fontSize: 12, color: '#64748B' }}>
                      <Text style={{ fontWeight: '700', color: '#0F172A' }}>{isKn ? 'ಹೆಸರು: ' : 'Name: '}</Text>
                      {displayName}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#64748B' }}>
                      <Text style={{ fontWeight: '700', color: '#0F172A' }}>{isKn ? 'ಜಿಲ್ಲೆ: ' : 'District: '}</Text>
                      {user?.district || 'Bengaluru Urban'}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#64748B' }}>
                      <Text style={{ fontWeight: '700', color: '#0F172A' }}>{isKn ? 'ಬಯೋ: ' : 'Bio: '}</Text>
                      {user?.bio || (isKn ? 'ಇನ್ನೂ ವಿವರಣೆ ಸೇರಿಸಿಲ್ಲ' : 'No bio added yet')}
                    </Text>
                  </View>
                )}
              </View>

              {/* SECTION 3: MORE ACTIONS (Full Profile Link + Logout) */}
              <View style={{ gap: 8 }}>
                <TouchableOpacity
                  onPress={() => {
                    setShowProfileModal(false);
                    router.push('/(tabs)/profile');
                  }}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 12,
                    borderRadius: 14,
                    backgroundColor: '#F8FAFC',
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155' }}>
                    ⚙️ {isKn ? 'ಪೂರ್ಣ ಪ್ರೊಫೈಲ್ ಮತ್ತು ಸೆಟ್ಟಿಂಗ್ಸ್' : 'Full Account & Profile Settings'}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#94A3B8', fontWeight: '800' }}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowLogoutConfirm(true)}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: 12,
                    borderRadius: 14,
                    backgroundColor: '#FEF2F2',
                    borderWidth: 1,
                    borderColor: '#FECACA',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#EF4444' }}>
                    🚪 {isKn ? 'ಖಾತೆಯಿಂದ ಲಾಗ್ ಔಟ್' : 'Sign Out of Account'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* LOGOUT CONFIRMATION DIALOG */}
      <ConfirmationDialog
        visible={showLogoutConfirm}
        title={isKn ? 'ಖಾತೆಯಿಂದ ನಿರ್ಗಮಿಸಬೇಕೆ?' : 'Sign out of your account?'}
        message={
          isKn
            ? 'ನಿಮ್ಮ ಖಾತೆಯಿಂದ ಲಾಗ್ ಔಟ್ ಆಗಲು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ?'
            : 'Are you sure you want to log out? You can sign right back in anytime using your credentials.'
        }
        confirmText={loggingOut ? (isKn ? 'ನಿರ್ಗಮಿಸಲಾಗುತ್ತಿದೆ...' : 'Signing out...') : (isKn ? 'ಲಾಗ್ ಔಟ್' : 'Log Out')}
        cancelText={isKn ? 'ರದ್ದು' : 'Cancel'}
        destructive
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </MainLayout>
  );
}
