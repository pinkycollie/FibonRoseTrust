/**
 * FibonroseTrust API Testing Tool
 * 
 * This tool automates testing of the FibonroseTrust API endpoints.
 * It performs tests on all API categories and generates a detailed report.
 */

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  baseUrl: process.env.API_BASE_URL || 'http://localhost:5000/api',
  apiVersion: '',
  authToken: process.env.AUTH_TOKEN || '',
  outputDir: path.join(__dirname, '../test-results'),
  timeoutMs: 10000,
  retries: 2,
  delay: 1000,
};

// Test result types
interface TestResult {
  endpoint: string;
  method: string;
  success: boolean;
  statusCode?: number;
  responseTime: number;
  error?: string;
  response?: any;
}

interface TestSuiteResult {
  name: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  passedTests: number;
  failedTests: number;
  results: TestResult[];
}

// Helper function to wait
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// API Client for making requests
class ApiTester {
  private baseUrl: string;
  private authToken: string;
  private results: TestSuiteResult[];
  
  constructor() {
    this.baseUrl = CONFIG.baseUrl;
    this.authToken = CONFIG.authToken;
    this.results = [];
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }
  }
  
  /**
   * Make an API request with retries
   */
  private async makeRequest(
    method: string,
    endpoint: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<TestResult> {
    const start = Date.now();
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: AxiosRequestConfig = {
      method: method as any,
      url,
      data,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers,
      },
      timeout: CONFIG.timeoutMs,
    };
    
    if (this.authToken) {
      config.headers!.Authorization = `Bearer ${this.authToken}`;
    }
    
    let attempts = 0;
    let lastError: any;
    
    while (attempts <= CONFIG.retries) {
      try {
        const response = await axios(config);
        const responseTime = Date.now() - start;
        
        return {
          endpoint,
          method,
          success: true,
          statusCode: response.status,
          responseTime,
          response: response.data
        };
      } catch (error: any) {
        lastError = error;
        attempts++;
        
        if (attempts <= CONFIG.retries) {
          console.log(chalk.yellow(`Retrying ${method} ${endpoint} (attempt ${attempts}/${CONFIG.retries})`));
          await wait(CONFIG.delay);
        }
      }
    }
    
    const responseTime = Date.now() - start;
    return {
      endpoint,
      method,
      success: false,
      statusCode: lastError.response?.status,
      responseTime,
      error: lastError.message,
      response: lastError.response?.data
    };
  }
  
  /**
   * Run a test suite
   */
  async runTestSuite(name: string, tests: Array<{ method: string; endpoint: string; data?: any }>) {
    const suite: TestSuiteResult = {
      name,
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      passedTests: 0,
      failedTests: 0,
      results: []
    };
    
    console.log(chalk.blue(`\n▶️ Running test suite: ${name}`));
    
    for (const test of tests) {
      console.log(chalk.cyan(`  Testing ${test.method} ${test.endpoint}`));
      const result = await this.makeRequest(test.method, test.endpoint, test.data);
      suite.results.push(result);
      
      if (result.success) {
        suite.passedTests++;
        console.log(chalk.green(`  ✓ ${test.method} ${test.endpoint} - ${result.statusCode} (${result.responseTime}ms)`));
      } else {
        suite.failedTests++;
        console.log(chalk.red(`  ✗ ${test.method} ${test.endpoint} - ${result.error}`));
      }
    }
    
    suite.endTime = new Date();
    suite.duration = suite.endTime.getTime() - suite.startTime.getTime();
    this.results.push(suite);
    
    console.log(chalk.blue(`Completed test suite: ${name}`));
    console.log(chalk.blue(`  Passed: ${suite.passedTests}, Failed: ${suite.failedTests}, Duration: ${suite.duration}ms`));
    
    return suite;
  }
  
  /**
   * Generate a test report
   */
  generateReport() {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const reportPath = path.join(CONFIG.outputDir, `api-test-report-${timestamp}.json`);
    const htmlReportPath = path.join(CONFIG.outputDir, `api-test-report-${timestamp}.html`);
    
    // Calculate overall statistics
    const totalTests = this.results.reduce((sum, suite) => sum + suite.results.length, 0);
    const passedTests = this.results.reduce((sum, suite) => sum + suite.passedTests, 0);
    const failedTests = this.results.reduce((sum, suite) => sum + suite.failedTests, 0);
    const totalDuration = this.results.reduce((sum, suite) => sum + suite.duration, 0);
    
    // Generate report data
    const reportData = {
      timestamp: new Date().toISOString(),
      baseUrl: this.baseUrl,
      summary: {
        totalSuites: this.results.length,
        totalTests,
        passedTests,
        failedTests,
        successRate: `${(passedTests / totalTests * 100).toFixed(2)}%`,
        totalDuration: `${totalDuration}ms`
      },
      suites: this.results
    };
    
    // Write JSON report
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    // Generate HTML report
    const htmlReport = this.generateHtmlReport(reportData);
    fs.writeFileSync(htmlReportPath, htmlReport);
    
    console.log(chalk.green(`\n✅ Testing complete!`));
    console.log(chalk.green(`📊 Report generated:`));
    console.log(chalk.green(`   - JSON: ${reportPath}`));
    console.log(chalk.green(`   - HTML: ${htmlReportPath}`));
    
    return {
      reportPath,
      htmlReportPath,
      summary: reportData.summary
    };
  }
  
  /**
   * Generate HTML report
   */
  private generateHtmlReport(reportData: any): string {
    const suiteResults = reportData.suites.map((suite: any) => {
      const testRows = suite.results.map((result: any) => {
        const statusClass = result.success ? 'success' : 'error';
        const statusText = result.success ? 'PASS' : 'FAIL';
        
        return `
          <tr class="${statusClass}">
            <td>${result.method}</td>
            <td>${result.endpoint}</td>
            <td>${result.statusCode || 'N/A'}</td>
            <td>${result.responseTime}ms</td>
            <td class="status">${statusText}</td>
            <td>${result.error || ''}</td>
          </tr>
        `;
      }).join('');
      
      return `
        <div class="test-suite">
          <h3>${suite.name}</h3>
          <div class="suite-summary">
            <p>Duration: ${suite.duration}ms | Passed: ${suite.passedTests} | Failed: ${suite.failedTests}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Method</th>
                <th>Endpoint</th>
                <th>Status</th>
                <th>Response Time</th>
                <th>Result</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              ${testRows}
            </tbody>
          </table>
        </div>
      `;
    }).join('');
    
    return `<!DOCTYPE html>
      <html>
      <head>
        <title>FibonroseTrust API Test Report</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
          }
          h1, h2, h3 {
            color: #2c3e50;
          }
          .summary {
            background-color: #f8f9fa;
            border-radius: 5px;
            padding: 15px;
            margin-bottom: 20px;
            border-left: 5px solid #2c3e50;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
          }
          .summary-item {
            padding: 10px;
            background-color: white;
            border-radius: 5px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .summary-item h4 {
            margin: 0 0 5px 0;
            font-size: 14px;
            color: #666;
          }
          .summary-item p {
            margin: 0;
            font-size: 18px;
            font-weight: bold;
          }
          .test-suite {
            margin-bottom: 30px;
            background-color: white;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .test-suite h3 {
            padding: 15px;
            margin: 0;
            background-color: #2c3e50;
            color: white;
          }
          .suite-summary {
            padding: 10px 15px;
            background-color: #f8f9fa;
            border-bottom: 1px solid #ddd;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            text-align: left;
            padding: 10px 15px;
            border-bottom: 1px solid #ddd;
          }
          th {
            background-color: #f1f1f1;
          }
          tr.success {
            background-color: #f1fff0;
          }
          tr.error {
            background-color: #fff0f0;
          }
          .status {
            font-weight: bold;
          }
          tr.success .status {
            color: #28a745;
          }
          tr.error .status {
            color: #dc3545;
          }
        </style>
      </head>
      <body>
        <h1>FibonroseTrust API Test Report</h1>
        <p>Generated on: ${reportData.timestamp}</p>
        <p>Base URL: ${reportData.baseUrl}</p>
        
        <div class="summary">
          <h2>Summary</h2>
          <div class="summary-grid">
            <div class="summary-item">
              <h4>Test Suites</h4>
              <p>${reportData.summary.totalSuites}</p>
            </div>
            <div class="summary-item">
              <h4>Total Tests</h4>
              <p>${reportData.summary.totalTests}</p>
            </div>
            <div class="summary-item">
              <h4>Passed</h4>
              <p>${reportData.summary.passedTests}</p>
            </div>
            <div class="summary-item">
              <h4>Failed</h4>
              <p>${reportData.summary.failedTests}</p>
            </div>
            <div class="summary-item">
              <h4>Success Rate</h4>
              <p>${reportData.summary.successRate}</p>
            </div>
            <div class="summary-item">
              <h4>Total Duration</h4>
              <p>${reportData.summary.totalDuration}</p>
            </div>
          </div>
        </div>
        
        <h2>Test Suites</h2>
        ${suiteResults}
      </body>
      </html>`;
  }
  
  /**
   * Run a predefined test suite for the Users API
   */
  async testUsersApi() {
    return this.runTestSuite('Users API', [
      { method: 'GET', endpoint: '/user/1' },
      { method: 'GET', endpoint: '/user/username/jane.cooper' },
      { method: 'POST', endpoint: '/user', data: {
        username: `test-user-${Date.now()}`,
        password: 'TestPassword123!',
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        role: 'user'
      }}
    ]);
  }
  
  /**
   * Run a predefined test suite for the Trust Scores API
   */
  async testTrustScoresApi() {
    return this.runTestSuite('Trust Scores API', [
      { method: 'GET', endpoint: '/trust-scores/user/1' },
      { method: 'GET', endpoint: '/trust-scores/levels' },
      { method: 'GET', endpoint: '/trust-scores/levels/5/permissions' },
      { method: 'POST', endpoint: '/trust-scores/user/1/update' }
    ]);
  }
  
  /**
   * Run a predefined test suite for the Verifications API
   */
  async testVerificationsApi() {
    return this.runTestSuite('Verifications API', [
      { method: 'GET', endpoint: '/verifications/types' },
      { method: 'GET', endpoint: '/verifications/user/1' },
      { method: 'GET', endpoint: '/verifications/1' }
    ]);
  }
  
  /**
   * Run a predefined test suite for the NFTs API
   */
  async testNftsApi() {
    return this.runTestSuite('NFTs API', [
      { method: 'GET', endpoint: '/nfts/user/1' }
    ]);
  }
  
  /**
   * Run a predefined test suite for the Webhooks API
   */
  async testWebhooksApi() {
    return this.runTestSuite('Webhooks API', [
      { method: 'GET', endpoint: '/webhooks/subscriptions' }
    ]);
  }
  
  /**
   * Run a predefined test suite for the Security API
   */
  async testSecurityApi() {
    return this.runTestSuite('Security API', [
      { method: 'POST', endpoint: '/security/risk-assessment', data: {
        userId: 1,
        action: 'ACCOUNT_LOGIN',
        metadata: {
          device: 'Web Browser',
          location: 'Test'
        }
      }}
    ]);
  }
  
  /**
   * Run a predefined test suite for the Integration API
   */
  async testIntegrationsApi() {
    return this.runTestSuite('Integrations API', [
      { method: 'GET', endpoint: '/integrations/available' }
    ]);
  }
  
  /**
   * Run all API tests
   */
  async runAllTests() {
    await this.testUsersApi();
    await this.testTrustScoresApi();
    await this.testVerificationsApi();
    await this.testNftsApi();
    await this.testWebhooksApi();
    await this.testSecurityApi();
    await this.testIntegrationsApi();
    
    return this.generateReport();
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  console.log(chalk.blue('Starting FibonroseTrust API tests...'));
  const tester = new ApiTester();
  tester.runAllTests()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error(chalk.red('Error running tests:'), error);
      process.exit(1);
    });
}

export default ApiTester;