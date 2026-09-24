// ─────────────────────────────────────────────────────────────
// utils/validators.ts  — Input validation helpers
// ─────────────────────────────────────────────────────────────

/** Validate a 10-digit Indian phone number */
export const isValidPhone = (phone: string): boolean => {
  return /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''));
};

/** Validate an email address */
export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

/** Validate a 6-digit Indian PIN code */
export const isValidPincode = (pin: string): boolean => {
  return /^\d{6}$/.test(pin.trim());
};

/** Strip non-numeric characters from a phone string */
export const cleanPhone = (phone: string): string => {
  return phone.replace(/\D/g, '');
};
