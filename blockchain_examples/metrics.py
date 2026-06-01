"""
Metrics Module for Blockchain Task Complexity
==============================================

This module provides functionality to measure and calculate the complexity
of blockchain tasks based on execution time, interaction volume, and other metrics.
"""

import time
import json
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field, asdict
from datetime import datetime
from enum import Enum


class ComplexityLevel(Enum):
    """Enumeration of complexity levels"""
    SIMPLE = 1
    MODERATE = 2
    COMPLEX = 3
    VERY_COMPLEX = 4
    EXTREME = 5


@dataclass
class TaskMetrics:
    """
    Data class to store metrics for a blockchain task.
    
    Attributes:
        task_id: Unique identifier for the task
        task_name: Human-readable name of the task
        start_time: Task start timestamp
        end_time: Task end timestamp
        execution_time: Total execution time in seconds
        gas_used: Gas consumed by the transaction
        transaction_count: Number of blockchain transactions
        contract_calls: Number of smart contract function calls
        data_size: Size of data processed (in bytes)
        network_requests: Number of network requests made
        complexity_score: Calculated complexity score
        complexity_level: Categorized complexity level
    """
    task_id: str
    task_name: str
    start_time: float = field(default_factory=time.time)
    end_time: Optional[float] = None
    execution_time: Optional[float] = None
    gas_used: int = 0
    transaction_count: int = 0
    contract_calls: int = 0
    data_size: int = 0
    network_requests: int = 0
    complexity_score: Optional[float] = None
    complexity_level: Optional[ComplexityLevel] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def complete(self):
        """Mark the task as complete and calculate execution time"""
        self.end_time = time.time()
        self.execution_time = self.end_time - self.start_time
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        data = asdict(self)
        if self.complexity_level:
            data['complexity_level'] = self.complexity_level.name
        return data
    
    def to_json(self) -> str:
        """Convert to JSON string"""
        return json.dumps(self.to_dict(), indent=2)


class MetricsCollector:
    """
    Collector for blockchain task metrics with complexity calculation.
    
    This class provides methods to track and analyze blockchain operations,
    calculating complexity based on multiple factors.
    """
    
    def __init__(self):
        """Initialize the metrics collector"""
        self.tasks: Dict[str, TaskMetrics] = {}
        self.active_tasks: Dict[str, TaskMetrics] = {}
        
    def start_task(self, task_id: str, task_name: str, metadata: Optional[Dict[str, Any]] = None) -> TaskMetrics:
        """
        Start tracking a new task.
        
        Args:
            task_id: Unique identifier for the task
            task_name: Human-readable name of the task
            metadata: Optional metadata dictionary
            
        Returns:
            TaskMetrics object for the started task
            
        Example:
            >>> collector = MetricsCollector()
            >>> metrics = collector.start_task("tx_001", "Balance Transfer")
        """
        metrics = TaskMetrics(
            task_id=task_id,
            task_name=task_name,
            metadata=metadata or {}
        )
        self.active_tasks[task_id] = metrics
        return metrics
    
    def end_task(self, task_id: str) -> TaskMetrics:
        """
        End tracking for a task and calculate its complexity.
        
        Args:
            task_id: Unique identifier for the task
            
        Returns:
            Completed TaskMetrics object
            
        Raises:
            KeyError: If task_id is not found in active tasks
            
        Example:
            >>> collector.end_task("tx_001")
        """
        if task_id not in self.active_tasks:
            raise KeyError(f"Task '{task_id}' not found in active tasks")
        
        metrics = self.active_tasks.pop(task_id)
        metrics.complete()
        
        # Calculate complexity
        metrics.complexity_score = self.calculate_complexity_score(metrics)
        metrics.complexity_level = self.categorize_complexity(metrics.complexity_score)
        
        self.tasks[task_id] = metrics
        return metrics
    
    def update_task(
        self,
        task_id: str,
        gas_used: Optional[int] = None,
        transaction_count: Optional[int] = None,
        contract_calls: Optional[int] = None,
        data_size: Optional[int] = None,
        network_requests: Optional[int] = None
    ):
        """
        Update metrics for an active task.
        
        Args:
            task_id: Unique identifier for the task
            gas_used: Gas consumed (incremental)
            transaction_count: Number of transactions (incremental)
            contract_calls: Number of contract calls (incremental)
            data_size: Data size in bytes (incremental)
            network_requests: Number of network requests (incremental)
            
        Example:
            >>> collector.update_task("tx_001", gas_used=21000, transaction_count=1)
        """
        if task_id not in self.active_tasks:
            raise KeyError(f"Task '{task_id}' not found in active tasks")
        
        metrics = self.active_tasks[task_id]
        
        if gas_used is not None:
            metrics.gas_used += gas_used
        if transaction_count is not None:
            metrics.transaction_count += transaction_count
        if contract_calls is not None:
            metrics.contract_calls += contract_calls
        if data_size is not None:
            metrics.data_size += data_size
        if network_requests is not None:
            metrics.network_requests += network_requests
    
    def calculate_complexity_score(self, metrics: TaskMetrics) -> float:
        """
        Calculate complexity score based on multiple factors.
        
        The complexity score is calculated using a weighted formula:
        - Execution time: 0.3 weight
        - Gas used: 0.25 weight
        - Transaction count: 0.2 weight
        - Contract calls: 0.15 weight
        - Network requests: 0.1 weight
        
        Args:
            metrics: TaskMetrics object
            
        Returns:
            Calculated complexity score (0-100)
            
        Example:
            >>> score = collector.calculate_complexity_score(metrics)
            >>> print(f"Complexity: {score:.2f}")
        """
        # Normalize individual metrics to 0-100 scale
        
        # Execution time: scale based on typical ranges
        # Simple: < 1s, Complex: > 10s
        time_score = min((metrics.execution_time or 0) / 10.0 * 100, 100)
        
        # Gas used: scale based on typical gas costs
        # Simple: < 50k, Complex: > 500k
        gas_score = min((metrics.gas_used / 500000.0) * 100, 100)
        
        # Transaction count: scale linearly
        # Simple: 1, Complex: 10+
        tx_score = min((metrics.transaction_count / 10.0) * 100, 100)
        
        # Contract calls: scale based on interaction volume
        # Simple: 1-2, Complex: 10+
        calls_score = min((metrics.contract_calls / 10.0) * 100, 100)
        
        # Network requests: scale based on API calls
        # Simple: 1-5, Complex: 20+
        network_score = min((metrics.network_requests / 20.0) * 100, 100)
        
        # Weighted average
        complexity = (
            time_score * 0.3 +
            gas_score * 0.25 +
            tx_score * 0.2 +
            calls_score * 0.15 +
            network_score * 0.1
        )
        
        return round(complexity, 2)
    
    def categorize_complexity(self, score: float) -> ComplexityLevel:
        """
        Categorize complexity score into levels.
        
        Args:
            score: Complexity score (0-100)
            
        Returns:
            ComplexityLevel enum value
            
        Example:
            >>> level = collector.categorize_complexity(45.5)
            >>> print(level.name)  # "MODERATE"
        """
        if score < 20:
            return ComplexityLevel.SIMPLE
        elif score < 40:
            return ComplexityLevel.MODERATE
        elif score < 60:
            return ComplexityLevel.COMPLEX
        elif score < 80:
            return ComplexityLevel.VERY_COMPLEX
        else:
            return ComplexityLevel.EXTREME
    
    def get_task_metrics(self, task_id: str) -> Optional[TaskMetrics]:
        """
        Retrieve metrics for a completed task.
        
        Args:
            task_id: Unique identifier for the task
            
        Returns:
            TaskMetrics object or None if not found
        """
        return self.tasks.get(task_id)
    
    def get_all_metrics(self) -> List[TaskMetrics]:
        """
        Retrieve all completed task metrics.
        
        Returns:
            List of all TaskMetrics objects
        """
        return list(self.tasks.values())
    
    def get_summary(self) -> Dict[str, Any]:
        """
        Get summary statistics for all completed tasks.
        
        Returns:
            Dictionary containing summary statistics
            
        Example:
            >>> summary = collector.get_summary()
            >>> print(f"Average complexity: {summary['avg_complexity_score']}")
        """
        if not self.tasks:
            return {
                "total_tasks": 0,
                "avg_complexity_score": 0,
                "avg_execution_time": 0,
                "total_gas_used": 0,
                "complexity_distribution": {}
            }
        
        total_score = sum(m.complexity_score or 0 for m in self.tasks.values())
        total_time = sum(m.execution_time or 0 for m in self.tasks.values())
        total_gas = sum(m.gas_used for m in self.tasks.values())
        
        # Count complexity levels
        complexity_dist = {}
        for level in ComplexityLevel:
            complexity_dist[level.name] = sum(
                1 for m in self.tasks.values() 
                if m.complexity_level == level
            )
        
        return {
            "total_tasks": len(self.tasks),
            "avg_complexity_score": round(total_score / len(self.tasks), 2),
            "avg_execution_time": round(total_time / len(self.tasks), 3),
            "total_gas_used": total_gas,
            "complexity_distribution": complexity_dist
        }
    
    def export_metrics(self, filepath: str):
        """
        Export all metrics to a JSON file.
        
        Args:
            filepath: Path to output JSON file
            
        Example:
            >>> collector.export_metrics("metrics_report.json")
        """
        data = {
            "generated_at": datetime.now().isoformat(),
            "summary": self.get_summary(),
            "tasks": [m.to_dict() for m in self.tasks.values()]
        }
        
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)


def measure_complexity(task_name: str, collector: Optional[MetricsCollector] = None):
    """
    Decorator to automatically measure task complexity.
    
    Args:
        task_name: Name of the task being measured
        collector: Optional MetricsCollector instance (creates new if None)
        
    Returns:
        Decorator function
        
    Example:
        >>> @measure_complexity("Balance Transfer")
        ... def transfer_balance(address, amount):
        ...     # Function implementation
        ...     pass
    """
    def decorator(func):
        nonlocal collector
        if collector is None:
            collector = MetricsCollector()
        
        def wrapper(*args, **kwargs):
            task_id = f"{task_name}_{int(time.time() * 1000)}"
            metrics = collector.start_task(task_id, task_name)
            
            try:
                result = func(*args, **kwargs)
                return result
            finally:
                collector.end_task(task_id)
                print(f"Task '{task_name}' completed:")
                print(f"  Complexity Score: {metrics.complexity_score}")
                print(f"  Complexity Level: {metrics.complexity_level.name}")
                print(f"  Execution Time: {metrics.execution_time:.3f}s")
        
        return wrapper
    return decorator
