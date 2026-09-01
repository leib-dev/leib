// =====================================================
// LiveViewerScreen.js - LEIB
// Le spectateur paie l'accès au live (sauf s'il en est
// l'hôte), se connecte à la salle LiveKit et regarde le
// flux en direct, et peut envoyer des dons (60% admin /
// 40% créateur).
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
import { accederLive, envoyerDon } from '../services/liveService';
import { Room, RoomEvent, Track } from '../livekit/livekitRoom';
import LiveVideoView from '../components/live/LiveVideoView';

const MONTANTS_DON_RAPIDES = [100, 500, 1000, 5000];

export default function LiveViewerScreen({ route }) {
  const { live } = route.params;
  const { user, profile, refreshProfile } = useAuth();

  const estHote = user?.$id === live.createurId;
  const [accesPaye, setAccesPaye] = useState(false);
  const [paiementEnCours, setPaiementEnCours] = useState(false);
  const [montantDon, setMontantDon] = useState('');
  const [donEnCours, setDonEnCours] = useState(false);
  const [pisteDistante, setPisteDistante] = useState(null);
  const roomRef = useRef(null);

  useEffect(() => {
    return () => {
      roomRef.current?.disconnect();
    };
  }, []);

  async function connecterSalle() {
    const { token, serverUrl } = await accederLive({
      userId: user.$id,
      pseudo: profile.pseudo,
      liveId: live.$id,
      createurId: live.createurId,
      nomSalle: live.nomSalle,
    });

    const room = new Room();

    room.on(RoomEvent.TrackSubscribed, (track) => {
      if (track.kind === Track.Kind.Video) {
        setPisteDistante(track);
      }
    });

    await room.connect(serverUrl, token);
    roomRef.current = room;
    setAccesPaye(true);
  }

  async function handlePayerAcces() {
    setPaiementEnCours(true);
    try {
      await connecterSalle();
      await refreshProfile();
    } catch (error) {
      Alert.alert('Connexion échouée', error.message || 'Réessaie dans un instant.');
    } finally {
      setPaiementEnCours(false);
    }
  }

  // L'hôte n'a rien à payer : connexion automatique dès l'arrivée sur l'écran
  useEffect(() => {
    if (estHote && !accesPaye) {
      connecterSalle().catch((error) =>
        Alert.alert('Connexion échouée', error.message || 'Réessaie dans un instant.')
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estHote]);

  async function handleEnvoyerDon(montant) {
    setDonEnCours(true);
    try {
      await envoyerDon({ userId: user.$id, pseudo: profile.pseudo, liveId: live.$id, createurId: live.createurId, montant });
      Alert.alert('Don envoyé 🎉', `Merci pour ton don de ${montant} F !`);
      setMontantDon('');
      await refreshProfile();
    } catch (error) {
      Alert.alert('Don échoué', error.message || 'Réessaie dans un instant.');
    } finally {
      setDonEnCours(false);
    }
  }

  // --- Paywall : accès non payé et pas l'hôte ---
  if (!accesPaye) {
    return (
      <View style={styles.paywall}>
        <Text style={styles.paywallTitre}>{live.titre}</Text>
        <Text style={styles.paywallPseudo}>@{live.createurPseudo}</Text>
        <Text style={styles.paywallTexte}>
          Accède à ce live pour {TARIFS.ACCES_LIVE.montant} F
        </Text>
        <TouchableOpacity
          style={[styles.boutonAcces, GOLD_BUTTON_SHADOW]}
          onPress={handlePayerAcces}
          disabled={paiementEnCours}
        >
          {paiementEnCours ? (
            <ActivityIndicator color={COLORS.noirFond} />
          ) : (
            <Text style={styles.boutonAccesTexte}>
              Rejoindre — {TARIFS.ACCES_LIVE.montant} F
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  // --- Live en cours de lecture ---
  return (
    <View style={styles.container}>
      <LiveVideoView track={pisteDistante} style={styles.video} />

      <View style={styles.entete}>
        <View style={styles.badgeDirect}>
          <Text style={styles.badgeDirectTexte}>● DIRECT</Text>
        </View>
        <Text style={styles.pseudo}>@{live.createurPseudo}</Text>
      </View>

      {/* Zone de dons */}
      <View style={styles.zoneDons}>
        <Text style={styles.zoneDonsTitre}>Envoyer un don 🎁</Text>
        <View style={styles.montantsRapides}>
          {MONTANTS_DON_RAPIDES.map((montant) => (
            <TouchableOpacity
              key={montant}
              style={styles.boutonMontantRapide}
              onPress={() => handleEnvoyerDon(montant)}
              disabled={donEnCours}
            >
              <Text style={styles.boutonMontantRapideTexte}>{montant} F</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.ligneDonLibre}>
          <TextInput
            style={styles.inputDon}
            placeholder="Montant libre"
            placeholderTextColor={COLORS.grisTexte}
            keyboardType="numeric"
            value={montantDon}
            onChangeText={setMontantDon}
          />
          <TouchableOpacity
            style={[styles.boutonEnvoyerDon, GOLD_BUTTON_SHADOW]}
            onPress={() => handleEnvoyerDon(parseInt(montantDon, 10))}
            disabled={donEnCours || !montantDon}
          >
            {donEnCours ? (
              <ActivityIndicator color={COLORS.noirFond} size="small" />
            ) : (
              <Text style={styles.boutonEnvoyerDonTexte}>Envoyer</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.noirFond,
  },
  video: {
    width: '100%',
    height: '60%',
  },
  entete: {
    position: 'absolute',
    top: 48,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeDirect: {
    backgroundColor: COLORS.rougeErreur,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 8,
  },
  badgeDirectTexte: {
    color: COLORS.blancTexte,
    fontSize: 10,
    fontWeight: 'bold',
  },
  pseudo: {
    color: COLORS.blancTexte,
    fontWeight: 'bold',
  },
  zoneDons: {
    flex: 1,
    padding: 20,
  },
  zoneDonsTitre: {
    color: COLORS.blancTexte,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  montantsRapides: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  boutonMontantRapide: {
    borderWidth: 1,
    borderColor: COLORS.orFonce,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    marginBottom: 10,
  },
  boutonMontantRapideTexte: {
    color: COLORS.orPrincipal,
    fontWeight: 'bold',
  },
  ligneDonLibre: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputDon: {
    flex: 1,
    backgroundColor: '#151B2E',
    color: COLORS.blancTexte,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.orFonce,
    marginRight: 10,
  },
  boutonEnvoyerDon: {
    backgroundColor: COLORS.orPrincipal,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  boutonEnvoyerDonTexte: {
    color: COLORS.noirFond,
    fontWeight: 'bold',
  },
  paywall: {
    flex: 1,
    backgroundColor: COLORS.bleuNuit,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  paywallTitre: {
    color: COLORS.blancTexte,
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  paywallPseudo: {
    color: COLORS.orFonce,
    marginTop: 4,
    marginBottom: 20,
  },
  paywallTexte: {
    color: COLORS.grisTexte,
    marginBottom: 24,
    textAlign: 'center',
  },
  boutonAcces: {
    backgroundColor: COLORS.orPrincipal,
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  boutonAccesTexte: {
    color: COLORS.noirFond,
    fontWeight: 'bold',
    fontSize: 15,
  },
});
