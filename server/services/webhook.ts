import crypto from 'crypto';
import { WebhookSubscription, WebhookDelivery, EventType, InsertWebhookDelivery } from '@shared/schema';
import { storage } from '../storage';
import { log } from '../vite';
import axios from 'axios';

/**
 * Webhook service for managing webhook deliveries and notifications
 */
export class WebhookService {
  /**
   * Creates a signature for the webhook payload using the subscription's secret
   * @param payload The payload to sign
   * @param secret The webhook secret
   * @returns The signature for the payload
   */
  private static createSignature(payload: Record<string, any>, secret: string): string {
    const payloadString = JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', secret);
    return hmac.update(payloadString).digest('hex');
  }

  /**
   * Delivers a webhook to all subscriptions that match the event type
   * @param eventType The event type
   * @param payload The payload to deliver
   */
  public static async deliverToSubscriptions(eventType: EventType, payload: Record<string, any>): Promise<void> {
    try {
      // Find all active subscriptions for this event type
      const subscriptions = await storage.getWebhookSubscriptions();
      const matchingSubscriptions = subscriptions.filter(
        subscription => subscription.isActive && subscription.events.includes(eventType)
      );

      if (matchingSubscriptions.length === 0) {
        log(`No active subscriptions for event ${eventType}`, 'webhook');
        return;
      }

      log(`Delivering webhook for event ${eventType} to ${matchingSubscriptions.length} subscriptions`, 'webhook');

      // Deliver to each subscription
      const deliveryPromises = matchingSubscriptions.map(subscription =>
        this.deliverWebhook(subscription, eventType, payload)
      );

      await Promise.allSettled(deliveryPromises);
    } catch (error) {
      log(`Error delivering webhooks: ${error}`, 'webhook');
    }
  }

  /**
   * Delivers a webhook to a specific subscription
   * @param subscription The subscription to deliver to
   * @param eventType The event type
   * @param payload The payload to deliver
   */
  private static async deliverWebhook(
    subscription: WebhookSubscription,
    eventType: EventType,
    payload: Record<string, any>
  ): Promise<WebhookDelivery> {
    // Create webhook delivery record
    const webhookPayload = {
      event: eventType,
      data: payload,
      timestamp: new Date().toISOString(),
    };

    const deliveryRecord: InsertWebhookDelivery = {
      subscriptionId: subscription.id,
      eventType,
      payload: webhookPayload,
      status: 'pending'
    };

    // Save initial delivery record
    const delivery = await storage.createWebhookDelivery(deliveryRecord);

    try {
      // Create signature for the webhook
      const signature = this.createSignature(webhookPayload, subscription.secret);

      // Set up the headers
      const headers = {
        'Content-Type': 'application/json',
        'X-FibonRoseTrust-Signature': signature,
        'X-FibonRoseTrust-Event': eventType,
        'User-Agent': 'FibonRoseTrust-Webhook/1.0',
        ...subscription.headers
      };

      // Make the POST request to the webhook URL
      const response = await axios.post(subscription.url, webhookPayload, {
        headers,
        timeout: 10000, // 10 second timeout
      });

      // Update delivery status to success
      return await storage.updateWebhookDeliveryStatus(
        delivery.id,
        'success',
        response.status,
        response.data ? JSON.stringify(response.data) : ''
      );
    } catch (error) {
      log(`Error delivering webhook ${delivery.id}: ${error}`, 'webhook');
      
      // Update delivery status to failed
      return await storage.updateWebhookDeliveryStatus(
        delivery.id,
        'failed',
        error.response?.status,
        error.response?.data ? JSON.stringify(error.response.data) : '',
        error.message
      );
    }
  }

  /**
   * Retries failed webhook deliveries with exponential backoff
   * @param maxRetries Maximum number of retry attempts
   */
  public static async retryFailedDeliveries(maxRetries = 5): Promise<void> {
    try {
      // Find all failed deliveries with fewer than maxRetries attempts
      const allDeliveries = await storage.getWebhookDeliveries();
      const failedDeliveries = allDeliveries.filter(
        delivery => delivery.status === 'failed' && delivery.attempts < maxRetries
      );

      if (failedDeliveries.length === 0) {
        return;
      }

      log(`Retrying ${failedDeliveries.length} failed webhook deliveries`, 'webhook');

      // Process each failed delivery
      for (const delivery of failedDeliveries) {
        const subscription = await storage.getWebhookSubscription(delivery.subscriptionId);
        
        if (!subscription || !subscription.isActive) {
          continue;
        }

        // Exponential backoff based on attempt count (2^attempts seconds)
        const delay = Math.pow(2, delivery.attempts) * 1000;
        log(`Retry delivery ${delivery.id}, attempt ${delivery.attempts + 1}, delay ${delay}ms`, 'webhook');
        
        try {
          // Create signature for the webhook
          const signature = this.createSignature(delivery.payload, subscription.secret);

          // Set up the headers
          const headers = {
            'Content-Type': 'application/json',
            'X-FibonRoseTrust-Signature': signature,
            'X-FibonRoseTrust-Event': delivery.eventType,
            'User-Agent': 'FibonRoseTrust-Webhook/1.0',
            ...subscription.headers
          };

          // Make the POST request to the webhook URL
          const response = await axios.post(subscription.url, delivery.payload, {
            headers,
            timeout: 10000, // 10 second timeout
          });

          // Update delivery status to success
          await storage.updateWebhookDeliveryStatus(
            delivery.id,
            'success',
            response.status,
            response.data ? JSON.stringify(response.data) : ''
          );
        } catch (error) {
          // Update attempt count but still mark as failed
          await storage.updateWebhookDeliveryStatus(
            delivery.id,
            'failed',
            error.response?.status,
            error.response?.data ? JSON.stringify(error.response.data) : '',
            error.message
          );
        }
      }
    } catch (error) {
      log(`Error retrying webhook deliveries: ${error}`, 'webhook');
    }
  }
}

/**
 * Convenience function to trigger a webhook event
 * @param eventType The event type
 * @param payload The payload to deliver
 */
export async function triggerWebhook(eventType: EventType, payload: Record<string, any>): Promise<void> {
  return WebhookService.deliverToSubscriptions(eventType, payload);
}