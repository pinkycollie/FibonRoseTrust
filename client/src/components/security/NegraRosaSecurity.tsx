import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, AlertTriangle, CheckCircle, Info, Lock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';

interface NegraRosaSecurityProps {
  userId: number;
  trustScore?: number;
  verificationCount?: number;
}

/**
 * NegraRosa Security component that displays the security framework interface
 * including WHY verification system, risk assessment, and E&O claims
 */
export function NegraRosaSecurity({ 
  userId,
  trustScore = 0,
  verificationCount = 0 
}: NegraRosaSecurityProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("why");
  const [loading, setLoading] = useState(false);
  const [securityLevel, setSecurityLevel] = useState<string>("standard");
  
  // Color scheme for security levels
  const securityLevelColors = {
    low: "bg-red-500",
    standard: "bg-yellow-500",
    enhanced: "bg-green-500",
    maximum: "bg-indigo-500"
  };
  
  // Perform a WHY security verification
  const performWHYVerification = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/security/why-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          verificationType: 'identity'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Verification Completed",
          description: "WHY security verification has been processed successfully.",
          variant: "default",
        });
        
        // Update security level based on the response
        if (data.securityLevel) {
          setSecurityLevel(data.securityLevel);
        }
      } else {
        toast({
          title: "Verification Failed",
          description: data.message || "Could not complete WHY verification.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during WHY verification process.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate security progress percentage
  const getSecurityProgress = () => {
    switch (securityLevel) {
      case "low": return 25;
      case "standard": return 50;
      case "enhanced": return 75;
      case "maximum": return 100;
      default: return 50;
    }
  };
  
  // Request a risk assessment
  const requestRiskAssessment = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/security/risk-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          transactionType: "verification",
          metadata: {
            trustScore,
            verificationCount
          }
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Risk Assessment Complete",
          description: "Your risk assessment has been processed.",
          variant: "default",
        });
      } else {
        toast({
          title: "Assessment Failed",
          description: data.message || "Could not complete risk assessment.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not complete risk assessment.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // File an E&O claim
  const fileEOClaim = async () => {
    // This would open a form modal in a real implementation
    toast({
      title: "E&O Claims",
      description: "The E&O claim form will be available in the next update.",
      variant: "default",
    });
  };
  
  return (
    <Card className="w-full shadow-lg border-t-4 border-indigo-500">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-indigo-500" />
          <CardTitle className="text-xl font-bold text-gray-900">
            NegraRosa Security Framework
          </CardTitle>
        </div>
        <CardDescription>
          Advanced security verification and risk assessment powered by the WHY system
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <span className="material-icons text-primary-500 mr-1">security</span>
              <span className="text-sm font-medium">
                Security Level: <span className="font-bold capitalize">{securityLevel}</span>
              </span>
            </div>
            <div className="flex items-center">
              <span className="material-icons text-primary-500 text-xs mr-1">trending_up</span>
              <span className="text-xs text-gray-500">
                {getSecurityProgress()}% complete
              </span>
            </div>
          </div>
          <Progress 
            value={getSecurityProgress()} 
            className={`h-3 ${securityLevelColors[securityLevel as keyof typeof securityLevelColors] || "bg-gray-500"}`} 
          />
        </div>
        
        <Tabs defaultValue="why" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="why" className="text-sm flex flex-col items-center py-3">
              <span className="material-icons mb-1">vpn_key</span>
              <span>WHY</span>
            </TabsTrigger>
            <TabsTrigger value="risk" className="text-sm flex flex-col items-center py-3">
              <span className="material-icons mb-1">analytics</span>
              <span>Risk</span>
            </TabsTrigger>
            <TabsTrigger value="eo" className="text-sm flex flex-col items-center py-3">
              <span className="material-icons mb-1">gavel</span>
              <span>E&O</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="why">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>WHY Security System</AlertTitle>
              <AlertDescription>
                The WHY system validates your identity using multiple factors and provides a comprehensive security assessment.
              </AlertDescription>
            </Alert>
            
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm">Multi-factor authentication</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm">Biometric verification</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm">Document validation</span>
              </div>
              
              <Button 
                variant="default" 
                className="w-full mt-4"
                onClick={performWHYVerification}
                disabled={loading}
              >
                <span className="material-icons text-base mr-2">
                  {loading ? "pending" : "key"}
                </span>
                {loading ? "Processing..." : "Perform WHY Verification"}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="risk">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Risk Assessment</AlertTitle>
              <AlertDescription>
                Analyze potential risks associated with your transactions and verification status.
              </AlertDescription>
            </Alert>
            
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <h4 className="font-medium text-sm mb-2">Your Current Metrics</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Trust Score:</div>
                <div className="font-bold">{trustScore}</div>
                <div>Verifications:</div>
                <div className="font-bold">{verificationCount}</div>
                <div>Security Level:</div>
                <div className="font-bold capitalize">{securityLevel}</div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={requestRiskAssessment}
                disabled={loading}
              >
                <span className="material-icons text-base mr-2">
                  {loading ? "pending" : "assessment"}
                </span>
                {loading ? "Processing..." : "Request Risk Assessment"}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="eo">
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertTitle>E&O Claims</AlertTitle>
              <AlertDescription>
                For businesses and financial institutions using our verification system.
              </AlertDescription>
            </Alert>
            
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <p className="text-sm mb-4">
                Our Errors & Omissions (E&O) coverage provides protection for companies using our verification system for transactions and approvals.
              </p>
              
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={fileEOClaim}
              >
                <span className="material-icons text-base mr-2">
                  gavel
                </span>
                File E&O Claim
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex flex-col items-start pt-0">
        <p className="text-xs text-gray-500 mt-2">
          NegraRosa Security Framework © {new Date().getFullYear()} • Powered by FibonRoseTrust
        </p>
      </CardFooter>
    </Card>
  );
}