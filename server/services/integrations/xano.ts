/**
 * Xano Integration Service
 * 
 * Handles integration with Xano backend platform.
 * Note: This is a stub implementation. Full Xano integration was removed
 * but references remain in the codebase for backward compatibility.
 */

export class XanoIntegration {
  private apiKey: string;
  private instanceUrl: string;

  constructor(apiKey: string, instanceUrl: string) {
    this.apiKey = apiKey;
    this.instanceUrl = instanceUrl;
  }

  /**
   * Test connection to Xano instance
   */
  async testConnection(): Promise<{
    success: boolean;
    error?: string;
    details?: {
      message: string;
      [key: string]: any;
    };
    apiVersion?: string;
  }> {
    try {
      // Stub implementation - Xano integration is currently disabled
      return {
        success: false,
        error: 'Xano integration is currently disabled. Please use alternative integration methods.',
        details: {
          message: 'Xano integration has been deprecated in favor of direct database access.'
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown error',
        details: {
          message: error.message || 'Unknown error occurred'
        }
      };
    }
  }

  /**
   * Get API metadata (stub)
   */
  async getApiMetadata(): Promise<{
    message: string;
    status: string;
  }> {
    return {
      message: 'Xano integration is currently disabled',
      status: 'deprecated'
    };
  }

  /**
   * Static method to set API key (stub for backward compatibility)
   */
  static setApiKey(apiKey: string): void {
    // Stub implementation - only log in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('XanoIntegration.setApiKey called but Xano integration is disabled');
    }
  }

  /**
   * Static method to test connection (stub for backward compatibility)
   */
  static async testConnection(): Promise<boolean> {
    if (process.env.NODE_ENV === 'development') {
      console.warn('XanoIntegration.testConnection called but Xano integration is disabled');
    }
    return false;
  }

  /**
   * Static method to get API metadata (stub for backward compatibility)
   */
  static async getApiMetadata(): Promise<{
    message: string;
    status: string;
  }> {
    return {
      message: 'Xano integration is currently disabled',
      status: 'deprecated'
    };
  }

  /**
   * Register a webhook (stub)
   */
  async registerWebhook(config: {
    url: string;
    events: string[];
    secret?: string;
  }): Promise<{
    success: boolean;
    message: string;
  }> {
    return {
      success: false,
      message: 'Xano integration is currently disabled'
    };
  }

  /**
   * Static method to process webhook (stub)
   */
  static async processWebhook(payload: {
    event: string;
    data: Record<string, any>;
  }): Promise<{
    success: boolean;
    message: string;
  }> {
    return {
      success: false,
      message: 'Xano integration is currently disabled'
    };
  }
}
