import crypto from 'crypto';
import { WebhookSubscription, WebhookDelivery, EventType, InsertWebhookDelivery } from '@shared/schema';
import { storage } from '../storage';
import { log } from '../vite';
import axios from 'axios';

/**
 * Service for managing webhooks
 */
export class WebhookService {
  /**
   * Create HMAC signature for webhook payload
   */
  private static createSignature(payload: any, secret: string): string {
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', secret);
    return hmac.update(payloadString).digest('hex');
  }
  
  /**
   * Deliver a webhook to all matching subscriptions
   */
  public static async deliverToSubscriptions(eventType: EventType, payload: any): Promise<void> {
    try {
      // Find all active subscriptions for this event type
      const subscriptions = await storage.getWebhookSubscriptions();
      const matchingSubscriptions = subscriptions.filter(
        subscription => subscription.isActive && subscription.events.includes(eventType)
      );
      
      if (matchingSubscriptions.length === 0) {
        return;
      }
      
      log(`Delivering webhook for event ${eventType} to ${matchingSubscriptions.length} subscriptions`, 'webhook');
      
      // Deliver to each subscription in parallel
      await Promise.all(
        matchingSubscriptions.map(subscription => 
          this.deliverWebhook(subscription, eventType, payload)
        )
      );
    } catch (error) {
      log(`Error delivering webhooks: ${error instanceof Error ? error.message : String(error)}`, 'webhook');
    }
  }
  
  /**
   * Deliver a webhook to a specific subscription
   */
  private static async deliverWebhook(
    subscription: WebhookSubscription,
    eventType: EventType,
    payload: any
  ): Promise<WebhookDelivery> {
    // Create a webhook delivery record
    const deliveryData: InsertWebhookDelivery = {
      subscriptionId: subscription.id,
      eventType,
      payload,
      status: 'pending'
    };
    
    const delivery = await storage.createWebhookDelivery(deliveryData);
    
    try {
      // Create signature
      const signature = this.createSignature(payload, subscription.secret);
      
      // Set up headers
      const headers = {
        'Content-Type': 'application/json',
        'X-FibonRoseTrust-Signature': signature,
        'X-FibonRoseTrust-Event': eventType,
        'User-Agent': 'FibonRoseTrust-Webhook/1.0',
        ...(subscription.headers || {})
      };
      
      // Send the webhook
      const response = await axios.post(subscription.url, payload, {
        headers,
        timeout: 10000 // 10 second timeout
      });
      
      // Update delivery record
      return await storage.updateWebhookDeliveryStatus(
        delivery.id,
        'success',
        response.status,
        typeof response.data === 'object' ? JSON.stringify(response.data) : String(response.data)
      );
    } catch (error) {
      log(`Error delivering webhook: ${error instanceof Error ? error.message : String(error)}`, 'webhook');
      
      // Handle axios error
      const axiosError = error as any;
      
      // Update delivery record
      return await storage.updateWebhookDeliveryStatus(
        delivery.id,
        'failed',
        axiosError.response?.status,
        undefined,
        axiosError.message
      );
    }
  }
  
  /**
   * Retry failed webhook deliveries
   */
  public static async retryFailedDeliveries(maxRetries = 5): Promise<void> {
    try {
      // Get all webhook deliveries
      const deliveries = await storage.getWebhookDeliveries();
      
      // Filter for failed deliveries with fewer than maxRetries attempts
      const failedDeliveries = deliveries.filter(
        delivery => delivery.status === 'failed' && delivery.attempts < maxRetries
      );
      
      if (failedDeliveries.length === 0) {
        return;
      }
      
      log(`Retrying ${failedDeliveries.length} failed webhook deliveries`, 'webhook');
      
      // Process each failed delivery
      for (const delivery of failedDeliveries) {
        // Get the subscription
        const subscription = await storage.getWebhookSubscription(delivery.subscriptionId);
        
        if (!subscription || !subscription.isActive) {
          continue;
        }
        
        try {
          // Create signature
          const signature = this.createSignature(delivery.payload, subscription.secret);
          
          // Set up headers
          const headers = {
            'Content-Type': 'application/json',
            'X-FibonRoseTrust-Signature': signature,
            'X-FibonRoseTrust-Event': delivery.eventType,
            'User-Agent': 'FibonRoseTrust-Webhook/1.0',
            ...(subscription.headers || {})
          };
          
          // Send the webhook
          const response = await axios.post(subscription.url, delivery.payload, {
            headers,
            timeout: 10000 // 10 second timeout
          });
          
          // Update delivery record
          await storage.updateWebhookDeliveryStatus(
            delivery.id,
            'success',
            response.status,
            typeof response.data === 'object' ? JSON.stringify(response.data) : String(response.data)
          );
          
          log(`Successfully retried webhook delivery ${delivery.id}`, 'webhook');
        } catch (error) {
          log(`Error retrying webhook delivery ${delivery.id}: ${error instanceof Error ? error.message : String(error)}`, 'webhook');
          
          // Handle axios error
          const axiosError = error as any;
          
          // Update delivery record (increment attempt count)
          await storage.updateWebhookDeliveryStatus(
            delivery.id,
            'failed',
            axiosError.response?.status,
            undefined,
            axiosError.message
          );
        }
      }
    } catch (error) {
      log(`Error retrying webhook deliveries: ${error instanceof Error ? error.message : String(error)}`, 'webhook');
    }
  }
}

// Convenience function to trigger a webhook event
export async function triggerWebhook(eventType: EventType, payload: any): Promise<void> {
  return WebhookService.deliverToSubscriptions(eventType, payload);
}