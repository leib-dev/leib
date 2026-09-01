// =====================================================
// Smart Upload - LEIB
// Stratégie: on essaie TOUJOURS Bunny en premier (plus rapide
// en Afrique). Si l'upload échoue (réseau, quota, erreur API),
// on bascule automatiquement sur Cloudinary pour ne jamais
// bloquer le créateur.
// =====================================================

import {
  createBunnyStreamVideo,
  uploadBunnyStreamVideo,
  getBunnyStreamHlsUrl,
} from '../config/bunny';
import { uploadToCloudinary } from '../config/cloudinary';

/**
 * Upload une vidéo en utilisant la stratégie Smart Upload.
 * @param {string} fileUri - URI locale de la vidéo à uploader
 * @param {string} title - Titre de la vidéo
 * @returns {{ provider: 'bunny'|'cloudinary', playbackUrl: string, rawId: string }}
 */
export async function smartUploadVideo(fileUri, title) {
  // --- Tentative 1 : Bunny Stream ---
  try {
    const video = await createBunnyStreamVideo(title);
    await uploadBunnyStreamVideo(video.guid, fileUri);

    return {
      provider: 'bunny',
      playbackUrl: getBunnyStreamHlsUrl(video.guid),
      rawId: video.guid,
    };
  } catch (bunnyError) {
    console.warn('[SmartUpload] Bunny a échoué, bascule vers Cloudinary:', bunnyError.message);
  }

  // --- Tentative 2 : Cloudinary (fallback) ---
  try {
    const result = await uploadToCloudinary(fileUri, 'video');
    return {
      provider: 'cloudinary',
      playbackUrl: result.url,
      rawId: result.publicId,
    };
  } catch (cloudinaryError) {
    console.error('[SmartUpload] Cloudinary a aussi échoué:', cloudinaryError.message);
    throw new Error("Échec de l'upload vidéo sur les deux services (Bunny et Cloudinary).");
  }
}

/**
 * Upload une image (ex: miniature, avatar) - va directement sur Cloudinary
 * car c'est le service optimisé pour les images dans LEIB.
 */
export async function uploadImage(fileUri) {
  const result = await uploadToCloudinary(fileUri, 'image');
  return result.url;
}
