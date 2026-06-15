export interface ParseResult {
  amount: number;
  transactionType: 'DEBIT' | 'CREDIT';
  merchant: string;
  sourceApp: string;
  timestamp: string;
  category: string;
}

const amountPatterns = [
  /(?:Rs\.?|INR|₹|INR\s*)\s*([\d,]+(?:\.\d{1,2})?)/i,
  /([\d,]+(?:\.\d{1,2})?)\s*(?:Rs\.?|INR|₹)/i,
  /spent\s*(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
  /received\s*(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i
];

const merchantToPatterns = [
  /(?:to|at|paid to|spent at|towards)\s+([a-z0-9\s]{2,30})/i,
  /sent to\s+([a-z0-9\s]{2,30})/i,
  /transfer to\s+([a-z0-9\s]{2,30})/i
];

const merchantFromPatterns = [
  /(?:from|received from|credited by|transfer by)\s+([a-z0-9\s]{2,30})/i,
  /by\s+([a-z0-9\s]{2,30})\s+credited/i
];

const debitKeywords = /paid|sent|debited|spent|deducted|txn|transfer|withdrawn|remitted/i;
const creditKeywords = /received|credited|added|refunded|deposited|refund/i;

export const parseNotification = (
  title: string = '',
  body: string = '',
  sourceApp: string = 'Test Simulator',
  merchantMappings: { merchant_name: string; category_name: string }[] = []
): ParseResult | null => {
  const text = `${title} ${body}`.trim();
  if (!text) return null;

  // 1. Extract Amount
  let amount: number | null = null;
  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const parsedAmt = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(parsedAmt)) {
        amount = parsedAmt;
        break;
      }
    }
  }

  if (amount === null) return null;

  // 2. Extract Type
  let transactionType: 'DEBIT' | 'CREDIT' = 'DEBIT';
  const isCredit = creditKeywords.test(text);
  const isDebit = debitKeywords.test(text);

  if (isCredit && !isDebit) {
    transactionType = 'CREDIT';
  } else if (isDebit && !isCredit) {
    transactionType = 'DEBIT';
  } else if (text.toLowerCase().includes('received') || text.toLowerCase().includes('credited')) {
    transactionType = 'CREDIT';
  }

  // 3. Extract Merchant
  let merchant = 'Merchant';
  const patterns = transactionType === 'CREDIT' ? merchantFromPatterns : merchantToPatterns;
  let foundMerchant = false;

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const mName = match[1].trim();
      const cleanName = mName.split(
        /\s+(?:successful|txn|ref|via|using|from|to|on|of|for|in)\b|\.|\,|\;/i
      )[0].trim();

      if (cleanName && cleanName.length >= 2) {
        merchant = cleanName;
        foundMerchant = true;
        break;
      }
    }
  }

  if (!foundMerchant) {
    merchant = transactionType === 'CREDIT' ? 'Refund/Sender' : 'Merchant';
  }

  // 4. Categorize
  let category = 'Other';
  const merchantLower = merchant.toLowerCase();

  // Try custom mappings
  const matchedMapping = merchantMappings.find(
    (m) =>
      m.merchant_name.toLowerCase() === merchantLower ||
      merchantLower.includes(m.merchant_name.toLowerCase())
  );

  if (matchedMapping) {
    category = matchedMapping.category_name;
  } else {
    // Standard rule-based fallback
    if (/swiggy|zomato|restaurant|food|cafe|eats|burger|pizza|starbucks/i.test(merchantLower)) {
      category = 'Food';
    } else if (/uber|ola|rapido|travel|irctc|metro|cab|train|flight|bus/i.test(merchantLower)) {
      category = 'Travel';
    } else if (/amazon|flipkart|myntra|shopping|dmart|groceries|mart|decathlon/i.test(merchantLower)) {
      category = 'Shopping';
    } else if (/bill|electricity|recharge|gas|water|postpaid|jio|airtel|phone\s*pe|g\s*pay/i.test(merchantLower) && /bill|recharge|payment/i.test(text)) {
      category = 'Bills';
    } else if (/salary|employer|paycheck|dividend/i.test(merchantLower)) {
      category = 'Salary';
    } else if (/investment|zerodha|groww|mutual|stock|tata\s*neu/i.test(merchantLower)) {
      category = 'Investment';
    } else if (/hospital|pharmacy|medical|doctor|apollo|health/i.test(merchantLower)) {
      category = 'Healthcare';
    } else if (/netflix|spotify|prime|cinema|hotstar|movie|entertainment|ticket/i.test(merchantLower)) {
      category = 'Entertainment';
    }
  }

  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

  return {
    amount,
    transactionType,
    merchant,
    sourceApp,
    timestamp,
    category
  };
};
