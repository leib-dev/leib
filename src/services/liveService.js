// =====================================================
// liveService.js - LEIB
// Gère le cycle de vie complet d'un live :
// démarrage (10 000F → 100% admin), accès spectateur
// (10 000F, 60% admin / 40% créateur), dons pendant le
// live (60/40), et clôture du live.
// =====================================================

import { databases, DB_ID, COLLECTIONS, ID, Query, ADMIN_ID } from '../config/appwrite';
import { obtenirTokenLive, LIVEKIT_CONFIG } from '../config/livekit';
import { TARIFS, calculerRepartitionDon } from '../config/monetization';
import { payerFraisFixe, crediterSolde } from './paymentService';
import { initierPaiement, verifierPaiement } from '../config/sebpay';

/**
 * Démarre un nouveau live pour un créateur.
 * Paie les 10 000F de lancement (100% admin), crée une salle
 * LiveKit (identifiant unique, la salle existe dès qu'un
 * participant la rejoint), puis enregistre le live dans Appwrite.
 * Retourne aussi le token LiveKit permettant à l'hôte de publier
 * sa caméra/micro immédiatement.
 */
export async function demarrerLive({ userId, pseudo, titre }) {
  // 1. Paiement des frais de lancement (100% admin)
  await payerFraisFixe({
    userId,
    tarif: TARIFS.LANCER_LIVE,
    type: 'lancer_live',
    motif: 'Lancement live LEIB',
  });

  // 2. La salle LiveKit n'a besoin que d'un nom unique — elle est
  //    créée automatiquement côté serveur LiveKit au premier join.
  const nomSalle = `leib_live_${ID.unique()}`;

  // 3. Enregistrement du live dans Appwrite
  const live = await databases.createDocument(DB_ID, COLLECTIONS.LIVES, ID.unique(), {
    createurId: userId,
    createurPseudo: pseudo,
    titre: titre || `Live de ${pseudo}`,
    statut: 'en_cours', // 'en_cours' | 'termine'
    nomSalle,
    dateDebut: new Date().toISOString(),
    dateFin: null,
  });

  // 4. Token de connexion pour l'hôte (peut publier caméra + micro)
  const token = await obtenirTokenLive({
    nomSalle,
    identite: userId,
    pseudo,
    peutPublier: true,
  });

  return { live, token, serverUrl: LIVEKIT_CONFIG.serverUrl };
}

/**
 * Marque un live comme terminé.
 */
export async function arreterLive(liveId) {
  await databases.updateDocument(DB_ID, COLLECTIONS.LIVES, liveId, {
    statut: 'termine',
    dateFin: new Date().toISOString(),
  });
}

/**
 * Récupère la liste des lives actuellement en cours.
 */
export async function getLivesEnCours() {
  const resultat = await databases.listDocuments(DB_ID, COLLECTIONS.LIVES, [
    Query.equal('statut', 'en_cours'),
    Query.orderDesc('dateDebut'),
  ]);
  return resultat.documents;
}

/**
 * Paie l'accès à un live (10 000F, 60% admin / 40% créateur),
 * puis retourne le token LiveKit permettant de regarder
 * (peutPublier: false — un spectateur ne diffuse pas).
 * L'hôte n'a jamais besoin de payer son propre live.
 */
export async function accederLive({ userId, pseudo, liveId, createurId, nomSalle }) {
  if (userId !== createurId) {
    const tarif = TARIFS.ACCES_LIVE;
    const reference = `live_acces_${liveId}_${userId}_${Date.now()}`;

    const paiement = await initierPaiement({
      montant: tarif.montant,
      motif: 'Accès live LEIB',
      userId,
      reference,
    });

    const statut = await verifierPaiement(paiement.transaction_id);
    if (statut !== 'success') {
      throw new Error('Paiement non confirmé. Réessaie ou vérifie ton solde Mobile Money.');
    }

    await databases.createDocument(DB_ID, COLLECTIONS.TRANSACTIONS, ID.unique(), {
      type: 'acces_live',
      montant: tarif.montant,
      partAdmin: tarif.partAdmin,
      partCreateur: tarif.partCreateur,
      payeurId: userId,
      beneficiaireId: createurId,
      videoId: liveId,
      referenceSebpay: paiement.transaction_id,
      date: new Date().toISOString(),
    });

    await crediterSolde(ADMIN_ID, tarif.partAdmin, 'accès live');
    await crediterSolde(createurId, tarif.partCreateur, 'un spectateur a rejoint ton live');
  }

  const token = await obtenirTokenLive({
    nomSalle,
    identite: userId,
    pseudo,
    peutPublier: false,
  });

  return { token, serverUrl: LIVEKIT_CONFIG.serverUrl };
}

/**
 * Envoie un don pendant un live (montant libre, réparti 60/40).
 */
export async function envoyerDon({ userId, pseudo, liveId, createurId, montant }) {
  if (!montant || montant < 100) {
    throw new Error('Le don minimum est de 100 F.');
  }

  const { partAdmin, partCreateur } = calculerRepartitionDon(montant);
  const reference = `don_${liveId}_${userId}_${Date.now()}`;

  const paiement = await initierPaiement({
    montant,
    motif: 'Don pendant live LEIB',
    userId,
    reference,
  });

  const statut = await verifierPaiement(paiement.transaction_id);
  if (statut !== 'success') {
    throw new Error('Paiement du don non confirmé.');
  }

  await databases.createDocument(DB_ID, COLLECTIONS.TRANSACTIONS, ID.unique(), {
    type: 'don_live',
    montant,
    partAdmin,
    partCreateur,
    payeurId: userId,
    beneficiaireId: createurId,
    videoId: liveId,
    referenceSebpay: paiement.transaction_id,
    date: new Date().toISOString(),
  });

  await crediterSolde(ADMIN_ID, partAdmin, 'don live');
  await crediterSolde(createurId, partCreateur, pseudo ? `don reçu de @${pseudo}` : 'don reçu pendant ton live');

  return { success: true, partCreateur };
}
