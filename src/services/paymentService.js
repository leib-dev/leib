// =====================================================
// paymentService.js - LEIB
// Orchestre un paiement de bout en bout :
// 1. Initie le paiement SebPay
// 2. Une fois confirmé, enregistre la transaction
// 3. Répartit les gains (admin / créateur) dans les soldes
//    LEIB Pay via Appwrite
// =====================================================

import { initierPaiement, verifierPaiement } from '../config/sebpay';
import {
  databases,
  DB_ID,
  COLLECTIONS,
  ID,
  ADMIN_ID,
} from '../config/appwrite';
import { notifierGainRecu } from './notificationService';

/**
 * Débloque une vidéo pour un spectateur.
 * Retourne { success: true } une fois le solde créditeur mis à jour.
 *
 * @param {Object} params
 * @param {string} params.userId - Spectateur qui paie
 * @param {string} params.videoId - Vidéo à débloquer
 * @param {string} params.createurId - Créateur de la vidéo (reçoit sa part)
 * @param {Object} params.tarif - Un objet de TARIFS (ex: TARIFS.DEBLOQUER_VIDEO)
 */
export async function debloquerVideo({ userId, videoId, createurId, tarif }) {
  const reference = `unlock_${videoId}_${userId}_${Date.now()}`;

  const paiement = await initierPaiement({
    montant: tarif.montant,
    motif: 'Déblocage vidéo LEIB',
    userId,
    reference,
  });

  const statut = await verifierPaiement(paiement.transaction_id);

  if (statut !== 'success') {
    throw new Error('Paiement non confirmé. Réessaie ou vérifie ton solde Mobile Money.');
  }

  await databases.createDocument(DB_ID, COLLECTIONS.TRANSACTIONS, ID.unique(), {
    type: 'deblocage_video',
    montant: tarif.montant,
    partAdmin: tarif.partAdmin,
    partCreateur: tarif.partCreateur,
    payeurId: userId,
    beneficiaireId: createurId,
    videoId,
    referenceSebpay: paiement.transaction_id,
    date: new Date().toISOString(),
  });

  await crediterSolde(ADMIN_ID, tarif.partAdmin, 'déblocage vidéo');
  if (tarif.partCreateur > 0) {
    await crediterSolde(createurId, tarif.partCreateur, 'ta vidéo a été débloquée');
  }

  return { success: true };
}

/**
 * Paie des frais fixes qui vont à 100% à l'admin LEIB
 * (upload vidéo, boost, lancement live, badges...).
 * Réutilisée par uploadService et liveService, et plus
 * tard par le boost et les badges.
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {Object} params.tarif - Un objet de TARIFS (ex: TARIFS.UPLOAD_VIDEO)
 * @param {string} params.type - Type de transaction (ex: 'upload_video')
 * @param {string} params.motif - Description affichée dans la webview de paiement
 */
export async function payerFraisFixe({ userId, tarif, type, motif }) {
  const reference = `${type}_${userId}_${Date.now()}`;

  const paiement = await initierPaiement({
    montant: tarif.montant,
    motif,
    userId,
    reference,
  });

  const statut = await verifierPaiement(paiement.transaction_id);
  if (statut !== 'success') {
    throw new Error('Paiement non confirmé. Réessaie ou vérifie ton solde Mobile Money.');
  }

  await databases.createDocument(DB_ID, COLLECTIONS.TRANSACTIONS, ID.unique(), {
    type,
    montant: tarif.montant,
    partAdmin: tarif.partAdmin,
    partCreateur: 0,
    payeurId: userId,
    beneficiaireId: ADMIN_ID,
    videoId: null,
    referenceSebpay: paiement.transaction_id,
    date: new Date().toISOString(),
  });

  await crediterSolde(ADMIN_ID, tarif.partAdmin);

  return { success: true, referenceSebpay: paiement.transaction_id };
}

/**
 * Ajoute un montant au solde LEIB Pay d'un utilisateur, et le
 * notifie par SMS (sauf l'admin, pour éviter le spam sur un
 * gros volume de transactions). Le SMS arrive même app fermée.
 * Lit le solde actuel puis écrit la nouvelle valeur (pas d'opération
 * atomique native sur Appwrite, donc à surveiller en cas de forte
 * concurrence — une Cloud Function dédiée serait plus sûre en prod).
 */
export async function crediterSolde(userId, montant, motif = 'gain LEIB') {
  const profil = await databases.getDocument(DB_ID, COLLECTIONS.USERS, userId);
  const nouveauSolde = (profil.soldeLeibPay || 0) + montant;

  await databases.updateDocument(DB_ID, COLLECTIONS.USERS, userId, {
    soldeLeibPay: nouveauSolde,
  });

  if (userId !== ADMIN_ID && profil.telephone) {
    notifierGainRecu(profil.telephone, montant, motif); // ne bloque jamais l'action principale
  }

  return nouveauSolde;
}
