import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useStore } from '../store/useStore';
import { Transaction } from '../types';
import { Colors, Radius, Spacing } from '../theme/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
  type: 'DEBIT' | 'CREDIT' | null;
}

const CATEGORY_ICONS: Record<string, { icon: string; color: string; bg: string }> = {
  Food: { icon: 'silverware-fork-knife', color: Colors.textSecondary, bg: '#F3F4F6' },
  'Food & Drink': { icon: 'silverware-fork-knife', color: Colors.textSecondary, bg: '#F3F4F6' },
  Transport: { icon: 'car', color: Colors.textSecondary, bg: '#F3F4F6' },
  Electronics: { icon: 'shopping', color: Colors.textSecondary, bg: '#F3F4F6' },
  Salary: { icon: 'briefcase', color: Colors.income, bg: Colors.incomeLight },
  Income: { icon: 'briefcase', color: Colors.income, bg: Colors.incomeLight },
  Shopping: { icon: 'shopping', color: Colors.textSecondary, bg: '#F3F4F6' },
  Bills: { icon: 'cash', color: Colors.textSecondary, bg: '#F3F4F6' },
  Fun: { icon: 'drama-masks', color: Colors.textSecondary, bg: '#F3F4F6' },
  Other: { icon: 'dots-horizontal', color: Colors.textSecondary, bg: '#F3F4F6' },
};

function getTransactionIcon(txn: Transaction) {
  const cat = CATEGORY_ICONS[txn.category] || CATEGORY_ICONS.Other;
  if (txn.transaction_type === 'CREDIT') {
    return { icon: 'briefcase', color: Colors.income, bg: Colors.incomeLight };
  }
  return cat;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr.replace(' ', 'T'));
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function TransactionsModal({ visible, onClose, type }: Props) {
  const { transactions } = useStore();
  const [filterCategory, setFilterCategory] = React.useState<string>('All');
  
  const typeFiltered = transactions.filter(t => t.transaction_type === type);
  
  // Extract unique categories from the filtered transactions
  const availableCategories = ['All', ...Array.from(new Set(typeFiltered.map(t => t.category)))];

  const filteredTransactions = typeFiltered.filter(t => filterCategory === 'All' || t.category === filterCategory);
  const title = type === 'CREDIT' ? 'Income Details' : 'Expense Details';

  // Reset filter when modal is opened
  React.useEffect(() => {
    if (visible) {
      setFilterCategory('All');
    }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Icon name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.closeBtn} />
        </View>

        <View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.filterScroll}
          >
            {availableCategories.map(cat => (
              <TouchableOpacity 
                key={cat} 
                style={[styles.filterPill, filterCategory === cat && styles.filterPillActive]}
                onPress={() => setFilterCategory(cat)}
              >
                <Text style={[styles.filterText, filterCategory === cat && styles.filterTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          {filteredTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="text-box-search-outline" size={48} color={Colors.textLight} />
              <Text style={styles.emptyText}>No transactions found</Text>
            </View>
          ) : (
            filteredTransactions.map(txn => {
              const iconInfo = getTransactionIcon(txn);
              const isCredit = txn.transaction_type === 'CREDIT';
              return (
                <View key={txn.id} style={styles.txnCard}>
                  <View style={[styles.txnIcon, { backgroundColor: iconInfo.bg }]}>
                    <Icon name={iconInfo.icon} size={20} color={iconInfo.color} />
                  </View>
                  <View style={styles.txnInfo}>
                    <Text style={styles.txnMerchant}>{txn.merchant}</Text>
                    <Text style={styles.txnMeta}>
                      {txn.category} • {txn.account_name} • {formatDate(txn.transaction_time)}
                    </Text>
                  </View>
                  <Text style={[styles.txnAmount, isCredit && styles.txnAmountCredit]}>
                    {isCredit ? '+' : '-'}{Math.abs(txn.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.backgroundAlt,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
    color: Colors.text,
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingBottom: 40,
  },
  txnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  txnIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txnInfo: {
    flex: 1,
  },
  txnMerchant: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  txnMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  txnAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  txnAmountCredit: {
    color: Colors.income,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    color: Colors.textMuted,
  },
  filterScroll: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.white,
  },
});
