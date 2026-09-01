// =====================================================
// Configuration Cloudinary - LEIB
// Utilisé pour : l'optimisation/transformation des images
// ET comme solution de secours (fallback) si l'upload
// vers Bunny échoue.
// =====================================================

export const CLOUDINARY_CONFIG = {
  cloudName: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY,
  apiSecret: process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET, // ⚠️ ne jamais utiliser côté client en prod, voir note en bas
  uploadPreset: process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
  baseUploadUrl: 'https://api.cloudinary.com/v1_1',
};

/**
 * Upload un fichier (image ou vidéo) vers Cloudinary via un "unsigned upload preset".
 * C'est la méthode recommandée pour un upload direct depuis le mobile,
 * car elle ne nécessite pas d'exposer l'API secret dans l'app.
 *
 * @param {string} fileUri - URI locale du fichier (image ou vidéo)
 * @param {'image'|'video'} resourceType
 */
export async function uploadToCloudinary(fileUri, resourceType = 'image') {
  const url = `${CLOUDINARY_CONFIG.baseUploadUrl}/${CLOUDINARY_CONFIG.cloudName}/${resourceType}/upload`;

  const formData = new FormData();
  formData.append('file', {
    uri: fileUri,
    type: resourceType === 'video' ? 'video/mp4' : 'image/jpeg',
    name: resourceType === 'video' ? 'upload.mp4' : 'upload.jpg',
  });
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Échec upload Cloudinary: ${response.status}`);
  }

  const data = await response.json();
  return {
    url: data.secure_url,
    publicId: data.public_id,
  };
}

/**
 * Construit une URL d'image transformée (redimensionnée, optimisée)
 * Exemple: getOptimizedImageUrl('avatar123', 200, 200)
 */
export function getOptimizedImageUrl(publicId, width = 400, height = 400) {
  return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload/w_${width},h_${height},c_fill,q_auto,f_auto/${publicId}`;
}

// NOTE SÉCURITÉ:
// apiSecret ne doit JAMAIS être utilisé pour des appels signés depuis l'app mobile.
// Pour tout upload signé (plus sécurisé), il faut passer par un petit backend
// Node.js qui génère la signature - voir src/services/ pour une future évolution.
