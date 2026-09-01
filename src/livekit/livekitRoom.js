// =====================================================
// livekitRoom.js - LEIB (version MOBILE)
// Expo/Metro charge automatiquement ce fichier sur Android/iOS,
// et livekitRoom.web.js dans le navigateur. Même API (Room),
// implémentation WebRTC différente selon la plateforme.
// =====================================================

import { registerGlobals } from '@livekit/react-native-webrtc';
import { Room, RoomEvent, Track } from '@livekit/react-native';

// Indispensable une seule fois pour brancher les APIs WebRTC natives
// avant toute utilisation de Room sur mobile.
registerGlobals();

export { Room, RoomEvent, Track };
