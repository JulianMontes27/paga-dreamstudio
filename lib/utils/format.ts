/**
 * Format utilities that work consistently on both server and client
 * to prevent hydration mismatches
 */

/**
 * Format a date to a localized string (es-ES format)
 * Using explicit timezone to ensure consistency
 */
export function formatEventDate(date: string | Date): string {
  const d = new Date(date);

  // Use UTC to ensure server/client consistency
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Bogota", // Explicit timezone for Colombia
  };

  return d.toLocaleDateString("es-ES", options);
}

/**
 * Format a price in Colombian pesos
 * Using manual formatting to ensure consistency
 */
export function formatPrice(price: number): string {
  return price.toLocaleString("es-CO");
}
