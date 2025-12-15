/**
 * XanoIntegration - Integration service for Xano API
 * 
 * This module provides integration with Xano backend services
 * for data synchronization and API connectivity.
 */

import axios, { AxiosInstance } from 'axios';

export class XanoIntegration {
  private static apiKey: string = '';
  private static baseUrl: string = process.env.XANO_BASE_URL || 'https://x8ki-letl-twmt.n7.xano.io';
  private static client: AxiosInstance;

  /**
   * Set the API key for Xano integration
   */
  static setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Test connection to Xano API
   */
  static async testConnection(): Promise<boolean> {
    try {
      if (!this.client) {
        return false;
      }
      
      // Attempt a simple API call to verify connection
      await this.client.get('/api:health/check');
      return true;
    } catch {
      // If health check fails, try a basic request
      try {
        await this.client.get('/');
        return true;
      } catch {
        return false;
      }
    }
  }

  /**
   * Get API metadata from Xano
   */
  static async getApiMetadata(): Promise<Record<string, unknown>> {
    if (!this.client) {
      throw new Error('Xano client not initialized. Call setApiKey first.');
    }

    try {
      const response = await this.client.get('/api:meta');
      return response.data;
    } catch {
      return {
        connected: true,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Process incoming webhook from Xano
   */
  static processWebhook(
    headers: Record<string, string>,
    body: Record<string, unknown>
  ): {
    eventType: string;
    source: string;
    timestamp: string;
    payload: Record<string, unknown>;
  } {
    const eventType = (headers['x-xano-event'] as string) || 'xano.generic';
    const timestamp = new Date().toISOString();

    return {
      eventType,
      source: 'xano',
      timestamp,
      payload: body
    };
  }

  /**
   * Sync data to Xano
   */
  static async syncData(
    endpoint: string,
    data: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    if (!this.client) {
      throw new Error('Xano client not initialized. Call setApiKey first.');
    }

    const response = await this.client.post(endpoint, data);
    return response.data;
  }
}

export default XanoIntegration;
