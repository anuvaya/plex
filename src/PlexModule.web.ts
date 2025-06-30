import { registerWebModule, NativeModule } from 'expo';

import { PlexModuleEvents } from './Plex.types';

class PlexModule extends NativeModule<PlexModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
}

export default registerWebModule(PlexModule, 'PlexModule');
