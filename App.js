// ==================================================================
// App.js - Point d'entrée LEIB
// (Brique 2 : authentification branchée sur la navigation)
// ==================================================================

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { demarrerEcouteSms, arreterEcouteSms } from './src/services/smsListenerService';

// Démarre l'écoute SMS Momo uniquement si l'utilisateur connecté est admin
function SmsListenerBridge() {
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (isAdmin) {
      demarrerEcouteSms();
    } else {
      arreterEcouteSms();
    }
    return () => arreterEcouteSms();
  }, [isAdmin]);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <SmsListenerBridge />
      <AppNavigator />
    </AuthProvider>
  );
}
