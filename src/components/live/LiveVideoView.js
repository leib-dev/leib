// =====================================================
// LiveVideoView.js - LEIB (version MOBILE)
// Affiche une VideoTrack LiveKit (locale ou distante) via
// le composant natif fourni par @livekit/react-native.
// =====================================================

import React from 'react';
import { StyleSheet } from 'react-native';
import { VideoTrack } from '@livekit/react-native';

export default function LiveVideoView({ track, style }) {
  if (!track) return null;
  return <VideoTrack trackRef={track} style={[styles.video, style]} objectFit="cover" />;
}

const styles = StyleSheet.create({
  video: {
    width: '100%',
    height: '100%',
  },
});
