import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Svg, { Circle, G } from 'react-native-svg';
import { useStore } from '../store/useStore';
import { Colors, Radius, Spacing } from '../theme/colors';

interface Props {
  onAddExpense: () => void;
}

const CHART_COLORS = [Colors.chartBlue, Colors.chartGreen, Colors.chartRed, Colors.chartGray, Colors.primary, Colors.expense];

function DonutChart({ data, total }: { data: { amount: number }[]; total: number }) {
  const size = 180;
  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <View style={styles.donutContainer}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {data.map((item, i) => {
            const pct = item.amount / total;
            const dash = pct * circumference;
            const currentOffset = offset;
            offset += dash;
            return (
              <Circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-currentOffset}
                strokeLinecap="butt"
              />
            );
          })}
        </G>
      </Svg>
      <View style={styles.donutCenter}>
        <Text style={styles.donutLabel}>Total</Text>
        <Text style={styles.donutTotal}>{total.toLocaleString()}</Text>
      </View>
    </View>
  );
}

export default function ReportsScreen({ onAddExpense }: Props) {
  const [period, setPeriod] = useState<'Monthly' | 'Yearly'>('Monthly');
  const { categorySummary, monthlyTrend } = useStore();

  const categories = categorySummary.length > 0 ? categorySummary : [];
  const total = categories.reduce((sum, c) => sum + c.amount, 0) || 0;
  
  const topCategories = categorySummary
    .slice(0, 3)
    .map((c, i) => ({
      category: c.category,
      amount: c.amount,
      color: CHART_COLORS[i % CHART_COLORS.length],
      icon: 'star',
      bg: '#EFF6FF'
    }));

  const maxTop = topCategories.length > 0 ? Math.max(...topCategories.map((c) => c.amount)) : 1;

  // Monthly trend calculations
  const thisMonthStr = new Date().toISOString().substring(0, 7);
  const lastMonthDate = new Date();
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonthStr = lastMonthDate.toISOString().substring(0, 7);

  const thisMonthData = monthlyTrend.find(t => t.date === thisMonthStr) || { income: 0, expense: 0 };
  const lastMonthData = monthlyTrend.find(t => t.date === lastMonthStr) || { income: 0, expense: 0 };
  
  const spendDiff = thisMonthData.expense - lastMonthData.expense;
  const spendPct = lastMonthData.expense > 0 ? (Math.abs(spendDiff) / lastMonthData.expense) * 100 : 0;
  const isLess = spendDiff <= 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.profileIcon}>
            <Icon name="account" size={22} color={Colors.primary} />
          </View>
          <Text style={styles.headerTitle}>Reports</Text>
          <TouchableOpacity>
            <Icon name="magnify" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.periodToggle}>
          {(['Monthly', 'Yearly'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodBtn, period === p && styles.periodBtnActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Where did my money go?</Text>
          <DonutChart data={categories} total={total} />
          <View style={styles.legendGrid}>
            {categories.map((item, i) => (
              <View key={item.category} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: CHART_COLORS[i] }]} />
                <Text style={styles.legendLabel}>{item.category}</Text>
                <Text style={styles.legendAmount}>{item.amount.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Vs Last Month</Text>
          <Text style={styles.cardSubtitle}>
            {isLess ? "You've spent less this month!" : "You've spent more this month!"}
          </Text>
          <View style={styles.compareRow}>
            <View style={styles.compareItem}>
              <Text style={styles.compareMonth}>Last Month</Text>
              <Text style={styles.compareAmount}>{lastMonthData.expense.toLocaleString()}</Text>
              <View style={[styles.compareBar, styles.compareBarInactive]} />
            </View>
            <View style={styles.compareItem}>
              <Text style={[styles.compareMonth, styles.compareMonthActive]}>This Month</Text>
              <Text style={[styles.compareAmount, styles.compareAmountActive]}>{thisMonthData.expense.toLocaleString()}</Text>
              <View style={[styles.compareBar, styles.compareBarActive]} />
            </View>
          </View>
          <View style={styles.decreaseRow}>
            <Icon name={isLess ? "arrow-bottom-right" : "arrow-top-right"} size={16} color={isLess ? Colors.income : Colors.expense} />
            <Text style={[styles.decreaseText, !isLess && { color: Colors.expense }]}>
              {spendPct.toFixed(0)}% {isLess ? 'decrease' : 'increase'} in spending
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.cardTitle}>Top Spending Categories</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {topCategories.map((cat) => (
            <View key={cat.category} style={styles.topItem}>
              <View style={[styles.topIcon, { backgroundColor: cat.bg }]}>
                <Icon name={cat.icon} size={18} color={cat.color} />
              </View>
              <View style={styles.topInfo}>
                <View style={styles.topRow}>
                  <Text style={styles.topName}>{cat.category}</Text>
                  <Text style={styles.topAmount}>
                    {cat.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Text>
                </View>
                <View style={styles.topTrack}>
                  <View
                    style={[
                      styles.topFill,
                      {
                        width: `${(cat.amount / maxTop) * 100}%`,
                        backgroundColor: cat.color,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.fabSpacer} />
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={onAddExpense} activeOpacity={0.85}>
        <Icon name="plus" size={28} color={Colors.white} />
      </TouchableOpacity>
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
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    marginTop: 8,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  periodToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.borderLight,
    borderRadius: Radius.pill,
    padding: 4,
    marginBottom: Spacing.md,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: Radius.pill,
  },
  periodBtnActive: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  periodTextActive: {
    color: Colors.primaryDark,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  donutContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  donutLabel: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  donutTotal: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendItem: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  legendAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  compareRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  compareItem: {
    flex: 1,
  },
  compareMonth: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  compareMonthActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  compareAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  compareAmountActive: {
    color: Colors.primary,
  },
  compareBar: {
    height: 8,
    borderRadius: 4,
  },
  compareBarInactive: {
    backgroundColor: Colors.border,
  },
  compareBarActive: {
    backgroundColor: Colors.primary,
  },
  decreaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
  },
  decreaseText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.income,
  },
  savingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  badge: {
    backgroundColor: Colors.incomeLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.income,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 140,
    paddingTop: 16,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 40,
    backgroundColor: '#BFDBFE',
    borderRadius: 8,
    marginBottom: 8,
  },
  barActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  barLabel: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  barLabelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  topItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  topIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topInfo: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  topName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  topAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  topTrack: {
    height: 6,
    backgroundColor: Colors.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  topFill: {
    height: '100%',
    borderRadius: 3,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 12,
    gap: 12,
    alignItems: 'flex-start',
  },
  tipIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
  },
  fabSpacer: {
    height: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
