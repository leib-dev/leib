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

// USSD autopilote : le client n'a plus d'ID à saisir. On crée la transaction "en_attente" ;
// le téléphone marchand lance le retrait sur le numéro Moov du client (profil : momoNumber),
// le client confirme avec son code Moov, puis la passerelle passe la transaction à "confirmé".
export async function creerPaiementMomoDirect({ userId, montant, action, referenceCible, beneficiaireId, operateur }) {
  const document = await databases.createDocument(DB_ID, COLLECTIONS.TRANSACTIONS, ID.unique(), {
    type: 'momo_direct',
    action,
    montant,
    payeurId: userId,
    referenceCible: referenceCible || null,
    beneficiaireId: beneficiaireId || null,
    operateur: operateur || null,
    statutMomoDirect: 'en_attente',
    date: new Date().toISOString(),
  });
  return document;
}

// Attend le résultat : renvoie 'confirmé' ou 'echoue' (ou 'expire' après 4 min).
export async function attendreConfirmationMomo(transactionId, { delaiMs = 240000, pasMs = 3000 } = {}) {
  const fin = Date.now() + delaiMs;
  while (Date.now() < fin) {
    const t = await databases.getDocument(DB_ID, COLLECTIONS.TRANSACTIONS, transactionId);
    if (t.statutMomoDirect === 'confirmé' || t.statutMomoDirect === 'echoue') return t.statutMomoDirect;
    await new Promise((r) => setTimeout(r, pasMs));
  }
  return 'expire';
}
