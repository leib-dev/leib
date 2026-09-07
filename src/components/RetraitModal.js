// =====================================================
// RetraitModal.js - LEIB
// Modal permettant de choisir le montant et la méthode
// de retrait (MTN, Orange, Virement, Stripe) via SebPay.
// =====================================================

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { COLORS, GOLD_BUTTON_SHADOW } from '../config/colors';
import { retirerSolde, MONTANT_MIN_RETRAIT } from '../services/walletService';

const METHODES = [
  { id: 'mtn_momo', label: 'MTN Mobile Money' },
  { id: 'orange_money', label: 'Orange Money' },
  { id: 'bank_transfer', label: 'Virement bancaire' },
  { id: 'stripe', label: 'Stripe' },
];

export default function RetraitModal({ visible, onClose, userId, soldeDisponible, onSuccess, numeroMomoDefaut }) {
  const [montant, setMontant] = useState('');
  const [methode, setMethode] = useState(METHODES[0].id);
  const [contact, setContact] = useState(numeroMomoDefaut || ''); // numéro Mobile Money ou IBAN, pré-rempli si connu
  const [enCours, setEnCours] = useState(false);

  async function handleRetrait() {
    const montantNum = parseInt(montant, 10);

    if (!montantNum || montantNum < MONTANT_MIN_RETRAIT) {
      Alert.alert('Montant invalide', `Le retrait minimum est de ${MONTANT_MIN_RETRAIT} F.`);
      return;
    }
    if (montantNum > soldeDisponible) {
      Alert.alert('Solde insuffisant', "Tu ne peux pas retirer plus que ton solde LEIB Pay.");
      return;
    }
    if (!contact) {
      Alert.alert('Champ manquant', 'Indique ton numéro Mobile Money ou tes coordonnées bancaires.');
      return;
    }

    setEnCours(true);
    try {
      await retirerSolde({
        userId,
        montant: montantNum,
        methode,
        details: { contact },
      });
      Alert.alert('Retrait envoyé', 'Ton retrait est en cours de traitement par SebPay.');
      setMontant('');
      setContact('');
      onSuccess?.();
      onClose();
    } catch (error) {
      Alert.alert('Retrait échoué', error.message || 'Réessaie dans un instant.');
    } finally {
      setEnCours(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.fond}>
        <View style={styles.carte}>
          <Text style={styles.titre}>Retirer mon solde</Text>
          <Text style={styles.solde}>Disponible : {soldeDisponible} F</Text>

          <TextInput
            style={styles.input}
            placeholder={`Montant (min. ${MONTANT_MIN_RETRAIT} F)`}
            placeholderTextColor={COLORS.grisTexte}
            keyboardType="numeric"
            value={montant}
            onChangeText={setMontant}
          />

          <Text style={styles.sousTitre}>Méthode de retrait</Text>
          <View style={styles.methodes}>
            {METHODES.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[styles.methodeBouton, methode === m.id && styles.methodeBoutonActif]}
                onPress={() => setMethode(m.id)}
              >
                <Text
                  style={[
                    styles.methodeTexte,
                    methode === m.id && styles.methodeTexteActif,
                  ]}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder={methode === 'bank_transfer' ? 'IBAN' : 'Numéro de téléphone'}
            placeholderTextColor={COLORS.grisTexte}
            value={contact}
            onChangeText={setContact}
          />

          <TouchableOpacity
            style={[styles.boutonValider, GOLD_BUTTON_SHADOW]}
            onPress={handleRetrait}
            disabled={enCours}
          >
            {enCours ? (
              <ActivityIndicator color={COLORS.noirFond} />
            ) : (
              <Text style={styles.boutonValiderTexte}>Confirmer le retrait</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.boutonAnnuler}>
            <Text style={styles.boutonAnnulerTexte}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fond: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  carte: {
    backgroundColor: COLORS.bleuNuit,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 2,
    borderColor: COLORS.orFonce,
  },
  titre: {
    color: COLORS.blancTexte,
    fontSize: 20,
    fontWeight: 'bold',
  },
  solde: {
    color: COLORS.orPrincipal,
    marginTop: 4,
    marginBottom: 20,
  },
  sousTitre: {
    color: COLORS.grisTexte,
    marginTop: 4,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#151B2E',
    color: COLORS.blancTexte,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.orFonce,
  },
  methodes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  methodeBouton: {
    borderWidth: 1,
    borderColor: COLORS.orFonce,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  methodeBoutonActif: {
    backgroundColor: COLORS.orPrincipal,
  },
  methodeTexte: {
    color: COLORS.orFonce,
    fontSize: 13,
  },
  methodeTexteActif: {
    color: COLORS.noirFond,
    fontWeight: 'bold',
  },
  boutonValider: {
    backgroundColor: COLORS.orPrincipal,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  boutonValiderTexte: {
    color: COLORS.noirFond,
    fontWeight: 'bold',
    fontSize: 16,
  },
  boutonAnnuler: {
    alignItems: 'center',
    marginTop: 14,
  },
  boutonAnnulerTexte: {
    color: COLORS.grisTexte,
  },
});
