import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BilingualText } from "@/components/bilingual-text";
import { GuestRegistrationModal } from "@/components/guest-registration-modal";
import { PaymentModal } from "@/components/payment-modal";
import { RoomGrid } from "@/components/room-grid";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { DashboardStats, GuestWithRoom, PaymentWithGuest } from "@/lib/types";
import type { Room, LodgeSettings } from "@shared/schema";
import { 
  Hotel, 
  Settings, 
  LogOut, 
  Bed, 
  Users, 
  Gavel, 
  IndianRupee,
  UserPlus,
  Receipt,
  BarChart3,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  CreditCard,
  QrCode,
  Download
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithGuest | null>(null);
  const [guestSearch, setGuestSearch] = useState("");
  const { toast } = useToast();

  // Queries
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/analytics/dashboard"],
  });

  const { data: lodgeSettings } = useQuery<LodgeSettings>({
    queryKey: ["/api/lodge-settings"],
  });

  const { data: rooms } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
  });

  const { data: guests } = useQuery<GuestWithRoom[]>({
    queryKey: ["/api/guests", guestSearch],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/guests?search=${guestSearch}`);
      const guestData = await response.json();
      
      // Enrich guests with room data
      return guestData.map((guest: any) => ({
        ...guest,
        room: rooms?.find(room => room.id === guest.roomId)
      }));
    },
    enabled: !!rooms,
  });

  const { data: payments } = useQuery<PaymentWithGuest[]>({
    queryKey: ["/api/payments"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/payments");
      const paymentData = await response.json();
      
      // Enrich payments with guest and room data
      return paymentData.map((payment: any) => {
        const guest = guests?.find(g => g.id === payment.guestId);
        return {
          ...payment,
          guest: guest ? { name: guest.name, phoneNumber: guest.phoneNumber } : undefined,
          room: guest?.room ? { roomNumber: guest.room.roomNumber } : undefined
        };
      });
    },
    enabled: !!guests,
  });

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      window.location.href = "/";
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  const handlePaymentClick = (payment: PaymentWithGuest) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  };

  const recentGuests = guests?.slice(0, 5) || [];
  const pendingPayments = payments?.filter(p => p.status === "pending") || [];
  const paidPayments = payments?.filter(p => p.status === "paid") || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center">
                <Hotel size={20} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {lodgeSettings?.name || "Lodge"}
                </h1>
                <p className="text-sm text-gray-600 font-telugu">
                  {lodgeSettings?.name || "లాజ్"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600 font-telugu">
                  <BilingualText english="Today" telugu="నేడు" />
                </p>
                <p className="text-lg font-semibold">
                  {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <Button variant="ghost" size="sm">
                <Settings size={20} />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-error hover:text-red-700">
                <LogOut size={20} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard" className="font-telugu">
              <BarChart3 className="mr-2" size={16} />
              <BilingualText english="Dashboard" telugu="డాష్‌బోర్డ్" />
            </TabsTrigger>
            <TabsTrigger value="guests" className="font-telugu">
              <Users className="mr-2" size={16} />
              <BilingualText english="Guests" telugu="అతిథులు" />
            </TabsTrigger>
            <TabsTrigger value="rooms" className="font-telugu">
              <Bed className="mr-2" size={16} />
              <BilingualText english="Rooms" telugu="గదులు" />
            </TabsTrigger>
            <TabsTrigger value="payments" className="font-telugu">
              <CreditCard className="mr-2" size={16} />
              <BilingualText english="Payments" telugu="చెల్లింపులు" />
            </TabsTrigger>
            <TabsTrigger value="analytics" className="font-telugu">
              <BarChart3 className="mr-2" size={16} />
              <BilingualText english="Analytics" telugu="విశ్లేషణలు" />
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6 mt-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="bg-success bg-opacity-10 p-3 rounded-full">
                      <Bed className="text-success" size={20} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600 font-telugu">
                        <BilingualText english="Available" telugu="లభ్యమైనది" />
                      </p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {stats?.availableRooms || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="bg-error bg-opacity-10 p-3 rounded-full">
                      <Users className="text-error" size={20} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600 font-telugu">
                        <BilingualText english="Occupied" telugu="ఆక్రమించినది" />
                      </p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {stats?.occupiedRooms || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="bg-warning bg-opacity-10 p-3 rounded-full">
                      <Gavel className="text-warning" size={20} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600 font-telugu">
                        <BilingualText english="Maintenance" telugu="మెయింటెనెన్స్" />
                      </p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {stats?.maintenanceRooms || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="bg-primary bg-opacity-10 p-3 rounded-full">
                      <IndianRupee className="text-primary" size={20} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600 font-telugu">
                        <BilingualText english="Today's Revenue" telugu="నేటి ఆదాయం" />
                      </p>
                      <p className="text-2xl font-semibold text-gray-900">
                        ₹{stats?.todayRevenue?.toLocaleString() || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activities & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Check-ins */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-telugu">
                    <BilingualText english="Recent Check-ins" telugu="ఇటీవలి చెక్-ఇన్‌లు" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentGuests.map((guest) => (
                      <div key={guest.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{guest.name}</p>
                          <p className="text-sm text-gray-600 font-telugu">
                            Room {guest.room?.roomNumber} • రూమ్ {guest.room?.roomNumber}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            {new Date(guest.checkinDate).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </p>
                          <Badge className="bg-success text-white font-telugu">
                            Checked In
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {recentGuests.length === 0 && (
                      <p className="text-gray-500 text-center py-4 font-telugu">
                        <BilingualText english="No recent check-ins" telugu="ఇటీవలి చెక్-ఇన్‌లు లేవు" />
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-telugu">
                    <BilingualText english="Quick Actions" telugu="త్వరిత చర్యలు" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      className="p-4 h-auto border-2 border-dashed hover:border-primary hover:bg-primary hover:bg-opacity-5"
                      onClick={() => setShowGuestModal(true)}
                    >
                      <div className="text-center">
                        <UserPlus className="text-primary mx-auto mb-2" size={24} />
                        <p className="text-sm font-medium font-telugu">
                          <BilingualText english="Register Guest" telugu="అతిథిని నమోదు చేయండి" />
                        </p>
                      </div>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="p-4 h-auto border-2 border-dashed hover:border-success hover:bg-success hover:bg-opacity-5"
                      onClick={() => setActiveTab("rooms")}
                    >
                      <div className="text-center">
                        <Bed className="text-success mx-auto mb-2" size={24} />
                        <p className="text-sm font-medium font-telugu">
                          <BilingualText english="Room Status" telugu="గది స్థితి" />
                        </p>
                      </div>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="p-4 h-auto border-2 border-dashed hover:border-warning hover:bg-warning hover:bg-opacity-5"
                      onClick={() => setActiveTab("payments")}
                    >
                      <div className="text-center">
                        <Receipt className="text-warning mx-auto mb-2" size={24} />
                        <p className="text-sm font-medium font-telugu">
                          <BilingualText english="Process Payment" telugu="చెల్లింపు ప్రాసెస్ చేయండి" />
                        </p>
                      </div>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="p-4 h-auto border-2 border-dashed hover:border-gray-400 hover:bg-gray-50"
                      onClick={() => setActiveTab("analytics")}
                    >
                      <div className="text-center">
                        <BarChart3 className="text-gray-600 mx-auto mb-2" size={24} />
                        <p className="text-sm font-medium font-telugu">
                          <BilingualText english="View Reports" telugu="రిపోర్ట్‌లు చూడండి" />
                        </p>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Guests Tab */}
          <TabsContent value="guests" className="space-y-6 mt-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold font-telugu">
                <BilingualText english="Guest Registration" telugu="అతిథి నమోదు" />
              </h2>
              <Button onClick={() => setShowGuestModal(true)} className="font-telugu">
                <UserPlus className="mr-2" size={16} />
                <BilingualText english="New Guest" telugu="కొత్త అతిథి" />
              </Button>
            </div>

            {/* Guest Search */}
            <Card>
              <CardContent className="p-6">
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by name, phone, or Aadhar (పేరు, ఫోన్ లేదా ఆధార్ ద్వారా వెతకండి)"
                      value={guestSearch}
                      onChange={(e) => setGuestSearch(e.target.value)}
                    />
                  </div>
                  <Button className="font-telugu">
                    <BilingualText english="Search" telugu="వెతకండి" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Guest List */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-telugu">
                        <BilingualText english="Name" telugu="పేరు" />
                      </TableHead>
                      <TableHead className="font-telugu">
                        <BilingualText english="Phone" telugu="ఫోన్" />
                      </TableHead>
                      <TableHead className="font-telugu">
                        <BilingualText english="Room" telugu="గది" />
                      </TableHead>
                      <TableHead className="font-telugu">
                        <BilingualText english="Check-in" telugu="చెక్-ఇన్" />
                      </TableHead>
                      <TableHead className="font-telugu">
                        <BilingualText english="Check-out" telugu="చెక్-అవుట్" />
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {guests?.map((guest) => (
                      <TableRow key={guest.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{guest.name}</p>
                            <p className="text-sm text-gray-600">Aadhar: {guest.aadharNumber}</p>
                          </div>
                        </TableCell>
                        <TableCell>{guest.phoneNumber}</TableCell>
                        <TableCell>{guest.room?.roomNumber || "—"}</TableCell>
                        <TableCell>
                          {new Date(guest.checkinDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(guest.checkoutDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={guest.status === "active" ? "bg-success text-white" : "bg-gray-500 text-white"}>
                            {guest.status === "active" ? (
                              <span className="font-telugu">
                                <BilingualText english="Active" telugu="సక్రియం" />
                              </span>
                            ) : (
                              <span className="font-telugu">
                                <BilingualText english="Checked Out" telugu="చెక్-అవుట్" />
                              </span>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye size={16} />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit size={16} />
                            </Button>
                            {guest.status === "active" && (
                              <Button variant="ghost" size="sm" className="text-error">
                                <LogOut size={16} />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rooms Tab */}
          <TabsContent value="rooms" className="space-y-6 mt-6">
            <RoomGrid rooms={rooms || []} />
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6 mt-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold font-telugu">
                <BilingualText english="Payment Processing" telugu="చెల్లింపు ప్రాసెసింగ్" />
              </h2>
            </div>

            {/* Payment Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-telugu">
                        <BilingualText english="Pending Payments" telugu="పెండింగ్ చెల్లింపులు" />
                      </p>
                      <p className="text-2xl font-semibold text-gray-900">
                        ₹{pendingPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-warning bg-opacity-10 p-3 rounded-full">
                      <Clock className="text-warning" size={20} />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-telugu">
                        <BilingualText english="Cash Payments" telugu="నగదు చెల్లింపులు" />
                      </p>
                      <p className="text-2xl font-semibold text-gray-900">
                        ₹{paidPayments.filter(p => p.paymentMethod === "cash").reduce((sum, p) => sum + parseFloat(p.amount), 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-success bg-opacity-10 p-3 rounded-full">
                      <IndianRupee className="text-success" size={20} />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-telugu">
                        <BilingualText english="QR Payments" telugu="QR చెల్లింపులు" />
                      </p>
                      <p className="text-2xl font-semibold text-gray-900">
                        ₹{paidPayments.filter(p => p.paymentMethod === "qr").reduce((sum, p) => sum + parseFloat(p.amount), 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-primary bg-opacity-10 p-3 rounded-full">
                      <QrCode className="text-primary" size={20} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment List */}
            <Card>
              <CardHeader>
                <CardTitle className="font-telugu">
                  <BilingualText english="Recent Payments" telugu="ఇటీవలి చెల్లింపులు" />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-telugu">
                        <BilingualText english="Guest" telugu="అతిథి" />
                      </TableHead>
                      <TableHead className="font-telugu">
                        <BilingualText english="Room" telugu="గది" />
                      </TableHead>
                      <TableHead className="font-telugu">
                        <BilingualText english="Amount" telugu="మొత్తం" />
                      </TableHead>
                      <TableHead className="font-telugu">
                        <BilingualText english="Payment Method" telugu="చెల్లింపు మార్గం" />
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments?.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{payment.guest?.name || "—"}</p>
                            <p className="text-sm text-gray-600">{payment.guest?.phoneNumber || "—"}</p>
                          </div>
                        </TableCell>
                        <TableCell>{payment.room?.roomNumber || "—"}</TableCell>
                        <TableCell>₹{parseFloat(payment.amount).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className={payment.paymentMethod === "cash" ? "bg-success text-white" : "bg-primary text-white"}>
                            {payment.paymentMethod === "cash" ? (
                              <span className="font-telugu">
                                <BilingualText english="Cash" telugu="నగదు" />
                              </span>
                            ) : (
                              "QR Code"
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={payment.status === "paid" ? "bg-success text-white" : "bg-warning text-white"}>
                            {payment.status === "paid" ? (
                              <span className="font-telugu">
                                <BilingualText english="Paid" telugu="చెల్లించబడింది" />
                              </span>
                            ) : (
                              <span className="font-telugu">
                                <BilingualText english="Pending" telugu="పెండింగ్" />
                              </span>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {payment.status === "pending" && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-success hover:text-green-700"
                                onClick={() => handlePaymentClick(payment)}
                              >
                                <CheckCircle size={16} />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm">
                              <Receipt size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6 mt-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold font-telugu">
                <BilingualText english="Analytics & Reports" telugu="విశ్లేషణలు & రిపోర్ట్‌లు" />
              </h2>
              <div className="flex space-x-4">
                <Select defaultValue="7">
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7" className="font-telugu">
                      <BilingualText english="Last 7 days" telugu="గత 7 రోజులు" />
                    </SelectItem>
                    <SelectItem value="30" className="font-telugu">
                      <BilingualText english="Last 30 days" telugu="గత 30 రోజులు" />
                    </SelectItem>
                    <SelectItem value="month" className="font-telugu">
                      <BilingualText english="This month" telugu="ఈ నెల" />
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button className="bg-success hover:bg-green-700 font-telugu">
                  <Download className="mr-2" size={16} />
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Revenue Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="font-telugu">
                  <BilingualText english="Daily Revenue" telugu="రోజువారీ ఆదాయం" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500 font-telugu">
                    <BilingualText english="Revenue Chart Placeholder" telugu="ఆదాయ చార్ట్ ప్లేస్‌హోల్డర్" />
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Occupancy Rate */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-telugu">
                    <BilingualText english="Occupancy Rate" telugu="ఆక్రమణ రేటు" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <div className="text-4xl font-bold text-primary mb-2">
                      {stats?.totalRooms ? Math.round((stats.occupiedRooms / stats.totalRooms) * 100) : 0}%
                    </div>
                    <p className="text-gray-600 font-telugu">
                      <BilingualText english="Average occupancy this month" telugu="ఈ నెల సగటు ఆక్రమణ" />
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 font-telugu">
                        <BilingualText english="Single Rooms" telugu="సింగిల్ గదులు" />
                      </span>
                      <span className="text-sm font-medium">85%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 font-telugu">
                        <BilingualText english="Double Rooms" telugu="డబుల్ గదులు" />
                      </span>
                      <span className="text-sm font-medium">72%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-telugu">
                    <BilingualText english="Payment Methods" telugu="చెల్లింపు మార్గాలు" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-success rounded-full"></div>
                        <span className="text-sm font-telugu">
                          <BilingualText english="Cash" telugu="నగదు" />
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          ₹{paidPayments.filter(p => p.paymentMethod === "cash").reduce((sum, p) => sum + parseFloat(p.amount), 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {paidPayments.length ? Math.round((paidPayments.filter(p => p.paymentMethod === "cash").length / paidPayments.length) * 100) : 0}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-primary rounded-full"></div>
                        <span className="text-sm font-telugu">QR Code</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          ₹{paidPayments.filter(p => p.paymentMethod === "qr").reduce((sum, p) => sum + parseFloat(p.amount), 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {paidPayments.length ? Math.round((paidPayments.filter(p => p.paymentMethod === "qr").length / paidPayments.length) * 100) : 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="font-telugu">
                  <BilingualText english="Monthly Summary" telugu="నెలవారీ సారాంశం" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{guests?.length || 0}</p>
                    <p className="text-sm text-gray-600 font-telugu">
                      <BilingualText english="Total Bookings" telugu="మొత్తం బుకింగ్‌లు" />
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      ₹{paidPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600 font-telugu">
                      <BilingualText english="Total Revenue" telugu="మొత్తం ఆదాయం" />
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      ₹{paidPayments.length ? Math.round(paidPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0) / paidPayments.length) : 0}
                    </p>
                    <p className="text-sm text-gray-600 font-telugu">
                      <BilingualText english="Avg. per Booking" telugu="బుకింగ్‌కు సగటు" />
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">2.1</p>
                    <p className="text-sm text-gray-600 font-telugu">
                      <BilingualText english="Avg. Stay" telugu="సగటు బస" />
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <GuestRegistrationModal 
        open={showGuestModal} 
        onOpenChange={setShowGuestModal}
        rooms={rooms || []}
      />
      
      <PaymentModal 
        open={showPaymentModal} 
        onOpenChange={setShowPaymentModal}
        payment={selectedPayment}
      />
    </div>
  );
}
