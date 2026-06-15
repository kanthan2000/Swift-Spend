import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import StepProgressBar from '../components/StepProgressBar';
import { Colors, Radius, Spacing } from '../theme/colors';

interface Props {
  onComplete: (accountName: string, openingBalance: number) => void;
}

export default function AddAccountScreen({ onComplete }: Props) {
  const [accountName, setAccountName] = useState('');
  const [balance, setBalance] = useState('0.00');

  const handleBalanceChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1]?.length > 2) return;
    setBalance(cleaned);
  };

  const handleSubmit = () => {
    const name = accountName.trim();
    if (!name) return;
    const amount = parseFloat(balance) || 0;
    onComplete(name, amount);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <StepProgressBar currentStep={2} />

          <Text style={styles.title}>Add your first account</Text>
          <Text style={styles.subtitle}>
            Give it a name and set the starting amount to begin tracking.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>ACCOUNT NAME</Text>
            <View style={styles.inputCard}>
              <Icon name="bank" size={22} color={Colors.primary} />
              <TextInput
                style={styles.accountInput}
                placeholder="e.g. Everyday Spending"
                placeholderTextColor={Colors.textLight}
                value={accountName}
                onChangeText={setAccountName}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>OPENING BALANCE</Text>
            <View style={styles.inputCard}>
              <TextInput
                style={styles.balanceInput}
                value={balance}
                onChangeText={handleBalanceChange}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={Colors.textLight}
              />
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={[styles.infoCard, styles.securityCard]}>
              <Icon name="lock" size={22} color={Colors.primary} />
              <Text style={styles.securityText}>
                Your data is stored locally and securely.
              </Text>
            </View>
            <View style={[styles.infoCard, styles.efficiencyCard]}>
              <Icon name="speedometer" size={22} color={Colors.income} />
              <Text style={styles.efficiencyText}>
                Set it up once, track in seconds daily.
              </Text>
            </View>
          </View>

          <View style={styles.imageContainer}>
            <Image
              source={require('../assets/wallet_and_phone.png')}
              style={styles.heroImage}
              resizeMode="cover"
            />
          </View>

          <TouchableOpacity
            style={[styles.startButton, !accountName.trim() && styles.startButtonDisabled]}
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={!accountName.trim()}
          >
            <Text style={styles.startButtonText}>Start Tracking</Text>
            <Icon name="arrow-right" size={20} color={Colors.white} />
          </TouchableOpacity>

          <Text style={styles.footerNote}>
            You can add more accounts later in settings
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  fieldGroup: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  accountInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    padding: 0,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  balanceInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textMuted,
    padding: 0,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.md,
  },
  infoCard: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: 14,
    minHeight: 110,
    justifyContent: 'space-between',
  },
  securityCard: {
    backgroundColor: '#EEF2FF',
  },
  efficiencyCard: {
    backgroundColor: '#F0FDF4',
  },
  securityText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.cardBlueText,
    lineHeight: 18,
    marginTop: 12,
  },
  efficiencyText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.cardGreenText,
    lineHeight: 18,
    marginTop: 12,
  },
  imageContainer: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    height: 140,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingVertical: 16,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '600',
  },
  startButtonDisabled: {
    opacity: 0.5,
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 12,
  },
});
