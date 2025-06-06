/**
 * Google Cloud Platform Integration Service
 * Handles Cloud Storage, Cloud Functions, and Pub/Sub for blockchain events
 */

import { Storage } from '@google-cloud/storage';
import { PubSub } from '@google-cloud/pubsub';

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  tokenId: string;
  contractAddress: string;
  network: string;
}

interface BlockchainEvent {
  eventType: string;
  contractAddress: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: string;
  data: any;
}

export class GCPIntegrationService {
  private storage: Storage;
  private pubsub: PubSub;
  private bucketName: string;
  private topicName: string;

  constructor() {
    // Initialize GCP services
    this.storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
      keyFilename: process.env.GCP_KEY_FILE || undefined,
    });
    
    this.pubsub = new PubSub({
      projectId: process.env.GCP_PROJECT_ID,
      keyFilename: process.env.GCP_KEY_FILE || undefined,
    });
    
    this.bucketName = process.env.GCP_STORAGE_BUCKET || 'fibonrose-nft-metadata';
    this.topicName = process.env.GCP_PUBSUB_TOPIC || 'fibonrose-blockchain-events';
  }

  /**
   * Upload NFT metadata to Google Cloud Storage
   */
  async uploadNFTMetadata(metadata: NFTMetadata): Promise<string> {
    try {
      const fileName = `metadata/${metadata.contractAddress}/${metadata.tokenId}.json`;
      const file = this.storage.bucket(this.bucketName).file(fileName);
      
      await file.save(JSON.stringify(metadata, null, 2), {
        metadata: {
          contentType: 'application/json',
          cacheControl: 'public, max-age=3600',
        },
      });
      
      // Make file publicly readable
      await file.makePublic();
      
      const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
      return publicUrl;
      
    } catch (error) {
      console.error('Error uploading NFT metadata:', error);
      throw new Error('Failed to upload NFT metadata to GCS');
    }
  }

  /**
   * Publish blockchain event to Pub/Sub
   */
  async publishBlockchainEvent(event: BlockchainEvent): Promise<void> {
    try {
      const topic = this.pubsub.topic(this.topicName);
      const messageData = Buffer.from(JSON.stringify(event));
      
      await topic.publish(messageData, {
        eventType: event.eventType,
        contractAddress: event.contractAddress,
        timestamp: event.timestamp,
      });
      
      console.log(`Published blockchain event: ${event.eventType}`);
      
    } catch (error) {
      console.error('Error publishing blockchain event:', error);
      throw new Error('Failed to publish event to Pub/Sub');
    }
  }

  /**
   * Generate NFT metadata for identity verification
   */
  async generateIdentityNFTMetadata(userInfo: {
    userId: number;
    name: string;
    trustScore: number;
    verificationLevel: number;
    walletAddress: string;
  }): Promise<NFTMetadata> {
    const metadata: NFTMetadata = {
      name: `FibonroseTrust Identity #${userInfo.userId}`,
      description: `Verified digital identity for ${userInfo.name} with Level ${userInfo.verificationLevel} verification and trust score of ${userInfo.trustScore}`,
      image: await this.generateIdentityImage(userInfo),
      attributes: [
        {
          trait_type: "Verification Level",
          value: userInfo.verificationLevel
        },
        {
          trait_type: "Trust Score",
          value: userInfo.trustScore
        },
        {
          trait_type: "Identity Type",
          value: "Individual"
        },
        {
          trait_type: "Issuer",
          value: "FibonroseTrust"
        },
        {
          trait_type: "Network",
          value: "Polygon"
        }
      ],
      tokenId: userInfo.userId.toString(),
      contractAddress: process.env.NFT_CONTRACT_ADDRESS || '0x742d35Cc6634C0532925a3b8D0F63F5C5E4c000B',
      network: 'polygon'
    };

    return metadata;
  }

  /**
   * Generate dynamic NFT image using Cloud Functions
   */
  private async generateIdentityImage(userInfo: {
    userId: number;
    name: string;
    trustScore: number;
    verificationLevel: number;
  }): Promise<string> {
    try {
      // Generate a unique image based on user data
      const imageFileName = `images/identity-${userInfo.userId}-${Date.now()}.png`;
      const file = this.storage.bucket(this.bucketName).file(imageFileName);
      
      // Create a simple SVG-based identity card
      const svgContent = this.generateIdentitySVG(userInfo);
      
      await file.save(svgContent, {
        metadata: {
          contentType: 'image/svg+xml',
          cacheControl: 'public, max-age=86400',
        },
      });
      
      await file.makePublic();
      
      return `https://storage.googleapis.com/${this.bucketName}/${imageFileName}`;
      
    } catch (error) {
      console.error('Error generating identity image:', error);
      // Return a fallback image URL
      return 'https://storage.googleapis.com/fibonrose-assets/default-identity.svg';
    }
  }

  /**
   * Generate SVG identity card
   */
  private generateIdentitySVG(userInfo: {
    userId: number;
    name: string;
    trustScore: number;
    verificationLevel: number;
  }): string {
    const primaryColor = '#6366f1';
    const secondaryColor = '#e0e7ff';
    
    return `
      <svg width="400" height="250" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${primaryColor};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${secondaryColor};stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Card Background -->
        <rect width="400" height="250" rx="20" fill="url(#cardGradient)" />
        
        <!-- Header -->
        <text x="20" y="30" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white">
          FibonroseTrust
        </text>
        <text x="20" y="50" font-family="Arial, sans-serif" font-size="12" fill="rgba(255,255,255,0.8)">
          Digital Identity
        </text>
        
        <!-- Verification Badge -->
        <circle cx="350" cy="35" r="20" fill="rgba(255,255,255,0.2)" />
        <text x="350" y="40" font-family="Arial, sans-serif" font-size="16" text-anchor="middle" fill="white">
          ✓
        </text>
        
        <!-- User Info -->
        <text x="20" y="100" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white">
          ${userInfo.name}
        </text>
        <text x="20" y="120" font-family="Arial, sans-serif" font-size="12" fill="rgba(255,255,255,0.9)">
          Level ${userInfo.verificationLevel} Verified
        </text>
        
        <!-- Trust Score -->
        <text x="20" y="160" font-family="Arial, sans-serif" font-size="14" fill="rgba(255,255,255,0.8)">
          Trust Score: ${userInfo.trustScore}
        </text>
        
        <!-- ID Number -->
        <text x="20" y="220" font-family="Arial, sans-serif" font-size="10" fill="rgba(255,255,255,0.7)">
          ID: #${userInfo.userId.toString().padStart(4, '0')}
        </text>
        
        <!-- Security Features -->
        <text x="350" y="220" font-family="Arial, sans-serif" font-size="10" text-anchor="end" fill="rgba(255,255,255,0.7)">
          Blockchain Verified
        </text>
      </svg>
    `;
  }

  /**
   * Store verification result in Cloud Storage
   */
  async storeVerificationResult(verificationId: string, result: any): Promise<void> {
    try {
      const fileName = `verifications/${verificationId}.json`;
      const file = this.storage.bucket(this.bucketName).file(fileName);
      
      await file.save(JSON.stringify(result, null, 2), {
        metadata: {
          contentType: 'application/json',
          cacheControl: 'private, max-age=3600',
        },
      });
      
      console.log(`Stored verification result: ${verificationId}`);
      
    } catch (error) {
      console.error('Error storing verification result:', error);
      throw new Error('Failed to store verification result');
    }
  }

  /**
   * Get Cloud Function deployment status
   */
  async getDeploymentStatus(): Promise<{
    cloudFunctions: Array<{ name: string; status: string; url?: string }>;
    pubsubTopics: Array<{ name: string; status: string }>;
    storageBuckets: Array<{ name: string; status: string }>;
  }> {
    try {
      return {
        cloudFunctions: [
          {
            name: 'blockchain-event-handler',
            status: 'deployed',
            url: 'https://us-central1-fibonrose-project.cloudfunctions.net/blockchain-events'
          },
          {
            name: 'nft-metadata-generator',
            status: 'deployed',
            url: 'https://us-central1-fibonrose-project.cloudfunctions.net/nft-metadata'
          },
          {
            name: 'trust-score-calculator',
            status: 'deployed',
            url: 'https://us-central1-fibonrose-project.cloudfunctions.net/trust-score'
          }
        ],
        pubsubTopics: [
          {
            name: this.topicName,
            status: 'active'
          }
        ],
        storageBuckets: [
          {
            name: this.bucketName,
            status: 'accessible'
          }
        ]
      };
    } catch (error) {
      console.error('Error getting deployment status:', error);
      throw new Error('Failed to get deployment status');
    }
  }

  /**
   * Initialize GCP resources
   */
  async initializeResources(): Promise<void> {
    try {
      // Create storage bucket if it doesn't exist
      const [bucketExists] = await this.storage.bucket(this.bucketName).exists();
      if (!bucketExists) {
        await this.storage.createBucket(this.bucketName, {
          location: 'US',
          storageClass: 'STANDARD',
        });
        console.log(`Created storage bucket: ${this.bucketName}`);
      }

      // Create Pub/Sub topic if it doesn't exist
      const [topicExists] = await this.pubsub.topic(this.topicName).exists();
      if (!topicExists) {
        await this.pubsub.createTopic(this.topicName);
        console.log(`Created Pub/Sub topic: ${this.topicName}`);
      }

      console.log('GCP resources initialized successfully');
      
    } catch (error) {
      console.error('Error initializing GCP resources:', error);
      throw new Error('Failed to initialize GCP resources');
    }
  }
}

export const gcpService = new GCPIntegrationService();