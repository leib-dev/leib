// =====================================================
// functions/livekit-token/src/main.js - LEIB
// Appwrite Function serveur : génère un token LiveKit signé.
// La clé secrète LIVEKIT_API_SECRET ne vit QUE ici (variables
// d'environnement de la Function côté Appwrite), jamais dans
// l'app mobile/web.
//
// Déploiement (CLI Appwrite) :
//   appwrite functions createDeployment \
//     --functionId=livekit_token \
//     --entrypoint="src/main.js" \
//     --code="."
//
// Variables d'environnement à définir dans la Function (dashboard
// Appwrite → Functions → livekit_token → Variables) :
//   LIVEKIT_API_KEY, LIVEKIT_API_SECRET
// =====================================================

const { AccessToken } = require('livekit-server-sdk');

module.exports = async ({ req, res }) => {
  try {
    const { roomName, identity, name, canPublish } = JSON.parse(req.body || '{}');

    if (!roomName || !identity) {
      return res.json({ error: 'roomName et identity sont requis' }, 400);
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    const token = new AccessToken(apiKey, apiSecret, {
      identity,
      name: name || identity,
    });

    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: !!canPublish,
      canSubscribe: true,
    });

    return res.json({ token: await token.toJwt() });
  } catch (error) {
    return res.json({ error: error.message }, 500);
  }
};
