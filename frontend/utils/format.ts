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
