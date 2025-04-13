import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Verification, VerificationType } from "@shared/schema";
import { format } from "date-fns";

export default function VerificationHistoryPage() {
  const [filter, setFilter] = useState<string | null>(null);

  const { data: verifications, isLoading: isLoadingVerifications } = useQuery<Verification[]>({
    queryKey: ['/api/user/1/verifications'],
  });

  const { data: verificationTypes, isLoading: isLoadingTypes } = useQuery<VerificationType[]>({
    queryKey: ['/api/verification-types'],
  });

  const isLoading = isLoadingVerifications || isLoadingTypes;

  if (isLoading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Verification History</h1>
          <div className="mt-6">
            <p>Loading verification history...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!verifications || !verificationTypes) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Verification History</h1>
          <div className="mt-6">
            <p>No verification history available</p>
          </div>
        </div>
      </div>
    );
  }

  // Create a map of verification types for easy lookup
  const typeMap = verificationTypes.reduce((acc, type) => {
    acc[type.id] = type;
    return acc;
  }, {} as Record<number, VerificationType>);

  // Sort verifications by date (newest first)
  const sortedVerifications = [...verifications]
    .sort((a, b) => new Date(b.verifiedAt || b.createdAt).getTime() - new Date(a.verifiedAt || a.createdAt).getTime());

  // Filter verifications based on selected filter
  const filteredVerifications = filter 
    ? sortedVerifications.filter(v => {
        if (filter === 'verified') return v.status === 'VERIFIED';
        if (filter === 'pending') return v.status === 'PENDING';
        if (filter === 'rejected') return v.status === 'REJECTED';
        return true;
      })
    : sortedVerifications;

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Verification History</h1>
          <div className="w-48">
            <Select value={filter || ''} onValueChange={setFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="mt-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Activity Log</h2>
              <CardDescription>Comprehensive history of all your identity verification activities.</CardDescription>
            </CardHeader>
            <CardContent className="border-t border-gray-200 dark:border-gray-700 p-0">
              {filteredVerifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No verification activities match your filter.
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredVerifications.map((verification) => {
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
                        {verification.data && Object.keys(verification.data).length > 0 && (
                          <div className="mt-2">
                            <div className="rounded-md bg-gray-50 dark:bg-gray-800 p-2 text-xs font-mono">
                              <pre className="overflow-x-auto whitespace-pre-wrap">
                                {JSON.stringify(verification.data, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
