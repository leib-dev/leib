// Règlement côté SERVEUR après confirmation du paiement Moov :
// enregistre la transaction métier, puis crédite admin / créateur.
// Idempotent : la transaction métier a un ID fixe (s_<id momo>) ; si elle existe déjà, on ne recrédite pas.
const { db, DB_ID, COL } = require('./_lib');
const { tarifPourTransaction } = require('./_tarifs');

async function crediter(userId, montant) {
  if (!userId || !(montant > 0)) return;
  // Lecture puis écriture (Appwrite n'a pas d'incrément atomique garanti ici).
  const u = await db.getDocument(DB_ID, COL.USERS, userId);
  await db.updateDocument(DB_ID, COL.USERS, userId, { soldeLeibPay: (u.soldeLeibPay || 0) + montant });
}

async function regler(t) {
  const tarif = tarifPourTransaction(t);
  if (!tarif) return { regle: false, raison: 'action ou montant refuse par le bareme' };
  const adminId = process.env.APPWRITE_ADMIN_ID;
  if (!adminId) return { regle: false, raison: 'APPWRITE_ADMIN_ID manquant' };
  const action = String(t.action).toLowerCase();

  let createurId = null;
  if (tarif.partCreateur > 0) {
    if (action === 'deblocage_video' && t.referenceCible) {
      try {
        const v = await db.getDocument(DB_ID, COL.VIDEOS, t.referenceCible);
        createurId = v[process.env.VIDEO_CREATOR_FIELD || 'createurId'] || null;
      } catch (_) {}
    }
    createurId = createurId || t.beneficiaireId || null;
  }
  // Pas de créateur identifiable : sa part reste à l'admin (rien n'est perdu).
  const partCreateur = createurId ? tarif.partCreateur : 0;
  const partAdmin = tarif.partAdmin + (createurId ? 0 : tarif.partCreateur);

  try {
    await db.createDocument(DB_ID, COL.TRANSACTIONS, 's_' + t.$id, {
      type: t.action,
      montant: tarif.montant,
      partAdmin,
      partCreateur,
      payeurId: t.payeurId,
      beneficiaireId: createurId || adminId,
      videoId: ['deblocage_video', 'acces_live', 'don_live'].includes(action) ? t.referenceCible || null : null,
      referenceSebpay: t.$id, // champ conservé : id de la transaction Momo
      date: new Date().toISOString(),
    });
  } catch (e) {
    if (e.code === 409) return { regle: false, raison: 'deja regle' };
    throw e;
  }
  await crediter(adminId, partAdmin);
  await crediter(createurId, partCreateur);
  return { regle: true, partAdmin, partCreateur, createurId };
}

module.exports = { regler };
