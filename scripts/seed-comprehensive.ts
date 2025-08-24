import { neon } from "@neondatabase/serverless";
import { nanoid } from "nanoid";

const sql = neon(process.env.DATABASE_URL!);

const roomTypes = ["Single", "Double", "Suite", "Deluxe", "Family", "Premium", "Executive", "Standard", "Luxury", "Economy"];
const guestNames = [
  "Rajesh Kumar", "Priya Sharma", "Amit Singh", "Sita Reddy", "Venkat Rao",
  "Lakshmi Devi", "Ravi Chandra", "Meera Patel", "Suresh Gupta", "Kavitha Nair",
  "Anil Kumar", "Bhavani Prasad", "Chandrika Kumari", "Deepak Singh", "Geetha Rani",
  "Harish Reddy", "Indira Sharma", "Jagadish Rao", "Kalyani Devi", "Laxman Kumar",
  "Manohar Singh", "Nirmala Reddy", "Omkaar Prasad", "Padmavathi Devi", "Qasim Ali",
  "Radha Krishna", "Sangeeta Patel", "Thirupathi Rao", "Uma Mahesh", "Vijay Kumar",
  "Anand Gupta", "Sunita Verma", "Ravi Teja", "Padma Lakshmi", "Kiran Reddy",
  "Vasantha Devi", "Suresh Babu", "Kavya Patel", "Nagesh Gupta", "Shanti Nair",
  "John Smith", "Sarah Johnson", "David Wilson", "Emily Davis", "Michael Brown",
  "Lisa Anderson", "Robert Taylor", "Jennifer Garcia", "William Martinez", "Amanda White"
];

const phoneNumbers = [
  "9876543210", "8765432109", "7654321098", "6543210987", "5432109876",
  "9123456789", "8234567890", "7345678901", "6456789012", "5567890123",
  "9987654321", "8876543210", "7765432109", "6654321098", "5543210987",
  "9111222333", "8222333444", "7333444555", "6444555666", "5555666777",
  "9012345678", "8123456789", "7234567890", "6345678901", "5456789012",
  "9678901234", "8789012345", "7890123456", "6901234567", "5012345678"
];

const aadharNumbers = [
  "1234-5678-9012", "2345-6789-0123", "3456-7890-1234", "4567-8901-2345", "5678-9012-3456",
  "6789-0123-4567", "7890-1234-5678", "8901-2345-6789", "9012-3456-7890", "0123-4567-8901",
  "1111-2222-3333", "2222-3333-4444", "3333-4444-5555", "4444-5555-6666", "5555-6666-7777",
  "6666-7777-8888", "7777-8888-9999", "8888-9999-0000", "9999-0000-1111", "0000-1111-2222",
  "1234-9876-5432", "2345-8765-4321", "3456-7654-3210", "4567-6543-2109", "5678-5432-1098"
];

const purposeOfVisits = ["Business", "Tourism", "Personal", "Medical", "Education", "Official", "Conference", "Wedding", "Family Visit", "Holiday"];
const checkinTimes = ["09:00", "10:30", "11:00", "12:00", "13:30", "14:00", "15:00", "16:30", "17:00", "18:00", "19:00", "20:00"];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRandomPrice(roomType: string): string {
  const basePrice = roomType === "Economy" ? Math.floor(Math.random() * 1000) + 500 :
                   roomType === "Standard" ? Math.floor(Math.random() * 1500) + 800 :
                   roomType === "Single" ? Math.floor(Math.random() * 1200) + 700 :
                   roomType === "Double" ? Math.floor(Math.random() * 1800) + 1200 :
                   roomType === "Deluxe" ? Math.floor(Math.random() * 2500) + 1800 :
                   roomType === "Premium" ? Math.floor(Math.random() * 3000) + 2500 :
                   roomType === "Suite" ? Math.floor(Math.random() * 4000) + 3000 :
                   roomType === "Luxury" ? Math.floor(Math.random() * 5000) + 4000 :
                   roomType === "Executive" ? Math.floor(Math.random() * 3500) + 2800 :
                   Math.floor(Math.random() * 2000) + 1000; // Family
  return (Math.round(basePrice / 50) * 50).toString();
}

function generateDateInRange(daysAgoStart: number, daysAgoEnd: number): Date {
  const daysAgo = Math.floor(Math.random() * (daysAgoStart - daysAgoEnd + 1)) + daysAgoEnd;
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);
  return date;
}

async function seedComprehensiveDatabase() {
  try {
    console.log("🌱 Starting comprehensive database seeding for 2 months...");

    // First, clear existing data
    console.log("🗑️ Clearing existing data...");
    await sql`DELETE FROM sms_logs`;
    await sql`DELETE FROM payments`;
    await sql`DELETE FROM guests`;
    await sql`DELETE FROM rooms`;
    console.log("✓ Cleared existing data");

    // Create 40 diverse rooms
    console.log("🏨 Creating 40 diverse rooms...");
    const rooms: Array<{id: string, roomNumber: string, roomType: string, basePrice: string, status: string}> = [];
    
    for (let floor = 1; floor <= 4; floor++) {
      for (let roomNum = 1; roomNum <= 10; roomNum++) {
        const roomId = nanoid();
        const roomNumber = `${floor}${String(roomNum).padStart(2, '0')}`;
        const roomType = getRandomElement(roomTypes);
        const basePrice = generateRandomPrice(roomType);
        
        // Most rooms available, some occupied, few in maintenance
        const statusRand = Math.random();
        const status = statusRand > 0.8 ? "occupied" : (statusRand > 0.95 ? "maintenance" : "available");

        await sql`
          INSERT INTO rooms (id, room_number, room_type, base_price, status)
          VALUES (${roomId}, ${roomNumber}, ${roomType}, ${basePrice}, ${status})
        `;

        rooms.push({ id: roomId, roomNumber, roomType, basePrice, status });
        console.log(`✓ Created room ${roomNumber} (${roomType}) - ₹${basePrice}/night - ${status}`);
      }
    }

    console.log(`\n👥 Creating guests for 2 months of historical data...`);
    
    // Generate historical guests for past 60 days
    let totalGuests = 0;
    let totalRevenue = 0;
    let currentActiveGuests = 0;

    for (let dayAgo = 60; dayAgo >= 0; dayAgo--) {
      // Generate 2-8 guests per day (varying occupancy)
      const guestsForDay = Math.floor(Math.random() * 7) + 2;
      
      for (let guestIndex = 0; guestIndex < guestsForDay; guestIndex++) {
        const guestId = nanoid();
        const name = getRandomElement(guestNames);
        const phoneNumber = getRandomElement(phoneNumbers);
        const aadharNumber = getRandomElement(aadharNumbers);
        const room = getRandomElement(rooms.filter(r => r.status !== "maintenance"));
        const purposeOfVisit = getRandomElement(purposeOfVisits);
        const checkinTime = getRandomElement(checkinTimes);
        
        // Check-in date (this day)
        const checkinDate = generateDateInRange(dayAgo, dayAgo);
        
        // Stay duration (1-10 days, with bias towards shorter stays)
        const stayBias = Math.random();
        const stayDuration = stayBias > 0.7 ? Math.floor(Math.random() * 3) + 1 : // 30% stay 1-3 days
                           stayBias > 0.4 ? Math.floor(Math.random() * 5) + 2 : // 30% stay 2-6 days
                           Math.floor(Math.random() * 8) + 3; // 40% stay 3-10 days
        
        const checkoutDate = new Date(checkinDate);
        checkoutDate.setDate(checkoutDate.getDate() + stayDuration);
        
        // Determine if guest has checked out
        const hasCheckedOut = checkoutDate < new Date();
        const guestStatus = hasCheckedOut ? "checked_out" : "active";
        
        if (guestStatus === "active") currentActiveGuests++;
        
        const totalDays = stayDuration;
        const baseAmount = parseFloat(room.basePrice) * totalDays;
        
        // Apply discounts (20% chance for 5-15% discount)
        const hasDiscount = Math.random() > 0.8;
        const discountPercent = hasDiscount ? Math.random() * 0.1 + 0.05 : 0; // 5-15%
        const discountAmount = baseAmount * discountPercent;
        const finalTotalAmount = baseAmount - discountAmount;
        
        totalRevenue += finalTotalAmount;
        
        const numberOfGuests = Math.floor(Math.random() * 4) + 1;

        await sql`
          INSERT INTO guests (
            id, name, phone_number, aadhar_number, checkin_date, checkin_time, checkout_date, 
            purpose_of_visit, room_id, number_of_guests, total_days, base_amount, 
            discount_amount, total_amount, status, created_at
          )
          VALUES (
            ${guestId}, ${name}, ${phoneNumber}, ${aadharNumber}, ${checkinDate.toISOString()}, 
            ${checkinTime}, ${checkoutDate.toISOString()}, ${purposeOfVisit}, ${room.id}, ${numberOfGuests}, 
            ${totalDays}, ${baseAmount.toString()}, ${discountAmount.toString()}, ${finalTotalAmount.toString()}, 
            ${guestStatus}, ${checkinDate.toISOString()}
          )
        `;

        // Create payment record
        const paymentId = nanoid();
        const paymentMethod = Math.random() > 0.6 ? "cash" : "qr";
        
        // Payment status based on guest status
        let paymentStatus: string;
        let paidAt: string | null = null;
        
        if (hasCheckedOut) {
          // 95% of checked-out guests have paid
          paymentStatus = Math.random() > 0.05 ? "paid" : "pending";
          if (paymentStatus === "paid") {
            paidAt = checkoutDate.toISOString();
          }
        } else {
          // Active guests: 60% have paid, 40% pending
          paymentStatus = Math.random() > 0.4 ? "paid" : "pending";
          if (paymentStatus === "paid") {
            const paymentDate = new Date(checkinDate);
            paymentDate.setHours(paymentDate.getHours() + Math.floor(Math.random() * 48)); // Paid within 2 days
            paidAt = paymentDate.toISOString();
          }
        }

        await sql`
          INSERT INTO payments (
            id, guest_id, amount, payment_method, status, created_at, paid_at
          )
          VALUES (
            ${paymentId}, ${guestId}, ${finalTotalAmount.toString()}, ${paymentMethod}, ${paymentStatus}, 
            ${checkinDate.toISOString()}, ${paidAt}
          )
        `;

        // Generate SMS logs for some guests (70% chance)
        if (Math.random() > 0.3) {
          const smsId = nanoid();
          const smsMessages = [
            `Welcome to our lodge, ${name.split(' ')[0]}! Your room ${room.roomNumber} is ready. Check-out: ${checkoutDate.toLocaleDateString('en-IN')}`,
            `Thank you for staying with us, ${name.split(' ')[0]}! Please settle your bill of ₹${Math.round(finalTotalAmount)} at the front desk.`,
            `Reminder: Check-out time is 11 AM tomorrow for room ${room.roomNumber}. Thank you for choosing us!`,
            `Welcome! Your booking confirmation for room ${room.roomNumber} from ${checkinDate.toLocaleDateString('en-IN')} to ${checkoutDate.toLocaleDateString('en-IN')}`
          ];
          
          const smsMessage = getRandomElement(smsMessages);
          const smsStatus = Math.random() > 0.1 ? "delivered" : (Math.random() > 0.5 ? "sent" : "failed");
          
          await sql`
            INSERT INTO sms_logs (
              id, guest_id, phone_number, message, status, sent_at
            )
            VALUES (
              ${smsId}, ${guestId}, ${phoneNumber}, ${smsMessage}, ${smsStatus}, ${checkinDate.toISOString()}
            )
          `;
        }

        totalGuests++;
        
        if (totalGuests % 20 === 0) {
          console.log(`✓ Created ${totalGuests} guests so far...`);
        }
      }
    }

    // Update room statuses based on current active guests
    console.log("\n🔄 Updating room statuses based on current occupancy...");
    const activeGuestRooms = await sql`SELECT DISTINCT room_id FROM guests WHERE status = 'active'`;
    const occupiedRoomIds = activeGuestRooms.map((row: any) => row.room_id);
    
    // Set occupied rooms
    for (const roomId of occupiedRoomIds) {
      await sql`UPDATE rooms SET status = 'occupied' WHERE id = ${roomId}`;
    }
    
    // Set remaining rooms as available (except some random maintenance)
    const allRoomIds = rooms.map(r => r.id);
    const availableRoomIds = allRoomIds.filter(id => !occupiedRoomIds.includes(id));
    
    for (const roomId of availableRoomIds) {
      const status = Math.random() > 0.95 ? "maintenance" : "available"; // 5% maintenance
      await sql`UPDATE rooms SET status = ${status} WHERE id = ${roomId}`;
    }

    console.log("\n🎉 Comprehensive database seeding completed successfully!");
    console.log(`📊 Summary:`);
    console.log(`   - Created 40 rooms across 4 floors with diverse types and pricing`);
    console.log(`   - Generated ${totalGuests} guests over 2 months`);
    console.log(`   - Current active guests: ${currentActiveGuests}`);
    console.log(`   - Total revenue generated: ₹${Math.round(totalRevenue).toLocaleString('en-IN')}`);
    console.log(`   - Created ${totalGuests} payment records with realistic statuses`);
    console.log(`   - Generated SMS logs for guest communications`);
    console.log(`   - Applied discounts to ~20% of bookings`);
    console.log(`   - Realistic occupancy patterns and guest behaviors`);
    console.log(`   - Mix of purposes: Business, Tourism, Personal, Medical, etc.`);
    
  } catch (error) {
    console.error("❌ Error seeding comprehensive database:", error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedComprehensiveDatabase();
}

export { seedComprehensiveDatabase };