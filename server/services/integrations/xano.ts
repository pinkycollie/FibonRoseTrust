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
    details?: any;
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
        details: error
      };
    }
  }

  /**
   * Get API metadata (stub)
   */
  async getApiMetadata(): Promise<any> {
    return {
      message: 'Xano integration is currently disabled',
      status: 'deprecated'
    };
  }

  /**
   * Static method to set API key (stub for backward compatibility)
   */
  static setApiKey(apiKey: string): void {
    // Stub implementation
    console.warn('XanoIntegration.setApiKey called but Xano integration is disabled');
  }

  /**
   * Static method to test connection (stub for backward compatibility)
   */
  static async testConnection(): Promise<boolean> {
    console.warn('XanoIntegration.testConnection called but Xano integration is disabled');
    return false;
  }

  /**
   * Static method to get API metadata (stub for backward compatibility)
   */
  static async getApiMetadata(): Promise<any> {
    return {
      message: 'Xano integration is currently disabled',
      status: 'deprecated'
    };
  }

  /**
   * Register a webhook (stub)
   */
  async registerWebhook(config: any): Promise<any> {
    return {
      success: false,
      message: 'Xano integration is currently disabled'
    };
  }

  /**
   * Static method to process webhook (stub)
   */
  static async processWebhook(payload: any): Promise<any> {
    return {
      success: false,
      message: 'Xano integration is currently disabled'
    };
  }
}
