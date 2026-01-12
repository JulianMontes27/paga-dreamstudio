/**
 * Integration Constants
 * Centralized configuration for third-party integrations
 */

// UI Constants
export const UI = {
  SEARCH_PLACEHOLDER: "Buscar integraciones...",
  EMPTY_STATE: {
    TITLE: "No se encontraron integraciones",
    DESCRIPTION: "Intenta con otro término de búsqueda",
  },
  HEADER: {
    TITLE: "Integraciones",
    DESCRIPTION: "Conecta tu organización con servicios externos para mejorar tu flujo de trabajo",
  },
} as const;

// Integration Status
export const INTEGRATION_STATUS = {
  AVAILABLE: "available",
  COMING_SOON: "coming-soon",
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
} as const;

// Integration Categories
export const INTEGRATION_CATEGORIES = {
  PAYMENT: "payment",
  WEBHOOKS: "webhooks",
} as const;

// Category Labels
export const CATEGORY_LABELS: Record<string, string> = {
  [INTEGRATION_CATEGORIES.PAYMENT]: "Pasarelas de Pago",
  [INTEGRATION_CATEGORIES.WEBHOOKS]: "WebHooks",
};

// Badge Variants
export const BADGE_CONFIG = {
  COMING_SOON: {
    text: "Próximamente",
    className: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
  },
  CONNECTED: {
    text: "Conectado",
    className: "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20",
  },
  AVAILABLE: {
    text: "Disponible",
    className: "bg-gray-50 dark:bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-500/20",
  },
} as const;

// Button Labels
export const BUTTON_LABELS = {
  CONNECT: "Conectar",
  CONNECTED: "Conectado",
} as const;

// Accessibility Labels
export const ARIA_LABELS = {
  SEARCH: "Buscar integraciones",
  CARD_PREFIX: "Integración de",
  CONNECT_BUTTON: "Conectar integración de",
  CONNECTED_BUTTON: "Ver configuración de",
} as const;
