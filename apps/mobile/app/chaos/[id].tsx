import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { api } from '../../src/services/api';
import {
  MainLayout,
  PageHeader,
  GlassCard,
  PrimaryButton,
  SecondaryButton,
  InputField,
  ToastNotification,
} from '../../src/components/DesignSystem';

export default function ChaosResponseScreen() {
  const { id: activityId } = useLocalSearchParams<{ id: string }>();
  const { i18n } = useTranslation();
  const router = useRouter();

  const [responseContent, setResponseContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isKn = i18n.language === 'kn';

  const handleSubmit = async () => {
    if (!responseContent.trim()) {
      setToastMessage(isKn ? 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಉತ್ತರ ಬರೆಯಿರಿ' : 'Please enter your response');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/chaos/submit', {
        activityId,
        content: responseContent.trim(),
      });
      setToastMessage(isKn ? 'ಉತ್ತರ ದಾಖಲಾಗಿದೆ! 🔥' : 'Submission recorded! 🔥');
      setTimeout(() => router.back(), 700);
    } catch (e: any) {
      setToastMessage(e.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <ToastNotification
        visible={Boolean(toastMessage)}
        message={toastMessage || ''}
        onDismiss={() => setToastMessage(null)}
      />

      <PageHeader
        title={isKn ? 'ಕೆಯೋಸ್ ಪ್ರತಿಕ್ರಿಯೆ' : 'Daily Challenge Entry'}
        subtitle={isKn ? 'ನಿಮ್ಮ ಉತ್ತರವನ್ನು ಇಲ್ಲಿ ಸಲ್ಲಿಸಿ' : 'Submit your quick entry for this daily challenge'}
        actions={
          <SecondaryButton
            title={isKn ? '‹ ಹಿಂತಿರುಗಿ' : '‹ Back'}
            onPress={() => router.back()}
          />
        }
      />

      <View style={{ maxWidth: 540, width: '100%', alignSelf: 'center' }}>
        <GlassCard elevated>
          <InputField
            label={isKn ? 'ನಿಮ್ಮ ಉತ್ತರ (Response) *' : 'Your Response *'}
            value={responseContent}
            onChangeText={setResponseContent}
            placeholder={isKn ? 'ನಿಮ್ಮ ಉತ್ತರವನ್ನು ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ...' : 'Type your answer or action note here...'}
            multiline
            numberOfLines={4}
          />

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <SecondaryButton
              title={isKn ? 'ರದ್ದು' : 'Cancel'}
              onPress={() => router.back()}
              style={{ flex: 1 }}
            />
            <PrimaryButton
              title={isKn ? 'ಸಲ್ಲಿಸಿ 🔥' : 'Submit Entry 🔥'}
              onPress={handleSubmit}
              loading={submitting}
              style={{ flex: 1 }}
            />
          </View>
        </GlassCard>
      </View>
    </MainLayout>
  );
}
