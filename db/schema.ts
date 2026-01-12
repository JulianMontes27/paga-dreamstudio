import {
  uuid,
  pgTable,
  unique,
  text,
  boolean,
  timestamp,
  jsonb,
  foreignKey,
  decimal,
  integer,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql, type InferSelectModel, type InferInsertModel } from "drizzle-orm";

export const documentTypeEnum = pgEnum("document_type_enum", [
  "CC",
  "CE",
  "DNI",
  "RUT",
  "RFC",
  "CPF",
  "PASSPORT",
  "OTHER",
]);
export const languageType = pgEnum("language_type", ["es", "en", "pt", "fr"]);
export const paymentStatus = pgEnum("payment_status", [
  "pending",
  "processing",
  "succeeded",
  "failed",
  "cancelled",
  "refunded",
]);
export const orderFrom = pgEnum("order_from", ["cash", "web", "app"]);
export const privacyType = pgEnum("privacy_type", ["public", "private"]);
export const refundStatus = pgEnum("refund_status", [
  "pending",
  "accepted",
  "rejected",
]);
export const memberRole = pgEnum("member_role", [
  "waiter",
  "administrator",
  "owner",
]);
export const themeModeType = pgEnum("theme_mode_type", [
  "light",
  "dark",
  "adaptive",
]);
export const genderType = pgEnum("gender_type", [
  "masculino",
  "femenino",
  "otro",
  "prefiero_no_decir",
]);

/**
 * ->>>>>>>>>>>>>>>>>>>>>>>>>>>>
 * ->>>>>>>>>>>>>>>>>>>>>>>>>>>>
 */

// Countries table
export const countries = pgTable(
  "countries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    countryName: text("country_name").notNull(),
    countryCode: text("country_code"),
    currency: text("currency").notNull(),
  },
  (table) => [unique("countries_country_name_key").on(table.countryName)]
);
// Document Type table
export const documentType = pgTable(
  "document_type",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    countryId: uuid("country_id")
      .notNull()
      .references(() => countries.id),
    name: text("name").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.countryId],
      foreignColumns: [countries.id],
      name: "document_type_country_id_fkey",
    }),
  ]
);

/**
 * Auth
 */
export const user = pgTable(
  "user",
  {
    id: text().primaryKey().notNull(),
    name: text().notNull(),
    email: text().notNull(),
    emailVerified: boolean().notNull(),
    image: text(),
    createdAt: timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    role: text(),
    banned: boolean(),
    banReason: text(),
    banExpires: timestamp({ withTimezone: true }),
    isAnonymous: boolean(),
    phoneNumber: text(),
    phoneNumberVerified: boolean(),
    userMetadata: jsonb(),
    appMetadata: jsonb(),
    invitedAt: timestamp({ withTimezone: true }),
    lastSignInAt: timestamp({ withTimezone: true }),
    // New user profile fields
    documentId: text("document_id"),
    documentTypeId: uuid("document_type_id").references(() => documentType.id),
    gender: genderType("gender"),
    birthdate: timestamp("birthdate", { withTimezone: true }),
    // New fields from database
    tipoPersona: text("tipo_persona"),
    nombres: text("nombres"),
    apellidos: text("apellidos"),
    razonSocial: text("razon_social"),
    nit: text("nit"),
  },
  (table) => [
    // The UNIQUE constraint ensures that all values in a column are different.
    unique("user_email_key").on(table.email),
    unique("user_phoneNumber_key").on(table.phoneNumber),
    foreignKey({
      columns: [table.documentTypeId],
      foreignColumns: [documentType.id],
      name: "user_document_type_id_fkey",
    }),
  ]
);
export const session = pgTable(
  "session",
  {
    id: text().primaryKey().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    token: text().notNull(),
    createdAt: timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ withTimezone: true }).notNull(),
    ipAddress: text(),
    userAgent: text(),
    userId: text().notNull(),
    impersonatedBy: text(),
    activeOrganizationId: text(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "session_userId_fkey",
    }).onDelete("cascade"),
    unique("session_token_key").on(table.token),
  ]
);
export const account = pgTable(
  "account",
  {
    id: text().primaryKey().notNull(),
    accountId: text().notNull(),
    providerId: text().notNull(),
    userId: text().notNull(),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: timestamp({ withTimezone: true }),
    refreshTokenExpiresAt: timestamp({ withTimezone: true }),
    scope: text(),
    password: text(),
    createdAt: timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ withTimezone: true }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "account_userId_fkey",
    }).onDelete("cascade"),
  ]
);
export const verification = pgTable("verification", {
  id: text().primaryKey().notNull(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  createdAt: timestamp({ withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp({ withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

/**
 * Organization
 */
export const organization = pgTable(
  "organization",
  {
    id: text().primaryKey().notNull(),
    name: text().notNull(),
    slug: text().notNull(),
    logo: text(),
    createdAt: timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    metadata: text(),
    openingHours: jsonb("opening_hours"), // JSON object with days and hours
    seatingCapacity: integer("seating_capacity"),
    cuisineType: text("cuisine_type"),

    // New fields from database
    tipoOrganizacion: text("tipo_organizacion"),
    nombres: text("nombres"),
    apellidos: text("apellidos"),
    tipoDocumento: text("tipo_documento"),
    numeroDocumento: text("numero_documento"),
    nit: text("nit"),
    direccion: text("direccion"),
    numeroTelefono: text("numero_telefono"),
    correoElectronico: text("correo_electronico"),
    rutUrl: text("rut_url"),
    cerlUrl: text("cerl_url"),
  },
  (table) => [unique("organization_slug_key").on(table.slug)]
);
export const member = pgTable(
  "member",
  {
    id: text().primaryKey().notNull(),
    organizationId: text().notNull(),
    userId: text().notNull(),
    role: memberRole("role").default("waiter").notNull(),
    createdAt: timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "member_organizationId_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "member_userId_fkey",
    }).onDelete("cascade"),
  ]
);
export const invitation = pgTable(
  "invitation",
  {
    id: text().primaryKey().notNull(),
    organizationId: text().notNull(),
    email: text().notNull(),
    role: memberRole("role").default("waiter"),
    status: text().default("pending").notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    inviterId: text().notNull(),
    createdAt: timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "invitation_organizationId_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.inviterId],
      foreignColumns: [user.id],
      name: "invitation_inviterId_fkey",
    }).onDelete("cascade"),
  ]
);

/**
 * Restaurantes
 */
// Menu categories
export const menuCategory = pgTable("menu_category", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Menu items
export const menuItem = pgTable("menu_item", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  categoryId: text("category_id").references(() => menuCategory.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  isAvailable: boolean("is_available").default(true),
  preparationTime: integer("preparation_time"), // in minutes
  allergens: jsonb("allergens"), // Array of allergen names
  nutritionalInfo: jsonb("nutritional_info"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const floor = pgTable("floor", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // "Main Floor", "Rooftop", etc.
  displayOrder: integer("display_order").default(0),
  canvasWidth: integer("canvas_width").default(800),
  canvasHeight: integer("canvas_height").default(600),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const table = pgTable("table", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  floorId: text("floor_id").references(() => floor.id, { onDelete: "cascade" }),
  xPosition: integer("x_position"), // null = not placed on map
  yPosition: integer("y_position"),
  width: integer("width").default(80),
  height: integer("height").default(80),
  shape: text("shape").default("rectangular"), // rectangular, circular, oval, bar
  tableNumber: text("table_number").notNull(),
  capacity: integer("capacity").notNull(),
  status: text("status").notNull().default("available"), // available, occupied, reserved, cleaning
  section: text("section"), // e.g., "Main Floor", "Patio", "Bar"
  isNFCEnabled: boolean("is_nfc_enabled").default(true),
  nfcScanCount: integer("nfc_scan_count").default(0), // Track NFC tag scans
  lastNfcScanAt: timestamp("last_nfc_scan_at", { withTimezone: true }), // Last scan timestamp
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Orders
export const order = pgTable("order", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  tableId: text("table_id").references(() => table.id, {
    onDelete: "set null",
  }),
  orderNumber: text("order_number").notNull(),
  status: text("status").notNull().default("ordering"), // ordering, payment_started, partially_paid, paid, cancelled
  orderType: text("order_type").notNull().default("dine-in"), // dine-in, takeout, delivery
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull(),
  tipAmount: decimal("tip_amount", { precision: 10, scale: 2 }).default("0.00"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  createdBy: text("created_by"), // userId of the waiter/staff who created the order
  servedBy: text("served_by"), // userId of the waiter/staff who served
  paidAt: timestamp("paid_at"),
  // Payment tracking fields
  paymentProcessor: text("payment_processor"), // mercadopago, stripe, etc.
  paymentId: text("payment_id"), // External payment processor transaction ID
  preferenceId: text("preference_id"), // Payment preference/intent ID from processor
  paymentStatus: text("payment_status").default("pending"), // pending, approved, rejected, refunded
  paymentMetadata: jsonb("payment_metadata"), // Store additional payment info (merchant_order_id, etc.)
  // Fee tracking from payment processor
  processorFee: decimal("processor_fee", { precision: 10, scale: 2 }).default(
    "0.00"
  ), // MercadoPago fee
  marketplaceFee: decimal("marketplace_fee", {
    precision: 10,
    scale: 2,
  }).default("0.00"), // Application/platform fee
  // Collaborative payment tracking
  totalClaimed: decimal("total_claimed", { precision: 10, scale: 2 }).default(
    "0.00"
  ), // Sum of active payment claims
  totalPaid: decimal("total_paid", { precision: 10, scale: 2 }).default("0.00"), // Sum of completed payments
  isLocked: boolean("is_locked").default(false), // True when payment has started (no more item changes)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Payment Claims (for collaborative bill splitting)
export const paymentClaim = pgTable("payment_claim", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => order.id, { onDelete: "cascade" }),

  // Amounts
  claimedAmount: decimal("claimed_amount", {
    precision: 10,
    scale: 2,
  }).notNull(), // Amount they want to pay
  splitFeePortion: decimal("split_fee_portion", {
    precision: 10,
    scale: 2,
  }).notNull(), // Their share of split fees
  totalToPay: decimal("total_to_pay", { precision: 10, scale: 2 }).notNull(), // claimedAmount + splitFeePortion

  // Lifecycle
  status: text("status").notNull().default("reserved"), // reserved, processing, paid, expired, cancelled
  claimedAt: timestamp("claimed_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(), // Reservation expires in 5 minutes

  // Payment tracking
  paymentProcessor: text("payment_processor"), // mercadopago, stripe, etc.
  paymentId: text("payment_id"), // MercadoPago payment ID
  preferenceId: text("preference_id"), // Payment preference ID
  paymentMetadata: jsonb("payment_metadata"),
  paidAt: timestamp("paid_at"),

  // Fee tracking from payment processor (per-claim fees)
  processorFee: decimal("processor_fee", { precision: 10, scale: 2 }).default(
    "0.00"
  ), // MercadoPago fee for this claim
  marketplaceFee: decimal("marketplace_fee", {
    precision: 10,
    scale: 2,
  }).default("0.00"), // Platform fee for this claim

  // Session tracking (to prevent duplicate claims)
  sessionToken: text("session_token").notNull(),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Order items
export const orderItem = pgTable("order_item", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => order.id, { onDelete: "cascade" }),
  menuItemId: text("menu_item_id").references(() => menuItem.id, {
    onDelete: "set null",
  }),
  itemName: text("item_name"), // Store item name for QR orders (when menuItemId is null)
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  specialInstructions: text("special_instructions"),
  status: text("status").notNull().default("pending"), // pending, preparing, ready, served
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * ->>>>>>>>>>>>>>>>>>>>>>>>>>>>
 * ->>>>>>>>>>>>>>>>>>>>>>>>>>>>
 */

// Export schema object for Drizzle
export const schema = {
  user,
  session,
  account,
  verification,
  organization,
  member,
  invitation,
  countries,
  documentType,
  menuCategory,
  menuItem,
  floor,
  table,
  order,
  orderItem,
  paymentClaim,
};

// Inferred types from Drizzle schema
export type User = InferSelectModel<typeof user>;
export type NewUser = InferInsertModel<typeof user>;
export type Organization = InferSelectModel<typeof organization>;
export type NewOrganization = InferInsertModel<typeof organization>;
export type Member = InferSelectModel<typeof member>;
export type NewMember = InferInsertModel<typeof member>;
export type Invitation = InferSelectModel<typeof invitation>;
export type NewInvitation = InferInsertModel<typeof invitation>;
export type Country = InferSelectModel<typeof countries>;
export type NewCountry = InferInsertModel<typeof countries>;
export type DocumentType = InferSelectModel<typeof documentType>;
export type NewDocumentType = InferInsertModel<typeof documentType>;
export type MenuCategory = InferSelectModel<typeof menuCategory>;
export type NewMenuCategory = InferInsertModel<typeof menuCategory>;
export type MenuItem = InferSelectModel<typeof menuItem>;
export type NewMenuItem = InferInsertModel<typeof menuItem>;
export type Floor = InferSelectModel<typeof floor>;
export type NewFloor = InferInsertModel<typeof floor>;
export type Table = InferSelectModel<typeof table>;
export type NewTable = InferInsertModel<typeof table>;
export type Order = InferSelectModel<typeof order>;
export type NewOrder = InferInsertModel<typeof order>;
export type OrderItem = InferSelectModel<typeof orderItem>;
export type NewOrderItem = InferInsertModel<typeof orderItem>;
export type PaymentClaim = InferSelectModel<typeof paymentClaim>;
export type NewPaymentClaim = InferInsertModel<typeof paymentClaim>;
