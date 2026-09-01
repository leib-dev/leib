// =====================================================
// pushNotifications.js - LEIB
// Demande la permission, récupère le token Expo Push de
// l'appareil, et le sauvegarde sur le profil utilisateur.
// C'est ce token qui permet d'envoyer une notification même
// quand l'app est totalement fermée.
// =====================================================

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { databases, DB_ID, COLLECTIONS } from './appwrite';

// Affiche la notification même si l'app est ouverte au premier plan
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Demande la permission, récupère le token Expo Push, et
 * l'enregistre sur le profil de l'utilisateur connecté.
 * À appeler une fois après connexion (voir AuthContext).
 * Ne fait rien sur web (pas de push natif côté navigateur ici).
 */
export async function enregistrerPushToken(userId) {
  if (Platform.OS === 'web') return;
  if (!Device.isDevice) return; // pas de push token fiable sur simulateur

  try {
    const { status: statutActuel } = await Notifications.getPermissionsAsync();
    let statutFinal = statutActuel;

    if (statutActuel !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      statutFinal = status;
    }

    if (statutFinal !== 'granted') return;

    const { data: pushToken } = await Notifications.getExpoPushTokenAsync();

    await databases.updateDocument(DB_ID, COLLECTIONS.USERS, userId, { pushToken });

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }
  } catch (error) {
    console.warn('[Push] Échec enregistrement du token:', error.message);
  }
}
