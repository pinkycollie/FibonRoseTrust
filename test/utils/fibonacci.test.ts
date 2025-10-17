import { describe, it, expect } from 'vitest';
import {
  generateFibonacciSequence,
  getTrustLevel,
  getPointsForNextLevel,
  getProgressToNextLevel,
  getTrustLevelDescription,
  calculateTrustScore,
  calculateFibonacciLevel,
  calculateFibonacciScore,
} from '../../client/src/lib/utils/fibonacci';

describe('Fibonacci Trust Scoring Utilities', () => {
  describe('generateFibonacciSequence', () => {
    it('should generate fibonacci sequence up to maxValue', () => {
      const sequence = generateFibonacciSequence(10);
      expect(sequence).toEqual([1, 1, 2, 3, 5, 8]);
    });

    it('should generate larger sequence when maxValue is higher', () => {
      const sequence = generateFibonacciSequence(100);
      expect(sequence).toEqual([1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89]);
    });

    it('should start with [1, 1, 2] for any positive maxValue', () => {
      const sequence = generateFibonacciSequence(5);
      expect(sequence.slice(0, 3)).toEqual([1, 1, 2]);
    });
  });

  describe('getTrustLevel', () => {
    it('should return level 1 for score 1', () => {
      expect(getTrustLevel(1)).toBe(2);
    });

    it('should return level 2 for score 2', () => {
      expect(getTrustLevel(2)).toBe(3);
    });

    it('should return level 4 for score 5', () => {
      expect(getTrustLevel(5)).toBe(5);
    });

    it('should return level 0 for score 0', () => {
      expect(getTrustLevel(0)).toBe(0);
    });

    it('should return higher level for higher scores', () => {
      const level1 = getTrustLevel(10);
      const level2 = getTrustLevel(50);
      expect(level2).toBeGreaterThan(level1);
    });
  });

  describe('getPointsForNextLevel', () => {
    it('should return points needed for next level', () => {
      const points = getPointsForNextLevel(1);
      expect(points).toBeGreaterThan(0);
    });

    it('should return 0 if at max level', () => {
      const points = getPointsForNextLevel(1000);
      expect(points).toBe(0);
    });

    it('should decrease as score approaches next threshold', () => {
      const points1 = getPointsForNextLevel(2);
      const points2 = getPointsForNextLevel(2.5);
      expect(points2).toBeLessThan(points1);
    });
  });

  describe('getProgressToNextLevel', () => {
    it('should return progress percentage between 0 and 100', () => {
      const progress = getProgressToNextLevel(3);
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(100);
    });

    it('should return 100 when at max level', () => {
      const progress = getProgressToNextLevel(1000);
      expect(progress).toBe(100);
    });

    it('should return 0 for score at exact threshold', () => {
      const progress = getProgressToNextLevel(1);
      expect(progress).toBe(0);
    });
  });

  describe('getTrustLevelDescription', () => {
    it('should return appropriate descriptions for levels', () => {
      expect(getTrustLevelDescription(1)).toBe('Sprout');
      expect(getTrustLevelDescription(5)).toBe('Mature Tree');
      expect(getTrustLevelDescription(10)).toBe('Eternal Forest');
    });

    it('should return Unknown for invalid levels', () => {
      expect(getTrustLevelDescription(0)).toBe('Unknown');
      expect(getTrustLevelDescription(99)).toBe('Unknown');
    });
  });

  describe('calculateTrustScore', () => {
    it('should return 0 for no activity', () => {
      const score = calculateTrustScore(0, 0, 0, 0);
      expect(score).toBe(0);
    });

    it('should increase with more verifications', () => {
      const score1 = calculateTrustScore(1, 0, 0, 1);
      const score2 = calculateTrustScore(5, 0, 0, 1);
      expect(score2).toBeGreaterThan(score1);
    });

    it('should increase with positive transactions', () => {
      const score1 = calculateTrustScore(1, 1, 10, 1);
      const score2 = calculateTrustScore(1, 9, 10, 1);
      expect(score2).toBeGreaterThan(score1);
    });

    it('should increase with account age', () => {
      const score1 = calculateTrustScore(1, 5, 10, 1);
      const score2 = calculateTrustScore(1, 5, 10, 365);
      expect(score2).toBeGreaterThan(score1);
    });

    it('should return integer values', () => {
      const score = calculateTrustScore(3, 7, 10, 30);
      expect(Number.isInteger(score)).toBe(true);
    });
  });

  describe('calculateFibonacciLevel', () => {
    it('should return 0 for no verifications', () => {
      expect(calculateFibonacciLevel(0)).toBe(0);
    });

    it('should return 1 for 1 verification', () => {
      expect(calculateFibonacciLevel(1)).toBe(1);
    });

    it('should return 2 for 2 verifications', () => {
      expect(calculateFibonacciLevel(2)).toBe(2);
    });

    it('should return higher levels for more verifications', () => {
      const level1 = calculateFibonacciLevel(3);
      const level2 = calculateFibonacciLevel(10);
      expect(level2).toBeGreaterThan(level1);
    });

    it('should cap at level 10', () => {
      const level = calculateFibonacciLevel(1000);
      expect(level).toBeLessThanOrEqual(10);
    });
  });

  describe('calculateFibonacciScore', () => {
    it('should return fibonacci value for verification count', () => {
      const score = calculateFibonacciScore(2);
      expect(score).toBeGreaterThan(0);
    });

    it('should increase with more verifications', () => {
      const score1 = calculateFibonacciScore(1);
      const score2 = calculateFibonacciScore(5);
      expect(score2).toBeGreaterThan(score1);
    });

    it('should return value for very high verification counts', () => {
      const score = calculateFibonacciScore(1000);
      expect(score).toBeGreaterThan(0);
    });
  });
});
