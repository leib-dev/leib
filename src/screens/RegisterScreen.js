// =====================================================
// RegisterScreen.js - LEIB
// Écran d'inscription (pseudo + email + mot de passe)
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

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [pseudo, setPseudo] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!pseudo || !email || !password) {
      Alert.alert('Champs manquants', 'Merci de remplir tous les champs.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Mot de passe trop court', 'Utilise au moins 8 caractères.');
      return;
    }
    setLoading(true);
    try {
      await register(email.trim(), password, pseudo.trim(), telephone.trim());
      // Navigation automatique vers le Feed via AppNavigator
    } catch (error) {
      Alert.alert('Inscription échouée', error.message || 'Réessaie dans un instant.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>LEIB</Text>
      <Text style={styles.subtitle}>Crée ton compte et commence à gagner</Text>

      <TextInput
        style={styles.input}
        placeholder="Pseudo"
        placeholderTextColor={COLORS.grisTexte}
        value={pseudo}
        onChangeText={setPseudo}
      />
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
        placeholder="Téléphone (pour tes notifications SMS)"
        placeholderTextColor={COLORS.grisTexte}
        keyboardType="phone-pad"
        value={telephone}
        onChangeText={setTelephone}
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe (8 caractères min.)"
        placeholderTextColor={COLORS.grisTexte}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={[styles.button, GOLD_BUTTON_SHADOW]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.noirFond} />
        ) : (
          <Text style={styles.buttonText}>S'inscrire</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Déjà un compte ? Connecte-toi</Text>
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
