import { createInsertSchema } from "drizzle-zod";
import { boolean, date, integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const centresTable = pgTable("procurement_centres", {
  centreId: text("centre_id").primaryKey(),
  name: text("name").notNull(),
  district: text("district").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const farmersTable = pgTable("farmers", {
  farmerId: text("farmer_id").primaryKey(),
  profileId: text("profile_id").notNull().unique(),
  fullName: text("full_name").notNull(),
  registeredMobile: text("registered_mobile").notNull(),
  village: text("village").notNull(),
  district: text("district").notNull(),
  verificationStatus: text("verification_status").notNull().default("VERIFIED"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const supervisorsTable = pgTable("supervisors", {
  employeeId: text("employee_id").primaryKey(),
  profileId: text("profile_id").notNull().unique(),
  officialEmail: text("official_email").notNull(),
  phone: text("phone").notNull(),
  passwordHash: text("password_hash").notNull(),
  centreId: text("centre_id").references(() => centresTable.centreId),
  role: text("role").notNull().default("supervisor"),
  verificationStatus: text("verification_status").notNull().default("VERIFIED"),
  suspended: boolean("suspended").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: text("created_by"),
});

export const authChallengesTable = pgTable("auth_challenges", {
  id: serial("id").primaryKey(),
  challengeId: text("challenge_id").notNull().unique(),
  role: text("role").notNull(),
  subjectId: text("subject_id").notNull(),
  otpHash: text("otp_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  attempts: integer("attempts").notNull().default(0),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const authSessionsTable = pgTable("auth_sessions", {
  id: serial("id").primaryKey(),
  tokenHash: text("token_hash").notNull().unique(),
  role: text("role").notNull(),
  subjectId: text("subject_id").notNull(),
  centreId: text("centre_id").references(() => centresTable.centreId),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tokenHashIndex: uniqueIndex("auth_sessions_token_hash_idx").on(table.tokenHash),
}));

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  bookingNumber: text("booking_number").notNull().unique(),
  farmerId: text("farmer_id").notNull().references(() => farmersTable.farmerId),
  centreId: text("centre_id").notNull().references(() => centresTable.centreId),
  crop: text("crop").notNull(),
  scheduledDate: date("scheduled_date", { mode: "string" }).notNull(),
  slot: text("slot").notNull(),
  quantity: integer("quantity").notNull(),
  token: text("token").notNull().unique(),
  originalSlot: text("original_slot").notNull(),
  delayMinutes: integer("delay_minutes"),
  delayReason: text("delay_reason"),
  delayChangedAt: timestamp("delay_changed_at", { withTimezone: true }),
  status: text("status").notNull().default("Confirmed"),
  paymentStatus: text("payment_status").notNull().default("Not started"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const noticesTable = pgTable("notices", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  priority: text("priority").notNull().default("normal"),
  startDate: date("start_date", { mode: "string" }).notNull(),
  expiryDate: date("expiry_date", { mode: "string" }).notNull(),
  published: boolean("published").notNull().default(false),
  centreId: text("centre_id").references(() => centresTable.centreId),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCentreSchema = createInsertSchema(centresTable).omit({ createdAt: true });
export const insertFarmerSchema = createInsertSchema(farmersTable).omit({ createdAt: true });
export const insertSupervisorSchema = createInsertSchema(supervisorsTable).omit({ createdAt: true });
export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, createdAt: true });
export const insertNoticeSchema = createInsertSchema(noticesTable).omit({ id: true, createdAt: true });

export type Centre = typeof centresTable.$inferSelect;
export type Farmer = typeof farmersTable.$inferSelect;
export type Supervisor = typeof supervisorsTable.$inferSelect;
export type Booking = typeof bookingsTable.$inferSelect;
export type Notice = typeof noticesTable.$inferSelect;
export type InsertCentre = z.infer<typeof insertCentreSchema>;
export type InsertFarmer = z.infer<typeof insertFarmerSchema>;
export type InsertSupervisor = z.infer<typeof insertSupervisorSchema>;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type InsertNotice = z.infer<typeof insertNoticeSchema>;