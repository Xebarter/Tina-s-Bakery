export const formatUGX = (amount: number): string => {
  const formatted = amount.toLocaleString('en-UG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `Ugx ${formatted}`;
};

export const parseUGX = (value: string): number => {
  // Remove currency symbols and commas, then parse
  const cleanValue = value.replace(/[UGX\s,]/g, '');
  return parseFloat(cleanValue) || 0;
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-UG').format(num);
};