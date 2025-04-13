import axios from 'axios';
import { log } from '../../vite';
import { EventType } from '@shared/schema';

/**
 * Integration with Xano API and webhooks
 * Handles communication with Xano instance at x8ki-letl-twmt.n7.xano.io
 */
export class XanoIntegration {
  private static readonly XANO_BASE_URL = 'https://x8ki-letl-twmt.n7.xano.io';
  private static readonly XANO_API_URL = `${XanoIntegration.XANO_BASE_URL}/api:meta`;
  private static apiKey: string | null = null;

  /**
   * Set the Xano API key for authenticated requests
   * @param key Xano API key
   */
  public static setApiKey(key: string): void {
    this.apiKey = key;
    log(`Xano API key configured for ${this.XANO_BASE_URL}`, 'xano');
  }

  /**
   * Process a webhook received from Xano
   * @param headers HTTP headers from the webhook request
   * @param body Body of the webhook request
   * @returns Normalized data in our system's format
   */
  public static processWebhook(headers: Record<string, string>, body: any): any {
    // Extract webhook event type from headers or body
    const xanoEventType = this.extractEventType(headers, body);
    const eventData = this.normalizeData(body, xanoEventType);
    
    return {
      source: 'xano',
      eventType: this.mapEventTypeToInternal(xanoEventType),
      payload: eventData,
      timestamp: new Date().toISOString(),
      metadata: {
        originalHeaders: headers,
        xanoEventType,
        xanoInstanceId: 'x8ki-letl-twmt.n7'
      }
    };
  }

  /**
   * Verify webhook signature from Xano (if available)
   * @param signature Signature from Xano webhook
   * @param body Request body
   * @returns Whether the signature is valid
   */
  public static verifyWebhookSignature(signature: string | undefined, body: any): boolean {
    // If Xano doesn't provide a signature or we don't have a secret configured, return true
    if (!signature) {
      return true;
    }

    // TODO: Implement signature verification if Xano provides it
    return true;
  }

  /**
   * Extract the event type from the Xano webhook
   * @param headers HTTP headers
   * @param body Request body
   * @returns Event type string
   */
  private static extractEventType(headers: Record<string, string>, body: any): string {
    // Try to get event type from headers first
    if (headers['x-xano-event-type']) {
      return headers['x-xano-event-type'];
    }

    // Otherwise try to determine from the body structure
    if (body.event_type) {
      return body.event_type;
    }

    if (body.action && body.resource) {
      return `${body.resource}.${body.action}`;
    }

    // Default event type if we can't determine
    return 'xano.webhook';
  }

  /**
   * Map Xano event types to our internal event types
   * @param xanoEventType Event type from Xano
   * @returns Internal event type
   */
  private static mapEventTypeToInternal(xanoEventType: string): EventType {
    const mappings: Record<string, EventType> = {
      'user.created': EventTypes.USER_CREATED,
      'user.updated': EventTypes.USER_UPDATED,
      'verification.created': EventTypes.VERIFICATION_CREATED,
      'verification.updated': EventTypes.VERIFICATION_UPDATED,
      'verification.verified': EventTypes.VERIFICATION_VERIFIED,
      'verification.rejected': EventTypes.VERIFICATION_REJECTED,
      'nft.minted': EventTypes.NFT_MINTED,
      'nft.transferred': EventTypes.NFT_TRANSFERRED
    };

    return mappings[xanoEventType] || EventTypes.GENERIC;
  }

  /**
   * Normalize data from Xano into a standard format
   * @param data Raw data from Xano
   * @param eventType Event type
   * @returns Normalized data
   */
  private static normalizeData(data: any, eventType: string): Record<string, any> {
    // Different normalization based on event type
    if (eventType.startsWith('user.')) {
      return this.normalizeUserData(data);
    } else if (eventType.startsWith('verification.')) {
      return this.normalizeVerificationData(data);
    } else if (eventType.startsWith('nft.')) {
      return this.normalizeNftData(data);
    }

    // Default normalization for unknown event types
    return {
      ...data,
      normalized: true,
      _original: { ...data }
    };
  }

  /**
   * Normalize user data from Xano
   * @param data Raw user data
   * @returns Normalized user data
   */
  private static normalizeUserData(data: any): Record<string, any> {
    // Extract user data from Xano's format
    const userData = data.record || data.user || data;

    return {
      userId: userData.id || userData.user_id,
      username: userData.username,
      name: userData.name || userData.display_name,
      email: userData.email,
      createdAt: userData.created_at || userData.date_created,
      updatedAt: userData.updated_at || userData.date_modified,
      metadata: {
        xanoId: userData.id,
        source: 'xano'
      }
    };
  }

  /**
   * Normalize verification data from Xano
   * @param data Raw verification data
   * @returns Normalized verification data
   */
  private static normalizeVerificationData(data: any): Record<string, any> {
    // Extract verification data from Xano's format
    const verificationData = data.record || data.verification || data;

    return {
      verificationId: verificationData.id || verificationData.verification_id,
      userId: verificationData.user_id,
      type: verificationData.type || verificationData.verification_type,
      status: verificationData.status,
      verifiedBy: verificationData.verified_by,
      createdAt: verificationData.created_at || verificationData.date_created,
      updatedAt: verificationData.updated_at || verificationData.date_modified,
      metadata: {
        xanoId: verificationData.id,
        source: 'xano'
      }
    };
  }

  /**
   * Normalize NFT data from Xano
   * @param data Raw NFT data
   * @returns Normalized NFT data
   */
  private static normalizeNftData(data: any): Record<string, any> {
    // Extract NFT data from Xano's format
    const nftData = data.record || data.nft || data;

    return {
      tokenId: nftData.token_id || nftData.id,
      walletAddress: nftData.wallet_address || nftData.owner,
      userId: nftData.user_id,
      tokenMetadata: nftData.metadata || {},
      transactionHash: nftData.transaction_hash,
      createdAt: nftData.created_at || nftData.date_created,
      metadata: {
        xanoId: nftData.id,
        source: 'xano'
      }
    };
  }

  /**
   * Fetch metadata from Xano API
   * Used to verify connection and get schema information
   * @returns API metadata
   */
  public static async getApiMetadata(): Promise<any> {
    try {
      const headers: Record<string, string> = {};
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await axios.get(this.XANO_API_URL, { headers });
      return response.data;
    } catch (error) {
      log(`Error fetching Xano API metadata: ${error instanceof Error ? error.message : String(error)}`, 'xano');
      throw error;
    }
  }

  /**
   * Test connection to Xano API
   * @returns Whether the connection is successful
   */
  public static async testConnection(): Promise<boolean> {
    try {
      await this.getApiMetadata();
      return true;
    } catch (error) {
      return false;
    }
  }
}