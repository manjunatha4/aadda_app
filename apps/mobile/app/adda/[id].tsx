import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { api } from '../../src/services/api';
import { useAuthStore } from '../../src/stores/authStore';

export default function AddaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [adda, setAdda] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const isKn = i18n.language === 'kn';

  const loadDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/addas/${id}`);
      setAdda(res);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadDetails();
    }
  }, [id]);

  const copyCode = (code: string) => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeaveAdda = async () => {
    try {
      setLeaving(true);
      await api.delete(`/addas/${id}/leave`);
      router.replace('/(tabs)');
    } catch (e: any) {
      console.error(e);
    } finally {
      setLeaving(false);
    }
  };

  if (loading || !adda) {
    return (
      <View style={{ flex: 1, backgroundColor: '#24183B', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#D9FF67" size="large" />
      </View>
    );
  }

  const activeInvite = adda.inviteCode || (adda.invitations && adda.invitations[0]?.code) || 'ADDA-VIP';

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: '#24183B', padding: 16 }}>
      {/* Adda Header Card */}
      <View
        style={{
          backgroundColor: '#352454',
          borderRadius: 20,
          padding: 20,
          marginBottom: 16,
          borderWidth: 1.5,
          borderColor: '#47326B',
        }}
      >
        <Text style={{ color: '#D9FF67', fontSize: 24, fontWeight: '900' }}>
          {adda.name}
        </Text>
        {adda.description ? (
          <Text style={{ color: '#F4F0FF', opacity: 0.85, fontSize: 14, marginTop: 6, lineHeight: 20 }}>
            {adda.description}
          </Text>
        ) : null}

        {/* Secret Invite Code Card */}
        <View
          style={{
            backgroundColor: '#160E24',
            borderRadius: 14,
            padding: 14,
            marginTop: 16,
            borderWidth: 1.5,
            borderColor: '#FF786B',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View>
            <Text style={{ color: '#8C7D9E', fontSize: 11, fontWeight: '800' }}>
              🔑 {isKn ? 'ಇನ್ವಿಟೇಶನ್ ಕೋಡ್' : 'Invite Code for Friends'}
            </Text>
            <Text style={{ color: '#D9FF67', fontSize: 22, fontWeight: '900', letterSpacing: 2, marginTop: 2 }}>
              {activeInvite}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => copyCode(activeInvite)}
            style={{
              backgroundColor: copied ? '#4CD964' : '#FF786B',
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 10,
            }}
          >
            <Text style={{ color: '#24183B', fontWeight: '900', fontSize: 12 }}>
              {copied ? '✓ COPIED' : '📋 COPY'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Action Button: Open Chat */}
        <TouchableOpacity
          onPress={() => {
            if (adda.conversationId) {
              router.push(`/chat/${adda.conversationId}`);
            } else if (adda.conversation?.id) {
              router.push(`/chat/${adda.conversation.id}`);
            }
          }}
          style={{
            backgroundColor: '#D9FF67',
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: 'center',
            marginTop: 16,
          }}
        >
          <Text style={{ color: '#24183B', fontWeight: '900', fontSize: 15 }}>
            {isKn ? 'ಚಾಟ್ ಪ್ರಾರಂಭಿಸಿ 💬' : 'Open Room Chat 💬'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Members List */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '900' }}>
          {isKn ? 'ಸದಸ್ಯರು' : 'Members'} ({adda.members?.length || 1})
        </Text>
      </View>

      {adda.members?.map((m: any) => (
        <View
          key={m.id || m.userId}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#352454',
            padding: 12,
            borderRadius: 14,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: '#47326B',
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#160E24',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12,
              borderWidth: 1,
              borderColor: '#D9FF67',
            }}
          >
            <Text style={{ fontSize: 18 }}>👤</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>
              {m.user?.displayName || m.displayName || 'Friend'}
            </Text>
            <Text style={{ color: '#8C7D9E', fontSize: 12 }}>
              @{m.user?.username || m.username || 'member'}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: m.role === 'OWNER' ? '#D9FF67' : '#160E24',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 8,
            }}
          >
            <Text
              style={{
                color: m.role === 'OWNER' ? '#24183B' : '#F4F0FF',
                fontSize: 10,
                fontWeight: '800',
              }}
            >
              {m.role || 'MEMBER'}
            </Text>
          </View>
        </View>
      ))}

      {/* Leave Room Option */}
      {!confirmLeave ? (
        <TouchableOpacity
          onPress={() => setConfirmLeave(true)}
          style={{
            marginTop: 24,
            padding: 14,
            borderRadius: 12,
            borderWidth: 1.5,
            borderColor: '#FF5C4D',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#FF5C4D', fontWeight: '800', fontSize: 14 }}>
            {isKn ? 'ಈ ಅಡ್ಡಾ ತೊರೆಯಿರಿ' : 'Leave Room'} 🚪
          </Text>
        </TouchableOpacity>
      ) : (
        <View
          style={{
            marginTop: 24,
            backgroundColor: '#351C24',
            padding: 16,
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: '#FF5C4D',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14, marginBottom: 12 }}>
            {isKn ? 'ಖಚಿತವಾಗಿ ಅಡ್ಡಾ ತೊರೆಯಲು ಬಯಸುವಿರಾ?' : 'Are you sure you want to leave?'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
            <TouchableOpacity
              onPress={() => setConfirmLeave(false)}
              style={{
                flex: 1,
                backgroundColor: '#352454',
                paddingVertical: 12,
                borderRadius: 10,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#F4F0FF', fontWeight: '700' }}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLeaveAdda}
              disabled={leaving}
              style={{
                flex: 1,
                backgroundColor: '#FF5C4D',
                paddingVertical: 12,
                borderRadius: 10,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>
                {leaving ? '...' : 'Yes, Leave'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
