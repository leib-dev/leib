// =====================================================
// LiveScreen.js - LEIB
// Liste des lives actuellement en cours. Bouton pour
// démarrer son propre live en haut de l'écran.
// =====================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { COLORS, GOLD_BUTTON_SHADOW } from '../config/colors';
import { getLivesEnCours } from '../services/liveService';

export default function LiveScreen({ navigation }) {
  const [lives, setLives] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [rafraichissement, setRafraichissement] = useState(false);

  const charger = useCallback(async () => {
    try {
      const resultats = await getLivesEnCours();
      setLives(resultats);
    } catch (error) {
      console.warn('[Live] Erreur de chargement:', error.message);
    } finally {
      setChargement(false);
      setRafraichissement(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  function onRafraichir() {
    setRafraichissement(true);
    charger();
  }

  return (
    <View style={styles.container}>
      <View style={styles.entete}>
        <Text style={styles.titre}>Lives en direct 🔴</Text>
        <TouchableOpacity
          style={[styles.boutonDemarrer, GOLD_BUTTON_SHADOW]}
          onPress={() => navigation.navigate('StartLive')}
        >
          <Text style={styles.boutonDemarrerTexte}>+ Démarrer</Text>
        </TouchableOpacity>
      </View>

      {chargement ? (
        <ActivityIndicator color={COLORS.orPrincipal} style={{ marginTop: 40 }} />
      ) : lives.length === 0 ? (
        <View style={styles.vide}>
          <Text style={styles.videTexte}>Aucun live en cours actuellement.</Text>
        </View>
      ) : (
        <FlatList
          data={lives}
          keyExtractor={(item) => item.$id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={rafraichissement} onRefresh={onRafraichir} tintColor={COLORS.orPrincipal} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.carteLive}
              onPress={() => navigation.navigate('LiveViewer', { live: item })}
            >
              <View style={styles.badgeDirect}>
                <Text style={styles.badgeDirectTexte}>● DIRECT</Text>
              </View>
              <Text style={styles.carteTitre}>{item.titre}</Text>
              <Text style={styles.cartePseudo}>@{item.createurPseudo}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bleuNuit,
    paddingTop: 60,
  },
  entete: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  titre: {
    color: COLORS.blancTexte,
    fontSize: 20,
    fontWeight: 'bold',
  },
  boutonDemarrer: {
    backgroundColor: COLORS.orPrincipal,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  boutonDemarrerTexte: {
    color: COLORS.noirFond,
    fontWeight: 'bold',
    fontSize: 13,
  },
  vide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videTexte: {
    color: COLORS.grisTexte,
  },
  carteLive: {
    backgroundColor: '#151B2E',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.orFonce,
  },
  badgeDirect: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.rougeErreur,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 8,
  },
  badgeDirectTexte: {
    color: COLORS.blancTexte,
    fontSize: 10,
    fontWeight: 'bold',
  },
  carteTitre: {
    color: COLORS.blancTexte,
    fontSize: 16,
    fontWeight: '600',
  },
  cartePseudo: {
    color: COLORS.orFonce,
    fontSize: 13,
    marginTop: 4,
  },
});
