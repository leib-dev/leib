// =====================================================
// AuthContext.js - LEIB
// Fournit l'état d'authentification (utilisateur connecté,
// profil, chargement) à toute l'application via useAuth().
// =====================================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getCurrentAccount,
  getCurrentUserProfile,
  loginUser,
  registerUser,
  logoutUser,
} from '../services/authService';
import { enregistrerPushToken } from '../config/pushNotifications';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // compte Appwrite (auth)
  const [profile, setProfile] = useState(null); // document "users" (données LEIB)
  const [loading, setLoading] = useState(true); // vrai pendant la vérification initiale

  // Au lancement de l'app, on vérifie si une session existe déjà
  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    setLoading(true);
    try {
      const currentAccount = await getCurrentAccount();
      if (currentAccount) {
        const currentProfile = await getCurrentUserProfile();
        setUser(currentAccount);
        setProfile(currentProfile);
        enregistrerPushToken(currentAccount.$id); // ne bloque jamais, best-effort
      }
    } catch (error) {
      console.warn('[Auth] Aucune session active');
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    const { profile: loggedProfile } = await loginUser({ email, password });
    const currentAccount = await getCurrentAccount();
    setUser(currentAccount);
    setProfile(loggedProfile);
    enregistrerPushToken(currentAccount.$id);
  }

  async function register(email, password, pseudo, telephone) {
    const { account: newAccount, profile: newProfile } = await registerUser({
      email,
      password,
      pseudo,
      telephone,
    });
    setUser(newAccount);
    setProfile(newProfile);
    enregistrerPushToken(newAccount.$id);
  }

  async function logout() {
    await logoutUser();
    setUser(null);
    setProfile(null);
  }

  const value = {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    isAdmin: profile?.role === 'admin',
    isCreator: profile?.role === 'creator' || profile?.role === 'admin',
    login,
    register,
    logout,
    refreshProfile: async () => setProfile(await getCurrentUserProfile()),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook à utiliser dans les écrans/composants :
 * const { user, profile, login, logout } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth() doit être utilisé à l\'intérieur d\'un <AuthProvider>');
  }
  return context;
}
