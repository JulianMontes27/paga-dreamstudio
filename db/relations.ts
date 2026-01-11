import { relations } from "drizzle-orm";

import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  decimal,
  jsonb,
  varchar,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { organization, user } from "./schema";

// QR codes for tables
export const qrCode = pgTable("qr_code", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  tableId: text("table_id")
    .notNull()
    .references(() => restaurantTable.id, { onDelete: "cascade" }),
  code: text("code").notNull().unique(), // Unique identifier for the QR code
  checkoutUrl: text("checkout_url").notNull(), // Pre-generated checkout URL
  isActive: boolean("is_active").default(true),
  scanCount: integer("scan_count").default(0),
  lastScannedAt: timestamp("last_scanned_at"),
  expiresAt: timestamp("expires_at"), // Optional expiration
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Payment configuration per organization
// export const paymentConfig = pgTable("payment_config", {
//   id: text("id").primaryKey(),
//   organizationId: text("organization_id")
//     .notNull()
//     .references(() => organization.id, { onDelete: "cascade" })
//     .unique(),

//   // Active payment processor accounts (references to paymentProcessorAccount)
//   activeStripeAccountId: text("active_stripe_account_id").references(
//     () => paymentProcessorAccount.id,
//     { onDelete: "set null" }
//   ),
//   activeSquareAccountId: text("active_square_account_id").references(
//     () => paymentProcessorAccount.id,
//     { onDelete: "set null" }
//   ),
//   activePaypalAccountId: text("active_paypal_account_id").references(
//     () => paymentProcessorAccount.id,
//     { onDelete: "set null" }
//   ),

//   // General payment settings
//   testMode: boolean("test_mode").default(true),
//   tipPercentageOptions: jsonb("tip_percentage_options").default([
//     15, 18, 20, 25,
//   ]),
//   minimumOrderAmount: decimal("minimum_order_amount", {
//     precision: 10,
//     scale: 2,
//   }).default("0.00"),
//   maxTipPercentage: integer("max_tip_percentage").default(50),

//   // Webhook configurations
//   webhookSecret: text("webhook_secret"), // For verifying webhook signatures

//   createdAt: timestamp("created_at").notNull().defaultNow(),
//   updatedAt: timestamp("updated_at").notNull().defaultNow(),
// });

// Order Relations
export const orderRelations = relations(order, ({ one, many }) => ({
  // Each order belongs to one organization
  organization: one(organization, {
    fields: [order.organizationId],
    references: [organization.id],
  }),
  // Each order belongs to one table
  table: one(restaurantTable, {
    fields: [order.tableId],
    references: [restaurantTable.id],
  }),
  // Each order has many order items
  orderItems: many(orderItem),
  // Each order has many payment claims (for split payments)
  paymentClaims: many(paymentClaim),
}));

// Order Item Relations
export const orderItemRelations = relations(orderItem, ({ one }) => ({
  // Each order item belongs to one order
  order: one(order, {
    fields: [orderItem.orderId],
    references: [order.id],
  }),
  // Each order item references one menu item
  menuItem: one(menuItem, {
    fields: [orderItem.menuItemId],
    references: [menuItem.id],
  }),
}));

// Payment Claim Relations
export const paymentClaimRelations = relations(paymentClaim, ({ one }) => ({
  // Each payment claim belongs to one order
  order: one(order, {
    fields: [paymentClaim.orderId],
    references: [order.id],
  }),
}));

// Menu Category Relations
export const menuCategoryRelations = relations(
  menuCategory,
  ({ one, many }) => ({
    // Each category belongs to one organization
    organization: one(organization, {
      fields: [menuCategory.organizationId],
      references: [organization.id],
    }),
    // Each category has many menu items
    items: many(menuItem),
  })
);

// Menu Item Relations
export const menuItemRelations = relations(menuItem, ({ one }) => ({
  // Each menu item belongs to one organization
  organization: one(organization, {
    fields: [menuItem.organizationId],
    references: [organization.id],
  }),
  // Each menu item belongs to one category
  category: one(menuCategory, {
    fields: [menuItem.categoryId],
    references: [menuCategory.id],
  }),
}));

// Floor Relations
export const floorRelations = relations(floor, ({ one, many }) => ({
  // Each floor belongs to one organization
  organization: one(organization, {
    fields: [floor.organizationId],
    references: [organization.id],
  }),
  // Each floor has many tables
  tables: many(restaurantTable),
}));

// Restaurant Table Relations (extended with floor)
export const restaurantTableRelations = relations(
  restaurantTable,
  ({ one, many }) => ({
    // Each table belongs to one organization
    organization: one(organization, {
      fields: [restaurantTable.organizationId],
      references: [organization.id],
    }),
    // Each table belongs to one floor (optional)
    floor: one(floor, {
      fields: [restaurantTable.floorId],
      references: [floor.id],
    }),
    // Each table has one QR code
    qrCode: one(qrCode, {
      fields: [restaurantTable.id],
      references: [qrCode.tableId],
    }),
    // Each table has many orders
    orders: many(order),
  })
);
