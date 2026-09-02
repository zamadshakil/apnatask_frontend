export const formatPkr = (paisa: number | null | undefined) =>
  paisa == null
    ? 'Price open'
    : new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(paisa / 100);

export function normalizePakistanPhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (/^03\d{9}$/.test(digits)) return `+92${digits.slice(1)}`;
  if (/^923\d{9}$/.test(digits)) return `+${digits}`;
  throw new Error('Enter a valid Pakistani mobile number, for example 03001234567');
}
