import { Request, Response, NextFunction } from 'express';
import { storage } from '../../storage';
import axios from 'axios';
import { WebhookDelivery } from '@shared/schema';

/**
 * NegraRosa Security Framework - Auth0 Integration
 * 
 * This service integrates Auth0 authentication with the NegraRosa Security Framework.
 * It enables:
 * 1. Enhanced security risk assessment based on Auth0 login patterns
 * 2. Identity verification confirmation through Auth0 profiles
 * 3. Security event logging and monitoring
 * 4. Role-based access control for NegraRosa security features
 */

interface Auth0UserProfile {
  sub: string;
  nickname: string;
  name: string;
  picture: string;
  updated_at: string;
  email: string;
  email_verified: boolean;
}

interface Auth0TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface NegraRosaSecurityEvent {
  userId: number;
  eventType: string;
  eventData: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

export class NegraRosaAuth0Integration {
  private domain: string;
  private clientId: string;
  private clientSecret: string;
  private apiToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    // Get Auth0 configuration from environment variables
    this.domain = process.env.AUTH0_DOMAIN || '';
    this.clientId = process.env.AUTH0_CLIENT_ID || '';
    this.clientSecret = process.env.AUTH0_CLIENT_SECRET || '';
    
    if (!this.domain || !this.clientId || !this.clientSecret) {
      console.warn('NegraRosa Auth0 Integration: Missing Auth0 configuration');
    }
  }

  /**
   * Get Auth0 Management API token
   */
  private async getApiToken(): Promise<string> {
    // Check if we have a valid token
    if (this.apiToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.apiToken;
    }

    try {
      // Request new token
      const response = await axios.post(`https://${this.domain}/oauth/token`, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        audience: `https://${this.domain}/api/v2/`,
        grant_type: 'client_credentials'
      });

      const data = response.data as Auth0TokenResponse;
      this.apiToken = data.access_token;
      
      // Set token expiry (subtract 60 seconds for safety margin)
      const expiresInMs = (data.expires_in - 60) * 1000;
      this.tokenExpiry = new Date(Date.now() + expiresInMs);
      
      return this.apiToken;
    } catch (error) {
      console.error('Failed to get Auth0 Management API token:', error);
      throw new Error('Failed to authenticate with Auth0 Management API');
    }
  }

  /**
   * Verify user identity through Auth0
   */
  async verifyUserIdentity(userId: number): Promise<boolean> {
    try {
      // Get user from our database
      const user = await storage.getUser(userId);
      if (!user || !user.auth0Sub) {
        return false;
      }

      // Get user from Auth0
      const token = await this.getApiToken();
      const response = await axios.get(
        `https://${this.domain}/api/v2/users/${encodeURIComponent(user.auth0Sub)}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const auth0User = response.data as Auth0UserProfile;
      
      // Check if email is verified in Auth0
      if (auth0User.email_verified) {
        // Update user verification status if needed
        const verifications = await storage.getVerifications(userId);
        const emailVerification = verifications.find(v => v.typeId === 2); // Assuming typeId 2 is email verification
        
        if (emailVerification && emailVerification.status !== 'VERIFIED') {
          await storage.updateVerificationStatus(emailVerification.id, 'VERIFIED', 'auth0');
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error verifying user identity with Auth0:', error);
      return false;
    }
  }

  /**
   * Log security event to NegraRosa Security Framework
   */
  async logSecurityEvent(event: NegraRosaSecurityEvent): Promise<void> {
    try {
      // Send to security webhook if configured
      const webhookSubscriptions = await storage.getWebhookSubscriptions();
      const securityWebhooks = webhookSubscriptions.filter(
        sub => sub.events.includes('SECURITY_EVENT')
      );

      for (const webhook of securityWebhooks) {
        try {
          const response = await axios.post(webhook.url, {
            event: 'SECURITY_EVENT',
            data: event
          });

          // Log webhook delivery
          await storage.createWebhookDelivery({
            subscriptionId: webhook.id,
            event: 'SECURITY_EVENT',
            payload: JSON.stringify(event),
            status: 'SUCCESS',
            statusCode: response.status,
            response: JSON.stringify(response.data),
            createdAt: new Date()
          });
        } catch (error: any) {
          // Log failed webhook delivery
          await storage.createWebhookDelivery({
            subscriptionId: webhook.id,
            event: 'SECURITY_EVENT',
            payload: JSON.stringify(event),
            status: 'FAILED',
            statusCode: error.response?.status || 0,
            errorMessage: error.message,
            createdAt: new Date()
          });
        }
      }
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }

  /**
   * Evaluate user's security risk based on Auth0 profile and login patterns
   */
  async evaluateSecurityRisk(userId: number): Promise<number> {
    try {
      // Get user from our database
      const user = await storage.getUser(userId);
      if (!user || !user.auth0Sub) {
        return 0.7; // Medium-high risk if user not found or not linked to Auth0
      }

      // Get user from Auth0
      const token = await this.getApiToken();
      
      // Get user logs (login history)
      const logsResponse = await axios.get(
        `https://${this.domain}/api/v2/users/${encodeURIComponent(user.auth0Sub)}/logs`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const logs = logsResponse.data;
      
      // Simple risk assessment based on login patterns
      let riskScore = 0.5; // Default medium risk
      
      // Lower risk if email is verified
      if (user.emailVerified) {
        riskScore -= 0.2;
      }
      
      // Lower risk if user has multiple successful logins
      const successfulLogins = logs.filter((log: any) => 
        log.type === 's' && log.details?.type === 'ss'
      );
      
      if (successfulLogins.length > 5) {
        riskScore -= 0.1;
      }
      
      // Higher risk if there are failed login attempts
      const failedLogins = logs.filter((log: any) => 
        log.type === 'f'
      );
      
      if (failedLogins.length > 0) {
        riskScore += 0.1 * Math.min(failedLogins.length, 5);
      }
      
      // Cap risk score between 0 and 1
      return Math.max(0, Math.min(1, riskScore));
    } catch (error) {
      console.error('Error evaluating security risk with Auth0:', error);
      return 0.5; // Default to medium risk on error
    }
  }

  /**
   * Middleware to check if user has developer role through Auth0
   */
  checkDeveloperAccess(req: Request, res: Response, next: NextFunction) {
    if (!req.oidc?.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check for developer role in Auth0 user metadata or app_metadata
    const auth0User = req.oidc.user;
    
    // Check if user has developer role in our system
    if (req.user?.role === 'developer' || req.user?.role === 'admin') {
      return next();
    }
    
    // Check Auth0 app_metadata for roles if available
    const appMetadata = auth0User['https://your-namespace/app_metadata'] || {};
    const userRoles = appMetadata.roles || [];
    
    if (userRoles.includes('developer') || userRoles.includes('admin')) {
      // Update user role in our system for future checks
      if (req.user && req.user.id) {
        // This would require a method to update user roles in your storage
        // storage.updateUserRole(req.user.id, 'developer');
      }
      return next();
    }
    
    // Access denied
    return res.status(403).json({ 
      error: 'Access denied',
      message: 'You need developer permissions to access this resource'
    });
  }
}

export const negraRosaAuth0 = new NegraRosaAuth0Integration();