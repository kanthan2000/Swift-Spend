import { Share, Alert } from 'react-native';
import { Transaction } from '../types';

export const exportTransactionsToCSV = async (transactions: Transaction[]) => {
  if (transactions.length === 0) {
    Alert.alert('No Data', 'There are no transactions to export.');
    return;
  }

  const escapeCSVField = (field: string | null | undefined): string => {
    if (field === null || field === undefined) return '""';
    const stringified = String(field);
    if (stringified.includes(',') || stringified.includes('"') || stringified.includes('\n')) {
      return `"${stringified.replace(/"/g, '""')}"`;
    }
    return stringified;
  };

  try {
    // CSV Header
    const headers = ['Date', 'Merchant', 'Category', 'Amount', 'Type', 'Source App', 'Raw Notification'];
    const rows = transactions.map((t) => [
      escapeCSVField(t.transaction_time),
      escapeCSVField(t.merchant),
      escapeCSVField(t.category),
      escapeCSVField(t.amount.toString()),
      escapeCSVField(t.transaction_type),
      escapeCSVField(t.source_app),
      escapeCSVField(t.raw_notification),
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    // Share the CSV data
    await Share.share({
      title: 'Expense_Export.csv',
      message: csvContent,
    });
  } catch (error: any) {
    Alert.alert('Export Failed', error.message || 'An error occurred while exporting.');
  }
};
