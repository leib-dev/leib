// ======================================================
// functions/notifications/src/main.js - LEIB
// Appwrite Function serveur : fusionne push-notification
// et sms-notification en une seule fonction, routée par "type".
//
// Variables d'environnement à définir dans la Function
// (dashboard Appwrite → Functions → notifications → Variables) :
//   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
// ======================================================

const twilio = require('twilio');

module.exports = async ({ req, res }) => {
  try {
    const { type, ...params } = JSON.parse(req.body || '{}');

    if (!type) {
      return res.json({ error: 'type est requis ("push" ou "sms")' }, 400);
    }

    if (type === 'push') {
      return await envoyerPush(params, res);
    }

    if (type === 'sms') {
      return await envoyerSms(params, res);
    }

    return res.json({ error: 'type inconnu, utilisez "push" ou "sms"' }, 400);
  } catch (error) {
    return res.json({ error: error.message }, 500);
  }
};

async function envoyerPush({ pushToken, title, body }, res) {
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
}

async function envoyerSms({ telephone, message }, res) {
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
}
