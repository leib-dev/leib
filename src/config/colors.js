// =====================================================
// Palette de couleurs officielles - LEIB
// =====================================================

export const COLORS = {
  orPrincipal: '#FFD700',
  orFonce: '#D4AF37',
  noirFond: '#000000',
  bleuNuit: '#0A0F1E',
  blancTexte: '#FFFFFF',

  // Couleurs dérivées utiles pour les états et badges
  vertSucces: '#2ECC71',
  rougeErreur: '#E74C3C',
  bleuVerifie: '#3B9EFF', // badge vérifié bleu
  grisTexte: '#A0A0A0',
  overlaySombre: 'rgba(0,0,0,0.6)',
};

// Style réutilisable pour l'effet "qui brille" des boutons dorés
export const GOLD_BUTTON_SHADOW = {
  shadowColor: COLORS.orPrincipal,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.8,
  shadowRadius: 10,
  elevation: 8, // équivalent Android de shadow
};
