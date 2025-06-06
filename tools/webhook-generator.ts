/**
 * FibonroseTrust Webhook Generator Tool
 * 
 * This tool simulates webhook events from various external systems
 * to test the Universal Webhook Hub functionality.
 */

import axios from 'axios';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { createInterface } from 'readline';

// Configuration
const CONFIG = {
  webhookUrl: process.env.WEBHOOK_URL || 'http://localhost:5000/api/webhook',
  outputDir: path.join(__dirname, '../test-results/webhooks'),
  defaultHeaders: {
    'Content-Type': 'application/json',
    'User-Agent': 'FibonroseTrust-Webhook-Generator/1.0'
  }
};

// Types
interface WebhookEvent {
  id: string;
  source: string;
  event: string;
  timestamp: string;
  payload: any;
}

interface WebhookTemplate {
  source: string;
  events: Record<string, any>;
}

interface WebhookDeliveryResult {
  event: WebhookEvent;
  success: boolean;
  statusCode?: number;
  response?: any;
  error?: string;
  timestamp: string;
}

// Mock data generator
class MockDataGenerator {
  static userId(min = 1, max = 100): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  static transactionId(): string {
    return `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
  
  static walletAddress(): string {
    return `0x${Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
  }
  
  static ipAddress(): string {
    return Array.from({length: 4}, () => Math.floor(Math.random() * 256)).join('.');
  }
  
  static timestamp(pastHours = 1): string {
    const date = new Date(Date.now() - Math.floor(Math.random() * pastHours * 60 * 60 * 1000));
    return date.toISOString();
  }
  
  static choose<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }
}

// Webhook template repository
class WebhookTemplateRepository {
  private templates: Record<string, WebhookTemplate> = {};
  
  constructor() {
    this.loadDefaultTemplates();
  }
  
  private loadDefaultTemplates() {
    // Blockchain/Web3 template
    this.templates['blockchain'] = {
      source: 'blockchain',
      events: {
        'transaction.created': {
          transaction_id: () => MockDataGenerator.transactionId(),
          wallet_address: () => MockDataGenerator.walletAddress(),
          amount: () => (Math.random() * 10).toFixed(4),
          token_type: () => MockDataGenerator.choose(['ETH', 'BTC', 'SOL', 'ADA']),
          status: 'pending',
          created_at: () => MockDataGenerator.timestamp()
        },
        'transaction.completed': {
          transaction_id: () => MockDataGenerator.transactionId(),
          wallet_address: () => MockDataGenerator.walletAddress(),
          amount: () => (Math.random() * 10).toFixed(4),
          token_type: () => MockDataGenerator.choose(['ETH', 'BTC', 'SOL', 'ADA']),
          status: 'completed',
          completed_at: () => MockDataGenerator.timestamp()
        },
        'nft.minted': {
          nft_id: () => `nft-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          creator_wallet: () => MockDataGenerator.walletAddress(),
          owner_wallet: () => MockDataGenerator.walletAddress(),
          metadata: {
            name: 'FibonroseTrust Identity Card',
            description: 'Digital Identity Verification NFT',
            image_url: 'https://example.com/nft-image.png',
            attributes: [
              { trait_type: 'Type', value: 'Identity' },
              { trait_type: 'Trust Level', value: () => Math.floor(Math.random() * 21) + 1 }
            ]
          },
          transaction_hash: () => MockDataGenerator.transactionId(),
          created_at: () => MockDataGenerator.timestamp()
        },
        'wallet.connected': {
          wallet_address: () => MockDataGenerator.walletAddress(),
          user_id: () => MockDataGenerator.userId(),
          connection_method: () => MockDataGenerator.choose(['MetaMask', 'Phantom', 'WalletConnect']),
          ip_address: () => MockDataGenerator.ipAddress(),
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          timestamp: () => MockDataGenerator.timestamp()
        }
      }
    };
    
    // Security template
    this.templates['security'] = {
      source: 'security',
      events: {
        'verification.initiated': {
          verification_id: () => `ver-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          user_id: () => MockDataGenerator.userId(),
          verification_type: () => MockDataGenerator.choose(['identity', 'biometric', 'address', 'employment']),
          status: 'initiated',
          created_at: () => MockDataGenerator.timestamp()
        },
        'verification.completed': {
          verification_id: () => `ver-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          user_id: () => MockDataGenerator.userId(),
          verification_type: () => MockDataGenerator.choose(['identity', 'biometric', 'address', 'employment']),
          status: 'completed',
          result: () => MockDataGenerator.choose(['approved', 'rejected', 'needs_review']),
          verified_at: () => MockDataGenerator.timestamp()
        },
        'risk.assessment': {
          assessment_id: () => `risk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          user_id: () => MockDataGenerator.userId(),
          risk_level: () => MockDataGenerator.choose(['low', 'medium', 'high', 'critical']),
          factors: () => {
            const factors = ['unusual_location', 'multiple_failed_attempts', 'new_device', 'suspicious_ip'];
            return factors.filter(() => Math.random() > 0.5);
          },
          action: () => MockDataGenerator.choose(['allowed', 'blocked', 'requires_2fa']),
          timestamp: () => MockDataGenerator.timestamp()
        },
        'suspicious.activity': {
          alert_id: () => `alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          user_id: () => MockDataGenerator.userId(),
          activity_type: () => MockDataGenerator.choose(['login_attempt', 'password_change', 'permission_change']),
          severity: () => MockDataGenerator.choose(['low', 'medium', 'high', 'critical']),
          source_ip: () => MockDataGenerator.ipAddress(),
          details: 'Suspicious activity detected from unknown location',
          timestamp: () => MockDataGenerator.timestamp()
        }
      }
    };
    
    // Xano template
    this.templates['xano'] = {
      source: 'xano',
      events: {
        'record.created': {
          record_id: () => Math.floor(Math.random() * 10000),
          table_name: () => MockDataGenerator.choose(['users', 'profiles', 'verifications', 'trust_scores']),
          created_by: () => MockDataGenerator.userId(),
          data: {
            id: () => Math.floor(Math.random() * 10000),
            name: 'Sample Record',
            status: 'active',
            created_at: () => MockDataGenerator.timestamp()
          },
          timestamp: () => MockDataGenerator.timestamp()
        },
        'record.updated': {
          record_id: () => Math.floor(Math.random() * 10000),
          table_name: () => MockDataGenerator.choose(['users', 'profiles', 'verifications', 'trust_scores']),
          updated_by: () => MockDataGenerator.userId(),
          changes: {
            previous: {
              status: 'pending',
              updated_at: () => MockDataGenerator.timestamp(2)
            },
            current: {
              status: 'active',
              updated_at: () => MockDataGenerator.timestamp()
            }
          },
          timestamp: () => MockDataGenerator.timestamp()
        },
        'workflow.completed': {
          workflow_id: () => `flow-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          workflow_name: () => MockDataGenerator.choose(['user_onboarding', 'verification_process', 'trust_score_update']),
          triggered_by: () => MockDataGenerator.userId(),
          result: 'success',
          execution_time: () => Math.floor(Math.random() * 5000),
          timestamp: () => MockDataGenerator.timestamp()
        }
      }
    };
    
    // User-related template
    this.templates['user'] = {
      source: 'user',
      events: {
        'user.registered': {
          user_id: () => MockDataGenerator.userId(),
          username: () => `user${Math.floor(Math.random() * 10000)}`,
          email: () => `user${Math.floor(Math.random() * 10000)}@example.com`,
          role: 'user',
          created_at: () => MockDataGenerator.timestamp()
        },
        'user.login': {
          user_id: () => MockDataGenerator.userId(),
          login_method: () => MockDataGenerator.choose(['password', 'oauth', 'wallet', 'magic_link']),
          ip_address: () => MockDataGenerator.ipAddress(),
          device_info: {
            type: () => MockDataGenerator.choose(['desktop', 'mobile', 'tablet']),
            os: () => MockDataGenerator.choose(['Windows', 'MacOS', 'iOS', 'Android', 'Linux']),
            browser: () => MockDataGenerator.choose(['Chrome', 'Firefox', 'Safari', 'Edge'])
          },
          timestamp: () => MockDataGenerator.timestamp()
        },
        'user.profile_updated': {
          user_id: () => MockDataGenerator.userId(),
          updated_fields: () => {
            const fields = ['name', 'email', 'phone', 'address', 'preferences'];
            return fields.filter(() => Math.random() > 0.5);
          },
          timestamp: () => MockDataGenerator.timestamp()
        },
        'user.trust_score_changed': {
          user_id: () => MockDataGenerator.userId(),
          previous_score: () => Math.floor(Math.random() * 20) + 1,
          new_score: () => Math.floor(Math.random() * 20) + 1,
          reason: () => MockDataGenerator.choose([
            'verification_completed', 
            'successful_transaction', 
            'community_contribution',
            'suspicious_activity'
          ]),
          timestamp: () => MockDataGenerator.timestamp()
        }
      }
    };
  }
  
  getTemplateNames(): string[] {
    return Object.keys(this.templates);
  }
  
  getTemplate(name: string): WebhookTemplate | undefined {
    return this.templates[name];
  }
  
  getEventNames(templateName: string): string[] {
    const template = this.getTemplate(templateName);
    if (!template) return [];
    return Object.keys(template.events);
  }
}

// Webhook Generator
class WebhookGenerator {
  private templateRepo: WebhookTemplateRepository;
  private deliveryResults: WebhookDeliveryResult[] = [];
  
  constructor() {
    this.templateRepo = new WebhookTemplateRepository();
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }
  }
  
  private processValue(value: any): any {
    if (typeof value === 'function') {
      return value();
    } else if (Array.isArray(value)) {
      return value.map(item => this.processValue(item));
    } else if (typeof value === 'object' && value !== null) {
      return this.processPayload(value);
    }
    return value;
  }
  
  private processPayload(template: any): any {
    const processed: any = {};
    
    for (const [key, value] of Object.entries(template)) {
      processed[key] = this.processValue(value);
    }
    
    return processed;
  }
  
  generateEvent(source: string, eventType: string): WebhookEvent | null {
    const template = this.templateRepo.getTemplate(source);
    if (!template || !template.events[eventType]) {
      return null;
    }
    
    const eventTemplate = template.events[eventType];
    const payload = this.processPayload(eventTemplate);
    
    const event: WebhookEvent = {
      id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      source,
      event: eventType,
      timestamp: new Date().toISOString(),
      payload
    };
    
    return event;
  }
  
  async sendWebhook(event: WebhookEvent, endpoint?: string): Promise<WebhookDeliveryResult> {
    const url = endpoint || `${CONFIG.webhookUrl}/${event.source}`;
    
    try {
      console.log(chalk.blue(`Sending webhook to ${url}`));
      console.log(chalk.cyan(`  Event: ${event.source}.${event.event}`));
      
      const response = await axios.post(url, event, {
        headers: CONFIG.defaultHeaders,
        timeout: 10000
      });
      
      const result: WebhookDeliveryResult = {
        event,
        success: true,
        statusCode: response.status,
        response: response.data,
        timestamp: new Date().toISOString()
      };
      
      console.log(chalk.green(`  ✓ Success: Status ${response.status}`));
      this.deliveryResults.push(result);
      return result;
      
    } catch (error: any) {
      const result: WebhookDeliveryResult = {
        event,
        success: false,
        statusCode: error.response?.status,
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      console.log(chalk.red(`  ✗ Failed: ${error.message}`));
      this.deliveryResults.push(result);
      return result;
    }
  }
  
  saveResults() {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filePath = path.join(CONFIG.outputDir, `webhook-delivery-${timestamp}.json`);
    
    fs.writeFileSync(filePath, JSON.stringify(this.deliveryResults, null, 2));
    console.log(chalk.green(`\nResults saved to: ${filePath}`));
  }
  
  listAvailableSources() {
    return this.templateRepo.getTemplateNames();
  }
  
  listAvailableEvents(source: string) {
    return this.templateRepo.getEventNames(source);
  }
  
  // Interactive CLI mode
  async startInteractiveMode() {
    const readline = createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const question = (query: string): Promise<string> => {
      return new Promise(resolve => {
        readline.question(query, resolve);
      });
    };
    
    console.log(chalk.blue('\n=== FibonroseTrust Webhook Generator ==='));
    console.log(chalk.cyan('This tool helps you generate and send test webhooks\n'));
    
    while (true) {
      console.log(chalk.yellow('\nAvailable webhook sources:'));
      const sources = this.listAvailableSources();
      sources.forEach((source, index) => {
        console.log(`${index + 1}. ${source}`);
      });
      console.log(`${sources.length + 1}. Exit`);
      
      const sourceChoice = parseInt(await question(chalk.green('\nSelect a source (number): ')), 10);
      if (sourceChoice === sources.length + 1 || isNaN(sourceChoice) || sourceChoice < 1 || sourceChoice > sources.length + 1) {
        break;
      }
      
      const selectedSource = sources[sourceChoice - 1];
      console.log(chalk.yellow(`\nAvailable events for ${selectedSource}:`));
      const events = this.listAvailableEvents(selectedSource);
      events.forEach((event, index) => {
        console.log(`${index + 1}. ${event}`);
      });
      
      const eventChoice = parseInt(await question(chalk.green('\nSelect an event (number): ')), 10);
      if (isNaN(eventChoice) || eventChoice < 1 || eventChoice > events.length) {
        console.log(chalk.red('Invalid choice, returning to source selection'));
        continue;
      }
      
      const selectedEvent = events[eventChoice - 1];
      const webhookEvent = this.generateEvent(selectedSource, selectedEvent);
      
      if (!webhookEvent) {
        console.log(chalk.red('Failed to generate event, returning to source selection'));
        continue;
      }
      
      const customEndpoint = await question(chalk.green(`\nEnter custom endpoint (press Enter for default ${CONFIG.webhookUrl}/${selectedSource}): `));
      const endpoint = customEndpoint.trim() || undefined;
      
      console.log(chalk.yellow('\nGenerated webhook payload:'));
      console.log(JSON.stringify(webhookEvent, null, 2));
      
      const confirm = await question(chalk.green('\nSend webhook? (y/n): '));
      if (confirm.toLowerCase() === 'y') {
        await this.sendWebhook(webhookEvent, endpoint);
      }
      
      const sendAnother = await question(chalk.green('\nSend another webhook? (y/n): '));
      if (sendAnother.toLowerCase() !== 'y') {
        break;
      }
    }
    
    if (this.deliveryResults.length > 0) {
      const saveResults = await question(chalk.green('\nSave results to file? (y/n): '));
      if (saveResults.toLowerCase() === 'y') {
        this.saveResults();
      }
    }
    
    console.log(chalk.blue('\nExiting Webhook Generator'));
    readline.close();
  }
  
  // Run a predefined batch of webhooks
  async runTestBatch() {
    console.log(chalk.blue('\n=== Running Webhook Test Batch ==='));
    
    const testCases = [
      { source: 'blockchain', event: 'transaction.created' },
      { source: 'blockchain', event: 'nft.minted' },
      { source: 'security', event: 'verification.initiated' },
      { source: 'security', event: 'verification.completed' },
      { source: 'security', event: 'risk.assessment' },
      { source: 'xano', event: 'record.created' },
      { source: 'xano', event: 'workflow.completed' },
      { source: 'user', event: 'user.registered' },
      { source: 'user', event: 'user.trust_score_changed' }
    ];
    
    for (const testCase of testCases) {
      const event = this.generateEvent(testCase.source, testCase.event);
      if (event) {
        await this.sendWebhook(event);
        // Add a small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        console.log(chalk.red(`Failed to generate event: ${testCase.source}.${testCase.event}`));
      }
    }
    
    this.saveResults();
    console.log(chalk.green('\nTest batch completed!'));
  }
}

// Run the webhook generator if this file is executed directly
if (require.main === module) {
  const generator = new WebhookGenerator();
  
  // Check for command line arguments
  const args = process.argv.slice(2);
  if (args.includes('--batch') || args.includes('-b')) {
    generator.runTestBatch()
      .then(() => {
        process.exit(0);
      })
      .catch(error => {
        console.error(chalk.red('Error running test batch:'), error);
        process.exit(1);
      });
  } else {
    generator.startInteractiveMode()
      .then(() => {
        process.exit(0);
      })
      .catch(error => {
        console.error(chalk.red('Error in interactive mode:'), error);
        process.exit(1);
      });
  }
}

export default WebhookGenerator;