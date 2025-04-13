import { ethers } from 'ethers';

// ABI for the FibonroseTrust NFT contract
// This is a simplified ABI for demonstration, in production you would use the full ABI
const NFT_IDENTITY_ABI = [
  // Read-only functions
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function getApproved(uint256 tokenId) view returns (address)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
  "function getVerificationStatus(uint256 tokenId) view returns (uint8)",
  "function getVerificationLevel(uint256 tokenId) view returns (uint8)",
  "function getVerificationTimestamp(uint256 tokenId) view returns (uint256)",
  "function getVerifier(uint256 tokenId) view returns (address)",
  
  // State-changing functions
  "function approve(address to, uint256 tokenId)",
  "function setApprovalForAll(address operator, bool approved)",
  "function transferFrom(address from, address to, uint256 tokenId)",
  "function safeTransferFrom(address from, address to, uint256 tokenId)",
  "function safeTransferFrom(address from, address to, uint256 tokenId, bytes data)",
  "function mint(address to, uint256 tokenId, string uri)",
  "function verifyIdentity(uint256 tokenId, uint8 status, string metadata)",
  "function authorize(address verifier, bool authorized)",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)",
  "event ApprovalForAll(address indexed owner, address indexed operator, bool approved)",
  "event IdentityVerified(uint256 indexed tokenId, uint8 status, address indexed verifier, uint256 timestamp)",
  "event VerifierAuthorized(address indexed verifier, bool authorized)"
];

// FibonroseTrust NFT Contract Interface
interface IdentityNFT {
  // Basic ERC721 functions
  balanceOf: (owner: string) => Promise<number>;
  ownerOf: (tokenId: string) => Promise<string>;
  tokenURI: (tokenId: string) => Promise<string>;
  getApproved: (tokenId: string) => Promise<string>;
  isApprovedForAll: (owner: string, operator: string) => Promise<boolean>;
  
  // FibonroseTrust specific functions
  getVerificationStatus: (tokenId: string) => Promise<number>;
  getVerificationLevel: (tokenId: string) => Promise<number>;
  getVerificationTimestamp: (tokenId: string) => Promise<number>;
  getVerifier: (tokenId: string) => Promise<string>;
  
  // State-changing functions (requires signing)
  approve: (to: string, tokenId: string) => Promise<ethers.ContractTransaction>;
  setApprovalForAll: (operator: string, approved: boolean) => Promise<ethers.ContractTransaction>;
  transferFrom: (from: string, to: string, tokenId: string) => Promise<ethers.ContractTransaction>;
  safeTransferFrom: (from: string, to: string, tokenId: string, data?: string) => Promise<ethers.ContractTransaction>;
  mint: (to: string, tokenId: string, uri: string) => Promise<ethers.ContractTransaction>;
  verifyIdentity: (tokenId: string, status: number, metadata: string) => Promise<ethers.ContractTransaction>;
  authorize: (verifier: string, authorized: boolean) => Promise<ethers.ContractTransaction>;
}

// Status codes for identity verification
export enum VerificationStatus {
  PENDING = 0,
  VERIFIED = 1,
  REJECTED = 2,
  REVOKED = 3
}

// Smart contract addresses for different networks
interface NetworkContracts {
  identityNft: string;
  verifierRegistry: string;
}

const NETWORK_CONTRACTS: Record<string, NetworkContracts> = {
  // For testing on Goerli testnet
  '5': {
    identityNft: '0x8B791913eB335c632ABC43DCA4EBcAD1ed34836c', // Example address, replace with actual
    verifierRegistry: '0x9D85F2c0D96c5A91CCf7f7D76e5e343e234B45D9', // Example address, replace with actual
  },
  // For mainnet
  '1': {
    identityNft: '0x0000000000000000000000000000000000000000', // Replace with actual
    verifierRegistry: '0x0000000000000000000000000000000000000000', // Replace with actual
  },
  // Polygon mainnet
  '137': {
    identityNft: '0x0000000000000000000000000000000000000000', // Replace with actual
    verifierRegistry: '0x0000000000000000000000000000000000000000', // Replace with actual
  }
};

/**
 * Initialize a connection to the blockchain and return contract interfaces
 */
export async function initializeBlockchain() {
  // Check if MetaMask or another web3 provider is available
  if (!window.ethereum) {
    throw new Error('No Ethereum provider found. Please install MetaMask or similar wallet.');
  }

  try {
    // Request account access
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    // Create ethers provider and signer
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    // Get current network
    const network = await provider.getNetwork();
    const chainId = network.chainId.toString();
    
    // Check if we support this network
    if (!NETWORK_CONTRACTS[chainId]) {
      throw new Error(`Unsupported network (Chain ID: ${chainId}). Please switch to a supported network.`);
    }
    
    // Get contract addresses for the current network
    const { identityNft } = NETWORK_CONTRACTS[chainId];
    
    // Create contract instance
    const nftContract = new ethers.Contract(identityNft, NFT_IDENTITY_ABI, signer) as unknown as IdentityNFT;
    
    return {
      provider,
      signer,
      accounts,
      nftContract,
      chainId
    };
  } catch (error) {
    console.error('Error initializing blockchain connection:', error);
    throw error;
  }
}

/**
 * Verify ownership of an NFT
 */
export async function verifyNftOwnership(walletAddress: string, tokenId: string): Promise<boolean> {
  try {
    const { nftContract } = await initializeBlockchain();
    const owner = await nftContract.ownerOf(tokenId);
    return owner.toLowerCase() === walletAddress.toLowerCase();
  } catch (error) {
    console.error('Error verifying NFT ownership:', error);
    return false;
  }
}

/**
 * Get NFT verification details
 */
export async function getNftVerificationDetails(tokenId: string) {
  try {
    const { nftContract } = await initializeBlockchain();
    
    const [status, level, timestamp, verifier] = await Promise.all([
      nftContract.getVerificationStatus(tokenId),
      nftContract.getVerificationLevel(tokenId),
      nftContract.getVerificationTimestamp(tokenId),
      nftContract.getVerifier(tokenId)
    ]);
    
    // Convert timestamp from blockchain (seconds) to JS Date
    const verificationDate = new Date(timestamp * 1000);
    
    return {
      tokenId,
      status,
      statusText: VerificationStatus[status],
      level,
      verificationDate,
      verifier
    };
  } catch (error) {
    console.error('Error getting NFT verification details:', error);
    throw error;
  }
}

/**
 * Mint a new identity NFT
 */
export async function mintIdentityNft(recipientAddress: string, metadataUri: string): Promise<string> {
  try {
    const { nftContract, signer } = await initializeBlockchain();
    
    // Generate a unique token ID based on timestamp and random number
    const timestamp = Math.floor(Date.now() / 1000);
    const randomPart = Math.floor(Math.random() * 1000000);
    const tokenId = `${timestamp}${randomPart}`;
    
    // Mint the NFT
    const tx = await nftContract.mint(recipientAddress, tokenId, metadataUri);
    
    // In ethers v6, wait() is no longer available directly on ContractTransaction
    // We would use provider.waitForTransaction() in real implementation
    // For this demo, we'll just log the transaction
    console.log('NFT minting transaction submitted:', tx);
    
    return tokenId;
  } catch (error) {
    console.error('Error minting identity NFT:', error);
    throw error;
  }
}

/**
 * Verify an identity NFT (can only be called by authorized verifiers)
 */
export async function verifyIdentity(tokenId: string, status: VerificationStatus, metadata: string): Promise<boolean> {
  try {
    const { nftContract } = await initializeBlockchain();
    
    // Submit verification transaction
    const tx = await nftContract.verifyIdentity(tokenId, status, metadata);
    
    // In ethers v6, wait() is no longer available directly on ContractTransaction
    // We would use provider.waitForTransaction() in real implementation
    console.log('Identity verification transaction submitted:', tx);
    
    return true;
  } catch (error) {
    console.error('Error verifying identity:', error);
    return false;
  }
}

/**
 * Authorize a verifier address
 */
export async function authorizeVerifier(verifierAddress: string, authorized: boolean): Promise<boolean> {
  try {
    const { nftContract } = await initializeBlockchain();
    
    // Submit authorization transaction
    const tx = await nftContract.authorize(verifierAddress, authorized);
    
    // In ethers v6, wait() is no longer available directly on ContractTransaction
    // We would use provider.waitForTransaction() in real implementation
    console.log(`Verifier ${authorized ? 'authorization' : 'deauthorization'} transaction submitted:`, tx);
    
    return true;
  } catch (error) {
    console.error('Error authorizing verifier:', error);
    return false;
  }
}

/**
 * Get the metadata for an NFT
 */
export async function getNftMetadata(tokenId: string): Promise<any> {
  try {
    const { nftContract } = await initializeBlockchain();
    
    // Get token URI
    const uri = await nftContract.tokenURI(tokenId);
    
    // Fetch metadata from URI
    // If IPFS, use appropriate gateway
    let url = uri;
    if (uri.startsWith('ipfs://')) {
      url = uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    
    const response = await fetch(url);
    const metadata = await response.json();
    
    return metadata;
  } catch (error) {
    console.error('Error getting NFT metadata:', error);
    throw error;
  }
}

// Define the actual smart contract code that would be deployed
export const IDENTITY_NFT_CONTRACT_SOURCE = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FibonRoseID
 * @dev ERC721 Identity NFT with verification functionality
 */
contract FibonRoseID is ERC721URIStorage, Ownable {
    // Verification status enum
    enum VerificationStatus {
        PENDING,
        VERIFIED,
        REJECTED,
        REVOKED
    }
    
    // Verification info struct
    struct VerificationInfo {
        VerificationStatus status;
        uint8 level;
        uint256 timestamp;
        address verifier;
        string metadata;
    }
    
    // Mapping from token ID to verification info
    mapping(uint256 => VerificationInfo) private _verifications;
    
    // Mapping of authorized verifiers
    mapping(address => bool) private _verifiers;
    
    // Events
    event IdentityVerified(uint256 indexed tokenId, uint8 status, address indexed verifier, uint256 timestamp);
    event VerifierAuthorized(address indexed verifier, bool authorized);
    
    constructor() ERC721("FibonRoseID", "FIBID") {
        // Initialize the contract owner as the first verifier
        _verifiers[owner()] = true;
        emit VerifierAuthorized(owner(), true);
    }
    
    /**
     * @dev Mint a new identity NFT
     * @param to The recipient of the NFT
     * @param tokenId The token ID
     * @param uri The metadata URI
     */
    function mint(address to, uint256 tokenId, string memory uri) public {
        // Only owner can mint new tokens
        require(msg.sender == owner(), "Only owner can mint");
        
        // Mint the token
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        // Initialize verification info as pending
        _verifications[tokenId] = VerificationInfo({
            status: VerificationStatus.PENDING,
            level: 0,
            timestamp: block.timestamp,
            verifier: address(0),
            metadata: ""
        });
    }
    
    /**
     * @dev Verify an identity NFT
     * @param tokenId The token ID to verify
     * @param status The verification status to set
     * @param metadata Additional verification metadata (e.g., JSON string)
     */
    function verifyIdentity(uint256 tokenId, uint8 status, string memory metadata) public {
        // Check that the token exists
        require(_exists(tokenId), "Token does not exist");
        
        // Check that the caller is an authorized verifier
        require(_verifiers[msg.sender], "Not authorized as verifier");
        
        // Convert status to enum
        VerificationStatus newStatus = VerificationStatus(status);
        
        // Calculate new level based on Fibonacci sequence (simplified)
        uint8 newLevel = calculateLevel(newStatus);
        
        // Update verification info
        _verifications[tokenId] = VerificationInfo({
            status: newStatus,
            level: newLevel,
            timestamp: block.timestamp,
            verifier: msg.sender,
            metadata: metadata
        });
        
        // Emit event
        emit IdentityVerified(tokenId, status, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Calculate verification level based on status
     * @param status The verification status
     * @return The calculated level
     */
    function calculateLevel(VerificationStatus status) private pure returns (uint8) {
        if (status == VerificationStatus.VERIFIED) {
            return 5; // Simplified, in a real implementation this would use Fibonacci logic
        } else if (status == VerificationStatus.PENDING) {
            return 1;
        } else {
            return 0;
        }
    }
    
    /**
     * @dev Authorize or deauthorize a verifier
     * @param verifier The address to authorize
     * @param authorized Whether to authorize or deauthorize
     */
    function authorize(address verifier, bool authorized) public onlyOwner {
        _verifiers[verifier] = authorized;
        emit VerifierAuthorized(verifier, authorized);
    }
    
    /**
     * @dev Check if an address is an authorized verifier
     * @param verifier The address to check
     * @return Whether the address is authorized
     */
    function isVerifier(address verifier) public view returns (bool) {
        return _verifiers[verifier];
    }
    
    /**
     * @dev Get verification status of a token
     * @param tokenId The token ID to check
     * @return The verification status
     */
    function getVerificationStatus(uint256 tokenId) public view returns (uint8) {
        require(_exists(tokenId), "Token does not exist");
        return uint8(_verifications[tokenId].status);
    }
    
    /**
     * @dev Get verification level of a token
     * @param tokenId The token ID to check
     * @return The verification level
     */
    function getVerificationLevel(uint256 tokenId) public view returns (uint8) {
        require(_exists(tokenId), "Token does not exist");
        return _verifications[tokenId].level;
    }
    
    /**
     * @dev Get verification timestamp of a token
     * @param tokenId The token ID to check
     * @return The verification timestamp
     */
    function getVerificationTimestamp(uint256 tokenId) public view returns (uint256) {
        require(_exists(tokenId), "Token does not exist");
        return _verifications[tokenId].timestamp;
    }
    
    /**
     * @dev Get verifier of a token
     * @param tokenId The token ID to check
     * @return The verifier address
     */
    function getVerifier(uint256 tokenId) public view returns (address) {
        require(_exists(tokenId), "Token does not exist");
        return _verifications[tokenId].verifier;
    }
    
    /**
     * @dev Get verification metadata of a token
     * @param tokenId The token ID to check
     * @return The verification metadata
     */
    function getVerificationMetadata(uint256 tokenId) public view returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return _verifications[tokenId].metadata;
    }
}
`;

// Add global TypeScript definitions for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (request: { method: string; params?: any[] }) => Promise<any>;
      on: (eventName: string, callback: (...args: any[]) => void) => void;
    };
  }
}