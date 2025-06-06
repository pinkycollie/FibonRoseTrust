import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface WalletInfo {
  address: string;
  balance: string;
  network: string;
  connected: boolean;
}

export function WalletConnection() {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    setIsLoading(true);
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        const accounts = await window.ethereum.request({ 
          method: 'eth_accounts' 
        });
        
        if (accounts.length > 0) {
          const balance = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [accounts[0], 'latest']
          });
          
          const network = await window.ethereum.request({
            method: 'net_version'
          });
          
          setWallet({
            address: accounts[0],
            balance: (parseInt(balance, 16) / 1e18).toFixed(4),
            network: getNetworkName(network),
            connected: true
          });
        }
      }
    } catch (error) {
      console.error('Error checking wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast({
        title: "Wallet not found",
        description: "Please install MetaMask or another Web3 wallet",
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      if (accounts.length > 0) {
        const balance = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [accounts[0], 'latest']
        });
        
        const network = await window.ethereum.request({
          method: 'net_version'
        });
        
        setWallet({
          address: accounts[0],
          balance: (parseInt(balance, 16) / 1e18).toFixed(4),
          network: getNetworkName(network),
          connected: true
        });

        toast({
          title: "Wallet connected",
          description: `Connected to ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWallet(null);
    toast({
      title: "Wallet disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  const getNetworkName = (networkId: string) => {
    const networks: Record<string, string> = {
      '1': 'Ethereum Mainnet',
      '137': 'Polygon',
      '56': 'BSC',
      '43114': 'Avalanche',
      '250': 'Fantom',
      '42161': 'Arbitrum',
      '10': 'Optimism'
    };
    return networks[networkId] || `Network ${networkId}`;
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(38)}`;
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2">
          <span className="material-icons text-primary-500">account_balance_wallet</span>
          <span>Web3 Wallet</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {wallet ? (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Address</span>
                <Badge variant="secondary" className="font-mono text-xs">
                  {formatAddress(wallet.address)}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Balance</span>
                <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                  {wallet.balance} ETH
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Network</span>
                <Badge variant="outline" className="text-xs">
                  <span className="h-2 w-2 bg-green-500 rounded-full mr-1"></span>
                  {wallet.network}
                </Badge>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigator.clipboard.writeText(wallet.address)}
                className="flex-1"
              >
                <span className="material-icons text-sm mr-1">content_copy</span>
                Copy Address
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={disconnectWallet}
                className="flex-1"
              >
                <span className="material-icons text-sm mr-1">logout</span>
                Disconnect
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Connect your Web3 wallet to enable blockchain verification and NFT authentication.
            </p>
            <Button 
              onClick={connectWallet} 
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <span className="material-icons animate-spin text-sm mr-2">refresh</span>
                  Connecting...
                </>
              ) : (
                <>
                  <span className="material-icons text-sm mr-2">account_balance_wallet</span>
                  Connect Wallet
                </>
              )}
            </Button>
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="material-icons text-sm">info</span>
              <span>Supports MetaMask, WalletConnect, and other Web3 wallets</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Extend window type for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}