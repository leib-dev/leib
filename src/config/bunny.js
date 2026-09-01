// =====================================================
// Configuration Bunny CDN + Bunny Stream - LEIB
// Bunny est la solution PRIORITAIRE pour les vidéos VOD
// uploadées (meilleure latence en Afrique - zones Lagos,
// Johannesburg, Cape Town).
// Le LIVE ne passe plus par Bunny mais par LiveKit
// (voir src/config/livekit.js) — nécessaire pour permettre
// la diffusion et la lecture directement depuis un navigateur.
// =====================================================

export const BUNNY_CONFIG = {
  // --- Bunny Storage (stockage brut, ex: miniatures, fichiers annexes) ---
  storageZone: process.env.EXPO_PUBLIC_BUNNY_STORAGE_ZONE,
  storageKey: process.env.EXPO_PUBLIC_BUNNY_STORAGE_KEY,
  cdnUrl: process.env.EXPO_PUBLIC_BUNNY_CDN_URL, // ex: https://leib.b-cdn.net

  // --- Bunny Stream (encodage + lecture HLS des vidéos) ---
  streamLibraryId: process.env.EXPO_PUBLIC_BUNNY_STREAM_LIBRARY_ID,
  streamApiKey: process.env.EXPO_PUBLIC_BUNNY_STREAM_API_KEY,
  streamBaseUrl: 'https://video.bunnycdn.com/library',
};

/**
 * Construit l'URL d'upload vers Bunny Storage pour un fichier donné
 * (utilisé pour les fichiers non-vidéo : miniatures, avatars, etc.)
 */
export function getBunnyStorageUploadUrl(fileName) {
  return `https://storage.bunnycdn.com/${BUNNY_CONFIG.storageZone}/${fileName}`;
}

/**
 * Construit l'URL publique CDN pour lire un fichier stocké sur Bunny Storage
 */
export function getBunnyCdnUrl(fileName) {
  return `${BUNNY_CONFIG.cdnUrl}/${fileName}`;
}

/**
 * Crée une nouvelle vidéo dans Bunny Stream (étape 1 avant l'upload binaire)
 * Retourne l'objet vidéo créé, contenant son guid (identifiant unique)
 */
export async function createBunnyStreamVideo(title) {
  const response = await fetch(
    `${BUNNY_CONFIG.streamBaseUrl}/${BUNNY_CONFIG.streamLibraryId}/videos`,
    {
      method: 'POST',
      headers: {
        AccessKey: BUNNY_CONFIG.streamApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    }
  );

  if (!response.ok) {
    throw new Error(`Échec création vidéo Bunny Stream: ${response.status}`);
  }

  return response.json();
}

/**
 * Envoie le fichier binaire vidéo vers Bunny Stream pour un guid donné
 */
export async function uploadBunnyStreamVideo(videoGuid, fileUri) {
  const uploadUrl = `${BUNNY_CONFIG.streamBaseUrl}/${BUNNY_CONFIG.streamLibraryId}/videos/${videoGuid}`;

  // En React Native, on lit le fichier local comme un blob avant l'envoi
  const fileResponse = await fetch(fileUri);
  const fileBlob = await fileResponse.blob();

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      AccessKey: BUNNY_CONFIG.streamApiKey,
    },
    body: fileBlob,
  });

  if (!response.ok) {
    throw new Error(`Échec upload binaire Bunny Stream: ${response.status}`);
  }

  return true;
}

/**
 * Construit l'URL de lecture HLS (.m3u8) pour une vidéo Bunny Stream
 * C'est cette URL qui sera utilisée dans le lecteur vidéo de l'app
 */
export function getBunnyStreamPlaybackUrl(videoGuid) {
  return `https://iframe.mediadelivery.net/embed/${BUNNY_CONFIG.streamLibraryId}/${videoGuid}`;
}

export function getBunnyStreamHlsUrl(videoGuid) {
  return `https://${BUNNY_CONFIG.streamLibraryId}.b-cdn.net/${videoGuid}/playlist.m3u8`;
}
