# Blockchain Interaction Examples

This module provides comprehensive, production-ready examples for blockchain interactions with a focus on smart contracts, balance transfers, event logging, and task validation. All components follow Pythonic principles and are designed to be modular and reusable.

## Features

- **✅ Balance Transfer Operations**: Synchronous and asynchronous ETH transfer with validation
- **✅ Event Logging**: Listen to and log blockchain events (Transfer, Approval, custom events)
- **✅ Validation Decorators**: Input validation for addresses, amounts, gas parameters
- **✅ Metrics Collection**: Track task complexity based on execution time and interaction volume
- **✅ Async/Await Support**: Efficient query handling with asyncio
- **✅ Modular Design**: Easy to integrate and extend

## Installation

First, install the required dependencies:

```bash
# Using pip
pip install web3 aiohttp

# Using uv (if available)
uv pip install web3 aiohttp
```

## Module Structure

```
blockchain_examples/
├── __init__.py           # Package initialization and exports
├── decorators.py         # Validation decorators
├── metrics.py            # Task complexity metrics
├── balance_transfer.py   # Balance transfer operations
├── event_logger.py       # Event listening and logging
├── examples.py           # Usage examples and demonstrations
└── README.md            # This file
```

## Quick Start

### 1. Balance Transfer

```python
from blockchain_examples import BalanceTransfer

# Initialize with your provider URL
transfer = BalanceTransfer("https://mainnet.infura.io/v3/YOUR_KEY")

# Check balance
balance = transfer.get_balance("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb")
print(f"Balance: {balance} ETH")

# Transfer ETH (requires private key)
result = transfer.transfer(
    from_address="0xYOUR_ADDRESS",
    to_address="0xRECIPIENT_ADDRESS",
    amount=0.1,
    private_key="0xYOUR_PRIVATE_KEY"
)
print(f"Transaction hash: {result['transaction_hash']}")
```

### 2. Event Logging

```python
from blockchain_examples import EventLogger, ERC20_TRANSFER_APPROVAL_ABI

# Initialize event logger
logger = EventLogger(
    provider_url="https://mainnet.infura.io/v3/YOUR_KEY",
    contract_address="0xTOKEN_CONTRACT_ADDRESS",
    contract_abi=ERC20_TRANSFER_APPROVAL_ABI
)

# Register custom event handler
def on_transfer(event):
    print(f"Transfer: {event['args']['from']} -> {event['args']['to']}")

logger.register_handler("Transfer", on_transfer)

# Get past events
events = logger.get_past_events(
    "Transfer",
    from_block=18000000,
    to_block="latest"
)
print(f"Found {len(events)} transfer events")
```

### 3. Using Validation Decorators

```python
from blockchain_examples import validate_address, validate_amount, ValidationError

@validate_address
@validate_amount(min_amount=0.001, max_amount=100.0)
def process_transfer(address: str, amount: float):
    print(f"Processing transfer of {amount} ETH to {address}")
    # Your logic here

try:
    process_transfer("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", 1.5)
except ValidationError as e:
    print(f"Validation failed: {e}")
```

### 4. Metrics and Complexity Tracking

```python
from blockchain_examples import MetricsCollector

collector = MetricsCollector()

# Start tracking a task
metrics = collector.start_task("tx_001", "Balance Transfer")

# Update metrics during execution
collector.update_task(
    "tx_001",
    gas_used=21000,
    transaction_count=1,
    network_requests=3
)

# Complete task and get complexity
completed = collector.end_task("tx_001")
print(f"Complexity Score: {completed.complexity_score}")
print(f"Complexity Level: {completed.complexity_level.name}")

# Get summary
summary = collector.get_summary()
print(f"Average complexity: {summary['avg_complexity_score']}")
```

### 5. Async Operations

```python
import asyncio
from blockchain_examples import BalanceTransfer

async def check_balances():
    transfer = BalanceTransfer("https://mainnet.infura.io/v3/YOUR_KEY")
    
    addresses = [
        "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    ]
    
    # Check all balances concurrently
    tasks = [transfer.get_balance_async(addr) for addr in addresses]
    balances = await asyncio.gather(*tasks)
    
    for addr, balance in zip(addresses, balances):
        print(f"{addr}: {balance} ETH")

# Run async function
asyncio.run(check_balances())
```

### 6. Real-time Event Listening

```python
import asyncio
from blockchain_examples import EventLogger, ERC20_TRANSFER_APPROVAL_ABI

async def listen_to_transfers():
    logger = EventLogger(
        "https://mainnet.infura.io/v3/YOUR_KEY",
        contract_address="0xTOKEN_ADDRESS",
        contract_abi=ERC20_TRANSFER_APPROVAL_ABI
    )
    
    # Register handler
    logger.register_handler("Transfer", logger.log_transfer_event)
    
    # Listen for 60 seconds
    await logger.listen_to_events_async(
        "Transfer",
        from_block="latest",
        poll_interval=2,
        duration=60
    )

asyncio.run(listen_to_transfers())
```

## Running Examples

A comprehensive demonstration script is included:

```bash
python blockchain_examples/examples.py
```

This will run all examples demonstrating:
- Balance checking with validation
- Validation decorators
- Metrics collection
- Event logging setup
- Async operations
- Comprehensive workflow

## API Reference

### Decorators

#### `@validate_address`
Validates Ethereum addresses before function execution.

#### `@validate_amount(min_amount=0, max_amount=None)`
Validates transaction amounts are within acceptable ranges.

#### `@validate_gas_params(max_gas=500000, max_gas_price_gwei=100)`
Validates gas parameters to prevent excessive fees.

#### `@validate_transaction_params`
Comprehensive validation combining address, amount, and gas validation.

#### `@require_connection`
Ensures Web3 connection is active before execution.

### Classes

#### `BalanceTransfer`
Handles balance transfer operations with validation and metrics.

**Methods:**
- `get_balance(address: str) -> float`
- `transfer(...) -> Dict[str, Any]`
- `transfer_async(...) -> Dict[str, Any]`
- `batch_transfer_async(...) -> List[Dict[str, Any]]`
- `get_metrics_summary() -> Dict[str, Any]`
- `export_metrics(filepath: str)`

#### `EventLogger`
Listens to and logs blockchain events.

**Methods:**
- `register_handler(event_name: str, handler: Callable)`
- `watch_address_transfers(address: str, ...) -> List[Dict[str, Any]]`
- `listen_to_events_async(event_name: str, ...)`
- `get_past_events(event_name: str, ...) -> List[Dict[str, Any]]`
- `export_events_to_json(events: List[Dict], filepath: str)`
- `get_metrics_summary() -> Dict[str, Any]`

#### `MetricsCollector`
Tracks and analyzes blockchain task metrics.

**Methods:**
- `start_task(task_id: str, task_name: str, ...) -> TaskMetrics`
- `end_task(task_id: str) -> TaskMetrics`
- `update_task(task_id: str, ...)`
- `calculate_complexity_score(metrics: TaskMetrics) -> float`
- `get_summary() -> Dict[str, Any]`
- `export_metrics(filepath: str)`

## Complexity Levels

The metrics module categorizes task complexity into 5 levels based on a 0-100 score:

- **SIMPLE** (0-20): Basic operations, low resource usage
- **MODERATE** (20-40): Standard transactions, moderate complexity
- **COMPLEX** (40-60): Multiple operations, higher resource usage
- **VERY_COMPLEX** (60-80): Batch operations, significant resources
- **EXTREME** (80-100): Complex workflows, maximum resources

Complexity is calculated based on:
- Execution time (30% weight)
- Gas used (25% weight)
- Transaction count (20% weight)
- Contract calls (15% weight)
- Network requests (10% weight)

## Security Considerations

⚠️ **Important Security Notes:**

1. **Private Keys**: Never hardcode private keys in your code. Use environment variables or secure key management systems.

2. **Gas Limits**: Always validate gas parameters to prevent excessive fees.

3. **Address Validation**: Use the provided decorators to validate all addresses before operations.

4. **Network Selection**: Be careful when switching between mainnet and testnets.

5. **Rate Limiting**: Implement rate limiting for production use to avoid provider throttling.

## Testing

The module includes comprehensive validation and error handling. To test:

```python
# Test validation
from blockchain_examples import validate_address, ValidationError

@validate_address
def test_func(address: str):
    return address

try:
    test_func("invalid_address")
except ValidationError as e:
    print(f"✓ Validation working: {e}")
```

## Contributing

When extending this module:

1. Follow Pythonic conventions (PEP 8)
2. Add comprehensive docstrings
3. Include usage examples in docstrings
4. Add appropriate error handling
5. Update this README with new features

## License

MIT License - See repository LICENSE file for details.

## Support

For issues or questions:
- Check the examples.py file for usage patterns
- Review the inline documentation in each module
- Consult the Web3.py documentation for provider-specific details

## Integration with FibonRoseTrust

This module is designed to integrate seamlessly with the FibonRoseTrust verification system:

- Track verification transactions with metrics
- Log identity verification events
- Validate NFT-related operations
- Monitor trust score updates on-chain

For integration examples with the existing TypeScript blockchain utilities in `client/src/lib/utils/blockchain.ts`, refer to the main project documentation.
