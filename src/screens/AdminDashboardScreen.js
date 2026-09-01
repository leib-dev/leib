// =====================================================
// AdminDashboardScreen.js - LEIB
// Réservé au rôle "admin". Trois sections :
// 1. Vue d'ensemble (solde + gains totaux)
// 2. Retraits en attente d'approbation
// 3. Liste des utilisateurs avec actions rapides
// =====================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { COLORS } from '../config/colors';
import {
  getSoldeAdmin,
  getGainsTotauxAdmin,
  listerRetraitsEnAttente,
  listerUtilisateurs,
} from '../services/adminService';
import RetraitEnAttenteRow from '../components/RetraitEnAttenteRow';
import UtilisateurAdminRow from '../components/UtilisateurAdminRow';

export default function AdminDashboardScreen() {
  const [solde, setSolde] = useState(0);
  const [gainsTotaux, setGainsTotaux] = useState(0);
  const [retraits, setRetraits] = useState([]);
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [rafraichissement, setRafraichissement] = useState(false);

  const chargerDonnees = useCallback(async () => {
    try {
      const [soldeActuel, gains, retraitsEnAttente, listeUtilisateurs] = await Promise.all([
        getSoldeAdmin(),
        getGainsTotauxAdmin(),
        listerRetraitsEnAttente(),
        listerUtilisateurs(),
      ]);
      setSolde(soldeActuel);
      setGainsTotaux(gains.total);
      setRetraits(retraitsEnAttente);
      setUtilisateurs(listeUtilisateurs);
    } catch (error) {
      console.warn('[Admin] Erreur de chargement:', error.message);
    } finally {
      setChargement(false);
      setRafraichissement(false);
    }
  }, []);

  useEffect(() => {
    chargerDonnees();
  }, [chargerDonnees]);

  function onRafraichir() {
    setRafraichissement(true);
    chargerDonnees();
  }

  function onRetraitApprouve(transactionId) {
    setRetraits((prev) => prev.filter((r) => r.$id !== transactionId));
  }

  if (chargement) {
    return (
      <View style={styles.centre}>
        <ActivityIndicator color={COLORS.orPrincipal} size="large" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 60 }}
      refreshControl={
        <RefreshControl refreshing={rafraichissement} onRefresh={onRafraichir} tintColor={COLORS.orPrincipal} />
      }
      data={[]}
      renderItem={null}
      ListHeaderComponent={
        <>
          <Text style={styles.titrePrincipal}>Dashboard Admin</Text>

          {/* --- Vue d'ensemble --- */}
          <View style={styles.carteVueEnsemble}>
            <View style={styles.blocSolde}>
              <Text style={styles.libelle}>Solde disponible</Text>
              <Text style={styles.montantSolde}>{solde} F</Text>
            </View>
            <View style={styles.separateur} />
            <View style={styles.blocSolde}>
              <Text style={styles.libelle}>Gains totaux (200 dern.)</Text>
              <Text style={styles.montantGains}>{gainsTotaux} F</Text>
            </View>
          </View>

          {/* --- Retraits en attente --- */}
          <Text style={styles.titreSection}>
            Retraits en attente {retraits.length > 0 ? `(${retraits.length})` : ''}
          </Text>
          {retraits.length === 0 ? (
            <Text style={styles.vide}>Aucun retrait en attente.</Text>
          ) : (
            retraits.map((retrait) => (
              <RetraitEnAttenteRow key={retrait.$id} retrait={retrait} onApprouve={onRetraitApprouve} />
            ))
          )}

          {/* --- Utilisateurs --- */}
          <Text style={styles.titreSection}>Utilisateurs ({utilisateurs.length})</Text>
          {utilisateurs.map((utilisateur) => (
            <UtilisateurAdminRow key={utilisateur.$id} utilisateur={utilisateur} />
          ))}
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bleuNuit,
  },
  centre: {
    flex: 1,
    backgroundColor: COLORS.bleuNuit,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titrePrincipal: {
    color: COLORS.blancTexte,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  carteVueEnsemble: {
    flexDirection: 'row',
    backgroundColor: '#151B2E',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.orFonce,
    marginBottom: 24,
  },
  blocSolde: {
    flex: 1,
    alignItems: 'center',
  },
  separateur: {
    width: 1,
    backgroundColor: COLORS.orFonce,
    marginHorizontal: 12,
  },
  libelle: {
    color: COLORS.grisTexte,
    fontSize: 12,
    textAlign: 'center',
  },
  montantSolde: {
    color: COLORS.orPrincipal,
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 6,
  },
  montantGains: {
    color: COLORS.vertSucces,
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 6,
  },
  titreSection: {
    color: COLORS.blancTexte,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 12,
  },
  vide: {
    color: COLORS.grisTexte,
    marginBottom: 20,
  },
});
