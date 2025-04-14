import { EventType } from '@shared/schema';
import { universalWebhookManager } from '../universal-webhook';
import { log } from '../../vite';

// Source identifiers for the Decentralized Identity Framework
export enum IdentityFrameworkSource {
  IDENTITY_VERIFICATION = 'identity_verification',
  NEURAL_NETWORK = 'neural_network',
  DECENTRALIZED_DB = 'decentralized_db',
  CREDENTIAL_VALIDATION = 'credential_validation',
  ACCESS_RIGHTS = 'access_rights',
  TRUST_SCORE = 'trust_score',
  SECURITY_FRAMEWORK = 'security_framework',
  CIVIC_PASS = 'civic_pass',
  XANO = 'xano',
  PINKSYNC = 'pinksync'
}

// Type for event handlers
type EventHandler = (source: string, eventType: string, payload: any) => Promise<void>;

/**
 * IdentityFrameworkEventBus - Central event bus for the Decentralized Identity Framework
 * 
 * This component acts as a cross-cutting middleware layer that enables asynchronous 
 * communication between all parts of the identity system while maintaining loose coupling.
 */
class IdentityFrameworkEventBus {
  private eventHandlers: Map<string, EventHandler[]> = new Map();
  
  /**
   * Subscribe to specific events
   * @param eventType Type of event to subscribe to (use '*' for all events)
   * @param handler Callback function that handles the event
   * @returns Unsubscribe function
   */
  public subscribe(eventType: string, handler: EventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    
    const handlers = this.eventHandlers.get(eventType) as EventHandler[];
    handlers.push(handler);
    
    // Return unsubscribe function
    return () => {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    };
  }
  
  /**
   * Emit an event to all subscribers
   * @param source Source component emitting the event
   * @param eventType Type of event being emitted
   * @param payload Event data payload
   */
  public async emit(
    source: string,
    eventType: EventType,
    payload: any
  ): Promise<void> {
    log(`Event emitted: ${source}:${eventType}`, 'event-bus');
    
    try {
      // First, notify the universal webhook manager
      await universalWebhookManager.processEvent(source, eventType, payload);
      
      // Then, notify all direct subscribers
      const handlersForEvent = this.eventHandlers.get(eventType) || [];
      const handlersForAll = this.eventHandlers.get('*') || [];
      
      const allHandlers = [...handlersForEvent, ...handlersForAll];
      
      await Promise.all(
        allHandlers.map(handler => {
          try {
            return handler(source, eventType, payload);
          } catch (error) {
            log(`Error in event handler for ${eventType}: ${error instanceof Error ? error.message : String(error)}`, 'event-bus');
            return Promise.resolve();
          }
        })
      );
    } catch (error) {
      log(`Error emitting event ${eventType}: ${error instanceof Error ? error.message : String(error)}`, 'event-bus');
    }
  }
  
  /**
   * Get count of subscribers for a specific event type
   * @param eventType Type of event
   * @returns Number of subscribers
   */
  public getSubscriberCount(eventType: string): number {
    return (this.eventHandlers.get(eventType) || []).length;
  }
  
  /**
   * Clear all subscriptions
   */
  public clearSubscriptions(): void {
    this.eventHandlers.clear();
  }
}

// Create singleton instance
export const eventBus = new IdentityFrameworkEventBus();

// Register default logging handler for all events
eventBus.subscribe('*', async (source, eventType, payload) => {
  log(`Event handled: ${source}:${eventType}`, 'event-bus');
  
  // Additional system-wide event processing could go here
  // like analytics, audit logging, etc.
});