import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { BilingualText } from "@/components/bilingual-text";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowRight, ArrowLeft, Check, Plus, Trash } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Room {
  roomNumber: string;
  roomType: string;
  basePrice: string;
}

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Step 1: Lodge Details
  const [lodgeDetails, setLodgeDetails] = useState({
    name: "",
    contactNumber: "",
    address: "",
    discountRate: "0.00",
    currency: "INR"
  });

  // Step 2: Rooms and Room Types
  const [customRoomTypes, setCustomRoomTypes] = useState([
    { name: "single", displayName: "Single" },
    { name: "double", displayName: "Double" }
  ]);
  const [newRoomType, setNewRoomType] = useState({
    name: "",
    displayName: ""
  });
  const [rooms, setRooms] = useState<Room[]>([]);
  const [newRoom, setNewRoom] = useState<Room>({
    roomNumber: "",
    roomType: customRoomTypes[0]?.name || "",
    basePrice: ""
  });

  // Step 3: Preferences
  const [preferences, setPreferences] = useState({
    smsTemplate: "Your bill from [LODGE_NAME]: ₹[AMOUNT]. Thank you for staying with us! (మీ బిల్ [LODGE_NAME] నుండి: ₹[AMOUNT]. మాతో ఉంటుండడానికి ధన్యవాదాలు!)"
  });

  const addRoom = () => {
    if (!newRoom.roomNumber || !newRoom.basePrice) {
      toast({
        title: "Error",
        description: "Room number and base price are required",
        variant: "destructive",
      });
      return;
    }

    if (rooms.find(room => room.roomNumber === newRoom.roomNumber)) {
      toast({
        title: "Error",
        description: "Room number already exists",
        variant: "destructive",
      });
      return;
    }

    setRooms([...rooms, newRoom]);
    setNewRoom({ roomNumber: "", roomType: customRoomTypes[0]?.name || "", basePrice: "" });
  };

  const removeRoom = (roomNumber: string) => {
    setRooms(rooms.filter(room => room.roomNumber !== roomNumber));
  };

  const addRoomType = () => {
    if (!newRoomType.name || !newRoomType.displayName) {
      toast({
        title: "Error",
        description: "Both room type ID and display name are required",
        variant: "destructive",
      });
      return;
    }

    if (customRoomTypes.find(type => type.name === newRoomType.name)) {
      toast({
        title: "Error",
        description: "Room type name already exists",
        variant: "destructive",
      });
      return;
    }

    setCustomRoomTypes([...customRoomTypes, newRoomType]);
    setNewRoomType({ name: "", displayName: "" });
  };

  const removeRoomType = (typeName: string) => {
    // Don't allow removing the last room type
    if (customRoomTypes.length <= 1) {
      toast({
        title: "Error",
        description: "At least one room type is required",
        variant: "destructive",
      });
      return;
    }

    // Check if any rooms are using this type
    if (rooms.some(room => room.roomType === typeName)) {
      toast({
        title: "Error",
        description: "Cannot delete room type that is being used by rooms",
        variant: "destructive",
      });
      return;
    }

    setCustomRoomTypes(customRoomTypes.filter(type => type.name !== typeName));
    
    // Update newRoom roomType if it was using this type
    if (newRoom.roomType === typeName) {
      setNewRoom({...newRoom, roomType: customRoomTypes.filter(type => type.name !== typeName)[0]?.name || ""});
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (rooms.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one room",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create lodge settings
      await apiRequest("POST", "/api/lodge-settings", {
        ...lodgeDetails,
        ...preferences,
        isSetupComplete: true
      });

      // Create rooms
      for (const room of rooms) {
        await apiRequest("POST", "/api/rooms", {
          roomNumber: room.roomNumber,
          roomType: room.roomType,
          basePrice: room.basePrice
        });
      }

      toast({
        title: "Setup Complete",
        description: "Lodge setup completed successfully!",
      });

      setLocation("/dashboard");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete setup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Card className="overflow-hidden">
          {/* Progress Steps */}
          <div className="bg-primary text-white p-6">
            <h1 className="text-2xl font-semibold mb-4 font-telugu">
              <BilingualText english="Lodge Setup" telugu="లాడ్జ్ సెటప్" />
            </h1>
            <div className="flex space-x-4">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`flex items-center space-x-2 px-3 py-1 rounded ${
                    currentStep === step 
                      ? "bg-white bg-opacity-20" 
                      : currentStep > step 
                        ? "bg-white bg-opacity-10" 
                        : "opacity-50"
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                    currentStep === step || currentStep > step
                      ? "bg-white text-primary"
                      : "border border-white"
                  }`}>
                    {currentStep > step ? <Check size={14} /> : step}
                  </span>
                  <span className="text-sm font-telugu">
                    {step === 1 && <BilingualText english="Lodge Details" telugu="లాడ్జ్ వివరాలు" />}
                    {step === 2 && <BilingualText english="Room Setup" telugu="గది సెటప్" />}
                    {step === 3 && <BilingualText english="Preferences" telugu="ప్రాధాన్యతలు" />}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <CardContent className="p-8">
            {/* Step 1: Lodge Details */}
            {currentStep === 1 && (
              <div>
                <h2 className="text-xl font-semibold mb-6 font-telugu">
                  <BilingualText english="Lodge Information" telugu="లాడ్జ్ సమాచారం" />
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="font-telugu">
                      <BilingualText english="Lodge Name" telugu="లాడ్జ్ పేరు" /> *
                    </Label>
                    <Input
                      value={lodgeDetails.name}
                      onChange={(e) => setLodgeDetails({...lodgeDetails, name: e.target.value})}
                      placeholder="Enter lodge name"
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label className="font-telugu">
                      <BilingualText english="Contact Number" telugu="సంప్రదింపు నంబర్" /> *
                    </Label>
                    <Input
                      value={lodgeDetails.contactNumber}
                      onChange={(e) => setLodgeDetails({...lodgeDetails, contactNumber: e.target.value})}
                      placeholder="+91 XXXXXXXXXX"
                      className="mt-2"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label className="font-telugu">
                      <BilingualText english="Address" telugu="చిరునామా" /> *
                    </Label>
                    <Textarea
                      value={lodgeDetails.address}
                      onChange={(e) => setLodgeDetails({...lodgeDetails, address: e.target.value})}
                      placeholder="Enter full address"
                      className="mt-2"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label className="font-telugu">
                      <BilingualText english="Default Discount Rate" telugu="డిఫాల్ట్ తగ్గింపు రేటు" /> %
                    </Label>
                    <Input
                      type="number"
                      value={lodgeDetails.discountRate}
                      onChange={(e) => setLodgeDetails({...lodgeDetails, discountRate: e.target.value})}
                      placeholder="0"
                      min="0"
                      max="100"
                      step="0.01"
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label className="font-telugu">
                      <BilingualText english="Currency" telugu="కరెన్సీ" />
                    </Label>
                    <Select value={lodgeDetails.currency} onValueChange={(value) => setLodgeDetails({...lodgeDetails, currency: value})}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-end mt-8">
                  <Button onClick={handleNext} className="font-telugu">
                    <BilingualText english="Next" telugu="తదుపరి" />
                    <ArrowRight className="ml-2" size={16} />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Room Setup */}
            {currentStep === 2 && (
              <div>
                <h2 className="text-xl font-semibold mb-6 font-telugu">
                  <BilingualText english="Room Configuration" telugu="గది కాన్ఫిగరేషన్" />
                </h2>

                {/* Custom Room Types Management */}
                <div className="mb-8">
                  <h3 className="text-lg font-medium mb-4 font-telugu">
                    <BilingualText english="Manage Room Types" telugu="గది రకాలను నిర్వహించండి" />
                  </h3>
                  
                  {/* Add New Room Type */}
                  <div className="bg-gray-50 border rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="font-telugu">
                          <BilingualText english="Type ID (lowercase)" telugu="రకం ID (చిన్న అక్షరాలు)" />
                        </Label>
                        <Input
                          value={newRoomType.name}
                          onChange={(e) => setNewRoomType({...newRoomType, name: e.target.value.toLowerCase().replace(/\s+/g, '')})}
                          placeholder="ac_deluxe"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="font-telugu">
                          <BilingualText english="Display Name" telugu="ప్రదర్శన పేరు" />
                        </Label>
                        <Input
                          value={newRoomType.displayName}
                          onChange={(e) => setNewRoomType({...newRoomType, displayName: e.target.value})}
                          placeholder="AC Deluxe"
                          className="mt-1"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button onClick={addRoomType} size="sm" className="w-full font-telugu">
                          <Plus size={16} className="mr-2" />
                          <BilingualText english="Add Type" telugu="రకం జోడించు" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Current Room Types */}
                  {customRoomTypes.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="font-telugu">
                              <BilingualText english="Type ID" telugu="రకం ID" />
                            </TableHead>
                            <TableHead className="font-telugu">
                              <BilingualText english="Display Name" telugu="ప్రదర్శన పేరు" />
                            </TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {customRoomTypes.map((type) => (
                            <TableRow key={type.name}>
                              <TableCell className="font-mono">{type.name}</TableCell>
                              <TableCell>{type.displayName}</TableCell>
                              <TableCell>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => removeRoomType(type.name)}
                                  className="text-red-600 hover:text-red-700"
                                  disabled={customRoomTypes.length <= 1}
                                >
                                  <Trash size={16} />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
                
                {/* Add Room Form */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="font-telugu">
                        <BilingualText english="Room Number" telugu="గది సంఖ్య" />
                      </Label>
                      <Input
                        value={newRoom.roomNumber}
                        onChange={(e) => setNewRoom({...newRoom, roomNumber: e.target.value})}
                        placeholder="101"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="font-telugu">
                        <BilingualText english="Type" telugu="రకం" />
                      </Label>
                      <Select value={newRoom.roomType} onValueChange={(value) => setNewRoom({...newRoom, roomType: value})}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {customRoomTypes.map((type) => (
                            <SelectItem key={type.name} value={type.name}>
                              {type.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="font-telugu">
                        <BilingualText english="Base Price" telugu="ప్రాథమిక ధర" />
                      </Label>
                      <Input
                        type="number"
                        value={newRoom.basePrice}
                        onChange={(e) => setNewRoom({...newRoom, basePrice: e.target.value})}
                        placeholder="1500"
                        className="mt-1"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={addRoom} className="w-full font-telugu">
                        <Plus size={16} className="mr-2" />
                        <BilingualText english="Add" telugu="జోడించు" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Rooms Table */}
                {rooms.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-telugu">
                          <BilingualText english="Room Number" telugu="గది సంఖ్య" />
                        </TableHead>
                        <TableHead className="font-telugu">
                          <BilingualText english="Type" telugu="రకం" />
                        </TableHead>
                        <TableHead className="font-telugu">
                          <BilingualText english="Base Price" telugu="ప్రాథమిక ధర" />
                        </TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rooms.map((room) => (
                        <TableRow key={room.roomNumber}>
                          <TableCell>{room.roomNumber}</TableCell>
                          <TableCell>
                            {(() => {
                              const roomType = customRoomTypes.find(type => type.name === room.roomType);
                              return roomType ? roomType.displayName : room.roomType;
                            })()}
                          </TableCell>
                          <TableCell>₹{room.basePrice}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeRoom(room.roomNumber)}
                              className="text-error hover:text-red-700"
                            >
                              <Trash size={16} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                
                <div className="flex justify-between mt-8">
                  <Button variant="outline" onClick={handlePrevious} className="font-telugu">
                    <ArrowLeft className="mr-2" size={16} />
                    <BilingualText english="Previous" telugu="మునుపటి" />
                  </Button>
                  <Button onClick={handleNext} className="font-telugu">
                    <BilingualText english="Next" telugu="తదుపరి" />
                    <ArrowRight className="ml-2" size={16} />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Preferences */}
            {currentStep === 3 && (
              <div>
                <h2 className="text-xl font-semibold mb-6 font-telugu">
                  <BilingualText english="SMS & Preferences" telugu="SMS & ప్రాధాన్యతలు" />
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <Label className="font-telugu">
                      <BilingualText english="SMS Template for Bills" telugu="బిల్లుల కోసం SMS టెంప్లేట్" />
                    </Label>
                    <Textarea
                      value={preferences.smsTemplate}
                      onChange={(e) => setPreferences({...preferences, smsTemplate: e.target.value})}
                      className="mt-2"
                      rows={4}
                    />
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-2 font-telugu">
                      <BilingualText english="24-Hour Based Pricing" telugu="24 గంటల ఆధారిత ధర" />
                    </h4>
                    <p className="text-sm text-blue-700 font-telugu">
                      <BilingualText 
                        english="This system uses 24-hour periods for billing. Each day (or part of a day) is charged at the full room rate." 
                        telugu="ఈ సిస్టం బిల్లింగ్ కోసం 24 గంటల కాలాలను ఉపయోగిస్తుంది. ప్రతి రోజు (లేదా రోజులో భాగం) పూర్తి గది ధరతో వసూలు చేయబడుతుంది." 
                      />
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-between mt-8">
                  <Button variant="outline" onClick={handlePrevious} className="font-telugu">
                    <ArrowLeft className="mr-2" size={16} />
                    <BilingualText english="Previous" telugu="మునుపటి" />
                  </Button>
                  <Button onClick={handleComplete} disabled={isLoading} className="bg-success hover:bg-green-700 font-telugu">
                    {isLoading ? "Setting up..." : (
                      <>
                        <BilingualText english="Complete Setup" telugu="సెటప్ పూర్తి చేయండి" />
                        <Check className="ml-2" size={16} />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
