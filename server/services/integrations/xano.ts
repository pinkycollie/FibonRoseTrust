import axios from 'axios';

/**
 * Xano Integration Service
 * Provides integration with Xano backend-as-a-service platform
 * for The-PinkSync ecosystem
 */
export class XanoIntegration {
  private static baseUrl = 'https://x8ki-letl-twmt.n7.xano.io/api:v1';
  private static apiKey: string | null = null;
  private apiKey: string;
  private instanceUrl: string;

  constructor(apiKey: string, instanceUrl?: string) {
    this.apiKey = apiKey;
    this.instanceUrl = instanceUrl || XanoIntegration.baseUrl;
  }

  /**
   * Set the static API key for Xano API
   */
  public static setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Test connection to the Xano API
   */
  public static async testConnection(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }
    
    try {
      const response = await axios.get(`${this.baseUrl}/health`, {
        headers: this.getHeaders()
      });
      
      return response.status === 200;
    } catch (error) {
      console.error('Xano connection test failed:', error);
      return false;
    }
  }

  /**
   * Test instance connection
   */
  public async testInstanceConnection(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.instanceUrl}/health`, {
        headers: this.getInstanceHeaders()
      });
      
      return response.status === 200;
    } catch (error) {
      console.error('Xano instance connection test failed:', error);
      return false;
    }
  }

  /**
   * Get API metadata from Xano
   */
  public static async getApiMetadata(): Promise<any> {
    if (!this.apiKey) {
      throw new Error('API key not set');
    }
    
    try {
      const response = await axios.get(`${this.baseUrl}/meta`, {
        headers: this.getHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to get Xano metadata:', error);
      throw error;
    }
  }

  /**
   * Process incoming webhook from Xano
   */
  public static processWebhook(
    headers: Record<string, string>,
    payload: any
  ): { eventType: string; source: string; timestamp: string; payload: any } {
    const eventType = headers['x-xano-event'] || payload.event_type || 'generic.event';
    const source = 'xano';
    const timestamp = payload.timestamp || new Date().toISOString();

    return {
      eventType,
      source,
      timestamp,
      payload
    };
  }

  /**
   * Sync user data to Xano
   */
  public async syncUserData(userId: number, userData: any): Promise<any> {
    try {
      const response = await axios.post(
        `${this.instanceUrl}/users/sync`,
        {
          user_id: userId,
          ...userData
        },
        { headers: this.getInstanceHeaders() }
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to sync user data to Xano:', error);
      throw error;
    }
  }

  /**
   * Sync verification data to Xano
   */
  public async syncVerificationData(verificationData: any): Promise<any> {
    try {
      const response = await axios.post(
        `${this.instanceUrl}/verifications/sync`,
        verificationData,
        { headers: this.getInstanceHeaders() }
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to sync verification data to Xano:', error);
      throw error;
    }
  }

  /**
   * Get static headers for Xano API requests
   */
  private static getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'X-Client-ID': 'FibonRoseTRUST'
    };
  }

  /**
   * Get instance headers for Xano API requests
   */
  private getInstanceHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'X-Client-ID': 'FibonRoseTRUST'
    };
  }
}

export default XanoIntegration;
