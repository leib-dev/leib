// =====================================================
// functions/push-notification/src/main.js - LEIB
// Appwrite Function serveur : envoie une notification push
// native via l'API Expo Push. Contrairement à Twilio/LiveKit,
// l'API Expo Push de base ne demande pas de clé secrète — on
// passe quand même par une Function pour centraliser l'envoi
// et ne pas exposer directement l'API depuis le client.
// =====================================================

module.exports = async ({ req, res }) => {
  try {
    const { pushToken, title, body } = JSON.parse(req.body || '{}');

    if (!pushToken || !title) {
      return res.json({ error: 'pushToken et title sont requis' }, 400);
    }

    const reponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        to: pushToken,
        title,
        body,
        sound: 'default',
        priority: 'high',
      }),
    });

    const data = await reponse.json();
    return res.json({ success: true, data });
  } catch (error) {
    return res.json({ error: error.message }, 500);
  }
};
