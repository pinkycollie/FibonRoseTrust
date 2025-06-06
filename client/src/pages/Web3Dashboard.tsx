import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BlockchainVerification } from '@/components/web3/BlockchainVerification';
import { Button } from '@/components/ui/button';

export default function Web3Dashboard() {
  const [nftMintingProgress, setNftMintingProgress] = useState(0);
  const [isMinting, setIsMinting] = useState(false);

  const handleMintNFT = async () => {
    setIsMinting(true);
    setNftMintingProgress(0);
    
    // Simulate minting process with progress updates
    const progressSteps = [
      { progress: 20, message: "Connecting to GCP Cloud Functions..." },
      { progress: 40, message: "Generating NFT metadata..." },
      { progress: 60, message: "Uploading to IPFS via GCP..." },
      { progress: 80, message: "Submitting to blockchain..." },
      { progress: 100, message: "NFT minted successfully!" }
    ];
    
    for (const step of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setNftMintingProgress(step.progress);
    }
    
    setIsMinting(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Web3 Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Blockchain-powered identity verification with GCP integration
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <span className="material-icons text-xs mr-1">cloud</span>
            GCP Connected
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="blockchain" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-none lg:flex">
          <TabsTrigger value="blockchain" className="text-xs sm:text-sm flex items-center justify-center lg:justify-start">
            <span className="material-icons text-sm mr-1 lg:mr-2">link</span>
            <span className="hidden sm:inline">Blockchain</span>
          </TabsTrigger>
          <TabsTrigger value="nft" className="text-xs sm:text-sm flex items-center justify-center lg:justify-start">
            <span className="material-icons text-sm mr-1 lg:mr-2">token</span>
            <span className="hidden sm:inline">NFT ID</span>
          </TabsTrigger>
          <TabsTrigger value="gcp" className="text-xs sm:text-sm flex items-center justify-center lg:justify-start">
            <span className="material-icons text-sm mr-1 lg:mr-2">cloud</span>
            <span className="hidden sm:inline">GCP</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="blockchain" className="mt-6">
          <BlockchainVerification />
        </TabsContent>

        <TabsContent value="nft" className="mt-6 space-y-6">
          {/* NFT Identity Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span className="material-icons text-primary-500">badge</span>
                <span>NFT Identity Card</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* NFT Preview */}
                <div className="space-y-4">
                  <div className="aspect-square bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 to-primary-800 rounded-xl p-6 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-primary-900 dark:text-primary-100">FibonroseTrust</h3>
                        <p className="text-sm text-primary-700 dark:text-primary-300">Digital Identity</p>
                      </div>
                      <span className="material-icons text-2xl text-primary-600">verified_user</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <img 
                          className="h-12 w-12 rounded-full border-2 border-primary-300"
                          src="https://images.unsplash.com/photo-1502378735452-bc7d86632805?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=200&fit=max&s=aa3a807e1bbdfd4364d1f449eaa96d82"
                          alt="Identity"
                        />
                        <div>
                          <p className="font-medium text-primary-900 dark:text-primary-100">Jane Cooper</p>
                          <p className="text-xs text-primary-600 dark:text-primary-400">Level 3 Verified</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-primary-700 dark:text-primary-300">
                        <span>Trust Score: 21</span>
                        <span>ID: #4729</span>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="inline-flex items-center space-x-1 bg-primary-200 dark:bg-primary-800 rounded-full px-3 py-1">
                        <span className="material-icons text-xs text-primary-700 dark:text-primary-300">security</span>
                        <span className="text-xs font-medium text-primary-700 dark:text-primary-300">Blockchain Verified</span>
                      </div>
                    </div>
                  </div>
                  
                  {isMinting && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Minting Progress</span>
                        <span>{nftMintingProgress}%</span>
                      </div>
                      <Progress value={nftMintingProgress} className="h-2" />
                    </div>
                  )}
                </div>
                
                {/* NFT Details */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Token Standard</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">ERC-721</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Network</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Polygon</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Minted</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Jan 15, 2024</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Gas Fee</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">0.015 MATIC</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Attributes</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Verification Level</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">Level 3</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Trust Score</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">21/89</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Identity Type</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">Individual</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Issuer</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">FibonroseTrust</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleMintNFT}
                    disabled={isMinting}
                    className="w-full"
                  >
                    {isMinting ? (
                      <>
                        <span className="material-icons animate-spin text-sm mr-2">refresh</span>
                        Minting NFT...
                      </>
                    ) : (
                      <>
                        <span className="material-icons text-sm mr-2">add_circle</span>
                        Mint New NFT ID
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gcp" className="mt-6 space-y-6">
          {/* GCP Services Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span className="material-icons text-primary-500">cloud_queue</span>
                <span>Google Cloud Platform Integration</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <span className="material-icons text-green-500">cloud_upload</span>
                    <div>
                      <h3 className="font-medium text-green-800 dark:text-green-200">Cloud Storage</h3>
                      <p className="text-sm text-green-600 dark:text-green-400">NFT metadata storage</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Badge variant="outline" className="text-green-700 border-green-700">
                      <span className="h-2 w-2 bg-green-500 rounded-full mr-1"></span>
                      Online
                    </Badge>
                  </div>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <span className="material-icons text-blue-500">functions</span>
                    <div>
                      <h3 className="font-medium text-blue-800 dark:text-blue-200">Cloud Functions</h3>
                      <p className="text-sm text-blue-600 dark:text-blue-400">Blockchain event handlers</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Badge variant="outline" className="text-blue-700 border-blue-700">
                      <span className="h-2 w-2 bg-blue-500 rounded-full mr-1"></span>
                      Active
                    </Badge>
                  </div>
                </div>
                
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <span className="material-icons text-purple-500">hub</span>
                    <div>
                      <h3 className="font-medium text-purple-800 dark:text-purple-200">Pub/Sub</h3>
                      <p className="text-sm text-purple-600 dark:text-purple-400">Real-time messaging</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Badge variant="outline" className="text-purple-700 border-purple-700">
                      <span className="h-2 w-2 bg-purple-500 rounded-full mr-1"></span>
                      Listening
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Endpoints */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span className="material-icons text-primary-500">api</span>
                <span>API Endpoints</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Blockchain Events</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">https://fibonrose-events.cloudfunctions.net</p>
                  </div>
                  <Badge variant="outline" className="text-green-700 border-green-700">200</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">NFT Metadata</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">https://fibonrose-nft.cloudfunctions.net</p>
                  </div>
                  <Badge variant="outline" className="text-green-700 border-green-700">200</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Trust Score API</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">https://fibonrose-trust.cloudfunctions.net</p>
                  </div>
                  <Badge variant="outline" className="text-green-700 border-green-700">200</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}