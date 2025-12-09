"""
Event Logger Module
===================

This module provides functionality to listen to blockchain events (e.g., transfer events)
and log changes, highlighting modularity and reusability.
"""

import asyncio
import logging
from typing import Optional, Callable, Dict, Any, List
from web3 import Web3
from web3.contract import Contract
from web3.types import FilterParams, LogReceipt
from datetime import datetime
import json

from .decorators import validate_address, ValidationError
from .metrics import MetricsCollector


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class EventLogger:
    """
    Class to listen to and log blockchain events.
    
    Provides modular, reusable functionality for monitoring smart contract events
    such as transfers, approvals, and custom events.
    
    Attributes:
        w3: Web3 instance for blockchain interaction
        contract: Optional Contract instance for specific contract monitoring
        metrics_collector: MetricsCollector for tracking event processing
        event_handlers: Dictionary of event name to handler function mappings
    """
    
    def __init__(
        self,
        provider_url: str,
        contract_address: Optional[str] = None,
        contract_abi: Optional[List[Dict]] = None
    ):
        """
        Initialize the EventLogger instance.
        
        Args:
            provider_url: Web3 provider URL
            contract_address: Optional smart contract address to monitor
            contract_abi: Optional contract ABI for event parsing
            
        Example:
            >>> logger = EventLogger(
            ...     "https://mainnet.infura.io/v3/YOUR_KEY",
            ...     contract_address="0x123...",
            ...     contract_abi=TOKEN_ABI
            ... )
        """
        self.w3 = Web3(Web3.HTTPProvider(provider_url))
        self.metrics_collector = MetricsCollector()
        self.event_handlers: Dict[str, List[Callable]] = {}
        self.contract: Optional[Contract] = None
        
        if not self.w3.is_connected():
            raise ConnectionError(f"Failed to connect to provider: {provider_url}")
        
        if contract_address and contract_abi:
            self.contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(contract_address),
                abi=contract_abi
            )
            logger.info(f"Monitoring contract at {contract_address}")
        
        logger.info(f"EventLogger initialized, connected to chain ID: {self.w3.eth.chain_id}")
    
    def register_handler(self, event_name: str, handler: Callable):
        """
        Register a handler function for a specific event.
        
        Args:
            event_name: Name of the event to handle (e.g., "Transfer", "Approval")
            handler: Callback function to process the event
            
        Example:
            >>> def on_transfer(event):
            ...     print(f"Transfer: {event['args']['from']} -> {event['args']['to']}")
            >>> logger.register_handler("Transfer", on_transfer)
        """
        if event_name not in self.event_handlers:
            self.event_handlers[event_name] = []
        
        self.event_handlers[event_name].append(handler)
        logger.info(f"Registered handler for event: {event_name}")
    
    def unregister_handler(self, event_name: str, handler: Callable):
        """
        Unregister a specific handler for an event.
        
        Args:
            event_name: Name of the event
            handler: Handler function to remove
        """
        if event_name in self.event_handlers:
            try:
                self.event_handlers[event_name].remove(handler)
                logger.info(f"Unregistered handler for event: {event_name}")
            except ValueError:
                logger.warning(f"Handler not found for event: {event_name}")
    
    def _process_event(self, event: LogReceipt, event_name: str):
        """
        Process an event by calling all registered handlers.
        
        Args:
            event: Event log receipt
            event_name: Name of the event
        """
        if event_name in self.event_handlers:
            for handler in self.event_handlers[event_name]:
                try:
                    handler(event)
                except Exception as e:
                    logger.error(f"Error in handler for {event_name}: {e}")
    
    def log_transfer_event(self, event: Dict[str, Any]):
        """
        Default handler for Transfer events.
        
        Args:
            event: Transfer event data
            
        Example:
            This is typically called automatically when a Transfer event is detected.
        """
        args = event.get('args', {})
        from_addr = args.get('from', 'unknown')
        to_addr = args.get('to', 'unknown')
        value = args.get('value', 0)
        
        # Convert value from Wei to Ether if applicable
        if value > 0:
            value_eth = self.w3.from_wei(value, 'ether')
            logger.info(
                f"Transfer Event - From: {from_addr} -> To: {to_addr}, "
                f"Amount: {value_eth} ETH, "
                f"Block: {event.get('blockNumber', 'unknown')}, "
                f"TxHash: {event.get('transactionHash', 'unknown').hex() if isinstance(event.get('transactionHash'), bytes) else event.get('transactionHash', 'unknown')}"
            )
    
    def log_approval_event(self, event: Dict[str, Any]):
        """
        Default handler for Approval events.
        
        Args:
            event: Approval event data
        """
        args = event.get('args', {})
        owner = args.get('owner', 'unknown')
        spender = args.get('spender', 'unknown')
        value = args.get('value', 0)
        
        logger.info(
            f"Approval Event - Owner: {owner}, Spender: {spender}, "
            f"Amount: {self.w3.from_wei(value, 'ether')} ETH, "
            f"Block: {event.get('blockNumber', 'unknown')}"
        )
    
    @validate_address
    def watch_address_transfers(
        self,
        address: str,
        from_block: int = 0,
        to_block: str = 'latest'
    ) -> List[Dict[str, Any]]:
        """
        Watch for all Transfer events involving a specific address.
        
        Args:
            address: Ethereum address to monitor
            from_block: Starting block number (default: 0)
            to_block: Ending block number (default: 'latest')
            
        Returns:
            List of transfer events
            
        Example:
            >>> events = logger.watch_address_transfers("0x123...", from_block=18000000)
            >>> print(f"Found {len(events)} transfers")
        """
        task_id = f"watch_transfers_{address[:10]}"
        self.metrics_collector.start_task(
            task_id,
            "Watch Address Transfers",
            {"address": address, "from_block": from_block, "to_block": to_block}
        )
        
        try:
            if not self.contract:
                raise ValueError("Contract instance required for watching transfers")
            
            # Get Transfer events
            transfer_filter = self.contract.events.Transfer.create_filter(
                fromBlock=from_block,
                toBlock=to_block,
                argument_filters={'from': address}
            )
            
            from_events = transfer_filter.get_all_entries()
            
            # Get Transfer events where address is recipient
            transfer_filter_to = self.contract.events.Transfer.create_filter(
                fromBlock=from_block,
                toBlock=to_block,
                argument_filters={'to': address}
            )
            
            to_events = transfer_filter_to.get_all_entries()
            
            # Combine and deduplicate
            all_events = list({event['transactionHash']: event for event in (from_events + to_events)}.values())
            
            # Process events
            for event in all_events:
                self._process_event(event, 'Transfer')
            
            self.metrics_collector.update_task(
                task_id,
                network_requests=2,
                data_size=len(str(all_events))
            )
            
            logger.info(f"Found {len(all_events)} transfer events for {address}")
            
            return [dict(e) for e in all_events]
            
        except Exception as e:
            logger.error(f"Error watching transfers for {address}: {e}")
            raise
        finally:
            self.metrics_collector.end_task(task_id)
    
    async def listen_to_events_async(
        self,
        event_name: str,
        from_block: int = 0,
        poll_interval: int = 2,
        duration: Optional[int] = None
    ):
        """
        Asynchronously listen to specific events in real-time.
        
        Args:
            event_name: Name of the event to listen for
            from_block: Starting block number
            poll_interval: How often to check for new events (seconds)
            duration: Optional duration to listen (seconds, None = indefinite)
            
        Example:
            >>> await logger.listen_to_events_async("Transfer", poll_interval=5)
        """
        if not self.contract:
            raise ValueError("Contract instance required for listening to events")
        
        task_id = f"listen_{event_name}_{int(asyncio.get_event_loop().time())}"
        self.metrics_collector.start_task(
            task_id,
            f"Listen to {event_name} Events",
            {"event_name": event_name, "from_block": from_block}
        )
        
        try:
            event = getattr(self.contract.events, event_name)
            event_filter = event.create_filter(fromBlock=from_block)
            
            logger.info(f"Started listening to {event_name} events from block {from_block}")
            
            start_time = asyncio.get_event_loop().time()
            event_count = 0
            
            while True:
                # Check if duration exceeded
                if duration and (asyncio.get_event_loop().time() - start_time) > duration:
                    logger.info(f"Listening duration exceeded, stopping")
                    break
                
                # Get new events
                new_events = event_filter.get_new_entries()
                
                if new_events:
                    event_count += len(new_events)
                    logger.info(f"Received {len(new_events)} new {event_name} events")
                    
                    for evt in new_events:
                        self._process_event(evt, event_name)
                    
                    self.metrics_collector.update_task(
                        task_id,
                        network_requests=1,
                        data_size=len(str(new_events))
                    )
                
                # Wait before next poll
                await asyncio.sleep(poll_interval)
            
            logger.info(f"Processed {event_count} total {event_name} events")
            
        except Exception as e:
            logger.error(f"Error listening to {event_name} events: {e}")
            raise
        finally:
            self.metrics_collector.end_task(task_id)
    
    def get_past_events(
        self,
        event_name: str,
        from_block: int = 0,
        to_block: str = 'latest',
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieve past events from the blockchain.
        
        Args:
            event_name: Name of the event to retrieve
            from_block: Starting block number
            to_block: Ending block number
            filters: Optional filters for event arguments
            
        Returns:
            List of past events
            
        Example:
            >>> events = logger.get_past_events(
            ...     "Transfer",
            ...     from_block=18000000,
            ...     filters={"from": "0x123..."}
            ... )
        """
        if not self.contract:
            raise ValueError("Contract instance required for getting past events")
        
        task_id = f"get_past_{event_name}_{int(asyncio.get_event_loop().time() * 1000) if asyncio.get_event_loop else 0}"
        self.metrics_collector.start_task(
            task_id,
            f"Get Past {event_name} Events",
            {"event_name": event_name, "from_block": from_block, "to_block": to_block}
        )
        
        try:
            event = getattr(self.contract.events, event_name)
            
            # Create filter
            event_filter = event.create_filter(
                fromBlock=from_block,
                toBlock=to_block,
                argument_filters=filters or {}
            )
            
            # Get all events
            events = event_filter.get_all_entries()
            
            # Process events
            for evt in events:
                self._process_event(evt, event_name)
            
            self.metrics_collector.update_task(
                task_id,
                network_requests=1,
                data_size=len(str(events))
            )
            
            logger.info(f"Retrieved {len(events)} past {event_name} events")
            
            return [dict(e) for e in events]
            
        except Exception as e:
            logger.error(f"Error getting past {event_name} events: {e}")
            raise
        finally:
            self.metrics_collector.end_task(task_id)
    
    def export_events_to_json(self, events: List[Dict[str, Any]], filepath: str):
        """
        Export events to a JSON file.
        
        Args:
            events: List of event dictionaries
            filepath: Path to output file
            
        Example:
            >>> events = logger.get_past_events("Transfer")
            >>> logger.export_events_to_json(events, "transfer_events.json")
        """
        # Convert non-serializable objects
        serializable_events = []
        for event in events:
            serializable_event = {}
            for key, value in event.items():
                if isinstance(value, bytes):
                    serializable_event[key] = value.hex()
                elif hasattr(value, '__dict__'):
                    serializable_event[key] = str(value)
                else:
                    serializable_event[key] = value
            serializable_events.append(serializable_event)
        
        data = {
            "generated_at": datetime.now().isoformat(),
            "event_count": len(serializable_events),
            "events": serializable_events
        }
        
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        
        logger.info(f"Exported {len(serializable_events)} events to {filepath}")
    
    def get_metrics_summary(self) -> Dict[str, Any]:
        """
        Get summary of event processing metrics.
        
        Returns:
            Dictionary containing metrics summary
        """
        return self.metrics_collector.get_summary()


# Standard ERC20 ABI for Transfer and Approval events
ERC20_TRANSFER_APPROVAL_ABI = [
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "name": "from", "type": "address"},
            {"indexed": True, "name": "to", "type": "address"},
            {"indexed": False, "name": "value", "type": "uint256"}
        ],
        "name": "Transfer",
        "type": "event"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "name": "owner", "type": "address"},
            {"indexed": True, "name": "spender", "type": "address"},
            {"indexed": False, "name": "value", "type": "uint256"}
        ],
        "name": "Approval",
        "type": "event"
    }
]
