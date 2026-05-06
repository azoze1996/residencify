import { useEffect, useState } from 'react'

const FINGERPRINT_STORAGE_KEY = 'device_fingerprint_v1'

/**
 * Generate a device fingerprint based on browser and system characteristics
 * This creates a unique identifier for the device/browser combination
 */
function generateFingerprint(): string {
  const components: string[] = []

  // Browser info - use stable properties
  components.push(navigator.userAgent)
  components.push(navigator.language)
  components.push(navigator.platform)

  // Screen info - these are stable for a device
  components.push(`${screen.width}x${screen.height}`)
  components.push(`${screen.colorDepth}`)

  // Timezone - stable for a device location
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone)

  // Hardware concurrency (CPU cores) - stable
  if (navigator.hardwareConcurrency) {
    components.push(`cores:${navigator.hardwareConcurrency}`)
  }

  // Device memory (if available) - stable
  if ('deviceMemory' in navigator) {
    components.push(
      `mem:${(navigator as Navigator & { deviceMemory?: number }).deviceMemory}`,
    )
  }

  // Touch support - stable
  components.push(`touch:${navigator.maxTouchPoints}`)

  // Create a hash from the components
  const fingerprint = components.join('|')
  return hashString(fingerprint)
}

/**
 * Simple hash function for creating a fingerprint string
 */
function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  // Convert to hex and ensure positive
  return Math.abs(hash).toString(16).padStart(8, '0')
}

/**
 * Get or create a persistent device fingerprint
 * Uses localStorage to maintain consistency across sessions
 */
function getOrCreateFingerprint(): string {
  // Try to get existing fingerprint from localStorage
  try {
    const stored = localStorage.getItem(FINGERPRINT_STORAGE_KEY)
    if (stored && stored.length >= 8) {
      return stored
    }
  } catch {
    // localStorage might not be available
  }

  // Generate new fingerprint
  const newFingerprint = generateFingerprint()

  // Try to store it for future sessions
  try {
    localStorage.setItem(FINGERPRINT_STORAGE_KEY, newFingerprint)
  } catch {
    // localStorage might not be available
  }

  return newFingerprint
}

/**
 * Hook to get and manage device fingerprint
 */
export function useDeviceFingerprint() {
  const [fingerprint, setFingerprint] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Generate fingerprint on client side only
    const fp = getOrCreateFingerprint()
    setFingerprint(fp)
    setIsLoading(false)
  }, [])

  return { fingerprint, isLoading }
}

/**
 * Get device fingerprint synchronously (for use outside React)
 */
export function getDeviceFingerprint(): string {
  if (typeof window === 'undefined') {
    return 'server'
  }
  return getOrCreateFingerprint()
}
