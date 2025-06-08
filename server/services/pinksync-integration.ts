/**
 * PinkSync Ecosystem Integration Service
 * Integrates with DeafAuth, PinkSync accessibility, and FibonRose trust verification
 */

export interface VisualFeedback {
  icon: string;
  color: string;
  animation: string;
  vibration: boolean;
}

export interface UserPreferences {
  high_contrast: boolean;
  large_text: boolean;
  animation_reduction: boolean;
  vibration_feedback: boolean;
  sign_language: 'asl' | 'bsl' | 'isl';
}

export interface PinkSyncUser {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
  preferences: UserPreferences;
  verified: boolean;
  roles: ('user' | 'creator' | 'validator' | 'admin')[];
}

export interface TrustBadge {
  id: string;
  name: string;
  description: string;
  image_url: string;
  criteria: string;
  issuer: string;
  issued_at: string;
  expires_at?: string;
  verification_url: string;
}

export interface VerificationSubmission {
  id: string;
  user_id: string;
  type: 'deaf_creator' | 'interpreter' | 'organization' | 'business';
  status: 'pending' | 'under_review' | 'needs_info' | 'approved' | 'rejected';
  submitted_at: string;
  updated_at: string;
  documents: Array<{
    id: string;
    type: string;
    url: string;
  }>;
  notes?: string;
}

export interface DeafAuthNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
  visual_feedback: VisualFeedback;
}

export class PinkSyncIntegration {
  private baseUrl: string;
  private deafAuthUrl: string;
  private fibonRoseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.PINKSYNC_API_URL || 'https://api.pinksync.io/v2';
    this.deafAuthUrl = process.env.DEAFAUTH_API_URL || 'https://deafauth.pinksync.io/v1';
    this.fibonRoseUrl = process.env.FIBONROSE_API_URL || 'https://fibonrose.mbtquniverse.com/v1';
    this.apiKey = process.env.PINKSYNC_API_KEY || '';
  }

  /**
   * Create visual feedback for deaf users
   */
  createVisualFeedback(type: 'success' | 'error' | 'warning' | 'info'): VisualFeedback {
    const feedbackMap = {
      success: {
        icon: 'check-circle',
        color: 'green',
        animation: 'bounce',
        vibration: true
      },
      error: {
        icon: 'x-circle',
        color: 'red',
        animation: 'shake',
        vibration: true
      },
      warning: {
        icon: 'alert-triangle',
        color: 'orange',
        animation: 'pulse',
        vibration: true
      },
      info: {
        icon: 'info',
        color: 'blue',
        animation: 'fade',
        vibration: false
      }
    };

    return feedbackMap[type];
  }

  /**
   * Authenticate user with DeafAuth
   */
  async authenticateWithDeafAuth(credentials: {
    email: string;
    password?: string;
    oauth_provider?: string;
    oauth_token?: string;
  }): Promise<{ token: string; user: PinkSyncUser }> {
    try {
      const response = await fetch(`${this.deafAuthUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-PinkSync-Key': this.apiKey
        },
        body: JSON.stringify(credentials)
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('DeafAuth authentication error:', error);
      throw new Error('Failed to authenticate with DeafAuth');
    }
  }

  /**
   * Submit verification for trust badge
   */
  async submitVerification(submission: {
    user_id: string;
    type: 'deaf_creator' | 'interpreter' | 'organization' | 'business';
    documents: Array<{ type: string; data: string }>;
    notes?: string;
  }): Promise<VerificationSubmission> {
    try {
      const response = await fetch(`${this.fibonRoseUrl}/verification/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-PinkSync-Key': this.apiKey
        },
        body: JSON.stringify(submission)
      });

      if (!response.ok) {
        throw new Error(`Verification submission failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Verification submission error:', error);
      throw new Error('Failed to submit verification');
    }
  }

  /**
   * Get user's trust badges
   */
  async getUserTrustBadges(userId: string): Promise<TrustBadge[]> {
    try {
      const response = await fetch(`${this.fibonRoseUrl}/users/${userId}/badges`, {
        headers: {
          'X-PinkSync-Key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch badges: ${response.statusText}`);
      }

      const data = await response.json();
      return data.badges || [];
    } catch (error) {
      console.error('Error fetching trust badges:', error);
      return [];
    }
  }

  /**
   * Update user accessibility preferences
   */
  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}/preferences`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-PinkSync-Key': this.apiKey
        },
        body: JSON.stringify(preferences)
      });

      if (!response.ok) {
        throw new Error(`Failed to update preferences: ${response.statusText}`);
      }

      const data = await response.json();
      return data.preferences;
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw new Error('Failed to update user preferences');
    }
  }

  /**
   * Send notification with visual feedback
   */
  async sendNotification(notification: {
    user_id: string;
    type: string;
    title: string;
    message: string;
    data?: any;
    visual_feedback_type: 'success' | 'error' | 'warning' | 'info';
  }): Promise<DeafAuthNotification> {
    try {
      const visual_feedback = this.createVisualFeedback(notification.visual_feedback_type);
      
      const response = await fetch(`${this.baseUrl}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-PinkSync-Key': this.apiKey
        },
        body: JSON.stringify({
          ...notification,
          visual_feedback
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send notification: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw new Error('Failed to send notification');
    }
  }

  /**
   * Process video for ASL detection and accessibility
   */
  async processVideo(videoData: {
    user_id: string;
    title: string;
    description?: string;
    file_data: string;
    sign_language: 'asl' | 'bsl' | 'isl' | 'other' | 'none';
  }): Promise<{ video_id: string; status: string; processing_url: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/videos/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-PinkSync-Key': this.apiKey
        },
        body: JSON.stringify(videoData)
      });

      if (!response.ok) {
        throw new Error(`Video upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Video processing error:', error);
      throw new Error('Failed to process video');
    }
  }

  /**
   * Get device interface configuration for accessibility
   */
  async getDeviceInterface(platform: 'web' | 'ios' | 'android' | 'desktop'): Promise<{
    accessibility_features: string[];
    ui_components: any;
    interaction_modes: string[];
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/interface/device/${platform}`, {
        headers: {
          'X-PinkSync-Key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get interface config: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting device interface:', error);
      return {
        accessibility_features: ['high_contrast', 'large_text', 'visual_feedback'],
        ui_components: {},
        interaction_modes: ['touch', 'gesture', 'voice']
      };
    }
  }

  /**
   * Track progress for deaf user onboarding
   */
  async updateTaskProgress(taskId: string, percentComplete: number, status?: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/progress/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-PinkSync-Key': this.apiKey
        },
        body: JSON.stringify({
          percent_complete: percentComplete,
          status: status || 'in_progress',
          updated_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update progress: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error updating task progress:', error);
    }
  }

  /**
   * Generate PinkSync-compatible error response
   */
  createErrorResponse(code: string, message: string, details?: any): {
    status: 'error';
    code: string;
    message: string;
    details?: any;
    visual_feedback: VisualFeedback;
  } {
    return {
      status: 'error',
      code,
      message,
      details,
      visual_feedback: this.createVisualFeedback('error')
    };
  }

  /**
   * Generate PinkSync-compatible success response
   */
  createSuccessResponse(data: any, message?: string): {
    status: 'success';
    data: any;
    message?: string;
    visual_feedback: VisualFeedback;
  } {
    return {
      status: 'success',
      data,
      message,
      visual_feedback: this.createVisualFeedback('success')
    };
  }
}

export const pinkSyncService = new PinkSyncIntegration();