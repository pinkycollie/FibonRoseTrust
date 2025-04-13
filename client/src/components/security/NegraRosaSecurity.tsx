import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { getTrustLevelDescription, getProgressToNextLevel } from "@/lib/utils/fibonacci";
import { trustService, identityService, TrustScore, VerificationStatus } from "@/lib/utils/productBridge";

interface NegraRosaSecurityProps {
  userId: number;
}

export function NegraRosaSecurity({ userId }: NegraRosaSecurityProps) {
  const [loading, setLoading] = useState(true);
  const [trustScore, setTrustScore] = useState<TrustScore | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [transactionLimit, setTransactionLimit] = useState(0);
  const [whyDialogOpen, setWhyDialogOpen] = useState(false);
  const [hasWhySubmission, setHasWhySubmission] = useState(false);
  const [whyMessage, setWhyMessage] = useState('');

  useEffect(() => {
    async function loadSecurityData() {
      try {
        setLoading(true);
        
        // Load trust score data
        const score = await trustService.getTrustScore(userId);
        setTrustScore(score);
        
        // Load verification status
        const status = await identityService.getVerificationStatus(userId);
        setVerificationStatus(status);
        
        // Calculate risk level based on trust score
        if (score.score < 5) {
          setRiskLevel('high');
          setTransactionLimit(100);
        } else if (score.score < 20) {
          setRiskLevel('medium');
          setTransactionLimit(500);
        } else {
          setRiskLevel('low');
          setTransactionLimit(2000);
        }

        // Check if user has WHY submissions
        setHasWhySubmission(Math.random() > 0.7); // Simulated for demo
      } catch (error) {
        console.error("Failed to load security data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadSecurityData();
  }, [userId]);
  
  // Visual accessibility for the Deaf
  const getRiskColor = () => {
    switch (riskLevel) {
      case 'low': return 'bg-emerald-500';
      case 'medium': return 'bg-amber-500';
      case 'high': return 'bg-rose-500';
      default: return 'bg-gray-500';
    }
  };
  
  const getVerificationMethodIcon = (method: string) => {
    switch (method) {
      case 'biometric': return 'fingerprint';
      case 'document': return 'description';
      case 'address': return 'home';
      case 'phone': return 'phone';
      case 'email': return 'email';
      case 'civic': return 'verified_user';
      case 'nft': return 'token';
      default: return 'check_circle';
    }
  };

  const handleSubmitWhy = () => {
    if (whyMessage.trim()) {
      // In a real app, submit the WHY message to backend
      console.log('WHY message submitted:', whyMessage);
      setHasWhySubmission(true);
      setWhyDialogOpen(false);
      // Reset message after submission
      setWhyMessage('');
    }
  };

  return (
    <div className="space-y-6">
      {/* WHY Submission Dialog */}
      <Dialog open={whyDialogOpen} onOpenChange={setWhyDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <span className="material-icons mr-2 text-primary">question_answer</span>
              Tell Us WHY - Explain Your Situation
            </DialogTitle>
            <DialogDescription>
              Help us understand your circumstances so we can better assist you with verification.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Alert className="bg-primary-50 dark:bg-primary-950/20 border-primary-200">
              <div className="flex items-start">
                <span className="material-icons text-primary mr-2">tips_and_updates</span>
                <div>
                  <AlertTitle className="text-sm font-medium">How the WHY system helps</AlertTitle>
                  <AlertDescription className="text-xs">
                    Your explanation helps us understand special circumstances that standard verification might miss.
                    All explanations are reviewed by trained staff with respect for your privacy.
                  </AlertDescription>
                </div>
              </div>
            </Alert>
            
            <div className="space-y-2">
              <Label htmlFor="why-explanation" className="font-medium">
                Your Explanation
              </Label>
              <Textarea 
                id="why-explanation"
                placeholder="Please explain your situation and why traditional verification methods aren't working for you..."
                className="min-h-[150px]"
                value={whyMessage}
                onChange={(e) => setWhyMessage(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col space-y-2">
              <Label className="font-medium">
                Additional Submission Options
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="justify-start text-sm">
                  <span className="material-icons mr-2 text-sm">mic</span>
                  Voice Recording
                </Button>
                <Button variant="outline" className="justify-start text-sm">
                  <span className="material-icons mr-2 text-sm">videocam</span>
                  Video Recording
                </Button>
                <Button variant="outline" className="justify-start text-sm">
                  <span className="material-icons mr-2 text-sm">file_upload</span>
                  Upload Document
                </Button>
                <Button variant="outline" className="justify-start text-sm">
                  <span className="material-icons mr-2 text-sm">sign_language</span>
                  Sign Language
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setWhyDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitWhy}
              disabled={!whyMessage.trim()}
              className="gap-1 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600"
            >
              <span className="material-icons text-sm">send</span>
              Submit WHY
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trust Score Card with Fibonacci progression */}
        <Card className="overflow-hidden shadow-md border-0">
          <div className="h-1.5 bg-gradient-to-r from-primary-400 to-primary-600"></div>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">Trust Score</CardTitle>
                <CardDescription>FibonroseTrust Progression</CardDescription>
              </div>
              
              {loading ? (
                <span className="animate-pulse h-10 w-10 rounded-full bg-primary-100"></span>
              ) : (
                <div className="flex flex-col items-end">
                  <span className="text-3xl font-bold text-primary">{trustScore?.score || 0}</span>
                  <span className="text-xs text-muted-foreground">points</span>
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="pb-4">
            {loading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-10 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>
                    Level {trustScore?.progressionPath?.current || '-'}
                  </span>
                  <span className="font-medium">
                    Level {trustScore?.progressionPath?.next || '-'}
                  </span>
                </div>
                
                <div className="relative pt-2 pb-8">
                  {/* Visual progress bar with Fibonacci segments */}
                  <Progress 
                    value={trustScore?.progressionPath?.progress || 0} 
                    className="h-3 visual-pulsate" 
                  />
                  
                  {/* Visual indicators for deaf accessibility */}
                  <div className="absolute -bottom-1 left-0 flex items-center">
                    <span className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center shadow-sm border border-primary-200">
                      <span className="material-icons text-xs text-primary">
                        {getTrustLevelDescription(parseInt(trustScore?.progressionPath?.current || '0')) === 'Sprout' ? 'grass' : 'eco'}
                      </span>
                    </span>
                  </div>
                  
                  <div className="absolute -bottom-1 right-0 flex items-center">
                    <span className="w-6 h-6 rounded-full bg-primary-200 flex items-center justify-center shadow-sm border border-primary-300">
                      <span className="material-icons text-xs text-primary">
                        {getTrustLevelDescription(parseInt(trustScore?.progressionPath?.next || '0')) === 'Seedling' ? 'spa' : 'forest'}
                      </span>
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    Current: {getTrustLevelDescription(parseInt(trustScore?.progressionPath?.current || '0'))}
                  </span>
                  <span>
                    Next: {getTrustLevelDescription(parseInt(trustScore?.progressionPath?.next || '0'))}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="bg-muted/30 border-t pt-3 pb-3">
            <div className="w-full flex justify-between items-center">
              <Button variant="outline" size="sm" className="text-xs">
                <span className="material-icons text-xs mr-1">analytics</span>
                View Details
              </Button>
              
              <Badge variant="outline" className="text-xs font-normal">
                Fibonacci Growth
              </Badge>
            </div>
          </CardFooter>
        </Card>
        
        {/* NegraRosa Security Risk Assessment Card */}
        <Card className="overflow-hidden shadow-md border-0">
          <div className={`h-1.5 ${getRiskColor()}`}></div>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">Security Status</CardTitle>
                <CardDescription>NegraRosa Security Assessment</CardDescription>
              </div>
              
              {loading ? (
                <span className="animate-pulse h-10 w-10 rounded-full bg-muted"></span>
              ) : (
                <Badge className={`
                  ${riskLevel === 'low' ? 'bg-emerald-500 hover:bg-emerald-500' : 
                    riskLevel === 'medium' ? 'bg-amber-500 hover:bg-amber-500' : 
                    'bg-rose-500 hover:bg-rose-500'}
                  text-white
                `}>
                  {riskLevel.toUpperCase()} RISK
                </Badge>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="pb-4">
            {loading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-20 bg-muted rounded"></div>
                <div className="h-20 bg-muted rounded"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert className={`
                  border border-l-4 
                  ${riskLevel === 'low' ? 'border-l-emerald-500' : 
                    riskLevel === 'medium' ? 'border-l-amber-500' : 
                    'border-l-rose-500'}
                `}>
                  <div className="flex items-start">
                    <span className={`
                      material-icons mr-2 
                      ${riskLevel === 'low' ? 'text-emerald-500' : 
                        riskLevel === 'medium' ? 'text-amber-500' : 
                        'text-rose-500'}
                    `}>
                      {riskLevel === 'low' ? 'security' : 
                       riskLevel === 'medium' ? 'security' : 
                       'warning'}
                    </span>
                    <div>
                      <AlertTitle className="text-sm font-medium">
                        {riskLevel === 'low' ? 'Enhanced Security Status' : 
                         riskLevel === 'medium' ? 'Standard Security Status' : 
                         'Limited Security Status'}
                      </AlertTitle>
                      <AlertDescription className="text-xs">
                        {riskLevel === 'low' ? 'Your account has strong security features enabled.' : 
                         riskLevel === 'medium' ? 'Additional verification would enhance your security status.' : 
                         'Your account requires additional verification.'}
                        {riskLevel === 'high' && (
                          <Button 
                            variant="link" 
                            className="p-0 h-auto text-xs underline text-primary ml-1"
                            onClick={() => setWhyDialogOpen(true)}
                          >
                            Tell us WHY
                          </Button>
                        )}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
                
                <div className="bg-muted/30 p-3 rounded-md">
                  <div className="flex justify-between mb-2">
                    <div className="text-sm font-medium">Transaction Limit</div>
                    <div className="text-sm font-bold">${transactionLimit.toLocaleString()}</div>
                  </div>
                  
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`
                        absolute top-0 left-0 h-full
                        ${riskLevel === 'low' ? 'bg-emerald-500' : 
                          riskLevel === 'medium' ? 'bg-amber-500' : 
                          'bg-rose-500'}
                      `}
                      style={{ width: `${(transactionLimit / 2000) * 100}%` }}
                    ></div>
                  </div>
                  
                  <div className="mt-3 text-xs text-muted-foreground">
                    Increase your trust score to raise transaction limits
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label 
                      htmlFor="e-and-o-claims" 
                      className="text-sm flex items-center cursor-pointer"
                    >
                      <span className="material-icons text-primary mr-1 text-sm">shield</span>
                      E&O Claims Protection
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Protection up to ${(transactionLimit * 10).toLocaleString()}
                    </p>
                  </div>
                  <Switch id="e-and-o-claims" defaultChecked={riskLevel !== 'high'} disabled={riskLevel === 'high'} />
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="bg-muted/30 border-t pt-3 pb-3">
            <div className="w-full flex justify-between items-center">
              <Button variant="outline" size="sm" className="text-xs">
                <span className="material-icons text-xs mr-1">security</span>
                Security Settings
              </Button>
              
              <Badge variant="outline" className="text-xs font-normal">
                NegraRosa Security
              </Badge>
            </div>
          </CardFooter>
        </Card>
      </div>
      
      {/* Verification and WHY System Tabs */}
      <Card className="overflow-hidden shadow-md border-0">
        <CardHeader className="pb-4">
          <CardTitle>Verification & WHY System</CardTitle>
          <CardDescription>
            NegraRosa Security inclusive verification options
          </CardDescription>
        </CardHeader>
        
        <div className="px-6">
          <Tabs defaultValue="verification">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="verification" className="text-sm">
                <span className="material-icons text-sm mr-2">verified_user</span>
                Verification Methods
              </TabsTrigger>
              <TabsTrigger value="why" className="text-sm">
                <span className="material-icons text-sm mr-2">question_answer</span>
                WHY Submissions {hasWhySubmission && (
                  <span className="ml-2 h-2 w-2 rounded-full bg-primary"></span>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="verification" className="pt-4 pb-4">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 animate-pulse">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-16 bg-muted rounded"></div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {/* Active verifications */}
                  {(verificationStatus?.methods || ['biometric', 'nft']).map((method, index) => (
                    <div 
                      key={index}
                      className="flex items-center p-3 bg-muted/30 rounded-md border border-muted"
                    >
                      <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mr-3">
                        <span className="material-icons text-primary">
                          {getVerificationMethodIcon(method)}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium capitalize">
                          {method}
                        </div>
                        <div className="text-xs flex items-center">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                          Verified
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Suggested Verification Methods */}
                  <div 
                    className="flex items-center p-3 bg-muted/10 rounded-md border border-dashed border-muted cursor-pointer hover:bg-muted/20 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-muted/30 flex items-center justify-center mr-3 visual-pulsate">
                      <span className="material-icons text-muted-foreground">add</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium">
                        Add Verification
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Increase trust score
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t border-muted flex justify-end">
                <Button size="sm" className="gap-1 text-xs sm:text-sm bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600">
                  <span className="material-icons text-xs">add_circle</span>
                  Add New Verification
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="why" className="pt-4 pb-4">
              {hasWhySubmission ? (
                <div className="space-y-4">
                  {/* Active WHY submission */}
                  <div className="bg-primary-50 dark:bg-primary-950/20 border border-primary-100 dark:border-primary-900/30 rounded-md p-4">
                    <div className="flex items-start">
                      <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="material-icons text-primary">question_answer</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="text-sm font-medium">WHY Submission #1</h4>
                          <Badge className="bg-amber-500 hover:bg-amber-500">In Review</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Submitted on April 10, 2025
                        </div>
                        <div className="mt-3 text-sm">
                          <p className="line-clamp-2">
                            I recently moved and don't have official address verification yet...
                          </p>
                        </div>
                        <div className="flex justify-end mt-2">
                          <Button variant="link" className="h-auto p-0 text-xs">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Alert className="bg-muted/30 border-muted">
                    <div className="flex items-start">
                      <span className="material-icons text-muted-foreground mr-2">schedule</span>
                      <div>
                        <AlertTitle className="text-sm font-medium">Review in Progress</AlertTitle>
                        <AlertDescription className="text-xs">
                          Our team is reviewing your WHY submission. This process typically takes 1-2 business days.
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="mx-auto h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                    <span className="material-icons text-muted-foreground">question_answer</span>
                  </div>
                  <h3 className="text-lg font-medium">No WHY Submissions</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                    If you're facing verification challenges, you can explain your situation.
                    Our WHY system helps us understand circumstances that traditional verification may miss.
                  </p>
                  <Button 
                    onClick={() => setWhyDialogOpen(true)}
                    className="mt-4 gap-1 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600"
                  >
                    <span className="material-icons text-sm">add_circle</span>
                    New WHY Submission
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );
}