// =====================================================
// functions/sms-notification/src/main.js - LEIB
// Appwrite Function serveur : envoie un SMS via Twilio.
// Fonctionne indépendamment de l'app (le SMS arrive même
// si LEIB est fermée) car il passe par le réseau
// téléphonique, pas par une notification push classique.
//
// Variables d'environnement à définir dans la Function
// (dashboard Appwrite → Functions → sms_notification → Variables) :
//   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
// =====================================================

const twilio = require('twilio');

module.exports = async ({ req, res }) => {
  try {
    const { telephone, message } = JSON.parse(req.body || '{}');

    if (!telephone || !message) {
      return res.json({ error: 'telephone et message sont requis' }, 400);
    }

    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    const sms = await client.messages.create({
      body: message,
      from: process.env.TWILIO_FROM_NUMBER,
      to: telephone,
    });

    return res.json({ success: true, sid: sms.sid });
  } catch (error) {
    return res.json({ error: error.message }, 500);
  }
};
