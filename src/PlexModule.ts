import { NativeModule, requireNativeModule } from "expo"
import {
  PlexModuleEvents,
  PaymentContext,
  UpdateInfo,
  StartUpdateResult,
  CheckUpdateOptions,
  StartUpdateOptions,
} from "./Plex.types"

declare class PlexModule extends NativeModule<PlexModuleEvents> {
  getPaymentContext(): Promise<PaymentContext>
  checkForUpdate(options?: CheckUpdateOptions): Promise<UpdateInfo>
  startUpdate(options?: StartUpdateOptions): Promise<StartUpdateResult>
}

export default requireNativeModule<PlexModule>("Plex")
