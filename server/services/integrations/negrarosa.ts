import axios from 'axios';
import { log } from '../../vite';

/**
 * NegraRosa Security Framework Integration
 * This service integrates with the NegraRosa Security Framework
 * to provide risk assessment, identity verification, and transaction approval.
 */
export class NegraRosaIntegration {
  // The baseUrl for the NegraRosa Security API
  private static baseUrl = 'https://api.negrasecurity.com';
  private static apiKey: string | null = null;
  
  /**
   * Set the API key for NegraRosa API
   * @param apiKey API key for NegraRosa
   */
  public static setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    log('NegraRosa API key set', 'negrarosa');
  }
  
  /**
   * Test connection to the NegraRosa API
   * @returns Whether connection is successful
   */
  public static async testConnection(): Promise<boolean> {
    if (!this.apiKey) {
      log('Cannot test connection without API key', 'negrarosa');
      return false;
    }
    
    try {
      const response = await axios.get(`${this.baseUrl}/api/v1/health`, {
        headers: this.getHeaders()
      });
      
      return response.status === 200;
    } catch (error) {
      log(`NegraRosa connection test failed: ${error instanceof Error ? error.message : String(error)}`, 'negrarosa');
      return false;
    }
  }
  
  /**
   * Verify a user's identity using the WHY System
   * @param userId User ID
   * @param verificationData Verification data from completed verification
   * @returns Verification result with WHY trust rating
   */
  public static async verifyUserIdentity(
    userId: number,
    verificationData: any
  ): Promise<any> {
    if (!this.apiKey) {
      throw new Error('API key not set');
    }
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/v1/verify/identity`,
        {
          userId,
          verificationType: verificationData.typeId,
          verificationMethod: verificationData.method || 'standard',
          verificationData: verificationData.data
        },
        { headers: this.getHeaders() }
      );
      
      log(`Identity verification processed for user ${userId}`, 'negrarosa');
      return response.data;
    } catch (error) {
      log(`Identity verification failed: ${error instanceof Error ? error.message : String(error)}`, 'negrarosa');
      throw error;
    }
  }
  
  /**
   * Calculate risk assessment for a transaction
   * @param userId User ID
   * @param transactionData Transaction data
   * @returns Risk assessment with recommended actions
   */
  public static async calculateRiskAssessment(
    userId: number,
    transactionData: any
  ): Promise<any> {
    if (!this.apiKey) {
      throw new Error('API key not set');
    }
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/v1/risk/assess`,
        {
          userId,
          transactionType: transactionData.type,
          transactionAmount: transactionData.amount,
          metadata: transactionData.metadata
        },
        { headers: this.getHeaders() }
      );
      
      log(`Risk assessment performed for user ${userId}`, 'negrarosa');
      return response.data;
    } catch (error) {
      log(`Risk assessment failed: ${error instanceof Error ? error.message : String(error)}`, 'negrarosa');
      throw error;
    }
  }
  
  /**
   * Submit an E&O claim request
   * @param userId User ID
   * @param claimData Claim data
   * @returns Claim submission result
   */
  public static async submitEOClaim(
    userId: number,
    claimData: any
  ): Promise<any> {
    if (!this.apiKey) {
      throw new Error('API key not set');
    }
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/v1/claims/eo`,
        {
          userId,
          claimType: claimData.type,
          claimAmount: claimData.amount,
          description: claimData.description,
          evidence: claimData.evidence
        },
        { headers: this.getHeaders() }
      );
      
      log(`E&O claim submitted for user ${userId}`, 'negrarosa');
      return response.data;
    } catch (error) {
      log(`E&O claim submission failed: ${error instanceof Error ? error.message : String(error)}`, 'negrarosa');
      throw error;
    }
  }
  
  /**
   * Process WHY security check for verification
   * @param userId User ID
   * @param verificationType Verification type
   * @returns WHY security verification result
   */
  public static async processWHYSecurityCheck(
    userId: number,
    verificationType: string
  ): Promise<any> {
    if (!this.apiKey) {
      throw new Error('API key not set');
    }
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/v1/security/why`,
        {
          userId,
          verificationType,
          timestamp: new Date().toISOString()
        },
        { headers: this.getHeaders() }
      );
      
      log(`WHY security check processed for user ${userId}`, 'negrarosa');
      return response.data;
    } catch (error) {
      log(`WHY security check failed: ${error instanceof Error ? error.message : String(error)}`, 'negrarosa');
      throw error;
    }
  }
  
  /**
   * Get user trust level from NegraRosa
   * @param userId User ID
   * @returns Current trust level and security details
   */
  public static async getUserTrustLevel(userId: number): Promise<any> {
    if (!this.apiKey) {
      throw new Error('API key not set');
    }
    
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/v1/users/${userId}/trust`,
        { headers: this.getHeaders() }
      );
      
      return response.data;
    } catch (error) {
      log(`Failed to get user trust level: ${error instanceof Error ? error.message : String(error)}`, 'negrarosa');
      throw error;
    }
  }
  
  /**
   * Get headers for NegraRosa API requests
   * @returns Headers with API key
   */
  private static getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey || '',
      'X-Client-ID': 'FibonRoseTRUST'
    };
  }
}

// Export the class
export default NegraRosaIntegration;