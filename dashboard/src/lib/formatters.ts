const MONTHS_UZ = [
  "Yan", "Fev", "Mar", "Apr", "May", "Iyun",
  "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek",
];

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = MONTHS_UZ[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month} ${year}`;
}

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = MONTHS_UZ[d.getMonth()];
  return `${day}-${month}`;
}

export function formatCurrency(amount: number): string {
  if (Math.abs(amount) >= 1_000_000_000) {
    const val = (amount / 1_000_000_000).toFixed(2);
    return `${val} mlrd UZS`;
  }
  if (Math.abs(amount) >= 1_000_000) {
    const val = (amount / 1_000_000).toFixed(1);
    return `${val} mln UZS`;
  }
  const formatted = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${formatted} UZS`;
}

export function formatCurrencyCompact(amount: number): string {
  if (Math.abs(amount) >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)} mlrd`;
  }
  if (Math.abs(amount) >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(0)} mln`;
  }
  return Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}
