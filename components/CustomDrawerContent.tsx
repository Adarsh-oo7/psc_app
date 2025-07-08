import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContext } from '@/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import useSWR from 'swr';

export function CustomDrawerContent(props: any) {
  const { user, logout, theme, fetcher } = useAppContext();
  const router = useRouter();
  const isDarkMode = theme === 'dark';
  const insets = useSafeAreaInsets();

  const { data: profile } = useSWR(user ? '/auth/profile/' : null, fetcher);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDarkMode ? '#18181b' : '#f8fafc' }}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{
          paddingTop: insets.top || 0,
          backgroundColor: isDarkMode ? '#18181b' : '#f8fafc',
        }}
      >
        {/* Profile Header in the Drawer */}
        <View style={[styles.header, isDarkMode && styles.headerDark]}>
          <Image
            source={{ uri: profile?.profile_photo || 'https://via.placeholder.com/100' }}
            style={styles.avatar}
          />
          <Text style={[styles.username, isDarkMode && styles.textDark]}>
            {profile?.user?.full_name || user?.username || 'Guest'}
          </Text>
          <Text style={[styles.email, isDarkMode && styles.textSecondaryDark]}>
            {user?.email || ''}
          </Text>
        </View>

        {/* Drawer links */}
        <View style={isDarkMode ? styles.drawerListContainerDark : styles.drawerListContainer}>
          <DrawerItemList 
            {...props} 
            labelStyle={[
              styles.drawerLabel,
              isDarkMode && styles.drawerLabelDark
            ]}
            activeTintColor={isDarkMode ? "#facc15" : "#2563eb"}         // yellow-400 for active in dark, blue-600 in light
            inactiveTintColor={isDarkMode ? "#f3f4f6" : "#334155"}       // gray-100 for inactive in dark, slate-700 in light
          />
        </View>
      </DrawerContentScrollView>

      {/* Logout Button at the bottom of the Drawer */}
      <TouchableOpacity
        onPress={handleLogout}
        style={[
          styles.logoutButton,
          isDarkMode && styles.logoutButtonDark,
        ]}
        activeOpacity={0.75}
      >
        <Ionicons name="log-out-outline" size={22} color="#ef4444" style={{marginRight: 4}} />
        <Text style={[styles.logoutText, isDarkMode && styles.logoutTextDark]}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    padding: 28,
    paddingTop: 42,
    backgroundColor: '#f8fafc', // lightest (tailwind zinc-50)
    borderBottomWidth: 1,
    borderBottomColor: '#e0e7ef',
  },
  headerDark: {
    backgroundColor: '#18181b', // very dark (tailwind zinc-900)
    borderBottomColor: '#27272a',
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    marginBottom: 14,
    backgroundColor: '#e5e7eb',
    borderWidth: 3,
    borderColor: '#fff',
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 3,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  email: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500'
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e7ef',
    backgroundColor: '#fff',
    gap: 8,
  },
  logoutButtonDark: {
    borderTopColor: '#27272a',
    backgroundColor: '#18181b',
  },
  logoutText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ef4444',
    letterSpacing: 0.5,
  },
  logoutTextDark: {
    color: '#fecaca',
  },
  textDark: { color: '#f8fafc' },
  textSecondaryDark: { color: '#d1d5db' },
  drawerListContainer: {
    backgroundColor: '#fff',
    paddingTop: 6,
    paddingBottom: 6,
    marginHorizontal: 8,
    borderRadius: 16,
    marginTop: 18,
    marginBottom: 12,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  drawerListContainerDark: {
    backgroundColor: '#23232c',
    paddingTop: 6,
    paddingBottom: 6,
    marginHorizontal: 8,
    borderRadius: 16,
    marginTop: 18,
    marginBottom: 12,
    shadowColor: "#facc15",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
  },
  drawerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    letterSpacing: 0.2,
  },
  drawerLabelDark: {
    color: '#fde68a', // yellow-200 for best contrast in dark
    fontWeight: '600',
  },
});