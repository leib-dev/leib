// =====================================================
// LandingScreen.js - LEIB
// Page d'accueil affichée UNIQUEMENT sur le web (Platform.OS
// === 'web') pour les visiteurs non connectés. Sur mobile
// (APK), l'app va directement à l'écran de connexion —
// pas besoin de landing marketing dans une app déjà installée.
// =====================================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking } from 'react-native';
import { COLORS, GOLD_BUTTON_SHADOW } from '../config/colors';

const POINTS_FORTS = [
  { titre: 'Regarde', texte: 'Découvre des vidéos et lives exclusifs, en illimité ou à la carte.' },
  { titre: 'Gagne', texte: 'Les créateurs sont rémunérés à chaque vue débloquée, abonnement et don.' },
  { titre: 'Retire', texte: 'Retire tes gains directement via MTN, Orange Money ou virement bancaire.' },
];

// Remplace par le vrai lien de téléchargement une fois l'APK généré via EAS
const LIEN_APK = 'https://expo.dev/artifacts/leib-app';

export default function LandingScreen({ navigation }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contenu}>
      {/* --- Hero --- */}
      <View style={styles.hero}>
        <Text style={styles.logo}>LEIB</Text>
        <Text style={styles.slogan}>Regarde. Gagne. Devient LEIB.</Text>
        <Text style={styles.sousSlogan}>
          La plateforme de streaming vidéo et live qui récompense créateurs et spectateurs.
        </Text>

        <View style={styles.boutonsHero}>
          <TouchableOpacity
            style={[styles.boutonPrincipal, GOLD_BUTTON_SHADOW]}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.boutonPrincipalTexte}>Créer un compte</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.boutonSecondaire}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.boutonSecondaireTexte}>Se connecter</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => Linking.openURL(LIEN_APK)}>
          <Text style={styles.lienApk}>📱 Télécharger l'APK Android</Text>
        </TouchableOpacity>
      </View>

      {/* --- Points forts --- */}
      <View style={styles.section}>
        {POINTS_FORTS.map((point) => (
          <View key={point.titre} style={styles.carte}>
            <Text style={styles.carteTitre}>{point.titre}</Text>
            <Text style={styles.carteTexte}>{point.texte}</Text>
          </View>
        ))}
      </View>

      {/* --- Pied de page --- */}
      <View style={styles.pied}>
        <Text style={styles.piedTexte}>
          LEIB · Learn Enjoy Inspire Broadcast · STREAMING PLATFORM
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bleuNuit,
  },
  contenu: {
    paddingBottom: 60,
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 48,
  },
  logo: {
    fontSize: 56,
    fontWeight: 'bold',
    color: COLORS.orPrincipal,
    ...GOLD_BUTTON_SHADOW,
  },
  slogan: {
    color: COLORS.blancTexte,
    fontSize: 20,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  sousSlogan: {
    color: COLORS.grisTexte,
    fontSize: 15,
    marginTop: 12,
    textAlign: 'center',
    maxWidth: 480,
  },
  boutonsHero: {
    flexDirection: 'row',
    marginTop: 32,
    gap: 14,
  },
  boutonPrincipal: {
    backgroundColor: COLORS.orPrincipal,
    borderRadius: 10,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginRight: 14,
  },
  boutonPrincipalTexte: {
    color: COLORS.noirFond,
    fontWeight: 'bold',
    fontSize: 15,
  },
  boutonSecondaire: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.orFonce,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  boutonSecondaireTexte: {
    color: COLORS.orFonce,
    fontWeight: 'bold',
    fontSize: 15,
  },
  lienApk: {
    color: COLORS.grisTexte,
    marginTop: 24,
    textDecorationLine: 'underline',
  },
  section: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  carte: {
    backgroundColor: '#151B2E',
    borderRadius: 16,
    padding: 24,
    width: 260,
    borderWidth: 1,
    borderColor: COLORS.orFonce,
  },
  carteTitre: {
    color: COLORS.orPrincipal,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  carteTexte: {
    color: COLORS.grisTexte,
    fontSize: 14,
    lineHeight: 20,
  },
  pied: {
    alignItems: 'center',
    marginTop: 48,
  },
  piedTexte: {
    color: COLORS.grisTexte,
    fontSize: 12,
  },
});
