export interface DashboardStats {
  availableRooms: number;
  occupiedRooms: number;
  maintenanceRooms: number;
  todayRevenue: number;
  totalRooms: number;
  activeGuests: number;
}

export interface GuestWithRoom {
  id: string;
  name: string;
  phoneNumber: string;
  aadharNumber: string;
  checkinDate: string;
  checkoutDate: string;
  roomId: string | null;
  numberOfGuests: number;
  totalDays: number;
  baseAmount: string;
  discountAmount: string;
  totalAmount: string;
  status: string;
  createdAt: string;
  room?: {
    roomNumber: string;
    roomType: string;
  };
}

export interface PaymentWithGuest {
  id: string;
  guestId: string;
  amount: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
  paidAt: string | null;
  guest?: {
    name: string;
    phoneNumber: string;
  };
  room?: {
    roomNumber: string;
  };
}
