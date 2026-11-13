// Utilitaires communs aux routes passerelle (le préfixe _ = pas une route Vercel)
const crypto = require('crypto');
const { Client, Databases, Query } = require('node-appwrite');

const safeEq = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

const auth = (req) => {
  const k = process.env.GATEWAY_KEY || '';
  return !!k && safeEq(req.headers['x-gateway-key'] || '', k);
};

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const db = new Databases(client);
const DB_ID = process.env.APPWRITE_DB_ID;
const COL = {
  TRANSACTIONS: process.env.APPWRITE_COLLECTION_TRANSACTIONS,
  VIDEOS: process.env.APPWRITE_COLLECTION_VIDEOS,
  USERS: process.env.APPWRITE_COLLECTION_USERS,
};

// "+229 01 97 12 34 56" -> "0197123456" ; refuse tout ce qui n'a pas 8 ou 10 chiffres
const normPhone = (raw) => {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.startsWith('00229')) d = d.slice(5);
  else if (d.startsWith('229') && d.length > 10) d = d.slice(3);
  return d.length === 8 || d.length === 10 ? d : null;
};

module.exports = { Query, db, DB_ID, COL, auth, normPhone };
