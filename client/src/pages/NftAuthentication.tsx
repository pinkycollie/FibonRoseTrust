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
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">NFT Authentication</h1>
        
        <Tabs defaultValue="verify" className="mt-6">
          <TabsList className="mb-6">
            <TabsTrigger value="verify">Verify NFT</TabsTrigger>
            <TabsTrigger value="mint">Mint ID NFT</TabsTrigger>
            <TabsTrigger value="showcase">NFT Showcase</TabsTrigger>
            <TabsTrigger value="contract">Smart Contract</TabsTrigger>
          </TabsList>
          
          <TabsContent value="verify">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-primary-100 dark:bg-primary-900 rounded-md p-3 mr-4">
                      <span className="material-icons text-primary-600 dark:text-primary-400">token</span>
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">NFT Verification</h2>
                      <CardDescription>Connect your NFT to authenticate your identity.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Label htmlFor="wallet-address">Wallet Address</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="wallet-address"
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
                      <Label htmlFor="token-id">Token ID</Label>
                      <Input
                        id="token-id"
                        type="text"
                        placeholder="Enter token ID"
                        value={tokenId}
                        onChange={(e) => setTokenId(e.target.value)}
                        disabled={isVerifying}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t border-gray-200 dark:border-gray-700 pt-4">
                  <Button 
                    onClick={handleVerifyNft}
                    disabled={isVerifying || !walletAddress || !tokenId}
                  >
                    {isVerifying ? "Verifying..." : "Verify NFT"}
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">About NFT Authentication</h2>
                </CardHeader>
                <CardContent>
                  <div className="prose dark:prose-invert">
                    <p>NFT authentication is a secure way to verify your identity using blockchain technology.</p>
                    
                    <h3 className="text-base font-medium mt-4">How it works</h3>
                    <ul className="space-y-1 list-disc pl-5 text-sm">
                      <li>Connect your wallet containing verification NFTs</li>
                      <li>We verify ownership of specific tokens on the blockchain</li>
                      <li>Your identity is verified without sharing personal information</li>
                      <li>Trust score increases based on the verified NFTs</li>
                    </ul>
                    
                    <Separator className="my-4" />
                    
                    <h3 className="text-base font-medium">Benefits</h3>
                    <ul className="space-y-1 list-disc pl-5 text-sm">
                      <li>Privacy-focused: verify without sharing personal data</li>
                      <li>Self-sovereign: you control your identity credentials</li>
                      <li>Interoperable: works across different applications</li>
                      <li>Secure: cryptographically verifiable on the blockchain</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {verificationResult && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Verification Result</CardTitle>
                  <CardDescription>Details from the blockchain for this NFT</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Token ID</p>
                      <p className="font-medium">{verificationResult.tokenId}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                      <p className="font-medium">{verificationResult.statusText}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Verification Level</p>
                      <p className="font-medium">{verificationResult.level}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Verified On</p>
                      <p className="font-medium">{verificationResult.verificationDate.toLocaleString()}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Verified By</p>
                      <p className="font-medium break-all">{verificationResult.verifier}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
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
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your Digital Identity Card</CardTitle>
                  <CardDescription>Interactive 3D visualization of your identity NFT</CardDescription>
                </CardHeader>
                <CardContent>
                  {tokenId ? (
                    <NftCard3D
                      walletAddress={walletAddress || "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"}
                      tokenId={tokenId}
                      ownerName={userData?.name || "Jane Cooper"}
                      verificationLevel={5}
                      issueDate={new Date().toLocaleDateString()}
                      backgroundColor="#1a1a2e"
                      highlightColor="#4361ee"
                    />
                  ) : (
                    <div className="h-96 flex items-center justify-center border border-dashed rounded-lg">
                      <div className="text-center">
                        <span className="material-icons text-4xl text-gray-400 mb-2">view_in_ar</span>
                        <p className="text-gray-500">No NFT selected. Please verify or mint an NFT first.</p>
                        <Button variant="outline" className="mt-4" onClick={() => setTokenId("123456789")}>
                          Show Demo Card
                        </Button>
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-center mt-4 text-gray-500">
                    Click to toggle rotation. Move your mouse over the card to interact.
                  </p>
                </CardContent>
              </Card>
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

        <div className="mt-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Compatible NFT Collections</h2>
              <CardDescription>These NFT collections can be used for identity verification.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: "NegraSecurity Identity", network: "Ethereum", icon: "verified_user" },
                  { name: "Decentralized ID", network: "Polygon", icon: "fingerprint" },
                  { name: "VerifiableCredentials", network: "Solana", icon: "security" },
                ].map((collection, index) => (
                  <div key={index} className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-md">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                      <span className="material-icons text-primary-600 dark:text-primary-400">{collection.icon}</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{collection.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{collection.network}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
