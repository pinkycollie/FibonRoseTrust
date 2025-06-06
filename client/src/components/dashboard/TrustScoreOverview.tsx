import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrustScore } from "@shared/schema";

export function TrustScoreOverview() {
  const { data: trustScore, isLoading } = useQuery<TrustScore>({
    queryKey: ['/api/user/1/trust-score'],
  });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="w-full sm:w-1/3 flex flex-col items-center mb-6 sm:mb-0">
              <Skeleton className="h-32 w-32 rounded-full" />
              <Skeleton className="h-4 w-24 mt-3" />
            </div>
            <div className="w-full sm:w-2/3">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 dark:bg-neutral-900 border-t border-gray-200 dark:border-gray-700">
          <Skeleton className="h-5 w-48" />
        </CardFooter>
      </Card>
    );
  }

  if (!trustScore) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <p className="text-center py-8">No trust score data available</p>
        </CardContent>
      </Card>
    );
  }

  const scorePercentage = (trustScore.score / trustScore.maxScore) * 100;

  return (
    <Card className="w-full">
      <CardContent className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">FibonRose Trust Score</h2>
          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 flex items-center gap-1">
            <span className="material-icons text-xs">check_circle</span>
            Verified
          </Badge>
        </div>
        <div className="flex flex-col lg:flex-row justify-between items-center">
          <div className="w-full lg:w-1/3 flex flex-col items-center mb-6 lg:mb-0">
            <div className="relative w-24 h-24 sm:w-32 sm:h-32">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full fibonacci-progress" style={{ "--percentage": scorePercentage } as React.CSSProperties}></div>
              <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <span className="text-2xl sm:text-3xl font-bold text-primary-600 dark:text-primary-400">{trustScore.score}</span>
                  <span className="block text-xs sm:text-sm text-gray-500 dark:text-gray-400">of {trustScore.maxScore}</span>
                </div>
              </div>
            </div>
            <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center">Fibonacci level: {trustScore.level}</p>
          </div>
          <div className="w-full lg:w-2/3 lg:pl-6">
            <div className="space-y-3 sm:space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Identity Verification</span>
                  <span className="text-sm font-medium text-primary-600 dark:text-primary-400">21/21</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">NFT Authentication</span>
                  <span className="text-sm font-medium text-primary-600 dark:text-primary-400">34/55</span>
                </div>
                <Progress value={62} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Positive Transactions</span>
                  <span className="text-sm font-medium text-primary-600 dark:text-primary-400">34/68</span>
                </div>
                <Progress value={50} className="h-2" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your trust score increases non-linearly based on the Fibonacci sequence as you complete more verifications and maintain positive transaction history.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 dark:bg-neutral-900 px-4 py-4 sm:px-6">
        <div className="text-sm">
          <a href="#" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 flex items-center">
            View full trust score details
            <span className="material-icons text-sm ml-1">arrow_forward</span>
          </a>
        </div>
      </CardFooter>
    </Card>
  );
}
