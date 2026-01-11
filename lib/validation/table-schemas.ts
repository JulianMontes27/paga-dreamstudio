import { z } from "zod";

/**
 * Table validation schemas and sanitization utilities
 *
 * This module provides comprehensive validation and sanitization
 * for table-related data inputs to ensure security and data integrity.
 */

/**
 * QR Code validation schema
 * Validates QR code format and structure
 */
export const qrCodeSchema = z.string()
  .min(1, "QR code cannot be empty")
  .max(255, "QR code too long")
  .regex(/^[a-zA-Z0-9\-_]+$/, "QR code contains invalid characters");

/**
 * Table number validation schema
 * Allows alphanumeric characters, hyphens, and underscores
 */
export const tableNumberSchema = z.string()
  .min(1, "Table number is required")
  .max(20, "Table number too long")
  .regex(/^[a-zA-Z0-9\-_]+$/, "Table number contains invalid characters");

/**
 * Organization slug validation schema
 */
export const organizationSlugSchema = z.string()
  .min(1, "Organization slug is required")
  .max(50, "Organization slug too long")
  .regex(/^[a-z0-9\-]+$/, "Organization slug contains invalid characters");

/**
 * Table status validation schema
 */
export const tableStatusSchema = z.enum([
  "available",
  "occupied",
  "reserved",
  "cleaning"
]);

/**
 * Table capacity validation schema
 */
export const tableCapacitySchema = z.number()
  .min(1, "Capacity must be at least 1")
  .max(50, "Capacity cannot exceed 50");

/**
 * Input sanitization utilities
 * Provides safe sanitization methods for various input types
 */
export const sanitizeInput = {
  /**
   * Sanitizes QR code input
   * Removes potentially dangerous characters and validates format
   */
  qrCode: (input: string): string => {
    const sanitized = input
      .trim()
      .replace(/[^a-zA-Z0-9\-_]/g, "")
      .substring(0, 255);

    const result = qrCodeSchema.safeParse(sanitized);
    if (!result.success) {
      throw new Error("Invalid QR code format");
    }

    return result.data;
  },

  /**
   * Sanitizes table number input
   */
  tableNumber: (input: string): string => {
    const sanitized = input
      .trim()
      .replace(/[^a-zA-Z0-9\-_]/g, "")
      .substring(0, 20);

    const result = tableNumberSchema.safeParse(sanitized);
    if (!result.success) {
      throw new Error("Invalid table number format");
    }

    return result.data;
  },

  /**
   * Sanitizes organization slug input
   */
  organizationSlug: (input: string): string => {
    const sanitized = input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\-]/g, "")
      .substring(0, 50);

    const result = organizationSlugSchema.safeParse(sanitized);
    if (!result.success) {
      throw new Error("Invalid organization slug format");
    }

    return result.data;
  },

  /**
   * Generic string sanitization for general text inputs
   */
  string: (input: string, maxLength: number = 255): string => {
    return input
      .trim()
      .replace(/[<>'"&]/g, "") // Remove potentially dangerous HTML characters
      .substring(0, maxLength);
  },

  /**
   * Sanitizes numeric input
   */
  number: (input: string | number): number => {
    const num = typeof input === "string" ? parseFloat(input) : input;

    if (isNaN(num) || !isFinite(num)) {
      throw new Error("Invalid number format");
    }

    return num;
  }
};

/**
 * Table creation validation schema
 */
export const createTableSchema = z.object({
  tableNumber: tableNumberSchema,
  capacity: tableCapacitySchema,
  section: z.string().max(50).optional(),
  organizationId: z.string().min(1, "Organization ID is required"),
  generateQr: z.boolean().default(true)
});

/**
 * Table update validation schema
 */
export const updateTableSchema = z.object({
  tableNumber: tableNumberSchema.optional(),
  capacity: tableCapacitySchema.optional(),
  section: z.string().max(50).optional(),
  status: tableStatusSchema.optional(),
  isQrEnabled: z.boolean().optional()
});

/**
 * QR code scan validation schema
 */
export const qrCodeScanSchema = z.object({
  qrCode: qrCodeSchema,
  userAgent: z.string().max(500).optional(),
  referer: z.string().max(500).optional(),
  ip: z.string().max(45).optional()
});

/**
 * Type exports for TypeScript usage
 */
export type CreateTableInput = z.infer<typeof createTableSchema>;
export type UpdateTableInput = z.infer<typeof updateTableSchema>;
export type QRCodeScanInput = z.infer<typeof qrCodeScanSchema>;
export type TableStatus = z.infer<typeof tableStatusSchema>;