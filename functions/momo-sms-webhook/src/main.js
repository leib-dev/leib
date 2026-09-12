import { Client, Databases, Query } from 'node-appwrite';
import twilio from 'twilio';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const twilioSignature = req.headers['x-twilio-signature'];
  const url = process.env.TWILIO_WEBHOOK_URL;
  const isValide = twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN,
    twilioSignature,
    url,
    req.body
  );

  if (!isValide) {
    return res.status(403).json({ success: false, error: "Signature Twilio invalide" });
  }

  const texteSms = req.body.Body;

  const client = new Client();
  client
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  const DATABASE_ID = process.env.APPWRITE_DB_ID;
  const COLLECTIONS = {
    TRANSACTIONS: process.env.APPWRITE_COLLECTION_TRANSACTIONS,
    VIDEOS: process.env.APPWRITE_COLLECTION_VIDEOS,
  };

  try {
    if (!texteSms.toLowerCase().startsWith('depot recu')) {
      return res.status(200).json({ success: true, ignored: true });
    }

    const matchMontant = texteSms.match(/Depot recu (\d+)F de/i);
    const matchId = texteSms.match(/ID:(\d+)/i);

    if (!matchMontant || !matchId) {
      return res.status(200).json({ success: false, error: "Format SMS non reconnu" });
    }

    const montantRecu = parseInt(matchMontant[1], 10);
    const idTransactionMomo = matchId[1];

    const dixMinutesAvant = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    const resultats = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.TRANSACTIONS,
      [
        Query.equal('type', 'momo_direct'),
        Query.equal('statutMomoDirect', 'en_attente'),
        Query.equal('montant', montantRecu),
        Query.greaterThan('date', dixMinutesAvant),
        Query.orderAsc('date'),
        Query.limit(1),
      ]
    );

    if (resultats.documents.length === 0) {
      return res.status(200).json({ success: false, error: "Aucune transaction correspondante" });
    }

    const transaction = resultats.documents[0];

    await databases.updateDocument(DATABASE_ID, COLLECTIONS.TRANSACTIONS, transaction.$id, {
      statutMomoDirect: 'confirmé',
      idTransactionMomo,
    });

    const video = await databases.getDocument(DATABASE_ID, COLLECTIONS.VIDEOS, transaction.referenceCible);
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.VIDEOS, transaction.referenceCible, {
      acheteurs: [...(video.acheteurs || []), transaction.payeurId],
      statut: 'payé',
    });

    return res.status(200).json({ success: true, transactionId: transaction.$id });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
