import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, Circle, Clock, AlertCircle, 
  FileText, Shield, Award, User, Briefcase, 
  ArrowRight, ChevronRight
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface VerificationStep {
  id: number;
  stepName: string;
  stepOrder: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  completedAt: Date | null;
  notes?: string;
}

export default function VerificationProcessPage() {
  // TODO: Replace with actual authenticated user from Auth0 context
  const [userId] = useState(1); // Mock user ID for demonstration
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);

  // Fetch user's professional profiles
  const { data: profiles } = useQuery({
    queryKey: [`/api/v1/professionals/profiles/user/${userId}`],
  });

  // Fetch verification steps for selected profile
  const { data: verificationSteps } = useQuery({
    queryKey: [`/api/v1/professionals/profiles/${selectedProfileId}/steps`],
    enabled: !!selectedProfileId,
  });

  const selectedProfile = profiles?.find((p: any) => p.id === selectedProfileId);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'IN_PROGRESS':
        return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
      case 'FAILED':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Circle className="h-5 w-5 text-gray-300" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'FAILED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const calculateProgress = (steps: VerificationStep[] | undefined) => {
    if (!steps || steps.length === 0) return 0;
    const completed = steps.filter(s => s.status === 'COMPLETED').length;
    return (completed / steps.length) * 100;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Professional Verification Process
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Track your journey to becoming a verified professional in the Fibonrose directory
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Panel - Overview */}
        <div className="lg:col-span-1 space-y-6">
          {/* How It Works */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                How Verification Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Create Profile</h4>
                    <p className="text-xs text-gray-600">Submit your professional information</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Complete Steps</h4>
                    <p className="text-xs text-gray-600">Go through required verification steps</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Earn Badges</h4>
                    <p className="text-xs text-gray-600">Receive verification badges</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Go Public</h4>
                    <p className="text-xs text-gray-600">Profile published to directory</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Badges */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Available Badges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                    ✓
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Identity Verified</p>
                    <p className="text-xs text-gray-600">Government ID verified</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-50">
                  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white">
                    🤟
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">ASL Fluent</p>
                    <p className="text-xs text-gray-600">Fluent in ASL</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                    👥
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Community Verified</p>
                    <p className="text-xs text-gray-600">Deaf community verified</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-50">
                  <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white">
                    ⭐
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Professional Verified</p>
                    <p className="text-xs text-gray-600">Professional credentials verified</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Profile & Steps */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Profiles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                My Professional Profiles
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!profiles || profiles.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">You haven't created any professional profiles yet</p>
                  <Button>
                    <User className="h-4 w-4 mr-2" />
                    Create Professional Profile
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {profiles.map((profile: any) => (
                    <Card
                      key={profile.id}
                      className={`cursor-pointer transition-all ${
                        selectedProfileId === profile.id
                          ? 'ring-2 ring-purple-500 bg-purple-50'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedProfileId(profile.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{profile.role?.displayName}</h3>
                              <Badge className={getStatusColor(profile.verificationStatus)}>
                                {profile.verificationStatus}
                              </Badge>
                            </div>
                            {profile.location && (
                              <p className="text-sm text-gray-600">{profile.location}</p>
                            )}
                            {verificationSteps && selectedProfileId === profile.id && (
                              <div className="mt-3">
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-gray-600">Progress</span>
                                  <span className="font-medium">{Math.round(calculateProgress(verificationSteps))}%</span>
                                </div>
                                <Progress value={calculateProgress(verificationSteps)} />
                              </div>
                            )}
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Verification Steps */}
          {selectedProfile && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Verification Steps
                </CardTitle>
                <CardDescription>
                  Complete all steps to verify your {selectedProfile.role?.displayName} profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!verificationSteps || verificationSteps.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No verification steps found for this profile
                  </p>
                ) : (
                  <div className="space-y-4">
                    {verificationSteps.map((step: VerificationStep, index: number) => (
                      <div key={step.id} className="relative">
                        {/* Connection Line */}
                        {index < verificationSteps.length - 1 && (
                          <div className="absolute left-[18px] top-[40px] w-0.5 h-[calc(100%-20px)] bg-gray-200" />
                        )}

                        <div className="flex gap-4">
                          {/* Step Icon */}
                          <div className="relative z-10 flex-shrink-0">
                            {getStatusIcon(step.status)}
                          </div>

                          {/* Step Content */}
                          <div className="flex-1 pb-6">
                            <div className="flex items-start justify-between mb-1">
                              <div>
                                <h4 className="font-semibold text-sm">{step.stepName}</h4>
                                <p className="text-xs text-gray-500">Step {step.stepOrder}</p>
                              </div>
                              <Badge variant="outline" className={getStatusColor(step.status)}>
                                {step.status.replace('_', ' ')}
                              </Badge>
                            </div>

                            {step.notes && (
                              <p className="text-sm text-gray-600 mt-2">{step.notes}</p>
                            )}

                            {step.completedAt && (
                              <p className="text-xs text-gray-500 mt-1">
                                Completed: {new Date(step.completedAt).toLocaleDateString()}
                              </p>
                            )}

                            {step.status === 'PENDING' && (
                              <Button size="sm" className="mt-3">
                                Start Step
                                <ArrowRight className="h-4 w-4 ml-1" />
                              </Button>
                            )}

                            {step.status === 'IN_PROGRESS' && (
                              <Button size="sm" variant="outline" className="mt-3">
                                Continue
                                <ArrowRight className="h-4 w-4 ml-1" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Final Status */}
                {verificationSteps && verificationSteps.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    {calculateProgress(verificationSteps) === 100 ? (
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                        <h3 className="font-semibold text-green-900 mb-1">Verification Complete!</h3>
                        <p className="text-sm text-green-700">
                          Your profile is now verified and visible in the public directory
                        </p>
                      </div>
                    ) : (
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <Clock className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                        <h3 className="font-semibold text-blue-900 mb-1">Verification In Progress</h3>
                        <p className="text-sm text-blue-700">
                          Complete all steps to verify your professional profile
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
