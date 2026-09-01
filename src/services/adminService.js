// =====================================================
// adminService.js - LEIB
// Toutes les actions réservées à l'admin LEIB :
// - Vue d'ensemble des gains
// - Approbation des retraits en attente
// - Gestion des utilisateurs (bannir, badge vérifié gratuit)
// =====================================================

import { databases, DB_ID, COLLECTIONS, Query, ADMIN_ID } from '../config/appwrite';
import { notifierRetraitApprouve } from './notificationService';

/**
 * Retourne le solde actuel de l'admin LEIB (gains cumulés disponibles).
 */
export async function getSoldeAdmin() {
  const profil = await databases.getDocument(DB_ID, COLLECTIONS.USERS, ADMIN_ID);
  return profil.soldeLeibPay || 0;
}

/**
 * Calcule le total des gains admin encaissés depuis toujours
 * (somme de tous les partAdmin sur toutes les transactions),
 * distinct du solde actuel qui diminue avec les retraits.
 */
export async function getGainsTotauxAdmin(limite = 200) {
  const response = await databases.listDocuments(DB_ID, COLLECTIONS.TRANSACTIONS, [
    Query.orderDesc('date'),
    Query.limit(limite),
  ]);

  const total = response.documents.reduce((somme, t) => somme + (t.partAdmin || 0), 0);
  return { total, nombreTransactions: response.documents.length };
}

/**
 * Liste les retraits en attente de validation (tous utilisateurs confondus).
 */
export async function listerRetraitsEnAttente() {
  const response = await databases.listDocuments(DB_ID, COLLECTIONS.TRANSACTIONS, [
    Query.equal('type', 'retrait'),
    Query.equal('statutRetrait', 'en_attente'),
    Query.orderDesc('date'),
  ]);
  return response.documents;
}

/**
 * Marque un retrait comme approuvé (le virement réel a été
 * confirmé côté SebPay / vérifié manuellement par l'admin),
 * puis notifie l'utilisateur par SMS — arrive même app fermée.
 */
export async function approuverRetrait(transactionId) {
  const transaction = await databases.getDocument(DB_ID, COLLECTIONS.TRANSACTIONS, transactionId);

  await databases.updateDocument(DB_ID, COLLECTIONS.TRANSACTIONS, transactionId, {
    statutRetrait: 'approuve',
  });

  const profil = await databases.getDocument(DB_ID, COLLECTIONS.USERS, transaction.payeurId);
  if (profil.telephone) {
    notifierRetraitApprouve(profil.telephone, transaction.montant);
  }
}

/**
 * Liste tous les utilisateurs LEIB, triés par date d'inscription.
 */
export async function listerUtilisateurs(limite = 100) {
  const response = await databases.listDocuments(DB_ID, COLLECTIONS.USERS, [
    Query.orderDesc('dateInscription'),
    Query.limit(limite),
  ]);
  return response.documents;
}

/**
 * Bannit ou débannit un utilisateur (empêche/rétablit son accès
 * — la vérification effective se fait à la connexion, à ajouter
 * dans authService si besoin d'un blocage strict).
 */
export async function toggleBanUtilisateur(userId, banniActuellement) {
  await databases.updateDocument(DB_ID, COLLECTIONS.USERS, userId, {
    banni: !banniActuellement,
  });
}

/**
 * Attribue le badge vérifié bleu gratuitement (décision admin,
 * sans passer par le paiement de 5000F).
 */
export async function attribuerBadgeVerifieGratuit(userId) {
  await databases.updateDocument(DB_ID, COLLECTIONS.USERS, userId, {
    badgeVerifie: true,
  });
}

/**
 * Retire le badge vérifié d'un utilisateur.
 */
export async function retirerBadgeVerifie(userId) {
  await databases.updateDocument(DB_ID, COLLECTIONS.USERS, userId, {
    badgeVerifie: false,
  });
}
