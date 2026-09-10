// =====================================================
// authService.js - LEIB
// Toute la logique d'authentification Appwrite :
// inscription, connexion, déconnexion, récupération
// de la session en cours, création du profil utilisateur
// dans la collection "users".
// =====================================================

import { Permission, Role } from 'react-native-appwrite';
import { account, databases, DB_ID, COLLECTIONS, ID, ADMIN_ID } from '../config/appwrite';

/**
 * Inscrit un nouvel utilisateur (compte Appwrite + document profil).
 * Le profil créé dans la base contient le solde LEIB Pay, le rôle,
 * et les infos de base affichées sur le profil.
 */
export async function registerUser({ email, password, pseudo, telephone }) {
  // 1. Création du compte Appwrite (auth)
  const newAccount = await account.create(ID.unique(), email, password, pseudo);

  // 2. Connexion immédiate pour pouvoir créer le document profil
  await account.createEmailPasswordSession(email, password);

  // 3. Le compte admin est déterminé par ADMIN_ID (voir .env) ;
  //    tout nouvel inscrit est "viewer" par défaut, promu créateur plus tard.
  const isAdmin = newAccount.$id === ADMIN_ID;

  // 4. Création du document profil dans la collection "users"
  //    Permissions par document : seul cet utilisateur peut lire/modifier
  //    son propre profil, même si la table autorise Read/Update pour "Users"
  //    en général (Row security doit être activé sur la collection).
  const profile = await databases.createDocument(
    DB_ID,
    COLLECTIONS.USERS,
    newAccount.$id,
    {
      pseudo,
      email,
      telephone: telephone || null, // requis pour recevoir les notifications SMS
      role: isAdmin ? 'admin' : 'viewer', // viewer | creator | admin
      soldeLeibPay: 0,
      badgeVerifie: false,
      badgeVip: false,
      photoProfil: null,
      dateInscription: new Date().toISOString(),
    },
    [
      Permission.read(Role.user(newAccount.$id)),
      Permission.update(Role.user(newAccount.$id)),
    ]
  );

  return { account: newAccount, profile };
}

/**
 * Connecte un utilisateur existant avec email + mot de passe.
 */
export async function loginUser({ email, password }) {
  const session = await account.createEmailPasswordSession(email, password);
  const profile = await getCurrentUserProfile();
  return { session, profile };
}

/**
 * Déconnecte l'utilisateur en cours (supprime la session active).
 */
export async function logoutUser() {
  await account.deleteSession('current');
}

/**
 * Retourne le compte Appwrite actuellement connecté, ou null si personne
 * n'est connecté (ne lève pas d'erreur dans ce cas, pratique pour le
 * splash screen qui vérifie la session au démarrage).
 */
export async function getCurrentAccount() {
  try {
    return await account.get();
  } catch (error) {
    return null;
  }
}

/**
 * Retourne le document profil (collection "users") de l'utilisateur connecté.
 */
export async function getCurrentUserProfile() {
  const currentAccount = await getCurrentAccount();
  if (!currentAccount) return null;

  const profile = await databases.getDocument(DB_ID, COLLECTIONS.USERS, currentAccount.$id);
  return profile;
}
