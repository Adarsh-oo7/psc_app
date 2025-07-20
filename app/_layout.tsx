import { AppProvider, useAppContext } from '@/context/AppContext';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';
import { Drawer } from 'expo-router/drawer';
import { useRouter } from 'expo-router';
import { CustomDrawerContent } from '@/components/CustomDrawerContent';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isLoading, user } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
      if (user) {
        // Navigate to the main tabs. Do not use 'index', use '/(tabs)' per Expo Router convention.
        router.replace('/(tabs)');
      } else {
        // Navigate to the login screen.
        router.replace('/login');
      }
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerStyle: { width: 280 },
        headerShown: false,
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          title: 'Home',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          title: 'Settings',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
      {/* Hide screens that shouldn't appear in the drawer menu */}
      <Drawer.Screen name="login" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="register" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="practice-session" options={{ drawerItemStyle: { display: 'none' } }} />
         {/* <Drawer.Screen name="daily-exam" options={{ drawerItemStyle: { display: 'none' } }} /> */}
    {/* <Drawer.Screen name="daily-exam" options={{ drawerItemStyle: { display: 'none' } }} /> */}

    <Drawer.Screen name="model-exam-list/[examId]" options={{ drawerItemStyle: { display: 'none' } }} />
    <Drawer.Screen name="model-quiz/[modelExamId]" options={{ drawerItemStyle: { display: 'none' } }} />

    <Drawer.Screen name="daily-quiz/[dailyExamId]" options={{ drawerItemStyle: { display: 'none' } }} />
    <Drawer.Screen name="leaderboard/[dailyExamId]" options={{ drawerItemStyle: { display: 'none' } }} />
    <Drawer.Screen name="exam-calendar" options={{ drawerItemStyle: { display: 'none' } }} />


        <Drawer.Screen name="pyq-exam" options={{ drawerItemStyle: { display: 'none' } }} />
    <Drawer.Screen name="pyq-list/[examId]" options={{ drawerItemStyle: { display: 'none' } }} />
    <Drawer.Screen name="community-profile/[username]" options={{ drawerItemStyle: { display: 'none' } }} />
    <Drawer.Screen name="groups" options={{ drawerItemStyle: { display: 'none' } }} />
    <Drawer.Screen name="group-chat/[groupId]" options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="groups-discover" options={{ drawerItemStyle: { display: 'none' } }} />

    </Drawer>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({ ...Ionicons.font });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  if (!loaded) return null;

  return (
    <AppProvider>
      <RootLayoutNav />
    </AppProvider>
  );
}