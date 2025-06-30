import * as React from 'react';

import { PlexViewProps } from './Plex.types';

export default function PlexView(props: PlexViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
