import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BilingualText } from "@/components/bilingual-text";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Room } from "@shared/schema";
import { X } from "lucide-react";

interface GuestRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rooms: Room[];
}

export function GuestRegistrationModal({ open, onOpenChange, rooms }: GuestRegistrationModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    aadharNumber: "",
    checkinDate: "",
    checkoutDate: "",
    roomId: "",
    numberOfGuests: 1,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [costBreakdown, setCostBreakdown] = useState({
    roomCharges: 0,
    tax: 0,
    total: 0,
    nights: 0,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (formData.checkinDate && formData.checkoutDate) {
      checkAvailability();
    }
  }, [formData.checkinDate, formData.checkoutDate]);

  useEffect(() => {
    if (formData.roomId && formData.checkinDate && formData.checkoutDate) {
      calculateCost();
    }
  }, [formData.roomId, formData.checkinDate, formData.checkoutDate]);

  const checkAvailability = async () => {
    try {
      const response = await apiRequest("GET", `/api/rooms/available?checkinDate=${formData.checkinDate}&checkoutDate=${formData.checkoutDate}`);
      const available = await response.json();
      setAvailableRooms(available);
    } catch (error) {
      console.error("Failed to check availability:", error);
    }
  };

  const calculateCost = () => {
    const selectedRoom = availableRooms.find(room => room.id === formData.roomId);
    if (!selectedRoom || !formData.checkinDate || !formData.checkoutDate) return;

    const checkin = new Date(formData.checkinDate);
    const checkout = new Date(formData.checkoutDate);
    const nights = Math.ceil((checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24));
    
    const roomCharges = parseFloat(selectedRoom.basePrice) * nights;
    const tax = roomCharges * 0.18; // 18% tax
    const total = roomCharges + tax;

    setCostBreakdown({
      roomCharges,
      tax,
      total,
      nights,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiRequest("POST", "/api/guests", {
        ...formData,
        checkinDate: new Date(formData.checkinDate).toISOString(),
        checkoutDate: new Date(formData.checkoutDate).toISOString(),
        totalAmount: costBreakdown.total.toString(),
      });

      toast({
        title: "Success",
        description: "Guest registered successfully!",
      });

      // Reset form
      setFormData({
        name: "",
        phoneNumber: "",
        aadharNumber: "",
        checkinDate: "",
        checkoutDate: "",
        roomId: "",
        numberOfGuests: 1,
      });
      setCostBreakdown({ roomCharges: 0, tax: 0, total: 0, nights: 0 });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/guests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/dashboard"] });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to register guest. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-telugu">
            <BilingualText english="Guest Registration" telugu="అతిథి నమోదు" />
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="font-telugu">
                <BilingualText english="Name" telugu="పేరు" /> *
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter full name"
                required
                className="mt-2"
              />
            </div>
            
            <div>
              <Label className="font-telugu">
                <BilingualText english="Phone Number" telugu="ఫోన్ నంబర్" /> *
              </Label>
              <Input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                placeholder="+91 XXXXXXXXXX"
                required
                className="mt-2"
              />
            </div>
            
            <div className="md:col-span-2">
              <Label className="font-telugu">
                <BilingualText english="Aadhar Number" telugu="ఆధార్ నంబర్" /> *
              </Label>
              <Input
                value={formData.aadharNumber}
                onChange={(e) => setFormData({...formData, aadharNumber: e.target.value})}
                placeholder="1234-5678-9012"
                required
                className="mt-2"
              />
            </div>
            
            <div>
              <Label className="font-telugu">
                <BilingualText english="Check-in Date" telugu="చెక్-ఇన్ తేదీ" /> *
              </Label>
              <Input
                type="date"
                value={formData.checkinDate}
                onChange={(e) => setFormData({...formData, checkinDate: e.target.value})}
                required
                className="mt-2"
              />
            </div>
            
            <div>
              <Label className="font-telugu">
                <BilingualText english="Check-out Date" telugu="చెక్-అవుట్ తేదీ" /> *
              </Label>
              <Input
                type="date"
                value={formData.checkoutDate}
                onChange={(e) => setFormData({...formData, checkoutDate: e.target.value})}
                required
                className="mt-2"
              />
            </div>
            
            <div>
              <Label className="font-telugu">
                <BilingualText english="Room Type" telugu="గది రకం" /> *
              </Label>
              <Select value={formData.roomId} onValueChange={(value) => setFormData({...formData, roomId: value})}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select room type" />
                </SelectTrigger>
                <SelectContent>
                  {availableRooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      <span className="font-telugu">
                        {room.roomNumber} - <BilingualText 
                          english={room.roomType === "single" ? "Single" : "Double"} 
                          telugu={room.roomType === "single" ? "సింగిల్" : "డబుల్"} 
                        /> - ₹{room.basePrice}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="font-telugu">
                <BilingualText english="Number of Guests" telugu="అతిథుల సంఖ్య" />
              </Label>
              <Input
                type="number"
                value={formData.numberOfGuests}
                onChange={(e) => setFormData({...formData, numberOfGuests: parseInt(e.target.value) || 1})}
                min="1"
                className="mt-2"
              />
            </div>
          </div>

          {/* Cost Calculation */}
          {costBreakdown.total > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-3 font-telugu">
                <BilingualText english="Cost Breakdown" telugu="వ్యయ విభజన" />
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-telugu">
                    <BilingualText english="Room charges" telugu="గది ఛార్జీలు" />:
                  </span>
                  <span>₹{costBreakdown.roomCharges.toLocaleString()} ({costBreakdown.nights} nights)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-telugu">
                    <BilingualText english="Tax (18%)" telugu="పన్ను (18%)" />:
                  </span>
                  <span>₹{costBreakdown.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span className="font-telugu">
                    <BilingualText english="Total Amount" telugu="మొత్తం" />:
                  </span>
                  <span>₹{costBreakdown.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="font-telugu"
            >
              <BilingualText english="Cancel" telugu="రద్దు చేయండి" />
            </Button>
            <Button type="submit" disabled={isLoading} className="font-telugu">
              {isLoading ? "Registering..." : (
                <BilingualText english="Register & Assign Room" telugu="నమోదు చేసి గది కేటాయించండి" />
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
