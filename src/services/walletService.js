// =====================================================
// walletService.js - LEIB
// Gère tout ce qui touche au solde LEIB Pay d'un
// utilisateur : historique des transactions et retraits
// vers SebPay Africa (MTN, Orange, Virement, Stripe).
// =====================================================

import { databases, DB_ID, COLLECTIONS, ID, Query } from '../config/appwrite';
import { demanderRetrait } from '../config/sebpay';

// Montant minimum de retrait, pour éviter les frais disproportionnés
export const MONTANT_MIN_RETRAIT = 2000;

/**
 * Récupère l'historique des transactions où l'utilisateur est
 * soit payeur, soit bénéficiaire (créateur ou admin).
 * Note: Appwrite ne permet pas un "OR" entre deux attributs
 * différents en une seule requête, donc on fait deux requêtes
 * et on fusionne les résultats, triés par date.
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

  // Dédoublonnage (au cas où l'utilisateur est à la fois payeur ET bénéficiaire)
  const unique = Array.from(new Map(toutes.map((t) => [t.$id, t])).values());

  return unique.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limite);
}

/**
 * Demande un retrait du solde LEIB Pay vers Mobile Money,
 * virement bancaire ou Stripe. Le montant est immédiatement
 * débité du solde ; le virement effectif se fait côté SebPay
 * (statut "en attente" jusqu'à validation admin si nécessaire).
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {number} params.montant
 * @param {'mtn_momo'|'orange_money'|'bank_transfer'|'stripe'} params.methode
 * @param {Object} params.details - numéro de téléphone / IBAN / etc.
 */
export async function retirerSolde({ userId, montant, methode, details }) {
  if (montant < MONTANT_MIN_RETRAIT) {
    throw new Error(`Le retrait minimum est de ${MONTANT_MIN_RETRAIT} F.`);
  }

  const profil = await databases.getDocument(DB_ID, COLLECTIONS.USERS, userId);
  if ((profil.soldeLeibPay || 0) < montant) {
    throw new Error('Solde LEIB Pay insuffisant.');
  }

  // 1. Demander le virement auprès de SebPay
  const retrait = await demanderRetrait({ montant, methode, userId, details });

  // 2. Débiter immédiatement le solde local
  await databases.updateDocument(DB_ID, COLLECTIONS.USERS, userId, {
    soldeLeibPay: profil.soldeLeibPay - montant,
  });

  // 3. Enregistrer la transaction de retrait pour l'historique + l'admin
  //    (statutRetrait permet à l'admin de suivre/valider le virement réel)
  await databases.createDocument(DB_ID, COLLECTIONS.TRANSACTIONS, ID.unique(), {
    type: 'retrait',
    montant,
    partAdmin: 0,
    partCreateur: 0,
    payeurId: userId,
    beneficiaireId: userId,
    videoId: null,
    referenceSebpay: retrait.payout_id || retrait.transaction_id || null,
    statutRetrait: 'en_attente',
    date: new Date().toISOString(),
  });

  return retrait;
}
