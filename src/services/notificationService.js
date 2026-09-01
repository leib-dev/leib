// =====================================================
// notificationService.js - LEIB
// Envoie des SMS via l'Appwrite Function serveur.
// N'échoue jamais bruyamment : un SMS raté ne doit pas
// bloquer l'action principale (paiement, retrait...) qui
// vient de réussir. On log l'erreur, c'est tout.
// =====================================================

const SMS_ENDPOINT = process.env.EXPO_PUBLIC_SMS_ENDPOINT;
const PUSH_ENDPOINT = process.env.EXPO_PUBLIC_PUSH_ENDPOINT;

/**
 * Envoie un SMS à un utilisateur, sans jamais faire planter
 * l'action qui l'a déclenché en cas d'échec.
 *
 * @param {string} telephone - Numéro au format international (+229...)
 * @param {string} message
 */
export async function envoyerSms(telephone, message) {
  if (!telephone) return; // pas de numéro renseigné, on ignore silencieusement

  try {
    await fetch(SMS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telephone, message }),
    });
  } catch (error) {
    console.warn('[SMS] Échec envoi notification:', error.message);
  }
}

/**
 * Envoie une notification push native (Expo Notifications).
 * Fonctionne même quand l'app LEIB est totalement fermée — ce
 * qu'Appwrite Realtime ne permet pas (limite notée pour les
 * appels entrants). N'échoue jamais bruyamment.
 *
 * @param {string} pushToken - Token Expo Push de l'utilisateur (voir pushNotifications.js)
 * @param {string} titre
 * @param {string} corps
 */
export async function envoyerPush(pushToken, titre, corps) {
  if (!pushToken) return;

  try {
    await fetch(PUSH_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pushToken, title: titre, body: corps }),
    });
  } catch (error) {
    console.warn('[Push] Échec envoi notification:', error.message);
  }
}

// --- Messages prêts à l'emploi pour les événements LEIB courants ---

export function notifierDonRecu(telephone, montant, donateurPseudo) {
  return envoyerSms(
    telephone,
    `LEIB : tu as reçu un don de ${montant} F de @${donateurPseudo} 🎁`
  );
}

export function notifierGainRecu(telephone, montant, motif) {
  return envoyerSms(telephone, `LEIB : +${montant} F sur ton solde LEIB Pay (${motif}).`);
}

export function notifierRetraitApprouve(telephone, montant) {
  return envoyerSms(
    telephone,
    `LEIB : ton retrait de ${montant} F a été approuvé et est en cours de virement.`
  );
}
