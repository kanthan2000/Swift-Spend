export interface Transaction {
  id: string;
  amount: number;
  transaction_type: 'DEBIT' | 'CREDIT';
  merchant: string;
  category: string;
  source_app: string;
  transaction_time: string;
  raw_notification: string;
  sync_status: number;
  external_id?: string | null;
  device_id?: string | null;
  account_name?: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface MerchantMapping {
  id: string;
  merchant_name: string;
  category_name: string;
}

export interface DashboardSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}
