import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageCircle, Send, BarChart3, History, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// SMS Templates
const SMS_TEMPLATES = [
  {
    id: 'welcome-booking',
    name: 'Welcome & Booking Confirmation',
    variables: ['LODGE_NAME', 'ROOM_NUMBER', 'CHECKIN_DATE', 'CHECKIN_TIME', 'AMOUNT']
  },
  {
    id: 'payment-confirmation',
    name: 'Payment Received',
    variables: ['AMOUNT', 'PAYMENT_METHOD', 'ROOM_NUMBER', 'RECEIPT_ID', 'LODGE_NAME']
  },
  {
    id: 'checkout-bill',
    name: 'Checkout & Final Bill',
    variables: ['LODGE_NAME', 'TOTAL_AMOUNT', 'DAYS']
  },
  {
    id: 'payment-reminder',
    name: 'Payment Reminder',
    variables: ['AMOUNT', 'LODGE_NAME', 'ROOM_NUMBER']
  }
];

interface BilingualTextProps {
  children: string;
}

function BilingualText({ children }: BilingualTextProps) {
  return <span className="text-sm">{children}</span>;
}

interface SMSPanelProps {
  className?: string;
}

export function SMSPanel({ className }: SMSPanelProps) {
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [customMessage, setCustomMessage] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get SMS statistics with fallback
  const { data: smsStats = { totalSent: 0, totalFailed: 0, successRate: 0, costTotal: 0 }, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/sms/stats'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get active guests for easy selection
  const { data: activeGuests } = useQuery({
    queryKey: ['/api/guests/active']
  });

  // Send SMS mutation
  const sendSMSMutation = useMutation({
    mutationFn: async (data: { 
      type: 'custom' | 'template', 
      phoneNumber: string, 
      message?: string,
      templateId?: string,
      variables?: Record<string, string>,
      guestId?: string 
    }) => {
      if (data.type === 'custom') {
        return apiRequest("POST", "/api/sms/send-bill", {
          phoneNumber: data.phoneNumber,
          message: data.message,
          guestId: data.guestId || null
        });
      } else {
        return apiRequest("POST", "/api/sms/send-template", {
          templateId: data.templateId,
          phoneNumber: data.phoneNumber,
          variables: data.variables,
          guestId: data.guestId || null
        });
      }
    },
    onSuccess: () => {
      toast({
        title: "SMS Sent",
        description: "Message sent successfully",
      });
      setSendModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/sms/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send SMS",
        description: error.message || "An error occurred while sending SMS",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedTemplate("");
    setCustomMessage("");
    setPhoneNumber("");
    setTemplateVariables({});
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = SMS_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      // Initialize template variables
      const initialVars: Record<string, string> = {};
      template.variables.forEach(variable => {
        initialVars[variable] = "";
      });
      setTemplateVariables(initialVars);
    }
  };

  const handleSendSMS = () => {
    if (!phoneNumber) {
      toast({
        title: "Phone Number Required",
        description: "Please enter a phone number",
        variant: "destructive",
      });
      return;
    }

    if (selectedTemplate) {
      // Send templated SMS
      const template = SMS_TEMPLATES.find(t => t.id === selectedTemplate);
      if (template) {
        const missingVars = template.variables.filter(v => !templateVariables[v]);
        if (missingVars.length > 0) {
          toast({
            title: "Missing Variables",
            description: `Please fill in: ${missingVars.join(', ')}`,
            variant: "destructive",
          });
          return;
        }
      }

      sendSMSMutation.mutate({
        type: 'template',
        phoneNumber,
        templateId: selectedTemplate,
        variables: templateVariables
      });
    } else if (customMessage) {
      // Send custom SMS
      sendSMSMutation.mutate({
        type: 'custom',
        phoneNumber,
        message: customMessage
      });
    } else {
      toast({
        title: "Message Required",
        description: "Please enter a message or select a template",
        variant: "destructive",
      });
    }
  };

  const formatPhoneNumber = (phone: string) => {
    // Add +91 if not present
    if (phone.length === 10 && !phone.startsWith('+')) {
      return `+91${phone}`;
    }
    return phone;
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <BilingualText>SMS Messaging (SMS మెసేజింగ్)</BilingualText>
          </CardTitle>
          <CardDescription>
            <BilingualText>
              Send messages to guests and track delivery status (అతిథులకు సందేశాలు పంపండి మరియు డెలివరీ స్థితిని ట్రాక్ చేయండి)
            </BilingualText>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* SMS Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-primary/10 rounded-lg p-4">
              <div className="text-2xl font-bold text-primary">
                {statsLoading ? '...' : (smsStats?.totalSent || 0)}
              </div>
              <div className="text-sm text-muted-foreground">
                <BilingualText>SMS Sent (పంపిన SMS)</BilingualText>
              </div>
            </div>
            <div className="bg-green-100 dark:bg-green-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {statsLoading ? '...' : `${Math.round(smsStats?.successRate || 0)}%`}
              </div>
              <div className="text-sm text-muted-foreground">
                <BilingualText>Success Rate (విజయవంతం)</BilingualText>
              </div>
            </div>
            <div className="bg-red-100 dark:bg-red-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {statsLoading ? '...' : (smsStats?.totalFailed || 0)}
              </div>
              <div className="text-sm text-muted-foreground">
                <BilingualText>Failed (విఫలమైన)</BilingualText>
              </div>
            </div>
          </div>

          {/* Send SMS Button */}
          <Dialog open={sendModalOpen} onOpenChange={setSendModalOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Send className="h-4 w-4 mr-2" />
                <BilingualText>Send SMS (SMS పంపండి)</BilingualText>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  <BilingualText>Send SMS Message (SMS సందేశం పంపండి)</BilingualText>
                </DialogTitle>
                <DialogDescription>
                  <BilingualText>
                    Choose a template or write a custom message (టెంప్లేట్ ఎంచుకోండి లేదా కస్టమ్ సందేశం రాయండి)
                  </BilingualText>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Phone Number */}
                <div>
                  <Label htmlFor="phone">
                    <BilingualText>Phone Number (ఫోన్ నంబర్)</BilingualText>
                  </Label>
                  <Input
                    id="phone"
                    placeholder="+919876543210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                  />
                </div>

                {/* Template Selection */}
                <div>
                  <Label>
                    <BilingualText>Select Template (టెంప్లేట్ ఎంచుకోండి)</BilingualText>
                  </Label>
                  <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a template or leave blank for custom message" />
                    </SelectTrigger>
                    <SelectContent>
                      {SMS_TEMPLATES.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Template Variables */}
                {selectedTemplate && (
                  <div className="space-y-3">
                    <Label>
                      <BilingualText>Template Variables (టెంప్లేట్ వేరియబుల్స్)</BilingualText>
                    </Label>
                    {SMS_TEMPLATES.find(t => t.id === selectedTemplate)?.variables.map((variable) => (
                      <div key={variable}>
                        <Label htmlFor={variable} className="text-xs">
                          {variable}
                        </Label>
                        <Input
                          id={variable}
                          placeholder={`Enter ${variable}`}
                          value={templateVariables[variable] || ''}
                          onChange={(e) => 
                            setTemplateVariables(prev => ({
                              ...prev,
                              [variable]: e.target.value
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Custom Message */}
                {!selectedTemplate && (
                  <div>
                    <Label htmlFor="message">
                      <BilingualText>Custom Message (కస్టమ్ సందేశం)</BilingualText>
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="Enter your custom message here..."
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      rows={4}
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      Characters: {customMessage.length} / 160 (1 SMS)
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleSendSMS} 
                    disabled={sendSMSMutation.isPending}
                    className="flex-1"
                  >
                    {sendSMSMutation.isPending ? (
                      <BilingualText>Sending... (పంపుతోంది...)</BilingualText>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        <BilingualText>Send SMS (SMS పంపండి)</BilingualText>
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setSendModalOpen(false)}
                    disabled={sendSMSMutation.isPending}
                  >
                    <BilingualText>Cancel (రద్దు చేయండి)</BilingualText>
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Quick Actions */}
          <div className="flex gap-2 text-sm">
            <Badge variant="secondary" className="cursor-pointer">
              <BarChart3 className="h-3 w-3 mr-1" />
              <BilingualText>Analytics (విశ్లేషణలు)</BilingualText>
            </Badge>
            <Badge variant="outline" className="cursor-pointer">
              <History className="h-3 w-3 mr-1" />
              <BilingualText>History (చరిత్ర)</BilingualText>
            </Badge>
            <Badge variant="outline" className="cursor-pointer">
              <Users className="h-3 w-3 mr-1" />
              <BilingualText>Templates (టెంప్లేట్లు)</BilingualText>
            </Badge>
          </div>

          {/* Development Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <strong>🚀 Development Mode:</strong> SMS messages are logged to console. 
              Configure Twilio, AWS SNS, or Firebase credentials to send real SMS.
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-300 mt-1">
              Check SMS_INTEGRATION_GUIDE.md for setup instructions.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}