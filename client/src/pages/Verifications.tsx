import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VerificationType, Verification } from "@shared/schema";

export default function Verifications() {
  const [activeTab, setActiveTab] = useState("all");

  const { data: verificationTypes, isLoading: isLoadingTypes } = useQuery<VerificationType[]>({
    queryKey: ['/api/verification-types'],
  });

  const { data: userVerifications, isLoading: isLoadingVerifications } = useQuery<Verification[]>({
    queryKey: ['/api/user/1/verifications'],
  });

  const isLoading = isLoadingTypes || isLoadingVerifications;

  if (isLoading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Verifications</h1>
          <div className="mt-6">
            <p>Loading verification methods...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!verificationTypes || !userVerifications) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Verifications</h1>
          <div className="mt-6">
            <p>No verification methods available</p>
          </div>
        </div>
      </div>
    );
  }

  // Group verifications by type
  const verificationsByType = userVerifications.reduce((acc, verification) => {
    if (!acc[verification.typeId]) {
      acc[verification.typeId] = [];
    }
    acc[verification.typeId].push(verification);
    return acc;
  }, {} as Record<number, Verification[]>);

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Verifications</h1>
        
        <div className="mt-6">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Methods</TabsTrigger>
              <TabsTrigger value="verified">Verified</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
                {verificationTypes.map((type) => (
                  <VerificationMethodCard
                    key={type.id}
                    type={type}
                    verifications={verificationsByType[type.id] || []}
                  />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="verified">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
                {verificationTypes
                  .filter(type => (verificationsByType[type.id] || []).some(v => v.status === 'VERIFIED'))
                  .map((type) => (
                    <VerificationMethodCard
                      key={type.id}
                      type={type}
                      verifications={verificationsByType[type.id] || []}
                    />
                  ))}
              </div>
            </TabsContent>
            
            <TabsContent value="pending">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
                {verificationTypes
                  .filter(type => (verificationsByType[type.id] || []).some(v => v.status === 'PENDING'))
                  .map((type) => (
                    <VerificationMethodCard
                      key={type.id}
                      type={type}
                      verifications={verificationsByType[type.id] || []}
                    />
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

type VerificationMethodCardProps = {
  type: VerificationType;
  verifications: Verification[];
};

function VerificationMethodCard({ type, verifications }: VerificationMethodCardProps) {
  const latestVerification = verifications.length > 0 
    ? verifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    : null;
  
  const isVerified = verifications.some(v => v.status === 'VERIFIED');
  const isPending = verifications.some(v => v.status === 'PENDING');
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-primary-100 dark:bg-primary-900 rounded-md p-3 mr-4">
            <span className="material-icons text-primary-600 dark:text-primary-400">{type.icon}</span>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">{type.displayName}</h2>
            <CardDescription>{type.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</div>
          <div className="text-sm font-semibold">
            {isVerified ? (
              <span className="text-green-600 dark:text-green-400 flex items-center">
                <span className="material-icons text-sm mr-1">verified</span> Verified
              </span>
            ) : isPending ? (
              <span className="text-yellow-600 dark:text-yellow-400 flex items-center">
                <span className="material-icons text-sm mr-1">pending</span> Pending
              </span>
            ) : (
              <span className="text-gray-600 dark:text-gray-400 flex items-center">
                <span className="material-icons text-sm mr-1">cancel</span> Not Verified
              </span>
            )}
          </div>
        </div>
        
        {latestVerification && (
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            <div className="flex items-center">
              <span className="material-icons text-xs mr-1">update</span>
              <span>Last updated: {new Date(latestVerification.createdAt).toLocaleDateString()}</span>
            </div>
            {latestVerification.verifiedBy && (
              <div className="flex items-center mt-1">
                <span className="material-icons text-xs mr-1">business</span>
                <span>Verified by: {latestVerification.verifiedBy}</span>
              </div>
            )}
          </div>
        )}
        
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-4">
          {type.name === 'biometric' && (
            <p>Biometric verification provides the highest level of security by using unique physical characteristics.</p>
          )}
          {type.name === 'nft' && (
            <p>NFT authentication uses blockchain technology to verify your digital identity credentials.</p>
          )}
          {type.name === 'government_id' && (
            <p>Government ID verification uses official identification documents to confirm your identity.</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end border-t border-gray-200 dark:border-gray-700 pt-4">
        {!isVerified && (
          <Button>
            {isPending ? 'Complete Verification' : 'Start Verification'}
          </Button>
        )}
        {isVerified && (
          <Button variant="outline">View Details</Button>
        )}
      </CardFooter>
    </Card>
  );
}
