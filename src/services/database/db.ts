import { NativeModules } from 'react-native';
import { Transaction, Category, MerchantMapping, DashboardSummary } from '../../types';

const { NativeDatabase } = NativeModules;

if (!NativeDatabase) {
  console.warn('NativeDatabase module not found! Ensure native code is built correctly.');
}

export const dbService = {
  /**
   * Execute raw SQL against the SQLite database
   */
  async execute(sql: string, params: any[] = []): Promise<any> {
    if (!NativeDatabase) {
      throw new Error('NativeDatabase module is not available');
    }
    return NativeDatabase.executeSql(sql, params);
  },

  /**
   * Initialize custom tables and migrations
   */
  async initDb(): Promise<void> {
    try {
      // 1. Create accounts table
      await this.execute(`
        CREATE TABLE IF NOT EXISTS accounts (
          name TEXT PRIMARY KEY,
          opening_balance REAL NOT NULL,
          created_at TEXT NOT NULL
        );
      `);

      // 2. Create user_settings table
      await this.execute(`
        CREATE TABLE IF NOT EXISTS user_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);

      // 3. Alter transactions table to add account_name
      try {
        await this.execute(`
          ALTER TABLE transactions ADD COLUMN account_name TEXT DEFAULT '';
        `);
      } catch (err) {
        // Column probably already exists, which is expected on subsequent runs
      }
    } catch (e) {
      console.error('Error during database initialization migrations:', e);
    }
  },

  /**
   * Fetch transactions based on filter parameters
   */
  async getTransactions(filters?: {
    search?: string;
    category?: string;
    type?: 'DEBIT' | 'CREDIT';
    startDate?: string;
    endDate?: string;
    accountName?: string;
  }): Promise<Transaction[]> {
    let sql = 'SELECT * FROM transactions WHERE 1=1';
    const params: any[] = [];

    if (filters) {
      if (filters.search) {
        sql += ' AND merchant LIKE ?';
        params.push(`%${filters.search}%`);
      }
      if (filters.category) {
        sql += ' AND category = ?';
        params.push(filters.category);
      }
      if (filters.type) {
        sql += ' AND transaction_type = ?';
        params.push(filters.type);
      }
      if (filters.startDate) {
        sql += ' AND transaction_time >= ?';
        params.push(filters.startDate);
      }
      if (filters.endDate) {
        sql += ' AND transaction_time <= ?';
        params.push(filters.endDate);
      }
      if (filters.accountName) {
        sql += ' AND account_name = ?';
        params.push(filters.accountName);
      }
    }

    // Sort by transaction time descending
    sql += ' ORDER BY transaction_time DESC';

    return this.execute(sql, params);
  },

  /**
   * Fetch all categories
   */
  async getCategories(): Promise<Category[]> {
    return this.execute('SELECT * FROM categories ORDER BY name ASC');
  },

  /**
   * Save a new category
   */
  async saveCategory(name: string, icon: string, color: string, type: 'DEBIT' | 'CREDIT' = 'DEBIT'): Promise<void> {
    await this.execute(
      `INSERT INTO categories (name, icon, color, type) VALUES (?, ?, ?, ?)`,
      [name, icon, color, type]
    );
  },

  /**
   * Fetch all merchant mappings
   */
  async getMerchantMappings(): Promise<MerchantMapping[]> {
    return this.execute('SELECT * FROM merchant_mappings ORDER BY merchant_name ASC');
  },

  /**
   * Save a transaction (insert or update)
   */
  async saveTransaction(txn: Partial<Transaction>): Promise<void> {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    const accountName = txn.account_name || '';

    await this.execute(
      `INSERT OR REPLACE INTO transactions (id, amount, transaction_type, merchant, category, source_app, transaction_time, raw_notification, account_name, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM transactions WHERE id = ?), ?))`,
      [
        txn.id || Math.random().toString(36).substring(2, 15),
        txn.amount || 0,
        txn.transaction_type || 'DEBIT',
        txn.merchant || 'Unknown',
        txn.category || 'Other',
        txn.source_app || 'Manual',
        txn.transaction_time || now,
        txn.raw_notification || 'Manually Added',
        accountName,
        txn.id,
        now
      ]
    );
  },

  /**
   * Delete a transaction by id
   */
  async deleteTransaction(id: string): Promise<void> {
    await this.execute('DELETE FROM transactions WHERE id = ?', [id]);
  },

  /**
   * Add or update a merchant mapping
   */
  async saveMerchantMapping(merchantName: string, categoryName: string): Promise<void> {
    const id = merchantName.trim().toLowerCase();
    const sql = `
      INSERT OR REPLACE INTO merchant_mappings (id, merchant_name, category_name)
      VALUES (?, ?, ?);
    `;
    await this.execute(sql, [id, merchantName.trim(), categoryName]);
  },

  /**
   * Delete a merchant mapping by id
   */
  async deleteMerchantMapping(id: string): Promise<void> {
    await this.execute('DELETE FROM merchant_mappings WHERE id = ?', [id]);
  },

  /**
   * Clear the transaction database
   */
  async clearDatabase(): Promise<void> {
    await this.execute('DELETE FROM transactions');
    await this.execute('DELETE FROM accounts');
    await this.execute('DELETE FROM user_settings');
  },

  /**
   * Get total income, expense and balance (by default filtered by current month)
   */
  async getDashboardSummary(monthStr?: string, accountName?: string): Promise<DashboardSummary> {
    const filterMonth = monthStr || new Date().toISOString().substring(0, 7);
    
    let sql = `
      SELECT 
        SUM(CASE WHEN transaction_type = 'CREDIT' THEN amount ELSE 0 END) as totalIncome,
        SUM(CASE WHEN transaction_type = 'DEBIT' THEN amount ELSE 0 END) as totalExpense
      FROM transactions 
      WHERE transaction_time LIKE ?
    `;
    const params: any[] = [`${filterMonth}%`];

    if (accountName) {
      sql += ' AND account_name = ?';
      params.push(accountName);
    }
    
    const results = await this.execute(sql, params);
    const summary = results[0] || { totalIncome: 0, totalExpense: 0 };
    
    const totalIncome = summary.totalIncome || 0;
    const totalExpense = summary.totalExpense || 0;
    
    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense
    };
  },

  /**
   * Get category summary (total amount per category) for a given month
   */
  async getCategorySummary(monthStr?: string, accountName?: string): Promise<{ category: string; amount: number }[]> {
    const filterMonth = monthStr || new Date().toISOString().substring(0, 7);
    
    let sql = `
      SELECT category, SUM(amount) as amount
      FROM transactions
      WHERE transaction_time LIKE ? AND transaction_type = 'DEBIT'
    `;
    const params: any[] = [`${filterMonth}%`];

    if (accountName) {
      sql += ' AND account_name = ?';
      params.push(accountName);
    }

    sql += `
      GROUP BY category
      ORDER BY amount DESC;
    `;
    
    const results = await this.execute(sql, params);
    return results.map((r: any) => ({
      category: r.category || 'Other',
      amount: r.amount || 0
    }));
  },

  /**
   * Get trend of expense vs income by day for the current month
   */
  async getMonthlyTrend(monthStr?: string, accountName?: string): Promise<{ date: string; income: number; expense: number }[]> {
    const filterMonth = monthStr || new Date().toISOString().substring(0, 7);
    
    let sql = `
      SELECT 
        SUBSTR(transaction_time, 9, 2) as day,
        SUM(CASE WHEN transaction_type = 'CREDIT' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN transaction_type = 'DEBIT' THEN amount ELSE 0 END) as expense
      FROM transactions
      WHERE transaction_time LIKE ?
    `;
    const params: any[] = [`${filterMonth}%`];

    if (accountName) {
      sql += ' AND account_name = ?';
      params.push(accountName);
    }

    sql += `
      GROUP BY day
      ORDER BY day ASC;
    `;
    
    const results = await this.execute(sql, params);
    return results.map((r: any) => ({
      date: r.day,
      income: r.income || 0,
      expense: r.expense || 0
    }));
  },

  /**
   * Get top merchants for the current month
   */
  async getTopMerchants(monthStr?: string, limit: number = 5, accountName?: string): Promise<{ merchant: string; amount: number }[]> {
    const filterMonth = monthStr || new Date().toISOString().substring(0, 7);
    
    let sql = `
      SELECT merchant, SUM(amount) as amount
      FROM transactions
      WHERE transaction_time LIKE ? AND transaction_type = 'DEBIT'
    `;
    const params: any[] = [`${filterMonth}%`];

    if (accountName) {
      sql += ' AND account_name = ?';
      params.push(accountName);
    }

    sql += `
      GROUP BY merchant
      ORDER BY amount DESC
      LIMIT ?;
    `;
    params.push(limit);
    
    const results = await this.execute(sql, params);
    return results.map((r: any) => ({
      merchant: r.merchant || 'Unknown',
      amount: r.amount || 0
    }));
  },

  /**
   * Get accounts list with opening balance and calculated current balance
   */
  async getAccounts(): Promise<{ name: string; opening_balance: number; balance: number }[]> {
    const accounts = await this.execute('SELECT * FROM accounts ORDER BY name ASC');
    const enrichedAccounts = [];
    for (const acc of accounts) {
      const sql = `
        SELECT 
          SUM(CASE WHEN transaction_type = 'CREDIT' THEN amount ELSE 0 END) as income,
          SUM(CASE WHEN transaction_type = 'DEBIT' THEN amount ELSE 0 END) as expense
        FROM transactions 
        WHERE account_name = ?;
      `;
      const results = await this.execute(sql, [acc.name]);
      const summary = results[0] || { income: 0, expense: 0 };
      const income = summary.income || 0;
      const expense = summary.expense || 0;
      enrichedAccounts.push({
        name: acc.name,
        opening_balance: acc.opening_balance,
        balance: acc.opening_balance + income - expense
      });
    }
    return enrichedAccounts;
  },

  /**
   * Create/Update an account
   */
  async saveAccount(name: string, openingBalance: number): Promise<void> {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    await this.execute(
      'INSERT OR REPLACE INTO accounts (name, opening_balance, created_at) VALUES (?, ?, ?);',
      [name, openingBalance, nowStr]
    );
  },

  /**
   * Delete an account
   */
  async deleteAccount(name: string): Promise<void> {
    await this.execute('DELETE FROM accounts WHERE name = ?;', [name]);
    await this.execute('DELETE FROM transactions WHERE account_name = ?;', [name]);
  },

  /**
   * Key-value settings helpers
   */
  async getSetting(key: string): Promise<string | null> {
    try {
      const results = await this.execute('SELECT value FROM user_settings WHERE key = ?;', [key]);
      if (results && results.length > 0) {
        return results[0].value;
      }
    } catch (e) {
      console.warn('user_settings table may not be initialized yet', e);
    }
    return null;
  },

  async saveSetting(key: string, value: string): Promise<void> {
    await this.execute('INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?);', [key, value]);
  }
};
