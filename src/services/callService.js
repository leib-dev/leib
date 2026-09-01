// =====================================================
// callService.js - LEIB
// Appels audio/vidéo 1-à-1 entre utilisateurs, réutilisant
// LiveKit (même infra que le live, mais salle privée à 2
// participants qui publient tous les deux caméra/micro).
// La détection d'appel entrant utilise Appwrite Realtime :
// fonctionne tant que l'app est ouverte (premier/arrière-plan).
// =====================================================

import { databases, DB_ID, COLLECTIONS, ID, Query, client, ADMIN_ID } from '../config/appwrite';
import { obtenirTokenLive, LIVEKIT_CONFIG } from '../config/livekit';
import { TARIFS } from '../config/monetization';
import { payerFraisFixe } from './paymentService';
import { envoyerPush } from './notificationService';

/**
 * Démarre un appel vers un autre utilisateur.
 * Facture l'appelant 10 000F (100% admin) — l'admin est exempté.
 * Crée une salle LiveKit privée + un document "calls" en statut
 * "en_attente", que l'appelé verra apparaître en temps réel (et
 * recevra aussi en notification push, même app fermée).
 * Retourne immédiatement le token pour que l'appelant rejoigne
 * la salle et attende la réponse.
 *
 * @param {Object} params
 * @param {string} params.callerId
 * @param {string} params.callerPseudo
 * @param {string} params.calleeId
 * @param {'audio'|'video'} params.type
 */
export async function demarrerAppel({ callerId, callerPseudo, calleeId, type }) {
  if (callerId !== ADMIN_ID) {
    await payerFraisFixe({
      userId: callerId,
      tarif: TARIFS.APPEL,
      type: 'appel',
      motif: `Appel ${type === 'video' ? 'vidéo' : 'audio'} LEIB`,
    });
  }

  const nomSalle = `leib_call_${ID.unique()}`;

  const appel = await databases.createDocument(DB_ID, COLLECTIONS.CALLS, ID.unique(), {
    callerId,
    callerPseudo,
    calleeId,
    type, // 'audio' | 'video'
    statut: 'en_attente', // 'en_attente' | 'accepte' | 'refuse' | 'termine'
    nomSalle,
    dateCreation: new Date().toISOString(),
  });

  const token = await obtenirTokenLive({
    nomSalle,
    identite: callerId,
    pseudo: callerPseudo,
    peutPublier: true, // dans un appel, les deux parties publient
  });

  // Notification push au destinataire — fonctionne même app fermée,
  // contrairement à Appwrite Realtime qui a besoin de l'app active.
  const destinataire = await databases.getDocument(DB_ID, COLLECTIONS.USERS, calleeId);
  if (destinataire.pushToken) {
    envoyerPush(
      destinataire.pushToken,
      `Appel ${type === 'video' ? 'vidéo' : 'audio'} LEIB`,
      `${callerPseudo} t'appelle...`
    );
  }

  return { appel, token, serverUrl: LIVEKIT_CONFIG.serverUrl };
}

/**
 * Répond à un appel entrant (accepter ou refuser).
 * Si accepté, retourne le token pour que l'appelé rejoigne
 * la même salle LiveKit que l'appelant.
 */
export async function repondreAppel({ appelId, accepter, userId, pseudo, nomSalle }) {
  await databases.updateDocument(DB_ID, COLLECTIONS.CALLS, appelId, {
    statut: accepter ? 'accepte' : 'refuse',
  });

  if (!accepter) return { accepte: false };

  const token = await obtenirTokenLive({
    nomSalle,
    identite: userId,
    pseudo,
    peutPublier: true,
  });

  return { accepte: true, token, serverUrl: LIVEKIT_CONFIG.serverUrl };
}

/**
 * Termine un appel (raccroche) — utilisable par l'une ou l'autre partie.
 */
export async function terminerAppel(appelId) {
  await databases.updateDocument(DB_ID, COLLECTIONS.CALLS, appelId, {
    statut: 'termine',
  });
}

/**
 * Écoute en temps réel les appels entrants pour un utilisateur.
 * Appelle `onAppelEntrant(document)` dès qu'un nouvel appel en
 * statut "en_attente" lui est destiné. Retourne une fonction
 * pour arrêter l'écoute (à appeler au démontage du composant).
 */
export function ecouterAppelsEntrants(userId, onAppelEntrant) {
  const unsubscribe = client.subscribe(
    `databases.${DB_ID}.collections.${COLLECTIONS.CALLS}.documents`,
    (event) => {
      const appel = event.payload;
      const estCreation = event.events.some((e) => e.endsWith('.create'));

      if (estCreation && appel.calleeId === userId && appel.statut === 'en_attente') {
        onAppelEntrant(appel);
      }
    }
  );

  return unsubscribe;
}

/**
 * Écoute la réponse à un appel qu'on vient de passer (accepté/refusé),
 * utile côté appelant pour savoir quand basculer vers l'écran d'appel
 * ou afficher "Appel refusé".
 */
export function ecouterReponseAppel(appelId, onChangement) {
  const unsubscribe = client.subscribe(
    `databases.${DB_ID}.collections.${COLLECTIONS.CALLS}.documents.${appelId}`,
    (event) => {
      onChangement(event.payload);
    }
  );

  return unsubscribe;
}
