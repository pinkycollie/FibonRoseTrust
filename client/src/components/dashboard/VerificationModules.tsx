import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { VerificationType, Verification } from "@shared/schema";

export function VerificationModules() {
  const { data: verificationTypes, isLoading: isLoadingTypes } = useQuery<VerificationType[]>({
    queryKey: ['/api/verification-types'],
  });

  const { data: userVerifications, isLoading: isLoadingVerifications } = useQuery<Verification[]>({
    queryKey: ['/api/user/1/verifications'],
  });

  if (isLoadingTypes || isLoadingVerifications) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Verification Methods</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center">
                  <Skeleton className="h-12 w-12 rounded-md" />
                  <div className="ml-5 w-0 flex-1">
                    <Skeleton className="h-5 w-36 mb-2" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 dark:bg-neutral-900 px-5 py-3">
                <Skeleton className="h-5 w-16" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!verificationTypes || !userVerifications) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Verification Methods</h2>
        <p className="text-center py-8">No verification methods available</p>
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
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Verification Methods</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {verificationTypes.map((type) => {
          const typeVerifications = verificationsByType[type.id] || [];
          const isVerified = typeVerifications.some(v => v.status === 'VERIFIED');
          
          return (
            <Card key={type.id} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-primary-100 dark:bg-primary-900 rounded-md p-3">
                    <span className="material-icons text-primary-600 dark:text-primary-400">{type.icon}</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{type.displayName}</dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          {isVerified ? 'Verified' : 'Not Verified'}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 dark:bg-neutral-900 px-5 py-3">
                <div className="text-sm">
                  <a href="#" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">Manage</a>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
