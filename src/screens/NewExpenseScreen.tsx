import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useStore } from '../store/useStore';
import { Colors, Radius, Spacing } from '../theme/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
  defaultType?: 'DEBIT' | 'CREDIT';
}

const EXPENSE_CATEGORIES = [
  { name: 'Food', icon: 'silverware-fork-knife' },
  { name: 'Transport', icon: 'car' },
  { name: 'Bills', icon: 'cash' },
  { name: 'Shopping', icon: 'shopping' },
  { name: 'Fun', icon: 'drama-masks' },
  { name: 'Other', icon: 'dots-horizontal' },
];

const INCOME_CATEGORIES = [
  { name: 'Salary', icon: 'briefcase' },
  { name: 'Business', icon: 'store' },
  { name: 'Gifts', icon: 'gift' },
  { name: 'Other Income', icon: 'cash-multiple' },
];

export default function NewExpenseScreen({ visible, onClose, defaultType = 'DEBIT' }: Props) {
  const { addTransaction, accounts, currentAccount } = useStore();
  const [amount, setAmount] = useState('');
  
  const categoriesList = defaultType === 'CREDIT' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const [category, setCategory] = useState(categoriesList[0].name);
  const [note, setNote] = useState('');
  const [showAccountSelector, setShowAccountSelector] = useState(false);

  const [accountName, setAccountName] = useState(
    currentAccount !== 'All'
      ? currentAccount
      : accounts[0]?.name || ''
  );

  React.useEffect(() => {
    if (visible) {
      setCategory(categoriesList[0].name);
    }
  }, [visible, defaultType]);

  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1]?.length > 2) return;
    setAmount(cleaned);
  };

  const adjustAmount = (delta: number) => {
    const current = parseFloat(amount) || 0;
    const next = Math.max(0, current + delta);
    setAmount(next.toFixed(2));
  };

  const handleSave = async () => {
    const value = parseFloat(amount);
    if (!value || value <= 0) return;

    if (defaultType === 'DEBIT') {
      const selectedAccount = accounts.find(a => a.name === accountName);
      const currentBalance = selectedAccount ? selectedAccount.balance : 0;
      if (value > currentBalance) {
        Alert.alert(
          'Insufficient Balance',
          `Your expense amount (${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}) exceeds the current balance of ${accountName} (${currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}).`
        );
        return;
      }
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    await addTransaction({
      amount: value,
      transaction_type: defaultType,
      merchant: note.trim() || category,
      category,
      source_app: 'Manual',
      transaction_time: nowStr,
      raw_notification: note.trim() || `Manual ${category} expense`,
      account_name: accountName,
    });

    setAmount('');
    setCategory(categoriesList[0].name);
    setNote('');
    onClose();
  };

  const handleClose = () => {
    setAmount('');
    setCategory(categoriesList[0].name);
    setNote('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
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
            <View style={styles.header}>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <Icon name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>
                {defaultType === 'CREDIT' ? 'New Income' : 'New Expense'}
              </Text>
              <View style={styles.closeBtn} />
            </View>

            <Text style={styles.amountLabel}>ENTER AMOUNT</Text>
            <View style={styles.amountRow}>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={handleAmountChange}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={Colors.textLight}
              />
              <View style={styles.steppers}>
                <TouchableOpacity onPress={() => adjustAmount(1)}>
                  <Icon name="chevron-up" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => adjustAmount(-1)}>
                  <Icon name="chevron-down" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.chipRow}>
              <TouchableOpacity style={styles.chip}>
                <Icon name="calendar" size={18} color={Colors.primary} />
                <Text style={styles.chipText}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.chip} onPress={() => setShowAccountSelector(true)}>
                <Icon name="bank" size={18} color={defaultType === 'CREDIT' ? Colors.primary : Colors.expense} />
                <Text style={styles.chipText}>{accountName || 'Select Account'}</Text>
                <Icon name="chevron-down" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionLabel}>SELECT CATEGORY</Text>
            <View style={styles.categoryGrid}>
              {categoriesList.map((cat) => {
                const isSelected = category === cat.name;
                return (
                  <TouchableOpacity
                    key={cat.name}
                    style={[styles.categoryCard, isSelected && styles.categoryCardActive]}
                    onPress={() => setCategory(cat.name)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.categoryIconWrap,
                        isSelected && styles.categoryIconWrapActive,
                      ]}
                    >
                      <Icon
                        name={cat.icon}
                        size={24}
                        color={isSelected ? Colors.white : Colors.textSecondary}
                      />
                    </View>
                    <Text
                      style={[
                        styles.categoryName,
                        isSelected && styles.categoryNameActive,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TextInput
              style={styles.noteInput}
              placeholder="What's this for? (Optional)"
              placeholderTextColor={Colors.textLight}
              value={note}
              onChangeText={setNote}
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <Text style={styles.saveButtonText}>
                {defaultType === 'CREDIT' ? 'Save Income' : 'Save Expense'}
              </Text>
              <Icon name="check-circle" size={20} color={Colors.white} />
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Account Selector Modal */}
      <Modal visible={showAccountSelector} transparent={true} animationType="fade">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowAccountSelector(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Account</Text>
            {accounts.map(acc => (
              <TouchableOpacity
                key={acc.name}
                style={styles.accountOption}
                onPress={() => {
                  setAccountName(acc.name);
                  setShowAccountSelector(false);
                }}
              >
                <Icon name="bank" size={20} color={Colors.primary} />
                <Text style={styles.accountOptionText}>{acc.name}</Text>
                {accountName === acc.name && (
                  <Icon name="check" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.backgroundAlt,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    marginTop: 8,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  currencySymbol: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.primary,
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 40,
    fontWeight: '700',
    color: Colors.textLight,
    padding: 0,
  },
  steppers: {
    gap: 0,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.lg,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.pill,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: Spacing.md,
  },
  categoryCard: {
    width: '30%',
    flexGrow: 1,
    maxWidth: '31%',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  categoryCardActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
  },
  categoryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryIconWrapActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  categoryNameActive: {
    color: Colors.white,
  },
  noteInput: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  saveButton: {
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
  saveButtonText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.white,
    width: '100%',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  accountOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  accountOptionText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
});
