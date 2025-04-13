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
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Dashboard</h1>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="mb-6">
            <TabsTrigger value="overview" className="text-sm">
              <span className="material-icons text-sm mr-2">dashboard</span>
              Overview
            </TabsTrigger>
            <TabsTrigger value="security" className="text-sm">
              <span className="material-icons text-sm mr-2">security</span>
              Security & Trust
            </TabsTrigger>
            <TabsTrigger value="why" className="text-sm">
              <span className="material-icons text-sm mr-2">question_answer</span>
              WHY System
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="mt-6">
              <TrustScoreOverview />
            </div>

            <div className="mt-8">
              <VerificationModules />
            </div>

            <div className="mt-8">
              <DataTransparency />
            </div>

            <div className="mt-8 mb-8">
              <VerificationHistory />
            </div>
          </TabsContent>
          
          <TabsContent value="security">
            <div className="mt-6 mb-8">
              <NegraRosaSecurity userId={userId} />
            </div>
          </TabsContent>
          
          <TabsContent value="why">
            <div className="mt-6 mb-8">
              <WhySubmission userId={userId} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
