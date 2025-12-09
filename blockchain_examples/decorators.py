"""
Validation Decorators for Blockchain Operations
================================================

This module provides decorators for validating inputs in blockchain operations,
ensuring data integrity and security before interacting with smart contracts.
"""

import re
from functools import wraps
from typing import Callable, Any
from web3 import Web3


class ValidationError(Exception):
    """Custom exception for validation errors"""
    pass


def validate_address(func: Callable) -> Callable:
    """
    Decorator to validate Ethereum addresses before execution.
    
    Validates that address parameters are properly formatted Ethereum addresses.
    Checks for 'address', 'wallet_address', 'to_address', 'from_address' parameters.
    
    Args:
        func: The function to decorate
        
    Returns:
        Wrapped function with address validation
        
    Raises:
        ValidationError: If any address parameter is invalid
        
    Example:
        @validate_address
        def transfer(address: str, amount: float):
            # Function implementation
            pass
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        # Check kwargs for address-like parameters
        address_params = ['address', 'wallet_address', 'to_address', 'from_address', 'recipient']
        
        for param in address_params:
            if param in kwargs:
                addr = kwargs[param]
                if not Web3.is_address(addr):
                    raise ValidationError(
                        f"Invalid Ethereum address for parameter '{param}': {addr}"
                    )
                # Normalize to checksum address
                kwargs[param] = Web3.to_checksum_address(addr)
        
        # Check positional args if first arg looks like an address
        if args and isinstance(args[0], str) and args[0].startswith('0x'):
            if not Web3.is_address(args[0]):
                raise ValidationError(f"Invalid Ethereum address: {args[0]}")
            args = (Web3.to_checksum_address(args[0]),) + args[1:]
        
        return func(*args, **kwargs)
    return wrapper


def validate_amount(min_amount: float = 0, max_amount: float = None) -> Callable:
    """
    Decorator to validate transaction amounts.
    
    Ensures amounts are within acceptable ranges and are valid numbers.
    
    Args:
        min_amount: Minimum allowed amount (default: 0)
        max_amount: Maximum allowed amount (default: None, no limit)
        
    Returns:
        Decorator function
        
    Raises:
        ValidationError: If amount is invalid or out of range
        
    Example:
        @validate_amount(min_amount=0.001, max_amount=100.0)
        def transfer(address: str, amount: float):
            # Function implementation
            pass
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Check kwargs for amount-like parameters
            amount_params = ['amount', 'value', 'wei', 'ether']
            
            for param in amount_params:
                if param in kwargs:
                    amount = kwargs[param]
                    
                    # Validate type
                    if not isinstance(amount, (int, float)):
                        try:
                            amount = float(amount)
                            kwargs[param] = amount
                        except (ValueError, TypeError):
                            raise ValidationError(
                                f"Invalid amount for parameter '{param}': must be a number"
                            )
                    
                    # Validate range
                    if amount < min_amount:
                        raise ValidationError(
                            f"Amount too low for parameter '{param}': {amount} < {min_amount}"
                        )
                    
                    if max_amount is not None and amount > max_amount:
                        raise ValidationError(
                            f"Amount too high for parameter '{param}': {amount} > {max_amount}"
                        )
            
            return func(*args, **kwargs)
        return wrapper
    return decorator


def validate_gas_params(max_gas: int = 500000, max_gas_price_gwei: int = 100) -> Callable:
    """
    Decorator to validate gas parameters for transactions.
    
    Ensures gas limits and prices are reasonable to prevent excessive fees.
    
    Args:
        max_gas: Maximum allowed gas limit (default: 500000)
        max_gas_price_gwei: Maximum allowed gas price in Gwei (default: 100)
        
    Returns:
        Decorator function
        
    Raises:
        ValidationError: If gas parameters are invalid or too high
        
    Example:
        @validate_gas_params(max_gas=300000, max_gas_price_gwei=50)
        def send_transaction(address: str, amount: float, gas: int, gas_price: int):
            # Function implementation
            pass
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Validate gas limit
            if 'gas' in kwargs or 'gas_limit' in kwargs:
                gas = kwargs.get('gas', kwargs.get('gas_limit'))
                
                if not isinstance(gas, int):
                    try:
                        gas = int(gas)
                    except (ValueError, TypeError):
                        raise ValidationError("Gas limit must be an integer")
                
                if gas > max_gas:
                    raise ValidationError(
                        f"Gas limit too high: {gas} > {max_gas}"
                    )
                
                if gas < 21000:  # Minimum for a simple transfer
                    raise ValidationError(
                        f"Gas limit too low: {gas} < 21000 (minimum for transfer)"
                    )
            
            # Validate gas price
            if 'gas_price' in kwargs or 'gasPrice' in kwargs:
                gas_price = kwargs.get('gas_price', kwargs.get('gasPrice'))
                
                if not isinstance(gas_price, (int, float)):
                    try:
                        gas_price = int(gas_price)
                    except (ValueError, TypeError):
                        raise ValidationError("Gas price must be a number")
                
                # Convert to Gwei for comparison
                gas_price_gwei = gas_price / 1e9 if gas_price > 1000 else gas_price
                
                if gas_price_gwei > max_gas_price_gwei:
                    raise ValidationError(
                        f"Gas price too high: {gas_price_gwei} Gwei > {max_gas_price_gwei} Gwei"
                    )
            
            return func(*args, **kwargs)
        return wrapper
    return decorator


def validate_transaction_params(func: Callable) -> Callable:
    """
    Comprehensive decorator that validates all common transaction parameters.
    
    Combines address, amount, and gas validation for convenience.
    
    Args:
        func: The function to decorate
        
    Returns:
        Wrapped function with comprehensive validation
        
    Raises:
        ValidationError: If any parameter is invalid
        
    Example:
        @validate_transaction_params
        def send_transaction(to_address: str, amount: float, gas: int):
            # Function implementation
            pass
    """
    @wraps(func)
    @validate_address
    @validate_amount(min_amount=0)
    @validate_gas_params()
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper


def require_connection(func: Callable) -> Callable:
    """
    Decorator to ensure Web3 connection is active before execution.
    
    Validates that the function has access to a connected Web3 instance.
    
    Args:
        func: The function to decorate
        
    Returns:
        Wrapped function with connection validation
        
    Raises:
        ValidationError: If no Web3 connection is available
        
    Example:
        @require_connection
        def get_balance(self, address: str):
            # Function implementation using self.w3
            pass
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        # Check if instance has w3 or web3 attribute
        if args and hasattr(args[0], 'w3'):
            w3 = args[0].w3
            if not w3.is_connected():
                raise ValidationError("Web3 provider is not connected")
        elif args and hasattr(args[0], 'web3'):
            w3 = args[0].web3
            if not w3.is_connected():
                raise ValidationError("Web3 provider is not connected")
        elif 'w3' in kwargs:
            if not kwargs['w3'].is_connected():
                raise ValidationError("Web3 provider is not connected")
        
        return func(*args, **kwargs)
    return wrapper
