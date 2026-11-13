// L'app dit si le code USSD a pu être lancé. Échec -> la transaction passe en "echoue".
const { db, DB_ID, COL, auth } = require('../_lib');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!auth(req)) return res.status(401).json({ error: 'Cle invalide' });
  const { orderId, ok } = req.body || {};
  try {
    if (orderId && !ok) {
      const t = await db.getDocument(DB_ID, COL.TRANSACTIONS, String(orderId));
      if (t.statutMomoDirect === 'ussd_lance') {
        await db.updateDocument(DB_ID, COL.TRANSACTIONS, t.$id, { statutMomoDirect: 'echoue' });
      }
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(200).json({ ok: false, error: e.message });
  }
};
