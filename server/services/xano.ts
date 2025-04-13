import { XanoIntegration } from './integrations/xano';
import { log } from '../vite';

/**
 * Configuration for the Xano service
 */
interface XanoConfig {
  apiKey: string;
  baseUrl?: string;
  webhookSecret?: string;
  aiEnabled?: boolean;
}

/**
 * Xano Service class for Xano API interactions
 */
class XanoService {
  private static _isConfigured = false;
  private static _baseUrl = 'https://x8ki-letl-twmt.n7.xano.io';
  private static _apiKey: string | null = null;
  private static _webhookSecret: string | null = null;
  private static _aiEnabled = false;

  /**
   * Initialize the Xano service with configuration
   * @param config Xano configuration
   */
  public static initialize(config: XanoConfig): void {
    this._apiKey = config.apiKey;
    this._baseUrl = config.baseUrl || this._baseUrl;
    this._webhookSecret = config.webhookSecret || null;
    this._aiEnabled = config.aiEnabled || false;
    this._isConfigured = true;

    // Set API key in the integration
    XanoIntegration.setApiKey(config.apiKey);
    
    log(`Xano service initialized with baseUrl: ${this._baseUrl}`, 'xano');
  }

  /**
   * Get Xano instance information
   * @returns Information about the Xano instance
   */
  public static getInstanceInfo(): {
    isConfigured: boolean;
    baseUrl: string;
    aiEnabled: boolean;
  } {
    return {
      isConfigured: this._isConfigured,
      baseUrl: this._baseUrl,
      aiEnabled: this._aiEnabled
    };
  }

  /**
   * Perform AI-powered analysis on text using Xano AI
   * @param text Text to analyze
   * @param options Analysis options
   * @returns Analysis results
   */
  public static async analyzeText(text: string, options: any = {}): Promise<any> {
    if (!this._isConfigured) {
      throw new Error('Xano service is not configured. Please call initialize() first.');
    }

    if (!this._aiEnabled) {
      throw new Error('Xano AI is not enabled in the configuration.');
    }

    try {
      // This is a placeholder for the actual AI analysis
      // In a real implementation, we would call Xano AI endpoints
      log(`Performing AI analysis on text (${text.length} chars) with options: ${JSON.stringify(options)}`, 'xano');
      
      return {
        success: true,
        analysis: {
          sentiment: 'positive',
          topics: ['finance', 'security'],
          keywords: ['verification', 'identity', 'trust'],
          summary: 'The text discusses verification processes and identity trust.',
        }
      };
    } catch (error) {
      log(`Error performing AI analysis: ${error instanceof Error ? error.message : String(error)}`, 'xano');
      throw error;
    }
  }

  /**
   * Test connection to Xano API
   * @returns Whether the connection is successful
   */
  public static async testConnection(): Promise<boolean> {
    if (!this._isConfigured) {
      return false;
    }

    return await XanoIntegration.testConnection();
  }

  /**
   * Get API metadata from Xano
   * @returns API metadata
   */
  public static async getApiMetadata(): Promise<any> {
    if (!this._isConfigured) {
      throw new Error('Xano service is not configured. Please call initialize() first.');
    }

    return await XanoIntegration.getApiMetadata();
  }
}

export default XanoService;