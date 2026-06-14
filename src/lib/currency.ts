export function formatCurrency(amount: number | string | any, currencyCode: string): string {
  // Convert amount to number (handling Prisma Decimal safely)
  const numAmount = typeof amount === 'object' && amount !== null && 'toNumber' in amount 
    ? amount.toNumber() 
    : Number(amount);

  if (isNaN(numAmount)) return `$0.00`;

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currencyCode || 'USD',
  }).format(numAmount);
}
