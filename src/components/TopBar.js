// =====================================================
// TopBar.js - LEIB
// Barre superposée en haut du feed : logo, solde LEIB Pay
// et accès rapide à la déconnexion.
// =====================================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../config/colors';
import { useAuth } from '../context/AuthContext';

export default function TopBar() {
  const { logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>LEIB</Text>
      <TouchableOpacity onPress={logout} style={styles.boutonDeconnexion}>
        <Text style={styles.texteDeconnexion}>⏻</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 48,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  logo: {
    color: COLORS.orPrincipal,
    fontSize: 20,
    fontWeight: 'bold',
  },
  droite: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  solde: {
    color: COLORS.blancTexte,
    fontWeight: 'bold',
    marginRight: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  boutonDeconnexion: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texteDeconnexion: {
    color: COLORS.orFonce,
    fontSize: 14,
  },
});
