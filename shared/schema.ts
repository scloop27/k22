import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const lodgeSettings = pgTable("lodge_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address").notNull(),
  contactNumber: text("contact_number").notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).notNull().default("18.00"),
  currency: text("currency").notNull().default("INR"),
  smsTemplate: text("sms_template"),
  defaultCheckinTime: text("default_checkin_time").default("12:00"),
  defaultCheckoutTime: text("default_checkout_time").default("11:00"),
  isSetupComplete: boolean("is_setup_complete").default(false),
});

export const rooms = pgTable("rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomNumber: text("room_number").notNull().unique(),
  roomType: text("room_type").notNull(), // 'single', 'double'
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("available"), // 'available', 'occupied', 'maintenance'
  floor: integer("floor").default(1),
});

export const guests = pgTable("guests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  aadharNumber: text("aadhar_number").notNull(),
  checkinDate: timestamp("checkin_date").notNull(),
  checkoutDate: timestamp("checkout_date").notNull(),
  roomId: varchar("room_id").references(() => rooms.id),
  numberOfGuests: integer("number_of_guests").default(1),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("active"), // 'active', 'checked_out'
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  guestId: varchar("guest_id").references(() => guests.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(), // 'cash', 'qr'
  status: text("status").notNull().default("pending"), // 'pending', 'paid'
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  paidAt: timestamp("paid_at"),
});

export const smsLogs = pgTable("sms_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  guestId: varchar("guest_id").references(() => guests.id).notNull(),
  phoneNumber: text("phone_number").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("sent"), // 'sent', 'delivered', 'failed'
  sentAt: timestamp("sent_at").default(sql`CURRENT_TIMESTAMP`),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertLodgeSettingsSchema = createInsertSchema(lodgeSettings).omit({
  id: true,
});

export const insertRoomSchema = createInsertSchema(rooms).omit({
  id: true,
});

export const insertGuestSchema = createInsertSchema(guests).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  paidAt: true,
});

export const insertSmsLogSchema = createInsertSchema(smsLogs).omit({
  id: true,
  sentAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type LodgeSettings = typeof lodgeSettings.$inferSelect;
export type InsertLodgeSettings = z.infer<typeof insertLodgeSettingsSchema>;

export type Room = typeof rooms.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;

export type Guest = typeof guests.$inferSelect;
export type InsertGuest = z.infer<typeof insertGuestSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type SmsLog = typeof smsLogs.$inferSelect;
export type InsertSmsLog = z.infer<typeof insertSmsLogSchema>;
