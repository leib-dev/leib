// =====================================================
// GlobalCallListener.js - LEIB
// Monté une seule fois (dans TabsConnecte) : écoute en
// permanence les appels entrants via Appwrite Realtime,
// affiche la modal, et navigue vers CallScreen si accepté.
// =====================================================

import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { ecouterAppelsEntrants, repondreAppel } from '../services/callService';
import IncomingCallModal from './IncomingCallModal';

export default function GlobalCallListener() {
  const { user, profile } = useAuth();
  const [appelEntrant, setAppelEntrant] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    if (!user) return;
    const unsubscribe = ecouterAppelsEntrants(user.$id, setAppelEntrant);
    return unsubscribe;
  }, [user]);

  async function handleAccepter() {
    const { token, serverUrl } = await repondreAppel({
      appelId: appelEntrant.$id,
      accepter: true,
      userId: user.$id,
      pseudo: profile.pseudo,
      nomSalle: appelEntrant.nomSalle,
    });

    setAppelEntrant(null);
    navigation.getParent()?.navigate('Call', {
      appelId: appelEntrant.$id,
      nomSalle: appelEntrant.nomSalle,
      token,
      serverUrl,
      type: appelEntrant.type,
      autrePersonnePseudo: appelEntrant.callerPseudo,
    });
  }

  async function handleRefuser() {
    await repondreAppel({
      appelId: appelEntrant.$id,
      accepter: false,
      userId: user.$id,
      pseudo: profile.pseudo,
      nomSalle: appelEntrant.nomSalle,
    });
    setAppelEntrant(null);
  }

  return (
    <IncomingCallModal appel={appelEntrant} onAccepter={handleAccepter} onRefuser={handleRefuser} />
  );
}
