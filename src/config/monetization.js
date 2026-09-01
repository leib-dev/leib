// =====================================================
// monetization.js - LEIB
// Barème central de tous les prix et répartitions.
// Une seule source de vérité, utilisée par le feed,
// le wallet, le live et l'admin dashboard.
// =====================================================

export const TARIFS = {
  // --- 100% pour l'admin LEIB ---
  UPLOAD_VIDEO: { montant: 500, partAdmin: 500, partCreateur: 0 },
  BOOST_VIDEO: { montant: 10000, partAdmin: 10000, partCreateur: 0 },
  LANCER_LIVE: { montant: 10000, partAdmin: 10000, partCreateur: 0 },
  BADGE_VIP: { montant: 10000, partAdmin: 10000, partCreateur: 0 },
  BADGE_VERIFIE: { montant: 5000, partAdmin: 5000, partCreateur: 0 },
  APPEL: { montant: 10000, partAdmin: 10000, partCreateur: 0 },

  // --- Partagé avec le créateur ---
  DEBLOQUER_VIDEO: { montant: 100, partAdmin: 50, partCreateur: 50 },
  ABONNEMENT_CREATEUR: { montant: 5000, partAdmin: 3000, partCreateur: 2000 },
  ACCES_LIVE: { montant: 10000, partAdmin: 6000, partCreateur: 4000 },
};

// Dons pendant un live : pourcentage plutôt que montant fixe
export const REPARTITION_DONS_LIVE = {
  pourcentageAdmin: 0.6,
  pourcentageCreateur: 0.4,
};

/**
 * Calcule la répartition d'un don libre pendant un live.
 */
export function calculerRepartitionDon(montant) {
  return {
    partAdmin: Math.round(montant * REPARTITION_DONS_LIVE.pourcentageAdmin),
    partCreateur: Math.round(montant * REPARTITION_DONS_LIVE.pourcentageCreateur),
  };
}

// Durée de la preview gratuite du feed, en secondes
export const DUREE_PREVIEW_GRATUITE = 3;
