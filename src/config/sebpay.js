// =====================================================
// sebpay.js - LEIB
// Configuration et appels de base à l'API SebPay Africa
// pour tous les paiements (déblocage vidéo, abonnement,
// live, boost, retraits...).
// =====================================================

export const SEBPAY_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_SEBPAY_API_KEY,
  baseUrl: process.env.EXPO_PUBLIC_SEBPAY_BASE_URL,
  merchantId: process.env.EXPO_PUBLIC_SEBPAY_MERCHANT_ID,
};

/**
 * Initie un paiement SebPay (Mobile Money, carte, etc.)
 * Retourne un objet avec l'URL de paiement à ouvrir (webview)
 * et l'identifiant de transaction SebPay à vérifier ensuite.
 *
 * @param {Object} params
 * @param {number} params.montant - Montant en FCFA
 * @param {string} params.motif - Description (ex: "Déblocage vidéo")
 * @param {string} params.userId - ID de l'utilisateur qui paie
 * @param {string} params.reference - Référence unique côté LEIB
 */
export async function initierPaiement({ montant, motif, userId, reference }) {
  const response = await fetch(`${SEBPAY_CONFIG.baseUrl}/payments/initiate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SEBPAY_CONFIG.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      merchant_id: SEBPAY_CONFIG.merchantId,
      amount: montant,
      currency: 'XOF',
      description: motif,
      customer_id: userId,
      reference,
    }),
  });

  if (!response.ok) {
    throw new Error(`Échec initiation paiement SebPay: ${response.status}`);
  }

  return response.json(); // { payment_url, transaction_id, status }
}

/**
 * Vérifie le statut final d'une transaction SebPay
 * (à appeler après retour de la webview de paiement).
 */
export async function verifierPaiement(transactionId) {
  const response = await fetch(
    `${SEBPAY_CONFIG.baseUrl}/payments/${transactionId}/status`,
    {
      headers: { Authorization: `Bearer ${SEBPAY_CONFIG.apiKey}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Échec vérification paiement SebPay: ${response.status}`);
  }

  const data = await response.json();
  return data.status; // 'success' | 'pending' | 'failed'
}

/**
 * Demande un retrait vers Mobile Money / Virement / Stripe via SebPay.
 */
export async function demanderRetrait({ montant, methode, userId, details }) {
  const response = await fetch(`${SEBPAY_CONFIG.baseUrl}/payouts/create`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SEBPAY_CONFIG.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      merchant_id: SEBPAY_CONFIG.merchantId,
      amount: montant,
      method: methode, // 'mtn_momo' | 'orange_money' | 'bank_transfer' | 'stripe'
      customer_id: userId,
      details,
    }),
  });

  if (!response.ok) {
    throw new Error(`Échec demande de retrait SebPay: ${response.status}`);
  }

  return response.json();
}
