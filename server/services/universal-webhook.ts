import { storage } from '../storage';
import { WebhookDelivery, EventType, WebhookSubscription } from '@shared/schema';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'fast-csv';
import { log } from '../vite';

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
   * Register default source handlers
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
    
    // Default handler for Xano
    this.sourceHandlers.set('xano', (headers, payload) => {
      // Normalize Xano webhook data
      return {
        source: 'xano',
        eventType: payload.event_type || 'data.updated',
        timestamp: payload.timestamp || new Date().toISOString(),
        payload
      };
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
        source,
        eventType: normalizedData.eventType,
        status: 'RECEIVED',
        requestHeaders: JSON.stringify(headers),
        requestPayload: JSON.stringify(payload),
        responseStatus: null,
        responseBody: null,
        error: null
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
      source: 'test',
      eventType,
      status: 'PENDING',
      requestHeaders: JSON.stringify({}),
      requestPayload: JSON.stringify(payload),
      responseStatus: null,
      responseBody: null,
      error: null
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
        null,
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
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    return hmac.digest('hex');
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
    // Create delivery record
    const delivery = await storage.createWebhookDelivery({
      source,
      eventType: payload.eventType || 'unknown',
      status: 'RECEIVED',
      requestHeaders: JSON.stringify(headers),
      requestPayload: JSON.stringify(payload),
      responseStatus: null,
      responseBody: null,
      error: null
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
                  userId: parseInt(sub.userId) || 1,
                  url: sub.url,
                  events: sub.events.split(',').map((e: string) => e.trim()),
                  description: sub.description || '',
                  active: sub.active === 'true',
                  secret: sub.secret || null
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
          userId: sub.userId.toString(),
          url: sub.url,
          events: sub.events.join(','),
          description: sub.description,
          active: sub.active.toString(),
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