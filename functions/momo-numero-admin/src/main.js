module.exports = async ({ req, res, log, error }) => {
  try {
    const brut = process.env.MOMO_ADMIN_NUMEROS || '';
    const numeros = brut.split(',').map((e) => e.trim()).filter(Boolean).map((e) => {
      const [numero, operateur] = e.split(':');
      return { numero, operateur: operateur || 'MTN' };
    });
    if (numeros.length === 0) return res.json({ error: 'Aucun numéro admin configuré côté serveur.' }, 500);
    const operateurDemande = req.query?.operateur;
    const candidats = operateurDemande ? numeros.filter((n) => n.operateur.toUpperCase() === operateurDemande.toUpperCase()) : numeros;
    const pool = candidats.length > 0 ? candidats : numeros;
    const choisi = pool[Math.floor(Math.random() * pool.length)];
    return res.json({ numero: choisi.numero, operateur: choisi.operateur });
  } catch (err) {
    error(err.message);
    return res.json({ error: err.message }, 500);
  }
};
