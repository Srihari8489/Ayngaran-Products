// ─────────────────────────────────────────────────────────────
// utils/format.ts  — Global formatting utilities for Ayngaran
// ─────────────────────────────────────────────────────────────

/** Format a number as Indian rupees. E.g. 1234.5 → "₹1,235" */
export const formatCurrency = (value: number, decimals = 0): string => {
  return `₹${Number(value).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
};

/** Format a Date/string as "12 Sep 2026" */
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

/** Format a Date/string as "12 Sep 2026, 10:45 AM" */
export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

/** Truncate long strings with ellipsis */
export const truncate = (str: string, maxLength = 40): string => {
  return str.length > maxLength ? str.slice(0, maxLength).trim() + '…' : str;
};

/** Convert status strings to title case: "OUT_FOR_DELIVERY" → "Out For Delivery" */
export const formatStatus = (status: string): string => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};
