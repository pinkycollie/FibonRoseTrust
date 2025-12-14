// PinkSync Accessibility & Integration Script
// Enhanced version of the original sync.js with FibonroseTrust integration

class PinkSyncManager {
  constructor() {
    this.settings = {
      hapticFeedback: true,
      visualAlerts: true,
      autoSync: true,
      deafFirstMode: true,
      signLanguage: 'asl'
    };
    
    this.apiBase = window.location.origin;
    this.init();
  }

  async init() {
    console.log('PinkSync loaded');
    await this.loadSettings();
    this.setupAccessibilityFeatures();
    this.startAutoSync();
    this.logSystemStatus();
  }

  async loadSettings() {
    try {
      // Load settings from FibonroseTrust API
      const response = await fetch(`${this.apiBase}/api/user/1/data-permissions`);
      if (response.ok) {
        const permissions = await response.json();
        console.log('PinkSync: Loaded user preferences from FibonroseTrust');
      }
    } catch (error) {
      console.warn('PinkSync: Using default settings');
    }
  }

  setupAccessibilityFeatures() {
    // High contrast support
    if (this.settings.deafFirstMode) {
      document.body.classList.add('deaf-first-mode');
    }

    // Vibration API support for deaf users
    if ('vibrate' in navigator && this.settings.hapticFeedback) {
      this.enableHapticFeedback();
    }

    // Visual notification system
    if (this.settings.visualAlerts) {
      this.enableVisualAlerts();
    }
  }

  enableHapticFeedback() {
    // Custom vibration patterns for different events
    const patterns = {
      notification: [200, 100, 200],
      success: [100, 50, 100],
      error: [500, 200, 500],
      sync: [150]
    };

    window.PinkSyncVibrate = (type = 'notification') => {
      if (navigator.vibrate && this.settings.hapticFeedback) {
        navigator.vibrate(patterns[type] || patterns.notification);
      }
    };
  }

  enableVisualAlerts() {
    // Create visual notification system
    const notificationContainer = document.createElement('div');
    notificationContainer.id = 'pinksync-visual-alerts';
    notificationContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      pointer-events: none;
    `;
    document.body.appendChild(notificationContainer);

    window.PinkSyncNotify = (message, type = 'info') => {
      if (!this.settings.visualAlerts) return;

      const alert = document.createElement('div');
      alert.className = `pinksync-alert pinksync-alert-${type}`;
      alert.style.cssText = `
        background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
        color: white;
        padding: 12px 16px;
        margin-bottom: 8px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        pointer-events: auto;
        font-weight: 500;
        max-width: 300px;
        word-wrap: break-word;
      `;
      alert.textContent = message;

      notificationContainer.appendChild(alert);

      // Animate in
      setTimeout(() => {
        alert.style.transform = 'translateX(0)';
      }, 10);

      // Auto remove
      setTimeout(() => {
        alert.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (alert.parentNode) {
            alert.parentNode.removeChild(alert);
          }
        }, 300);
      }, 4000);

      // Haptic feedback
      if (window.PinkSyncVibrate) {
        window.PinkSyncVibrate(type);
      }
    };
  }

  async startAutoSync() {
    if (!this.settings.autoSync) return;

    setInterval(async () => {
      await this.syncWithFibonroseTrust();
    }, 30000); // Sync every 30 seconds
  }

  async syncWithFibonroseTrust() {
    try {
      // Sync with polyglot services
      const response = await fetch(`${this.apiBase}/api/polyglot/services`);
      if (response.ok) {
        const services = await response.json();
        console.log(`PinkSync: Connected to ${services.total_services} services`);
        
        if (window.PinkSyncNotify) {
          window.PinkSyncNotify(`Synced with ${services.total_services} services`, 'success');
        }
      }
    } catch (error) {
      console.warn('PinkSync: Sync failed', error);
      if (window.PinkSyncNotify) {
        window.PinkSyncNotify('Sync failed - offline mode', 'error');
      }
    }
  }

  async logSystemStatus() {
    try {
      const [systemStatus, trustScore] = await Promise.all([
        fetch(`${this.apiBase}/api/pinksync/status`).then(r => r.json()).catch(() => null),
        fetch(`${this.apiBase}/api/user/1/trust-score`).then(r => r.json()).catch(() => null)
      ]);

      console.log('PinkSync System Status:', {
        accessible: systemStatus?.accessible || false,
        vCodeEnabled: systemStatus?.vCodeEnabled || false,
        trustScore: trustScore?.score || 0,
        timestamp: new Date().toISOString()
      });

      if (window.PinkSyncNotify) {
        window.PinkSyncNotify('PinkSync Dashboard Ready', 'success');
      }
    } catch (error) {
      console.warn('PinkSync: Could not fetch system status');
    }
  }

  // Public API methods
  updateSetting(key, value) {
    this.settings[key] = value;
    localStorage.setItem('pinksync-settings', JSON.stringify(this.settings));
    
    if (window.PinkSyncNotify) {
      window.PinkSyncNotify(`${key} updated`, 'info');
    }
  }

  getSetting(key) {
    return this.settings[key];
  }

  async forceSync() {
    console.log('PinkSync: Force sync requested');
    await this.syncWithFibonroseTrust();
  }
}

// Initialize PinkSync when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.PinkSync = new PinkSyncManager();
  });
} else {
  window.PinkSync = new PinkSyncManager();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PinkSyncManager;
}