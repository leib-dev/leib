import { functions, databases, DB_ID, COLLECTIONS, ID } from '../config/appwrite';

export async function obtenirNumeroAdmin(operateur) {
  const execution = await functions.createExecution(
    'momo_numero_admin',
    JSON.stringify({}),
    false,
    operateur ? `/?operateur=${operateur}` : undefined
  );
  const data = JSON.parse(execution.responseBody);
  if (data.error) throw new Error(data.error);
  return data;
}

export async function creerPaiementMomoDirect({ userId, montant, action, referenceCible, idTransactionMomo, operateur }) {
  if (!idTransactionMomo) throw new Error("Merci d'indiquer l'ID de transaction reçu par SMS.");
  const document = await databases.createDocument(DB_ID, COLLECTIONS.TRANSACTIONS, ID.unique(), {
    type: 'momo_direct',
    action,
    montant,
    payeurId: userId,
    referenceCible: referenceCible || null,
    idTransactionMomo,
    operateur: operateur || null,
    statutMomoDirect: 'en_attente',
    date: new Date().toISOString(),
  });
  return document;
}
