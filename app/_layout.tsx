import { AppProvider, useAppContext } from '@/context/AppContext';
import { Stack, useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';

SplashScreen.preventAutoHideAsync();

// This is the main navigator for the app
function RootLayoutNav() {
  const { isLoading, user } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
      if (user) {
        // If user is logged in, go to the main app screen group
        router.replace('/(tabs)');
      } else {
        // If no user, go to the login screen
        router.replace('/login');
      }
    }
  }, [isLoading, user]);

  // Show a loading screen while checking the session
  if (isLoading) {
    return <View style={{flex: 1, justifyContent: 'center'}}><ActivityIndicator size="large" /></View>;
  }

  // This Stack navigator manages the switch between auth and the main app
  return (
      <Stack>
        {/* This screen points to the group of pages that will have the sidebar */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        
        {/* These are your modal/full-screen auth pages */}
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
                <Stack.Screen name="practice-session" options={{ headerShown: false }} />

      </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({ ...Ionicons.font });

  useEffect(() => { if (error) throw error; }, [error]);

  if (!loaded) return null;

  return (
    <AppProvider>
      <RootLayoutNav />
    </AppProvider>
  );
}
