import { pgEnum, pgTable, text, timestamp, uuid, integer, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const cityEnum = pgEnum("city", ["Chandigarh", "Mohali", "Zirakpur", "Panchkula", "Other"]);
export const propertyTypeEnum = pgEnum("property_type", ["Apartment", "Villa", "Plot", "Office", "Retail"]);
export const bhkEnum = pgEnum("bhk", ["1", "2", "3", "4", "Studio"]);
export const purposeEnum = pgEnum("purpose", ["Buy", "Rent"]);
export const timelineEnum = pgEnum("timeline", ["0-3m", "3-6m", ">6m", "Exploring"]);
export const sourceEnum = pgEnum("source", ["Website", "Referral", "Walk-in", "Call", "Other"]);
export const statusEnum = pgEnum("status", [
  "New",
  "Qualified",
  "Contacted",
  "Visited",
  "Negotiation",
  "Converted",
  "Dropped",
]);

export const buyers = pgTable("buyers", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: text("full_name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  city: cityEnum("city").notNull(),
  propertyType: propertyTypeEnum("property_type").notNull(),
  bhk: bhkEnum("bhk"),
  purpose: purposeEnum("purpose").notNull(),
  budgetMin: integer("budget_min"),
  budgetMax: integer("budget_max"),
  timeline: timelineEnum("timeline").notNull(),
  source: sourceEnum("source").notNull(),
  status: statusEnum("status").notNull().default("New"),
  notes: text("notes"),
  tags: text("tags").array(),
  ownerId: text("owner_id").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const buyerHistory = pgTable("buyer_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  buyerId: uuid("buyer_id").notNull().references(() => buyers.id, { onDelete: "cascade" }),
  changedBy: text("changed_by").notNull(),
  changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
  diff: jsonb("diff").notNull(),
});

export const buyersRelations = relations(buyers, ({ many }) => ({
  history: many(buyerHistory),
}));

export const buyerHistoryRelations = relations(buyerHistory, ({ one }) => ({
  buyer: one(buyers, {
    fields: [buyerHistory.buyerId],
    references: [buyers.id],
  }),
}));


