/**
 * Application-wide constants
 * Centralized location for magic numbers and configuration values
 */

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 50,
  PAGE_SIZE_OPTIONS: [25, 50, 100, 200],
  MAX_VISIBLE_PAGES: 7, // Maximum number of page buttons to show
} as const;

export const DEBOUNCE_DELAYS = {
  SEARCH: 300, // milliseconds
  AUTOSAVE: 1000,
  EXPORT_RATE_LIMIT: 10000, // 10 seconds between exports
} as const;

export const ANIMATION_DELAYS = {
  MOCK_LOADING: 800, // Simulated loading delay for mock data
  TOAST_DURATION: 3000,
} as const;

export const FORM_LIMITS = {
  SEARCH_MAX_LENGTH: 100,
  NAME_MAX_LENGTH: 50,
  EMAIL_MAX_LENGTH: 100,
} as const;

export const DATE_FORMATS = {
  SHORT: { day: 'numeric', month: 'short', year: 'numeric' } as const,
  LONG: { day: 'numeric', month: 'long', year: 'numeric' } as const,
  WITH_TIME: {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  } as const,
} as const;

export const LOCALE = 'es-CO' as const;
