import React from 'react';
import { Tabs, useRouter, useNavigation } from 'expo-router';
import { TouchableOpacity, BackHandler, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CustomTabBar } from '@/components/CustomTabBar';
import { useFocusEffect, useNavigationState, DrawerActions } from '@react-navigation/native';

export default function TabLayout() {
  const router = useRouter();
  const navigation = useNavigation();
  const navigationState = useNavigationState(state => state);

  // This hook handles the Android back button correctly
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        const currentRoute = navigationState?.routes[navigationState.index];
        
        // This logic correctly handles exiting the app from the home screen.
        if (currentRoute?.name === '(tabs)') {
            const currentTabName = currentRoute.state?.routes[currentRoute.state.index]?.name;
            if (currentTabName !== 'index') {
                router.push('/(tabs)/');
                return true;
            }
        } else if (router.canGoBack()) {
            router.back();
            return true;
        }

        Alert.alert(
          "Exit App",
          "Are you sure you want to exit PSC WINNER?",
          [
            { text: "Cancel", style: "cancel", onPress: () => null },
            { text: "Exit", style: "destructive", onPress: () => BackHandler.exitApp() }
          ]
        );
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigationState, router])
  );

  return (
    <Tabs
      tabBar={props => <CustomTabBar {...props} />}
      initialRouteName="index"
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#4A3780' },
        headerTitle: "PSC WINNER",
        headerTitleStyle: { color: '#fff', fontWeight: 'bold' },
        headerTitleAlign: 'center',
        headerLeft: () => (
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/notifications')} 
            style={{ marginLeft: 16, padding: 8 }}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={28} color="#fff" />
          </TouchableOpacity>
        ),
        // --- The headerRight now shows the original progress icon ---
        headerRight: () => (
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/progress')} 
            style={{ marginRight: 16, padding: 8 }}
          >
            <Ionicons name="stats-chart" size={24} color="#fff" />
          </TouchableOpacity>
        ),
      }}
    >
      {/* The three tabs for your design */}
      <Tabs.Screen name="community" options={{ title: 'Community' }} />
      <Tabs.Screen 
        name="index"
        options={{ headerShown: false }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      
      {/* The notifications tab is part of the layout but hidden from the bottom bar */}
      <Tabs.Screen name="notifications" options={{ title: 'Notifications', href: null }} />

      {/* Hide all other screens from the tab bar */}
      <Tabs.Screen name="practice" options={{ href: null }} />
      <Tabs.Screen name="study" options={{ href: null }} />
      <Tabs.Screen name="progress" options={{ title: 'My Progress', href: null }} />
      <Tabs.Screen name="exams" options={{ href: null }} />
      <Tabs.Screen name="topics" options={{ href: null }} />
      <Tabs.Screen name="search" options={{ href: null }} />
    </Tabs>
  );
}
