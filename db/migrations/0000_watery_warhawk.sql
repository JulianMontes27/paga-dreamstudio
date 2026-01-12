CREATE TYPE "public"."document_type_enum" AS ENUM('CC', 'CE', 'DNI', 'RUT', 'RFC', 'CPF', 'PASSPORT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."gender_type" AS ENUM('masculino', 'femenino', 'otro', 'prefiero_no_decir');--> statement-breakpoint
CREATE TYPE "public"."language_type" AS ENUM('es', 'en', 'pt', 'fr');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('waiter', 'administrator', 'owner');--> statement-breakpoint
CREATE TYPE "public"."order_from" AS ENUM('cash', 'web', 'app');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."privacy_type" AS ENUM('public', 'private');--> statement-breakpoint
CREATE TYPE "public"."refund_status" AS ENUM('pending', 'accepted', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."theme_mode_type" AS ENUM('light', 'dark', 'adaptive');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp with time zone,
	"refreshTokenExpiresAt" timestamp with time zone,
	"scope" text,
	"password" text,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"country_name" text NOT NULL,
	"country_code" text,
	"currency" text NOT NULL,
	CONSTRAINT "countries_country_name_key" UNIQUE("country_name")
);
--> statement-breakpoint
CREATE TABLE "document_type" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"country_id" uuid NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "floor" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"display_order" integer DEFAULT 0,
	"canvas_width" integer DEFAULT 800,
	"canvas_height" integer DEFAULT 600,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"email" text NOT NULL,
	"role" "member_role" DEFAULT 'waiter',
	"status" text DEFAULT 'pending' NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"inviterId" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"userId" text NOT NULL,
	"role" "member_role" DEFAULT 'waiter' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_category" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_item" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"category_id" text,
	"name" text NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"image_url" text,
	"is_available" boolean DEFAULT true,
	"preparation_time" integer,
	"allergens" jsonb,
	"nutritional_info" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"table_id" text,
	"order_number" text NOT NULL,
	"status" text DEFAULT 'ordering' NOT NULL,
	"order_type" text DEFAULT 'dine-in' NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"tax_amount" numeric(10, 2) NOT NULL,
	"tip_amount" numeric(10, 2) DEFAULT '0.00',
	"total_amount" numeric(10, 2) NOT NULL,
	"notes" text,
	"customer_name" text,
	"customer_phone" text,
	"created_by" text,
	"served_by" text,
	"paid_at" timestamp,
	"payment_processor" text,
	"payment_id" text,
	"preference_id" text,
	"payment_status" text DEFAULT 'pending',
	"payment_metadata" jsonb,
	"processor_fee" numeric(10, 2) DEFAULT '0.00',
	"marketplace_fee" numeric(10, 2) DEFAULT '0.00',
	"total_claimed" numeric(10, 2) DEFAULT '0.00',
	"total_paid" numeric(10, 2) DEFAULT '0.00',
	"is_locked" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_item" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"menu_item_id" text,
	"item_name" text,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"special_instructions" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"metadata" text,
	"opening_hours" jsonb,
	"seating_capacity" integer,
	"cuisine_type" text,
	"tipo_organizacion" text,
	"nombres" text,
	"apellidos" text,
	"tipo_documento" text,
	"numero_documento" text,
	"nit" text,
	"direccion" text,
	"numero_telefono" text,
	"correo_electronico" text,
	"rut_url" text,
	"cerl_url" text,
	CONSTRAINT "organization_slug_key" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "payment_claim" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"claimed_amount" numeric(10, 2) NOT NULL,
	"split_fee_portion" numeric(10, 2) NOT NULL,
	"total_to_pay" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'reserved' NOT NULL,
	"claimed_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"payment_processor" text,
	"payment_id" text,
	"preference_id" text,
	"payment_metadata" jsonb,
	"paid_at" timestamp,
	"processor_fee" numeric(10, 2) DEFAULT '0.00',
	"marketplace_fee" numeric(10, 2) DEFAULT '0.00',
	"session_token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL,
	"impersonatedBy" text,
	"activeOrganizationId" text,
	CONSTRAINT "session_token_key" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "table" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"floor_id" text,
	"x_position" integer,
	"y_position" integer,
	"width" integer DEFAULT 80,
	"height" integer DEFAULT 80,
	"shape" text DEFAULT 'rectangular',
	"table_number" text NOT NULL,
	"capacity" integer NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"section" text,
	"is_nfc_enabled" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean NOT NULL,
	"image" text,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"role" text,
	"banned" boolean,
	"banReason" text,
	"banExpires" timestamp with time zone,
	"isAnonymous" boolean,
	"phoneNumber" text,
	"phoneNumberVerified" boolean,
	"userMetadata" jsonb,
	"appMetadata" jsonb,
	"invitedAt" timestamp with time zone,
	"lastSignInAt" timestamp with time zone,
	"document_id" text,
	"document_type_id" uuid,
	"gender" "gender_type",
	"birthdate" timestamp with time zone,
	"tipo_persona" text,
	"nombres" text,
	"apellidos" text,
	"razon_social" text,
	"nit" text,
	CONSTRAINT "user_email_key" UNIQUE("email"),
	CONSTRAINT "user_phoneNumber_key" UNIQUE("phoneNumber")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_type" ADD CONSTRAINT "document_type_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_type" ADD CONSTRAINT "document_type_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "floor" ADD CONSTRAINT "floor_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_category" ADD CONSTRAINT "menu_category_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_item" ADD CONSTRAINT "menu_item_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_item" ADD CONSTRAINT "menu_item_category_id_menu_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."menu_category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_table_id_table_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."table"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_menu_item_id_menu_item_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_item"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_claim" ADD CONSTRAINT "payment_claim_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table" ADD CONSTRAINT "table_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table" ADD CONSTRAINT "table_floor_id_floor_id_fk" FOREIGN KEY ("floor_id") REFERENCES "public"."floor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_document_type_id_document_type_id_fk" FOREIGN KEY ("document_type_id") REFERENCES "public"."document_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_document_type_id_fkey" FOREIGN KEY ("document_type_id") REFERENCES "public"."document_type"("id") ON DELETE no action ON UPDATE no action;