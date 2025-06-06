/**
 * Google Sheets Integration Service
 * Simple data sync for TikTok-friendly social media optimization
 */

import { google } from 'googleapis';

interface UserVerificationData {
  userId: number;
  username: string;
  trustScore: number;
  verificationLevel: number;
  walletAddress?: string;
  nftTokenId?: string;
  socialMediaOptimized: boolean;
  tiktokReady: boolean;
}

interface SocialMetrics {
  userId: number;
  platform: string;
  engagementRate: number;
  followersCount: number;
  verificationsShared: number;
  nftShowcased: boolean;
}

export class GoogleSheetsIntegration {
  private sheets: any;
  private spreadsheetId: string;

  constructor() {
    // Initialize Google Sheets API
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_SHEETS_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.sheets = google.sheets({ version: 'v4', auth });
    this.spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID || '';
  }

  /**
   * Sync user verification data to Google Sheets for social media tracking
   */
  async syncUserVerifications(userData: UserVerificationData): Promise<void> {
    try {
      const values = [
        [
          userData.userId,
          userData.username,
          userData.trustScore,
          userData.verificationLevel,
          userData.walletAddress || '',
          userData.nftTokenId || '',
          userData.socialMediaOptimized ? 'Yes' : 'No',
          userData.tiktokReady ? 'Yes' : 'No',
          new Date().toISOString()
        ]
      ];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'UserVerifications!A:I',
        valueInputOption: 'RAW',
        resource: { values },
      });

      console.log(`Synced verification data for user ${userData.userId}`);
    } catch (error) {
      console.error('Error syncing to Google Sheets:', error);
      throw new Error('Failed to sync verification data');
    }
  }

  /**
   * Track social media engagement metrics
   */
  async trackSocialMetrics(metrics: SocialMetrics): Promise<void> {
    try {
      const values = [
        [
          metrics.userId,
          metrics.platform,
          metrics.engagementRate,
          metrics.followersCount,
          metrics.verificationsShared,
          metrics.nftShowcased ? 'Yes' : 'No',
          new Date().toISOString()
        ]
      ];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'SocialMetrics!A:G',
        valueInputOption: 'RAW',
        resource: { values },
      });

      console.log(`Tracked social metrics for user ${metrics.userId} on ${metrics.platform}`);
    } catch (error) {
      console.error('Error tracking social metrics:', error);
      throw new Error('Failed to track social metrics');
    }
  }

  /**
   * Get TikTok-optimized user data for content creation
   */
  async getTikTokOptimizedData(userId: number): Promise<any> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'UserVerifications!A:I',
      });

      const rows = response.data.values || [];
      const userRow = rows.find(row => parseInt(row[0]) === userId);

      if (!userRow) {
        return null;
      }

      return {
        userId: parseInt(userRow[0]),
        username: userRow[1],
        trustScore: parseInt(userRow[2]),
        verificationLevel: parseInt(userRow[3]),
        walletAddress: userRow[4],
        nftTokenId: userRow[5],
        socialMediaOptimized: userRow[6] === 'Yes',
        tiktokReady: userRow[7] === 'Yes',
        lastUpdated: userRow[8]
      };
    } catch (error) {
      console.error('Error getting TikTok data:', error);
      throw new Error('Failed to get TikTok-optimized data');
    }
  }

  /**
   * Generate social media share content
   */
  async generateShareContent(userId: number): Promise<{
    tiktokCaption: string;
    instagramCaption: string;
    twitterCaption: string;
    hashtagsOptimized: string[];
  }> {
    try {
      const userData = await this.getTikTokOptimizedData(userId);
      
      if (!userData) {
        throw new Error('User data not found');
      }

      const baseContent = `✨ Just got Level ${userData.verificationLevel} verified on FibonroseTrust! 
Trust Score: ${userData.trustScore}/21+ 🎯`;

      const nftContent = userData.nftTokenId ? 
        `\n🎨 My digital identity is now an NFT! Token: ${userData.nftTokenId}` : '';

      const web3Content = userData.walletAddress ? 
        `\n⛓️ Blockchain verified: ${userData.walletAddress.slice(0, 6)}...${userData.walletAddress.slice(-4)}` : '';

      return {
        tiktokCaption: `${baseContent}${nftContent}${web3Content}\n\n#Web3Identity #NFTVerification #TrustScore #FibonroseTrust #DigitalIdentity #Blockchain`,
        
        instagramCaption: `${baseContent}${nftContent}${web3Content}\n\n#Web3 #NFT #DigitalIdentity #Verification #Blockchain #TrustScore`,
        
        twitterCaption: `${baseContent}${nftContent}${web3Content}\n\n#Web3Identity #NFTVerification #FibonroseTrust`,
        
        hashtagsOptimized: [
          '#Web3Identity',
          '#NFTVerification', 
          '#TrustScore',
          '#FibonroseTrust',
          '#DigitalIdentity',
          '#Blockchain',
          '#IdentityNFT',
          '#Web3Verification'
        ]
      };
    } catch (error) {
      console.error('Error generating share content:', error);
      throw new Error('Failed to generate social content');
    }
  }

  /**
   * Setup Google Sheets with proper headers
   */
  async initializeSheets(): Promise<void> {
    try {
      // Initialize UserVerifications sheet
      const userHeaders = [
        'User ID',
        'Username', 
        'Trust Score',
        'Verification Level',
        'Wallet Address',
        'NFT Token ID',
        'Social Media Optimized',
        'TikTok Ready',
        'Last Updated'
      ];

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'UserVerifications!A1:I1',
        valueInputOption: 'RAW',
        resource: { values: [userHeaders] },
      });

      // Initialize SocialMetrics sheet
      const metricsHeaders = [
        'User ID',
        'Platform',
        'Engagement Rate',
        'Followers Count',
        'Verifications Shared',
        'NFT Showcased',
        'Timestamp'
      ];

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'SocialMetrics!A1:G1',
        valueInputOption: 'RAW',
        resource: { values: [metricsHeaders] },
      });

      console.log('Google Sheets initialized for TikTok optimization');
    } catch (error) {
      console.error('Error initializing sheets:', error);
      throw new Error('Failed to initialize Google Sheets');
    }
  }

  /**
   * Create webhook data for social media automation
   */
  async createSocialWebhookData(eventType: string, userData: any): Promise<any> {
    const webhookData = {
      event: eventType,
      timestamp: new Date().toISOString(),
      user: {
        id: userData.userId,
        username: userData.username,
        trustScore: userData.trustScore,
        level: userData.verificationLevel
      },
      socialOptimization: {
        tiktokReady: userData.tiktokReady || false,
        shareableContent: await this.generateShareContent(userData.userId),
        engagementBoost: userData.trustScore > 8
      },
      web3Data: {
        walletConnected: !!userData.walletAddress,
        nftMinted: !!userData.nftTokenId,
        blockchainVerified: true
      }
    };

    // Sync to Google Sheets for tracking
    await this.syncUserVerifications(userData);

    return webhookData;
  }
}

export const googleSheetsService = new GoogleSheetsIntegration();