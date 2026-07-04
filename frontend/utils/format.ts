const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', JPY: '¥', AUD: 'A$', CAD: 'C$', CHF: 'CHF',
  CNY: '¥', INR: '₹', PKR: '₨', MXN: '$', BRL: 'R$', ZAR: 'R', SGD: 'S$',
  HKD: 'HK$', KRW: '₩', TRY: '₺', RUB: '₽', AED: 'AED ', SAR: 'SAR ',
};

export const getCurrencySymbol = (currencyCode?: string | null): string => {
  if (!currencyCode) return '$';
  const code = currencyCode.toUpperCase();
  const symbol = CURRENCY_SYMBOLS[code];
  if (symbol) return symbol;
  return `${code} `;
};

export const formatNumber = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  // Only show decimals if there are non-zero decimal places
  const hasDecimals = num % 1 !== 0;
  return num.toLocaleString('en-US', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  });
};

export const formatCurrency = (value: number | string, currencySymbol: string = '$'): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return `${currencySymbol}0`;
  const hasDecimals = num % 1 !== 0;
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return `${currencySymbol}${formatted}`;
};

export const parseFormattedNumber = (value: string): number => {
  const cleanValue = value.replace(/,/g, '');
  return parseFloat(cleanValue) || 0;
};
