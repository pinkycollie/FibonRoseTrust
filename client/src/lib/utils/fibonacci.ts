/**
 * Fibonacci-based trust scoring utilities
 * This implements a non-linear growth model for trust scores based on the Fibonacci sequence
 */

// Generate Fibonacci sequence up to a maximum value
export function generateFibonacciSequence(maxValue: number): number[] {
  const sequence: number[] = [1, 1];
  let next = 2;
  
  while (next <= maxValue) {
    sequence.push(next);
    next = sequence[sequence.length - 1] + sequence[sequence.length - 2];
  }
  
  return sequence;
}

// Get the Fibonacci level based on a user's trust score
export function getTrustLevel(score: number): number {
  const fibonacci = generateFibonacciSequence(1000); // Large enough for our levels
  let level = 0;
  
  for (let i = 0; i < fibonacci.length; i++) {
    if (score >= fibonacci[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  
  return level;
}

// Calculate points needed for next level
export function getPointsForNextLevel(currentScore: number): number {
  const fibonacci = generateFibonacciSequence(1000);
  let nextThreshold = 0;
  
  for (let i = 0; i < fibonacci.length; i++) {
    if (fibonacci[i] > currentScore) {
      nextThreshold = fibonacci[i];
      break;
    }
  }
  
  return nextThreshold > 0 ? nextThreshold - currentScore : 0;
}

// Calculate progress percentage to next level
export function getProgressToNextLevel(currentScore: number): number {
  const fibonacci = generateFibonacciSequence(1000);
  let currentThreshold = 0;
  let nextThreshold = 0;
  
  // Find the current and next thresholds
  for (let i = 0; i < fibonacci.length; i++) {
    if (fibonacci[i] > currentScore) {
      currentThreshold = i > 0 ? fibonacci[i - 1] : 0;
      nextThreshold = fibonacci[i];
      break;
    }
  }
  
  // If we're at the max level
  if (nextThreshold === 0) return 100;
  
  // Calculate progress percentage
  const rangeSize = nextThreshold - currentThreshold;
  const progressInRange = currentScore - currentThreshold;
  
  return Math.floor((progressInRange / rangeSize) * 100);
}

// Get visual description for trust level
export function getTrustLevelDescription(level: number): string {
  const descriptions: Record<number, string> = {
    1: 'Sprout',
    2: 'Seedling',
    3: 'Sapling',
    4: 'Young Tree',
    5: 'Mature Tree',
    6: 'Ancient Tree',
    7: 'Forest Guardian',
    8: 'Forest Elder',
    9: 'Divine Forest',
    10: 'Eternal Forest',
  };
  
  return descriptions[level] || 'Unknown';
}

// Calculate trust score from verification data
export function calculateTrustScore(
  verificationCount: number,
  positiveTransactions: number,
  totalTransactions: number,
  age: number // Account age in days
): number {
  // Base score from verifications (each verification has exponentially increasing value)
  const verificationScore = verificationCount > 0 
    ? Math.pow(verificationCount, 1.5) 
    : 0;
  
  // Transaction reputation (0-1 scale)
  const transactionRatio = totalTransactions > 0 
    ? positiveTransactions / totalTransactions 
    : 0;
  
  // Account age factor (logarithmic growth, caps at ~2 for 1 year old accounts)
  const ageFactor = age > 0 
    ? 1 + (Math.log10(age) / 2) 
    : 1;
  
  // Combined score with weighting
  const score = (verificationScore * 0.6 + transactionRatio * 5 * 0.4) * ageFactor;
  
  // Round to nearest integer
  return Math.round(score);
}