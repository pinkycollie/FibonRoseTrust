import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardDescription, CardFooter, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { NftCard3D } from "@/components/nft/NftCard3D";
import { 
  verifyNftOwnership, 
  initializeBlockchain, 
  getNftVerificationDetails,
  mintIdentityNft,
  verifyIdentity,
  VerificationStatus,
  IDENTITY_NFT_CONTRACT_SOURCE
} from "@/lib/utils/blockchain";
import { User } from "@shared/schema";

export default function NftAuthentication() {
  const [walletAddress, setWalletAddress] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [showContract, setShowContract] = useState(false);
  const { toast } = useToast();

  // Get current user data
  const { data: userData } = useQuery<User>({
    queryKey: ['/api/user/1'],
  });

  // Initialize blockchain connection on page load
  useEffect(() => {
    const connectWallet = async () => {
      try {
        if (window.ethereum) {
          const { accounts } = await initializeBlockchain();
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            setIsConnected(true);
            toast({
              title: "Wallet Connected",
              description: "Successfully connected to your blockchain wallet.",
            });
          }
        }
      } catch (error) {
        console.error("Error connecting wallet:", error);
      }
    };

    // Try to connect automatically, but don't show errors
    connectWallet().catch(() => {});
  }, [toast]);

  // Handle manual wallet connection
  const connectWallet = async () => {
    try {
      const { accounts } = await initializeBlockchain();
      setWalletAddress(accounts[0]);
      setIsConnected(true);
      toast({
        title: "Wallet Connected",
        description: "Successfully connected to your blockchain wallet.",
      });
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Could not connect to wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Backend verification mutation
  const verifyNftMutation = useMutation({
    mutationFn: async (data: { userId: number; walletAddress: string; tokenId: string }) => {
      const res = await apiRequest('POST', '/api/nft-verification', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "NFT Verification Successful",
        description: "Your NFT has been verified and added to your trust score.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/1/verifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/1/trust-score'] });
      setVerificationResult(null);
      setTokenId("");
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Could not verify NFT. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle NFT verification with blockchain integration
  const handleVerifyNft = async () => {
    if (!walletAddress || !tokenId) {
      toast({
        title: "Missing Information",
        description: "Please provide both wallet address and token ID.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      // First check ownership on blockchain
      const isOwner = await verifyNftOwnership(walletAddress, tokenId);
      if (!isOwner) {
        toast({
          title: "Ownership Verification Failed",
          description: "The provided wallet does not own this NFT token.",
          variant: "destructive",
        });
        setIsVerifying(false);
        return;
      }

      // Get verification details from blockchain
      const details = await getNftVerificationDetails(tokenId);
      setVerificationResult(details);

      // Verify with backend
      verifyNftMutation.mutate({
        userId: userData?.id || 1,
        walletAddress,
        tokenId,
      });
    } catch (error: any) {
      toast({
        title: "Blockchain Verification Failed",
        description: error.message || "Error verifying on blockchain. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle NFT minting
  const handleMintNft = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsVerifying(true);
      
      // Create metadata for the NFT
      const metadata = {
        name: "FibonRoseID NFT",
        description: "Digital Identity NFT powered by the FibonRoseID system",
        image: "https://ipfs.io/ipfs/QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco", // Placeholder
        attributes: [
          {
            trait_type: "Identity Type",
            value: "Personal"
          },
          {
            trait_type: "Verification Level",
            value: "1"
          },
          {
            trait_type: "Issuance Date",
            value: new Date().toISOString()
          }
        ]
      };

      // In a production environment, this would upload to IPFS
      // For this demo, we'll use a mock URI
      const metadataUri = "ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
      
      // Mint the NFT (this would fail without a real contract, but the UI will simulate success)
      // const newTokenId = await mintIdentityNft(walletAddress, metadataUri);
      
      // Simulate minting for demo
      const timestamp = Math.floor(Date.now() / 1000);
      const randomPart = Math.floor(Math.random() * 1000000);
      const newTokenId = `${timestamp}${randomPart}`;
      
      setTimeout(() => {
        setIsVerifying(false);
        setTokenId(newTokenId);
        toast({
          title: "NFT Minted Successfully",
          description: `Your identity NFT has been minted with token ID: ${newTokenId}`,
        });
      }, 2000);
      
    } catch (error: any) {
      setIsVerifying(false);
      toast({
        title: "Minting Failed",
        description: error.message || "Could not mint NFT. Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="py-4 sm:py-6">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 md:px-8">
        <div className="flex flex-col space-y-2 mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-primary-800 dark:from-primary-400 dark:to-primary-600">FibonroseTrust Authentication</h1>
          <p className="text-base sm:text-lg text-muted-foreground">Secure digital identity verification with blockchain technology</p>
        </div>
        
        <Tabs defaultValue="verify" className="mt-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6 rounded-lg bg-muted p-1 gap-1 sm:gap-0">
            <TabsTrigger value="verify" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow text-xs sm:text-sm">Verify NFT</TabsTrigger>
            <TabsTrigger value="mint" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow text-xs sm:text-sm">Mint ID NFT</TabsTrigger>
            <TabsTrigger value="showcase" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow text-xs sm:text-sm">NFT Showcase</TabsTrigger>
            <TabsTrigger value="contract" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow text-xs sm:text-sm">Smart Contract</TabsTrigger>
          </TabsList>
          
          <TabsContent value="verify">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div className="space-y-8">
                <Card className="overflow-hidden border-0 shadow-md">
                  <div className="h-1.5 bg-gradient-to-r from-primary-400 to-primary-600" />
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-primary-100 dark:bg-primary-900 rounded-full p-2 sm:p-2.5 mr-3 sm:mr-4 visual-pulsate">
                        <span className="material-icons text-sm sm:text-base text-primary">fingerprint</span>
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-semibold tracking-tight">NFT Verification</h2>
                        <CardDescription className="text-xs sm:text-sm">Connect your blockchain wallet to verify your identity NFT</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <div className="p-3 sm:p-4 rounded-lg bg-muted mb-5 sm:mb-6">
                      <div className="flex items-start">
                        <span className="material-icons text-amber-500 mt-0.5 mr-2 text-sm sm:text-base">info</span>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Your NFT must be in the connected wallet to verify. The verification process confirms your identity without sharing personal data.
                        </p>
                      </div>
                    </div>
                  
                    <div className="space-y-4 sm:space-y-5">
                      <div className="space-y-1.5 sm:space-y-2.5">
                        <Label htmlFor="wallet-address" className="text-sm sm:text-base font-medium">Wallet Address</Label>
                        <div className="flex space-x-2">
                          <div className="relative flex-1">
                            <Input
                              id="wallet-address"
                              type="text"
                              placeholder="0x..."
                              value={walletAddress}
                              onChange={(e) => setWalletAddress(e.target.value)}
                              disabled={isVerifying || isConnected}
                              className={`pl-10 ${isConnected ? 'bg-muted/50 border-muted' : ''}`}
                            />
                            <span className="absolute left-3 top-2.5 text-muted-foreground">
                              <span className="material-icons text-sm">account_balance_wallet</span>
                            </span>
                          </div>
                          {!isConnected && (
                            <Button 
                              onClick={connectWallet} 
                              className="gap-1 bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:from-primary-700 hover:to-primary-600 px-2 sm:px-3"
                              disabled={isVerifying}
                              size="sm"
                            >
                              <span className="material-icons text-sm">link</span>
                              <span className="text-xs sm:text-sm">Connect</span>
                            </Button>
                          )}
                          {isConnected && (
                            <Button
                              variant="outline"
                              className="gap-1 border-green-500 text-green-600 px-2 sm:px-3"
                              disabled
                              size="sm"
                            >
                              <span className="material-icons text-sm">check_circle</span>
                              <span className="text-xs sm:text-sm">Connected</span>
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-1.5 sm:space-y-2.5">
                        <Label htmlFor="token-id" className="text-sm sm:text-base font-medium">Token ID</Label>
                        <div className="relative">
                          <Input
                            id="token-id"
                            type="text"
                            placeholder="Enter your NFT token ID"
                            value={tokenId}
                            onChange={(e) => setTokenId(e.target.value)}
                            disabled={isVerifying}
                            className="pl-10"
                          />
                          <span className="absolute left-3 top-2.5 text-muted-foreground">
                            <span className="material-icons text-sm">tag</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="px-4 sm:px-6 py-4 bg-muted/30 border-t flex justify-end">
                    <Button 
                      onClick={handleVerifyNft}
                      disabled={isVerifying || !walletAddress || !tokenId}
                      className={`gap-1 text-xs sm:text-sm ${(!isVerifying && walletAddress && tokenId) ? 'visual-pulsate' : ''}`}
                      size="sm"
                    >
                      {isVerifying ? (
                        <>
                          <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-icons text-sm">verified_user</span>
                          <span>Verify NFT</span>
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
                
                {verificationResult && (
                  <Card className="overflow-hidden border-0 shadow-md">
                    <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600" />
                    <CardHeader className="pb-4">
                      <div className="flex items-start">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mr-3">
                          <span className="material-icons text-emerald-600 dark:text-emerald-400">verified</span>
                        </div>
                        <div>
                          <CardTitle>Verification Successful</CardTitle>
                          <CardDescription>Token verified on the blockchain</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pb-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col space-y-1 bg-muted/30 p-3 rounded-md">
                          <p className="text-xs font-medium text-muted-foreground">Token ID</p>
                          <p className="font-medium text-sm truncate">{verificationResult.tokenId}</p>
                        </div>
                        
                        <div className="flex flex-col space-y-1 bg-muted/30 p-3 rounded-md">
                          <p className="text-xs font-medium text-muted-foreground">Status</p>
                          <p className="font-medium text-sm flex items-center">
                            <span className={`inline-block h-2 w-2 rounded-full mr-2 ${
                              verificationResult.statusText === 'VERIFIED' ? 'bg-green-500' : 
                              verificationResult.statusText === 'PENDING' ? 'bg-amber-500' : 'bg-red-500'
                            }`}></span>
                            {verificationResult.statusText}
                          </p>
                        </div>
                        
                        <div className="flex flex-col space-y-1 bg-muted/30 p-3 rounded-md">
                          <p className="text-xs font-medium text-muted-foreground">Verification Level</p>
                          <div className="flex items-center">
                            <span className="font-medium text-sm mr-2">{verificationResult.level}</span>
                            <div className="h-2 flex-1 bg-muted overflow-hidden rounded-full">
                              <div 
                                className="h-full bg-gradient-to-r from-primary-500 to-primary-400" 
                                style={{ width: `${verificationResult.level * 20}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-1 bg-muted/30 p-3 rounded-md">
                          <p className="text-xs font-medium text-muted-foreground">Verified On</p>
                          <p className="font-medium text-sm flex items-center">
                            <span className="material-icons text-xs mr-1.5">event</span>
                            {verificationResult.verificationDate.toLocaleString()}
                          </p>
                        </div>
                        
                        <div className="col-span-2 flex flex-col space-y-1 bg-muted/30 p-3 rounded-md">
                          <p className="text-xs font-medium text-muted-foreground">Verified By</p>
                          <p className="font-medium text-sm break-all">{verificationResult.verifier}</p>
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="pt-2 pb-4 flex space-x-2">
                      <Button variant="ghost" size="sm" className="text-xs">
                        <span className="material-icons text-xs mr-1">file_download</span>
                        Download Proof
                      </Button>
                      <Button size="sm" className="text-xs">
                        <span className="material-icons text-xs mr-1">share</span>
                        Share Verification
                      </Button>
                    </CardFooter>
                  </Card>
                )}
              </div>

              <div className="space-y-8">
                <Card className="overflow-hidden border-0 shadow-md">
                  <CardHeader className="pb-3 border-b border-muted">
                    <CardTitle>How Verification Works</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="p-6 space-y-6">
                      <div className="flex">
                        <div className="mr-4 flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary">
                            <span className="material-icons text-sm">filter_1</span>
                          </div>
                          <div className="w-0.5 flex-1 bg-muted my-2"></div>
                        </div>
                        <div>
                          <h3 className="text-base font-medium">Connect Wallet</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Link your blockchain wallet to the application to verify ownership of your NFT.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex">
                        <div className="mr-4 flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary">
                            <span className="material-icons text-sm">filter_2</span>
                          </div>
                          <div className="w-0.5 flex-1 bg-muted my-2"></div>
                        </div>
                        <div>
                          <h3 className="text-base font-medium">Verify Ownership</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            The system confirms that your wallet is the rightful owner of the identity NFT on the blockchain.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex">
                        <div className="mr-4 flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary">
                            <span className="material-icons text-sm">filter_3</span>
                          </div>
                          <div className="w-0.5 flex-1 bg-muted my-2"></div>
                        </div>
                        <div>
                          <h3 className="text-base font-medium">Check Verification Status</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            The NFT contains verification data that shows your identity has been validated by trusted authorities.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex">
                        <div className="mr-4">
                          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary">
                            <span className="material-icons text-sm">filter_4</span>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-base font-medium">Trust Score Updated</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Your trust score is automatically adjusted based on the verification level of your NFT.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-primary-50 dark:bg-primary-950/20 border-primary-100 dark:border-primary-900/30 overflow-hidden shadow-md">
                  <CardHeader className="pb-4">
                    <CardTitle>Benefits of NFT Authentication</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start">
                        <div className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary mr-3 shrink-0 mt-0.5">
                          <span className="material-icons text-sm">lock</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">Privacy-Focused</h4>
                          <p className="text-xs text-muted-foreground mt-1">Verify without sharing personal data</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary mr-3 shrink-0 mt-0.5">
                          <span className="material-icons text-sm">account_circle</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">Self-Sovereign</h4>
                          <p className="text-xs text-muted-foreground mt-1">You control your identity credentials</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary mr-3 shrink-0 mt-0.5">
                          <span className="material-icons text-sm">swap_horiz</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">Interoperable</h4>
                          <p className="text-xs text-muted-foreground mt-1">Works across different applications</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary mr-3 shrink-0 mt-0.5">
                          <span className="material-icons text-sm">verified</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">Secure</h4>
                          <p className="text-xs text-muted-foreground mt-1">Cryptographically verifiable on blockchain</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary mr-3 shrink-0 mt-0.5">
                          <span className="material-icons text-sm">share</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">Shareable</h4>
                          <p className="text-xs text-muted-foreground mt-1">Easily share verification status with others</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary mr-3 shrink-0 mt-0.5">
                          <span className="material-icons text-sm">history</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">Immutable History</h4>
                          <p className="text-xs text-muted-foreground mt-1">Complete audit trail of all verifications</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="mint">
            <Card>
              <CardHeader>
                <CardTitle>Mint Identity NFT</CardTitle>
                <CardDescription>Create a new identity NFT on the blockchain</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="mb-6">
                  <span className="material-icons mr-2">info</span>
                  <AlertTitle>This is a simulation</AlertTitle>
                  <AlertDescription>
                    In a real deployment, this would mint a new NFT on the Ethereum blockchain.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="mint-wallet">Wallet Address</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="mint-wallet"
                        type="text"
                        placeholder="0x..."
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        disabled={isVerifying || isConnected}
                        className="flex-1"
                      />
                      {!isConnected && (
                        <Button 
                          onClick={connectWallet} 
                          variant="outline"
                          disabled={isVerifying}
                        >
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Label>Identity Information</Label>
                    <div className="rounded-md border p-4 space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="fullname">Full Name</Label>
                          <Input 
                            id="fullname" 
                            type="text" 
                            placeholder="Enter your full name"
                            defaultValue={userData?.name || "Jane Cooper"}
                            disabled={isVerifying} 
                          />
                        </div>
                        <div>
                          <Label htmlFor="id-type">ID Type</Label>
                          <Input 
                            id="id-type" 
                            type="text" 
                            defaultValue="Personal" 
                            disabled={isVerifying} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <Button 
                  onClick={handleMintNft}
                  disabled={isVerifying || !walletAddress}
                  className="w-full"
                >
                  {isVerifying ? "Minting..." : "Mint Identity NFT"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="showcase">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <span className="material-icons mr-2 text-primary">badge</span>
                    Digital Identity Card
                  </CardTitle>
                  <CardDescription>Interactive 3D visualization of your blockchain-secured identity</CardDescription>
                </CardHeader>
                <CardContent className="p-0 overflow-hidden rounded-b-lg bg-gradient-to-b from-muted/50 to-muted">
                  {tokenId ? (
                    <div className="p-6">
                      <NftCard3D
                        walletAddress={walletAddress || "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"}
                        tokenId={tokenId}
                        ownerName={userData?.name || "Jane Cooper"}
                        verificationLevel={5}
                        issueDate={new Date().toLocaleDateString()}
                        backgroundColor="#1a1a2e"
                        highlightColor="#4361ee"
                      />
                      <p className="text-sm text-center mt-4 text-muted-foreground">
                        <span className="inline-flex items-center font-medium">
                          <span className="material-icons text-sm mr-1">touch_app</span>
                          Click to toggle rotation
                        </span>
                        <span className="mx-2">•</span>
                        <span className="inline-flex items-center font-medium">
                          <span className="material-icons text-sm mr-1">mouse</span>
                          Mouse over to interact
                        </span>
                      </p>
                    </div>
                  ) : (
                    <div className="h-96 flex items-center justify-center border-0 p-6">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                          <span className="material-icons text-2xl text-primary">view_in_ar</span>
                        </div>
                        <p className="text-muted-foreground mb-4">No NFT card available. Please verify or mint an NFT first.</p>
                        <Button variant="outline" onClick={() => setTokenId("123456789")} className="rounded-full px-6">
                          <span className="material-icons text-sm mr-2">visibility</span>
                          Show Demo Card
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <div className="space-y-6">
                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-primary-700 dark:text-primary-300">Card Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <span className="material-icons text-primary-600 mr-2 mt-0.5 text-sm">fingerprint</span>
                        <span className="text-sm">Unique Fibonacci spiral security pattern</span>
                      </li>
                      <li className="flex items-start">
                        <span className="material-icons text-primary-600 mr-2 mt-0.5 text-sm">qr_code_2</span>
                        <span className="text-sm">Scannable QR code for instant verification</span>
                      </li>
                      <li className="flex items-start">
                        <span className="material-icons text-primary-600 mr-2 mt-0.5 text-sm">verified_user</span>
                        <span className="text-sm">Shows current verification level</span>
                      </li>
                      <li className="flex items-start">
                        <span className="material-icons text-primary-600 mr-2 mt-0.5 text-sm">token</span>
                        <span className="text-sm">Linked to blockchain with tamper-proof history</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Card Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-3 mt-0.5">
                          <span className="font-semibold text-muted-foreground">1</span>
                        </div>
                        <div>
                          <h4 className="font-medium">Share Card</h4>
                          <p className="text-sm text-muted-foreground">Send your verification link to entities needing identity proof</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-3 mt-0.5">
                          <span className="font-semibold text-muted-foreground">2</span>
                        </div>
                        <div>
                          <h4 className="font-medium">QR Scanning</h4>
                          <p className="text-sm text-muted-foreground">Allow verification by letting others scan your card's QR code</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-3 mt-0.5">
                          <span className="font-semibold text-muted-foreground">3</span>
                        </div>
                        <div>
                          <h4 className="font-medium">Authentication</h4>
                          <p className="text-sm text-muted-foreground">Sign transactions with your wallet to prove identity</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="contract">
            <Card>
              <CardHeader>
                <CardTitle>FibonRoseID Smart Contract</CardTitle>
                <CardDescription>The Solidity smart contract that powers the identity NFTs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end mb-4">
                  <Button variant="outline" onClick={() => setShowContract(!showContract)}>
                    {showContract ? "Hide Contract" : "Show Contract Code"}
                  </Button>
                </div>
                
                {showContract ? (
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-4 overflow-auto max-h-[500px]">
                    <pre className="text-xs">
                      {IDENTITY_NFT_CONTRACT_SOURCE}
                    </pre>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Contract Features</h3>
                      <ul className="space-y-2">
                        <li className="flex items-start">
                          <span className="material-icons text-green-500 mr-2">check_circle</span>
                          <span>ERC-721 compatible NFT with extended verification functionality</span>
                        </li>
                        <li className="flex items-start">
                          <span className="material-icons text-green-500 mr-2">check_circle</span>
                          <span>Multi-level verification status tracking</span>
                        </li>
                        <li className="flex items-start">
                          <span className="material-icons text-green-500 mr-2">check_circle</span>
                          <span>Authorized verifier system for trusted third-party identity verification</span>
                        </li>
                        <li className="flex items-start">
                          <span className="material-icons text-green-500 mr-2">check_circle</span>
                          <span>Fibonacci-based trust scoring mechanism</span>
                        </li>
                        <li className="flex items-start">
                          <span className="material-icons text-green-500 mr-2">check_circle</span>
                          <span>Tamper-proof verification history stored on blockchain</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Technical Specifications</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Contract Standard</p>
                          <p>ERC-721</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Solidity Version</p>
                          <p>^0.8.0</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Dependencies</p>
                          <p>OpenZeppelin Contracts</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">License</p>
                          <p>MIT</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-10 mb-4">
          <div className="flex flex-col items-center text-center mb-8 px-4">
            <h2 className="text-2xl font-bold tracking-tight mb-2">Ecosystem Partners</h2>
            <p className="text-muted-foreground max-w-2xl text-sm sm:text-base">FibonroseTrust integrates with these trusted identity providers in the blockchain ecosystem</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
            {[
              { 
                name: "NegraSecurity Identity", 
                network: "Ethereum", 
                icon: "verified_user",
                description: "Enterprise-grade identity verification with full KYC compliance and legal backing.",
                color: "from-blue-500 to-blue-700"
              },
              { 
                name: "Decentralized ID", 
                network: "Polygon", 
                icon: "fingerprint",
                description: "Self-sovereign identity solution with biometric authentication and zero-knowledge proofs.",
                color: "from-purple-500 to-purple-700"
              },
              { 
                name: "VerifiableCredentials", 
                network: "Solana", 
                icon: "security",
                description: "High-throughput credentials platform for fast and low-cost identity verification.",
                color: "from-green-500 to-green-700"
              },
            ].map((collection, index) => (
              <Card key={index} className="overflow-hidden border-0 shadow-md">
                <div className={`h-2 bg-gradient-to-r ${collection.color}`} />
                <CardHeader className="flex flex-row items-start sm:items-center gap-3 pb-2 p-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center shrink-0">
                    <span className="material-icons text-lg sm:text-xl text-primary">{collection.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base sm:text-xl truncate">{collection.name}</CardTitle>
                    <CardDescription className="flex items-center text-xs sm:text-sm">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                      {collection.network} Network
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">{collection.description}</p>
                </CardContent>
                <CardFooter className="border-t bg-muted/40 pt-3 flex justify-between p-4">
                  <Button variant="ghost" size="sm" className="text-xs px-2 sm:px-3">
                    Learn More
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs px-2 sm:px-3">
                    <span className="material-icons text-sm mr-1">link</span>
                    Connect
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
