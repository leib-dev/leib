// =====================================================
// VideoCard.js - LEIB
// Lit la vidéo pendant DUREE_PREVIEW_GRATUITE secondes,
// puis met en pause et affiche un overlay doré demandant
// le paiement de 100F pour débloquer la suite.
// =====================================================

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import { COLORS, GOLD_BUTTON_SHADOW } from '../config/colors';
import { TARIFS, DUREE_PREVIEW_GRATUITE } from '../config/monetization';
import { debloquerVideo } from '../services/paymentService';
import { demarrerAppel } from '../services/callService';
import { useAuth } from '../context/AuthContext';

export default function VideoCard({ video }) {
  const { user, profile, refreshProfile, isAdmin } = useAuth();
  const navigation = useNavigation();
  const videoRef = useRef(null);
  const [appelEnCours, setAppelEnCours] = useState(false);

  // La vidéo est déjà débloquée si le spectateur en est le créateur,
  // ou si une entrée de déblocage existe déjà (à affiner en brique suivante
  // avec une vraie vérification côté base ; ici on gère l'état local de session)
  const [debloquee, setDebloquee] = useState(video.createurId === user?.$id);
  const [previewTerminee, setPreviewTerminee] = useState(false);
  const [paiementEnCours, setPaiementEnCours] = useState(false);

  // Dès que la preview de 3s est passée, on met la vidéo en pause
  // et on affiche l'overlay de paiement (sauf si déjà débloquée)
  useEffect(() => {
    if (!debloquee) {
      const timer = setTimeout(() => {
        setPreviewTerminee(true);
        videoRef.current?.pauseAsync();
      }, DUREE_PREVIEW_GRATUITE * 1000);

      return () => clearTimeout(timer);
    }
  }, [debloquee]);

  async function handleDebloquer() {
    if (!user) {
      Alert.alert('Connexion requise', 'Connecte-toi pour débloquer cette vidéo.');
      return;
    }

    setPaiementEnCours(true);
    try {
      await debloquerVideo({
        userId: user.$id,
        videoId: video.$id,
        createurId: video.createurId,
        tarif: TARIFS.DEBLOQUER_VIDEO,
      });

      setDebloquee(true);
      setPreviewTerminee(false);
      await refreshProfile(); // met à jour le solde affiché ailleurs dans l'app
      videoRef.current?.playAsync();
    } catch (error) {
      Alert.alert('Paiement échoué', error.message || 'Réessaie dans un instant.');
    } finally {
      setPaiementEnCours(false);
    }
  }

  async function handleAppeler(type) {
    if (!user) {
      Alert.alert('Connexion requise', 'Connecte-toi pour appeler.');
      return;
    }
    if (video.createurId === user.$id) return; // on ne s'appelle pas soi-même

    const lancerAppel = async () => {
      setAppelEnCours(true);
      try {
        const { appel, token, serverUrl } = await demarrerAppel({
          callerId: user.$id,
          callerPseudo: profile.pseudo,
          calleeId: video.createurId,
          type,
        });

        navigation.getParent()?.navigate('Call', {
          appelId: appel.$id,
          nomSalle: appel.nomSalle,
          token,
          serverUrl,
          type,
          autrePersonnePseudo: video.createurPseudo,
        });
      } catch (error) {
        Alert.alert('Appel impossible', error.message || 'Réessaie dans un instant.');
      } finally {
        setAppelEnCours(false);
      }
    };

    if (isAdmin) {
      lancerAppel();
      return;
    }

    Alert.alert(
      `Appel ${type === 'video' ? 'vidéo' : 'audio'}`,
      `Cet appel coûte ${TARIFS.APPEL.montant} F. Confirmer ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', onPress: lancerAppel },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={{ uri: video.urlLecture }}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping={debloquee}
        useNativeControls={debloquee}
      />

      {/* Infos créateur en bas de la vidéo */}
      <View style={styles.infosCreateur}>
        <Text style={styles.pseudo}>@{video.createurPseudo}</Text>
        <Text style={styles.legende} numberOfLines={2}>{video.legende}</Text>
      </View>

      {/* Boutons d'appel audio/vidéo vers le créateur */}
      {user && video.createurId !== user.$id && (
        <View style={styles.boutonsAppel}>
          <TouchableOpacity
            style={styles.boutonAppelIcone}
            onPress={() => handleAppeler('audio')}
            disabled={appelEnCours}
          >
            <Text style={styles.boutonAppelTexte}>📞</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.boutonAppelIcone}
            onPress={() => handleAppeler('video')}
            disabled={appelEnCours}
          >
            <Text style={styles.boutonAppelTexte}>🎥</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Overlay de paiement, affiché uniquement après les 3s gratuites */}
      {previewTerminee && !debloquee && (
        <View style={styles.overlay}>
          <Text style={styles.overlayTitre}>Contenu verrouillé 🔒</Text>
          <Text style={styles.overlayTexte}>
            Débloque cette vidéo pour {TARIFS.DEBLOQUER_VIDEO.montant} F
          </Text>
          <TouchableOpacity
            style={[styles.boutonDebloquer, GOLD_BUTTON_SHADOW]}
            onPress={handleDebloquer}
            disabled={paiementEnCours}
          >
            {paiementEnCours ? (
              <ActivityIndicator color={COLORS.noirFond} />
            ) : (
              <Text style={styles.boutonTexte}>
                Débloquer — {TARIFS.DEBLOQUER_VIDEO.montant} F
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.noirFond,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  infosCreateur: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 80,
  },
  pseudo: {
    color: COLORS.blancTexte,
    fontWeight: 'bold',
    fontSize: 16,
  },
  legende: {
    color: COLORS.blancTexte,
    fontSize: 13,
    marginTop: 4,
  },
  boutonsAppel: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    gap: 16,
  },
  boutonAppelIcone: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.orFonce,
  },
  boutonAppelTexte: {
    fontSize: 22,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlaySombre,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  overlayTitre: {
    color: COLORS.orPrincipal,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  overlayTexte: {
    color: COLORS.blancTexte,
    fontSize: 15,
    marginBottom: 24,
    textAlign: 'center',
  },
  boutonDebloquer: {
    backgroundColor: COLORS.orPrincipal,
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  boutonTexte: {
    color: COLORS.noirFond,
    fontWeight: 'bold',
    fontSize: 15,
  },
});
