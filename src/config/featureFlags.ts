/**
 * Feature flags configuration
 * Controls availability of features based on environment variables
 */

export const featureFlags = {
  /**
   * Commercial facility renovation mode
   * Only available in development environment
   * Set via VITE_ENABLE_COMMERCIAL_MODE in .env files
   */
  enableCommercialMode: import.meta.env.VITE_ENABLE_COMMERCIAL_MODE === 'true',
} as const;

/**
 * Check if a feature is enabled
 * @param feature - Feature name to check
 * @returns true if feature is enabled, false otherwise
 */
export function isFeatureEnabled(feature: keyof typeof featureFlags): boolean {
  return featureFlags[feature];
}
