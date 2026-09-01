// =====================================================
// FeedScreen.js - LEIB
// Feed vertical style TikTok : une vidéo par écran,
// swipe pour passer à la suivante. Chaque vidéo gère
// elle-même sa preview 3s + paywall (voir VideoCard).
// =====================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
  Text,
  RefreshControl,
} from 'react-native';
import { COLORS } from '../config/colors';
import { getFeedVideos } from '../services/videoService';
import VideoCard from '../components/VideoCard';
import TopBar from '../components/TopBar';

const { height: HAUTEUR_ECRAN } = Dimensions.get('window');

export default function FeedScreen() {
  const [videos, setVideos] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [rafraichissement, setRafraichissement] = useState(false);

  const chargerVideos = useCallback(async () => {
    try {
      const resultats = await getFeedVideos();
      setVideos(resultats);
    } catch (error) {
      console.warn('[Feed] Erreur de chargement:', error.message);
    } finally {
      setChargement(false);
      setRafraichissement(false);
    }
  }, []);

  useEffect(() => {
    chargerVideos();
  }, [chargerVideos]);

  function onRafraichir() {
    setRafraichissement(true);
    chargerVideos();
  }

  if (chargement) {
    return (
      <View style={styles.centre}>
        <ActivityIndicator color={COLORS.orPrincipal} size="large" />
      </View>
    );
  }

  if (videos.length === 0) {
    return (
      <View style={styles.centre}>
        <Text style={styles.videViide}>Aucune vidéo pour le moment.</Text>
        <Text style={styles.videVideSousTitre}>Sois le premier à publier sur LEIB !</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.noirFond }}>
      <TopBar />
      <FlatList
        data={videos}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <View style={{ height: HAUTEUR_ECRAN }}>
            <VideoCard video={item} />
          </View>
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={HAUTEUR_ECRAN}
        decelerationRate="fast"
        refreshControl={
          <RefreshControl
            refreshing={rafraichissement}
            onRefresh={onRafraichir}
            tintColor={COLORS.orPrincipal}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centre: {
    flex: 1,
    backgroundColor: COLORS.bleuNuit,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  videViide: {
    color: COLORS.blancTexte,
    fontSize: 18,
    fontWeight: 'bold',
  },
  videVideSousTitre: {
    color: COLORS.grisTexte,
    marginTop: 8,
    textAlign: 'center',
  },
});
