// audioService.js - LEIB
// Publication d'un audio, même logique que uploadService.js
// (mêmes tarifs, exemption admin, promotion en créateur).

import { databases, DB_ID, COLLECTIONS, ID, ADMIN_ID } from '../config/appwrite';
import { TARIFS } from '../config/monetization';
import { payerFraisFixe } from './paymentService';
import { smartUploadAudio, uploadImage } from './smartUpload';
import { promouvoirCreateurSiNecessaire } from './uploadService';

export async function publierAudio({ userId, pseudo, audioUri, legende, miniatureUri, onProgress }) {
  // 1. Paiement des frais (100% admin), l'admin est exempté
  if (userId !== ADMIN_ID) {
    onProgress?.('paiement');
    await payerFraisFixe({
      userId,
      tarif: TARIFS.UPLOAD_VIDEO,
      type: 'upload_audio',
      motif: 'Publication audio LEIB',
    });
  }

  // 2. Upload du fichier audio
  onProgress?.('upload_audio');
  const resultatAudio = await smartUploadAudio(audioUri);

  // 3. Couverture optionnelle
  let urlMiniature = null;
  if (miniatureUri) {
    onProgress?.('upload_miniature');
    urlMiniature = await uploadImage(miniatureUri);
  }

  // 4. Création du document audio dans Appwrite
  onProgress?.('enregistrement');
  const document = await databases.createDocument(DB_ID, COLLECTIONS.AUDIOS, ID.unique(), {
    createurId: userId,
    createurPseudo: pseudo,
    urlLecture: resultatAudio.playbackUrl,
    fournisseur: resultatAudio.provider,
    miniature: urlMiniature,
    legende: legende || '',
    datePublication: new Date().toISOString(),
  });

  // 5. Promotion automatique en créateur
  await promouvoirCreateurSiNecessaire(userId);

  onProgress?.('termine');
  return document;
}
