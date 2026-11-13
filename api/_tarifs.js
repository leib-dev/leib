// Copie SERVEUR de src/config/monetization.js (TARIFS). À garder identique !
// Le serveur ne fait confiance qu'à ce barème, jamais au montant envoyé par l'app.
const TARIFS = {
  UPLOAD_VIDEO: { montant: 500, partAdmin: 500, partCreateur: 0 },
  BOOST_VIDEO: { montant: 10000, partAdmin: 10000, partCreateur: 0 },
  LANCER_LIVE: { montant: 10000, partAdmin: 10000, partCreateur: 0 },
  BADGE_VIP: { montant: 10000, partAdmin: 10000, partCreateur: 0 },
  BADGE_VERIFIE: { montant: 5000, partAdmin: 5000, partCreateur: 0 },
  APPEL: { montant: 10000, partAdmin: 10000, partCreateur: 0 },
  DEBLOQUER_VIDEO: { montant: 100, partAdmin: 50, partCreateur: 50 },
  ABONNEMENT_CREATEUR: { montant: 5000, partAdmin: 3000, partCreateur: 2000 },
  ACCES_LIVE: { montant: 10000, partAdmin: 6000, partCreateur: 4000 },
};

// valeur de `action` envoyée par l'app -> clé du barème
const PAR_ACTION = {
  deblocage_video: 'DEBLOQUER_VIDEO',
  upload_video: 'UPLOAD_VIDEO',
  boost_video: 'BOOST_VIDEO',
  lancer_live: 'LANCER_LIVE',
  badge_vip: 'BADGE_VIP',
  badge_verifie: 'BADGE_VERIFIE',
  upload_audio: 'UPLOAD_VIDEO', // audioService utilise TARIFS.UPLOAD_VIDEO
  appel: 'APPEL',
  abonnement_createur: 'ABONNEMENT_CREATEUR',
  acces_live: 'ACCES_LIVE',
};

const tarifPourAction = (action) => TARIFS[PAR_ACTION[String(action || '').toLowerCase()]] || null;

// Dons live : montant libre (min 100), réparti 60% admin / 40% créateur (REPARTITION_DONS_LIVE).
const DON_MIN = 100;
const DON_MAX = parseInt(process.env.MAX_DON || '50000', 10);

// Barème applicable à UNE transaction (ou null = refusée). Le barème serveur décide, pas l'app.
function tarifPourTransaction(t) {
  const action = String(t.action || '').toLowerCase();
  let tarif;
  if (action === 'don_live') {
    const m = Number(t.montant);
    if (!Number.isInteger(m) || m < DON_MIN || m > DON_MAX) return null;
    const partCreateur = Math.round(m * 0.4);
    tarif = { montant: m, partAdmin: m - partCreateur, partCreateur };
  } else {
    tarif = tarifPourAction(action);
    if (!tarif || Number(t.montant) !== tarif.montant) return null;
  }
  // Tout paiement avec part créateur (hors déblocage vidéo : lu dans la vidéo) doit désigner le créateur.
  if (tarif.partCreateur > 0 && action !== 'deblocage_video' && !t.beneficiaireId) return null;
  return tarif;
}

module.exports = { tarifPourAction, tarifPourTransaction };
