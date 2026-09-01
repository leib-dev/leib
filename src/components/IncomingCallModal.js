// =====================================================
// IncomingCallModal.js - LEIB
// Overlay plein écran affichée dès qu'un appel entrant
// arrive (détecté via Appwrite Realtime dans
// GlobalCallListener). Accepter ou refuser.
// =====================================================

import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, GOLD_BUTTON_SHADOW } from '../config/colors';

export default function IncomingCallModal({ appel, onAccepter, onRefuser }) {
  const [enCours, setEnCours] = useState(false);

  if (!appel) return null;

  async function handleAccepter() {
    setEnCours(true);
    await onAccepter();
    setEnCours(false);
  }

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.fond}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarLettre}>{appel.callerPseudo?.[0]?.toUpperCase()}</Text>
        </View>
        <Text style={styles.pseudo}>{appel.callerPseudo}</Text>
        <Text style={styles.type}>
          {appel.type === 'video' ? 'Appel vidéo entrant' : 'Appel audio entrant'} — LEIB
        </Text>

        <View style={styles.boutons}>
          <TouchableOpacity style={styles.boutonRefuser} onPress={onRefuser} disabled={enCours}>
            <Text style={styles.boutonIcone}>✕</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.boutonAccepter, GOLD_BUTTON_SHADOW]}
            onPress={handleAccepter}
            disabled={enCours}
          >
            {enCours ? <ActivityIndicator color={COLORS.noirFond} /> : <Text style={styles.boutonIcone}>✓</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fond: {
    flex: 1,
    backgroundColor: COLORS.bleuNuit,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: COLORS.orFonce,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  avatarLettre: {
    fontSize: 44,
    fontWeight: 'bold',
    color: COLORS.noirFond,
  },
  pseudo: {
    color: COLORS.blancTexte,
    fontSize: 24,
    fontWeight: 'bold',
  },
  type: {
    color: COLORS.orPrincipal,
    fontSize: 14,
    marginTop: 6,
    marginBottom: 60,
  },
  boutons: {
    flexDirection: 'row',
    gap: 40,
  },
  boutonRefuser: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.rougeErreur,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
  },
  boutonAccepter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.orPrincipal,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
  },
  boutonIcone: {
    fontSize: 26,
    color: COLORS.blancTexte,
    fontWeight: 'bold',
  },
});
