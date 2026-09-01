// =====================================================
// AppNavigator.js - LEIB
// Bascule automatiquement entre le flux "non connecté"
// (Login/Register) et le flux "connecté" (Feed + Upload +
// Live + Wallet + Admin en onglets) en fonction de
// isAuthenticated. L'onglet Admin n'apparaît que si
// isAdmin est vrai (voir useAuth()).
// =====================================================

import React from 'react';
import { Text, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../config/colors';

import SplashScreen from '../screens/SplashScreen';
import LandingScreen from '../screens/LandingScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import FeedScreen from '../screens/FeedScreen';
import WalletScreen from '../screens/WalletScreen';
import UploadScreen from '../screens/UploadScreen';
import LiveScreen from '../screens/LiveScreen';
import StartLiveScreen from '../screens/StartLiveScreen';
import LiveViewerScreen from '../screens/LiveViewerScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import CallScreen from '../screens/CallScreen';
import GlobalCallListener from '../components/GlobalCallListener';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const LiveStack = createNativeStackNavigator();

// Stack imbriqué pour l'onglet Live : liste → démarrer / regarder.
// Nécessaire car ces écrans font navigation.navigate() entre eux
// (LiveScreen -> StartLive / LiveViewer).
function LiveStackNavigator() {
  return (
    <LiveStack.Navigator screenOptions={{ headerShown: false }}>
      <LiveStack.Screen name="LiveListe" component={LiveScreen} />
      <LiveStack.Screen name="StartLive" component={StartLiveScreen} />
      <LiveStack.Screen name="LiveViewer" component={LiveViewerScreen} />
    </LiveStack.Navigator>
  );
}

// Onglets de l'utilisateur connecté : Feed + Live + Upload + Wallet
// (+ Admin si isAdmin). Profil arrivera dans une brique future.
function TabsConnecte() {
  const { isAdmin } = useAuth();

  return (
    <>
      <GlobalCallListener />
      <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: COLORS.bleuNuit, borderTopColor: COLORS.orFonce },
        tabBarActiveTintColor: COLORS.orPrincipal,
        tabBarInactiveTintColor: COLORS.grisTexte,
      }}
    >
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>▶</Text> }}
      />
      <Tab.Screen
        name="Live"
        component={LiveStackNavigator}
        options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>●</Text> }}
      />
      <Tab.Screen
        name="Upload"
        component={UploadScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>+</Text> }}
      />
      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>◆</Text> }}
      />
      {isAdmin && (
        <Tab.Screen
          name="Admin"
          component={AdminDashboardScreen}
          options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>⚙</Text> }}
        />
      )}
    </Tab.Navigator>
    </>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="App" component={TabsConnecte} />
            <Stack.Screen
              name="Call"
              component={CallScreen}
              options={{ presentation: 'fullScreenModal' }}
            />
          </>
        ) : (
          <>
            {Platform.OS === 'web' && (
              <Stack.Screen name="Landing" component={LandingScreen} />
            )}
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
