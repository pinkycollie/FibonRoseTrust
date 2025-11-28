/**
 * Xano Integration Service
 * 
 * Provides integration with Xano API for backend functionality.
 */

import axios from 'axios';

interface XanoConfig {
  apiKey: string;
  baseUrl: string;
}

interface NormalizedWebhookData {
  eventType: string;
  source: string;
  timestamp: string;
  payload: Record<string, any>;
}

export class XanoIntegration {
  private static apiKey: string = '';
  private static baseUrl: string = process.env.XANO_BASE_URL || 'https://x8ki-letl-twmt.n7.xano.io/api';

  /**
   * Set the API key for Xano requests
   */
  static setApiKey(key: string): void {
    this.apiKey = key;
  }

  /**
   * Set the base URL for Xano API
   */
  static setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * Test connection to Xano API
   */
  static async testConnection(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, {
        headers: this.getHeaders(),
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      console.error('Xano connection test failed:', error);
      return false;
    }
  }

  /**
   * Get API metadata
   */
  static async getApiMetadata(): Promise<Record<string, any>> {
    try {
      const response = await axios.get(`${this.baseUrl}/metadata`, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get Xano metadata:', error);
      throw error;
    }
  }

  /**
   * Process incoming webhook data from Xano
   */
  static processWebhook(headers: Record<string, string>, body: any): NormalizedWebhookData {
    return {
      eventType: headers['x-xano-event-type'] || body.event || 'unknown',
      source: 'xano',
      timestamp: new Date().toISOString(),
      payload: body
    };
  }

  /**
   * Get headers for Xano API requests
   */
  private static getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  /**
   * Send data to Xano endpoint
   */
  static async sendToXano(endpoint: string, data: Record<string, any>): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}${endpoint}`, data, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Failed to send data to Xano:', error);
      throw error;
    }
  }
}

export default XanoIntegration;
