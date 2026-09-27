import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl, Alert } from 'react-native';
import { COLORS, GOLD_BUTTON_SHADOW } from '../config/colors';
import { listerRetraitsEnAttente, approuverRetrait } from '../services/adminService';

export default function AdminRetraitsScreen() {
  const [retraits, setRetraits] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [rafraichissement, setRafraichissement] = useState(false);
  const [enCoursId, setEnCoursId] = useState(null);

  const charger = useCallback(async () => {
    try {
      const liste = await listerRetraitsEnAttente();
      setRetraits(liste);
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setChargement(false);
      setRafraichissement(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  async function handleConfirmer(transactionId) {
    setEnCoursId(transactionId);
    try {
      await approuverRetrait(transactionId);
      setRetraits((prev) => prev.filter((r) => r.$id !== transactionId));
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setEnCoursId(null);
    }
  }

  function onRefresh() {
    setRafraichissement(true);
    charger();
  }

  if (chargement) {
    return (
      <View style={styles.centre}>
        <Text style={styles.texteVide}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titre}>Retraits en attente</Text>
      <FlatList
        data={retraits}
        keyExtractor={(item) => item.$id}
        contentContainerStyle={styles.liste}
        refreshControl={<RefreshControl refreshing={rafraichissement} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.texteVide}>Aucun retrait en attente.</Text>}
        renderItem={({ item }) => (
          <View style={styles.carte}>
            <Text style={styles.montant}>{item.montant} F</Text>
            <Text style={styles.detail}>Bénéficiaire : {item.beneficiaireId}</Text>
            <Text style={styles.detail}>Date : {new Date(item.date).toLocaleString()}</Text>
            <TouchableOpacity
              style={[styles.bouton, GOLD_BUTTON_SHADOW]}
              onPress={() => handleConfirmer(item.$id)}
              disabled={enCoursId === item.$id}
            >
              <Text style={styles.texteBouton}>
                {enCoursId === item.$id ? 'Confirmation...' : 'Confirmer le paiement'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bleuNuit, paddingTop: 60, paddingHorizontal: 16 },
  centre: { flex: 1, backgroundColor: COLORS.bleuNuit, alignItems: 'center', justifyContent: 'center' },
  titre: { color: COLORS.blancTexte, fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  liste: { paddingBottom: 40 },
  texteVide: { color: COLORS.grisTexte, fontSize: 15, textAlign: 'center', marginTop: 40 },
  carte: {
    backgroundColor: '#151B2E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.orFonce,
    marginBottom: 16,
  },
  montant: { color: COLORS.blancTexte, fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  detail: { color: COLORS.grisTexte, fontSize: 13, marginBottom: 4 },
  bouton: {
    backgroundColor: COLORS.orPrincipal,
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  texteBouton: { color: COLORS.noirFond, fontWeight: 'bold', fontSize: 15 },
});
