import { NativeModule, requireNativeModule } from "expo"
import { PlexModuleEvents, PaymentContext } from "./Plex.types"

declare class PlexModule extends NativeModule<PlexModuleEvents> {
  getPaymentContext(): Promise<PaymentContext>
}

export default requireNativeModule<PlexModule>("Plex")
