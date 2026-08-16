/**
 * Smart Webhook Service
 * 
 * This module re-exports the Smart Webhook Intelligence system
 * for backward compatibility with existing imports.
 * 
 * The Smart Webhook Intelligence is an internal, self-contained
 * webhook processing engine that replaces external third-party dependencies.
 */

export { SmartWebhookIntelligence, XanoIntegration } from './integrations/xano';

// Default export for convenience
import { SmartWebhookIntelligence } from './integrations/xano';
export default SmartWebhookIntelligence;
 * Legacy Xano Service File
 * 
 * This file is deprecated and kept only for backward compatibility.
 * Please use the new integration service at: server/services/integrations/xano.ts
 * 
 * @deprecated Use XanoIntegration from './integrations/xano' instead
 */

export { XanoIntegration } from './integrations/xano';
