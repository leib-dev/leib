// =====================================================
// SplashScreen.js - LEIB
// Affiché pendant que AuthContext vérifie s'il existe
// déjà une session Appwrite active.
// =====================================================

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '../config/colors';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>LEIB</Text>
      <ActivityIndicator color={COLORS.orPrincipal} style={{ marginTop: 20 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bleuNuit,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: 56,
    fontWeight: 'bold',
    color: COLORS.orPrincipal,
  },
});
