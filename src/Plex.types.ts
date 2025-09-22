export interface PaymentApp {
  scheme: string
  name: string
  isInstalled: boolean
  packageName?: string
}

export interface PaymentContext {
  installedApps: PaymentApp[]
  totalAppsChecked: number
  detectionMethod: "url_scheme" | "package_manager"
}

export type PlexModuleEvents = {}

// Minimal updates API types
export type UpdateRecommendedType = "immediate" | "flexible" | "store" | "none"

export interface UpdateInfo {
  platform: "android" | "ios"
  isAvailable: boolean
  recommendedType: UpdateRecommendedType
  localVersion: string
  remoteVersion?: string | number
  storeUrl?: string
}

export interface StartUpdateResult {
  started: boolean
}

// Optional options for testing/configuration
export interface CheckUpdateOptions {
  // iOS only: override identifiers used for App Store lookup
  appStoreId?: string
  bundleId?: string
  countryCode?: string // e.g., 'us', 'in'
}

export interface StartUpdateOptions {
  // Android only: preferred update type (will only be used if allowed)
  type?: "immediate" | "flexible"
  // iOS only: override identifiers used for App Store open
  appStoreId?: string
  bundleId?: string
  countryCode?: string
}
