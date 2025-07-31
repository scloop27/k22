import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BilingualText } from "@/components/bilingual-text";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Room } from "@shared/schema";
import { X, AlertTriangle } from "lucide-react";

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
    checkinTime: "",
    checkoutDate: "",
    purposeOfVisit: "",
    roomId: "",
    numberOfGuests: 1,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [costBreakdown, setCostBreakdown] = useState({
    baseAmount: 0,
    discountAmount: 0,
    totalAmount: 0,
    totalDays: 0,
  });
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [isManualDataEntry, setIsManualDataEntry] = useState(false);
  const [showPastDateWarning, setShowPastDateWarning] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (formData.checkinDate && formData.checkoutDate) {
      checkAvailability();
      validateDates();
    }
  }, [formData.checkinDate, formData.checkoutDate, isManualDataEntry]);

  const validateDates = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const checkinDate = new Date(formData.checkinDate);
    const checkoutDate = new Date(formData.checkoutDate);
    
    // Check if dates are in the past
    const isPastDate = checkinDate < today || checkoutDate < today;
    
    if (isPastDate && !isManualDataEntry) {
      setShowPastDateWarning(true);
    } else {
      setShowPastDateWarning(false);
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (formData.roomId && formData.checkinDate && formData.checkoutDate) {
      calculateCost();
    }
  }, [formData.roomId, formData.checkinDate, formData.checkoutDate, discountPercentage]);

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
    // Calculate 24-hour periods - minimum 1 day even for same day
    const totalDays = Math.max(1, Math.ceil((checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24)));
    
    const baseAmount = parseFloat(selectedRoom.basePrice) * totalDays;
    const discountAmount = baseAmount * (discountPercentage / 100);
    const totalAmount = baseAmount - discountAmount;

    setCostBreakdown({
      baseAmount,
      discountAmount,
      totalAmount,
      totalDays,
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
        totalDays: costBreakdown.totalDays,
        baseAmount: costBreakdown.baseAmount.toString(),
        discountAmount: costBreakdown.discountAmount.toString(),
        totalAmount: costBreakdown.totalAmount.toString(),
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
        checkinTime: "",
        checkoutDate: "",
        purposeOfVisit: "",
        roomId: "",
        numberOfGuests: 1,
      });
      setCostBreakdown({ baseAmount: 0, discountAmount: 0, totalAmount: 0, totalDays: 0 });
      setDiscountPercentage(0);
      setIsManualDataEntry(false);
      setShowPastDateWarning(false);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/guests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
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
                min={isManualDataEntry ? undefined : getTodayDate()}
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
                min={isManualDataEntry ? undefined : getTodayDate()}
                required
                className="mt-2"
              />
            </div>
            
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="manual-entry"
                  checked={isManualDataEntry}
                  onCheckedChange={(checked) => setIsManualDataEntry(checked as boolean)}
                />
                <Label 
                  htmlFor="manual-entry" 
                  className="text-sm font-telugu cursor-pointer"
                >
                  <BilingualText 
                    english="Allow past dates (Manual data entry)" 
                    telugu="గత తేదీలను అనుమతించు (మాన్యువల్ డేటా ఎంట్రీ)" 
                  />
                </Label>
              </div>
              
              {showPastDateWarning && !isManualDataEntry && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700 font-telugu">
                    <BilingualText 
                      english="Past dates are not allowed. Enable manual data entry to use past dates." 
                      telugu="గత తేదీలు అనుమతించబడవు. గత తేదీలను ఉపయోగించడానికి మాన్యువల్ డేటా ఎంట్రీని ఎనేబుల్ చేయండి." 
                    />
                  </AlertDescription>
                </Alert>
              )}
              
              {isManualDataEntry && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-700 font-telugu">
                    <BilingualText 
                      english="Warning: You are adding this data manually" 
                      telugu="హెచ్చరిక: మీరు ఈ డేటాను మాన్యువల్‌గా జోడిస్తున్నారు" 
                    />
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            <div>
              <Label className="font-telugu">
                <BilingualText english="Check-in Time" telugu="చెక్-ఇన్ సమయం" /> *
              </Label>
              <Input
                type="time"
                value={formData.checkinTime}
                onChange={(e) => setFormData({...formData, checkinTime: e.target.value})}
                required
                className="mt-2"
              />
            </div>
            
            <div>
              <Label className="font-telugu">
                <BilingualText english="Purpose of Visit" telugu="సందర్శన ప్రయోజనం" /> *
              </Label>
              <Select value={formData.purposeOfVisit} onValueChange={(value) => setFormData({...formData, purposeOfVisit: value})}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Business" className="font-telugu">
                    <BilingualText english="Business" telugu="వ్యాపారం" />
                  </SelectItem>
                  <SelectItem value="Tourism" className="font-telugu">
                    <BilingualText english="Tourism" telugu="పర్యటన" />
                  </SelectItem>
                  <SelectItem value="Personal" className="font-telugu">
                    <BilingualText english="Personal" telugu="వ్యక్తిగతం" />
                  </SelectItem>
                  <SelectItem value="Medical" className="font-telugu">
                    <BilingualText english="Medical" telugu="వైద్యం" />
                  </SelectItem>
                  <SelectItem value="Education" className="font-telugu">
                    <BilingualText english="Education" telugu="విద్య" />
                  </SelectItem>
                  <SelectItem value="Official" className="font-telugu">
                    <BilingualText english="Official" telugu="అధికారిక" />
                  </SelectItem>
                  <SelectItem value="Other" className="font-telugu">
                    <BilingualText english="Other" telugu="ఇతర" />
                  </SelectItem>
                </SelectContent>
              </Select>
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

          {/* Discount Input */}
          {formData.roomId && formData.checkinDate && formData.checkoutDate && (
            <div>
              <Label className="font-telugu">
                <BilingualText english="Discount %" telugu="తగ్గింపు %" />
              </Label>
              <Input
                type="number"
                value={discountPercentage}
                onChange={(e) => {
                  const value = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0));
                  setDiscountPercentage(value);
                }}
                min="0"
                max="100"
                step="0.1"
                placeholder="Enter discount percentage"
                className="mt-2"
              />
            </div>
          )}

          {/* Cost Calculation */}
          {costBreakdown.totalAmount > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-3 font-telugu">
                <BilingualText english="Cost Breakdown" telugu="వ్యయ విభజన" />
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-telugu">
                    <BilingualText english="Room charges" telugu="గది ఛార్జీలు" />:
                  </span>
                  <span>₹{costBreakdown.baseAmount.toLocaleString()} ({costBreakdown.totalDays} days)</span>
                </div>
                {costBreakdown.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="font-telugu">
                      <BilingualText english={`Discount (${discountPercentage}%)`} telugu={`తగ్గింపు (${discountPercentage}%)`} />:
                    </span>
                    <span>-₹{costBreakdown.discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span className="font-telugu">
                    <BilingualText english="Total Amount" telugu="మొత్తం" />:
                  </span>
                  <span>₹{costBreakdown.totalAmount.toLocaleString()}</span>
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
