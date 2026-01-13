import {
  pgTable,
  text,
  timestamp,
  foreignKey,
  unique,
  boolean,
  jsonb,
  uuid,
  integer,
  numeric,
  pgEnum,
} from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel, sql } from "drizzle-orm";

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
export const genderType = pgEnum("gender_type", [
  "masculino",
  "femenino",
  "otro",
  "prefiero_no_decir",
]);
export const languageType = pgEnum("language_type", ["es", "en", "pt", "fr"]);
export const memberRole = pgEnum("member_role", [
  "waiter",
  "administrator",
  "owner",
]);
export const orderFrom = pgEnum("order_from", ["cash", "web", "app"]);
export const paymentStatus = pgEnum("payment_status", [
  "pending",
  "processing",
  "succeeded",
  "failed",
  "cancelled",
  "refunded",
]);
export const privacyType = pgEnum("privacy_type", ["public", "private"]);
export const refundStatus = pgEnum("refund_status", [
  "pending",
  "accepted",
  "rejected",
]);
export const themeModeType = pgEnum("theme_mode_type", [
  "light",
  "dark",
  "adaptive",
]);

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
    documentId: text("document_id"),
    documentTypeId: uuid("document_type_id"),
    gender: genderType(),
    birthdate: timestamp({ withTimezone: true }),
    tipoPersona: text("tipo_persona"),
    nombres: text(),
    apellidos: text(),
    razonSocial: text("razon_social"),
    nit: text(),
  },
  (table) => [
    foreignKey({
      columns: [table.documentTypeId],
      foreignColumns: [documentType.id],
      name: "user_document_type_id_fkey",
    }),
    unique("user_email_key").on(table.email),
    unique("user_phoneNumber_key").on(table.phoneNumber),
  ]
);

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
    openingHours: jsonb("opening_hours"),
    seatingCapacity: integer("seating_capacity"),
    cuisineType: text("cuisine_type"),
    tipoOrganizacion: text("tipo_organizacion"),
    nombres: text(),
    apellidos: text(),
    tipoDocumento: text("tipo_documento"),
    numeroDocumento: text("numero_documento"),
    nit: text(),
    direccion: text(),
    numeroTelefono: text("numero_telefono"),
    correoElectronico: text("correo_electronico"),
    rutUrl: text("rut_url"),
    cerlUrl: text("cerl_url"),
  },
  (table) => [unique("organization_slug_key").on(table.slug)]
);

export const menuItem = pgTable(
  "menu_item",
  {
    id: text().primaryKey().notNull(),
    organizationId: text("organization_id").notNull(),
    categoryId: text("category_id"),
    name: text().notNull(),
    description: text(),
    price: numeric({ precision: 10, scale: 2 }).notNull(),
    imageUrl: text("image_url"),
    isAvailable: boolean("is_available").default(true),
    preparationTime: integer("preparation_time"),
    allergens: jsonb(),
    nutritionalInfo: jsonb("nutritional_info"),
    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.categoryId],
      foreignColumns: [menuCategory.id],
      name: "menu_item_category_id_menu_category_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "menu_item_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ]
);

export const menuCategory = pgTable(
  "menu_category",
  {
    id: text().primaryKey().notNull(),
    organizationId: text("organization_id").notNull(),
    name: text().notNull(),
    description: text(),
    displayOrder: integer("display_order").default(0),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "menu_category_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ]
);

export const member = pgTable(
  "member",
  {
    id: text().primaryKey().notNull(),
    organizationId: text().notNull(),
    userId: text().notNull(),
    role: memberRole().default("waiter").notNull(),
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
    role: memberRole().default("waiter"),
    status: text().default("pending").notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    inviterId: text().notNull(),
    createdAt: timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.inviterId],
      foreignColumns: [user.id],
      name: "invitation_inviterId_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "invitation_organizationId_fkey",
    }).onDelete("cascade"),
  ]
);

export const floor = pgTable(
  "floor",
  {
    id: text().primaryKey().notNull(),
    organizationId: text("organization_id").notNull(),
    name: text().notNull(),
    displayOrder: integer("display_order").default(0),
    canvasWidth: integer("canvas_width").default(800),
    canvasHeight: integer("canvas_height").default(600),
    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "floor_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ]
);

export const documentType = pgTable(
  "document_type",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    countryId: uuid("country_id").notNull(),
    name: text().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.countryId],
      foreignColumns: [countries.id],
      name: "document_type_country_id_fkey",
    }),
  ]
);

export const countries = pgTable(
  "countries",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    countryName: text("country_name").notNull(),
    countryCode: text("country_code"),
    currency: text().notNull(),
  },
  (table) => [unique("countries_country_name_key").on(table.countryName)]
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

export const order = pgTable(
  "order",
  {
    id: text().primaryKey().notNull(),
    organizationId: text("organization_id").notNull(),
    tableId: uuid("table_id"),
    orderNumber: text("order_number").notNull(),
    status: text().default("ordering").notNull(),
    orderType: text("order_type").default("dine-in").notNull(),
    subtotal: numeric({ precision: 10, scale: 2 }).notNull(),
    taxAmount: numeric("tax_amount", { precision: 10, scale: 2 }).notNull(),
    tipAmount: numeric("tip_amount", { precision: 10, scale: 2 }).default(
      "0.00"
    ),
    totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
    notes: text(),
    customerName: text("customer_name"),
    customerPhone: text("customer_phone"),
    createdBy: text("created_by"),
    servedBy: text("served_by"),
    paidAt: timestamp("paid_at"),
    paymentProcessor: text("payment_processor"),
    paymentId: text("payment_id"),
    preferenceId: text("preference_id"),
    paymentStatus: text("payment_status").default("pending"),
    paymentMetadata: jsonb("payment_metadata"),
    processorFee: numeric("processor_fee", { precision: 10, scale: 2 }).default(
      "0.00"
    ),
    marketplaceFee: numeric("marketplace_fee", {
      precision: 10,
      scale: 2,
    }).default("0.00"),
    totalClaimed: numeric("total_claimed", { precision: 10, scale: 2 }).default(
      "0.00"
    ),
    totalPaid: numeric("total_paid", { precision: 10, scale: 2 }).default(
      "0.00"
    ),
    isLocked: boolean("is_locked").default(false),
    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "order_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.tableId],
      foreignColumns: [table.id],
      name: "order_table_id_table_id_fk",
    }).onDelete("set null"),
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

export const paymentClaim = pgTable(
  "payment_claim",
  {
    id: text().primaryKey().notNull(),
    orderId: text("order_id").notNull(),
    claimedAmount: numeric("claimed_amount", {
      precision: 10,
      scale: 2,
    }).notNull(),
    splitFeePortion: numeric("split_fee_portion", {
      precision: 10,
      scale: 2,
    }).notNull(),
    totalToPay: numeric("total_to_pay", { precision: 10, scale: 2 }).notNull(),
    status: text().default("reserved").notNull(),
    claimedAt: timestamp("claimed_at")
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    paymentProcessor: text("payment_processor"),
    paymentId: text("payment_id"),
    preferenceId: text("preference_id"),
    paymentMetadata: jsonb("payment_metadata"),
    paidAt: timestamp("paid_at"),
    processorFee: numeric("processor_fee", { precision: 10, scale: 2 }).default(
      "0.00"
    ),
    marketplaceFee: numeric("marketplace_fee", {
      precision: 10,
      scale: 2,
    }).default("0.00"),
    sessionToken: text("session_token").notNull(),
    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [order.id],
      name: "payment_claim_order_id_order_id_fk",
    }).onDelete("cascade"),
  ]
);

export const orderItem = pgTable(
  "order_item",
  {
    id: text().primaryKey().notNull(),
    orderId: text("order_id").notNull(),
    menuItemId: text("menu_item_id"),
    itemName: text("item_name"),
    quantity: integer().notNull(),
    unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
    totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),
    specialInstructions: text("special_instructions"),
    status: text().default("pending").notNull(),
    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.menuItemId],
      foreignColumns: [menuItem.id],
      name: "order_item_menu_item_id_menu_item_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [order.id],
      name: "order_item_order_id_order_id_fk",
    }).onDelete("cascade"),
  ]
);

export const table = pgTable(
  "table",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    organizationId: text("organization_id").notNull(),
    floorId: text("floor_id"),
    xPosition: integer("x_position"),
    yPosition: integer("y_position"),
    width: integer().default(80),
    height: integer().default(80),
    shape: text().default("rectangular"),
    tableNumber: text("table_number").notNull(),
    capacity: integer().notNull(),
    status: text().default("available").notNull(),
    section: text(),
    isNfcEnabled: boolean("is_nfc_enabled").default(true),
    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
    nfcScanCount: integer("nfc_scan_count").default(0),
    lastNfcScanAt: timestamp("last_nfc_scan_at", {
      withTimezone: true,
    }),
  },
  (table) => [
    foreignKey({
      columns: [table.floorId],
      foreignColumns: [floor.id],
      name: "table_floor_id_floor_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "table_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ]
);

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
