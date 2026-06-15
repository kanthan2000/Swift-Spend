import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useStore } from '../store/useStore';
import { Colors, Radius, Spacing } from '../theme/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const PRESET_ICONS = [
  'silverware-fork-knife', 'car', 'shopping', 'cash', 'drama-masks',
  'dots-horizontal', 'briefcase', 'store', 'gift', 'airplane',
  'home', 'heart', 'baby-carriage', 'book-open-variant', 'gamepad-variant'
];

const PRESET_COLORS = [
  Colors.primary, Colors.expense, Colors.income, '#8B5CF6', '#F59E0B',
  '#EC4899', '#06B6D4', '#10B981', '#F43F5E', '#64748B'
];

export default function CategoriesModal({ visible, onClose }: Props) {
  const { categories, addCategory } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState(PRESET_ICONS[0]);
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [newType, setNewType] = useState<'DEBIT' | 'CREDIT'>('DEBIT');

  const handleSave = async () => {
    if (!newName.trim()) return;
    await addCategory(newName.trim(), newIcon, newColor, newType);
    setNewName('');
    setIsAdding(false);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Icon name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Categories</Text>
          <TouchableOpacity onPress={() => setIsAdding(!isAdding)} style={styles.closeBtn}>
            <Icon name={isAdding ? "minus" : "plus"} size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {isAdding ? (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.addSection}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Category Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Subscriptions"
                value={newName}
                onChangeText={setNewName}
                autoFocus
              />

              <Text style={styles.label}>Type</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity 
                  style={[styles.typeBtn, newType === 'DEBIT' && styles.typeBtnExpense]} 
                  onPress={() => setNewType('DEBIT')}
                >
                  <Text style={[styles.typeText, newType === 'DEBIT' && styles.typeTextActive]}>Expense</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.typeBtn, newType === 'CREDIT' && styles.typeBtnIncome]} 
                  onPress={() => setNewType('CREDIT')}
                >
                  <Text style={[styles.typeText, newType === 'CREDIT' && styles.typeTextActive]}>Income</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Icon</Text>
              <View style={styles.iconGrid}>
                {PRESET_ICONS.map(icon => (
                  <TouchableOpacity 
                    key={icon} 
                    style={[styles.iconOption, newIcon === icon && styles.iconOptionActive]}
                    onPress={() => setNewIcon(icon)}
                  >
                    <Icon name={icon} size={24} color={newIcon === icon ? Colors.primary : Colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Color</Text>
              <View style={styles.iconGrid}>
                {PRESET_COLORS.map(color => (
                  <TouchableOpacity 
                    key={color} 
                    style={[styles.colorOption, newColor === color && styles.colorOptionActive]}
                    onPress={() => setNewColor(color)}
                  >
                    <View style={[styles.colorCircle, { backgroundColor: color }]} />
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Save Category</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        ) : (
          <ScrollView contentContainerStyle={styles.scroll}>
            {categories.map(cat => (
              <View key={cat.id} style={styles.catCard}>
                <View style={[styles.catIcon, { backgroundColor: `${cat.color}20` }]}>
                  <Icon name={cat.icon || 'star'} size={24} color={cat.color || Colors.primary} />
                </View>
                <View style={styles.catInfo}>
                  <Text style={styles.catName}>{cat.name}</Text>
                  <Text style={styles.catType}>{cat.type === 'CREDIT' ? 'Income' : 'Expense'}</Text>
                </View>
              </View>
            ))}
            {categories.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No custom categories yet.</Text>
              </View>
            )}
          </ScrollView>
        )}
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
  catCard: {
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
  catIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  catInfo: {
    flex: 1,
  },
  catName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  catType: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  addSection: {
    flex: 1,
    padding: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: 14,
    fontSize: 16,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
  },
  typeBtnExpense: {
    backgroundColor: Colors.expense,
    borderColor: Colors.expense,
  },
  typeBtnIncome: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  typeTextActive: {
    color: Colors.white,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconOption: {
    width: 50,
    height: 50,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  colorOption: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionActive: {
    backgroundColor: '#F3F4F6',
    borderRadius: Radius.md,
  },
  colorCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: Radius.lg,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 40,
  },
  saveBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textMuted,
  },
});
