import { neon } from "@neondatabase/serverless";
import { nanoid } from "nanoid";

const sql = neon(process.env.DATABASE_URL!);

const roomTypes = ["Single", "Double", "Suite", "Deluxe", "Family", "Premium", "Executive", "Standard"];
const guestNames = [
  "Rajesh Kumar", "Priya Sharma", "Amit Singh", "Sita Reddy", "Venkat Rao",
  "Lakshmi Devi", "Ravi Chandra", "Meera Patel", "Suresh Gupta", "Kavitha Nair",
  "Anil Kumar", "Bhavani Prasad", "Chandrika Kumari", "Deepak Singh", "Geetha Rani",
  "Harish Reddy", "Indira Sharma", "Jagadish Rao", "Kalyani Devi", "Laxman Kumar",
  "Manohar Singh", "Nirmala Reddy", "Omkaar Prasad", "Padmavathi Devi", "Qasim Ali",
  "Radha Krishna", "Sangeeta Patel", "Thirupathi Rao", "Uma Mahesh", "Vijay Kumar"
];

const phoneNumbers = [
  "9876543210", "8765432109", "7654321098", "6543210987", "5432109876",
  "9123456789", "8234567890", "7345678901", "6456789012", "5567890123",
  "9987654321", "8876543210", "7765432109", "6654321098", "5543210987",
  "9111222333", "8222333444", "7333444555", "6444555666", "5555666777"
];

const aadharNumbers = [
  "1234-5678-9012", "2345-6789-0123", "3456-7890-1234", "4567-8901-2345", "5678-9012-3456",
  "6789-0123-4567", "7890-1234-5678", "8901-2345-6789", "9012-3456-7890", "0123-4567-8901",
  "1111-2222-3333", "2222-3333-4444", "3333-4444-5555", "4444-5555-6666", "5555-6666-7777",
  "6666-7777-8888", "7777-8888-9999", "8888-9999-0000", "9999-0000-1111", "0000-1111-2222"
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRandomPrice(): string {
  const basePrice = Math.floor(Math.random() * 3000) + 500; // Between 500-3500
  return (Math.round(basePrice / 50) * 50).toString(); // Round to nearest 50
}

function generatePastDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

function generateFutureDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
}

async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // Create 20 random rooms
    console.log("Creating 20 random rooms...");
    const rooms: Array<{id: string, roomNumber: string, roomType: string, basePrice: string, status: string}> = [];
    for (let i = 1; i <= 20; i++) {
      const roomId = nanoid();
      const roomNumber = `${Math.floor(i / 10) + 1}${String(i % 10).padStart(2, '0')}`;
      const roomType = getRandomElement(roomTypes);
      const basePrice = generateRandomPrice();
      const status = Math.random() > 0.3 ? "available" : (Math.random() > 0.5 ? "occupied" : "maintenance");

      await sql`
        INSERT INTO rooms (id, room_number, room_type, base_price, status)
        VALUES (${roomId}, ${roomNumber}, ${roomType}, ${basePrice}, ${status})
        ON CONFLICT (room_number) DO UPDATE SET
          room_type = EXCLUDED.room_type,
          base_price = EXCLUDED.base_price,
          status = EXCLUDED.status
      `;

      rooms.push({ id: roomId, roomNumber, roomType, basePrice, status });
      console.log(`✓ Created room ${roomNumber} (${roomType}) - ₹${basePrice}/night - ${status}`);
    }

    // Create random guests for some occupied rooms
    console.log("\nCreating random guests...");
    const occupiedRooms = rooms.filter(room => room.status === "occupied");
    
    for (let i = 0; i < Math.min(10, occupiedRooms.length); i++) {
      const guestId = nanoid();
      const room = occupiedRooms[i];
      const name = getRandomElement(guestNames);
      const phoneNumber = getRandomElement(phoneNumbers);
      const aadharNumber = getRandomElement(aadharNumbers);
      
      // Random dates in the past for some guests, current for others
      const isHistorical = Math.random() > 0.5;
      const checkinDate = isHistorical 
        ? generatePastDate(Math.floor(Math.random() * 30) + 1)
        : generatePastDate(Math.floor(Math.random() * 3));
      const checkoutDate = isHistorical
        ? generatePastDate(Math.floor(Math.random() * 15))
        : generateFutureDate(Math.floor(Math.random() * 5) + 1);
      
      const totalDays = Math.max(1, Math.ceil((new Date(checkoutDate).getTime() - new Date(checkinDate).getTime()) / (1000 * 60 * 60 * 24)));
      const baseAmount = (parseFloat(room.basePrice) * totalDays).toString();
      const discountAmount = "0";
      const totalAmount = baseAmount;
      const numberOfGuests = Math.floor(Math.random() * 4) + 1;

      await sql`
        INSERT INTO guests (
          id, name, phone_number, aadhar_number, checkin_date, checkout_date,
          room_id, number_of_guests, total_days, base_amount, discount_amount, total_amount, status
        )
        VALUES (
          ${guestId}, ${name}, ${phoneNumber}, ${aadharNumber}, ${checkinDate}, ${checkoutDate},
          ${room.id}, ${numberOfGuests}, ${totalDays}, ${baseAmount}, ${discountAmount}, ${totalAmount}, 'active'
        )
      `;

      // Create corresponding payment
      const paymentId = nanoid();
      const paymentMethod = Math.random() > 0.5 ? "cash" : "qr";
      const paymentStatus = Math.random() > 0.2 ? "paid" : "pending";

      await sql`
        INSERT INTO payments (
          id, guest_id, amount, payment_method, status, created_at
        )
        VALUES (
          ${paymentId}, ${guestId}, ${totalAmount}, ${paymentMethod}, ${paymentStatus}, ${checkinDate}
        )
      `;

      console.log(`✓ Created guest ${name} in room ${room.roomNumber} (${totalDays} days, ₹${totalAmount})`);
    }

    console.log("\n🎉 Database seeding completed successfully!");
    console.log(`📊 Summary:`);
    console.log(`   - Created 20 rooms with random types and prices`);
    console.log(`   - Created ${Math.min(10, occupiedRooms.length)} guests with bookings`);
    console.log(`   - Created corresponding payments for all guests`);
    
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

export { seedDatabase };