import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { api } from '../../src/services/api';

export default function ChaosResponseScreen() {
  const { id: activityId } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [responseContent, setResponseContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!responseContent.trim()) {
      Alert.alert(t('common.error'), 'ನಿಮ್ಮ ಉತ್ತರವನ್ನು ಬರೆಯಿರಿ (Please enter your submission)');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/chaos/submit', {
        activityId,
        content: responseContent.trim(),
      });
      Alert.alert(t('common.success'), 'Chaos submission recorded! 🔥');
      router.back();
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#24183B', padding: 20 }}>
      <Text style={{ color: '#D9FF67', fontSize: 22, fontWeight: '900', marginBottom: 6 }}>
        {t('chaos.submitAnswer')} 🔥
      </Text>
      <Text style={{ color: '#F4F0FF', opacity: 0.8, fontSize: 13, marginBottom: 20 }}>
        Be funny, be unfiltered, be chaotic!
      </Text>

      <TextInput
        value={responseContent}
        onChangeText={setResponseContent}
        placeholder="ನಿಮ್ಮ ಉತ್ತರವನ್ನು ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ..."
        placeholderTextColor="#8C7D9E"
        multiline
        numberOfLines={4}
        style={{
          backgroundColor: '#352454',
          borderRadius: 14,
          padding: 16,
          color: '#FFFFFF',
          fontSize: 16,
          height: 120,
          textAlignVertical: 'top',
          borderWidth: 1.5,
          borderColor: '#47326B',
          marginBottom: 20,
        }}
      />

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={submitting}
        style={{
          backgroundColor: '#D9FF67',
          paddingVertical: 14,
          borderRadius: 12,
          alignItems: 'center',
        }}
      >
        {submitting ? (
          <ActivityIndicator color="#24183B" />
        ) : (
          <Text style={{ color: '#24183B', fontWeight: '800', fontSize: 15 }}>
            Submit & Roast 🚀
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

