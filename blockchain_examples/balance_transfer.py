"""
Balance Transfer Module
=======================

This module demonstrates balance transfer operations with validation,
logging functionality, and metrics collection for task complexity measurement.
"""

import asyncio
import logging
from typing import Optional, Dict, Any
from web3 import Web3, AsyncWeb3
from web3.exceptions import Web3Exception
from eth_account import Account

from .decorators import (
    validate_address,
    validate_amount,
    validate_transaction_params,
    ValidationError
)
from .metrics import MetricsCollector, TaskMetrics


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class BalanceTransfer:
    """
    Class to handle balance transfer operations on Ethereum blockchain.
    
    Provides both synchronous and asynchronous methods for transferring ETH
    with comprehensive validation, logging, and metrics tracking.
    
    Attributes:
        w3: Web3 instance for blockchain interaction
        metrics_collector: MetricsCollector for tracking task complexity
        chain_id: Network chain ID
    """
    
    def __init__(self, provider_url: str, chain_id: Optional[int] = None):
        """
        Initialize the BalanceTransfer instance.
        
        Args:
            provider_url: Web3 provider URL (e.g., Infura, local node)
            chain_id: Optional chain ID (auto-detected if not provided)
            
        Example:
            >>> transfer = BalanceTransfer("https://mainnet.infura.io/v3/YOUR_KEY")
        """
        self.w3 = Web3(Web3.HTTPProvider(provider_url))
        self.metrics_collector = MetricsCollector()
        
        if not self.w3.is_connected():
            raise ConnectionError(f"Failed to connect to provider: {provider_url}")
        
        self.chain_id = chain_id or self.w3.eth.chain_id
        logger.info(f"Connected to network with chain ID: {self.chain_id}")
    
    @validate_address
    def get_balance(self, address: str) -> float:
        """
        Get the balance of an Ethereum address.
        
        Args:
            address: Ethereum address to check
            
        Returns:
            Balance in ETH
            
        Example:
            >>> balance = transfer.get_balance("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb")
            >>> print(f"Balance: {balance} ETH")
        """
        task_id = f"get_balance_{address[:10]}"
        self.metrics_collector.start_task(task_id, "Get Balance", {"address": address})
        
        try:
            balance_wei = self.w3.eth.get_balance(address)
            balance_eth = self.w3.from_wei(balance_wei, 'ether')
            
            self.metrics_collector.update_task(task_id, network_requests=1)
            logger.info(f"Balance for {address}: {balance_eth} ETH")
            
            return float(balance_eth)
        except Exception as e:
            logger.error(f"Error getting balance for {address}: {e}")
            raise
        finally:
            self.metrics_collector.end_task(task_id)
    
    @validate_transaction_params
    def transfer(
        self,
        from_address: str,
        to_address: str,
        amount: float,
        private_key: str,
        gas: Optional[int] = None,
        gas_price: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Transfer ETH from one address to another.
        
        Args:
            from_address: Sender's Ethereum address
            to_address: Recipient's Ethereum address
            amount: Amount to transfer in ETH
            private_key: Private key of sender (for signing)
            gas: Optional gas limit (auto-estimated if not provided)
            gas_price: Optional gas price in Wei (uses network rate if not provided)
            
        Returns:
            Dictionary containing transaction details and metrics
            
        Raises:
            ValidationError: If validation fails
            Web3Exception: If transaction fails
            
        Example:
            >>> result = transfer.transfer(
            ...     from_address="0x123...",
            ...     to_address="0x456...",
            ...     amount=0.1,
            ...     private_key="0xYOUR_PRIVATE_KEY"
            ... )
            >>> print(f"Transaction hash: {result['transaction_hash']}")
        """
        task_id = f"transfer_{int(asyncio.get_event_loop().time() * 1000)}"
        metrics = self.metrics_collector.start_task(
            task_id,
            "Balance Transfer",
            {
                "from": from_address,
                "to": to_address,
                "amount": amount
            }
        )
        
        try:
            # Validate sender has sufficient balance
            sender_balance = self.get_balance(from_address)
            if sender_balance < amount:
                raise ValidationError(
                    f"Insufficient balance: {sender_balance} ETH < {amount} ETH"
                )
            
            # Get nonce
            nonce = self.w3.eth.get_transaction_count(from_address)
            logger.info(f"Transaction nonce: {nonce}")
            
            # Build transaction
            transaction = {
                'nonce': nonce,
                'to': to_address,
                'value': self.w3.to_wei(amount, 'ether'),
                'chainId': self.chain_id
            }
            
            # Set gas limit
            if gas is None:
                gas = self.w3.eth.estimate_gas(transaction)
                logger.info(f"Estimated gas: {gas}")
            transaction['gas'] = gas
            
            # Set gas price
            if gas_price is None:
                gas_price = self.w3.eth.gas_price
                logger.info(f"Current gas price: {self.w3.from_wei(gas_price, 'gwei')} Gwei")
            transaction['gasPrice'] = gas_price
            
            # Update metrics
            self.metrics_collector.update_task(task_id, network_requests=3)
            
            # Sign transaction
            account = Account.from_key(private_key)
            if account.address.lower() != from_address.lower():
                raise ValidationError("Private key does not match from_address")
            
            signed_txn = account.sign_transaction(transaction)
            logger.info("Transaction signed successfully")
            
            # Send transaction
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            tx_hash_hex = self.w3.to_hex(tx_hash)
            logger.info(f"Transaction sent: {tx_hash_hex}")
            
            # Update metrics
            self.metrics_collector.update_task(
                task_id,
                transaction_count=1,
                gas_used=gas,
                network_requests=1
            )
            
            # Wait for transaction receipt
            logger.info("Waiting for transaction confirmation...")
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            success = receipt['status'] == 1
            actual_gas_used = receipt['gasUsed']
            
            # Update metrics with actual gas used
            self.metrics_collector.update_task(task_id, gas_used=actual_gas_used - gas)
            
            logger.info(
                f"Transaction {'successful' if success else 'failed'}: "
                f"Block {receipt['blockNumber']}, Gas used: {actual_gas_used}"
            )
            
            # Complete metrics collection
            task_metrics = self.metrics_collector.end_task(task_id)
            
            return {
                'success': success,
                'transaction_hash': tx_hash_hex,
                'block_number': receipt['blockNumber'],
                'gas_used': actual_gas_used,
                'from_address': from_address,
                'to_address': to_address,
                'amount': amount,
                'metrics': task_metrics.to_dict()
            }
            
        except ValidationError as e:
            logger.error(f"Validation error: {e}")
            self.metrics_collector.end_task(task_id)
            raise
        except Web3Exception as e:
            logger.error(f"Web3 error during transfer: {e}")
            self.metrics_collector.end_task(task_id)
            raise
        except Exception as e:
            logger.error(f"Unexpected error during transfer: {e}")
            self.metrics_collector.end_task(task_id)
            raise
    
    async def transfer_async(
        self,
        from_address: str,
        to_address: str,
        amount: float,
        private_key: str,
        gas: Optional[int] = None,
        gas_price: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Asynchronous version of transfer for efficient query handling.
        
        Args:
            from_address: Sender's Ethereum address
            to_address: Recipient's Ethereum address
            amount: Amount to transfer in ETH
            private_key: Private key of sender (for signing)
            gas: Optional gas limit
            gas_price: Optional gas price in Wei
            
        Returns:
            Dictionary containing transaction details and metrics
            
        Example:
            >>> result = await transfer.transfer_async(
            ...     from_address="0x123...",
            ...     to_address="0x456...",
            ...     amount=0.1,
            ...     private_key="0xYOUR_PRIVATE_KEY"
            ... )
        """
        # Run synchronous transfer in executor to avoid blocking
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            self.transfer,
            from_address,
            to_address,
            amount,
            private_key,
            gas,
            gas_price
        )
    
    @validate_address
    async def get_balance_async(self, address: str) -> float:
        """
        Asynchronously get the balance of an Ethereum address.
        
        Args:
            address: Ethereum address to check
            
        Returns:
            Balance in ETH
            
        Example:
            >>> balance = await transfer.get_balance_async("0x742d35Cc...")
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.get_balance, address)
    
    async def batch_transfer_async(
        self,
        from_address: str,
        recipients: list[Dict[str, Any]],
        private_key: str
    ) -> list[Dict[str, Any]]:
        """
        Perform multiple transfers asynchronously for efficiency.
        
        Args:
            from_address: Sender's Ethereum address
            recipients: List of dicts with 'address' and 'amount' keys
            private_key: Private key of sender
            
        Returns:
            List of transaction results
            
        Example:
            >>> recipients = [
            ...     {"address": "0x123...", "amount": 0.1},
            ...     {"address": "0x456...", "amount": 0.2}
            ... ]
            >>> results = await transfer.batch_transfer_async(
            ...     from_address="0xabc...",
            ...     recipients=recipients,
            ...     private_key="0xYOUR_KEY"
            ... )
        """
        logger.info(f"Starting batch transfer of {len(recipients)} transactions")
        
        # Create tasks for all transfers
        tasks = [
            self.transfer_async(
                from_address=from_address,
                to_address=recipient['address'],
                amount=recipient['amount'],
                private_key=private_key
            )
            for recipient in recipients
        ]
        
        # Execute all transfers concurrently
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Log results
        successful = sum(1 for r in results if isinstance(r, dict) and r.get('success'))
        logger.info(f"Batch transfer completed: {successful}/{len(recipients)} successful")
        
        return results
    
    def get_metrics_summary(self) -> Dict[str, Any]:
        """
        Get summary of all transfer metrics.
        
        Returns:
            Dictionary containing metrics summary
            
        Example:
            >>> summary = transfer.get_metrics_summary()
            >>> print(f"Average complexity: {summary['avg_complexity_score']}")
        """
        return self.metrics_collector.get_summary()
    
    def export_metrics(self, filepath: str):
        """
        Export metrics to a JSON file.
        
        Args:
            filepath: Path to output file
            
        Example:
            >>> transfer.export_metrics("transfer_metrics.json")
        """
        self.metrics_collector.export_metrics(filepath)
