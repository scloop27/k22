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
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and, lt, gt, inArray } from "drizzle-orm";

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

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private lodgeSettings: Map<string, LodgeSettings>;
  private rooms: Map<string, Room>;
  private guests: Map<string, Guest>;
  private payments: Map<string, Payment>;
  private smsLogs: Map<string, SmsLog>;

  constructor() {
    this.users = new Map();
    this.lodgeSettings = new Map();
    this.rooms = new Map();
    this.guests = new Map();
    this.payments = new Map();
    this.smsLogs = new Map();

    // Create default admin user
    const adminId = randomUUID();
    const admin: User = {
      id: adminId,
      username: "admin",
      password: "admin123", // In production, this should be hashed
    };
    this.users.set(adminId, admin);
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Lodge settings methods
  async getLodgeSettings(): Promise<LodgeSettings | undefined> {
    return Array.from(this.lodgeSettings.values())[0];
  }

  async createLodgeSettings(
    settings: InsertLodgeSettings,
  ): Promise<LodgeSettings> {
    const id = randomUUID();
    const lodgeSettings: LodgeSettings = {
      ...settings,
      id,
      taxRate: settings.taxRate || "18.00",
      currency: settings.currency || "INR",
      smsTemplate: settings.smsTemplate || null,
      defaultCheckinTime: settings.defaultCheckinTime || "12:00",
      defaultCheckoutTime: settings.defaultCheckoutTime || "11:00",
      isSetupComplete: settings.isSetupComplete || false,
    };
    this.lodgeSettings.set(id, lodgeSettings);
    return lodgeSettings;
  }

  async updateLodgeSettings(
    id: string,
    settings: Partial<InsertLodgeSettings>,
  ): Promise<LodgeSettings | undefined> {
    const existing = this.lodgeSettings.get(id);
    if (!existing) return undefined;

    const updated: LodgeSettings = { ...existing, ...settings };
    this.lodgeSettings.set(id, updated);
    return updated;
  }

  // Room methods
  async getAllRooms(): Promise<Room[]> {
    return Array.from(this.rooms.values());
  }

  async getRoom(id: string): Promise<Room | undefined> {
    return this.rooms.get(id);
  }

  async getRoomByNumber(roomNumber: string): Promise<Room | undefined> {
    return Array.from(this.rooms.values()).find(
      (room) => room.roomNumber === roomNumber,
    );
  }

  async createRoom(room: InsertRoom): Promise<Room> {
    const id = randomUUID();
    const newRoom: Room = {
      ...room,
      id,
      status: room.status || "available",
      floor: room.floor || 1,
    };
    this.rooms.set(id, newRoom);
    return newRoom;
  }

  async updateRoom(
    id: string,
    room: Partial<InsertRoom>,
  ): Promise<Room | undefined> {
    const existing = this.rooms.get(id);
    if (!existing) return undefined;

    const updated: Room = { ...existing, ...room };
    this.rooms.set(id, updated);
    return updated;
  }

  async deleteRoom(id: string): Promise<boolean> {
    return this.rooms.delete(id);
  }

  async getAvailableRooms(
    checkinDate: Date,
    checkoutDate: Date,
  ): Promise<Room[]> {
    const availableRooms = Array.from(this.rooms.values()).filter(
      (room) => room.status === "available",
    );

    // Check for overlapping bookings
    const overlappingGuests = Array.from(this.guests.values()).filter(
      (guest) => {
        if (guest.status !== "active") return false;

        const guestCheckin = new Date(guest.checkinDate);
        const guestCheckout = new Date(guest.checkoutDate);

        return checkinDate < guestCheckout && checkoutDate > guestCheckin;
      },
    );

    const occupiedRoomIds = new Set(
      overlappingGuests.map((guest) => guest.roomId),
    );

    return availableRooms.filter((room) => !occupiedRoomIds.has(room.id));
  }

  // Guest methods
  async getAllGuests(): Promise<Guest[]> {
    return Array.from(this.guests.values());
  }

  async getGuest(id: string): Promise<Guest | undefined> {
    return this.guests.get(id);
  }

  async getGuestsByPhone(phoneNumber: string): Promise<Guest[]> {
    return Array.from(this.guests.values()).filter(
      (guest) => guest.phoneNumber === phoneNumber,
    );
  }

  async getGuestsByAadhar(aadharNumber: string): Promise<Guest[]> {
    return Array.from(this.guests.values()).filter(
      (guest) => guest.aadharNumber === aadharNumber,
    );
  }

  async createGuest(guest: InsertGuest): Promise<Guest> {
    const id = randomUUID();
    const newGuest: Guest = {
      ...guest,
      id,
      roomId: guest.roomId || null,
      numberOfGuests: guest.numberOfGuests || 1,
      status: guest.status || "active",
      createdAt: new Date(),
    };
    this.guests.set(id, newGuest);
    return newGuest;
  }

  async updateGuest(
    id: string,
    guest: Partial<InsertGuest>,
  ): Promise<Guest | undefined> {
    const existing = this.guests.get(id);
    if (!existing) return undefined;

    const updated: Guest = { ...existing, ...guest };
    this.guests.set(id, updated);
    return updated;
  }

  async getActiveGuests(): Promise<Guest[]> {
    return Array.from(this.guests.values()).filter(
      (guest) => guest.status === "active",
    );
  }

  // Payment methods
  async getAllPayments(): Promise<Payment[]> {
    return Array.from(this.payments.values());
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async getPaymentsByGuest(guestId: string): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      (payment) => payment.guestId === guestId,
    );
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const id = randomUUID();
    const newPayment: Payment = {
      ...payment,
      id,
      status: payment.status || "pending",
      createdAt: new Date(),
      paidAt: null,
    };
    this.payments.set(id, newPayment);
    return newPayment;
  }

  async updatePayment(
    id: string,
    payment: Partial<InsertPayment>,
  ): Promise<Payment | undefined> {
    const existing = this.payments.get(id);
    if (!existing) return undefined;

    const updated: Payment = {
      ...existing,
      ...payment,
      paidAt: payment.status === "paid" ? new Date() : existing.paidAt,
    };
    this.payments.set(id, updated);
    return updated;
  }

  async getPendingPayments(): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      (payment) => payment.status === "pending",
    );
  }

  // SMS log methods
  async createSmsLog(smsLog: InsertSmsLog): Promise<SmsLog> {
    const id = randomUUID();
    const newSmsLog: SmsLog = {
      ...smsLog,
      id,
      status: smsLog.status || "sent",
      sentAt: new Date(),
    };
    this.smsLogs.set(id, newSmsLog);
    return newSmsLog;
  }

  async getSmsLogsByGuest(guestId: string): Promise<SmsLog[]> {
    return Array.from(this.smsLogs.values()).filter(
      (log) => log.guestId === guestId,
    );
  }
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;
  private initPromise: Promise<void>;

  constructor() {
    const sql = neon(process.env.DATABASE_URL!);
    this.db = drizzle(sql);

    // Initialize default admin user if it doesn't exist
    this.initPromise = this.initializeAdminUser();
  }

  private async initializeAdminUser() {
    try {
      console.log("Checking for admin user...");
      // Direct database call to avoid circular dependency
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.username, "admin"))
        .limit(1);
      const existingAdmin = result[0];
      
      if (!existingAdmin) {
        console.log("Creating default admin user...");
        await this.db.insert(users).values({
          username: "admin",
          password: "admin123", // In production, this should be hashed
        });
        console.log("Default admin user created successfully");
      } else {
        console.log("Admin user already exists");
      }
    } catch (error) {
      console.error("Failed to initialize admin user:", error);
      throw error;
    }
  }

  private async ensureInitialized() {
    await this.initPromise;
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    await this.ensureInitialized();
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Lodge settings methods
  async getLodgeSettings(): Promise<LodgeSettings | undefined> {
    const result = await this.db.select().from(lodgeSettings).limit(1);
    return result[0];
  }

  async createLodgeSettings(
    settings: InsertLodgeSettings,
  ): Promise<LodgeSettings> {
    const result = await this.db
      .insert(lodgeSettings)
      .values(settings)
      .returning();
    return result[0];
  }

  async updateLodgeSettings(
    id: string,
    settings: Partial<InsertLodgeSettings>,
  ): Promise<LodgeSettings | undefined> {
    const result = await this.db
      .update(lodgeSettings)
      .set(settings)
      .where(eq(lodgeSettings.id, id))
      .returning();
    return result[0];
  }

  // Room methods
  async getAllRooms(): Promise<Room[]> {
    return await this.db.select().from(rooms);
  }

  async getRoom(id: string): Promise<Room | undefined> {
    const result = await this.db
      .select()
      .from(rooms)
      .where(eq(rooms.id, id))
      .limit(1);
    return result[0];
  }

  async getRoomByNumber(roomNumber: string): Promise<Room | undefined> {
    const result = await this.db
      .select()
      .from(rooms)
      .where(eq(rooms.roomNumber, roomNumber))
      .limit(1);
    return result[0];
  }

  async createRoom(room: InsertRoom): Promise<Room> {
    const result = await this.db.insert(rooms).values(room).returning();
    return result[0];
  }

  async updateRoom(
    id: string,
    room: Partial<InsertRoom>,
  ): Promise<Room | undefined> {
    const result = await this.db
      .update(rooms)
      .set(room)
      .where(eq(rooms.id, id))
      .returning();
    return result[0];
  }

  async deleteRoom(id: string): Promise<boolean> {
    const result = await this.db.delete(rooms).where(eq(rooms.id, id));
    return result.rowCount > 0;
  }

  async getAvailableRooms(
    checkinDate: Date,
    checkoutDate: Date,
  ): Promise<Room[]> {
    // Get all available rooms
    const availableRooms = await this.db
      .select()
      .from(rooms)
      .where(eq(rooms.status, "available"));

    // Get overlapping bookings
    const overlappingGuests = await this.db
      .select()
      .from(guests)
      .where(
        and(
          eq(guests.status, "active"),
          lt(guests.checkinDate, checkoutDate),
          gt(guests.checkoutDate, checkinDate),
        ),
      );

    const occupiedRoomIds = new Set(
      overlappingGuests.map((guest) => guest.roomId).filter(Boolean),
    );

    return availableRooms.filter((room) => !occupiedRoomIds.has(room.id));
  }

  // Guest methods
  async getAllGuests(): Promise<Guest[]> {
    return await this.db.select().from(guests);
  }

  async getGuest(id: string): Promise<Guest | undefined> {
    const result = await this.db
      .select()
      .from(guests)
      .where(eq(guests.id, id))
      .limit(1);
    return result[0];
  }

  async getGuestsByPhone(phoneNumber: string): Promise<Guest[]> {
    return await this.db
      .select()
      .from(guests)
      .where(eq(guests.phoneNumber, phoneNumber));
  }

  async getGuestsByAadhar(aadharNumber: string): Promise<Guest[]> {
    return await this.db
      .select()
      .from(guests)
      .where(eq(guests.aadharNumber, aadharNumber));
  }

  async createGuest(guest: InsertGuest): Promise<Guest> {
    const result = await this.db.insert(guests).values(guest).returning();
    return result[0];
  }

  async updateGuest(
    id: string,
    guest: Partial<InsertGuest>,
  ): Promise<Guest | undefined> {
    const result = await this.db
      .update(guests)
      .set(guest)
      .where(eq(guests.id, id))
      .returning();
    return result[0];
  }

  async getActiveGuests(): Promise<Guest[]> {
    return await this.db
      .select()
      .from(guests)
      .where(eq(guests.status, "active"));
  }

  // Payment methods
  async getAllPayments(): Promise<Payment[]> {
    return await this.db.select().from(payments);
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const result = await this.db
      .select()
      .from(payments)
      .where(eq(payments.id, id))
      .limit(1);
    return result[0];
  }

  async getPaymentsByGuest(guestId: string): Promise<Payment[]> {
    return await this.db
      .select()
      .from(payments)
      .where(eq(payments.guestId, guestId));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const result = await this.db.insert(payments).values(payment).returning();
    return result[0];
  }

  async updatePayment(
    id: string,
    payment: Partial<InsertPayment>,
  ): Promise<Payment | undefined> {
    const result = await this.db
      .update(payments)
      .set(payment)
      .where(eq(payments.id, id))
      .returning();
    return result[0];
  }

  async getPendingPayments(): Promise<Payment[]> {
    return await this.db
      .select()
      .from(payments)
      .where(eq(payments.status, "pending"));
  }

  // SMS log methods
  async createSmsLog(smsLog: InsertSmsLog): Promise<SmsLog> {
    const result = await this.db.insert(smsLogs).values(smsLog).returning();
    return result[0];
  }

  async getSmsLogsByGuest(guestId: string): Promise<SmsLog[]> {
    return await this.db
      .select()
      .from(smsLogs)
      .where(eq(smsLogs.guestId, guestId));
  }
}

// Use database storage in production, memory storage for development
export const storage = process.env.DATABASE_URL
  ? new DatabaseStorage()
  : new MemStorage();
