import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

// Extend Express Request interface to include session
declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}
import { 
  insertLodgeSettingsSchema, 
  insertRoomSchema, 
  insertGuestSchema, 
  insertPaymentSchema,
  insertSmsLogSchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set user ID in session
      req.session.userId = user.id;
      
      res.json({ user: { id: user.id, username: user.username } });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      res.json({ user: { id: user.id, username: user.username } });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Lodge settings routes
  app.get("/api/lodge-settings", async (req, res) => {
    try {
      const settings = await storage.getLodgeSettings();
      res.json(settings || null);
    } catch (error) {
      console.error("Error fetching lodge settings:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/lodge-settings", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const validatedData = insertLodgeSettingsSchema.parse(req.body);
      const settings = await storage.createLodgeSettings(validatedData);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/lodge-settings/:id", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { id } = req.params;
      const validatedData = insertLodgeSettingsSchema.partial().parse(req.body);
      const settings = await storage.updateLodgeSettings(id, validatedData);
      
      if (!settings) {
        return res.status(404).json({ message: "Settings not found" });
      }

      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Room routes
  app.get("/api/rooms", async (req, res) => {
    try {
      const rooms = await storage.getAllRooms();
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/rooms", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const validatedData = insertRoomSchema.parse(req.body);
      
      // Check if room number already exists
      const existingRoom = await storage.getRoomByNumber(validatedData.roomNumber);
      if (existingRoom) {
        return res.status(400).json({ message: "Room number already exists" });
      }

      const room = await storage.createRoom(validatedData);
      res.json(room);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/rooms/:id", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { id } = req.params;
      const validatedData = insertRoomSchema.partial().parse(req.body);
      const room = await storage.updateRoom(id, validatedData);
      
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      res.json(room);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/rooms/:id", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { id } = req.params;
      const deleted = await storage.deleteRoom(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Room not found" });
      }

      res.json({ message: "Room deleted" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/rooms/available", async (req, res) => {
    try {
      const { checkinDate, checkoutDate } = req.query;
      
      if (!checkinDate || !checkoutDate) {
        return res.status(400).json({ message: "Check-in and check-out dates required" });
      }

      const checkin = new Date(checkinDate as string);
      const checkout = new Date(checkoutDate as string);
      
      const availableRooms = await storage.getAvailableRooms(checkin, checkout);
      res.json(availableRooms);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Guest routes
  app.get("/api/guests", async (req, res) => {
    try {
      const { search } = req.query;
      let guests = await storage.getAllGuests();
      
      if (search) {
        const searchTerm = (search as string).toLowerCase();
        guests = guests.filter(guest => 
          guest.name.toLowerCase().includes(searchTerm) ||
          guest.phoneNumber.includes(searchTerm) ||
          guest.aadharNumber.includes(searchTerm)
        );
      }

      res.json(guests);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/guests", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const validatedData = insertGuestSchema.parse(req.body);
      
      // Check if room is available
      if (validatedData.roomId) {
        const room = await storage.getRoom(validatedData.roomId);
        if (!room) {
          return res.status(400).json({ message: "Room not found" });
        }
        
        const checkin = new Date(validatedData.checkinDate);
        const checkout = new Date(validatedData.checkoutDate);
        const availableRooms = await storage.getAvailableRooms(checkin, checkout);
        
        if (!availableRooms.find(r => r.id === validatedData.roomId)) {
          return res.status(400).json({ message: "Room not available for selected dates" });
        }

        // Update room status to occupied
        await storage.updateRoom(validatedData.roomId, { status: "occupied" });
      }

      const guest = await storage.createGuest(validatedData);
      
      // Create payment record
      await storage.createPayment({
        guestId: guest.id,
        amount: validatedData.totalAmount,
        paymentMethod: "cash", // Default, can be updated later
        status: "pending"
      });

      // Send welcome SMS (async, don't wait for completion)
      try {
        const lodgeSettings = await storage.getLodgeSettings();
        const room = await storage.getRoom(validatedData.roomId!);
        
        if (lodgeSettings && room) {
          // Import SMS functions dynamically to avoid circular imports
          const { sendWelcomeSMS } = await import("./sms-service");
          sendWelcomeSMS(guest.id, guest, room, lodgeSettings).catch(error => {
            console.error('Failed to send welcome SMS:', error);
          });
        }
      } catch (error) {
        console.error('SMS service error:', error);
      }

      res.json(guest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/guests/:id", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { id } = req.params;
      const validatedData = insertGuestSchema.partial().parse(req.body);
      
      const existingGuest = await storage.getGuest(id);
      if (!existingGuest) {
        return res.status(404).json({ message: "Guest not found" });
      }

      // If checking out, update room status
      if (validatedData.status === "checked_out" && existingGuest.roomId) {
        await storage.updateRoom(existingGuest.roomId, { status: "available" });
      }

      const guest = await storage.updateGuest(id, validatedData);
      res.json(guest);
    } catch (error) {
      console.error("Guest creation error:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Payment routes
  app.get("/api/payments", async (req, res) => {
    try {
      const payments = await storage.getAllPayments();
      
      // Enrich payments with guest and room data
      const enrichedPayments = await Promise.all(payments.map(async (payment) => {
        const guest = await storage.getGuest(payment.guestId);
        let room = null;
        
        if (guest && guest.roomId) {
          room = await storage.getRoom(guest.roomId);
        }
        
        return {
          ...payment,
          guest: guest ? { 
            name: guest.name, 
            phoneNumber: guest.phoneNumber 
          } : undefined,
          room: room ? { 
            roomNumber: room.roomNumber 
          } : undefined
        };
      }));
      
      res.json(enrichedPayments);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/payments/:id", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { id } = req.params;
      const validatedData = insertPaymentSchema.partial().parse(req.body);
      
      const payment = await storage.updatePayment(id, validatedData);
      
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      // Send payment confirmation SMS if payment was marked as paid
      if (validatedData.status === "paid") {
        try {
          const guest = await storage.getGuest(payment.guestId);
          const lodgeSettings = await storage.getLodgeSettings();
          
          if (guest && lodgeSettings) {
            const room = guest.roomId ? await storage.getRoom(guest.roomId) : null;
            
            if (room) {
              const { sendPaymentConfirmationSMS } = await import("./sms-service");
              sendPaymentConfirmationSMS(payment, guest, room, lodgeSettings).catch(error => {
                console.error('Failed to send payment confirmation SMS:', error);
              });
            }
          }
        } catch (error) {
          console.error('SMS service error:', error);
        }
      }

      res.json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/payments/pending", async (req, res) => {
    try {
      const pendingPayments = await storage.getPendingPayments();
      res.json(pendingPayments);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // SMS routes
  app.post("/api/sms/send-bill", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { guestId, message, phoneNumber } = req.body;
      
      if (!guestId || !message || !phoneNumber) {
        return res.status(400).json({ message: "Guest ID, message, and phone number required" });
      }

      // Use SMS service to send message
      const { smsService } = await import("./sms-service");
      const response = await smsService.sendSMS({
        to: phoneNumber,
        message
      });

      // Log the SMS attempt
      const smsLog = await storage.createSmsLog({
        guestId,
        phoneNumber,
        message,
        status: response.success ? "sent" : "failed"
      });

      if (response.success) {
        res.json({ message: "SMS sent successfully", smsLog });
      } else {
        res.status(500).json({ message: response.error || "Failed to send SMS", smsLog });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get SMS history for a guest
  app.get("/api/sms/history/:guestId", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { guestId } = req.params;
      const { limit = "50" } = req.query;
      
      const history = await storage.getSmsLogsByGuest(guestId, parseInt(limit.toString()));
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get SMS statistics
  app.get("/api/sms/stats", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { days = "30" } = req.query;
      const { smsService } = await import("./sms-service");
      const stats = await smsService.getSMSStats(parseInt(days.toString()));
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Send templated SMS
  app.post("/api/sms/send-template", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { templateId, phoneNumber, variables, guestId } = req.body;
      
      if (!templateId || !phoneNumber || !variables) {
        return res.status(400).json({ message: "Template ID, phone number, and variables required" });
      }

      const { smsService } = await import("./sms-service");
      const response = await smsService.sendTemplatedSMS(templateId, phoneNumber, variables, guestId);

      if (response.success) {
        res.json({ message: "SMS sent successfully", response });
      } else {
        res.status(500).json({ message: response.error || "Failed to send SMS" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/dashboard", async (req, res) => {
    try {
      const rooms = await storage.getAllRooms();
      const activeGuests = await storage.getActiveGuests();
      const payments = await storage.getAllPayments();
      
      const availableRooms = rooms.filter(room => room.status === "available").length;
      const occupiedRooms = rooms.filter(room => room.status === "occupied").length;
      const maintenanceRooms = rooms.filter(room => room.status === "maintenance").length;
      
      // Calculate today's revenue
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayPayments = payments.filter(payment => {
        const paymentDate = new Date(payment.createdAt!);
        paymentDate.setHours(0, 0, 0, 0);
        return paymentDate.getTime() === today.getTime() && payment.status === "paid";
      });
      
      const todayRevenue = todayPayments.reduce((sum, payment) => 
        sum + parseFloat(payment.amount), 0
      );

      res.json({
        availableRooms,
        occupiedRooms,
        maintenanceRooms,
        todayRevenue,
        totalRooms: rooms.length,
        activeGuests: activeGuests.length
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
