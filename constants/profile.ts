/**
 * Profile-related constants
 * Centralized configuration for profile pages and components
 */

// Document types available for user identification
export const DOCUMENT_TYPES = [
  { value: "CC", label: "Cédula de Ciudadanía" },
  { value: "CE", label: "Cédula de Extranjería" },
  { value: "TI", label: "Tarjeta de Identidad" },
  { value: "PA", label: "Pasaporte" },
  { value: "PEP", label: "PEP" },
] as const;

// OAuth providers configuration
export const OAUTH_PROVIDERS = [
  { id: "google", name: "Google" },
  { id: "apple", name: "Apple" },
  // { id: "facebook", name: "Facebook" }, // Uncomment when ready
] as const;

// Validation rules
export const VALIDATION = {
  MIN_AGE: 13,
  MIN_PHONE_LENGTH: 10,
  MIN_PASSWORD_LENGTH: 8,
  MAX_DOCUMENT_LENGTH: 20,
  MAX_NAME_LENGTH: 100,
} as const;

// Debounce and timing delays (in milliseconds)
export const PROFILE_DELAYS = {
  SEARCH_DEBOUNCE: 300,
  AUTO_SAVE: 1000,
  OTP_AUTO_SEND: 2000,
  OTP_RESEND_COOLDOWN: 60000, // 60 seconds
  RATE_LIMIT_OTP: 10000, // 10 seconds between OTP requests
} as const;

// Ticket statuses
export const TICKET_STATUS = {
  VALID: "valid",
  USED: "used",
  CANCELLED: "cancelled",
} as const;

// Status badge variants mapping
export const TICKET_STATUS_VARIANTS = {
  [TICKET_STATUS.VALID]: {
    variant: "default" as const,
    className: "bg-green-500/10 text-green-400 border-green-500/20",
    label: "Válido",
  },
  [TICKET_STATUS.USED]: {
    variant: "secondary" as const,
    className: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    label: "Usado",
  },
  [TICKET_STATUS.CANCELLED]: {
    variant: "destructive" as const,
    className: "bg-red-500/10 text-red-400 border-red-500/20",
    label: "Cancelado",
  },
} as const;

// Month names in Spanish
export const MONTHS_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

// Error messages
export const ERROR_MESSAGES = {
  // Auth errors
  SIGN_OUT_FAILED: "Error al cerrar sesión. Por favor intenta de nuevo.",
  LINK_ACCOUNT_FAILED: "Error al vincular la cuenta. Por favor intenta de nuevo.",
  UNLINK_ACCOUNT_FAILED: "Error al desvincular la cuenta. Por favor intenta de nuevo.",

  // Phone verification errors
  PHONE_INVALID: "El número de teléfono no es válido",
  PHONE_DELETE_FAILED: "Error al eliminar el número de teléfono",
  PHONE_ALREADY_VERIFIED: "Este número ya está verificado por otra cuenta",
  OTP_SEND_FAILED: "Error al enviar el código. Por favor intenta de nuevo.",
  OTP_VERIFY_FAILED: "Error al verificar el código. Por favor intenta de nuevo.",
  OTP_INVALID_LENGTH: "Por favor ingresa el código de verificación de 6 dígitos",
  OTP_RATE_LIMIT: "Por favor espera {seconds} segundos antes de solicitar otro código",

  // Document errors
  DOCUMENT_SAVE_FAILED: "Error al guardar el documento. Por favor intenta de nuevo.",

  // Birth date errors
  BIRTH_DATE_SAVE_FAILED: "Error al guardar la fecha de nacimiento. Por favor intenta de nuevo.",
  BIRTH_DATE_DELETE_FAILED: "Error al eliminar la fecha de nacimiento. Por favor intenta de nuevo.",
  BIRTH_DATE_MIN_AGE: "Debes tener al menos {minAge} años para usar esta plataforma",

  // Password errors
  PASSWORD_MISMATCH: "Las contraseñas no coinciden",
  PASSWORD_WEAK: "La contraseña es demasiado débil",
  PASSWORD_TOO_SHORT: "La contraseña debe tener al menos 8 caracteres",
  PASSWORD_INVALID: "La contraseña no cumple con los requisitos de seguridad",
  PASSWORD_MIN_LENGTH: "La contraseña debe tener al menos {minLength} caracteres",
  PASSWORD_UPDATE_FAILED: "Error al actualizar la contraseña. Por favor intenta de nuevo.",
  PASSWORD_CHANGE_FAILED: "Error al cambiar la contraseña. Por favor intenta de nuevo.",

  // Session errors
  SESSION_LOAD_FAILED: "Error al cargar las sesiones",
  SESSION_REVOKE_FAILED: "Error al cerrar la sesión",
  SESSIONS_REVOKE_ALL_FAILED: "Error al cerrar las otras sesiones",

  // Generic errors
  GENERIC_ERROR: "Ocurrió un error. Por favor intenta de nuevo.",
  NETWORK_ERROR: "Error de conexión. Por favor verifica tu internet.",
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  // Phone verification
  OTP_SENT: "¡Código de verificación enviado!",
  OTP_RESENT: "¡Nuevo código de verificación enviado!",
  PHONE_VERIFIED: "¡Teléfono verificado correctamente!",
  PHONE_DELETED: "Número de teléfono eliminado correctamente",

  // Document
  DOCUMENT_SAVED: "Documento guardado correctamente",

  // Birth date
  BIRTH_DATE_SAVED: "Fecha de nacimiento guardada correctamente",
  BIRTH_DATE_DELETED: "Fecha de nacimiento eliminada correctamente",

  // Password
  PASSWORD_UPDATED: "Contraseña actualizada correctamente",
  PASSWORD_CHANGED: "Contraseña cambiada exitosamente",
  PASSWORD_CHANGED_WITH_REVOKE: "Contraseña cambiada. Se han cerrado todas las demás sesiones",

  // Sessions
  SESSION_REVOKED: "Sesión cerrada correctamente",
  SESSIONS_REVOKED_ALL: "Otras sesiones cerradas correctamente",

  // Accounts
  ACCOUNT_LINKED: "Cuenta vinculada correctamente",
  ACCOUNT_UNLINKED: "Cuenta desvinculada correctamente",
} as const;

// Profile section titles
export const SECTION_TITLES = {
  USER_DATA: "Datos de usuario",
  CONNECTED_ACCOUNTS: "Cuentas conectadas",
  SECURITY: "Seguridad",
  ACTIVE_DEVICES: "Dispositivos activos",
  DANGER_ZONE: "Zona de Peligro",
} as const;

// Empty state messages
export const EMPTY_STATES = {
  NO_TICKETS: "No tienes tickets",
  NO_TICKETS_DESCRIPTION: "Cuando compres tickets, aparecerán aquí",
  NO_ORGANIZATIONS: "No tienes organizaciones",
  NO_ORGANIZATIONS_DESCRIPTION: "Crea tu primera organización para empezar a vender tickets",
  NO_SESSIONS: "No hay sesiones activas",
} as const;
