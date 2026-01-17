export const formatNumber = (value: number | string, decimals: number = 2): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const formatCurrency = (value: number | string, currencySymbol: string = '$'): string => {
  return `${currencySymbol}${formatNumber(value)}`;
};

export const parseFormattedNumber = (value: string): number => {
  const cleanValue = value.replace(/,/g, '');
  return parseFloat(cleanValue) || 0;
};
