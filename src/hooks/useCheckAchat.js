import { useEffect, useState } from 'react';
import { databases, DB_ID, COLLECTIONS, Query } from '../config/appwrite';

export default function useCheckAchat(videoId, userId) {
  const [debloque, setDebloque] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifier() {
      if (!userId || !videoId) {
        setLoading(false);
        return;
      }
      try {
        const res = await databases.listDocuments(DB_ID, COLLECTIONS.TRANSACTIONS, [
          Query.equal('type', 'deblocage_video'),
          Query.equal('payeurId', userId),
          Query.equal('videoId', videoId),
          Query.limit(1),
        ]);
        setDebloque(res.total > 0);
      } catch (e) {
        console.warn('[useCheckAchat] Erreur de vérification:', e.message);
      } finally {
        setLoading(false);
      }
    }
    verifier();
  }, [videoId, userId]);

  return { debloque, loading, setDebloque };
}
