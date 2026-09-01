// =====================================================
// LiveVideoView.web.js - LEIB (version WEB)
// Sur navigateur, on attache directement la MediaStreamTrack
// LiveKit à une balise <video> HTML5 native via une ref.
// =====================================================

import React, { useEffect, useRef } from 'react';

export default function LiveVideoView({ track, style }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (track && videoRef.current) {
      track.attach(videoRef.current);
    }
    return () => {
      if (track) track.detach();
    };
  }, [track]);

  if (!track) return null;

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      style={{ width: '100%', height: '100%', objectFit: 'cover', ...style }}
    />
  );
}
