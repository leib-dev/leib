import { Client, Databases, ID } from 'node-appwrite';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const cle = req.headers['x-leibpay-secret'];
  if (cle !== process.env.LEIBPAY_APP_SECRET) {
    return res.status(401).json({ success: false, error: "Non autorisé" });
  }

  const { montant, reseau, video_id, user_id } = req.body;

  const client = new Client();
  client
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  const DATABASE_ID = process.env.APPWRITE_DB_ID;
  const COLLECTIONS = {
    VIDEOS: process.env.APPWRITE_COLLECTION_VIDEOS,
    TRANSACTIONS: process.env.APPWRITE_COLLECTION_TRANSACTIONS,
  };

  const comptes = {
    mtn: process.env.MTN_LEIBPAY,
    moov: process.env.MOOV_LEIBPAY,
    celtis: process.env.CELTIS_LEIBPAY
  };

  let ussd = "";
  if (reseau === "moov") ussd = `*855*1*1*1*${comptes.moov}*${montant}*0234#`;
  if (reseau === "mtn") ussd = `*880*1*1*${comptes.mtn}*${montant}*0234#`;
  if (reseau === "celtis") ussd = `*889*1*1*${comptes.celtis}*${montant}#`;

  if (!ussd) {
    return res.status(400).json({ success: false, error: "Réseau invalide" });
  }

  try {
    const transaction = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.TRANSACTIONS,
      ID.unique(),
      {
        type: 'momo_direct',
        montant,
        payeurId: user_id,
        referenceCible: video_id,
        operateur: reseau,
        statutMomoDirect: 'en_attente',
        date: new Date().toISOString(),
      }
    );

    return res.status(200).json({
      success: true,
      ussd,
      transactionId: transaction.$id,
      message: `Paiement de ${montant}F en cours`
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
