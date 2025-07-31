import { neon } from "@neondatabase/serverless";
import { nanoid } from "nanoid";

const sql = neon(process.env.DATABASE_URL!);

const guestNames = [
  "Anand Kumar", "Sunita Sharma", "Ravi Teja", "Padma Lakshmi", "Kiran Reddy",
  "Vasantha Devi", "Suresh Babu", "Kavya Patel", "Nagesh Gupta", "Shanti Nair",
  "Mohan Kumar", "Gayatri Prasad", "Dheeraj Singh", "Lalitha Rani", "Prakash Reddy",
  "Saritha Sharma", "Bhaskar Rao", "Nandini Devi", "Ramesh Kumar", "Usha Rani",
  "Vinod Singh", "Madhavi Reddy", "Ashok Prasad", "Jyothi Devi", "Satish Kumar",
  "Renuka Sharma", "Naresh Rao", "Parvathi Devi", "Mahesh Singh", "Keerthi Reddy",
  "Gopal Kumar", "Sridevi Patel", "Vijaya Rao", "Suman Devi", "Ramana Kumar"
];

const phoneNumbers = [
  "9123456780", "8234567891", "7345678902", "6456789013", "5567890124",
  "9876543211", "8765432102", "7654321093", "6543210984", "5432109875",
  "9111333555", "8222444666", "7333555777", "6444666888", "5555777999",
  "9988776655", "8877665544", "7766554433", "6655443322", "5544332211",
  "9012345678", "8123456789", "7234567890", "6345678901", "5456789012",
  "9678901234", "8789012345", "7890123456", "6901234567", "5012345678",
  "9345678901", "8456789012", "7567890123", "6678901234", "5789012345"
];

const aadharNumbers = [
  "2111-3222-4333", "3222-4333-5444", "4333-5444-6555", "5444-6555-7666", "6555-7666-8777",
  "7666-8777-9888", "8777-9888-0999", "9888-0999-1000", "0999-1000-2111", "1000-2111-3222",
  "1234-9876-5432", "2345-8765-4321", "3456-7654-3210", "4567-6543-2109", "5678-5432-1098",
  "6789-4321-0987", "7890-3210-9876", "8901-2109-8765", "9012-1098-7654", "0123-0987-6543",
  "1111-2222-3333", "2222-3333-4444", "3333-4444-5555", "4444-5555-6666", "5555-6666-7777",
  "6666-7777-8888", "7777-8888-9999", "8888-9999-0000", "9999-0000-1111", "0000-1111-2222",
  "1234-5678-9999", "2345-6789-8888", "3456-7890-7777", "4567-8901-6666", "5678-9012-5555"
];

const purposeOfVisits = ["Business", "Tourism", "Personal", "Medical", "Education", "Official"];
const checkinTimes = ["09:00", "10:30", "11:00", "12:00", "13:30", "14:00", "15:00", "16:30", "17:00", "18:00"];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generatePastDate(minDaysAgo: number, maxDaysAgo: number): string {
  const daysAgo = Math.floor(Math.random() * (maxDaysAgo - minDaysAgo + 1)) + minDaysAgo;
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

async function seedCheckedOutUsers() {
  try {
    console.log("🌱 Creating 30 checked-out users from past 15 days...");

    // Get available rooms for assignment
    const availableRooms = await sql`SELECT id, room_number, room_type, base_price FROM rooms WHERE status = 'available'`;
    
    if (availableRooms.length === 0) {
      console.log("❌ No available rooms found. Please create rooms first.");
      return;
    }

    for (let i = 0; i < 30; i++) {
      const guestId = nanoid();
      const name = getRandomElement(guestNames);
      const phoneNumber = getRandomElement(phoneNumbers);  
      const aadharNumber = getRandomElement(aadharNumbers);
      const room = getRandomElement(availableRooms);
      const purposeOfVisit = getRandomElement(purposeOfVisits);
      const checkinTime = getRandomElement(checkinTimes);
      
      // Generate dates within past 15 days
      const checkoutDate = generatePastDate(1, 15); // Checked out 1-15 days ago
      const stayDuration = Math.floor(Math.random() * 7) + 1; // 1-7 days stay
      const checkinDate = new Date(checkoutDate);
      checkinDate.setDate(checkinDate.getDate() - stayDuration);
      
      const totalDays = stayDuration;
      const baseAmount = (parseFloat(room.base_price) * totalDays).toString();
      const discountAmount = Math.random() > 0.7 ? (parseFloat(baseAmount) * 0.1).toString() : "0"; // 30% chance of 10% discount
      const totalAmount = (parseFloat(baseAmount) - parseFloat(discountAmount)).toString();
      const numberOfGuests = Math.floor(Math.random() * 4) + 1;

      // Create guest record with checked_out status
      await sql`
        INSERT INTO guests (
          id, name, phone_number, aadhar_number, checkin_date, checkin_time, checkout_date, 
          purpose_of_visit, room_id, number_of_guests, total_days, base_amount, 
          discount_amount, total_amount, status
        )
        VALUES (
          ${guestId}, ${name}, ${phoneNumber}, ${aadharNumber}, ${checkinDate.toISOString()}, 
          ${checkinTime}, ${checkoutDate}, ${purposeOfVisit}, ${room.id}, ${numberOfGuests}, 
          ${totalDays}, ${baseAmount}, ${discountAmount}, ${totalAmount}, 'checked_out'
        )
      `;

      // Create corresponding payment (most should be paid since they checked out)
      const paymentId = nanoid();
      const paymentMethod = Math.random() > 0.5 ? "cash" : "qr";
      const paymentStatus = Math.random() > 0.1 ? "paid" : "pending"; // 90% paid, 10% pending
      const paidAt = paymentStatus === "paid" ? checkoutDate : null;

      await sql`
        INSERT INTO payments (
          id, guest_id, amount, payment_method, status, created_at, paid_at
        )
        VALUES (
          ${paymentId}, ${guestId}, ${totalAmount}, ${paymentMethod}, ${paymentStatus}, 
          ${checkinDate.toISOString()}, ${paidAt}
        )
      `;

      console.log(`✓ Created checked-out guest ${name} - Room ${room.room_number} (${totalDays} days, ₹${totalAmount}) - ${purposeOfVisit}`);
    }

    console.log("\n🎉 Successfully created 30 checked-out users!");
    console.log(`📊 Summary:`);
    console.log(`   - All guests have checked out in the past 15 days`);
    console.log(`   - Various purposes: Business, Tourism, Personal, Medical, Education, Official`);
    console.log(`   - Different check-in times throughout the day`);
    console.log(`   - 90% payments completed, 10% still pending`);
    console.log(`   - Stay durations: 1-7 days each`);
    
  } catch (error) {
    console.error("❌ Error seeding checked-out users:", error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedCheckedOutUsers();
}

export { seedCheckedOutUsers };