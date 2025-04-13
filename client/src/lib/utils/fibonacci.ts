/**
 * Calculate the Fibonacci number at a given position
 * @param n Position in the Fibonacci sequence (1-indexed)
 * @returns The Fibonacci number at position n
 */
export function fibonacci(n: number): number {
  if (n <= 0) return 0;
  if (n === 1) return 1;
  if (n === 2) return 1;
  
  let a = 1;
  let b = 1;
  let temp;
  
  for (let i = 3; i <= n; i++) {
    temp = a + b;
    a = b;
    b = temp;
  }
  
  return b;
}

/**
 * Calculate which Fibonacci level a verification count corresponds to
 * @param verificationCount Number of completed verifications
 * @returns The Fibonacci level (position in sequence)
 */
export function calculateFibonacciLevel(verificationCount: number): number {
  if (verificationCount <= 0) return 0;
  
  // Find the highest Fibonacci level where fibonacci(level) <= verificationCount
  let level = 1;
  while (fibonacci(level + 1) <= verificationCount) {
    level++;
  }
  
  return level;
}

/**
 * Calculate the trust score based on verification count
 * @param verificationCount Number of completed verifications
 * @returns The trust score
 */
export function calculateFibonacciScore(verificationCount: number): number {
  if (verificationCount <= 0) return 0;
  
  // The score is the Fibonacci number at the current level
  const level = calculateFibonacciLevel(verificationCount);
  return fibonacci(level);
}

/**
 * Calculate the next Fibonacci score threshold
 * @param currentLevel Current Fibonacci level
 * @returns The next Fibonacci number in the sequence
 */
export function getNextScoreThreshold(currentLevel: number): number {
  return fibonacci(currentLevel + 1);
}

/**
 * Calculate how many more verifications needed to reach next level
 * @param verificationCount Current number of verifications
 * @returns Number of additional verifications needed
 */
export function verificationsToNextLevel(verificationCount: number): number {
  if (verificationCount <= 0) return 1;
  
  const currentLevel = calculateFibonacciLevel(verificationCount);
  const nextThreshold = fibonacci(currentLevel + 1);
  
  return nextThreshold - verificationCount;
}
