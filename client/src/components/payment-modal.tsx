import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { BilingualText } from "@/components/bilingual-text";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { PaymentWithGuest } from "@/lib/types";
import { IndianRupee, QrCode, X } from "lucide-react";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: PaymentWithGuest | null;
}

export function PaymentModal({ open, onOpenChange, payment }: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<"cash" | "qr" | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleMethodSelect = (method: "cash" | "qr") => {
    setSelectedMethod(method);
    setIsConfirmed(false);
  };

  const handleConfirmPayment = async () => {
    if (!payment || !selectedMethod || !isConfirmed) {
      toast({
        title: "Error",
        description: "Please select payment method and confirm payment received",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Update payment status
      await apiRequest("PUT", `/api/payments/${payment.id}`, {
        status: "paid",
        paymentMethod: selectedMethod,
      });

      // Send SMS bill
      const smsMessage = `Your bill from Lodge: ₹${parseFloat(payment.amount).toLocaleString()}. Thank you for staying with us! (మీ బిల్ లాడ్జ్ నుండి: ₹${parseFloat(payment.amount).toLocaleString()}. మాతో ఉంటుండడానికి ధన్యవాదాలు!)`;
      
      await apiRequest("POST", "/api/sms/send-bill", {
        guestId: payment.guestId,
        phoneNumber: payment.guest?.phoneNumber,
        message: smsMessage,
      });

      toast({
        title: "Success",
        description: "Payment confirmed and SMS sent successfully!",
      });

      // Reset form
      setSelectedMethod(null);
      setIsConfirmed(false);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/dashboard"] });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-telugu">
            <BilingualText english="Process Payment" telugu="చెల్లింపు ప్రాసెస్ చేయండి" />
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Payment Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Guest: {payment.guest?.name || "Unknown"}</h4>
            <p className="text-sm text-gray-600">
              {payment.room?.roomNumber && `Room ${payment.room.roomNumber} • `}
              Amount: ₹{parseFloat(payment.amount).toLocaleString()}
            </p>
          </div>

          {/* Payment Method Selection */}
          <div>
            <Label className="font-telugu text-base font-medium">
              <BilingualText english="Payment Method" telugu="చెల్లింపు మార్గం" /> *
            </Label>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <button
                type="button"
                onClick={() => handleMethodSelect("cash")}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedMethod === "cash"
                    ? "border-success bg-green-50"
                    : "border-gray-300 hover:border-success"
                }`}
              >
                <div className="text-center">
                  <IndianRupee className="text-success mx-auto mb-2" size={32} />
                  <p className="font-telugu">
                    <BilingualText english="Cash" telugu="నగదు" />
                  </p>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => handleMethodSelect("qr")}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedMethod === "qr"
                    ? "border-primary bg-blue-50"
                    : "border-gray-300 hover:border-primary"
                }`}
              >
                <div className="text-center">
                  <QrCode className="text-primary mx-auto mb-2" size={32} />
                  <p className="font-telugu">QR Code</p>
                </div>
              </button>
            </div>
          </div>

          {/* QR Code Instructions */}
          {selectedMethod === "qr" && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h5 className="font-semibold mb-2 font-telugu">
                <BilingualText english="QR Payment Instructions" telugu="QR చెల్లింపు సూచనలు" />
              </h5>
              <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside font-telugu">
                <li>
                  <BilingualText 
                    english="Show the desk QR code to guest" 
                    telugu="అతిథికి డెస్క్ QR కోడ్ చూపించండి" 
                  />
                </li>
                <li>
                  Guest scans and pays ₹{parseFloat(payment.amount).toLocaleString()} 
                  <span className="font-telugu">
                    {" "}(అతిథి స్కాన్ చేసి ₹{parseFloat(payment.amount).toLocaleString()} చెల్లిస్తారు)
                  </span>
                </li>
                <li>
                  <BilingualText 
                    english="Check your bank notification" 
                    telugu="మీ బ్యాంక్ నోటిఫికేషన్ చూడండి" 
                  />
                </li>
                <li>
                  <BilingualText 
                    english="Mark as paid below" 
                    telugu="క్రింద చెల్లించినట్లు గుర్తు పెట్టండి" 
                  />
                </li>
              </ol>
            </div>
          )}

          {/* Cash Instructions */}
          {selectedMethod === "cash" && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h5 className="font-semibold mb-2 font-telugu">
                <BilingualText english="Cash Payment Instructions" telugu="నగదు చెల్లింపు సూచనలు" />
              </h5>
              <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside font-telugu">
                <li>
                  Collect ₹{parseFloat(payment.amount).toLocaleString()} from guest
                  <span className="font-telugu">
                    {" "}(అతిథి నుండి ₹{parseFloat(payment.amount).toLocaleString()} సేకరించండి)
                  </span>
                </li>
                <li>
                  <BilingualText 
                    english="Count and verify the amount" 
                    telugu="మొత్తాన్ని లెక్కించి ధృవీకరించండి" 
                  />
                </li>
                <li>
                  <BilingualText 
                    english="Mark as paid below" 
                    telugu="క్రింద చెల్లించినట్లు గుర్తు పెట్టండి" 
                  />
                </li>
              </ol>
            </div>
          )}

          {/* Payment Confirmation */}
          {selectedMethod && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="paymentConfirmed"
                checked={isConfirmed}
                onCheckedChange={(checked) => setIsConfirmed(checked === true)}
              />
              <Label 
                htmlFor="paymentConfirmed" 
                className="text-sm font-telugu cursor-pointer"
              >
                <BilingualText 
                  english="Payment received and verified" 
                  telugu="చెల్లింపు అందుకుని నిర్ధారించబడింది" 
                />
              </Label>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="font-telugu"
            >
              <BilingualText english="Cancel" telugu="రద్దు చేయండి" />
            </Button>
            <Button 
              onClick={handleConfirmPayment}
              disabled={!selectedMethod || !isConfirmed || isLoading}
              className="bg-success hover:bg-green-700 font-telugu"
            >
              {isLoading ? "Processing..." : (
                <BilingualText 
                  english="Confirm Payment & Send SMS" 
                  telugu="చెల్లింపు నిర్ధారించి SMS పంపండి" 
                />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
