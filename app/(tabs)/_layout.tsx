import React from 'react';
import { Tabs, useRouter, useNavigation } from 'expo-router';
import { TouchableOpacity, BackHandler, Alert, View, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CustomTabBar } from '@/components/CustomTabBar';
import { useFocusEffect, useNavigationState, DrawerActions } from '@react-navigation/native';
import { useAppContext } from '@/context/AppContext';

export default function TabLayout() {
  const router = useRouter();
  const navigation = useNavigation();
  const navigationState = useNavigationState(state => state);
  const { theme } = useAppContext();
  const isDarkMode = theme === 'dark';

  // Handle Android back button for better UX
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        const currentRoute = navigationState?.routes[navigationState.index];
        if (currentRoute?.name === '(tabs)') {
          const currentTabState = currentRoute.state;
          if (currentTabState) {
            const currentTabName = currentTabState.routes[currentTabState.index]?.name;
            if (currentTabName !== 'index') {
              router.push('/(tabs)/');
              return true;
            }
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

  // Custom header with shadow and rounded corners for a modern look
  const CustomHeader = ({ navigation }) => (
    <View
      style={{
        backgroundColor: isDarkMode ? '#1f2937' : '#4A3780', // Standard theme: blue for light, dark gray for dark
        paddingTop: Platform.OS === 'ios' ? 54 : 30,
        paddingBottom: 16,
        paddingHorizontal: 16,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 6,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <TouchableOpacity 
        onPress={() => navigation.dispatch(DrawerActions.openDrawer())} 
        style={{ padding: 8 }}
      >
        <Ionicons name="menu" size={28} color="#fff" />
      </TouchableOpacity>
      <Text
        style={{
          color: '#fff',
          fontWeight: 'bold',
          fontSize: 22,
          letterSpacing: 1.1,
          textShadowColor: 'rgba(0,0,0,0.18)',
          textShadowOffset: { width: 1, height: 2 },
          textShadowRadius: 3,
        }}
      >
        PSC WINNER
      </Text>
      <TouchableOpacity 
        onPress={() => router.push('/inbox')} 
        style={{ padding: 8 }}
      >
        <Ionicons name="chatbubble-outline" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  return (
    <Tabs
      tabBar={props => <CustomTabBar {...props} />}
      initialRouteName="index"
      screenOptions={{
        header: (props) => <CustomHeader {...props} />,
        headerShown: true,
      }}
    >
      <Tabs.Screen name="community" options={{ title: 'Community' }} />
      <Tabs.Screen 
        name="index"
        options={{
          headerShown: false, // Hide only for home
        }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="practice" options={{ href: null }} />
      <Tabs.Screen name="study" options={{ href: null }} />
      <Tabs.Screen name="progress" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="daily-exam" options={{ title: 'Daily Exam' }} />

    </Tabs>
  );
}