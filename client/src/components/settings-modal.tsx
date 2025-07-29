import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BilingualText } from "@/components/bilingual-text";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { LodgeSettings } from "@shared/schema";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: LodgeSettings | null;
}

export function SettingsModal({ open, onOpenChange, settings }: SettingsModalProps) {
  const [formData, setFormData] = useState({
    name: settings?.name || "",
    address: settings?.address || "",
    contactNumber: settings?.contactNumber || "",
    discountRate: settings?.discountRate || "0.00",
    smsTemplate: settings?.smsTemplate || ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Update form data when settings change
  useState(() => {
    if (settings) {
      setFormData({
        name: settings.name,
        address: settings.address,
        contactNumber: settings.contactNumber,
        discountRate: settings.discountRate,
        smsTemplate: settings.smsTemplate || ""
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setIsLoading(true);
    try {
      const response = await apiRequest("PUT", `/api/lodge-settings/${settings.id}`, formData);
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Lodge settings updated successfully",
        });
        onOpenChange(false);
        // Reload page to refresh data
        window.location.reload();
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update lodge settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!settings) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-telugu text-xl">
            <BilingualText english="Lodge Settings" telugu="లాజ్ సెట్టింగ్స్" />
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-telugu">
                <BilingualText english="Lodge Name" telugu="లాజ్ పేరు" />
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter lodge name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact" className="font-telugu">
                <BilingualText english="Contact Number" telugu="సంప్రదింపు నంబర్" />
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="contact"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                placeholder="Enter contact number"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="font-telugu">
              <BilingualText english="Address" telugu="చిరునామా" />
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter complete address"
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="discount" className="font-telugu">
              <BilingualText english="Default Discount Rate (%)" telugu="డిఫాల్ట్ తగ్గింపు రేటు (%)" />
            </Label>
            <Input
              id="discount"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={formData.discountRate}
              onChange={(e) => setFormData({ ...formData, discountRate: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sms" className="font-telugu">
              <BilingualText english="SMS Template" telugu="SMS టెంప్లేట్" />
            </Label>
            <Textarea
              id="sms"
              value={formData.smsTemplate}
              onChange={(e) => setFormData({ ...formData, smsTemplate: e.target.value })}
              placeholder="Your bill from [LODGE_NAME]: ₹[AMOUNT]. Thank you!"
              rows={3}
            />
            <p className="text-sm text-gray-500">
              Use [LODGE_NAME] and [AMOUNT] as placeholders
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
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
                <BilingualText english="Update Settings" telugu="సెట్టింగ్స్ అప్‌డేట్ చేయి" />
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}