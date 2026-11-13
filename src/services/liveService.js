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
import { payerFraisFixe, payerAccesLive, payerDon, crediterSolde } from './paymentService';
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
    await payerAccesLive({ userId, liveId, createurId });
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

  await payerDon({ userId, liveId, createurId, montant });
  const { partCreateur } = calculerRepartitionDon(montant);

  return { success: true, partCreateur };
}
