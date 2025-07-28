import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { BilingualText } from "@/components/bilingual-text";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Hotel } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const loginResponse = await apiRequest("POST", "/api/auth/login", { username, password });
      const loginData = await loginResponse.json();
      
      console.log("Login successful:", loginData);
      
      // Check if lodge settings exist to determine if onboarding is needed
      const settingsResponse = await apiRequest("GET", "/api/lodge-settings");
      const settings = await settingsResponse.json();
      
      if (!settings || !settings.isSetupComplete) {
        setLocation("/onboarding");
      } else {
        setLocation("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center mb-8">
            <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Hotel className="text-2xl" size={32} />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 font-telugu">
              Lodge Management Platform
            </h1>
            <p className="text-sm text-gray-600 mt-2">
              <BilingualText english="Lodge Management Platform" telugu="లాడ్జ్ మేనేజ్‌మెంట్ ప్లాట్‌ఫారమ్" />
            </p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <Label className="font-telugu">
                <BilingualText english="Username" telugu="వినియోగదారు పేరు" />
              </Label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                className="mt-2"
              />
            </div>
            
            <div>
              <Label className="font-telugu">
                <BilingualText english="Password" telugu="పాస్‌వర్డ్" />
              </Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="mt-2"
              />
            </div>
            
            <Button type="submit" className="w-full font-telugu" disabled={isLoading}>
              {isLoading ? "Loading..." : <BilingualText english="Login" telugu="లాగిన్" />}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
