import {
  type User,
  type InsertUser,
  type LodgeSettings,
  type InsertLodgeSettings,
  type Room,
  type InsertRoom,
  type Guest,
  type InsertGuest,
  type Payment,
  type InsertPayment,
  type SmsLog,
  type InsertSmsLog,
  users,
  lodgeSettings,
  rooms,
  guests,
  payments,
  smsLogs,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, lt, gt, inArray, desc, gte } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Lodge settings methods
  getLodgeSettings(): Promise<LodgeSettings | undefined>;
  createLodgeSettings(settings: InsertLodgeSettings): Promise<LodgeSettings>;
  updateLodgeSettings(
    id: string,
    settings: Partial<InsertLodgeSettings>,
  ): Promise<LodgeSettings | undefined>;

  // Room methods
  getAllRooms(): Promise<Room[]>;
  getRoom(id: string): Promise<Room | undefined>;
  getRoomByNumber(roomNumber: string): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoom(id: string, room: Partial<InsertRoom>): Promise<Room | undefined>;
  deleteRoom(id: string): Promise<boolean>;
  getAvailableRooms(checkinDate: Date, checkoutDate: Date): Promise<Room[]>;

  // Guest methods
  getAllGuests(): Promise<Guest[]>;
  getGuest(id: string): Promise<Guest | undefined>;
  getGuestsByPhone(phoneNumber: string): Promise<Guest[]>;
  getGuestsByAadhar(aadharNumber: string): Promise<Guest[]>;
  createGuest(guest: InsertGuest): Promise<Guest>;
  updateGuest(
    id: string,
    guest: Partial<InsertGuest>,
  ): Promise<Guest | undefined>;
  getActiveGuests(): Promise<Guest[]>;

  // Payment methods
  getAllPayments(): Promise<Payment[]>;
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentsByGuest(guestId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(
    id: string,
    payment: Partial<InsertPayment>,
  ): Promise<Payment | undefined>;
  getPendingPayments(): Promise<Payment[]>;

  // SMS log methods
  createSmsLog(smsLog: InsertSmsLog): Promise<SmsLog>;
  getSmsLogsByGuest(guestId: string): Promise<SmsLog[]>;
}

export class DatabaseStorage implements IStorage {
  private initPromise: Promise<void>;

  constructor() {
    // Initialize default admin user if it doesn't exist
    this.initPromise = this.initializeAdminUser();
  }

  private async initializeAdminUser() {
    try {
      const existingAdmin = await this.getUserByUsername("admin");
      if (!existingAdmin) {
        await this.createUser({
          username: "admin",
          password: "admin123", // In production, this should be hashed
        });
      }
    } catch (error) {
      console.error("Failed to initialize admin user:", error);
    }
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Lodge settings methods
  async getLodgeSettings(): Promise<LodgeSettings | undefined> {
    const [settings] = await db.select().from(lodgeSettings).limit(1);
    return settings || undefined;
  }

  async createLodgeSettings(
    settings: InsertLodgeSettings,
  ): Promise<LodgeSettings> {
    const [newSettings] = await db
      .insert(lodgeSettings)
      .values(settings)
      .returning();
    return newSettings;
  }

  async updateLodgeSettings(
    id: string,
    settings: Partial<InsertLodgeSettings>,
  ): Promise<LodgeSettings | undefined> {
    const [updated] = await db
      .update(lodgeSettings)
      .set(settings)
      .where(eq(lodgeSettings.id, id))
      .returning();
    return updated || undefined;
  }

  // Room methods
  async getAllRooms(): Promise<Room[]> {
    return await db.select().from(rooms);
  }

  async getRoom(id: string): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room || undefined;
  }

  async getRoomByNumber(roomNumber: string): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.roomNumber, roomNumber));
    return room || undefined;
  }

  async createRoom(room: InsertRoom): Promise<Room> {
    const [newRoom] = await db
      .insert(rooms)
      .values(room)
      .returning();
    return newRoom;
  }

  async updateRoom(id: string, room: Partial<InsertRoom>): Promise<Room | undefined> {
    const [updated] = await db
      .update(rooms)
      .set(room)
      .where(eq(rooms.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteRoom(id: string): Promise<boolean> {
    const result = await db.delete(rooms).where(eq(rooms.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getAvailableRooms(checkinDate: Date, checkoutDate: Date): Promise<Room[]> {
    // Get all rooms
    const allRooms = await this.getAllRooms();
    
    // Get overlapping guests
    const overlappingGuests = await db
      .select()
      .from(guests)
      .where(
        and(
          eq(guests.status, "active"),
          lt(guests.checkinDate, checkoutDate),
          gt(guests.checkoutDate, checkinDate)
        )
      );

    const occupiedRoomIds = new Set(
      overlappingGuests.map((guest) => guest.roomId).filter(Boolean)
    );

    return allRooms.filter((room) => !occupiedRoomIds.has(room.id));
  }

  // Guest methods
  async getAllGuests(): Promise<Guest[]> {
    return await db.select().from(guests);
  }

  async getGuest(id: string): Promise<Guest | undefined> {
    const [guest] = await db.select().from(guests).where(eq(guests.id, id));
    return guest || undefined;
  }

  async getGuestsByPhone(phoneNumber: string): Promise<Guest[]> {
    return await db.select().from(guests).where(eq(guests.phoneNumber, phoneNumber));
  }

  async getGuestsByAadhar(aadharNumber: string): Promise<Guest[]> {
    return await db.select().from(guests).where(eq(guests.aadharNumber, aadharNumber));
  }

  async createGuest(guest: InsertGuest): Promise<Guest> {
    const [newGuest] = await db
      .insert(guests)
      .values(guest)
      .returning();
    return newGuest;
  }

  async updateGuest(
    id: string,
    guest: Partial<InsertGuest>,
  ): Promise<Guest | undefined> {
    const [updated] = await db
      .update(guests)
      .set(guest)
      .where(eq(guests.id, id))
      .returning();
    return updated || undefined;
  }

  async getActiveGuests(): Promise<Guest[]> {
    return await db.select().from(guests).where(eq(guests.status, "active"));
  }

  // Payment methods
  async getAllPayments(): Promise<Payment[]> {
    return await db.select().from(payments).orderBy(desc(payments.createdAt));
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment || undefined;
  }

  async getPaymentsByGuest(guestId: string): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.guestId, guestId));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db
      .insert(payments)
      .values(payment)
      .returning();
    return newPayment;
  }

  async updatePayment(
    id: string,
    payment: Partial<InsertPayment>,
  ): Promise<Payment | undefined> {
    const [updated] = await db
      .update(payments)
      .set(payment)
      .where(eq(payments.id, id))
      .returning();
    return updated || undefined;
  }

  async getPendingPayments(): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.status, "pending"));
  }

  // SMS log methods
  async createSmsLog(smsLog: InsertSmsLog): Promise<SmsLog> {
    const [newSmsLog] = await db
      .insert(smsLogs)
      .values(smsLog)
      .returning();
    return newSmsLog;
  }

  async getSmsLogsByGuest(guestId: string, limit: number = 50): Promise<SmsLog[]> {
    return await db.select().from(smsLogs)
      .where(eq(smsLogs.guestId, guestId))
      .orderBy(desc(smsLogs.sentAt))
      .limit(limit);
  }

  async getRecentSmsLogs(days: number = 30): Promise<SmsLog[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    
    return await db.select().from(smsLogs)
      .where(gte(smsLogs.sentAt, since.toISOString()));
  }
}

export const storage = new DatabaseStorage();