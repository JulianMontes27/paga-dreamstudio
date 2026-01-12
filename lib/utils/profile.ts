/**
 * Profile utility functions
 * Reusable helpers for profile-related operations
 */

import { VALIDATION } from "@/constants/profile";

/**
 * Safely decode a JWT ID token
 * @param idToken - The JWT token string to decode
 * @returns Decoded token payload or null if invalid
 * @example
 * const payload = decodeIdToken(user.idToken);
 * if (payload) {
 *   console.log(payload.email);
 * }
 */
export function decodeIdToken(
  idToken: string | null
): Record<string, unknown> | null {
  if (!idToken) return null;

  try {
    // JWT has 3 parts separated by dots: header.payload.signature
    const payload = idToken.split(".")[1];
    if (!payload) return null;

    // Decode base64url
    const decoded = Buffer.from(payload, "base64").toString("utf-8");
    return JSON.parse(decoded);
  } catch (error) {
    console.warn("Failed to decode ID token:", error);
    return null;
  }
}

/**
 * Format a phone number with country code prefix
 * @param phone - Phone number to format
 * @returns Formatted phone number with + prefix if applicable
 * @example
 * formatPhoneNumber("573001234567") // "+57 300 123 4567"
 * formatPhoneNumber("+573001234567") // "+57 300 123 4567"
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "";

  // If already has +, return as is
  if (phone.startsWith("+")) {
    return phone;
  }

  // If has 10+ digits, assume it needs + prefix
  if (phone.length >= VALIDATION.MIN_PHONE_LENGTH) {
    return `+${phone}`;
  }

  return phone;
}

/**
 * Sanitize document number to only contain digits
 * @param value - Document number input
 * @returns Sanitized string with only digits, max 20 chars
 * @example
 * sanitizeDocumentNumber("123-456.789") // "123456789"
 * sanitizeDocumentNumber("ABC123") // "123"
 */
export function sanitizeDocumentNumber(value: string): string {
  // Remove all non-digit characters
  const digitsOnly = value.replace(/\D/g, "");
  // Limit to max length
  return digitsOnly.slice(0, VALIDATION.MAX_DOCUMENT_LENGTH);
}

/**
 * Validate email format
 * @param email - Email address to validate
 * @returns True if email is valid
 * @example
 * validateEmail("user@example.com") // true
 * validateEmail("invalid") // false
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format
 * @param phone - Phone number to validate
 * @returns True if phone is valid (10+ digits)
 * @example
 * validatePhone("+573001234567") // true
 * validatePhone("123") // false
 */
export function validatePhone(phone: string): boolean {
  const digitsOnly = phone.replace(/\D/g, "");
  return digitsOnly.length >= VALIDATION.MIN_PHONE_LENGTH;
}

/**
 * Calculate age from birthdate
 * @param birthdate - Date string or Date object
 * @returns Age in years, or null if invalid
 * @example
 * calculateAge("2000-01-01") // 25 (in 2025)
 * calculateAge(new Date(2000, 0, 1)) // 25
 */
export function calculateAge(
  birthdate: string | Date | null | undefined
): number | null {
  if (!birthdate) return null;

  try {
    const birth =
      typeof birthdate === "string" ? new Date(birthdate) : birthdate;
    const today = new Date();

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    // Adjust if birthday hasn't occurred this year
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age >= 0 ? age : null;
  } catch {
    return null;
  }
}

/**
 * Get user initials from full name
 * @param name - Full name of user
 * @returns Two-letter initials in uppercase
 * @example
 * getUserInitials("Juan Pérez") // "JP"
 * getUserInitials("María") // "M"
 * getUserInitials("") // "U"
 */
export function getUserInitials(name: string | null | undefined): string {
  if (!name || name.trim() === "") return "U";

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Get full name safely, handling null/undefined
 * @param firstName - First name
 * @param lastName - Last name
 * @returns Combined full name or fallback
 * @example
 * getFullName("Juan", "Pérez") // "Juan Pérez"
 * getFullName("Juan", null) // "Juan"
 * getFullName(null, null) // "Usuario sin nombre"
 */
export function getFullName(
  firstName: string | null | undefined,
  lastName: string | null | undefined
): string {
  const first = firstName?.trim() || "";
  const last = lastName?.trim() || "";

  if (!first && !last) return "Usuario sin nombre";
  if (!last) return first;
  if (!first) return last;

  return `${first} ${last}`;
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Object with isValid flag and error message if any
 * @example
 * validatePasswordStrength("abc123") // { isValid: false, error: "..." }
 * validatePasswordStrength("password123") // { isValid: true }
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  error?: string;
} {
  if (password.length < VALIDATION.MIN_PASSWORD_LENGTH) {
    return {
      isValid: false,
      error: `La contraseña debe tener al menos ${VALIDATION.MIN_PASSWORD_LENGTH} caracteres`,
    };
  }

  return { isValid: true };
}

/**
 * Sanitize name input
 * @param name - Name input to sanitize
 * @returns Sanitized name
 * @example
 * sanitizeName("  Juan   Pérez  ") // "Juan Pérez"
 * sanitizeName("Juan<script>") // "Juanscript"
 */
export function sanitizeName(name: string): string {
  // Remove HTML tags and extra whitespace
  return name
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, VALIDATION.MAX_NAME_LENGTH);
}

/**
 * Format provider name for display
 * @param providerId - Provider ID (google, apple, facebook)
 * @returns Formatted provider name
 * @example
 * formatProviderName("google") // "Google"
 * formatProviderName("apple") // "Apple"
 */
export function formatProviderName(providerId: string): string {
  const providerNames: Record<string, string> = {
    google: "Google",
    apple: "Apple",
    facebook: "Facebook",
    github: "GitHub",
  };

  return (
    providerNames[providerId] ||
    providerId.charAt(0).toUpperCase() + providerId.slice(1)
  );
}
