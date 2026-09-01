// =====================================================
// StartLiveScreen.js - LEIB
// Paie les frais de lancement (10 000F) puis connecte
// directement l'hôte à sa salle LiveKit et publie sa
// caméra + micro. Fonctionne aussi bien sur mobile
// (Android/iOS) que dans un navigateur.
// =====================================================

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { COLORS, GOLD_BUTTON_SHADOW } from '../config/colors';
import { TARIFS } from '../config/monetization';
import { useAuth } from '../context/AuthContext';
import { demarrerLive, arreterLive } from '../services/liveService';
import { Room } from '../livekit/livekitRoom';
import LiveVideoView from '../components/live/LiveVideoView';

export default function StartLiveScreen({ navigation }) {
  const { user, profile, refreshProfile } = useAuth();
  const [titre, setTitre] = useState('');
  const [demarrage, setDemarrage] = useState(false);
  const [liveActif, setLiveActif] = useState(null);
  const [pisteLocale, setPisteLocale] = useState(null);
  const roomRef = useRef(null);

  useEffect(() => {
    // Se déconnecte proprement de la salle LiveKit si l'écran est quitté
    return () => {
      roomRef.current?.disconnect();
    };
  }, []);

  async function handleDemarrer() {
    setDemarrage(true);
    try {
      const { live, token, serverUrl } = await demarrerLive({
        userId: user.$id,
        pseudo: profile.pseudo,
        titre,
      });

      // Connexion à la salle LiveKit + publication caméra/micro
      const room = new Room();
      await room.connect(serverUrl, token);
      await room.localParticipant.setCameraEnabled(true);
      await room.localParticipant.setMicrophoneEnabled(true);

      roomRef.current = room;
      setLiveActif(live);
      setPisteLocale(room.localParticipant.videoTrackPublications?.values().next().value?.track);
      await refreshProfile();
    } catch (error) {
      Alert.alert('Démarrage échoué', error.message || 'Réessaie dans un instant.');
    } finally {
      setDemarrage(false);
    }
  }

  async function handleTerminer() {
    try {
      await roomRef.current?.disconnect();
      await arreterLive(liveActif.$id);
      navigation.navigate('LiveListe');
    } catch (error) {
      Alert.alert('Erreur', error.message || 'Impossible de terminer le live proprement.');
    }
  }

  // --- Étape 2 : live en cours, aperçu caméra + bouton stop ---
  if (liveActif) {
    return (
      <View style={styles.containerLive}>
        <View style={styles.zoneVideo}>
          <LiveVideoView track={pisteLocale} />
          <View style={styles.badgeDirect}>
            <Text style={styles.badgeDirectTexte}>● EN DIRECT</Text>
          </View>
        </View>

        <View style={styles.pied}>
          <Text style={styles.titrePied}>{liveActif.titre}</Text>
          <TouchableOpacity style={styles.boutonTerminer} onPress={handleTerminer}>
            <Text style={styles.boutonTerminerTexte}>Terminer le live</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- Étape 1 : formulaire de démarrage ---
  return (
    <View style={styles.container}>
      <Text style={styles.titre}>Démarrer un live</Text>
      <Text style={styles.sousTitre}>
        Frais de lancement : {TARIFS.LANCER_LIVE.montant} F
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Titre de ton live"
        placeholderTextColor={COLORS.grisTexte}
        value={titre}
        onChangeText={setTitre}
      />

      <TouchableOpacity
        style={[styles.boutonDemarrer, GOLD_BUTTON_SHADOW]}
        onPress={handleDemarrer}
        disabled={demarrage}
      >
        {demarrage ? (
          <ActivityIndicator color={COLORS.noirFond} />
        ) : (
          <Text style={styles.boutonDemarrerTexte}>
            Lancer le live — {TARIFS.LANCER_LIVE.montant} F
          </Text>
        )}
      </TouchableOpacity>

      <Text style={styles.note}>
        L'accès à ta caméra et ton micro te sera demandé au démarrage.
        Fonctionne directement depuis l'app ou un navigateur, sans logiciel externe.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bleuNuit,
    padding: 20,
    paddingTop: 60,
  },
  containerLive: {
    flex: 1,
    backgroundColor: COLORS.noirFond,
  },
  zoneVideo: {
    flex: 1,
  },
  badgeDirect: {
    position: 'absolute',
    top: 48,
    left: 16,
    backgroundColor: COLORS.rougeErreur,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeDirectTexte: {
    color: COLORS.blancTexte,
    fontSize: 11,
    fontWeight: 'bold',
  },
  pied: {
    padding: 20,
    backgroundColor: COLORS.bleuNuit,
  },
  titrePied: {
    color: COLORS.blancTexte,
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 12,
  },
  boutonTerminer: {
    backgroundColor: COLORS.rougeErreur,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  boutonTerminerTexte: {
    color: COLORS.blancTexte,
    fontWeight: 'bold',
  },
  titre: {
    color: COLORS.blancTexte,
    fontSize: 22,
    fontWeight: 'bold',
  },
  sousTitre: {
    color: COLORS.orPrincipal,
    marginTop: 4,
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#151B2E',
    color: COLORS.blancTexte,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.orFonce,
    marginBottom: 24,
  },
  boutonDemarrer: {
    backgroundColor: COLORS.orPrincipal,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  boutonDemarrerTexte: {
    color: COLORS.noirFond,
    fontWeight: 'bold',
    fontSize: 16,
  },
  note: {
    color: COLORS.grisTexte,
    fontSize: 13,
    marginTop: 20,
    lineHeight: 20,
    textAlign: 'center',
  },
});
