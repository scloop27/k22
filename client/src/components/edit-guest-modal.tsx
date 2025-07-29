import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BilingualText } from "@/components/bilingual-text";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { GuestWithRoom } from "@/lib/types";

interface EditGuestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guest: GuestWithRoom | null;
}

export function EditGuestModal({ open, onOpenChange, guest }: EditGuestModalProps) {
  const [formData, setFormData] = useState({
    name: guest?.name || "",
    phoneNumber: guest?.phoneNumber || "",
    aadharNumber: guest?.aadharNumber || "",
    numberOfGuests: guest?.numberOfGuests || 1,
    status: guest?.status || "active"
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Update form data when guest changes
  useState(() => {
    if (guest) {
      setFormData({
        name: guest.name,
        phoneNumber: guest.phoneNumber,
        aadharNumber: guest.aadharNumber,
        numberOfGuests: guest.numberOfGuests,
        status: guest.status
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guest) return;

    setIsLoading(true);
    try {
      const response = await apiRequest("PUT", `/api/guests/${guest.id}`, formData);
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Guest updated successfully",
        });
        onOpenChange(false);
        // Reload page to refresh data
        window.location.reload();
      } else {
        throw new Error('Failed to update guest');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update guest",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!guest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-telugu text-xl">
            <BilingualText english="Edit Guest" telugu="అతిథి సవరణ" />
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="font-telugu">
              <BilingualText english="Guest Name" telugu="అతిథి పేరు" />
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter guest name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="font-telugu">
              <BilingualText english="Phone Number" telugu="ఫోన్ నంబర్" />
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="phone"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              placeholder="Enter phone number"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="aadhar" className="font-telugu">
              <BilingualText english="Aadhaar Number" telugu="ఆధార్ నంబర్" />
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="aadhar"
              value={formData.aadharNumber}
              onChange={(e) => setFormData({ ...formData, aadharNumber: e.target.value })}
              placeholder="Enter 12-digit Aadhaar number"
              maxLength={12}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guests" className="font-telugu">
              <BilingualText english="Number of Guests" telugu="అతిథుల సంఖ్య" />
            </Label>
            <Input
              id="guests"
              type="number"
              min="1"
              max="10"
              value={formData.numberOfGuests}
              onChange={(e) => setFormData({ ...formData, numberOfGuests: parseInt(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="font-telugu">
              <BilingualText english="Status" telugu="స్థితి" />
            </Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">
                  <span className="font-telugu">
                    <BilingualText english="Active" telugu="క్రియాశీల" />
                  </span>
                </SelectItem>
                <SelectItem value="checked_out">
                  <span className="font-telugu">
                    <BilingualText english="Checked Out" telugu="చెక్-అవుట్" />
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              <BilingualText english="Cancel" telugu="రద్దు చేయి" />
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : (
                <BilingualText english="Update Guest" telugu="అతిథిని అప్‌డేట్ చేయి" />
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}