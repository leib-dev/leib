// =====================================================
// WalletScreen.js - LEIB
// Affiche le solde LEIB Pay, l'historique des transactions
// et permet de lancer un retrait via RetraitModal.
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
import { useAuth } from '../context/AuthContext';
import { getHistoriqueTransactions } from '../services/walletService';
import TransactionRow from '../components/TransactionRow';
import RetraitModal from '../components/RetraitModal';

export default function WalletScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [rafraichissement, setRafraichissement] = useState(false);
  const [modalRetraitVisible, setModalRetraitVisible] = useState(false);

  const chargerHistorique = useCallback(async () => {
    if (!user) return;
    try {
      const resultats = await getHistoriqueTransactions(user.$id);
      setTransactions(resultats);
    } catch (error) {
      console.warn('[Wallet] Erreur de chargement:', error.message);
    } finally {
      setChargement(false);
      setRafraichissement(false);
    }
  }, [user]);

  useEffect(() => {
    chargerHistorique();
  }, [chargerHistorique]);

  function onRafraichir() {
    setRafraichissement(true);
    refreshProfile();
    chargerHistorique();
  }

  async function onRetraitReussi() {
    await refreshProfile();
    chargerHistorique();
  }

  return (
    <View style={styles.container}>
      {/* Carte solde */}
      <View style={styles.carteSolde}>
        <Text style={styles.libelleSolde}>Solde LEIB Pay</Text>
        <Text style={styles.montantSolde}>{profile?.soldeLeibPay ?? 0} F</Text>

        <TouchableOpacity
          style={[styles.boutonRetrait, GOLD_BUTTON_SHADOW]}
          onPress={() => setModalRetraitVisible(true)}
        >
          <Text style={styles.boutonRetraitTexte}>Retirer</Text>
        </TouchableOpacity>
      </View>

      {/* Historique */}
      <Text style={styles.titreHistorique}>Historique</Text>

      {chargement ? (
        <ActivityIndicator color={COLORS.orPrincipal} style={{ marginTop: 20 }} />
      ) : transactions.length === 0 ? (
        <Text style={styles.vide}>Aucune transaction pour le moment.</Text>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.$id}
          renderItem={({ item }) => <TransactionRow transaction={item} userId={user?.$id} />}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={rafraichissement}
              onRefresh={onRafraichir}
              tintColor={COLORS.orPrincipal}
            />
          }
        />
      )}

      <RetraitModal
        visible={modalRetraitVisible}
        onClose={() => setModalRetraitVisible(false)}
        userId={user?.$id}
        soldeDisponible={profile?.soldeLeibPay ?? 0}
        onSuccess={onRetraitReussi}
        numeroMomoDefaut={profile?.numeroMomo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bleuNuit,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  carteSolde: {
    backgroundColor: '#151B2E',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.orFonce,
    marginBottom: 24,
  },
  libelleSolde: {
    color: COLORS.grisTexte,
    fontSize: 14,
  },
  montantSolde: {
    color: COLORS.orPrincipal,
    fontSize: 36,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  boutonRetrait: {
    backgroundColor: COLORS.orPrincipal,
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 10,
    marginTop: 8,
  },
  boutonRetraitTexte: {
    color: COLORS.noirFond,
    fontWeight: 'bold',
  },
  titreHistorique: {
    color: COLORS.blancTexte,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  vide: {
    color: COLORS.grisTexte,
    marginTop: 20,
    textAlign: 'center',
  },
});
