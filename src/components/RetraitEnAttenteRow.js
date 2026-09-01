// =====================================================
// RetraitEnAttenteRow.js - LEIB
// Une ligne de retrait à valider par l'admin.
// =====================================================

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { COLORS } from '../config/colors';
import { approuverRetrait } from '../services/adminService';

export default function RetraitEnAttenteRow({ retrait, onApprouve }) {
  const [enCours, setEnCours] = useState(false);

  async function handleApprouver() {
    setEnCours(true);
    try {
      await approuverRetrait(retrait.$id);
      onApprouve?.(retrait.$id);
    } catch (error) {
      Alert.alert('Erreur', error.message || "Impossible d'approuver ce retrait.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <View style={styles.ligne}>
      <View>
        <Text style={styles.montant}>{retrait.montant} F</Text>
        <Text style={styles.info}>Utilisateur : {retrait.payeurId}</Text>
        <Text style={styles.date}>
          {new Date(retrait.date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
      <TouchableOpacity style={styles.boutonApprouver} onPress={handleApprouver} disabled={enCours}>
        {enCours ? (
          <ActivityIndicator color={COLORS.noirFond} size="small" />
        ) : (
          <Text style={styles.boutonApprouverTexte}>Approuver</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  ligne: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#151B2E',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.orFonce,
  },
  montant: {
    color: COLORS.orPrincipal,
    fontSize: 16,
    fontWeight: 'bold',
  },
  info: {
    color: COLORS.grisTexte,
    fontSize: 12,
    marginTop: 2,
  },
  date: {
    color: COLORS.grisTexte,
    fontSize: 11,
    marginTop: 2,
  },
  boutonApprouver: {
    backgroundColor: COLORS.vertSucces,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  boutonApprouverTexte: {
    color: COLORS.noirFond,
    fontWeight: 'bold',
    fontSize: 12,
  },
});
