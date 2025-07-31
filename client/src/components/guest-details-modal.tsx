import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BilingualText } from "@/components/bilingual-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { GuestWithRoom } from "@/lib/types";
import { Calendar, Phone, CreditCard, MapPin, Users, Clock } from "lucide-react";

interface GuestDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guest: GuestWithRoom | null;
}

export function GuestDetailsModal({ open, onOpenChange, guest }: GuestDetailsModalProps) {
  if (!guest) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success text-white";
      case "checked_out": 
        return "bg-gray-500 text-white";
      default:
        return "bg-primary text-white";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-telugu text-xl">
            <BilingualText english="Guest Details" telugu="అతిథి వివరాలు" />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 font-telugu">
                  <BilingualText english="Personal Information" telugu="వ్యక్తిగత సమాచారం" />
                </h3>
                <Separator className="mt-2 mb-4" />
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Users className="text-gray-500" size={16} />
                    <div>
                      <p className="text-sm text-gray-600 font-telugu">
                        <BilingualText english="Name" telugu="పేరు" />
                      </p>
                      <p className="font-medium">{guest.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Phone className="text-gray-500" size={16} />
                    <div>
                      <p className="text-sm text-gray-600 font-telugu">
                        <BilingualText english="Phone Number" telugu="ఫోన్ నంబర్" />
                      </p>
                      <p className="font-medium">{guest.phoneNumber}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <CreditCard className="text-gray-500" size={16} />
                    <div>
                      <p className="text-sm text-gray-600 font-telugu">
                        <BilingualText english="Aadhaar Number" telugu="ఆధార్ నంబర్" />
                      </p>
                      <p className="font-medium">{guest.aadharNumber}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 font-telugu">
                  <BilingualText english="Booking Information" telugu="బుకింగ్ సమాచారం" />
                </h3>
                <Separator className="mt-2 mb-4" />
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <MapPin className="text-gray-500" size={16} />
                    <div>
                      <p className="text-sm text-gray-600 font-telugu">
                        <BilingualText english="Room" telugu="గది" />
                      </p>
                      <p className="font-medium">
                        {guest.room?.roomNumber || "—"} 
                        {guest.room?.roomType && ` (${guest.room.roomType})`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Users className="text-gray-500" size={16} />
                    <div>
                      <p className="text-sm text-gray-600 font-telugu">
                        <BilingualText english="Number of Guests" telugu="అతిథుల సంఖ్య" />
                      </p>
                      <p className="font-medium">{guest.numberOfGuests}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Clock className="text-gray-500" size={16} />
                    <div>
                      <p className="text-sm text-gray-600 font-telugu">
                        <BilingualText english="Check-in Time" telugu="చెక్-ఇన్ సమయం" />
                      </p>
                      <p className="font-medium">{guest.checkinTime || "—"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Calendar className="text-gray-500" size={16} />
                    <div>
                      <p className="text-sm text-gray-600 font-telugu">
                        <BilingualText english="Purpose of Visit" telugu="సందర్శన ప్రయోజనం" />
                      </p>
                      <p className="font-medium font-telugu">
                        {guest.purposeOfVisit === "Business" && <BilingualText english="Business" telugu="వ్యాపారం" />}
                        {guest.purposeOfVisit === "Tourism" && <BilingualText english="Tourism" telugu="పర్యటన" />}
                        {guest.purposeOfVisit === "Personal" && <BilingualText english="Personal" telugu="వ్యక్తిగతం" />}
                        {guest.purposeOfVisit === "Medical" && <BilingualText english="Medical" telugu="వైద్యం" />}
                        {guest.purposeOfVisit === "Education" && <BilingualText english="Education" telugu="విద్య" />}
                        {guest.purposeOfVisit === "Official" && <BilingualText english="Official" telugu="అధికారిక" />}
                        {guest.purposeOfVisit === "Other" && <BilingualText english="Other" telugu="ఇతర" />}
                        {!guest.purposeOfVisit && "—"}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 font-telugu mb-2">
                      <BilingualText english="Status" telugu="స్థితి" />
                    </p>
                    <Badge className={getStatusColor(guest.status)}>
                      {guest.status === "active" ? (
                        <span className="font-telugu">
                          <BilingualText english="Active" telugu="క్రియాశీల" />
                        </span>
                      ) : (
                        <span className="font-telugu">
                          <BilingualText english="Checked Out" telugu="చెక్-అవుట్" />
                        </span>
                      )}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dates and Payment */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 font-telugu mb-4">
              <BilingualText english="Stay & Payment Details" telugu="బస & చెల్లింపు వివరాలు" />
            </h3>
            <Separator className="mb-4" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Calendar className="text-gray-500" size={16} />
                  <div>
                    <p className="text-sm text-gray-600 font-telugu">
                      <BilingualText english="Check-in Date" telugu="చెక్-ఇన్ తేదీ" />
                    </p>
                    <p className="font-medium">{formatDate(guest.checkinDate)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Calendar className="text-gray-500" size={16} />
                  <div>
                    <p className="text-sm text-gray-600 font-telugu">
                      <BilingualText english="Check-out Date" telugu="చెక్-అవుట్ తేదీ" />
                    </p>
                    <p className="font-medium">{formatDate(guest.checkoutDate)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Clock className="text-gray-500" size={16} />
                  <div>
                    <p className="text-sm text-gray-600 font-telugu">
                      <BilingualText english="Total Days" telugu="మొత్తం రోజులు" />
                    </p>
                    <p className="font-medium">{guest.totalDays}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 font-telugu">
                    <BilingualText english="Base Amount" telugu="మూల మొత్తం" />
                  </p>
                  <p className="font-medium">₹{parseFloat(guest.baseAmount).toLocaleString()}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 font-telugu">
                    <BilingualText english="Discount" telugu="తగ్గింపు" />
                  </p>
                  <p className="font-medium text-success">-₹{parseFloat(guest.discountAmount).toLocaleString()}</p>
                </div>
                
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-600 font-telugu">
                    <BilingualText english="Total Amount" telugu="మొత్తం" />
                  </p>
                  <p className="text-xl font-bold text-primary">₹{parseFloat(guest.totalAmount).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Registration Date */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <Clock className="text-gray-500" size={16} />
              <div>
                <p className="text-sm text-gray-600 font-telugu">
                  <BilingualText english="Registered On" telugu="నమోదు చేసిన తేదీ" />
                </p>
                <p className="font-medium">
                  {new Date(guest.createdAt).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <BilingualText english="Close" telugu="మూసివేయి" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}