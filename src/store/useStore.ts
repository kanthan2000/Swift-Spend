import { create } from 'zustand';
import { NativeModules } from 'react-native';
import { Transaction, Category, MerchantMapping, DashboardSummary } from '../types';
import { dbService } from '../services/database/db';
import { parseNotification } from '../services/parser/parser';

const { NotificationPermission } = NativeModules;

interface AppState {
  transactions: Transaction[];
  categories: Category[];
  merchantMappings: MerchantMapping[];
  trackingEnabled: boolean;
  permissionGranted: boolean;
  dashboardSummary: DashboardSummary;
  categorySummary: { category: string; amount: number }[];
  monthlyTrend: { date: string; income: number; expense: number }[];
  topMerchants: { merchant: string; amount: number }[];
  isLoading: boolean;

  // New properties for onboarding and accounts
  userName: string | null;
  isOnboarded: boolean;
  accounts: { name: string; opening_balance: number; balance: number }[];
  currentAccount: string;

  // Actions
  fetchData: (filters?: { search?: string; category?: string; type?: 'DEBIT' | 'CREDIT'; accountName?: string }) => Promise<void>;
  checkTrackingAndPermission: () => Promise<void>;
  setTrackingEnabled: (enabled: boolean) => Promise<void>;
  requestPermission: () => void;
  
  // Transaction actions
  addTransaction: (txn: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  clearDatabase: () => Promise<void>;

  // Mapping actions
  addMerchantMapping: (merchantName: string, categoryName: string) => Promise<void>;
  deleteMerchantMapping: (id: string) => Promise<void>;
  addCategory: (name: string, icon: string, color: string, type?: 'DEBIT' | 'CREDIT') => Promise<void>;

  // Simulator
  simulateNotification: (title: string, body: string, appName?: string) => Promise<boolean>;

  // Onboarding & Accounts actions
  completeOnboarding: (name: string, firstAccountName: string, openingBalance: number) => Promise<void>;
  addAccount: (name: string, openingBalance: number) => Promise<void>;
  deleteAccount: (name: string) => Promise<void>;
  setCurrentAccount: (name: string) => void;
  resetOnboarding: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  transactions: [],
  categories: [],
  merchantMappings: [],
  trackingEnabled: true,
  permissionGranted: false,
  dashboardSummary: { totalIncome: 0, totalExpense: 0, balance: 0 },
  categorySummary: [],
  monthlyTrend: [],
  topMerchants: [],
  isLoading: false,

  // Initial onboarding & accounts state
  userName: null,
  isOnboarded: false,
  accounts: [],
  currentAccount: 'All',

  fetchData: async (filters) => {
    set({ isLoading: true });
    try {
      // Run database initialization migrations
      await dbService.initDb();

      // Fetch onboarding status & username
      const onboardedStr = await dbService.getSetting('isOnboarded');
      const onboarded = onboardedStr === 'true';
      const userName = await dbService.getSetting('userName');

      // Fetch accounts
      const accountsList = await dbService.getAccounts();

      // If no filters are provided, check if we should filter by currentAccount
      const activeAccount = filters?.accountName || get().currentAccount;
      const accountFilter = activeAccount === 'All' ? undefined : activeAccount;

      // Fetch database transactions and details
      const txns = await dbService.getTransactions({
        ...filters,
        accountName: accountFilter
      });
      const cats = await dbService.getCategories();
      const mappings = await dbService.getMerchantMappings();
      
      const currentMonth = new Date().toISOString().substring(0, 7);
      const summary = await dbService.getDashboardSummary(currentMonth, accountFilter);
      const catSum = await dbService.getCategorySummary(currentMonth, accountFilter);
      const trend = await dbService.getMonthlyTrend(currentMonth, accountFilter);
      const topMerch = await dbService.getTopMerchants(currentMonth, 5, accountFilter);

      set({
        transactions: txns,
        categories: cats,
        merchantMappings: mappings,
        dashboardSummary: summary,
        categorySummary: catSum,
        monthlyTrend: trend,
        topMerchants: topMerch,
        isOnboarded: onboarded,
        userName: userName,
        accounts: accountsList
      });
    } catch (error) {
      console.error('Error fetching data from database:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  checkTrackingAndPermission: async () => {
    if (!NotificationPermission) return;
    try {
      const isGranted = await NotificationPermission.isPermissionGranted();
      const isEnabled = await NotificationPermission.isTrackingEnabled();
      set({
        permissionGranted: isGranted,
        trackingEnabled: isEnabled,
      });
    } catch (e) {
      console.error('Error checking permission/tracking:', e);
    }
  },

  setTrackingEnabled: async (enabled: boolean) => {
    if (!NotificationPermission) return;
    try {
      await NotificationPermission.setTrackingEnabled(enabled);
      set({ trackingEnabled: enabled });
    } catch (e) {
      console.error('Error toggling tracking state:', e);
    }
  },

  requestPermission: () => {
    if (!NotificationPermission) return;
    NotificationPermission.requestPermission();
  },

  addTransaction: async (txn) => {
    // If no account is specified, default to the current active account or the first available account
    const activeAccount = txn.account_name || (get().currentAccount !== 'All' ? get().currentAccount : (get().accounts[0]?.name || ''));
    await dbService.saveTransaction({
      ...txn,
      account_name: activeAccount
    });
    await get().fetchData();
  },

  deleteTransaction: async (id) => {
    await dbService.deleteTransaction(id);
    await get().fetchData();
  },

  clearDatabase: async () => {
    await dbService.clearDatabase();
    await get().fetchData();
  },

  addMerchantMapping: async (merchantName, categoryName) => {
    await dbService.saveMerchantMapping(merchantName, categoryName);
    await get().fetchData();
  },

  deleteMerchantMapping: async (id) => {
    await dbService.deleteMerchantMapping(id);
    await get().fetchData();
  },

  addCategory: async (name, icon, color, type = 'DEBIT') => {
    await dbService.saveCategory(name, icon, color, type);
    await get().fetchData();
  },

  simulateNotification: async (title, body, appName = 'GPay') => {
    const mappings = get().merchantMappings;
    const parsed = parseNotification(title, body, appName, mappings);
    
    if (parsed) {
      const defaultAccount = get().accounts[0]?.name || '';
      await dbService.saveTransaction({
        amount: parsed.amount,
        transaction_type: parsed.transactionType,
        merchant: parsed.merchant,
        category: parsed.category,
        source_app: parsed.sourceApp,
        transaction_time: parsed.timestamp,
        raw_notification: `${title}: ${body}`,
        account_name: defaultAccount
      });
      await get().fetchData();
      return true;
    }
    return false;
  },

  // Onboarding & Accounts actions
  completeOnboarding: async (name, firstAccountName, openingBalance) => {
    set({ isLoading: true });
    try {
      // 1. Save settings
      await dbService.saveSetting('userName', name);
      await dbService.saveSetting('isOnboarded', 'true');

      // 2. Save account
      await dbService.saveAccount(firstAccountName, openingBalance);

      // 3. (Removed) We no longer create a CREDIT transaction for the opening balance.
      // The balance will be calculated as opening_balance + income - expense.

      set({
        userName: name,
        isOnboarded: true,
        currentAccount: firstAccountName
      });
      
      // Refresh database records
      await get().fetchData();
    } catch (e) {
      console.error('Error completing onboarding:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  addAccount: async (name, openingBalance) => {
    set({ isLoading: true });
    try {
      await dbService.saveAccount(name, openingBalance);
      // Removed CREDIT transaction insertion for opening balance
      await get().fetchData();
    } catch (e) {
      console.error('Error adding account:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  deleteAccount: async (name) => {
    set({ isLoading: true });
    try {
      await dbService.deleteAccount(name);
      // If we deleted our current account, set to All or another account
      const current = get().currentAccount;
      if (current === name) {
        set({ currentAccount: 'All' });
      }
      await get().fetchData();
    } catch (e) {
      console.error('Error deleting account:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  setCurrentAccount: (name) => {
    set({ currentAccount: name });
    get().fetchData();
  },

  resetOnboarding: async () => {
    set({ isLoading: true });
    try {
      await dbService.clearDatabase();
      set({
        userName: null,
        isOnboarded: false,
        accounts: [],
        currentAccount: 'All',
        transactions: [],
        dashboardSummary: { totalIncome: 0, totalExpense: 0, balance: 0 },
        categorySummary: [],
        monthlyTrend: [],
        topMerchants: []
      });
      // Run initDb to recreate empty tables
      await dbService.initDb();
    } catch (e) {
      console.error('Error resetting onboarding:', e);
    } finally {
      set({ isLoading: false });
    }
  }
}));
