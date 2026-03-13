"""
Blockchain Interaction Examples
================================

This package provides modular, Pythonic examples for blockchain interactions,
focusing on smart contract operations with validation, event logging, and metrics.

Modules:
    - decorators: Input validation decorators for blockchain operations
    - metrics: Task complexity measurement and metrics collection
    - balance_transfer: Balance transfer operations with async support
    - event_logger: Blockchain event listening and logging

Example Usage:
    >>> from blockchain_examples import BalanceTransfer, EventLogger
    >>> from blockchain_examples.decorators import validate_address
    >>> 
    >>> # Initialize transfer client
    >>> transfer = BalanceTransfer("https://mainnet.infura.io/v3/YOUR_KEY")
    >>> 
    >>> # Get balance
    >>> balance = transfer.get_balance("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb")
    >>> 
    >>> # Initialize event logger
    >>> logger = EventLogger(
    ...     "https://mainnet.infura.io/v3/YOUR_KEY",
    ...     contract_address="0x...",
    ...     contract_abi=TOKEN_ABI
    ... )
    >>> 
    >>> # Listen to events
    >>> events = logger.get_past_events("Transfer", from_block=18000000)
"""

from .balance_transfer import BalanceTransfer
from .event_logger import EventLogger, ERC20_TRANSFER_APPROVAL_ABI
from .decorators import (
    validate_address,
    validate_amount,
    validate_gas_params,
    validate_transaction_params,
    require_connection,
    ValidationError
)
from .metrics import (
    MetricsCollector,
    TaskMetrics,
    ComplexityLevel,
    measure_complexity
)

__version__ = "1.0.0"
__all__ = [
    # Core classes
    "BalanceTransfer",
    "EventLogger",
    "MetricsCollector",
    
    # Data classes
    "TaskMetrics",
    "ComplexityLevel",
    
    # Decorators
    "validate_address",
    "validate_amount",
    "validate_gas_params",
    "validate_transaction_params",
    "require_connection",
    "measure_complexity",
    
    # Exceptions
    "ValidationError",
    
    # Constants
    "ERC20_TRANSFER_APPROVAL_ABI",
]
