// Reçoit les SMS Moov transmis par l'app Android et confirme la transaction LEIB
// dont le retrait USSD a été lancé (statut "ussd_lance").
const { Query, db, DB_ID, COL, auth, normPhone } = require('../_lib');
const { regler } = require('../_regler');

const SENDERS = (process.env.SMS_SENDERS || '')
  .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

// Format du SMS à confirmer. Par défaut : "Depot recu 500F de ..." (ancien format).
// Mets le vrai texte du SMS Moov du retrait dans SMS_AMOUNT_REGEX (1 groupe = montant).
const RX_AMOUNT = new RegExp(process.env.SMS_AMOUNT_REGEX || 'Depot recu\\s+([\\d .,]+?)\\s*F\\b', 'i');
const RX_ID = /\bID\s*:?\s*(\d+)/i;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!auth(req)) return res.status(401).json({ success: false, error: 'Cle invalide' });

  const { sender, body } = req.body || {};
  if (SENDERS.length && !SENDERS.includes(String(sender || '').toLowerCase())) {
    return res.status(200).json({ success: true, ignored: true, reason: 'expediteur' });
  }
  const texte = String(body || '').trim();

  try {
    const mA = texte.match(RX_AMOUNT);
    if (!mA) {
      console.log('SMS_NON_RECONNU', JSON.stringify({ sender, texte })); // visible dans Vercel > Logs
      return res.status(200).json({ success: true, ignored: true });
    }
    const montant = parseInt(mA[1].replace(/[ .,]/g, ''), 10);
    const idMomo = (texte.match(RX_ID) || [])[1] || null;

    // Un ID Moov ne sert qu'une fois.
    if (idMomo) {
      const deja = await db.listDocuments(DB_ID, COL.TRANSACTIONS, [
        Query.equal('idTransactionMomo', idMomo),
        Query.equal('statutMomoDirect', 'confirmé'),
        Query.limit(1),
      ]);
      if (deja.documents.length > 0) {
        return res.status(200).json({ success: false, error: 'ID deja utilise' });
      }
    }

    const dixMin = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const r = await db.listDocuments(DB_ID, COL.TRANSACTIONS, [
      Query.equal('type', 'momo_direct'),
      Query.equal('statutMomoDirect', 'ussd_lance'),
      Query.equal('montant', montant),
      Query.greaterThan('date', dixMin),
      Query.orderAsc('date'),
      Query.limit(5),
    ]);
    if (r.documents.length === 0) {
      return res.status(200).json({ success: false, error: 'Aucune transaction correspondante' });
    }

    let transaction = null;
    if (r.documents.length === 1) {
      transaction = r.documents[0];
    } else {
      // Plusieurs paiements du même montant : on départage par le numéro du client dans le SMS.
      const chiffres = texte.replace(/\D/g, '');
      for (const t of r.documents) {
        try {
          const u = await db.getDocument(DB_ID, COL.USERS, t.payeurId);
          const p = normPhone(u.momoNumber || u.telephone);
          if (p && chiffres.includes(p.slice(-8))) { transaction = t; break; }
        } catch (_) {}
      }
      if (!transaction) {
        console.log('SMS_AMBIGU', JSON.stringify({ montant, candidats: r.documents.map(d => d.$id) }));
        return res.status(200).json({ success: false, error: 'Plusieurs paiements identiques, verification manuelle' });
      }
    }

    const maj = { statutMomoDirect: 'confirmé' };
    if (idMomo) maj.idTransactionMomo = idMomo;
    await db.updateDocument(DB_ID, COL.TRANSACTIONS, transaction.$id, maj);

    // Répartition admin/créateur faite ICI, côté serveur (jamais par l'app).
    let reglement = { regle: false };
    try {
      reglement = await regler({ ...transaction, ...maj });
    } catch (e) {
      console.log('REGLEMENT_ERREUR', JSON.stringify({ transactionId: transaction.$id, message: e.message }));
    }
    if (!reglement.regle) console.log('NON_REGLE', JSON.stringify({ transactionId: transaction.$id, ...reglement }));
    return res.status(200).json({ success: true, transactionId: transaction.$id, regle: !!reglement.regle });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
};
