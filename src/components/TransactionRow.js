// =====================================================
// TransactionRow.js - LEIB
// Une ligne de l'historique wallet : type, montant,
// signe (+ reçu / - dépensé), date.
// =====================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../config/colors';

const LIBELLES_TYPE = {
  deblocage_video: 'Déblocage vidéo',
  upload_video: 'Publication vidéo',
  boost_video: 'Boost vidéo',
  lancer_live: 'Lancement live',
  badge_vip: 'Badge VIP doré',
  badge_verifie: 'Badge vérifié',
  abonnement_createur: 'Abonnement créateur',
  acces_live: 'Accès live',
  don_live: 'Don pendant live',
  retrait: 'Retrait',
};

export default function TransactionRow({ transaction, userId }) {
  const estRetrait = transaction.type === 'retrait';
  const estRecu = !estRetrait && transaction.beneficiaireId === userId;
  const signe = estRetrait ? '-' : estRecu ? '+' : '-';
  const montantAffiche = estRetrait
    ? transaction.montant
    : estRecu
    ? transaction.partCreateur || transaction.partAdmin
    : transaction.montant;

  return (
    <View style={styles.ligne}>
      <View>
        <Text style={styles.libelle}>{LIBELLES_TYPE[transaction.type] || transaction.type}</Text>
        <Text style={styles.date}>
          {new Date(transaction.date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
      <Text style={[styles.montant, { color: signe === '+' ? COLORS.vertSucces : COLORS.rougeErreur }]}>
        {signe}{montantAffiche} F
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ligne: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2138',
  },
  libelle: {
    color: COLORS.blancTexte,
    fontSize: 15,
    fontWeight: '600',
  },
  date: {
    color: COLORS.grisTexte,
    fontSize: 12,
    marginTop: 2,
  },
  montant: {
    fontSize: 15,
    fontWeight: 'bold',
  },
});
