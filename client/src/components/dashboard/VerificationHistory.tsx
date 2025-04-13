import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Verification, VerificationType } from "@shared/schema";
import { format } from "date-fns";

export function VerificationHistory() {
  const { data: verifications, isLoading: isLoadingVerifications } = useQuery<Verification[]>({
    queryKey: ['/api/user/1/verifications'],
  });

  const { data: verificationTypes, isLoading: isLoadingTypes } = useQuery<VerificationType[]>({
    queryKey: ['/api/verification-types'],
  });

  const isLoading = isLoadingVerifications || isLoadingTypes;

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-6 w-64 mb-2" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent className="border-t border-gray-200 dark:border-gray-700 p-0">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {[1, 2, 3].map((i) => (
              <div key={i} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="ml-3 h-5 w-40" />
                  </div>
                  <Skeleton className="h-5 w-20" />
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-40 mt-2 sm:mt-0" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 dark:bg-neutral-900 border-t border-gray-200 dark:border-gray-700">
          <Skeleton className="h-5 w-48" />
        </CardFooter>
      </Card>
    );
  }

  if (!verifications || !verificationTypes || verifications.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <h2 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">Recent Verification Activity</h2>
          <CardDescription>Your recent identity verification history.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-4">No verification history available</p>
        </CardContent>
      </Card>
    );
  }

  // Create a map of verification types for easy lookup
  const typeMap = verificationTypes.reduce((acc, type) => {
    acc[type.id] = type;
    return acc;
  }, {} as Record<number, VerificationType>);

  // Sort verifications by date (newest first)
  const sortedVerifications = [...verifications]
    .sort((a, b) => new Date(b.verifiedAt || b.createdAt).getTime() - new Date(a.verifiedAt || a.createdAt).getTime())
    .slice(0, 3); // Show only the latest 3

  return (
    <Card className="w-full">
      <CardHeader>
        <h2 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">Recent Verification Activity</h2>
        <CardDescription>Your recent identity verification history.</CardDescription>
      </CardHeader>
      <CardContent className="border-t border-gray-200 dark:border-gray-700 p-0">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {sortedVerifications.map((verification) => {
            const type = typeMap[verification.typeId];
            const date = verification.verifiedAt || verification.createdAt;
            const formattedDate = format(new Date(date), 'MMMM dd, yyyy');
            
            return (
              <div key={verification.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className={`material-icons ${verification.status === 'VERIFIED' ? 'text-green-500' : verification.status === 'PENDING' ? 'text-yellow-500' : 'text-red-500'}`}>
                        {verification.status === 'VERIFIED' ? 'check_circle' : verification.status === 'PENDING' ? 'pending' : 'cancel'}
                      </span>
                    </div>
                    <p className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-100">{type.displayName}</p>
                  </div>
                  <div className="ml-2 flex-shrink-0 flex">
                    <Badge 
                      variant="outline"
                      className={
                        verification.status === 'VERIFIED' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                          : verification.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                            : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                      }
                    >
                      {verification.status === 'VERIFIED' ? 'Successful' : verification.status === 'PENDING' ? 'Pending' : 'Rejected'}
                    </Badge>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <span className="material-icons text-sm mr-1">{type.icon}</span>
                      {verification.verifiedBy || 'N/A'}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0">
                    <span className="material-icons text-sm mr-1">access_time</span>
                    <p>
                      {verification.status === 'VERIFIED' ? 'Completed on ' : verification.status === 'PENDING' ? 'Initiated on ' : 'Rejected on '}
                      <time dateTime={date.toString()}>{formattedDate}</time>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 dark:bg-neutral-900 px-4 py-4 sm:px-6">
        <div className="text-sm">
          <a href="/verification-history" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 flex items-center">
            View all verification history
            <span className="material-icons text-sm ml-1">arrow_forward</span>
          </a>
        </div>
      </CardFooter>
    </Card>
  );
}
