// Le téléphone marchand demande : "y a-t-il un paiement à lancer ?"
// Réponse : seulement { id, phone, amount }. Le code secret Moov reste dans l'app Android.
const { Query, db, DB_ID, COL, auth, normPhone } = require('../_lib');
const { tarifPourTransaction } = require('../_tarifs');

const MAX_AMOUNT = parseInt(process.env.MAX_AMOUNT || '50000', 10);

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  if (!auth(req)) return res.status(401).json({ error: 'Cle invalide' });
  try {
    const cinqMin = new Date(Date.now() - 5 * 60 * 1000).toISOString(); // pas de vieux paiements
    const r = await db.listDocuments(DB_ID, COL.TRANSACTIONS, [
      Query.equal('type', 'momo_direct'),
      Query.equal('statutMomoDirect', 'en_attente'),
      Query.greaterThan('date', cinqMin),
      Query.orderAsc('date'),
      Query.limit(5),
    ]);
    for (const t of r.documents) {
      const amount = Number(t.montant);
      const operateur = String(t.operateur || 'moov').toLowerCase();
      let phone = null;
      const tarif = tarifPourTransaction(t);
      if (operateur === 'moov' && tarif && Number.isInteger(amount) && amount > 0 && amount <= MAX_AMOUNT && t.payeurId) {
        try {
          const u = await db.getDocument(DB_ID, COL.USERS, t.payeurId);
          phone = normPhone(u.momoNumber || u.telephone);
        } catch (_) { /* utilisateur introuvable */ }
      }
      if (operateur !== 'moov') continue; // MTN : pas encore géré, on laisse en attente
      if (!phone) { // numéro absent/invalide ou montant hors limite
        await db.updateDocument(DB_ID, COL.TRANSACTIONS, t.$id, { statutMomoDirect: 'echoue' });
        continue;
      }
      await db.updateDocument(DB_ID, COL.TRANSACTIONS, t.$id, { statutMomoDirect: 'ussd_lance' });
      return res.status(200).json({ job: { id: t.$id, phone, amount } });
    }
    return res.status(200).json({ job: null });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
