// ==============================================================
// paymentService.js - LEIB
// Paiement de bout en bout par Moov Money (USSD autopilote).
// Le client lance le paiement et attend. TOUT LE RESTE se fait côté SERVEUR (Vercel) :
// confirmation du SMS Moov, enregistrement de la transaction, crédit admin / créateur.
// L'app ne crédite plus jamais un solde pour ces paiements.
// ==============================================================

import { creerPaiementMomoDirect, attendreConfirmationMomo } from './momoDirectService';
import { databases, DB_ID, COLLECTIONS, ADMIN_ID } from '../config/appwrite';
import { notifierGainRecu } from './notificationService';
import { TARIFS } from '../config/monetization';

/**
 * Encaisse par Moov sur le numéro du profil du client. Le client confirme avec son code Moov.
 * `action` doit être connue du serveur (voir api/_tarifs.js) ; le montant est imposé par le barème serveur.
 */
async function encaisserMomo({ userId, montant, action, referenceCible, beneficiaireId }) {
  const t = await creerPaiementMomoDirect({ userId, montant, action, referenceCible, beneficiaireId });
  const statut = await attendreConfirmationMomo(t.$id);
  if (statut === 'echoue') {
    throw new Error("Le paiement Moov n'a pas pu être lancé. Vérifie le numéro Moov Money de ton profil.");
  }
  if (statut !== 'confirmé') {
    throw new Error('Paiement non confirmé. Réessaie ou vérifie ton solde Moov Money.');
  }
  return t.$id;
}

/** Débloque une vidéo (100F : 50 admin / 50 créateur, réparti par le serveur). */
export async function debloquerVideo({ userId, videoId, createurId, tarif }) {
  const ref = await encaisserMomo({
    userId,
    montant: tarif.montant,
    action: 'deblocage_video',
    referenceCible: videoId,
    beneficiaireId: createurId,
  });
  return { success: true, referenceSebpay: ref };
}

/**
 * Frais fixes 100% admin (upload vidéo, boost, live, badges...).
 * `type` = 'upload_video' | 'boost_video' | 'lancer_live' | 'badge_vip' | 'badge_verifie' | 'appel'
 */
export async function payerFraisFixe({ userId, tarif, type }) {
  const ref = await encaisserMomo({ userId, montant: tarif.montant, action: type, referenceCible: null });
  return { success: true, referenceSebpay: ref };
}

/** Accès à un live (10 000F : 6 000 admin / 4 000 créateur, réparti par le serveur). */
export async function payerAccesLive({ userId, liveId, createurId }) {
  const ref = await encaisserMomo({
    userId,
    montant: TARIFS.ACCES_LIVE.montant,
    action: 'acces_live',
    referenceCible: liveId,
    beneficiaireId: createurId,
  });
  return { success: true, referenceSebpay: ref };
}

/** Don pendant un live (montant libre >= 100F, réparti 60/40 par le serveur). */
export async function payerDon({ userId, liveId, createurId, montant }) {
  const ref = await encaisserMomo({
    userId,
    montant,
    action: 'don_live',
    referenceCible: liveId,
    beneficiaireId: createurId,
  });
  return { success: true, referenceSebpay: ref };
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
