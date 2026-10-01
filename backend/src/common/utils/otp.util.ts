import * as crypto from 'crypto';

/**
 * Unified OTP and Identifier Utility for Ayngaran Foods Backend.
 *
 * Centralizes:
 * - Cryptographically secure numeric OTP generation
 * - SHA-256 OTP hashing and timing-safe verification
 * - Email and phone normalization (+91 E.164 format)
 * - Format validation for emails and mobile numbers
 * - Sensitive identifier masking for safe logs/responses
 * - Expiration timestamp calculations
 */
export class OtpUtil {
  /**
   * Generates a cryptographically secure, non-predictable numeric OTP.
   * Default length: 6 digits (range 100000 to 999999)
   */
  static generateSecureOtp(length: number = 6): string {
    if (length === 6) {
      return crypto.randomInt(100000, 1000000).toString();
    }
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length);
    return crypto.randomInt(min, max).toString();
  }

  /**
   * Hashes an OTP string using SHA-256.
   */
  static hashOtp(otp: string): string {
    return crypto.createHash('sha256').update(otp.trim()).digest('hex');
  }

  /**
   * Verifies a raw OTP against a stored hash or plaintext value.
   * Supports timing-safe comparison and backward-compatible plaintext mode for DEMO.
   */
  static verifyOtp(rawOtp: string, storedHashOrPlain: string, isHashingDisabled: boolean = false): boolean {
    if (!rawOtp || !storedHashOrPlain) return false;

    if (isHashingDisabled) {
      return rawOtp.trim() === storedHashOrPlain.trim();
    }

    const hashedInput = this.hashOtp(rawOtp.trim());
    try {
      const a = Buffer.from(hashedInput, 'hex');
      const b = Buffer.from(storedHashOrPlain.trim(), 'hex');
      if (a.length !== b.length) return false;
      return crypto.timingSafeEqual(a, b);
    } catch {
      return hashedInput === storedHashOrPlain.trim();
    }
  }

  /**
   * Normalizes an email address: trims whitespace and converts to lowercase.
   */
  static normalizeEmail(email: string): string {
    return email ? email.trim().toLowerCase() : '';
  }

  /**
   * Normalizes a phone number to standard E.164-like format (e.g. +919876543210).
   */
  static normalizePhone(input: string): string {
    if (!input) return '';
    const clean = input.trim();
    if (clean.includes('@')) return clean.toLowerCase();
    const digits = clean.replace(/\D/g, '');
    if (digits.length === 10) return `+91${digits}`;
    if (!clean.startsWith('+') && digits.length > 10) return `+${digits}`;
    return clean.startsWith('+') ? clean : `+91${digits}`;
  }

  /**
   * Normalizes either phone or email based on content.
   */
  static normalizeIdentifier(identifier: string): string {
    if (!identifier) return '';
    return identifier.includes('@') ? this.normalizeEmail(identifier) : this.normalizePhone(identifier);
  }

  /**
   * Validates standard email address format.
   */
  static isValidEmail(email: string): boolean {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Validates standard 10-digit Indian mobile number format.
   */
  static isValidPhone(phone: string): boolean {
    if (!phone) return false;
    const digits = phone.replace(/\D/g, '');
    return digits.length === 10 || (digits.length === 12 && digits.startsWith('91'));
  }

  /**
   * Masks an email (e.g., 'j***n@example.com') or phone (e.g., '+91*****3210') for safe client responses and logging.
   */
  static maskIdentifier(identifier: string): string {
    if (!identifier) return '';
    const trimmed = identifier.trim();

    if (trimmed.includes('@')) {
      const [user, domain] = trimmed.split('@');
      if (user.length <= 2) {
        return `${user[0] || ''}***@${domain}`;
      }
      return `${user[0]}***${user[user.length - 1]}@${domain}`;
    }

    if (trimmed.length >= 10) {
      const visibleStart = trimmed.slice(0, 3);
      const visibleEnd = trimmed.slice(-2);
      return `${visibleStart}*****${visibleEnd}`;
    }

    return '******';
  }

  /**
   * Calculates expiration date from now in minutes. Default: 5 minutes.
   */
  static getExpiryDate(minutes: number = 5): Date {
    return new Date(Date.now() + minutes * 60 * 1000);
  }
}
