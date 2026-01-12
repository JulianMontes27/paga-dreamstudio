import { relations } from "drizzle-orm";
import {
  floor,
  menuCategory,
  menuItem,
  order,
  orderItem,
  organization,
  paymentClaim,
  table,
} from "./schema";

// Order Relations
export const orderRelations = relations(order, ({ one, many }) => ({
  // Each order belongs to one organization
  organization: one(organization, {
    fields: [order.organizationId],
    references: [organization.id],
  }),
  // Each order belongs to one table
  table: one(table, {
    fields: [order.tableId],
    references: [table.id],
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
  tables: many(table),
}));

// Restaurant Table Relations (extended with floor)
export const restaurantTableRelations = relations(table, ({ one, many }) => ({
  // Each table belongs to one organization
  organization: one(organization, {
    fields: [table.organizationId],
    references: [organization.id],
  }),
  // Each table belongs to one floor (optional)
  floor: one(floor, {
    fields: [table.floorId],
    references: [floor.id],
  }),

  // Each table has many orders
  orders: many(order),
}));
