// followService.js - LEIB
// Gère les relations "follow" entre utilisateurs (collection Follows).

import { databases, DB_ID, COLLECTIONS, ID, Query } from '../config/appwrite';

export async function suivreUtilisateur(followerId, followingId) {
  if (followerId === followingId) return { success: false };
  const existant = await databases.listDocuments(DB_ID, COLLECTIONS.FOLLOWS, [
    Query.equal('followerId', followerId),
    Query.equal('followingId', followingId),
  ]);
  if (existant.documents.length > 0) return { success: true, dejaSuivi: true };

  await databases.createDocument(DB_ID, COLLECTIONS.FOLLOWS, ID.unique(), {
    followerId,
    followingId,
    date: new Date().toISOString(),
  });
  return { success: true };
}

export async function neplusSuivreUtilisateur(followerId, followingId) {
  const existant = await databases.listDocuments(DB_ID, COLLECTIONS.FOLLOWS, [
    Query.equal('followerId', followerId),
    Query.equal('followingId', followingId),
  ]);
  for (const doc of existant.documents) {
    await databases.deleteDocument(DB_ID, COLLECTIONS.FOLLOWS, doc.$id);
  }
  return { success: true };
}

export async function estSuivi(followerId, followingId) {
  const existant = await databases.listDocuments(DB_ID, COLLECTIONS.FOLLOWS, [
    Query.equal('followerId', followerId),
    Query.equal('followingId', followingId),
  ]);
  return existant.documents.length > 0;
}

export async function compterFollowers(userId) {
  const res = await databases.listDocuments(DB_ID, COLLECTIONS.FOLLOWS, [
    Query.equal('followingId', userId),
  ]);
  return res.total;
}

export async function compterSuivis(userId) {
  const res = await databases.listDocuments(DB_ID, COLLECTIONS.FOLLOWS, [
    Query.equal('followerId', userId),
  ]);
  return res.total;
}
