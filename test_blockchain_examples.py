#!/usr/bin/env python3
"""
Test Suite for Blockchain Examples Module
=========================================

This test suite validates the functionality of the blockchain interaction
examples module, including decorators, metrics, and utilities.

Note: These are unit tests that don't require actual blockchain connectivity.
"""

import sys
import unittest
from unittest.mock import Mock, patch, MagicMock
import time

# Add current directory to path for imports
sys.path.insert(0, '/home/runner/work/FibonRoseTrust/FibonRoseTrust')

from blockchain_examples import (
    validate_address,
    validate_amount,
    validate_gas_params,
    ValidationError,
    MetricsCollector,
    TaskMetrics,
    ComplexityLevel,
)


class TestValidationDecorators(unittest.TestCase):
    """Test suite for validation decorators"""
    
    def test_validate_address_valid(self):
        """Test that valid Ethereum addresses pass validation"""
        @validate_address
        def test_func(address):
            return address
        
        valid_address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
        result = test_func(address=valid_address)
        # Should return checksummed address
        self.assertTrue(result.startswith("0x"))
    
    def test_validate_address_invalid(self):
        """Test that invalid Ethereum addresses raise ValidationError"""
        @validate_address
        def test_func(address):
            return address
        
        with self.assertRaises(ValidationError):
            test_func(address="invalid_address")
    
    def test_validate_amount_valid(self):
        """Test that valid amounts pass validation"""
        @validate_amount(min_amount=0.001, max_amount=10.0)
        def test_func(amount):
            return amount
        
        result = test_func(amount=1.5)
        self.assertEqual(result, 1.5)
    
    def test_validate_amount_too_low(self):
        """Test that amounts below minimum raise ValidationError"""
        @validate_amount(min_amount=0.001, max_amount=10.0)
        def test_func(amount):
            return amount
        
        with self.assertRaises(ValidationError):
            test_func(amount=0.0001)
    
    def test_validate_amount_too_high(self):
        """Test that amounts above maximum raise ValidationError"""
        @validate_amount(min_amount=0.001, max_amount=10.0)
        def test_func(amount):
            return amount
        
        with self.assertRaises(ValidationError):
            test_func(amount=15.0)
    
    def test_validate_gas_params_valid(self):
        """Test that valid gas parameters pass validation"""
        @validate_gas_params(max_gas=500000, max_gas_price_gwei=100)
        def test_func(gas, gas_price):
            return gas, gas_price
        
        result = test_func(gas=100000, gas_price=50)
        self.assertEqual(result, (100000, 50))
    
    def test_validate_gas_params_gas_too_high(self):
        """Test that excessive gas limits raise ValidationError"""
        @validate_gas_params(max_gas=500000, max_gas_price_gwei=100)
        def test_func(gas):
            return gas
        
        with self.assertRaises(ValidationError):
            test_func(gas=600000)
    
    def test_validate_gas_params_gas_too_low(self):
        """Test that gas limits below minimum raise ValidationError"""
        @validate_gas_params()
        def test_func(gas):
            return gas
        
        with self.assertRaises(ValidationError):
            test_func(gas=10000)  # Below 21000 minimum


class TestMetricsCollector(unittest.TestCase):
    """Test suite for MetricsCollector"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.collector = MetricsCollector()
    
    def test_start_task(self):
        """Test starting a task creates TaskMetrics"""
        metrics = self.collector.start_task("task_001", "Test Task")
        
        self.assertEqual(metrics.task_id, "task_001")
        self.assertEqual(metrics.task_name, "Test Task")
        self.assertIsNotNone(metrics.start_time)
        self.assertIsNone(metrics.end_time)
    
    def test_end_task(self):
        """Test ending a task completes metrics"""
        self.collector.start_task("task_001", "Test Task")
        time.sleep(0.1)  # Simulate some work
        
        metrics = self.collector.end_task("task_001")
        
        self.assertIsNotNone(metrics.end_time)
        self.assertIsNotNone(metrics.execution_time)
        self.assertGreater(metrics.execution_time, 0)
        self.assertIsNotNone(metrics.complexity_score)
        self.assertIsNotNone(metrics.complexity_level)
    
    def test_update_task(self):
        """Test updating task metrics"""
        self.collector.start_task("task_001", "Test Task")
        
        self.collector.update_task(
            "task_001",
            gas_used=21000,
            transaction_count=1,
            network_requests=3
        )
        
        metrics = self.collector.active_tasks["task_001"]
        self.assertEqual(metrics.gas_used, 21000)
        self.assertEqual(metrics.transaction_count, 1)
        self.assertEqual(metrics.network_requests, 3)
    
    def test_complexity_score_calculation(self):
        """Test complexity score calculation"""
        self.collector.start_task("task_001", "Test Task")
        
        self.collector.update_task(
            "task_001",
            gas_used=100000,
            transaction_count=5,
            contract_calls=10,
            network_requests=15
        )
        
        time.sleep(0.1)
        metrics = self.collector.end_task("task_001")
        
        # Should have a complexity score
        self.assertIsNotNone(metrics.complexity_score)
        self.assertGreater(metrics.complexity_score, 0)
        self.assertLessEqual(metrics.complexity_score, 100)
    
    def test_complexity_level_categorization(self):
        """Test complexity level categorization"""
        # Test SIMPLE level
        simple_level = self.collector.categorize_complexity(10)
        self.assertEqual(simple_level, ComplexityLevel.SIMPLE)
        
        # Test MODERATE level
        moderate_level = self.collector.categorize_complexity(30)
        self.assertEqual(moderate_level, ComplexityLevel.MODERATE)
        
        # Test COMPLEX level
        complex_level = self.collector.categorize_complexity(50)
        self.assertEqual(complex_level, ComplexityLevel.COMPLEX)
        
        # Test VERY_COMPLEX level
        very_complex_level = self.collector.categorize_complexity(70)
        self.assertEqual(very_complex_level, ComplexityLevel.VERY_COMPLEX)
        
        # Test EXTREME level
        extreme_level = self.collector.categorize_complexity(90)
        self.assertEqual(extreme_level, ComplexityLevel.EXTREME)
    
    def test_get_summary(self):
        """Test getting metrics summary"""
        # Create and complete a few tasks
        for i in range(3):
            self.collector.start_task(f"task_{i}", f"Test Task {i}")
            self.collector.update_task(f"task_{i}", gas_used=21000, transaction_count=1)
            time.sleep(0.05)
            self.collector.end_task(f"task_{i}")
        
        summary = self.collector.get_summary()
        
        self.assertEqual(summary["total_tasks"], 3)
        self.assertGreater(summary["avg_complexity_score"], 0)
        self.assertGreater(summary["avg_execution_time"], 0)
        self.assertEqual(summary["total_gas_used"], 63000)
        self.assertIn("complexity_distribution", summary)
    
    def test_task_not_found_error(self):
        """Test that ending non-existent task raises KeyError"""
        with self.assertRaises(KeyError):
            self.collector.end_task("nonexistent_task")


class TestTaskMetrics(unittest.TestCase):
    """Test suite for TaskMetrics dataclass"""
    
    def test_task_metrics_creation(self):
        """Test creating TaskMetrics instance"""
        metrics = TaskMetrics(
            task_id="test_001",
            task_name="Test Task"
        )
        
        self.assertEqual(metrics.task_id, "test_001")
        self.assertEqual(metrics.task_name, "Test Task")
        self.assertIsNotNone(metrics.start_time)
        self.assertEqual(metrics.gas_used, 0)
        self.assertEqual(metrics.transaction_count, 0)
    
    def test_task_metrics_complete(self):
        """Test completing a task"""
        metrics = TaskMetrics(
            task_id="test_001",
            task_name="Test Task"
        )
        
        time.sleep(0.1)
        metrics.complete()
        
        self.assertIsNotNone(metrics.end_time)
        self.assertIsNotNone(metrics.execution_time)
        self.assertGreater(metrics.execution_time, 0)
    
    def test_task_metrics_to_dict(self):
        """Test converting TaskMetrics to dictionary"""
        metrics = TaskMetrics(
            task_id="test_001",
            task_name="Test Task"
        )
        metrics.complexity_level = ComplexityLevel.SIMPLE
        
        data = metrics.to_dict()
        
        self.assertIsInstance(data, dict)
        self.assertEqual(data["task_id"], "test_001")
        self.assertEqual(data["task_name"], "Test Task")
        self.assertEqual(data["complexity_level"], "SIMPLE")
    
    def test_task_metrics_to_json(self):
        """Test converting TaskMetrics to JSON"""
        metrics = TaskMetrics(
            task_id="test_001",
            task_name="Test Task"
        )
        
        json_str = metrics.to_json()
        
        self.assertIsInstance(json_str, str)
        self.assertIn("test_001", json_str)
        self.assertIn("Test Task", json_str)


def run_tests():
    """Run all tests and return success status"""
    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add all test classes
    suite.addTests(loader.loadTestsFromTestCase(TestValidationDecorators))
    suite.addTests(loader.loadTestsFromTestCase(TestMetricsCollector))
    suite.addTests(loader.loadTestsFromTestCase(TestTaskMetrics))
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Print summary
    print("\n" + "=" * 70)
    print("Test Results Summary:")
    print(f"Tests run: {result.testsRun}")
    print(f"Successes: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print("=" * 70)
    
    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
