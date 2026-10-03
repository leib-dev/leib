// CreatorProfileScreen.js - LEIB
// Profil visite d'un createur : avatar, pseudo, compteurs
// followers/suivis, bouton Suivre/Suivi.

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { COLORS, GOLD_BUTTON_SHADOW } from '../config/colors';
import { useAuth } from '../context/AuthContext';
import { databases, DB_ID, COLLECTIONS } from '../config/appwrite';
import {
  suivreUtilisateur,
  neplusSuivreUtilisateur,
  estSuivi,
  compterFollowers,
  compterSuivis,
} from '../services/followService';

export default function CreatorProfileScreen() {
  const route = useRoute();
  const { creatorId, pseudo } = route.params;
  const { user } = useAuth();

  const [profilCreateur, setProfilCreateur] = useState(null);
  const [nbFollowers, setNbFollowers] = useState(0);
  const [nbSuivis, setNbSuivis] = useState(0);
  const [suivi, setSuivi] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [actionEnCours, setActionEnCours] = useState(false);

  const chargerDonnees = useCallback(async () => {
    try {
      const doc = await databases.getDocument(DB_ID, COLLECTIONS.USERS, creatorId);
      setProfilCreateur(doc);

      const [followers, suivis] = await Promise.all([
        compterFollowers(creatorId),
        compterSuivis(creatorId),
      ]);
      setNbFollowers(followers);
      setNbSuivis(suivis);

      if (user) {
        const dejaSuivi = await estSuivi(user.$id, creatorId);
        setSuivi(dejaSuivi);
      }
    } catch (error) {
      console.warn('[CreatorProfile] Erreur de chargement:', error.message);
    } finally {
      setChargement(false);
    }
  }, [creatorId, user]);

  useEffect(() => {
    chargerDonnees();
  }, [chargerDonnees]);

  async function handleSuivre() {
    if (!user) return;
    setActionEnCours(true);
    try {
      if (suivi) {
        await neplusSuivreUtilisateur(user.$id, creatorId);
        setSuivi(false);
        setNbFollowers((n) => Math.max(0, n - 1));
      } else {
        await suivreUtilisateur(user.$id, creatorId);
        setSuivi(true);
        setNbFollowers((n) => n + 1);
      }
    } catch (error) {
      console.warn('[CreatorProfile] Erreur suivre:', error.message);
    } finally {
      setActionEnCours(false);
    }
  }

  if (chargement) {
    return (
      <View style={styles.centre}>
        <ActivityIndicator color={COLORS.orPrincipal} size="large" />
      </View>
    );
  }

  const estMoi = user?.$id === creatorId;

  return (
    <View style={styles.container}>
      {profilCreateur?.photoProfil ? (
        <Image source={{ uri: profilCreateur.photoProfil }} style={styles.avatarCercle} />
      ) : (
        <View style={styles.avatarCercle}>
          <Text style={styles.avatarInitiale}>
            {pseudo?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
      )}

      <Text style={styles.pseudo}>@{pseudo}</Text>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNombre}>{nbFollowers}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNombre}>{nbSuivis}</Text>
          <Text style={styles.statLabel}>Suivis</Text>
        </View>
      </View>

      {!estMoi && (
        <TouchableOpacity
          style={[suivi ? styles.boutonSuivi : styles.boutonSuivre, GOLD_BUTTON_SHADOW]}
          onPress={handleSuivre}
          disabled={actionEnCours}
        >
          {actionEnCours ? (
            <ActivityIndicator color={suivi ? COLORS.blancTexte : COLORS.noirFond} />
          ) : (
            <Text style={suivi ? styles.texteBoutonSuivi : styles.texteBoutonSuivre}>
              {suivi ? 'Suivi' : 'Suivre'}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bleuNuit, alignItems: 'center', paddingTop: 60, paddingHorizontal: 20 },
  centre: { flex: 1, backgroundColor: COLORS.bleuNuit, alignItems: 'center', justifyContent: 'center' },
  avatarCercle: { width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.orFonce, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  avatarInitiale: { color: COLORS.noirFond, fontSize: 36, fontWeight: 'bold' },
  pseudo: { color: COLORS.blancTexte, fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 40, marginBottom: 24 },
  stat: { alignItems: 'center' },
  statNombre: { color: COLORS.blancTexte, fontSize: 18, fontWeight: 'bold' },
  statLabel: { color: COLORS.grisTexte, fontSize: 13, marginTop: 2 },
  boutonSuivre: { backgroundColor: COLORS.orPrincipal, borderRadius: 24, paddingVertical: 12, paddingHorizontal: 40 },
  boutonSuivi: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.orFonce, borderRadius: 24, paddingVertical: 12, paddingHorizontal: 40 },
  texteBoutonSuivre: { color: COLORS.noirFond, fontWeight: 'bold', fontSize: 15 },
  texteBoutonSuivi: { color: COLORS.blancTexte, fontWeight: 'bold', fontSize: 15 },
});
