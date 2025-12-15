/**
 * ID Generation Utilities
 * Provides secure ID generation using crypto.randomUUID()
 */

import { randomUUID } from 'crypto';

/**
 * Generate a secure unique ID with an optional prefix
 * @param prefix Optional prefix for the ID
 * @returns A unique ID string
 */
export function generateSecureId(prefix?: string): string {
  const uuid = randomUUID();
  return prefix ? `${prefix}_${uuid}` : uuid;
}

/**
 * Generate a secure timestamped ID with an optional prefix
 * Useful for IDs that need to be sortable by creation time
 * @param prefix Optional prefix for the ID
 * @returns A unique timestamped ID string
 */
export function generateTimestampedId(prefix?: string): string {
  const timestamp = Date.now();
  const uuid = randomUUID().split('-')[0]; // Use first segment of UUID for shorter IDs
  return prefix ? `${prefix}_${timestamp}_${uuid}` : `${timestamp}_${uuid}`;
}
