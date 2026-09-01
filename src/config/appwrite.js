// =====================================================
// Configuration Appwrite - LEIB
// Gère l'authentification, la base de données et le
// stockage de base (photos de profil, avatars, etc.)
// =====================================================

import { Client, Account, Databases, Storage, ID, Query } from 'react-native-appwrite';

// Création du client Appwrite à partir des variables d'environnement
const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT);

// Instances exportées pour être utilisées partout dans l'app
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export { ID, Query, client };

// Identifiants de la base de données et des collections
// (à créer manuellement dans la console Appwrite avec les mêmes noms/IDs)
export const DB_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;

export const COLLECTIONS = {
  USERS: process.env.EXPO_PUBLIC_APPWRITE_COL_USERS,
  VIDEOS: process.env.EXPO_PUBLIC_APPWRITE_COL_VIDEOS,
  TRANSACTIONS: process.env.EXPO_PUBLIC_APPWRITE_COL_TRANSACTIONS,
  LIVES: process.env.EXPO_PUBLIC_APPWRITE_COL_LIVES,
  CALLS: process.env.EXPO_PUBLIC_APPWRITE_COL_CALLS,
};

// ID du compte administrateur LEIB (reçoit les parts admin)
export const ADMIN_ID = process.env.EXPO_PUBLIC_ADMIN_ID;
