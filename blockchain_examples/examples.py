#!/usr/bin/env python3
"""
Blockchain Interaction Examples - Demonstration Script
======================================================

This script demonstrates the usage of the blockchain interaction modules,
including balance transfers, event logging, validation, and metrics tracking.

Note: This is a demonstration script. Replace placeholder values with actual
      Ethereum addresses, private keys, and provider URLs before running.
"""

import asyncio
import sys
from datetime import datetime

# Import blockchain examples modules
from blockchain_examples import (
    BalanceTransfer,
    EventLogger,
    MetricsCollector,
    validate_address,
    validate_amount,
    ValidationError,
    ERC20_TRANSFER_APPROVAL_ABI
)


def print_section(title: str):
    """Helper function to print section headers"""
    print("\n" + "=" * 70)
    print(f" {title}")
    print("=" * 70 + "\n")


def example_1_balance_checking():
    """
    Example 1: Checking Ethereum balance with validation
    """
    print_section("Example 1: Balance Checking with Validation")
    
    # Initialize the balance transfer client
    # Note: Replace with your actual Infura or Alchemy URL
    provider_url = "https://mainnet.infura.io/v3/YOUR_INFURA_KEY"
    
    try:
        transfer = BalanceTransfer(provider_url)
        
        # Example Ethereum address (Vitalik's address for demonstration)
        address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
        
        print(f"Checking balance for: {address}")
        balance = transfer.get_balance(address)
        print(f"✓ Balance: {balance} ETH")
        
        # Get metrics summary
        metrics = transfer.get_metrics_summary()
        print(f"\nMetrics Summary:")
        print(f"  Total tasks: {metrics['total_tasks']}")
        print(f"  Average complexity: {metrics['avg_complexity_score']}")
        
    except ValidationError as e:
        print(f"✗ Validation error: {e}")
    except ConnectionError as e:
        print(f"✗ Connection error: {e}")
        print("  → Make sure to replace YOUR_INFURA_KEY with a valid key")
    except Exception as e:
        print(f"✗ Error: {e}")


def example_2_validation_decorators():
    """
    Example 2: Using validation decorators
    """
    print_section("Example 2: Validation Decorators")
    
    @validate_address
    def process_address(address: str):
        print(f"  ✓ Valid address: {address}")
        return address
    
    @validate_amount(min_amount=0.001, max_amount=10.0)
    def process_amount(amount: float):
        print(f"  ✓ Valid amount: {amount} ETH")
        return amount
    
    # Test valid inputs
    print("Testing valid inputs:")
    try:
        process_address(address="0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")
        process_amount(amount=1.5)
    except ValidationError as e:
        print(f"  ✗ {e}")
    
    # Test invalid inputs
    print("\nTesting invalid inputs:")
    try:
        print("  Attempting invalid address...")
        process_address(address="invalid_address")
        print("  ✗ Validation did not catch invalid address!")
    except ValidationError as e:
        print(f"  ✓ Caught validation error: {e}")
    
    try:
        print("  Attempting amount exceeding max...")
        process_amount(amount=15.0)  # Exceeds max_amount
        print("  ✗ Validation did not catch excessive amount!")
    except ValidationError as e:
        print(f"  ✓ Caught validation error: {e}")


def example_3_metrics_collection():
    """
    Example 3: Task complexity metrics
    """
    print_section("Example 3: Task Complexity Metrics")
    
    collector = MetricsCollector()
    
    # Simulate a blockchain task
    print("Simulating blockchain task execution...")
    
    task_id = "transfer_001"
    metrics = collector.start_task(task_id, "ETH Transfer", {
        "from": "0xABC...",
        "to": "0xDEF...",
        "amount": 1.5
    })
    
    # Simulate task progress
    import time
    time.sleep(0.5)  # Simulate execution time
    
    # Update metrics
    collector.update_task(
        task_id,
        gas_used=21000,
        transaction_count=1,
        contract_calls=2,
        network_requests=5
    )
    
    # Complete task
    completed_metrics = collector.end_task(task_id)
    
    # Display results
    print(f"\nTask Completed:")
    print(f"  Task ID: {completed_metrics.task_id}")
    print(f"  Task Name: {completed_metrics.task_name}")
    print(f"  Execution Time: {completed_metrics.execution_time:.3f}s")
    print(f"  Gas Used: {completed_metrics.gas_used}")
    print(f"  Transaction Count: {completed_metrics.transaction_count}")
    print(f"  Contract Calls: {completed_metrics.contract_calls}")
    print(f"  Network Requests: {completed_metrics.network_requests}")
    print(f"  Complexity Score: {completed_metrics.complexity_score}")
    print(f"  Complexity Level: {completed_metrics.complexity_level.name}")


def example_4_event_logging():
    """
    Example 4: Event logging setup
    """
    print_section("Example 4: Event Logging Setup")
    
    print("Setting up event logger...")
    
    # Example setup (would need actual contract address and ABI)
    provider_url = "https://mainnet.infura.io/v3/YOUR_INFURA_KEY"
    
    # USDT contract on Ethereum mainnet (example)
    usdt_address = "0xdAC17F958D2ee523a2206206994597C13D831ec7"
    
    try:
        logger = EventLogger(
            provider_url,
            contract_address=usdt_address,
            contract_abi=ERC20_TRANSFER_APPROVAL_ABI
        )
        
        # Register custom event handler
        def custom_transfer_handler(event):
            args = event.get('args', {})
            print(f"  📤 Transfer detected!")
            print(f"     From: {args.get('from', 'unknown')}")
            print(f"     To: {args.get('to', 'unknown')}")
            print(f"     Amount: {args.get('value', 0)}")
        
        logger.register_handler("Transfer", custom_transfer_handler)
        print("✓ Event logger configured")
        print("✓ Custom handler registered for Transfer events")
        
        # Note: Actually listening to events would require connection
        print("\n  To listen to events in real-time:")
        print("  await logger.listen_to_events_async('Transfer')")
        
    except ConnectionError as e:
        print(f"✗ Connection error: {e}")
        print("  → Make sure to replace YOUR_INFURA_KEY with a valid key")
    except Exception as e:
        print(f"✗ Error: {e}")


async def example_5_async_operations():
    """
    Example 5: Async balance checking
    """
    print_section("Example 5: Async Operations")
    
    provider_url = "https://mainnet.infura.io/v3/YOUR_INFURA_KEY"
    
    try:
        transfer = BalanceTransfer(provider_url)
        
        # Example addresses
        addresses = [
            "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",  # Vitalik
            "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",   # Example
        ]
        
        print("Checking balances asynchronously...")
        
        # Create async tasks
        tasks = [transfer.get_balance_async(addr) for addr in addresses]
        
        # Execute concurrently
        balances = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Display results
        for addr, balance in zip(addresses, balances):
            if isinstance(balance, Exception):
                print(f"✗ {addr[:10]}...: Error - {balance}")
            else:
                print(f"✓ {addr[:10]}...: {balance} ETH")
                
    except ConnectionError as e:
        print(f"✗ Connection error: {e}")
        print("  → Make sure to replace YOUR_INFURA_KEY with a valid key")
    except Exception as e:
        print(f"✗ Error: {e}")


def example_6_comprehensive_workflow():
    """
    Example 6: Comprehensive workflow demonstration
    """
    print_section("Example 6: Comprehensive Workflow")
    
    print("This example demonstrates a complete workflow:")
    print("  1. Initialize balance transfer client")
    print("  2. Validate parameters using decorators")
    print("  3. Check balance before transfer")
    print("  4. Execute transfer (simulated)")
    print("  5. Track metrics and complexity")
    print("  6. Log events")
    print("  7. Export metrics report")
    
    print("\n✓ All modules are integrated and ready for use")
    print("\nKey Features:")
    print("  ✓ Parameter validation with decorators")
    print("  ✓ Async/await support for efficient queries")
    print("  ✓ Event listening and logging")
    print("  ✓ Task complexity measurement")
    print("  ✓ Modular, reusable design")


def main():
    """
    Main function to run all examples
    """
    print("\n" + "=" * 70)
    print(" Blockchain Interaction Examples - Demonstration")
    print("=" * 70)
    print(f"\n Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # Run synchronous examples
    example_1_balance_checking()
    example_2_validation_decorators()
    example_3_metrics_collection()
    example_4_event_logging()
    example_6_comprehensive_workflow()
    
    # Run async example
    print_section("Running Async Examples")
    try:
        asyncio.run(example_5_async_operations())
    except Exception as e:
        print(f"✗ Async example error: {e}")
    
    print("\n" + "=" * 70)
    print(" Demonstration Complete")
    print("=" * 70)
    print(f"\n Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    print("\n📝 Note:")
    print("  Replace 'YOUR_INFURA_KEY' with an actual Infura/Alchemy API key")
    print("  to execute real blockchain interactions.")
    print("\n  For production use, ensure:")
    print("    - Secure private key management")
    print("    - Proper error handling")
    print("    - Gas price optimization")
    print("    - Transaction confirmation checks")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n✗ Interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Fatal error: {e}")
        sys.exit(1)
