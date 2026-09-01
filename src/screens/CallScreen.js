// =====================================================
// CallScreen.js - LEIB
// Écran d'appel en cours (audio ou vidéo), 1-à-1, via
// LiveKit. Fonctionne aussi bien sur mobile que sur web
// grâce aux fichiers plateforme déjà en place (live/).
// =====================================================

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../config/colors';
import { Room, RoomEvent, Track } from '../livekit/livekitRoom';
import { terminerAppel } from '../services/callService';
import LiveVideoView from '../components/live/LiveVideoView';

export default function CallScreen({ route, navigation }) {
  const { appelId, nomSalle, token, serverUrl, type, autrePersonnePseudo } = route.params;

  const [pisteDistante, setPisteDistante] = useState(null);
  const [pisteLocale, setPisteLocale] = useState(null);
  const [micActif, setMicActif] = useState(true);
  const [dureeSecondes, setDureeSecondes] = useState(0);
  const roomRef = useRef(null);
  const estAppelVideo = type === 'video';

  useEffect(() => {
    let minuteur;
    let annule = false;

    async function connecter() {
      const room = new Room();

      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === Track.Kind.Video) setPisteDistante(track);
      });

      await room.connect(serverUrl, token);
      if (annule) return room.disconnect();

      if (estAppelVideo) {
        await room.localParticipant.setCameraEnabled(true);
        setPisteLocale(
          room.localParticipant.videoTrackPublications?.values().next().value?.track
        );
      }
      await room.localParticipant.setMicrophoneEnabled(true);

      roomRef.current = room;
      minuteur = setInterval(() => setDureeSecondes((s) => s + 1), 1000);
    }

    connecter();

    return () => {
      annule = true;
      clearInterval(minuteur);
      roomRef.current?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRaccrocher() {
    await terminerAppel(appelId);
    roomRef.current?.disconnect();
    navigation.goBack();
  }

  function handleToggleMic() {
    const nouvelEtat = !micActif;
    roomRef.current?.localParticipant.setMicrophoneEnabled(nouvelEtat);
    setMicActif(nouvelEtat);
  }

  function formatDuree(s) {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  return (
    <View style={styles.container}>
      {estAppelVideo ? (
        <>
          <LiveVideoView track={pisteDistante} style={styles.videoDistante} />
          <View style={styles.videoLocaleContainer}>
            <LiveVideoView track={pisteLocale} style={styles.videoLocale} />
          </View>
        </>
      ) : (
        <View style={styles.centreAudio}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarLettre}>{autrePersonnePseudo?.[0]?.toUpperCase()}</Text>
          </View>
          <Text style={styles.pseudoAudio}>{autrePersonnePseudo}</Text>
        </View>
      )}

      <View style={styles.enTete}>
        <Text style={styles.pseudo}>{autrePersonnePseudo}</Text>
        <Text style={styles.duree}>{formatDuree(dureeSecondes)}</Text>
      </View>

      <View style={styles.controles}>
        <TouchableOpacity
          style={[styles.boutonRond, !micActif && styles.boutonRondActif]}
          onPress={handleToggleMic}
        >
          <Text style={styles.boutonIcone}>{micActif ? '🎤' : '🔇'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.boutonRaccrocher} onPress={handleRaccrocher}>
          <Text style={styles.boutonIcone}>📞</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.noirFond,
  },
  videoDistante: {
    width: '100%',
    height: '100%',
  },
  videoLocaleContainer: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 100,
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.orPrincipal,
  },
  videoLocale: {
    width: '100%',
    height: '100%',
  },
  centreAudio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: COLORS.orFonce,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarLettre: {
    fontSize: 44,
    fontWeight: 'bold',
    color: COLORS.noirFond,
  },
  pseudoAudio: {
    color: COLORS.blancTexte,
    fontSize: 20,
    fontWeight: 'bold',
  },
  enTete: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pseudo: {
    color: COLORS.blancTexte,
    fontSize: 16,
    fontWeight: 'bold',
  },
  duree: {
    color: COLORS.orPrincipal,
    fontSize: 13,
    marginTop: 4,
  },
  controles: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  boutonRond: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#232B45',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
  },
  boutonRondActif: {
    backgroundColor: COLORS.orFonce,
  },
  boutonRaccrocher: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.rougeErreur,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
    transform: [{ rotate: '135deg' }],
  },
  boutonIcone: {
    fontSize: 26,
  },
});
