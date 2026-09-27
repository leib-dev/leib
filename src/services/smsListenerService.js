// ==================================================================
// smsListenerService.js - LEIB
// Écoute les SMS entrants sur le téléphone admin, détecte un dépôt
// Momo ("Depot recu X F... ID:..."), et confirme automatiquement
// la transaction en_attente correspondante + débloque la vidéo liée.
// Actif uniquement sur l'appareil admin (jamais publié sur le Store).
// ==================================================================

import { PermissionsAndroid, Platform } from 'react-native';
import SmsListener from 'react-native-android-sms-listener';
import { databases, DB_ID, COLLECTIONS, Query } from '../config/appwrite';

let abonnement = null;

async function demanderPermissionSms() {
  if (Platform.OS !== 'android') return false;
  const granted = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
    PermissionsAndroid.PERMISSIONS.READ_SMS,
  ]);
  return (
    granted[PermissionsAndroid.PERMISSIONS.RECEIVE_SMS] === PermissionsAndroid.RESULTS.GRANTED &&
    granted[PermissionsAndroid.PERMISSIONS.READ_SMS] === PermissionsAndroid.RESULTS.GRANTED
  );
}

async function traiterSms(texteSms) {
  if (!texteSms.toLowerCase().startsWith('depot recu')) return;

  const matchMontant = texteSms.match(/Depot recu (\d+)F de/i);
  const matchId = texteSms.match(/ID:(\d+)/i);
  if (!matchMontant || !matchId) return;

  const montantRecu = parseInt(matchMontant[1], 10);
  const idTransactionMomo = matchId[1];
  const dixMinutesAvant = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  try {
    const resultats = await databases.listDocuments(DB_ID, COLLECTIONS.TRANSACTIONS, [
      Query.equal('type', 'momo_direct'),
      Query.equal('statutMomoDirect', 'en_attente'),
      Query.equal('montant', montantRecu),
      Query.greaterThan('date', dixMinutesAvant),
      Query.orderAsc('date'),
      Query.limit(1),
    ]);

    if (resultats.documents.length === 0) {
      console.warn('[SMS Momo] Aucune transaction correspondante pour', montantRecu, 'F');
      return;
    }

    const transaction = resultats.documents[0];

    await databases.updateDocument(DB_ID, COLLECTIONS.TRANSACTIONS, transaction.$id, {
      statutMomoDirect: 'confirmé',
      idTransactionMomo,
    });

    if (transaction.referenceCible) {
      const video = await databases.getDocument(DB_ID, COLLECTIONS.VIDEOS, transaction.referenceCible);
      await databases.updateDocument(DB_ID, COLLECTIONS.VIDEOS, transaction.referenceCible, {
        acheteurs: [...(video.acheteurs || []), transaction.payeurId],
        statut: 'payé',
      });
    }

    console.log('[SMS Momo] Transaction confirmée automatiquement:', transaction.$id);
  } catch (error) {
    console.warn('[SMS Momo] Erreur de confirmation:', error.message);
  }
}

/**
 * Démarre l'écoute des SMS. À appeler une seule fois, uniquement
 * pour le compte admin (voir App.js).
 */
export async function demarrerEcouteSms() {
  if (abonnement) return; // déjà démarré

  const autorise = await demanderPermissionSms();
  if (!autorise) {
    console.warn('[SMS Momo] Permission SMS refusée, confirmation automatique désactivée.');
    return;
  }

  abonnement = SmsListener.addListener((message) => {
    traiterSms(message.body);
  });

  console.log('[SMS Momo] Écoute SMS démarrée.');
}

export function arreterEcouteSms() {
  if (abonnement) {
    abonnement.remove();
    abonnement = null;
  }
}
