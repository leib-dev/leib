// =====================================================
// uploadService.js - LEIB
// Orchestre la publication d'une vidéo par un créateur :
// 1. Paie les frais fixes de 500F (100% admin)
// 2. Upload la vidéo via Smart Upload (Bunny → Cloudinary)
// 3. Crée le document vidéo dans Appwrite (apparaît au feed)
// 4. Promeut l'utilisateur au rôle "creator" s'il était "viewer"
// =====================================================

import { databases, DB_ID, COLLECTIONS, ID, ADMIN_ID } from '../config/appwrite';
import { TARIFS } from '../config/monetization';
import { payerFraisFixe } from './paymentService';
import { smartUploadVideo, uploadImage } from './smartUpload';

/**
 * Publie une nouvelle vidéo.
 *
 * @param {Object} params
 * @param {string} params.userId - Créateur qui publie
 * @param {string} params.pseudo - Pseudo affiché sur la vidéo
 * @param {string} params.videoUri - URI locale de la vidéo (depuis expo-image-picker)
 * @param {string} params.legende - Légende / description
 * @param {string} [params.miniatureUri] - URI locale d'une miniature optionnelle
 * @param {(etape: string) => void} [params.onProgress] - Callback pour informer l'UI de l'étape en cours
 */
export async function publierVideo({ userId, pseudo, videoUri, legende, miniatureUri, onProgress }) {
  // 1. Paiement des frais de publication (500F → 100% admin)
  //    L'admin LEIB est exempté : il ne se paie pas à lui-même.
  if (userId !== ADMIN_ID) {
    onProgress?.('paiement');
    await payerFraisFixe({
      userId,
      tarif: TARIFS.UPLOAD_VIDEO,
      type: 'upload_video',
      motif: 'Publication vidéo LEIB',
    });
  }

  // 2. Upload du fichier vidéo (Bunny en priorité, fallback Cloudinary)
  onProgress?.('upload_video');
  const resultatVideo = await smartUploadVideo(videoUri, legende || 'Vidéo LEIB');

  // 3. Upload de la miniature si fournie (toujours via Cloudinary)
  let urlMiniature = null;
  if (miniatureUri) {
    onProgress?.('upload_miniature');
    urlMiniature = await uploadImage(miniatureUri);
  }

  // 4. Création du document vidéo dans Appwrite (apparaît immédiatement au feed)
  onProgress?.('enregistrement');
  const document = await databases.createDocument(DB_ID, COLLECTIONS.VIDEOS, ID.unique(), {
    createurId: userId,
    createurPseudo: pseudo,
    urlLecture: resultatVideo.playbackUrl,
    fournisseur: resultatVideo.provider, // 'bunny' | 'cloudinary', utile pour le debug/admin
    miniature: urlMiniature,
    legende: legende || '',
    datePublication: new Date().toISOString(),
  });

  // 5. Promotion automatique en créateur (si c'était un simple viewer)
  await promouvoirCreateurSiNecessaire(userId);

  onProgress?.('termine');
  return document;
}

/**
 * Passe le rôle d'un utilisateur de "viewer" à "creator"
 * lors de sa première publication. Ne touche pas au rôle "admin".
 */
async function promouvoirCreateurSiNecessaire(userId) {
  const profil = await databases.getDocument(DB_ID, COLLECTIONS.USERS, userId);

  if (profil.role === 'viewer') {
    await databases.updateDocument(DB_ID, COLLECTIONS.USERS, userId, {
      role: 'creator',
    });
  }
}
