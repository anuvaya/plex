import { requireNativeView } from 'expo';
import * as React from 'react';

import { PlexViewProps } from './Plex.types';

const NativeView: React.ComponentType<PlexViewProps> =
  requireNativeView('Plex');

export default function PlexView(props: PlexViewProps) {
  return <NativeView {...props} />;
}
