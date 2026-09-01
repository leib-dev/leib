// =====================================================
// LoginScreen.js - LEIB
// Écran de connexion (email + mot de passe)
// =====================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { COLORS, GOLD_BUTTON_SHADOW } from '../config/colors';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Champs manquants', 'Merci de remplir email et mot de passe.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      // La navigation vers le Feed se fait automatiquement via l'AppNavigator
      // qui écoute isAuthenticated dans le AuthContext.
    } catch (error) {
      Alert.alert('Connexion échouée', error.message || 'Vérifie tes identifiants.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>LEIB</Text>
      <Text style={styles.subtitle}>Regarde. Gagne. Devient LEIB.</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={COLORS.grisTexte}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        placeholderTextColor={COLORS.grisTexte}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={[styles.button, GOLD_BUTTON_SHADOW]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.noirFond} />
        ) : (
          <Text style={styles.buttonText}>Se connecter</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Pas encore de compte ? Inscris-toi</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bleuNuit,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.orPrincipal,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.blancTexte,
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#151B2E',
    color: COLORS.blancTexte,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.orFonce,
  },
  button: {
    backgroundColor: COLORS.orPrincipal,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: COLORS.noirFond,
    fontWeight: 'bold',
    fontSize: 16,
  },
  link: {
    color: COLORS.orFonce,
    textAlign: 'center',
    marginTop: 20,
  },
});
