import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GovernmentIdVerificationProps {
  userId: number;
  onVerificationComplete?: (success: boolean) => void;
}

type VerificationStep = 'upload' | 'processing' | 'complete' | 'failed';
type IdType = 'passport' | 'drivers_license' | 'national_id' | 'residence_permit';
type IdStatus = 'pending' | 'reviewing' | 'verified' | 'rejected';

interface VerificationHistory {
  id: string;
  type: IdType;
  submittedAt: Date;
  status: IdStatus;
  expiresAt?: Date;
  feedback?: string;
}

export function GovernmentIdVerification({ 
  userId, 
  onVerificationComplete 
}: GovernmentIdVerificationProps) {
  const [selectedIdType, setSelectedIdType] = useState<IdType>('drivers_license');
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [step, setStep] = useState<VerificationStep>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [verificationHistory, setVerificationHistory] = useState<VerificationHistory[]>([]);
  const [activeTab, setActiveTab] = useState<'verify' | 'history'>('verify');

  // Handle file selection
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    // Add the selected files to our state
    const files = Array.from(event.target.files);
    setUploadedFiles(prev => [...prev, ...files]);
  };
  
  // Remove a file from the list
  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  // Start the verification process
  const handleStartVerification = async () => {
    if (uploadedFiles.length === 0) return;
    
    setStep('processing');
    setIsProcessing(true);
    setProcessingProgress(0);
    
    // Simulate a verification process with progress updates
    const interval = setInterval(() => {
      setProcessingProgress(prev => {
        const newProgress = prev + Math.random() * 15;
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            // 90% chance of success for the demo
            const success = Math.random() > 0.1;
            setStep(success ? 'complete' : 'failed');
            setIsProcessing(false);
            
            if (success) {
              // Add to verification history
              const newVerification: VerificationHistory = {
                id: Math.random().toString(36).substr(2, 9),
                type: selectedIdType,
                submittedAt: new Date(),
                status: 'reviewing',
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365) // 1 year from now
              };
              
              setVerificationHistory(prev => [newVerification, ...prev]);
              
              // Call the callback if provided
              if (onVerificationComplete) {
                onVerificationComplete(true);
              }
            } else if (onVerificationComplete) {
              onVerificationComplete(false);
            }
          }, 500);
        }
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 300);
  };
  
  // Reset the form to try again
  const handleReset = () => {
    setStep('upload');
    setUploadedFiles([]);
    setProcessingProgress(0);
  };
  
  // Get icon for ID type
  const getIdTypeIcon = (type: IdType) => {
    switch (type) {
      case 'passport': return 'travel_explore';
      case 'drivers_license': return 'drive_eta';
      case 'national_id': return 'badge';
      case 'residence_permit': return 'home';
      default: return 'card_membership';
    }
  };
  
  // Get color for status
  const getStatusColor = (status: IdStatus) => {
    switch (status) {
      case 'verified': return 'bg-emerald-500 hover:bg-emerald-500';
      case 'reviewing': return 'bg-amber-500 hover:bg-amber-500';
      case 'pending': return 'bg-blue-500 hover:bg-blue-500';
      case 'rejected': return 'bg-rose-500 hover:bg-rose-500';
      default: return 'bg-slate-500 hover:bg-slate-500';
    }
  };
  
  return (
    <Card className="shadow-md border-0">
      <CardHeader className="pb-3 border-b border-muted">
        <CardTitle className="flex items-center">
          <span className="material-icons mr-2 text-primary">card_membership</span>
          Government ID Verification
        </CardTitle>
        <CardDescription>
          Verify your identity with government-issued identification
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-4">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="verify" className="text-sm">
              <span className="material-icons text-sm mr-2">verified_user</span>
              Verify ID
            </TabsTrigger>
            <TabsTrigger value="history" className="text-sm">
              <span className="material-icons text-sm mr-2">history</span>
              History
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="verify">
            {step === 'upload' && (
              <div className="space-y-4">
                <Alert className="bg-primary-50 dark:bg-primary-950/20 border-primary-100 dark:border-primary-900/30">
                  <div className="flex items-start">
                    <span className="material-icons text-primary mr-2">info</span>
                    <div>
                      <AlertTitle className="text-sm font-medium">Why verify your ID?</AlertTitle>
                      <AlertDescription className="text-xs">
                        ID verification increases your trust score significantly and enables higher transaction limits.
                        Your data is securely processed and encrypted.
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="id-type">ID Type</Label>
                      <Select 
                        value={selectedIdType} 
                        onValueChange={(value) => setSelectedIdType(value as IdType)}
                      >
                        <SelectTrigger id="id-type">
                          <SelectValue placeholder="Select ID type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="passport">Passport</SelectItem>
                          <SelectItem value="drivers_license">Driver's License</SelectItem>
                          <SelectItem value="national_id">National ID Card</SelectItem>
                          <SelectItem value="residence_permit">Residence Permit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="country">Country of Issue</Label>
                      <Select 
                        value={selectedCountry} 
                        onValueChange={setSelectedCountry}
                      >
                        <SelectTrigger id="country">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="CA">Canada</SelectItem>
                          <SelectItem value="UK">United Kingdom</SelectItem>
                          <SelectItem value="AU">Australia</SelectItem>
                          <SelectItem value="DE">Germany</SelectItem>
                          <SelectItem value="FR">France</SelectItem>
                          <SelectItem value="JP">Japan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Upload ID Document</Label>
                    <div 
                      className="border-2 border-dashed border-muted rounded-md p-6 text-center hover:bg-muted/5 transition-colors cursor-pointer"
                      onClick={() => document.getElementById('id-upload')?.click()}
                    >
                      <input
                        id="id-upload"
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        multiple
                        onChange={handleFileUpload}
                      />
                      <span className="material-icons text-3xl text-muted-foreground mb-2">upload_file</span>
                      <p className="text-sm">Click to upload your ID document, or drag and drop</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedIdType === 'drivers_license' ? 
                          'Please upload both front and back of your driver\'s license' :
                          'Please upload a clear photo or scan of your ID document'
                        }
                      </p>
                    </div>
                  </div>
                  
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <Label>Uploaded Files</Label>
                      <div className="space-y-2">
                        {uploadedFiles.map((file, index) => (
                          <div 
                            key={index} 
                            className="flex items-center justify-between bg-muted/30 p-2 rounded-md"
                          >
                            <div className="flex items-center">
                              <span className="material-icons text-muted-foreground mr-2">
                                {file.type.includes('pdf') ? 'picture_as_pdf' : 'image'}
                              </span>
                              <span className="text-sm truncate max-w-[180px]">{file.name}</span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => removeFile(index)}
                            >
                              <span className="material-icons text-sm">close</span>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-muted/20 p-3 rounded-md border border-muted">
                    <h4 className="text-sm font-medium flex items-center">
                      <span className="material-icons text-primary mr-2 text-sm">privacy_tip</span>
                      Privacy & Security
                    </h4>
                    <ul className="mt-2 space-y-1">
                      <li className="text-xs flex items-start">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary mt-1 mr-1.5"></span>
                        Your ID is securely encrypted and processed
                      </li>
                      <li className="text-xs flex items-start">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary mt-1 mr-1.5"></span>
                        Only verification results are stored, not your actual ID images
                      </li>
                      <li className="text-xs flex items-start">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary mt-1 mr-1.5"></span>
                        ID verification is conducted in compliance with privacy regulations
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {step === 'processing' && (
              <div className="space-y-6 py-4">
                <div className="text-center">
                  <div className="mx-auto h-16 w-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mb-4 visual-pulsate">
                    <span className="material-icons text-2xl text-primary">search</span>
                  </div>
                  <h3 className="text-lg font-medium">Verifying Your ID</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                    We're securely processing your ID document. This typically takes 1-2 minutes.
                  </p>
                </div>
                
                <div className="space-y-2 max-w-md mx-auto">
                  <div className="flex justify-between text-xs">
                    <span>Processing</span>
                    <span>{Math.round(processingProgress)}%</span>
                  </div>
                  <Progress value={processingProgress} className="w-full h-2" />
                </div>
                
                <div className="bg-muted/20 p-4 rounded-md border border-muted max-w-md mx-auto">
                  <h4 className="text-sm font-medium">Verification Steps</h4>
                  <ul className="mt-2 space-y-3">
                    <li className="text-xs flex items-start">
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center mr-2 flex-shrink-0 ${
                        processingProgress > 10 ? 'bg-primary text-white' : 'bg-muted-foreground/20 text-muted-foreground'
                      }`}>
                        <span className="material-icons text-[10px]">
                          {processingProgress > 10 ? 'check' : '1'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Document analysis</span>
                        <div className="text-muted-foreground">Checking document type and format</div>
                      </div>
                    </li>
                    <li className="text-xs flex items-start">
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center mr-2 flex-shrink-0 ${
                        processingProgress > 40 ? 'bg-primary text-white' : 'bg-muted-foreground/20 text-muted-foreground'
                      }`}>
                        <span className="material-icons text-[10px]">
                          {processingProgress > 40 ? 'check' : '2'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Authenticity checks</span>
                        <div className="text-muted-foreground">Verifying security features and validity</div>
                      </div>
                    </li>
                    <li className="text-xs flex items-start">
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center mr-2 flex-shrink-0 ${
                        processingProgress > 70 ? 'bg-primary text-white' : 'bg-muted-foreground/20 text-muted-foreground'
                      }`}>
                        <span className="material-icons text-[10px]">
                          {processingProgress > 70 ? 'check' : '3'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Identity correlation</span>
                        <div className="text-muted-foreground">Matching to existing profile information</div>
                      </div>
                    </li>
                    <li className="text-xs flex items-start">
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center mr-2 flex-shrink-0 ${
                        processingProgress === 100 ? 'bg-primary text-white' : 'bg-muted-foreground/20 text-muted-foreground'
                      }`}>
                        <span className="material-icons text-[10px]">
                          {processingProgress === 100 ? 'check' : '4'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Verification completion</span>
                        <div className="text-muted-foreground">Finalizing results and updating trust score</div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            )}
            
            {step === 'complete' && (
              <div className="space-y-6 py-4">
                <div className="text-center">
                  <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mb-4">
                    <span className="material-icons text-2xl text-emerald-600 dark:text-emerald-400">check_circle</span>
                  </div>
                  <h3 className="text-lg font-medium">Verification Successful</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                    Your ID document has been successfully verified and your trust score has been updated.
                  </p>
                </div>
                
                <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-md border border-emerald-100 dark:border-emerald-900/30 max-w-md mx-auto">
                  <h4 className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Verification Details</h4>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Document Type</span>
                      <span className="font-medium">{selectedIdType.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Verified On</span>
                      <span className="font-medium">{new Date().toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Status</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">Verified</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Expiry</span>
                      <span className="font-medium">
                        {new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Trust Score Impact</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">+3.0 points</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <Button 
                    variant="outline"
                    className="gap-1"
                    onClick={() => setActiveTab('history')}
                  >
                    <span className="material-icons text-sm">history</span>
                    View Verification History
                  </Button>
                </div>
              </div>
            )}
            
            {step === 'failed' && (
              <div className="space-y-6 py-4">
                <div className="text-center">
                  <div className="mx-auto h-16 w-16 rounded-full bg-rose-100 dark:bg-rose-900 flex items-center justify-center mb-4">
                    <span className="material-icons text-2xl text-rose-600 dark:text-rose-400">error</span>
                  </div>
                  <h3 className="text-lg font-medium">Verification Failed</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                    We couldn't verify your ID document. This could be due to image quality or document issues.
                  </p>
                </div>
                
                <div className="bg-rose-50 dark:bg-rose-950/20 p-4 rounded-md border border-rose-100 dark:border-rose-900/30 max-w-md mx-auto">
                  <h4 className="text-sm font-medium text-rose-700 dark:text-rose-400">Common Issues</h4>
                  <ul className="mt-3 space-y-2">
                    <li className="text-xs flex items-start">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500 mt-1 mr-1.5"></span>
                      The image may be too blurry or low resolution
                    </li>
                    <li className="text-xs flex items-start">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500 mt-1 mr-1.5"></span>
                      The document might be damaged or have glare
                    </li>
                    <li className="text-xs flex items-start">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500 mt-1 mr-1.5"></span>
                      Important information could be obscured or cut off
                    </li>
                    <li className="text-xs flex items-start">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500 mt-1 mr-1.5"></span>
                      The document may have expired or be invalid
                    </li>
                  </ul>
                </div>
                
                <div className="flex justify-center">
                  <Button 
                    className="gap-1 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600"
                    onClick={handleReset}
                  >
                    <span className="material-icons text-sm">refresh</span>
                    Try Again
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="history">
            <div className="space-y-4">
              {verificationHistory.length === 0 ? (
                <div className="text-center py-6">
                  <div className="mx-auto h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                    <span className="material-icons text-muted-foreground">history</span>
                  </div>
                  <h3 className="text-lg font-medium">No Verification History</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                    You haven't verified any government IDs yet. Complete a verification to see it here.
                  </p>
                  <Button 
                    className="mt-4 gap-1"
                    onClick={() => setActiveTab('verify')}
                  >
                    <span className="material-icons text-sm">verified_user</span>
                    Start Verification
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mb-2">
                    <h3 className="text-lg font-medium">Verification History</h3>
                    <p className="text-sm text-muted-foreground">
                      Track the status of your ID verifications
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    {verificationHistory.map((verification, index) => (
                      <div 
                        key={index}
                        className="flex items-center p-3 bg-muted/20 rounded-md border border-muted"
                      >
                        <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mr-3 flex-shrink-0">
                          <span className="material-icons text-primary">
                            {getIdTypeIcon(verification.type)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-sm font-medium">
                                {verification.type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Submitted on {verification.submittedAt.toLocaleDateString()}
                              </div>
                            </div>
                            <Badge className={`${getStatusColor(verification.status)} text-white`}>
                              {verification.status.replace(/\b\w/g, c => c.toUpperCase())}
                            </Badge>
                          </div>
                          
                          {verification.expiresAt && (
                            <div className="mt-1 text-xs flex items-center text-muted-foreground">
                              <span className="material-icons text-xs mr-1">event</span>
                              Expires: {verification.expiresAt.toLocaleDateString()}
                            </div>
                          )}
                          
                          {verification.feedback && (
                            <div className="mt-1 text-xs italic text-muted-foreground">
                              "{verification.feedback}"
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="bg-muted/30 border-t pt-3 pb-3">
        {step === 'upload' && (
          <Button 
            onClick={handleStartVerification}
            disabled={uploadedFiles.length === 0}
            className="gap-1 w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600"
          >
            <span className="material-icons text-sm">verified_user</span>
            Submit for Verification
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}