import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  isBiometricsSupported, 
  registerBiometric, 
  verifyBiometric, 
  getUserBiometrics,
  saveBiometricCredential,
  deleteBiometricCredential,
  BiometricCredential
} from "@/lib/utils/biometrics";

interface BiometricVerificationProps {
  userId: string;
  username: string;
  displayName: string;
  onVerificationComplete?: (success: boolean) => void;
}

export function BiometricVerification({ 
  userId, 
  username, 
  displayName,
  onVerificationComplete 
}: BiometricVerificationProps) {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null);
  const [biometricCredentials, setBiometricCredentials] = useState<BiometricCredential[]>([]);
  const [selectedBiometricType, setSelectedBiometricType] = useState<'fingerprint' | 'face' | 'voice' | 'other'>('fingerprint');
  const [activeTab, setActiveTab] = useState<'verify' | 'register' | 'manage'>('verify');
  
  // Check if biometrics are supported on this device
  useEffect(() => {
    const checkSupport = async () => {
      try {
        setIsLoading(true);
        const supported = isBiometricsSupported();
        setIsSupported(supported);
        
        // Load any existing biometric credentials
        if (supported) {
          const credentials = await getUserBiometrics(userId);
          setBiometricCredentials(credentials);
        }
      } catch (error) {
        console.error('Error checking biometric support:', error);
        setIsSupported(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSupport();
  }, [userId]);
  
  // Function to register a new biometric
  const handleRegisterBiometric = async () => {
    try {
      setIsRegistering(true);
      setVerificationResult(null);
      
      const result = await registerBiometric(
        userId,
        username,
        displayName,
        selectedBiometricType
      );
      
      if (result) {
        // Save the credential
        await saveBiometricCredential(userId, result);
        
        // Update the list of credentials
        const updatedCredentials = await getUserBiometrics(userId);
        setBiometricCredentials(updatedCredentials);
        
        setVerificationResult(true);
        setActiveTab('manage');
      } else {
        setVerificationResult(false);
      }
    } catch (error) {
      console.error('Error registering biometric:', error);
      setVerificationResult(false);
    } finally {
      setIsRegistering(false);
    }
  };
  
  // Function to verify using biometrics
  const handleVerifyBiometric = async () => {
    try {
      if (biometricCredentials.length === 0) {
        setVerificationResult(false);
        return;
      }
      
      setIsVerifying(true);
      setVerificationResult(null);
      
      // Use the first credential for verification
      const result = await verifyBiometric(biometricCredentials[0].id);
      setVerificationResult(result);
      
      if (result) {
        // Update the lastUsed timestamp
        const updatedCredentials = biometricCredentials.map(cred => ({
          ...cred,
          lastUsed: cred.id === biometricCredentials[0].id ? new Date() : cred.lastUsed
        }));
        
        localStorage.setItem(
          `biometric_${userId}`,
          JSON.stringify(updatedCredentials)
        );
        
        setBiometricCredentials(updatedCredentials);
      }
      
      // Call the callback if provided
      if (onVerificationComplete) {
        onVerificationComplete(result);
      }
    } catch (error) {
      console.error('Error verifying biometric:', error);
      setVerificationResult(false);
      
      if (onVerificationComplete) {
        onVerificationComplete(false);
      }
    } finally {
      setIsVerifying(false);
    }
  };
  
  // Function to delete a biometric credential
  const handleDeleteCredential = async (credentialId: string) => {
    try {
      const result = await deleteBiometricCredential(userId, credentialId);
      
      if (result) {
        // Update the list of credentials
        const updatedCredentials = await getUserBiometrics(userId);
        setBiometricCredentials(updatedCredentials);
      }
    } catch (error) {
      console.error('Error deleting biometric credential:', error);
    }
  };
  
  // Get icon for biometric type
  const getBiometricIcon = (type: string) => {
    switch (type) {
      case 'fingerprint': return 'fingerprint';
      case 'face': return 'face';
      case 'voice': return 'mic';
      default: return 'security';
    }
  };
  
  // If biometrics are not supported, show unsupported message
  if (!isLoading && !isSupported) {
    return (
      <Card className="shadow-md border-0">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center">
            <span className="material-icons mr-2 text-primary">fingerprint</span>
            Biometric Verification
          </CardTitle>
          <CardDescription>
            Secure identity verification using biometrics
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30">
            <div className="flex items-start">
              <span className="material-icons text-amber-500 mr-2">info</span>
              <div>
                <AlertTitle className="text-sm font-medium">Biometrics Not Supported</AlertTitle>
                <AlertDescription className="text-xs">
                  Your current browser or device doesn't support biometric authentication.
                  Please try using a different browser or device that supports WebAuthn.
                </AlertDescription>
              </div>
            </div>
          </Alert>
          
          <div className="mt-4 p-6 border rounded-md flex flex-col items-center text-center">
            <span className="material-icons text-muted-foreground text-4xl mb-2">no_encryption</span>
            <h3 className="text-lg font-medium">Browser Not Compatible</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Biometric authentication requires a browser that supports the WebAuthn standard.
              Try using the latest version of Chrome, Firefox, Safari, or Edge.
            </p>
            <Button 
              className="mt-4 gap-1"
              onClick={() => window.location.reload()}
            >
              <span className="material-icons text-sm">refresh</span>
              Retry Detection
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="shadow-md border-0">
      <CardHeader className="pb-3 border-b border-muted">
        <CardTitle className="flex items-center">
          <span className="material-icons mr-2 text-primary">fingerprint</span>
          Biometric Verification
        </CardTitle>
        <CardDescription>
          Secure identity verification using biometrics
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-pulse h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center mb-4">
              <span className="material-icons text-primary">fingerprint</span>
            </div>
            <p className="text-sm text-muted-foreground">Checking biometric capabilities...</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="verify" disabled={biometricCredentials.length === 0}>
                <span className="material-icons text-sm mr-2">verified_user</span>
                Verify
              </TabsTrigger>
              <TabsTrigger value="register">
                <span className="material-icons text-sm mr-2">add_circle</span>
                Register
              </TabsTrigger>
              <TabsTrigger value="manage" disabled={biometricCredentials.length === 0}>
                <span className="material-icons text-sm mr-2">settings</span>
                Manage
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="verify" className="space-y-4">
              {biometricCredentials.length === 0 ? (
                <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30">
                  <div className="flex items-start">
                    <span className="material-icons text-amber-500 mr-2">info</span>
                    <div>
                      <AlertTitle className="text-sm font-medium">No Biometrics Registered</AlertTitle>
                      <AlertDescription className="text-xs">
                        You need to register a biometric credential before you can verify.
                        Please switch to the "Register" tab to set up your biometrics.
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              ) : (
                <>
                  <div className="text-center p-6 border rounded-md bg-muted/20">
                    <div className="mx-auto h-20 w-20 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mb-4 visual-pulsate">
                      <span className="material-icons text-4xl text-primary">fingerprint</span>
                    </div>
                    <h3 className="text-lg font-medium">Verify Your Identity</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                      Use your registered biometric to verify your identity. 
                      This will use {biometricCredentials[0].type === 'fingerprint' ? 'your fingerprint' : 
                                      biometricCredentials[0].type === 'face' ? 'facial recognition' : 
                                      biometricCredentials[0].type === 'voice' ? 'voice recognition' : 
                                      'your biometric'}.
                    </p>
                  </div>
                  
                  {verificationResult !== null && (
                    <Alert className={`
                      ${verificationResult ? 
                        'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30' : 
                        'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30'}
                    `}>
                      <div className="flex items-start">
                        <span className={`
                          material-icons mr-2 
                          ${verificationResult ? 'text-emerald-500' : 'text-rose-500'}
                        `}>
                          {verificationResult ? 'check_circle' : 'error'}
                        </span>
                        <div>
                          <AlertTitle className="text-sm font-medium">
                            {verificationResult ? 'Verification Successful' : 'Verification Failed'}
                          </AlertTitle>
                          <AlertDescription className="text-xs">
                            {verificationResult ? 
                              'Your biometric has been successfully verified.' : 
                              'We couldn\'t verify your biometric. Please try again.'}
                          </AlertDescription>
                        </div>
                      </div>
                    </Alert>
                  )}
                  
                  <div className="flex justify-center">
                    <Button 
                      onClick={handleVerifyBiometric}
                      disabled={isVerifying}
                      className="gap-1 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600"
                      size="lg"
                    >
                      {isVerifying ? (
                        <>
                          <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-icons text-base">fingerprint</span>
                          <span>Verify Identity</span>
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="register" className="space-y-4">
              <div className="space-y-4">
                <div className="bg-muted/20 p-4 rounded-md border">
                  <h3 className="text-base font-medium flex items-center">
                    <span className="material-icons text-primary mr-2">security</span>
                    Select Biometric Type
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-3">
                    Choose the type of biometric you want to register
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant={selectedBiometricType === 'fingerprint' ? 'default' : 'outline'}
                      className={`h-auto py-3 justify-start ${
                        selectedBiometricType === 'fingerprint' ? 
                        'bg-primary text-primary-foreground' : ''
                      }`}
                      onClick={() => setSelectedBiometricType('fingerprint')}
                    >
                      <div className="flex flex-col items-center w-full">
                        <span className="material-icons text-2xl mb-1">fingerprint</span>
                        <span>Fingerprint</span>
                      </div>
                    </Button>
                    
                    <Button 
                      variant={selectedBiometricType === 'face' ? 'default' : 'outline'}
                      className={`h-auto py-3 justify-start ${
                        selectedBiometricType === 'face' ? 
                        'bg-primary text-primary-foreground' : ''
                      }`}
                      onClick={() => setSelectedBiometricType('face')}
                    >
                      <div className="flex flex-col items-center w-full">
                        <span className="material-icons text-2xl mb-1">face</span>
                        <span>Face</span>
                      </div>
                    </Button>
                    
                    <Button 
                      variant={selectedBiometricType === 'voice' ? 'default' : 'outline'}
                      className={`h-auto py-3 justify-start ${
                        selectedBiometricType === 'voice' ? 
                        'bg-primary text-primary-foreground' : ''
                      }`}
                      onClick={() => setSelectedBiometricType('voice')}
                    >
                      <div className="flex flex-col items-center w-full">
                        <span className="material-icons text-2xl mb-1">mic</span>
                        <span>Voice</span>
                      </div>
                    </Button>
                    
                    <Button 
                      variant={selectedBiometricType === 'other' ? 'default' : 'outline'}
                      className={`h-auto py-3 justify-start ${
                        selectedBiometricType === 'other' ? 
                        'bg-primary text-primary-foreground' : ''
                      }`}
                      onClick={() => setSelectedBiometricType('other')}
                    >
                      <div className="flex flex-col items-center w-full">
                        <span className="material-icons text-2xl mb-1">security</span>
                        <span>Other</span>
                      </div>
                    </Button>
                  </div>
                </div>
                
                <Alert>
                  <div className="flex items-start">
                    <span className="material-icons text-primary mr-2">info</span>
                    <div>
                      <AlertTitle className="text-sm font-medium">
                        About Biometric Registration
                      </AlertTitle>
                      <AlertDescription className="text-xs">
                        Your biometric data never leaves your device. We use WebAuthn, 
                        a secure standard that keeps your biometric safe.
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
                
                {verificationResult !== null && (
                  <Alert className={`
                    ${verificationResult ? 
                      'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30' : 
                      'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30'}
                  `}>
                    <div className="flex items-start">
                      <span className={`
                        material-icons mr-2 
                        ${verificationResult ? 'text-emerald-500' : 'text-rose-500'}
                      `}>
                        {verificationResult ? 'check_circle' : 'error'}
                      </span>
                      <div>
                        <AlertTitle className="text-sm font-medium">
                          {verificationResult ? 'Registration Successful' : 'Registration Failed'}
                        </AlertTitle>
                        <AlertDescription className="text-xs">
                          {verificationResult ? 
                            'Your biometric has been successfully registered.' : 
                            'We couldn\'t register your biometric. Please try again.'}
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
                )}
              </div>
              
              <div className="flex justify-center">
                <Button 
                  onClick={handleRegisterBiometric}
                  disabled={isRegistering}
                  className="gap-1 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600"
                  size="lg"
                >
                  {isRegistering ? (
                    <>
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                      <span>Registering...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-icons text-base">
                        {getBiometricIcon(selectedBiometricType)}
                      </span>
                      <span>Register {selectedBiometricType.charAt(0).toUpperCase() + selectedBiometricType.slice(1)}</span>
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="manage" className="space-y-4">
              {biometricCredentials.length === 0 ? (
                <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30">
                  <div className="flex items-start">
                    <span className="material-icons text-amber-500 mr-2">info</span>
                    <div>
                      <AlertTitle className="text-sm font-medium">No Biometrics Registered</AlertTitle>
                      <AlertDescription className="text-xs">
                        You haven't registered any biometric credentials yet.
                        Please switch to the "Register" tab to set up your biometrics.
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-base font-medium">Registered Biometrics</h3>
                  
                  {biometricCredentials.map((credential, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-md border border-muted"
                    >
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mr-3">
                          <span className="material-icons text-primary">
                            {getBiometricIcon(credential.type)}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium capitalize">
                            {credential.type}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center">
                            <span className="material-icons text-xs mr-1">event</span>
                            Registered on {credential.createdAt.toLocaleDateString()}
                          </div>
                          {credential.lastUsed && (
                            <div className="text-xs text-muted-foreground flex items-center mt-0.5">
                              <span className="material-icons text-xs mr-1">update</span>
                              Last used {credential.lastUsed.toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteCredential(credential.id)}
                      >
                        <span className="material-icons text-sm">delete</span>
                      </Button>
                    </div>
                  ))}
                  
                  <div className="flex justify-end mt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="gap-1"
                      onClick={() => setActiveTab('register')}
                    >
                      <span className="material-icons text-xs">add</span>
                      Add New Biometric
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
      
      <CardFooter className="bg-muted/30 border-t pt-3 pb-3 flex flex-wrap gap-2 justify-between">
        <Badge variant="outline" className="text-xs font-normal flex items-center">
          <span className="material-icons text-xs mr-1">verified_user</span>
          WebAuthn Secured
        </Badge>
        
        <Badge variant="outline" className="text-xs font-normal flex items-center">
          <span className="material-icons text-xs mr-1">shield</span>
          Device-Only Storage
        </Badge>
      </CardFooter>
    </Card>
  );
}