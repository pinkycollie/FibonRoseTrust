import { storage } from '../storage';
import { WebhookDelivery, EventType, WebhookSubscription } from '@shared/schema';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'fast-csv';
import { log } from '../vite';
import * as crypto from 'crypto';
import { SmartWebhookIntelligence } from './integrations/xano';

interface WebhookResult {
  success: boolean;
  data?: any;
  error?: string;
}

class UniversalWebhookManager {
  private sourceHandlers: Map<string, (headers: Record<string, string>, payload: any) => any> = new Map();
  
  constructor() {
    // Register default handlers
    this.registerDefaultHandlers();
  }
  
  /**
   * Register default source handlers using Smart Webhook Intelligence
   */
  private registerDefaultHandlers(): void {
    // Default handler for Notion
    this.sourceHandlers.set('notion', (headers, payload) => {
      // Normalize Notion webhook data
      const eventType = headers['x-notion-event-type'] || 'unknown';
      return {
        source: 'notion',
        eventType,
        timestamp: new Date().toISOString(),
        payload
      };
    });
    
    // Smart internal webhook handler (replaces external Xano)
    this.sourceHandlers.set('internal', (headers, payload) => {
      // Use Smart Webhook Intelligence for processing
      return SmartWebhookIntelligence.processWebhook(headers, payload);
    });
    
    // Legacy handler name for backward compatibility
    this.sourceHandlers.set('xano', (headers, payload) => {
      // Route through Smart Webhook Intelligence
      return SmartWebhookIntelligence.processWebhook(headers, payload);
    });
    
    // Smart handler for any unrecognized sources
    this.sourceHandlers.set('smart', (headers, payload) => {
      return SmartWebhookIntelligence.processWebhook(headers, payload);
    });
  }
  
  /**
   * Register a custom source handler
   * @param source Source identifier
   * @param handler Handler function
   */
  public registerSourceHandler(
    source: string, 
    handler: (headers: Record<string, string>, payload: any) => any
  ): void {
    this.sourceHandlers.set(source, handler);
    log(`Registered custom handler for source: ${source}`, 'webhook');
  }
  
  /**
   * Process an incoming webhook from any source
   * @param source Source of the webhook
   * @param headers Request headers
   * @param payload Request body
   * @returns Processing result
   */
  public async processIncomingWebhook(
    source: string,
    headers: Record<string, string>,
    payload: any
  ): Promise<WebhookResult> {
    try {
      log(`Processing incoming webhook from ${source}`, 'webhook');
      
      // Use registered handler or default pass-through
      const handler = this.sourceHandlers.get(source) || ((h, p) => ({ 
        source, 
        eventType: 'unknown', 
        timestamp: new Date().toISOString(), 
        payload: p 
      }));
      
      // Normalize the payload
      const normalizedData = handler(headers, payload);
      
      // Create a webhook delivery record
      const delivery = await storage.createWebhookDelivery({
        subscriptionId: 1, // Default subscription ID
        eventType: normalizedData.eventType,
        status: 'RECEIVED',
        payload: payload, // Required field
        requestHeaders: JSON.stringify(headers),
        statusCode: null,
        response: null,
        errorMessage: null
      });
      
      // Return successful result
      return {
        success: true,
        data: {
          deliveryId: delivery.id,
          source,
          eventType: normalizedData.eventType,
          status: delivery.status
        }
      };
    } catch (error) {
      log(`Error processing webhook from ${source}: ${error instanceof Error ? error.message : String(error)}`, 'webhook');
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Test a webhook by sending a test event
   * @param subscriptionId ID of the webhook subscription
   * @param eventType Type of event to test
   * @param payload Optional custom payload
   */
  public async testWebhook(
    subscriptionId: number,
    eventType: EventType,
    payload: any = { test: true, timestamp: new Date().toISOString() }
  ): Promise<WebhookDelivery> {
    const subscription = await storage.getWebhookSubscription(subscriptionId);
    
    if (!subscription) {
      throw new Error(`Webhook subscription ${subscriptionId} not found`);
    }
    
    // Create delivery record
    const delivery = await storage.createWebhookDelivery({
      subscriptionId,
      eventType,
      status: 'PENDING',
      payload: typeof payload === 'string' ? JSON.parse(payload) : payload
    });
    
    // Deliver the webhook
    await this.deliverWebhook(delivery.id, subscription, payload);
    
    // Return the updated delivery
    return await storage.getWebhookDelivery(delivery.id) as WebhookDelivery;
  }
  
  /**
   * Deliver a webhook to its destination
   * @param deliveryId ID of the delivery record
   * @param subscription Webhook subscription
   * @param payload Payload to send
   */
  private async deliverWebhook(
    deliveryId: number,
    subscription: WebhookSubscription,
    payload: any
  ): Promise<void> {
    try {
      log(`Delivering webhook ${deliveryId} to ${subscription.url}`, 'webhook');
      
      // Add signature if secret is present
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'FibonroseTrust-Webhook/1.0',
        'X-FibonroseTrust-Delivery': deliveryId.toString(),
        'X-FibonroseTrust-Event': payload.eventType || 'unknown'
      };
      
      if (subscription.secret) {
        headers['X-FibonroseTrust-Signature'] = this.generateSignature(
          JSON.stringify(payload),
          subscription.secret
        );
      }
      
      // Send the webhook
      const response = await axios.post(subscription.url, payload, {
        headers,
        timeout: 10000 // 10 second timeout
      });
      
      // Update delivery record
      await storage.updateWebhookDeliveryStatus(
        deliveryId,
        'DELIVERED',
        response.status,
        JSON.stringify(response.data)
      );
    } catch (error) {
      log(`Error delivering webhook ${deliveryId}: ${error instanceof Error ? error.message : String(error)}`, 'webhook');
      
      // Update delivery record with error
      await storage.updateWebhookDeliveryStatus(
        deliveryId,
        'FAILED',
        error instanceof axios.AxiosError ? error.response?.status || 0 : 0,
        '',
        error instanceof Error ? error.message : String(error)
      );
    }
  }
  
  /**
   * Generate HMAC signature for webhook payload
   * @param payload Webhook payload
   * @param secret Webhook secret
   * @returns HMAC signature
   */
  private generateSignature(payload: string, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    return hmac.digest('hex');
  }
  
  /**
   * Process an event from the identity framework event bus
   * This method is the key integration point between the event bus and webhook system
   * @param source Source of the event (e.g., 'identity_verification', 'neural_network')
   * @param eventType Type of event (from EventTypes enum)
   * @param payload Event data
   */
  public async processEvent(
    source: string,
    eventType: EventType,
    payload: any
  ): Promise<void> {
    log(`Processing event from ${source}: ${eventType}`, 'webhook');
    
    try {
      // Find all active subscriptions that listen for this event type
      const subscriptions = await storage.getWebhookSubscriptions();
      const matchingSubscriptions = subscriptions.filter(sub => 
        sub.isActive && (sub.events.includes(eventType) || sub.events.includes('*'))
      );
      
      if (matchingSubscriptions.length === 0) {
        log(`No active subscriptions found for event ${eventType}`, 'webhook');
        return;
      }
      
      // Process each matching subscription
      for (const subscription of matchingSubscriptions) {
        try {
          // Create delivery record 
          const payloadJson = typeof payload === 'string' ? payload : JSON.stringify(payload);
          const delivery = await storage.createWebhookDelivery({
            subscriptionId: subscription.id,
            eventType,
            status: 'PENDING',
            payload: payloadJson
          });
          
          // Update source separately if storage API doesn't directly support it
          await storage.updateWebhookDeliveryStatus(
            delivery.id,
            'PENDING',
            null,
            null,
            null
          );
          
          // Apply trust-based filtering if userId is present in payload
          let filteredPayload = payload;
          if (payload.userId) {
            filteredPayload = await this.applyTrustBasedFiltering(payload, subscription);
          }
          
          // Deliver the webhook
          await this.deliverWebhook(delivery.id, subscription, {
            id: delivery.id,
            source,
            eventType,
            timestamp: new Date().toISOString(),
            data: filteredPayload
          });
        } catch (error) {
          log(`Error processing webhook for subscription ${subscription.id}: ${error instanceof Error ? error.message : String(error)}`, 'webhook');
        }
      }
    } catch (error) {
      log(`Error processing event ${eventType}: ${error instanceof Error ? error.message : String(error)}`, 'webhook');
    }
  }
  
  /**
   * Apply trust-based filtering to webhook payload based on Fibonacci trust levels
   * @param payload Original payload
   * @param subscription Webhook subscription
   * @returns Filtered payload
   */
  private async applyTrustBasedFiltering(
    payload: any,
    subscription: WebhookSubscription
  ): Promise<any> {
    if (!payload.userId) {
      return payload; // No userId to lookup trust score
    }
    
    try {
      // Get trust score for user
      const trustScore = await storage.getTrustScore(payload.userId);
      if (!trustScore) {
        return this.filterSensitiveData(payload, 0); // No trust score found, apply maximum filtering
      }
      
      // Apply filtering based on Fibonacci trust level
      return this.filterSensitiveData(payload, trustScore.level);
    } catch (error) {
      log(`Error applying trust-based filtering: ${error instanceof Error ? error.message : String(error)}`, 'webhook');
      return this.filterSensitiveData(payload, 0); // Error, apply maximum filtering
    }
  }
  
  /**
   * Filter sensitive data based on trust level
   * @param payload Original payload
   * @param trustLevel Fibonacci trust level (0-21)
   * @returns Filtered payload
   */
  private filterSensitiveData(payload: any, trustLevel: number): any {
    const filteredPayload = { ...payload };
    
    // Trust level 1-3: Basic information only
    if (trustLevel < 4) {
      // Remove sensitive fields
      delete filteredPayload.personalData;
      delete filteredPayload.biometricResults;
      delete filteredPayload.financialData;
      delete filteredPayload.securityDetails;
      delete filteredPayload.medicalInfo;
      delete filteredPayload.detailedHistory;
    }
    // Trust level 4-7: Include more details but obscure some
    else if (trustLevel < 8) {
      // Keep personal data but obscure sensitive parts
      if (filteredPayload.personalData) {
        // Redact specific personal data fields
        const redactedPersonalData = { ...filteredPayload.personalData };
        if (redactedPersonalData.ssn) redactedPersonalData.ssn = '***-**-' + (redactedPersonalData.ssn.slice(-4) || '****');
        if (redactedPersonalData.dob) redactedPersonalData.dob = '****-**-**';
        if (redactedPersonalData.address) redactedPersonalData.address = '[REDACTED]';
        filteredPayload.personalData = redactedPersonalData;
      }
      
      // Remove highest sensitivity data
      delete filteredPayload.biometricResults;
      delete filteredPayload.financialData;
    }
    // Trust level 8-12: Access to most data with minimal redaction
    else if (trustLevel < 13) {
      // Keep most data but redact specific sensitive fields
      if (filteredPayload.financialData) {
        const redactedFinancialData = { ...filteredPayload.financialData };
        if (redactedFinancialData.accountNumber) redactedFinancialData.accountNumber = '****' + (redactedFinancialData.accountNumber.slice(-4) || '****');
        filteredPayload.financialData = redactedFinancialData;
      }
    }
    // Trust level 13+: Full data access (Fibonacci levels continue growing)
    // No filtering needed
    
    return filteredPayload;
  }
  
  /**
   * Process a universal webhook
   * @param source Source of the webhook
   * @param payload Request body
   * @param headers Request headers
   * @returns Processing result
   */
  public async processUniversalWebhook(
    source: string,
    payload: any,
    headers: Record<string, string>
  ): Promise<WebhookDelivery> {
    // Get first webhook subscription for source (or create a default one if none exists)
    const subscriptions = await storage.getWebhookSubscriptions();
    let subscriptionId = 1; // Default to first subscription
    
    if (subscriptions.length > 0) {
      subscriptionId = subscriptions[0].id;
    }
    
    // Create delivery record
    const delivery = await storage.createWebhookDelivery({
      subscriptionId,
      eventType: payload.eventType || 'unknown',
      status: 'RECEIVED',
      payload: typeof payload === 'string' ? JSON.parse(payload) : payload
    });
    
    return delivery;
  }
  
  /**
   * Import webhook subscriptions from a CSV file
   * @param filepath Path to the CSV file
   * @returns Number of imported subscriptions
   */
  public async importWebhooks(fileBuffer: Buffer): Promise<number> {
    return new Promise((resolve, reject) => {
      const subscriptions: any[] = [];
      
      csv.parseString(fileBuffer.toString(), { headers: true })
        .on('error', error => reject(error))
        .on('data', row => subscriptions.push(row))
        .on('end', async () => {
          try {
            let importCount = 0;
            
            for (const sub of subscriptions) {
              try {
                await storage.createWebhookSubscription({
                  name: sub.name || `Webhook ${importCount + 1}`,
                  url: sub.url,
                  events: sub.events.split(',').map((e: string) => e.trim()),
                  isActive: sub.isActive === 'true' || sub.active === 'true',
                  secret: sub.secret || 'secret',
                  partnerId: sub.partnerId ? parseInt(sub.partnerId) : null,
                  headers: {}
                });
                importCount++;
              } catch (error) {
                log(`Error importing webhook subscription: ${error instanceof Error ? error.message : String(error)}`, 'webhook');
              }
            }
            
            resolve(importCount);
          } catch (error) {
            reject(error);
          }
        });
    });
  }
  
  /**
   * Export webhook subscriptions to a CSV file
   * @param filter Optional filter
   * @returns Path to the exported file
   */
  public async exportWebhooks(filter?: any): Promise<string> {
    const subscriptions = await storage.getWebhookSubscriptions();
    const exportPath = path.join('exports', `webhook-subscriptions-${Date.now()}.csv`);
    
    // Ensure exports directory exists
    if (!fs.existsSync('exports')) {
      fs.mkdirSync('exports', { recursive: true });
    }
    
    return new Promise((resolve, reject) => {
      const csvStream = csv.format({ headers: true });
      const writeStream = fs.createWriteStream(exportPath);
      
      writeStream.on('finish', () => resolve(exportPath));
      writeStream.on('error', reject);
      
      csvStream.pipe(writeStream);
      
      for (const sub of subscriptions) {
        csvStream.write({
          id: sub.id.toString(),
          name: sub.name,
          url: sub.url,
          events: sub.events.join(','),
          isActive: sub.isActive.toString(),
          partnerId: sub.partnerId?.toString() || '',
          secret: sub.secret || ''
        });
      }
      
      csvStream.end();
    });
  }
  
  /**
   * Import webhook subscriptions from a CSV file
   * @param filepath Path to the CSV file
   * @returns Number of imported subscriptions
   */
  public async importSubscriptionsFromCsv(filepath: string): Promise<number> {
    const fileBuffer = await fs.promises.readFile(filepath);
    return this.importWebhooks(fileBuffer);
  }
  
  /**
   * Export webhook data to a CSV file
   * @param filter Optional filter
   * @returns Path to the exported file
   */
  public async exportWebhookDataToCsv(filter?: any): Promise<string> {
    return this.exportWebhooks(filter);
  }
}

// Export singleton instance
export const universalWebhookManager = new UniversalWebhookManager();