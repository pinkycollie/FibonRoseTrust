import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { WalletConnection } from './WalletConnection';

interface BlockchainTransaction {
  hash: string;
  type: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
  gasUsed?: string;
  blockNumber?: number;
}

export function BlockchainVerification() {
  const [transactions, setTransactions] = useState<BlockchainTransaction[]>([
    {
      hash: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890',
      type: 'Identity Verification',
      status: 'confirmed',
      timestamp: '2024-01-15T10:30:00Z',
      gasUsed: '0.002',
      blockNumber: 18847291
    },
    {
      hash: '0x9876543210fedcba0987654321fedcba0987654321fedcba0987654321fedcba',
      type: 'NFT Mint',
      status: 'confirmed',
      timestamp: '2024-01-14T15:45:00Z',
      gasUsed: '0.015',
      blockNumber: 18845103
    },
    {
      hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      type: 'Trust Score Update',
      status: 'pending',
      timestamp: '2024-01-16T08:20:00Z'
    }
  ]);
  
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  const initiateBlockchainVerification = async () => {
    setIsVerifying(true);
    
    try {
      // Simulate blockchain verification process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newTransaction: BlockchainTransaction = {
        hash: '0x' + Math.random().toString(16).substring(2, 66),
        type: 'Identity Verification',
        status: 'pending',
        timestamp: new Date().toISOString()
      };
      
      setTransactions(prev => [newTransaction, ...prev]);
      
      toast({
        title: "Verification initiated",
        description: "Your identity verification has been submitted to the blockchain",
      });
      
      // Simulate confirmation after delay
      setTimeout(() => {
        setTransactions(prev => 
          prev.map(tx => 
            tx.hash === newTransaction.hash 
              ? { ...tx, status: 'confirmed', gasUsed: '0.003', blockNumber: 18850000 }
              : tx
          )
        );
        
        toast({
          title: "Verification confirmed",
          description: "Your identity verification has been confirmed on-chain",
        });
      }, 5000);
      
    } catch (error) {
      toast({
        title: "Verification failed",
        description: "Failed to submit verification to blockchain",
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const formatHash = (hash: string) => {
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Wallet Connection */}
      <WalletConnection />
      
      {/* Blockchain Verification Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span className="material-icons text-primary-500">verified_user</span>
            <span>Blockchain Verification</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="material-icons text-3xl text-blue-500 mb-2 block">security</span>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Identity</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Blockchain verified</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="material-icons text-3xl text-purple-500 mb-2 block">token</span>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">NFT ID</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Minted on-chain</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="material-icons text-3xl text-green-500 mb-2 block">trending_up</span>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Trust Score</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Immutable record</p>
            </div>
          </div>
          
          <Button 
            onClick={initiateBlockchainVerification}
            disabled={isVerifying}
            className="w-full"
          >
            {isVerifying ? (
              <>
                <span className="material-icons animate-spin text-sm mr-2">refresh</span>
                Verifying on Blockchain...
              </>
            ) : (
              <>
                <span className="material-icons text-sm mr-2">add_circle</span>
                Create New Verification
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span className="material-icons text-primary-500">receipt_long</span>
            <span>Blockchain Transactions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.map((tx, index) => (
              <div key={tx.hash} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="material-icons text-sm text-gray-500">link</span>
                    <span className="font-mono text-sm text-gray-900 dark:text-gray-100">
                      {formatHash(tx.hash)}
                    </span>
                  </div>
                  <Badge className={getStatusColor(tx.status)}>
                    {tx.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Type:</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{tx.type}</p>
                  </div>
                  
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Date:</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(tx.timestamp)}</p>
                  </div>
                  
                  {tx.gasUsed && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Gas:</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{tx.gasUsed} ETH</p>
                    </div>
                  )}
                  
                  {tx.blockNumber && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Block:</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100">#{tx.blockNumber}</p>
                    </div>
                  )}
                </div>
                
                {tx.status === 'pending' && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-500 dark:text-gray-400">Confirmation Progress</span>
                      <span className="text-gray-500 dark:text-gray-400">2/3 confirmations</span>
                    </div>
                    <Progress value={67} className="h-2" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* GCP Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span className="material-icons text-primary-500">cloud</span>
            <span>GCP Integration</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="material-icons text-green-500">check_circle</span>
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">Cloud Storage</p>
                  <p className="text-sm text-green-600 dark:text-green-300">Connected to GCS bucket</p>
                </div>
              </div>
              <Badge variant="outline" className="text-green-700 border-green-700">
                Active
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="material-icons text-blue-500">memory</span>
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-200">Cloud Functions</p>
                  <p className="text-sm text-blue-600 dark:text-blue-300">Blockchain event handlers</p>
                </div>
              </div>
              <Badge variant="outline" className="text-blue-700 border-blue-700">
                Running
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="material-icons text-purple-500">hub</span>
                <div>
                  <p className="font-medium text-purple-800 dark:text-purple-200">Pub/Sub</p>
                  <p className="text-sm text-purple-600 dark:text-purple-300">Real-time blockchain events</p>
                </div>
              </div>
              <Badge variant="outline" className="text-purple-700 border-purple-700">
                Listening
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}