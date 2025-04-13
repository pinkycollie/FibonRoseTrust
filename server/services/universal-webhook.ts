import axios from 'axios';
import { storage } from '../storage';
import { log } from '../vite';
import { cron } from 'cron';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { Readable } from 'stream';
import * as csv from 'fast-csv';
import { parse as csvParse } from 'csv-parser';
import { format } from 'date-fns';
import { EventType, EventTypes, InsertWebhookDelivery, InsertWebhookSubscription, WebhookDelivery } from '@shared/schema';
import { XanoIntegration } from './integrations/xano';

// Type for the normalized webhook payload
export interface NormalizedWebhook {
  source: string;
  eventType: EventType;
  payload: unknown;
  timestamp: string;
  metadata?: Record<string, any>;
}

/**
 * Universal Webhook Manager
 * Handles webhooks from multiple sources and processes them in a unified way
 */
export class UniversalWebhookManager {
  private static instance: UniversalWebhookManager;
  private retryJob: cron.ScheduledTask;
  private exportJob: cron.ScheduledTask;
  private exportPath = path.join(process.cwd(), 'exports');

  private constructor() {
    // Ensure exports directory exists
    if (!fs.existsSync(this.exportPath)) {
      fs.mkdirSync(this.exportPath, { recursive: true });
    }

    // Schedule retry job to run every 15 minutes
    this.retryJob = cron.job('*/15 * * * *', () => {
      this.retryFailedWebhooks();
    });
    this.retryJob.start();
    log(`Background task retry-failed-webhooks created with schedule: */15 * * * *`, 'webhook');

    // Schedule export job to run every day at midnight
    this.exportJob = cron.job('0 0 * * *', () => {
      this.exportWebhookData();
    });
    this.exportJob.start();
    log(`Background task export-webhook-data created with schedule: 0 0 * * *`, 'webhook');
  }

  /**
   * Get the singleton instance of the webhook manager
   * @returns The webhook manager instance
   */
  public static getInstance(): UniversalWebhookManager {
    if (!UniversalWebhookManager.instance) {
      UniversalWebhookManager.instance = new UniversalWebhookManager();
      log('Universal Webhook Manager initialized', 'webhook');
    }
    return UniversalWebhookManager.instance;
  }

  /**
   * Process an incoming webhook from any source
   * @param source The source of the webhook (e.g., 'xano', 'notion')
   * @param body The webhook body
   * @param headers The webhook headers
   * @returns The processed webhook delivery
   */
  public async processUniversalWebhook(
    source: string,
    body: any,
    headers: Record<string, string>
  ): Promise<WebhookDelivery> {
    try {
      // Normalize the webhook based on its source
      const normalizedWebhook = this.normalizeWebhook(source, body, headers);

      // Create a record of the webhook delivery
      const delivery: InsertWebhookDelivery = {
        subscriptionId: 0, // This will be updated for each matching subscription
        eventType: normalizedWebhook.eventType,
        payload: normalizedWebhook.payload,
        status: 'pending'
      };

      // Find subscriptions that match this event type
      const subscriptions = await storage.getWebhookSubscriptions();
      const matchingSubscriptions = subscriptions.filter(
        (sub) => sub.isActive && sub.events.includes(normalizedWebhook.eventType)
      );

      if (matchingSubscriptions.length === 0) {
        // No matching subscriptions, just record the delivery
        const deliveryRecord = await storage.createWebhookDelivery({
          ...delivery,
          status: 'skipped',
          errorMessage: 'No matching active subscriptions found'
        });
        return deliveryRecord;
      }

      // Process matching subscriptions
      let successCount = 0;
      for (const subscription of matchingSubscriptions) {
        try {
          // Create a delivery record for this subscription
          const subDelivery = await storage.createWebhookDelivery({
            ...delivery,
            subscriptionId: subscription.id
          });

          // Send the webhook
          await this.sendWebhook(subDelivery, subscription.url, subscription.secret, subscription.headers as Record<string, string> || {});
          successCount++;
        } catch (error) {
          // Log error but continue with next subscription
          log(`Error processing webhook for subscription ${subscription.id}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'webhook');
        }
      }

      // Return the last delivery record
      const lastDelivery = await storage.getWebhookDeliveries();
      return lastDelivery[lastDelivery.length - 1];
    } catch (error) {
      log(`Error in processUniversalWebhook: ${error instanceof Error ? error.message : 'Unknown error'}`, 'webhook');
      throw error;
    }
  }

  /**
   * Send a webhook to a subscription endpoint
   * @param delivery The webhook delivery record
   * @param url The destination URL
   * @param secret The webhook secret for signature
   * @param headers Additional headers to include
   */
  public async sendWebhook(
    delivery: WebhookDelivery,
    url: string,
    secret: string,
    headers: Record<string, string> = {}
  ): Promise<void> {
    try {
      // Prepare the payload
      const payload = {
        id: delivery.id,
        event: delivery.eventType,
        created_at: delivery.createdAt.toISOString(),
        data: delivery.payload
      };

      // Calculate signature if secret is provided
      let signature = '';
      if (secret) {
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(JSON.stringify(payload));
        signature = hmac.digest('hex');
      }

      // Prepare headers
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'FibonroseTrust-Webhook/1.0',
        'X-Webhook-ID': String(delivery.id),
        'X-Webhook-Signature': signature,
        ...headers
      };

      // Send the webhook
      const response = await axios.post(url, payload, {
        headers: requestHeaders,
        timeout: 10000 // 10 second timeout
      });

      // Update delivery status based on response
      await storage.updateWebhookDeliveryStatus(
        delivery.id,
        'success',
        response.status,
        JSON.stringify({
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data
        }).substring(0, 5000) // Limit response size
      );
    } catch (error) {
      // Handle errors
      if (axios.isAxiosError(error)) {
        await storage.updateWebhookDeliveryStatus(
          delivery.id,
          'failed',
          error.response?.status || null,
          error.response ? JSON.stringify({
            status: error.response.status,
            statusText: error.response.statusText,
            headers: error.response.headers,
            data: error.response.data
          }).substring(0, 5000) : null,
          error.message
        );
      } else {
        await storage.updateWebhookDeliveryStatus(
          delivery.id,
          'failed',
          null,
          null,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }
  }

  /**
   * Test a webhook subscription by sending a test event
   * @param subscriptionId The ID of the subscription to test
   * @param eventType The event type to send
   * @param payload The payload to send
   * @returns The delivery record
   */
  public async testWebhook(
    subscriptionId: number,
    eventType: EventType,
    payload: any
  ): Promise<WebhookDelivery> {
    try {
      // Get the subscription
      const subscription = await storage.getWebhookSubscription(subscriptionId);
      if (!subscription) {
        throw new Error(`Webhook subscription ${subscriptionId} not found`);
      }

      // Create a test delivery
      const delivery: InsertWebhookDelivery = {
        subscriptionId,
        eventType,
        payload,
        status: 'pending'
      };

      // Create and send the webhook
      const deliveryRecord = await storage.createWebhookDelivery(delivery);
      await this.sendWebhook(
        deliveryRecord,
        subscription.url,
        subscription.secret,
        subscription.headers as Record<string, string> || {}
      );

      // Return the updated delivery record
      return await storage.getWebhookDelivery(deliveryRecord.id) as WebhookDelivery;
    } catch (error) {
      log(`Error in testWebhook: ${error instanceof Error ? error.message : 'Unknown error'}`, 'webhook');
      throw error;
    }
  }

  /**
   * Import webhook subscriptions from a CSV file
   * @param csvFileBuffer The CSV file as a buffer
   * @returns Number of imported subscriptions
   */
  public async importWebhooks(csvFileBuffer: Buffer): Promise<number> {
    return new Promise((resolve, reject) => {
      const results: InsertWebhookSubscription[] = [];
      const stream = Readable.from(csvFileBuffer);

      stream
        .pipe(csvParse({ headers: true, trim: true }))
        .on('data', (data: any) => {
          // Convert events from comma-separated string to array
          const events = data.events.split(',').map((e: string) => e.trim());
          
          // Convert isActive from string to boolean
          const isActive = data.isActive === 'true' || data.isActive === '1';
          
          // Parse headers from JSON string if present
          let headers = {};
          try {
            if (data.headers) {
              headers = JSON.parse(data.headers);
            }
          } catch (e) {
            // Ignore parsing errors
          }

          results.push({
            name: data.name,
            url: data.url,
            secret: data.secret || '',
            events,
            isActive,
            partnerId: data.partnerId ? parseInt(data.partnerId, 10) : undefined,
            headers
          });
        })
        .on('error', reject)
        .on('end', async () => {
          try {
            let importCount = 0;
            for (const webhook of results) {
              await storage.createWebhookSubscription(webhook);
              importCount++;
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
   * @returns The path to the exported file
   */
  public async exportWebhooks(): Promise<string> {
    const webhooks = await storage.getWebhookSubscriptions();
    
    // Format webhooks for CSV export
    const formattedWebhooks = webhooks.map(webhook => ({
      id: webhook.id,
      name: webhook.name,
      url: webhook.url,
      secret: webhook.secret,
      events: webhook.events.join(','),
      isActive: webhook.isActive ? 'true' : 'false',
      partnerId: webhook.partnerId || '',
      headers: JSON.stringify(webhook.headers),
      createdAt: webhook.createdAt.toISOString()
    }));

    // Define the export path
    const filename = `webhook_subscriptions_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    const filePath = path.join(this.exportPath, filename);

    // Write to CSV
    return new Promise((resolve, reject) => {
      const ws = fs.createWriteStream(filePath);
      csv.write(formattedWebhooks, { headers: true })
        .pipe(ws)
        .on('finish', () => resolve(filePath))
        .on('error', reject);
    });
  }

  /**
   * Retry failed webhook deliveries
   * @param maxAttempts Maximum number of retry attempts (default: 5)
   */
  private async retryFailedWebhooks(maxAttempts = 5): Promise<void> {
    try {
      // Get all failed webhook deliveries with fewer than maxAttempts
      const deliveries = await storage.getWebhookDeliveries();
      const failedDeliveries = deliveries.filter(
        d => d.status === 'failed' && d.attempts < maxAttempts
      );

      log(`Retrying ${failedDeliveries.length} failed webhook deliveries`, 'webhook');

      for (const delivery of failedDeliveries) {
        try {
          // Get the subscription
          const subscription = await storage.getWebhookSubscription(delivery.subscriptionId);
          if (!subscription || !subscription.isActive) {
            // Skip inactive or deleted subscriptions
            continue;
          }

          // Retry sending the webhook
          await this.sendWebhook(
            delivery,
            subscription.url,
            subscription.secret,
            subscription.headers as Record<string, string> || {}
          );
        } catch (error) {
          // Log error but continue with next delivery
          log(`Error retrying webhook delivery ${delivery.id}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'webhook');
        }
      }
    } catch (error) {
      log(`Error in retryFailedWebhooks: ${error instanceof Error ? error.message : 'Unknown error'}`, 'webhook');
    }
  }

  /**
   * Export webhook data to CSV files
   */
  private async exportWebhookData(): Promise<void> {
    try {
      // Export webhook subscriptions
      const subscriptionsPath = await this.exportWebhooks();
      log(`Exported webhook subscriptions to ${subscriptionsPath}`, 'webhook');

      // Export webhook deliveries
      const deliveries = await storage.getWebhookDeliveries();
      
      // Format deliveries for CSV export
      const formattedDeliveries = deliveries.map(delivery => {
        const basicDelivery: Record<string, any> = {
          id: delivery.id,
          subscriptionId: delivery.subscriptionId,
          eventType: delivery.eventType,
          status: delivery.status,
          statusCode: delivery.statusCode || '',
          attempts: delivery.attempts,
          createdAt: delivery.createdAt.toISOString(),
          processedAt: delivery.processedAt ? delivery.processedAt.toISOString() : ''
        };

        // Add truncated payload, response and error message
        if (delivery.payload) {
          basicDelivery.payload = JSON.stringify(delivery.payload).substring(0, 500);
        }
        
        if (delivery.response) {
          basicDelivery.response = delivery.response.substring(0, 500);
        }
        
        if (delivery.errorMessage) {
          basicDelivery.errorMessage = delivery.errorMessage.substring(0, 500);
        }

        return basicDelivery;
      });

      // Define the export path
      const filename = `webhook_deliveries_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
      const filePath = path.join(this.exportPath, filename);

      // Write to CSV
      await new Promise<void>((resolve, reject) => {
        const ws = fs.createWriteStream(filePath);
        csv.write(formattedDeliveries, { headers: true })
          .pipe(ws)
          .on('finish', () => resolve())
          .on('error', reject);
      });

      log(`Exported webhook deliveries to ${filePath}`, 'webhook');
    } catch (error) {
      log(`Error in exportWebhookData: ${error instanceof Error ? error.message : 'Unknown error'}`, 'webhook');
    }
  }

  /**
   * Normalize a webhook based on its source
   * @param source The source of the webhook
   * @param body The webhook body
   * @param headers The webhook headers
   * @returns A normalized webhook
   */
  private normalizeWebhook(
    source: string,
    body: any,
    headers: Record<string, string>
  ): NormalizedWebhook {
    switch (source.toLowerCase()) {
      case 'xano':
        return this.normalizeXanoWebhook(body, headers);
      case 'notion':
        return this.normalizeNotionWebhook(body, headers);
      default:
        // Generic normalization for unknown sources
        return {
          source,
          eventType: body.event_type || EventTypes.GENERIC,
          payload: body,
          timestamp: new Date().toISOString(),
          metadata: { headers }
        };
    }
  }

  /**
   * Normalize a webhook from Xano
   * @param body The webhook body
   * @param headers The webhook headers
   * @returns A normalized webhook
   */
  private normalizeXanoWebhook(
    body: any,
    headers: Record<string, string>
  ): NormalizedWebhook {
    // Use our dedicated Xano integration
    return XanoIntegration.processWebhook(headers, body) as NormalizedWebhook;
  }

  /**
   * Normalize a webhook from Notion
   * @param body The webhook body
   * @param headers The webhook headers
   * @returns A normalized webhook
   */
  private normalizeNotionWebhook(
    body: any,
    headers: Record<string, string>
  ): NormalizedWebhook {
    // Extract Notion event type
    let eventType = EventTypes.GENERIC;
    if (body.type === 'block_changed') {
      eventType = 'notion.block.changed';
    } else if (body.type === 'page_changed') {
      eventType = 'notion.page.changed';
    } else if (body.type === 'database_changed') {
      eventType = 'notion.database.changed';
    }

    return {
      source: 'notion',
      eventType: eventType as EventType,
      payload: body,
      timestamp: body.timestamp || new Date().toISOString(),
      metadata: {
        notionWorkspaceId: body.workspace_id,
        notionObjectId: body.object_id,
        headers
      }
    };
  }
}

// Export the singleton instance
export const universalWebhookManager = UniversalWebhookManager.getInstance();