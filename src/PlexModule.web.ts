import { registerWebModule, NativeModule } from "expo"

import { PlexModuleEvents } from "./Plex.types"

class PlexModule extends NativeModule<PlexModuleEvents> {}

export default registerWebModule(PlexModule, "PlexModule")
