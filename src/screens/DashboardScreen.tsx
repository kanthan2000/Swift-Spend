import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useStore } from '../store/useStore';
import { Transaction } from '../types';
import { Colors, Radius, Spacing } from '../theme/colors';

import TransactionsModal from '../components/TransactionsModal';

interface Props {
  onAddExpense: (type: 'DEBIT' | 'CREDIT') => void;
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

function formatCurrency(amount: number, showSign = false): string {
  const formatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (showSign) {
    return amount >= 0 ? `+${formatted}` : `-${formatted}`;
  }
  return formatted;
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

function getTransactionIcon(txn: Transaction) {
  const cat = CATEGORY_ICONS[txn.category] || CATEGORY_ICONS.Other;
  if (txn.transaction_type === 'CREDIT') {
    return { icon: 'briefcase', color: Colors.income, bg: Colors.incomeLight };
  }
  return cat;
}

export default function DashboardScreen({ onAddExpense }: Props) {
  const { dashboardSummary, transactions } = useStore();
  const [modalVisible, setModalVisible] = React.useState(false);
  const [modalType, setModalType] = React.useState<'DEBIT' | 'CREDIT' | null>(null);

  const openModal = (type: 'DEBIT' | 'CREDIT') => {
    setModalType(type);
    setModalVisible(true);
  };

  let balance = 0;
  if (currentAccount === 'All') {
    balance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  } else {
    const acc = accounts.find(a => a.name === currentAccount);
    balance = acc ? acc.balance : 0;
  }

  const income = dashboardSummary.totalIncome;
  const expenses = dashboardSummary.totalExpense;
  const recentTxns = transactions.slice(0, 4);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={require('../assets/user_avatar.png')}
              style={styles.avatar}
            />
            <Text style={styles.headerTitle}>Dashboard</Text>
          </View>
          <TouchableOpacity style={styles.bellButton}>
            <Icon name="bell-outline" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
        <Text style={styles.balanceAmount}>
          {formatCurrency(balance)}
        </Text>

        <View style={styles.summaryRow}>
          <TouchableOpacity style={styles.summaryCard} onPress={() => openModal('CREDIT')}>
            <Icon name="arrow-down" size={18} color={Colors.income} />
            <Text style={styles.summaryLabel}>INCOME</Text>
            <Text style={styles.incomeAmount}>
              {formatCurrency(income, true)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.summaryCard} onPress={() => openModal('DEBIT')}>
            <Icon name="arrow-up" size={18} color={Colors.expense} />
            <Text style={styles.summaryLabel}>EXPENSES</Text>
            <Text style={styles.expenseAmount}>
              -{formatCurrency(expenses)}
            </Text>
          </TouchableOpacity>
        </View>



        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>VIEW ALL</Text>
          </TouchableOpacity>
        </View>

        {recentTxns.map((txn) => {
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
                  {txn.category} • {formatDate(txn.transaction_time)}
                </Text>
              </View>
              <Text
                style={[
                  styles.txnAmount,
                  isCredit && styles.txnAmountCredit,
                ]}
              >
                {isCredit ? '+' : '-'}
                {formatCurrency(txn.amount)}
              </Text>
            </View>
          );
        })}

        <View style={styles.fabSpacer} />
      </ScrollView>

      <View style={styles.fabContainer}>
        <TouchableOpacity style={[styles.fab, styles.fabExpense]} onPress={() => onAddExpense('DEBIT')} activeOpacity={0.85}>
          <Icon name="minus" size={28} color={Colors.white} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.fab, styles.fabIncome]} onPress={() => onAddExpense('CREDIT')} activeOpacity={0.85}>
          <Icon name="plus" size={28} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <TransactionsModal
        visible={modalVisible}
        type={modalType}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}



const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    marginTop: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  bellButton: {
    padding: 4,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.6,
    marginTop: 8,
    marginBottom: 4,
  },
  incomeAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.income,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  viewAll: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.5,
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
    fontSize: 13,
    color: Colors.textMuted,
  },
  txnAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  txnAmountCredit: {
    color: Colors.income,
  },
  fabSpacer: {
    height: 60,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    flexDirection: 'row',
    gap: 16,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fabExpense: {
    backgroundColor: Colors.expense,
    shadowColor: Colors.expense,
  },
  fabIncome: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
  },
});
