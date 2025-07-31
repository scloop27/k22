import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BilingualText } from "@/components/bilingual-text";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Room } from "@shared/schema";
import { Plus, Edit, Wrench, CheckCircle, Trash2 } from "lucide-react";

interface RoomManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rooms: Room[];
}

export function RoomManagementModal({ open, onOpenChange, rooms }: RoomManagementModalProps) {
  const [activeTab, setActiveTab] = useState("add");
  const [newRoom, setNewRoom] = useState({
    roomNumber: "",
    roomType: "",
    basePrice: "",
  });
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [customRoomType, setCustomRoomType] = useState("");
  
  const defaultRoomTypes = [
    { value: "single", label: "Single" },
    { value: "double", label: "Double" },
    { value: "suite", label: "Suite" },
    { value: "deluxe", label: "Deluxe" },
    { value: "family", label: "Family" },
    { value: "premium", label: "Premium" },
  ];

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addRoomMutation = useMutation({
    mutationFn: async (roomData: typeof newRoom) => {
      const response = await apiRequest("POST", "/api/rooms", {
        ...roomData,
        basePrice: parseFloat(roomData.basePrice),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/dashboard"] });
      setNewRoom({ roomNumber: "", roomType: "", basePrice: "" });
      setCustomRoomType("");
      toast({
        title: "Success",
        description: "Room added successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add room. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateRoomMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Room> }) => {
      const response = await apiRequest("PUT", `/api/rooms/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/dashboard"] });
      setEditingRoom(null);
      toast({
        title: "Success",
        description: "Room updated successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update room. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteRoomMutation = useMutation({
    mutationFn: async (roomId: string) => {
      const response = await apiRequest("DELETE", `/api/rooms/${roomId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/dashboard"] });
      toast({
        title: "Success",
        description: "Room deleted successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete room. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoom.roomNumber || !newRoom.roomType || !newRoom.basePrice) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const roomType = newRoom.roomType === "custom" ? customRoomType : newRoom.roomType;
    addRoomMutation.mutate({ ...newRoom, roomType });
  };

  const handleStatusChange = (room: Room, newStatus: string) => {
    updateRoomMutation.mutate({
      id: room.id,
      data: { status: newStatus },
    });
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setActiveTab("edit");
  };

  const handleUpdateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;

    updateRoomMutation.mutate({
      id: editingRoom.id,
      data: {
        roomNumber: editingRoom.roomNumber,
        roomType: editingRoom.roomType,
        basePrice: editingRoom.basePrice,
      },
    });
  };

  const handleDeleteRoom = (roomId: string) => {
    if (confirm("Are you sure you want to delete this room? This action cannot be undone.")) {
      deleteRoomMutation.mutate(roomId);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge className="bg-success text-white">Available</Badge>;
      case "occupied":
        return <Badge className="bg-primary text-white">Occupied</Badge>;
      case "maintenance":
        return <Badge className="bg-warning text-white">Maintenance</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-telugu">
            <BilingualText english="Room Management" telugu="గది నిర్వహణ" />
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="add" className="font-telugu">
              <Plus className="w-4 h-4 mr-2" />
              <BilingualText english="Add Room" telugu="గది జోడించు" />
            </TabsTrigger>
            <TabsTrigger value="manage" className="font-telugu">
              <Edit className="w-4 h-4 mr-2" />
              <BilingualText english="Manage Rooms" telugu="గదుల నిర్వహణ" />
            </TabsTrigger>
            <TabsTrigger value="edit" className="font-telugu" disabled={!editingRoom}>
              <Edit className="w-4 h-4 mr-2" />
              <BilingualText english="Edit Room" telugu="గది సవరించు" />
            </TabsTrigger>
          </TabsList>

          {/* Add Room Tab */}
          <TabsContent value="add" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-telugu">
                  <BilingualText english="Add New Room" telugu="కొత్త గది జోడించు" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddRoom} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="font-telugu">
                        <BilingualText english="Room Number" telugu="గది నంబర్" /> *
                      </Label>
                      <Input
                        value={newRoom.roomNumber}
                        onChange={(e) => setNewRoom({...newRoom, roomNumber: e.target.value})}
                        placeholder="101, 102, etc."
                        required
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label className="font-telugu">
                        <BilingualText english="Room Type" telugu="గది రకం" /> *
                      </Label>
                      <Select value={newRoom.roomType} onValueChange={(value) => setNewRoom({...newRoom, roomType: value})}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select room type" />
                        </SelectTrigger>
                        <SelectContent>
                          {defaultRoomTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">Custom Type</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {newRoom.roomType === "custom" && (
                    <div>
                      <Label className="font-telugu">
                        <BilingualText english="Custom Room Type" telugu="అనుకూల గది రకం" /> *
                      </Label>
                      <Input
                        value={customRoomType}
                        onChange={(e) => setCustomRoomType(e.target.value)}
                        placeholder="Enter custom room type"
                        required
                        className="mt-1"
                      />
                    </div>
                  )}

                  <div>
                    <Label className="font-telugu">
                      <BilingualText english="Base Price (₹)" telugu="ప్రాథమిక ధర (₹)" /> *
                    </Label>
                    <Input
                      type="number"
                      value={newRoom.basePrice}
                      onChange={(e) => setNewRoom({...newRoom, basePrice: e.target.value})}
                      placeholder="1000"
                      required
                      min="0"
                      step="0.01"
                      className="mt-1"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={addRoomMutation.isPending}
                    className="w-full font-telugu"
                  >
                    {addRoomMutation.isPending ? "Adding..." : (
                      <BilingualText english="Add Room" telugu="గది జోడించు" />
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manage Rooms Tab */}
          <TabsContent value="manage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-telugu">
                  <BilingualText english="All Rooms" telugu="అన్ని గదులు" />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-telugu">
                        <BilingualText english="Room Number" telugu="గది నంబర్" />
                      </TableHead>
                      <TableHead className="font-telugu">
                        <BilingualText english="Type" telugu="రకం" />
                      </TableHead>
                      <TableHead className="font-telugu">
                        <BilingualText english="Price" telugu="ధర" />
                      </TableHead>
                      <TableHead className="font-telugu">
                        <BilingualText english="Status" telugu="స్థితి" />
                      </TableHead>
                      <TableHead className="font-telugu">
                        <BilingualText english="Actions" telugu="చర్యలు" />
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rooms?.map((room) => (
                      <TableRow key={room.id}>
                        <TableCell className="font-medium">{room.roomNumber}</TableCell>
                        <TableCell className="capitalize">{room.roomType}</TableCell>
                        <TableCell>₹{parseFloat(room.basePrice).toLocaleString()}</TableCell>
                        <TableCell>{getStatusBadge(room.status)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditRoom(room)}
                              className="p-2"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            
                            {room.status === "available" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(room, "maintenance")}
                                className="p-2 text-warning hover:bg-warning hover:text-white"
                              >
                                <Wrench className="w-3 h-3" />
                              </Button>
                            )}
                            
                            {room.status === "maintenance" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(room, "available")}
                                className="p-2 text-success hover:bg-success hover:text-white"
                              >
                                <CheckCircle className="w-3 h-3" />
                              </Button>
                            )}
                            
                            {room.status !== "occupied" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteRoom(room.id)}
                                className="p-2 text-destructive hover:bg-destructive hover:text-white"
                              >
                                <Trash2 className="w-3 h-3" />
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

          {/* Edit Room Tab */}
          <TabsContent value="edit" className="space-y-6">
            {editingRoom && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-telugu">
                    <BilingualText english="Edit Room" telugu="గది సవరించు" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateRoom} className="space-y-4">
                    <div>
                      <Label className="font-telugu">
                        <BilingualText english="Room Number" telugu="గది నంబర్" /> *
                      </Label>
                      <Input
                        value={editingRoom.roomNumber}
                        onChange={(e) => setEditingRoom({...editingRoom, roomNumber: e.target.value})}
                        required
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label className="font-telugu">
                        <BilingualText english="Room Type" telugu="గది రకం" /> *
                      </Label>
                      <Input
                        value={editingRoom.roomType}
                        onChange={(e) => setEditingRoom({...editingRoom, roomType: e.target.value})}
                        required
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="font-telugu">
                        <BilingualText english="Base Price (₹)" telugu="ప్రాథమిక ధర (₹)" /> *
                      </Label>
                      <Input
                        type="number"
                        value={editingRoom.basePrice}
                        onChange={(e) => setEditingRoom({...editingRoom, basePrice: e.target.value})}
                        required
                        min="0"
                        step="0.01"
                        className="mt-1"
                      />
                    </div>

                    <div className="flex space-x-4">
                      <Button 
                        type="submit" 
                        disabled={updateRoomMutation.isPending}
                        className="font-telugu"
                      >
                        {updateRoomMutation.isPending ? "Updating..." : (
                          <BilingualText english="Update Room" telugu="గది అప్డేట్ చేయండి" />
                        )}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => {
                          setEditingRoom(null);
                          setActiveTab("manage");
                        }}
                        className="font-telugu"
                      >
                        <BilingualText english="Cancel" telugu="రద్దు చేయండి" />
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}