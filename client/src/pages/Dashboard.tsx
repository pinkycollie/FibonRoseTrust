import { TrustScoreOverview } from "@/components/dashboard/TrustScoreOverview";
import { VerificationModules } from "@/components/dashboard/VerificationModules";
import { DataTransparency } from "@/components/dashboard/DataTransparency";
import { VerificationHistory } from "@/components/dashboard/VerificationHistory";
import { NegraRosaSecurity } from "@/components/security/NegraRosaSecurity";
import { WhySubmission } from "@/components/security/WhySubmission";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

export default function Dashboard() {
  const [userId] = useState(1); // Mock user ID for demonstration
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your digital identity and trust score
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-2">
          <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
            <span className="h-2 w-2 bg-green-500 rounded-full"></span>
            <span className="text-xs font-medium text-green-700 dark:text-green-300">Verified</span>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-none lg:flex">
          <TabsTrigger value="overview" className="text-xs sm:text-sm flex items-center justify-center lg:justify-start">
            <span className="material-icons text-sm mr-1 lg:mr-2">dashboard</span>
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="text-xs sm:text-sm flex items-center justify-center lg:justify-start">
            <span className="material-icons text-sm mr-1 lg:mr-2">security</span>
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="why" className="text-xs sm:text-sm flex items-center justify-center lg:justify-start">
            <span className="material-icons text-sm mr-1 lg:mr-2">question_answer</span>
            <span className="hidden sm:inline">WHY</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6 space-y-6">
          <TrustScoreOverview />
          <VerificationModules />
          <DataTransparency />
          <VerificationHistory />
        </TabsContent>
        
        <TabsContent value="security" className="mt-6">
          <NegraRosaSecurity userId={userId} />
        </TabsContent>
        
        <TabsContent value="why" className="mt-6">
          <WhySubmission userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
