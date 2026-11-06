export const formatCurrency = (amount: number) =>
  `KSh ${new Intl.NumberFormat('en-KE', { maximumFractionDigits: 0 }).format(amount)}`;
