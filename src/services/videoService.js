// =====================================================
// videoService.js - LEIB
// Récupère les vidéos du feed depuis Appwrite.
// =====================================================

import { databases, DB_ID, COLLECTIONS, Query } from '../config/appwrite';

/**
 * Récupère une liste de vidéos pour le feed, triées par date
 * de publication décroissante (les plus récentes en premier).
 */
export async function getFeedVideos(limite = 10) {
  const response = await databases.listDocuments(DB_ID, COLLECTIONS.VIDEOS, [
    Query.orderDesc('datePublication'),
    Query.limit(limite),
  ]);

  return response.documents;
}
