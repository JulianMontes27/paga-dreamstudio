import { relations } from "drizzle-orm/relations";
import { documentType, user, menuCategory, menuItem, organization, member, invitation, floor, countries, account, order, table, session, paymentClaim, orderItem } from "./schema";

export const userRelations = relations(user, ({one, many}) => ({
	documentType_documentTypeId: one(documentType, {
		fields: [user.documentTypeId],
		references: [documentType.id],
		relationName: "user_documentTypeId_documentType_id"
	}),
	documentType_documentTypeId: one(documentType, {
		fields: [user.documentTypeId],
		references: [documentType.id],
		relationName: "user_documentTypeId_documentType_id"
	}),
	members: many(member),
	invitations: many(invitation),
	accounts: many(account),
	sessions: many(session),
}));

export const documentTypeRelations = relations(documentType, ({one, many}) => ({
	users_documentTypeId: many(user, {
		relationName: "user_documentTypeId_documentType_id"
	}),
	users_documentTypeId: many(user, {
		relationName: "user_documentTypeId_documentType_id"
	}),
	country_countryId: one(countries, {
		fields: [documentType.countryId],
		references: [countries.id],
		relationName: "documentType_countryId_countries_id"
	}),
	country_countryId: one(countries, {
		fields: [documentType.countryId],
		references: [countries.id],
		relationName: "documentType_countryId_countries_id"
	}),
}));

export const menuItemRelations = relations(menuItem, ({one, many}) => ({
	menuCategory: one(menuCategory, {
		fields: [menuItem.categoryId],
		references: [menuCategory.id]
	}),
	organization: one(organization, {
		fields: [menuItem.organizationId],
		references: [organization.id]
	}),
	orderItems: many(orderItem),
}));

export const menuCategoryRelations = relations(menuCategory, ({one, many}) => ({
	menuItems: many(menuItem),
	organization: one(organization, {
		fields: [menuCategory.organizationId],
		references: [organization.id]
	}),
}));

export const organizationRelations = relations(organization, ({many}) => ({
	menuItems: many(menuItem),
	menuCategories: many(menuCategory),
	members: many(member),
	invitations: many(invitation),
	floors: many(floor),
	orders: many(order),
	tables: many(table),
}));

export const memberRelations = relations(member, ({one}) => ({
	organization: one(organization, {
		fields: [member.organizationId],
		references: [organization.id]
	}),
	user: one(user, {
		fields: [member.userId],
		references: [user.id]
	}),
}));

export const invitationRelations = relations(invitation, ({one}) => ({
	user: one(user, {
		fields: [invitation.inviterId],
		references: [user.id]
	}),
	organization: one(organization, {
		fields: [invitation.organizationId],
		references: [organization.id]
	}),
}));

export const floorRelations = relations(floor, ({one, many}) => ({
	organization: one(organization, {
		fields: [floor.organizationId],
		references: [organization.id]
	}),
	tables: many(table),
}));

export const countriesRelations = relations(countries, ({many}) => ({
	documentTypes_countryId: many(documentType, {
		relationName: "documentType_countryId_countries_id"
	}),
	documentTypes_countryId: many(documentType, {
		relationName: "documentType_countryId_countries_id"
	}),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const orderRelations = relations(order, ({one, many}) => ({
	organization: one(organization, {
		fields: [order.organizationId],
		references: [organization.id]
	}),
	table: one(table, {
		fields: [order.tableId],
		references: [table.id]
	}),
	paymentClaims: many(paymentClaim),
	orderItems: many(orderItem),
}));

export const tableRelations = relations(table, ({one, many}) => ({
	orders: many(order),
	floor: one(floor, {
		fields: [table.floorId],
		references: [floor.id]
	}),
	organization: one(organization, {
		fields: [table.organizationId],
		references: [organization.id]
	}),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const paymentClaimRelations = relations(paymentClaim, ({one}) => ({
	order: one(order, {
		fields: [paymentClaim.orderId],
		references: [order.id]
	}),
}));

export const orderItemRelations = relations(orderItem, ({one}) => ({
	menuItem: one(menuItem, {
		fields: [orderItem.menuItemId],
		references: [menuItem.id]
	}),
	order: one(order, {
		fields: [orderItem.orderId],
		references: [order.id]
	}),
}));