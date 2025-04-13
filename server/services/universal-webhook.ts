import { storage } from '../storage';
import { log } from '../vite';
import { EventType, WebhookSubscription } from '@shared/schema';
import { syncToNotion } from './notion';
import crypto from 'crypto';
import axios from 'axios';
import * as csv from 'fast-csv';
import fs from 'fs';
import path from 'path';
import { CronJob } from 'cron';

/**
 * Universal Webhook Management System
 * 
 * This service handles all aspects of webhook management:
 * - Receiving webhooks from external sources
 * - Normalizing and validating webhook data
 * - Storing webhook events in the database
 * - Processing webhook data with triggers and background tasks
 * - Exporting webhook data to CSV
 * - Synchronizing data with external services (Notion, PinkSync, etc.)
 */
export class UniversalWebhookManager {
  // Directory for storing exported CSV files
  private static exportDir = path.join(process.cwd(), 'exports');
  
  // Collection of active background tasks (cron jobs)
  private static activeTasks: Record<string, CronJob> = {};
  
  // External service configurations
  private static externalServices: Record<string, any> = {};
  
  // Custom source handlers for validating and normalizing webhooks
  private static customSourceHandlers: Record<string, {
    validateSignature: (payload: any, headers: Record<string, string>) => boolean;
    normalize: (data: any) => Record<string, any>;
  }> = {};
  
  /**
   * Initialize the webhook manager
   */
  public static async initialize(): Promise<void> {
    try {
      // Ensure export directory exists
      if (!fs.existsSync(this.exportDir)) {
        fs.mkdirSync(this.exportDir, { recursive: true });
      }
      
      // Start any configured background tasks
      await this.startScheduledTasks();
      
      log('Universal Webhook Manager initialized', 'webhook');
    } catch (error) {
      log(`Error initializing webhook manager: ${error}`, 'webhook');
    }
  }
  
  /**
   * Start configured background tasks
   */
  private static async startScheduledTasks(): Promise<void> {
    // Example scheduled task: retry failed webhook deliveries every 15 minutes
    this.createBackgroundTask(
      'retry-failed-webhooks',
      '*/15 * * * *', // every 15 minutes
      async () => {
        try {
          log('Running scheduled task: retry-failed-webhooks', 'webhook');
          
          // Find all webhooks with status 'failed' and less than 5 attempts
          const deliveries = await storage.getWebhookDeliveries();
          const failedDeliveries = deliveries.filter(
            d => d.status === 'failed' && (d.attempts || 0) < 5
          );
          
          log(`Found ${failedDeliveries.length} failed webhook deliveries to retry`, 'webhook');
          
          // Process each failed delivery
          for (const delivery of failedDeliveries) {
            try {
              const subscription = await storage.getWebhookSubscription(delivery.subscriptionId);
              if (!subscription || !subscription.isActive) continue;
              
              log(`Retrying webhook delivery ${delivery.id}`, 'webhook');
              
              // Make the webhook call
              const response = await axios.post(
                subscription.url,
                delivery.payload,
                {
                  headers: {
                    'Content-Type': 'application/json',
                    'X-FibonRoseTrust-Event': delivery.eventType,
                    ...subscription.headers
                  },
                  timeout: 10000
                }
              );
              
              // Update delivery status to success
              await storage.updateWebhookDeliveryStatus(
                delivery.id,
                'success',
                response.status,
                JSON.stringify(response.data)
              );
              
              log(`Successfully retried webhook delivery ${delivery.id}`, 'webhook');
            } catch (error) {
              log(`Error retrying webhook delivery ${delivery.id}: ${error}`, 'webhook');
              
              // Update delivery status to failed with incremented attempt count
              await storage.updateWebhookDeliveryStatus(
                delivery.id,
                'failed',
                error.response?.status,
                null,
                error.message
              );
            }
          }
        } catch (error) {
          log(`Error in retry-failed-webhooks task: ${error}`, 'webhook');
        }
      }
    );
    
    // Example scheduled task: export webhook data to CSV daily
    this.createBackgroundTask(
      'export-webhook-data',
      '0 0 * * *', // daily at midnight
      async () => {
        try {
          log('Running scheduled task: export-webhook-data', 'webhook');
          await this.exportWebhookDataToCsv();
        } catch (error) {
          log(`Error in export-webhook-data task: ${error}`, 'webhook');
        }
      }
    );
  }
  
  /**
   * Create a new background task
   * @param taskId Unique identifier for the task
   * @param schedule Cron schedule expression
   * @param taskFn Function to execute
   */
  public static createBackgroundTask(
    taskId: string,
    schedule: string,
    taskFn: () => Promise<void>
  ): void {
    try {
      // Stop existing task if it exists
      if (this.activeTasks[taskId]) {
        this.activeTasks[taskId].stop();
      }
      
      // Create and start new task
      const job = new CronJob(
        schedule,
        async () => {
          try {
            await taskFn();
          } catch (error) {
            log(`Error in background task ${taskId}: ${error}`, 'webhook');
          }
        },
        null, // onComplete
        true, // start
        'UTC' // timezone
      );
      
      this.activeTasks[taskId] = job;
      log(`Background task ${taskId} created with schedule: ${schedule}`, 'webhook');
    } catch (error) {
      log(`Error creating background task ${taskId}: ${error}`, 'webhook');
    }
  }
  
  /**
   * Register a custom source handler for webhook validation and normalization
   * @param source Source identifier (e.g., 'xano', 'notion')
   * @param handler Handler with validation and normalization functions
   */
  public static registerCustomSourceHandler(
    source: string,
    handler: {
      validateSignature: (payload: any, headers: Record<string, string>) => boolean;
      normalize: (data: any) => Record<string, any>;
    }
  ): void {
    this.customSourceHandlers[source] = handler;
    log(`Registered custom webhook handler for source: ${source}`, 'webhook');
  }
  
  /**
   * Process an incoming webhook from an external source
   * @param source Source of the webhook
   * @param headers HTTP headers
   * @param body Request body
   * @returns Processed webhook data
   */
  public static async processIncomingWebhook(
    source: string,
    headers: Record<string, string>,
    body: any
  ): Promise<any> {
    try {
      log(`Processing incoming webhook from ${source}`, 'webhook');
      
      // Validate webhook signature if we have a custom handler
      if (this.customSourceHandlers[source]) {
        const isValid = this.customSourceHandlers[source].validateSignature(body, headers);
        if (!isValid) {
          throw new Error(`Invalid signature for webhook from ${source}`);
        }
        log(`Validated signature for webhook from ${source}`, 'webhook');
      }
      
      // Normalize the webhook data based on source
      const normalizedData = await this.normalizeWebhookData(source, body);
      
      // Validate the webhook data
      const validationResult = this.validateWebhookData(source, normalizedData);
      if (!validationResult.valid) {
        throw new Error(`Invalid webhook data: ${validationResult.error}`);
      }
      
      // Store the webhook data
      const webhookData = {
        source,
        eventType: normalizedData.eventType || 'unknown',
        timestamp: new Date().toISOString(),
        rawData: body,
        normalizedData,
        status: 'received'
      };
      
      // Here you would store in database - for our demo we'll return the processed data
      log(`Successfully processed webhook from ${source}`, 'webhook');
      
      // Trigger any configured actions for this webhook source/type
      await this.triggerWebhookActions(source, normalizedData);
      
      return {
        success: true,
        data: webhookData
      };
    } catch (error) {
      log(`Error processing webhook from ${source}: ${error}`, 'webhook');
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Normalize webhook data from different sources into a standard format
   * @param source Source of the webhook
   * @param data Raw webhook data
   * @returns Normalized data
   */
  private static async normalizeWebhookData(
    source: string,
    data: any
  ): Promise<Record<string, any>> {
    // Check if we have a custom handler for this source
    if (this.customSourceHandlers[source]) {
      return this.customSourceHandlers[source].normalize(data);
    }
    
    // Default handlers for builtin sources
    switch (source) {
      case 'notion':
        return this.normalizeNotionWebhook(data);
      case 'pinksync':
        return this.normalizePinkSyncWebhook(data);
      case 'xano':
        return this.normalizeXanoWebhook(data);
      default:
        // Generic normalization for unknown sources
        return {
          eventType: data.event_type || data.event || data.type || 'unknown',
          timestamp: data.timestamp || data.created_at || new Date().toISOString(),
          payload: data,
          source
        };
    }
  }
  
  /**
   * Normalize a webhook from Notion
   * @param data Raw Notion webhook data
   * @returns Normalized data
   */
  private static normalizeNotionWebhook(data: any): Record<string, any> {
    return {
      eventType: `notion.${data.type || 'unknown'}`,
      objectId: data.object_id || null,
      workspaceId: data.workspace_id || null,
      timestamp: new Date().toISOString(),
      payload: data
    };
  }
  
  /**
   * Normalize a webhook from PinkSync
   * @param data Raw PinkSync webhook data
   * @returns Normalized data
   */
  private static normalizePinkSyncWebhook(data: any): Record<string, any> {
    return {
      eventType: `pinksync.${data.event || 'unknown'}`,
      projectId: data.project_id || null,
      userId: data.user_id || null,
      timestamp: data.timestamp || new Date().toISOString(),
      payload: data
    };
  }
  
  /**
   * Normalize a webhook from Xano
   * @param data Raw Xano webhook data
   * @returns Normalized data
   */
  private static normalizeXanoWebhook(data: any): Record<string, any> {
    return {
      eventType: `xano.${data.event_type || 'unknown'}`,
      recordId: data.record_id || null,
      timestamp: data.timestamp || new Date().toISOString(),
      payload: data
    };
  }
  
  /**
   * Validate webhook data
   * @param source Source of the webhook
   * @param data Normalized webhook data
   * @returns Validation result
   */
  private static validateWebhookData(
    source: string,
    data: Record<string, any>
  ): { valid: boolean; error?: string } {
    // Basic validation - ensure required fields are present
    if (!data.eventType) {
      return { valid: false, error: 'Missing eventType' };
    }
    
    // Source-specific validation could be added here
    switch (source) {
      case 'notion':
        if (!data.objectId) {
          return { valid: false, error: 'Missing objectId for Notion webhook' };
        }
        break;
      case 'pinksync':
        if (!data.projectId) {
          return { valid: false, error: 'Missing projectId for PinkSync webhook' };
        }
        break;
    }
    
    return { valid: true };
  }
  
  /**
   * Trigger actions based on webhook source and data
   * @param source Source of the webhook
   * @param data Normalized webhook data
   */
  private static async triggerWebhookActions(
    source: string,
    data: Record<string, any>
  ): Promise<void> {
    try {
      // Route to appropriate handler based on source and event type
      switch (source) {
        case 'notion':
          if (data.eventType === 'notion.page_updated') {
            // Handle Notion page update
            // For example, sync data to other services
          }
          break;
        case 'pinksync':
          if (data.eventType === 'pinksync.task_completed') {
            // Handle PinkSync task completion
            // For example, trigger a verification process
          }
          break;
        case 'xano':
          if (data.eventType.startsWith('xano.record_')) {
            // Handle Xano record events
            // For example, sync to Notion
          }
          break;
      }
      
      // General webhook forwarding to registered subscribers
      await this.forwardWebhookToSubscribers(data.eventType, data);
    } catch (error) {
      log(`Error triggering webhook actions: ${error}`, 'webhook');
    }
  }
  
  /**
   * Forward a webhook to all subscribers
   * @param eventType Event type
   * @param data Webhook data
   */
  private static async forwardWebhookToSubscribers(
    eventType: string,
    data: Record<string, any>
  ): Promise<void> {
    try {
      // Find all active subscriptions for this event type
      const subscriptions = await storage.getWebhookSubscriptions();
      const matchingSubscriptions = subscriptions.filter(
        subscription => subscription.isActive && subscription.events.includes(eventType as any)
      );
      
      if (matchingSubscriptions.length === 0) {
        return;
      }
      
      log(`Forwarding webhook for event ${eventType} to ${matchingSubscriptions.length} subscribers`, 'webhook');
      
      // Forward to each subscription
      for (const subscription of matchingSubscriptions) {
        try {
          // Create signature for the webhook
          const signature = this.createSignature(data, subscription.secret);
          
          // Set up the headers
          const headers = {
            'Content-Type': 'application/json',
            'X-FibonRoseTrust-Signature': signature,
            'X-FibonRoseTrust-Event': eventType,
            ...subscription.headers
          };
          
          // Make the POST request to the webhook URL
          await axios.post(subscription.url, data, {
            headers,
            timeout: 10000
          });
          
          log(`Successfully forwarded webhook to ${subscription.name}`, 'webhook');
        } catch (error) {
          log(`Error forwarding webhook to ${subscription.name}: ${error}`, 'webhook');
        }
      }
    } catch (error) {
      log(`Error forwarding webhook: ${error}`, 'webhook');
    }
  }
  
  /**
   * Create a signature for webhook payload
   * @param payload Webhook payload
   * @param secret Secret for signing
   * @returns Signature
   */
  private static createSignature(payload: any, secret: string): string {
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', secret);
    return hmac.update(payloadString).digest('hex');
  }
  
  /**
   * Export webhook data to CSV
   * @param filter Optional filter for the data to export
   * @returns Path to the exported CSV file
   */
  public static async exportWebhookDataToCsv(filter?: Record<string, any>): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `webhook-data-${timestamp}.csv`;
      const filepath = path.join(this.exportDir, filename);
      
      // Get webhook deliveries
      const deliveries = await storage.getWebhookDeliveries();
      
      // Apply filter if provided
      const filteredDeliveries = filter
        ? deliveries.filter(d => {
            // Implement filtering logic based on the filter object
            // This is a simple example that checks if all filter criteria match
            return Object.entries(filter).every(([key, value]) => {
              return d[key] === value;
            });
          })
        : deliveries;
      
      // Transform data for CSV export
      const csvData = filteredDeliveries.map(d => ({
        id: d.id,
        subscriptionId: d.subscriptionId,
        eventType: d.eventType,
        status: d.status,
        statusCode: d.statusCode,
        createdAt: d.createdAt,
        processedAt: d.processedAt,
        attempts: d.attempts,
        payloadJson: JSON.stringify(d.payload)
      }));
      
      // Write to CSV file
      const writableStream = fs.createWriteStream(filepath);
      
      return new Promise((resolve, reject) => {
        csv.write(csvData, { headers: true })
          .pipe(writableStream)
          .on('finish', () => {
            log(`Exported ${csvData.length} webhook records to ${filepath}`, 'webhook');
            resolve(filepath);
          })
          .on('error', (error) => {
            log(`Error exporting webhook data: ${error}`, 'webhook');
            reject(error);
          });
      });
    } catch (error) {
      log(`Error exporting webhook data: ${error}`, 'webhook');
      throw error;
    }
  }
  
  /**
   * Import webhook subscriptions from CSV
   * @param filepath Path to the CSV file
   * @returns Number of imported records
   */
  public static async importSubscriptionsFromCsv(filepath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const results = [];
      
      fs.createReadStream(filepath)
        .pipe(csv.parse({ headers: true }))
        .on('data', (data) => {
          results.push(data);
        })
        .on('end', async () => {
          try {
            let importCount = 0;
            
            for (const row of results) {
              try {
                // Parse events array from JSON string
                const events = row.events ? JSON.parse(row.events) : [];
                // Parse headers object from JSON string
                const headers = row.headers ? JSON.parse(row.headers) : {};
                
                // Create webhook subscription
                await storage.createWebhookSubscription({
                  name: row.name,
                  url: row.url,
                  secret: row.secret || crypto.randomBytes(16).toString('hex'),
                  events,
                  isActive: row.isActive === 'true',
                  partnerId: parseInt(row.partnerId) || null,
                  headers
                });
                
                importCount++;
              } catch (error) {
                log(`Error importing subscription row: ${error}`, 'webhook');
              }
            }
            
            log(`Imported ${importCount} webhook subscriptions from ${filepath}`, 'webhook');
            resolve(importCount);
          } catch (error) {
            log(`Error importing webhook subscriptions: ${error}`, 'webhook');
            reject(error);
          }
        })
        .on('error', (error) => {
          log(`Error parsing CSV: ${error}`, 'webhook');
          reject(error);
        });
    });
  }
  
  /**
   * Register a PinkSync integration
   * @param apiKey PinkSync API key
   * @param projectId PinkSync project ID
   * @param webhookUrl URL to receive PinkSync webhooks
   */
  public static registerPinkSyncIntegration(
    apiKey: string,
    projectId: string,
    webhookUrl: string
  ): void {
    this.externalServices.pinksync = {
      apiKey,
      projectId,
      webhookUrl
    };
    
    log(`Registered PinkSync integration for project ${projectId}`, 'webhook');
  }
  
  /**
   * Register a Xano AI integration
   * @param apiKey Xano API key
   * @param baseUrl Xano API base URL
   * @param webhookSecret Secret for validating Xano webhooks
   * @param aiEnabled Whether to enable AI features
   */
  public static registerXanoIntegration(
    apiKey: string,
    baseUrl: string,
    webhookSecret?: string,
    aiEnabled: boolean = false
  ): void {
    this.externalServices.xano = {
      apiKey,
      baseUrl,
      webhookSecret,
      aiEnabled
    };
    
    log(`Registered Xano integration with base URL ${baseUrl}`, 'webhook');
  }
  
  /**
   * Get all webhook data with optional filtering
   * @param filter Optional filter criteria
   * @returns Filtered webhook data
   */
  public static async getWebhookData(filter?: Record<string, any>): Promise<any[]> {
    try {
      // Get webhook deliveries
      const deliveries = await storage.getWebhookDeliveries();
      
      // Apply filter if provided
      if (filter) {
        return deliveries.filter(d => {
          // Implement filtering logic based on the filter object
          return Object.entries(filter).every(([key, value]) => {
            // Handle special cases like date ranges
            if (key === 'createdAfter' && d.createdAt) {
              return new Date(d.createdAt) > new Date(value as string);
            }
            if (key === 'createdBefore' && d.createdAt) {
              return new Date(d.createdAt) < new Date(value as string);
            }
            // Default exact match
            return d[key] === value;
          });
        });
      }
      
      return deliveries;
    } catch (error) {
      log(`Error getting webhook data: ${error}`, 'webhook');
      throw error;
    }
  }
}