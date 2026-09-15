import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS, GOLD_BUTTON_SHADOW } from '../config/colors';
import { useAuth } from '../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { changerPhotoProfil } from '../services/authService';
import { useState } from 'react';

export default function ProfileScreen() {
  const { user, profile, logout } = useAuth();
  const [photoEnCours, setPhotoEnCours] = useState(false);

  async function changerPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const resultat = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (resultat.canceled) return;
    setPhotoEnCours(true);
    try {
      await changerPhotoProfil(user.$id, resultat.assets[0].uri);
    } catch (error) {
      console.warn('[Profile] Erreur photo:', error.message);
    } finally {
      setPhotoEnCours(false);
    }
  }
  async function handleLogout() {
    await logout();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
    <TouchableOpacity onPress={changerPhoto} disabled={photoEnCours}>
      <View style={styles.avatarCercle}>
        <Text style={styles.avatarInitiale}>
          {profile?.pseudo?.charAt(0)?.toUpperCase() || '?'}
        </Text>
      </View>
      </TouchableOpacity>
      <Text style={styles.pseudo}>{profile?.pseudo || 'Utilisateur'}</Text>
      <Text style={styles.role}>{profile?.role || 'viewer'}</Text>
      <View style={styles.carteInfos}>
        <View style={styles.ligneInfo}>
          <Text style={styles.libelle}>Email</Text>
          <Text style={styles.valeur}>{profile?.email || user?.email || '-'}</Text>
        </View>
        <View style={styles.separateur} />
        <View style={styles.ligneInfo}>
          <Text style={styles.libelle}>Telephone</Text>
          <Text style={styles.valeur}>{profile?.telephone || 'Non renseigne'}</Text>
        </View>
        <View style={styles.separateur} />
        <View style={styles.ligneInfo}>
          <Text style={styles.libelle}>Numero Mobile Money</Text>
          <Text style={styles.valeur}>{profile?.numeroMomo || 'Non renseigne'}</Text>
        </View>
        <View style={styles.separateur} />
        <View style={styles.ligneInfo}>
          <Text style={styles.libelle}>Solde LEIB Pay</Text>
          <Text style={styles.valeur}>{profile?.soldeLeibPay ?? 0} F</Text>
        </View>
      </View>
      <TouchableOpacity style={[styles.boutonDeconnexion, GOLD_BUTTON_SHADOW]} onPress={handleLogout}>
        <Text style={styles.texteDeconnexion}>Se deconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bleuNuit },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40, alignItems: 'center' },
  avatarCercle: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.orFonce, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  avatarInitiale: { color: COLORS.noirFond, fontSize: 32, fontWeight: 'bold' },
  pseudo: { color: COLORS.blancTexte, fontSize: 20, fontWeight: 'bold' },
  role: { color: COLORS.grisTexte, fontSize: 14, marginBottom: 24, textTransform: 'capitalize' },
  carteInfos: { width: '100%', backgroundColor: '#151B2E', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.orFonce, marginBottom: 24 },
  ligneInfo: { paddingVertical: 10 },
  libelle: { color: COLORS.grisTexte, fontSize: 13, marginBottom: 4 },
  valeur: { color: COLORS.blancTexte, fontSize: 15, fontWeight: '500' },
  separateur: { height: 1, backgroundColor: COLORS.orFonce, opacity: 0.3 },
  boutonDeconnexion: { backgroundColor: COLORS.orPrincipal, borderRadius: 24, paddingHorizontal: 32, paddingVertical: 12, alignItems: 'center', width: '100%' },
  texteDeconnexion: { color: COLORS.noirFond, fontWeight: 'bold', fontSize: 15 },
});
