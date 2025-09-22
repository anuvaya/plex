import { registerWebModule, NativeModule } from "expo"

import {
  PlexModuleEvents,
  PaymentContext,
  UpdateInfo,
  StartUpdateResult,
  CheckUpdateOptions,
  StartUpdateOptions,
} from "./Plex.types"

class PlexModule extends NativeModule<PlexModuleEvents> {
  async getPaymentContext(): Promise<PaymentContext> {
    return {
      installedApps: [],
      totalAppsChecked: 0,
      detectionMethod: "url_scheme",
    }
  }

  async checkForUpdate(_options?: CheckUpdateOptions): Promise<UpdateInfo> {
    // Web: no native store; always not available
    return {
      platform: "ios", // treat as non-android to avoid android-specific paths
      isAvailable: false,
      recommendedType: "none",
      localVersion: "0.0.0",
    }
  }

  async startUpdate(_options?: StartUpdateOptions): Promise<StartUpdateResult> {
    return { started: false }
  }
}

export default registerWebModule(PlexModule, "PlexModule")
