import type { StyleProp, ViewStyle } from "react-native"

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

export type OnLoadEventPayload = {
  url: string
}

export type PlexViewProps = {
  url: string
  onLoad: (event: { nativeEvent: OnLoadEventPayload }) => void
  style?: StyleProp<ViewStyle>
}
