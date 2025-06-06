/**
 * FibonroseTrust Testing Suite Runner
 * 
 * This script provides a unified interface to run the API tests and webhook generator.
 */

import chalk from 'chalk';
import { createInterface } from 'readline';
import ApiTester from './api-tester';
import WebhookGenerator from './webhook-generator';

const readline = createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => {
  return new Promise(resolve => {
    readline.question(query, resolve);
  });
};

async function main() {
  console.log(chalk.blue('\n=== FibonroseTrust Testing Suite ==='));
  console.log(chalk.cyan('This tool helps you test the FibonroseTrust platform\n'));
  
  while (true) {
    console.log(chalk.yellow('\nAvailable testing options:'));
    console.log('1. Run API Tests');
    console.log('2. Run Webhook Generator (Interactive)');
    console.log('3. Run Webhook Test Batch');
    console.log('4. Run All Tests');
    console.log('5. Exit');
    
    const choice = parseInt(await question(chalk.green('\nSelect an option (number): ')), 10);
    
    switch (choice) {
      case 1:
        console.log(chalk.blue('\nRunning API Tests...'));
        const apiTester = new ApiTester();
        await apiTester.runAllTests();
        break;
        
      case 2:
        console.log(chalk.blue('\nStarting Webhook Generator...'));
        const interactiveGenerator = new WebhookGenerator();
        await interactiveGenerator.startInteractiveMode();
        break;
        
      case 3:
        console.log(chalk.blue('\nRunning Webhook Test Batch...'));
        const batchGenerator = new WebhookGenerator();
        await batchGenerator.runTestBatch();
        break;
        
      case 4:
        console.log(chalk.blue('\nRunning All Tests...'));
        
        // First run API tests
        console.log(chalk.blue('\n1. API Tests'));
        const fullApiTester = new ApiTester();
        await fullApiTester.runAllTests();
        
        // Then run webhook test batch
        console.log(chalk.blue('\n2. Webhook Tests'));
        const fullWebhookGenerator = new WebhookGenerator();
        await fullWebhookGenerator.runTestBatch();
        
        console.log(chalk.green('\nAll tests completed!'));
        break;
        
      case 5:
        console.log(chalk.blue('\nExiting Testing Suite'));
        readline.close();
        return;
        
      default:
        console.log(chalk.red('\nInvalid choice, please try again'));
    }
    
    const runAgain = await question(chalk.green('\nRun another test? (y/n): '));
    if (runAgain.toLowerCase() !== 'y') {
      console.log(chalk.blue('\nExiting Testing Suite'));
      readline.close();
      return;
    }
  }
}

// Run the main function if this file is executed directly
if (require.main === module) {
  main()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error(chalk.red('Error running tests:'), error);
      process.exit(1);
    });
}