// =====================================================
// livekit.js - LEIB
// Le token LiveKit doit être signé côté serveur (avec la
// clé secrète LiveKit) car cette clé ne doit JAMAIS être
// exposée dans l'app mobile/web. On appelle donc une
// Appwrite Function (voir functions/livekit-token/) qui
// génère le token et le retourne à l'app.
// =====================================================

export const LIVEKIT_CONFIG = {
  serverUrl: process.env.EXPO_PUBLIC_LIVEKIT_URL,
  tokenEndpoint: process.env.EXPO_PUBLIC_LIVEKIT_TOKEN_ENDPOINT,
};

/**
 * Demande un token de connexion LiveKit pour rejoindre une salle.
 *
 * @param {Object} params
 * @param {string} params.nomSalle - Identifiant unique de la salle (roomName)
 * @param {string} params.identite - ID de l'utilisateur qui se connecte
 * @param {string} params.pseudo - Pseudo affiché aux autres participants
 * @param {boolean} params.peutPublier - true pour l'hôte (caméra/micro), false pour un spectateur
 */
export async function obtenirTokenLive({ nomSalle, identite, pseudo, peutPublier }) {
  const response = await fetch(LIVEKIT_CONFIG.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomName: nomSalle,
      identity: identite,
      name: pseudo,
      canPublish: peutPublier,
    }),
  });

  if (!response.ok) {
    throw new Error(`Échec récupération token LiveKit: ${response.status}`);
  }

  const data = await response.json();
  return data.token;
}
