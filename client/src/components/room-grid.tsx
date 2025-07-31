import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BilingualText } from "@/components/bilingual-text";
import type { Room } from "@shared/schema";
import { Bed, User, Gavel } from "lucide-react";

interface RoomGridProps {
  rooms: Room[];
}

export function RoomGrid({ rooms }: RoomGridProps) {
  const [statusFilter, setStatusFilter] = useState("all");

  // Filter rooms based on selected filters
  const filteredRooms = rooms.filter(room => {
    const statusMatch = statusFilter === "all" || room.status === statusFilter;
    return statusMatch;
  });

  const getRoomIcon = (status: string) => {
    switch (status) {
      case "available":
        return <Bed size={20} />;
      case "occupied":
        return <User size={20} />;
      case "maintenance":
        return <Gavel size={20} />;
      default:
        return <Bed size={20} />;
    }
  };

  const getRoomColor = (status: string) => {
    switch (status) {
      case "available":
        return "border-success text-success bg-green-50";
      case "occupied":
        return "border-error text-error bg-red-50";
      case "maintenance":
        return "border-warning text-warning bg-yellow-50";
      default:
        return "border-gray-300 text-gray-600 bg-gray-50";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return (
          <Badge className="bg-success text-white font-telugu">
            <BilingualText english="Available" telugu="లభ్యమైనది" />
          </Badge>
        );
      case "occupied":
        return (
          <Badge className="bg-error text-white font-telugu">
            <BilingualText english="Occupied" telugu="ఆక్రమించినది" />
          </Badge>
        );
      case "maintenance":
        return (
          <Badge className="bg-warning text-white font-telugu">
            <BilingualText english="Maintenance" telugu="మెయింటెనెన్స్" />
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-500 text-white">
            Unknown
          </Badge>
        );
    }
  };

  const getRoomTypeText = (roomType: string) => {
    // Capitalize room type for display
    const capitalizedType = roomType.charAt(0).toUpperCase() + roomType.slice(1);
    return capitalizedType;
  };

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-telugu">
                <BilingualText english="All Status" telugu="అన్ని స్థితులు" />
              </SelectItem>
              <SelectItem value="available" className="font-telugu">
                <BilingualText english="Available" telugu="లభ్యమైనది" />
              </SelectItem>
              <SelectItem value="occupied" className="font-telugu">
                <BilingualText english="Occupied" telugu="ఆక్రమించినది" />
              </SelectItem>
              <SelectItem value="maintenance" className="font-telugu">
                <BilingualText english="Maintenance" telugu="మెయింటెనెన్స్" />
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filteredRooms.map((room) => (
          <Card 
            key={room.id} 
            className={`border-2 hover:shadow-md transition-all duration-200 cursor-pointer ${getRoomColor(room.status)}`}
          >
            <CardContent className="p-4">
              <div className="text-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                  room.status === "available" ? "bg-success text-white" :
                  room.status === "occupied" ? "bg-error text-white" :
                  room.status === "maintenance" ? "bg-warning text-white" :
                  "bg-gray-500 text-white"
                }`}>
                  {getRoomIcon(room.status)}
                </div>
                
                <h3 className="font-semibold text-lg">{room.roomNumber}</h3>
                
                <p className="text-sm text-gray-600 font-telugu mb-2">
                  {getRoomTypeText(room.roomType)}
                </p>
                
                {getStatusBadge(room.status)}
                
                {room.status === "available" && (
                  <p className="text-sm text-gray-600 mt-2">
                    ₹{parseFloat(room.basePrice).toLocaleString()}/night
                  </p>
                )}
                
                {room.status === "occupied" && (
                  <p className="text-xs text-gray-500 mt-1">
                    Guest Checked In
                  </p>
                )}
                
                {room.status === "maintenance" && (
                  <p className="text-xs text-gray-500 mt-1">
                    Under Repair
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredRooms.length === 0 && (
        <div className="text-center py-12">
          <Bed className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2 font-telugu">
            <BilingualText english="No rooms found" telugu="గదులు కనుగొనబడలేదు" />
          </h3>
          <p className="text-gray-600 font-telugu">
            <BilingualText 
              english="Try adjusting your filters or add rooms in settings" 
              telugu="మీ ఫిల్టర్‌లను సర్దుబాటు చేయండి లేదా సెట్టింగ్‌లలో గదులను జోడించండి" 
            />
          </p>
        </div>
      )}

      {/* Room Status Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="font-telugu">
            <BilingualText english="Room Status Legend" telugu="గది స్థితి లెజెండ్" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-success rounded-full"></div>
              <span className="text-sm font-telugu">
                <BilingualText english="Available" telugu="లభ్యమైనది" />
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-error rounded-full"></div>
              <span className="text-sm font-telugu">
                <BilingualText english="Occupied" telugu="ఆక్రమించినది" />
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-warning rounded-full"></div>
              <span className="text-sm font-telugu">
                <BilingualText english="Maintenance" telugu="మెయింటెనెన్స్" />
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
