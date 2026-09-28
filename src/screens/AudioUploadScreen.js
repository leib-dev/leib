// ==========================================
// AudioUploadScreen.js - LEIB
// Miroir de UploadScreen.js mais pour un fichier audio.
// Mêmes tarifs que la vidéo (TARIFS.UPLOAD_VIDEO).
// ==========================================

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { COLORS, GOLD_BUTTON_SHADOW } from '../config/colors';
import { TARIFS } from '../config/monetization';
import { useAuth } from '../context/AuthContext';
import { publierAudio } from '../services/audioService';

const ETAPES_LIBELLES = {
  paiement: 'Paiement en cours...',
  upload_audio: "Envoi de l'audio...",
  upload_miniature: 'Envoi de la couverture...',
  enregistrement: 'Publication en cours...',
  termine: 'Terminé !',
};

export default function AudioUploadScreen({ navigation }) {
  const { user, profile, refreshProfile, isAdmin } = useAuth();
  const [audioUri, setAudioUri] = useState(null);
  const [miniatureUri, setMiniatureUri] = useState(null);
  const [legende, setLegende] = useState('');
  const [publication, setPublication] = useState(false);
  const [etapeActuelle, setEtapeActuelle] = useState(null);

  async function choisirAudio() {
    const resultat = await DocumentPicker.getDocumentAsync({
      type: 'audio/*',
      copyToCacheDirectory: true,
    });
    if (resultat.assets && resultat.assets.length > 0) {
      setAudioUri(resultat.assets[0].uri);
    }
  }

  async function choisirMiniature() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const resultat = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      aspect: [1, 1],
      allowsEditing: true,
    });
    if (!resultat.canceled) {
      setMiniatureUri(resultat.assets[0].uri);
    }
  }

  async function handlePublier() {
    if (!audioUri) {
      Alert.alert('Audio manquant', "Choisis d'abord un fichier audio à publier.");
      return;
    }
    setPublication(true);
    try {
      await publierAudio({
        userId: user.$id,
        pseudo: profile.pseudo,
        audioUri,
        legende,
        miniatureUri,
        onProgress: setEtapeActuelle,
      });
      await refreshProfile();
      Alert.alert('Audio publié !', 'Ton audio est maintenant visible dans le feed LEIB.');
      setAudioUri(null);
      setMiniatureUri(null);
      setLegende('');
      navigation.navigate('Feed');
    } catch (error) {
      Alert.alert('Publication échouée', error.message || 'Réessaie dans un instant.');
    } finally {
      setPublication(false);
      setEtapeActuelle(null);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contenu}>
      <Text style={styles.titre}>Publier un audio</Text>
      <Text style={styles.sousTitre}>
        {isAdmin ? 'Publication gratuite (compte admin)' : `Frais de publication : ${TARIFS.UPLOAD_VIDEO.montant} F`}
      </Text>

      <TouchableOpacity style={styles.zoneAudio} onPress={choisirAudio}>
        {audioUri ? (
          <Text style={styles.audioChoisi}>🎵 Audio sélectionné</Text>
        ) : (
          <Text style={styles.zoneTexte}>+ Choisir un fichier audio</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.zoneMiniature} onPress={choisirMiniature}>
        {miniatureUri ? (
          <Image source={{ uri: miniatureUri }} style={styles.miniaturePreview} />
        ) : (
          <Text style={styles.zoneTexte}>+ Couverture (optionnel)</Text>
        )}
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Écris une légende..."
        placeholderTextColor={COLORS.grisTexte}
        multiline
        value={legende}
        onChangeText={setLegende}
      />

      <TouchableOpacity
        style={[styles.boutonPublier, GOLD_BUTTON_SHADOW]}
        onPress={handlePublier}
        disabled={publication}
      >
        {publication ? (
          <View style={styles.chargementContainer}>
            <ActivityIndicator color={COLORS.noirFond} />
            <Text style={styles.chargementTexte}>
              {ETAPES_LIBELLES[etapeActuelle] || 'Préparation...'}
            </Text>
          </View>
        ) : (
          <Text style={styles.boutonPublierTexte}>
            {isAdmin ? 'Publier gratuitement' : `Publier — ${TARIFS.UPLOAD_VIDEO.montant} F`}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bleuNuit },
  contenu: { padding: 20, paddingTop: 60, paddingBottom: 60 },
  titre: { color: COLORS.blancTexte, fontSize: 22, fontWeight: 'bold' },
  sousTitre: { color: COLORS.orPrincipal, marginTop: 4, marginBottom: 24 },
  zoneAudio: {
    height: 100, borderRadius: 14, borderWidth: 1, borderColor: COLORS.orFonce,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  zoneMiniature: {
    height: 100, borderRadius: 14, borderWidth: 1, borderColor: COLORS.orFonce,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: 16, overflow: 'hidden',
  },
  miniaturePreview: { width: '100%', height: '100%' },
  zoneTexte: { color: COLORS.orFonce, fontSize: 15 },
  audioChoisi: { color: COLORS.vertSucces, fontSize: 15 },
  input: {
    backgroundColor: '#151B2E', color: COLORS.blancTexte, borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 12, minHeight: 80, textAlignVertical: 'top',
    borderWidth: 1, borderColor: COLORS.orFonce, marginBottom: 24,
  },
  boutonPublier: { backgroundColor: COLORS.orPrincipal, borderRadius: 10, paddingVertical: 16, alignItems: 'center' },
  boutonPublierTexte: { color: COLORS.noirFond, fontWeight: 'bold', fontSize: 16 },
  chargementContainer: { flexDirection: 'row', alignItems: 'center' },
  chargementTexte: { color: COLORS.noirFond, fontWeight: 'bold', marginLeft: 10 },
});
