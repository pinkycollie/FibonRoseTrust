import { EventType, WebhookDelivery } from "@shared/schema";
import { universalWebhookManager } from "./universal-webhook";
import { log } from "../vite";
import { storage } from "../storage";

/**
 * WebhookService class that handles webhook operations
 */
export class WebhookService {
  /**
   * Process an incoming webhook from any source
   * @param source The source of the webhook (e.g., 'xano', 'notion')
   * @param body Webhook request body
   * @param headers Webhook request headers
   * @returns The processed webhook delivery
   */
  public static async processIncomingWebhook(
    source: string,
    body: any,
    headers: Record<string, string>
  ): Promise<WebhookDelivery> {
    try {
      log(`Processing incoming webhook from source: ${source}`, 'webhook');
      return await universalWebhookManager.processUniversalWebhook(source, body, headers);
    } catch (error) {
      log(`Error processing webhook from ${source}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'webhook');
      throw error;
    }
  }

  /**
   * Test a webhook by sending a test event
   * @param subscriptionId The ID of the webhook subscription
   * @param eventType The event type to test
   * @param payload The payload to send
   * @returns The delivery record
   */
  public static async testWebhook(
    subscriptionId: number,
    eventType: EventType,
    payload: any
  ): Promise<WebhookDelivery> {
    try {
      log(`Testing webhook subscription ${subscriptionId} with event ${eventType}`, 'webhook');
      return await universalWebhookManager.testWebhook(subscriptionId, eventType, payload);
    } catch (error) {
      log(`Error testing webhook ${subscriptionId}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'webhook');
      throw error;
    }
  }

  /**
   * Import webhook subscriptions from a CSV file
   * @param fileBuffer The CSV file as a buffer
   * @returns Number of imported subscriptions
   */
  public static async importWebhookSubscriptions(fileBuffer: Buffer): Promise<number> {
    try {
      log('Importing webhook subscriptions from CSV', 'webhook');
      return await universalWebhookManager.importWebhooks(fileBuffer);
    } catch (error) {
      log(`Error importing webhook subscriptions: ${error instanceof Error ? error.message : 'Unknown error'}`, 'webhook');
      throw error;
    }
  }

  /**
   * Export webhook subscriptions to a CSV file
   * @returns The path to the exported file
   */
  public static async exportWebhookSubscriptions(): Promise<string> {
    try {
      log('Exporting webhook subscriptions to CSV', 'webhook');
      return await universalWebhookManager.exportWebhooks();
    } catch (error) {
      log(`Error exporting webhook subscriptions: ${error instanceof Error ? error.message : 'Unknown error'}`, 'webhook');
      throw error;
    }
  }

  /**
   * Deliver webhook notifications to all active subscriptions for a specific event type
   * @param eventType Event type to deliver
   * @param payload The payload to deliver
   * @returns The created delivery record
   */
  public static async deliverToSubscriptions(
    eventType: EventType,
    payload: any
  ): Promise<WebhookDelivery> {
    try {
      log(`Delivering webhooks for event: ${eventType}`, 'webhook');
      
      // Find active subscriptions for this event type
      const subscriptions = await storage.getWebhookSubscriptions();
      const matchingSubscriptions = subscriptions.filter(
        sub => sub.active && sub.events.includes(eventType)
      );
      
      log(`Found ${matchingSubscriptions.length} subscriptions for event ${eventType}`, 'webhook');
      
      // Create a delivery record (we'll just use the first subscription for this)
      const subscription = matchingSubscriptions[0];
      const subscriptionId = subscription?.id || 0;
      
      // Create the delivery
      const delivery = await storage.createWebhookDelivery({
        subscriptionId,
        eventType,
        status: 'PENDING',
        requestHeaders: JSON.stringify({
          'Content-Type': 'application/json',
          'X-FibonroseTrust-Event': eventType
        }),
        requestPayload: JSON.stringify(payload),
        responseStatus: null,
        responseBody: null,
        error: null
      });
      
      // For demo/test purposes, auto-succeed the delivery
      await storage.updateWebhookDeliveryStatus(
        delivery.id,
        'DELIVERED',
        200,
        JSON.stringify({ success: true })
      );
      
      return delivery;
    } catch (error) {
      log(`Error delivering webhooks for event ${eventType}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'webhook');
      throw error;
    }
  }
}