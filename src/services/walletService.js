// ==================================================================
// walletService.js - LEIB
// Gère tout ce qui touche au solde LEIB Pay d'un utilisateur :
// historique des transactions et retraits Mobile Money (manuel, validé par l'admin).
// ==================================================================

import { databases, DB_ID, COLLECTIONS, ID, Query } from '../config/appwrite';

// Montant minimum de retrait, pour éviter les frais disproportionnés
export const MONTANT_MIN_RETRAIT = 2000;

/**
 * Récupère l'historique des transactions où l'utilisateur est
 * soit payeur, soit bénéficiaire (créateur ou admin).
 */
export async function getHistoriqueTransactions(userId, limite = 30) {
  const [commePayeur, commeBeneficiaire] = await Promise.all([
    databases.listDocuments(DB_ID, COLLECTIONS.TRANSACTIONS, [
      Query.equal('payeurId', userId),
      Query.orderDesc('date'),
      Query.limit(limite),
    ]),
    databases.listDocuments(DB_ID, COLLECTIONS.TRANSACTIONS, [
      Query.equal('beneficiaireId', userId),
      Query.orderDesc('date'),
      Query.limit(limite),
    ]),
  ]);

  const toutes = [...commePayeur.documents, ...commeBeneficiaire.documents];
  const unique = Array.from(new Map(toutes.map((t) => [t.$id, t])).values());

  return unique.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limite);
}

/**
 * Demande un retrait du solde LEIB Pay vers Mobile Money.
 * Le montant est immédiatement débité du solde ; le virement réel
 * est fait manuellement par l'admin (statut "en_attente" jusqu'à validation).
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {number} params.montant
 * @param {'mtn_momo'|'orange_money'} params.methode
 * @param {Object} params.details - numéro de téléphone momo
 */
export async function retirerSolde({ userId, montant, methode, details }) {
  if (montant < MONTANT_MIN_RETRAIT) {
    throw new Error(`Le retrait minimum est de ${MONTANT_MIN_RETRAIT} F.`);
  }

  const profil = await databases.getDocument(DB_ID, COLLECTIONS.USERS, userId);
  if ((profil.soldeLeibPay || 0) < montant) {
    throw new Error('Solde LEIB Pay insuffisant.');
  }

  // 1. Débiter immédiatement le solde local
  await databases.updateDocument(DB_ID, COLLECTIONS.USERS, userId, {
    soldeLeibPay: profil.soldeLeibPay - montant,
  });

  // 2. Enregistrer la transaction de retrait pour l'historique + l'admin
  //    (statutRetrait permet à l'admin de suivre/valider le virement manuel)
  const transaction = await databases.createDocument(DB_ID, COLLECTIONS.TRANSACTIONS, ID.unique(), {
    type: 'retrait',
    montant,
    partAdmin: 0,
    partCreateur: 0,
    payeurId: userId,
    beneficiaireId: userId,
    videoId: null,
    referenceSebpay: null,
    statutRetrait: 'en_attente',
    date: new Date().toISOString(),
  });

  return transaction;
}
