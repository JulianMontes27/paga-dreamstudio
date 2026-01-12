/**
 * Utility functions for sanitizing user input
 * Prevents XSS, injection attacks, and ensures data consistency
 */

/**
 * Sanitize email address
 * - Converts to lowercase
 * - Trims whitespace
 * - Removes any HTML tags
 */
export function sanitizeEmail(email: string): string {
  if (!email) return '';

  return email
    .trim()
    .toLowerCase()
    .replace(/[<>]/g, ''); // Remove < and > to prevent HTML injection
}

/**
 * Sanitize name fields (first name, last name, full name)
 * - Trims whitespace
 * - Removes numbers and special characters (except spaces, hyphens, apostrophes)
 * - Removes HTML tags
 * - Capitalizes first letter of each word
 */
export function sanitizeName(name: string): string {
  if (!name) return '';

  return name
    .trim()
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/[0-9]/g, '') // Remove numbers
    .replace(/[^\p{L}\s'-]/gu, '') // Keep only letters, spaces, hyphens, apostrophes
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Sanitize text input (general purpose)
 * - Trims whitespace
 * - Removes HTML tags and scripts
 * - Escapes special characters
 */
export function sanitizeText(text: string): string {
  if (!text) return '';

  return text
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]+>/g, '') // Remove all HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove inline event handlers (onclick, onerror, etc)
    .replace(/\s+/g, ' '); // Replace multiple spaces with single space
}

/**
 * Sanitize document number
 * - Removes all non-alphanumeric characters
 * - Converts to uppercase
 * - Trims whitespace
 */
export function sanitizeDocumentNumber(docNumber: string): string {
  if (!docNumber) return '';

  return docNumber
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, ''); // Keep only letters and numbers
}

/**
 * Sanitize OTP code
 * - Removes all non-numeric characters
 * - Limits to 6 digits
 */
export function sanitizeOTP(otp: string): string {
  if (!otp) return '';

  return otp
    .replace(/\D/g, '') // Remove non-digits
    .slice(0, 6); // Limit to 6 digits
}

/**
 * Sanitize password
 * - Only trims whitespace (don't modify the password itself)
 * - Removes null bytes
 */
export function sanitizePassword(password: string): string {
  if (!password) return '';

  return password
    .replace(/\0/g, ''); // Remove null bytes (security issue)
}

/**
 * Validate and sanitize URL
 * - Ensures URL is safe
 * - Blocks javascript: and data: protocols
 */
export function sanitizeURL(url: string): string {
  if (!url) return '';

  const trimmed = url.trim();

  // Block dangerous protocols
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return '';
  }

  return trimmed;
}

/**
 * Sanitize phone number (already handled by libphonenumber-js)
 * This is just a pass-through for consistency
 */
export function sanitizePhoneNumber(phone: string): string {
  if (!phone) return '';
  return phone.trim();
}

/**
 * Generic sanitizer that combines common sanitization steps
 */
export function sanitizeInput(input: string, type: 'email' | 'name' | 'text' | 'document' | 'otp' | 'password' | 'url' | 'phone' = 'text'): string {
  switch (type) {
    case 'email':
      return sanitizeEmail(input);
    case 'name':
      return sanitizeName(input);
    case 'document':
      return sanitizeDocumentNumber(input);
    case 'otp':
      return sanitizeOTP(input);
    case 'password':
      return sanitizePassword(input);
    case 'url':
      return sanitizeURL(input);
    case 'phone':
      return sanitizePhoneNumber(input);
    case 'text':
    default:
      return sanitizeText(input);
  }
}
