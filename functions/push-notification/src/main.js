const { AccessToken } = require('livekit-server-sdk');

module.exports = async ({ req, res, log, error }) => {
  try {
    const { action, ...data } = JSON.parse(req.body || '{}');

    switch (action) {
      case 'push-notification':
        return res.json(await handlePush(data));
      case 'sms-notification':
        return res.json(await handleSms(data));
      case 'livekit-token':
        return res.json(await handleLivekit(data));
      case 'upload-media':
        return res.json(await handleBunnyStorageUpload(data));
      case 'upload-video':
        return res.json(await handleBunnyStreamUpload(data));
      default:
        return res.json({ error: 'Action inconnue ou manquante' }, 400);
    }
  } catch (err) {
    error(err.message);
    return res.json({ error: err.message }, 500);
  }
};

async function handlePush({ pushToken, title, body }) {
  if (!pushToken || !title) throw new Error('pushToken et title sont requis');
  const reponse = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ to: pushToken, title, body, sound: 'default', priority: 'high' }),
  });
  const result = await reponse.json();
  return { success: true, data: result };
}

async function handleSms({ to, message }) {
  if (!to || !message) throw new Error('to et message sont requis');
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const reponse = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ To: to, From: fromNumber, Body: message }),
    }
  );
  const result = await reponse.json();
  if (!reponse.ok) throw new Error(result.message || 'Echec envoi SMS');
  return { success: true, data: result };
}

async function handleLivekit({ roomName, identity, name, canPublish }) {
  if (!roomName || !identity) throw new Error('roomName et identity sont requis');
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const token = new AccessToken(apiKey, apiSecret, { identity, name: name || identity });
  token.addGrant({ room: roomName, roomJoin: true, canPublish: !!canPublish, canSubscribe: true });
  return { token: await token.toJwt() };
}

async function handleBunnyStorageUpload({ fileName, fileBase64 }) {
  if (!fileName || !fileBase64) throw new Error('fileName et fileBase64 sont requis');
  const storageZone = process.env.BUNNY_STORAGE_ZONE;
  const storageKey = process.env.BUNNY_STORAGE_KEY;
  const cdnUrl = process.env.BUNNY_CDN_URL;
  const uploadUrl = `https://storage.bunnycdn.com/${storageZone}/${fileName}`;
  const buffer = Buffer.from(fileBase64, 'base64');
  const reponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { AccessKey: storageKey, 'Content-Type': 'application/octet-stream' },
    body: buffer,
  });
  if (!reponse.ok) throw new Error(`Echec upload Bunny Storage: ${reponse.status}`);
  return { success: true, url: `${cdnUrl}/${fileName}` };
}

async function handleBunnyStreamUpload({ title, fileBase64 }) {
  if (!title || !fileBase64) throw new Error('title et fileBase64 sont requis');
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
  const apiKey = process.env.BUNNY_STREAM_API_KEY;
  const createRes = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
    method: 'POST',
    headers: { AccessKey: apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  const video = await createRes.json();
  if (!createRes.ok) throw new Error(`Echec creation video Bunny Stream: ${createRes.status}`);
  const buffer = Buffer.from(fileBase64, 'base64');
  const uploadRes = await fetch(
    `https://video.bunnycdn.com/library/${libraryId}/videos/${video.guid}`,
    { method: 'PUT', headers: { AccessKey: apiKey }, body: buffer }
  );
  if (!uploadRes.ok) throw new Error(`Echec upload binaire Bunny Stream: ${uploadRes.status}`);
  return {
    success: true,
    guid: video.guid,
    playbackUrl: `https://iframe.mediadelivery.net/embed/${libraryId}/${video.guid}`,
    hlsUrl: `https://${libraryId}.b-cdn.net/${video.guid}/playlist.m3u8`,
  };
}
