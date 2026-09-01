// =====================================================
// UtilisateurAdminRow.js - LEIB
// Une ligne utilisateur dans la liste admin, avec actions
// rapides : bannir/débannir, attribuer/retirer le badge
// vérifié gratuitement.
// =====================================================

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { COLORS } from '../config/colors';
import {
  toggleBanUtilisateur,
  attribuerBadgeVerifieGratuit,
  retirerBadgeVerifie,
} from '../services/adminService';

export default function UtilisateurAdminRow({ utilisateur }) {
  const [banni, setBanni] = useState(!!utilisateur.banni);
  const [badgeVerifie, setBadgeVerifie] = useState(!!utilisateur.badgeVerifie);

  async function handleToggleBan() {
    try {
      await toggleBanUtilisateur(utilisateur.$id, banni);
      setBanni(!banni);
    } catch (error) {
      Alert.alert('Erreur', error.message);
    }
  }

  async function handleToggleBadge() {
    try {
      if (badgeVerifie) {
        await retirerBadgeVerifie(utilisateur.$id);
      } else {
        await attribuerBadgeVerifieGratuit(utilisateur.$id);
      }
      setBadgeVerifie(!badgeVerifie);
    } catch (error) {
      Alert.alert('Erreur', error.message);
    }
  }

  return (
    <View style={styles.ligne}>
      <View style={styles.infos}>
        <Text style={styles.pseudo}>
          {utilisateur.pseudo} {badgeVerifie ? '✔️' : ''} {utilisateur.badgeVip ? '👑' : ''}
        </Text>
        <Text style={styles.role}>{utilisateur.role} · {utilisateur.soldeLeibPay || 0} F</Text>
        {banni && <Text style={styles.banniLabel}>BANNI</Text>}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.bouton, badgeVerifie ? styles.boutonActifBleu : styles.boutonInactif]}
          onPress={handleToggleBadge}
        >
          <Text style={styles.boutonTexte}>{badgeVerifie ? 'Retirer ✔️' : 'Vérifier'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bouton, banni ? styles.boutonActifVert : styles.boutonActifRouge]}
          onPress={handleToggleBan}
        >
          <Text style={styles.boutonTexte}>{banni ? 'Débannir' : 'Bannir'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ligne: {
    backgroundColor: '#151B2E',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.orFonce,
  },
  infos: {
    marginBottom: 10,
  },
  pseudo: {
    color: COLORS.blancTexte,
    fontWeight: 'bold',
    fontSize: 15,
  },
  role: {
    color: COLORS.grisTexte,
    fontSize: 12,
    marginTop: 2,
  },
  banniLabel: {
    color: COLORS.rougeErreur,
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  bouton: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  boutonInactif: {
    backgroundColor: '#232B45',
  },
  boutonActifBleu: {
    backgroundColor: COLORS.bleuVerifie,
  },
  boutonActifRouge: {
    backgroundColor: COLORS.rougeErreur,
  },
  boutonActifVert: {
    backgroundColor: COLORS.vertSucces,
  },
  boutonTexte: {
    color: COLORS.blancTexte,
    fontSize: 12,
    fontWeight: 'bold',
  },
});
