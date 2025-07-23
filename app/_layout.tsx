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
        router.replace('/(tabs)');
      } else {
        router.replace('/login');
      }
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator /></View>;
  }

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerStyle: { width: 280 },
        headerShown: false,
      }}
    >
      {/* --- Screens Visible in the Drawer Menu --- */}
      <Drawer.Screen
        name="(tabs)"
        options={{
          title: 'Home',
          drawerIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          title: 'Settings',
          drawerIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
        }}
      />
      
      {/* --- Screens Hidden from the Drawer Menu --- */}
      {/* Auth Screens */}
      <Drawer.Screen name="login" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="register" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="edit-profile" options={{ drawerItemStyle: { display: 'none' } }} />
      
      {/* Community Screens */}
      <Drawer.Screen name="create-post" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="community-profile/[username]" options={{ drawerItemStyle: { display: 'none' } }} />
      
      {/* Messaging Screens */}
      <Drawer.Screen name="conversations" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="chat/[conversationId]" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="create-group" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="groups-discover" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="group-chat/[groupId]" options={{ drawerItemStyle: { display: 'none' } }} />

      {/* Quiz & Exam Screens */}
      <Drawer.Screen name="quiz" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="quiz-setup" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="daily-exam" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="model-exam-list/[examId]" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="model-quiz/[modelExamId]" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="leaderboard/[dailyExamId]" options={{ drawerItemStyle: { display: 'none' } }} />
      
      {/* PDF & Syllabus Screens */}
      <Drawer.Screen name="exam-calendar" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="pyq-exam" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="pyq-list/[examId]" options={{ drawerItemStyle: { display: 'none' } }} />
      
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
