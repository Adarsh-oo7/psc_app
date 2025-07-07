import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import useSWR from 'swr';
import { useAppContext } from '@/context/AppContext';
import { Ionicons } from '@expo/vector-icons';

// Reusable component for each menu item
// CORRECTED: The component now correctly accepts a 'title' prop instead of 'text'
const ProfileMenuItem = ({ icon, title, onPress, isDarkMode, isDestructive = false }: any) => (
    <TouchableOpacity style={[styles.menuItem, isDarkMode && styles.menuItemDark]} onPress={onPress}>
        <Ionicons name={icon} size={22} color={isDestructive ? '#ef4444' : (isDarkMode ? '#64b5f6' : '#1976d2')} />
        <Text style={[styles.menuItemText, isDestructive && styles.destructiveText, isDarkMode && styles.textDark]}>{title}</Text>
        {!isDestructive && <Ionicons name="chevron-forward-outline" size={22} color={isDarkMode ? "#555" : "#ccc"} />}
    </TouchableOpacity>
);

export default function ProfileScreen() {
    const { user, logout, fetcher, theme, isLoading: isContextLoading } = useAppContext();
    const router = useRouter();
    const isDarkMode = theme === 'dark';

    const { data: profile, error, isLoading } = useSWR(user ? '/auth/profile/' : null, fetcher);

    const handleLogout = () => {
        logout();
        router.replace('/login');
    };

    if (isContextLoading || isLoading) {
        return <View style={[styles.centered, isDarkMode && styles.containerDark]}><ActivityIndicator size="large" /></View>;
    }

    if (error) {
        return <View style={[styles.centered, isDarkMode && styles.containerDark]}><Text style={isDarkMode && styles.textDark}>Failed to load profile.</Text></View>;
    }

    return (
        <SafeAreaView style={[styles.safeArea, isDarkMode && styles.containerDark]}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.profileHeader}>
                    <View style={[styles.avatarContainer, isDarkMode && styles.avatarContainerDark]}>
                        <Image
                            source={{ uri: profile?.profile_photo || 'https://via.placeholder.com/150' }}
                            style={styles.avatar}
                        />
                    </View>
                    <Text style={[styles.username, isDarkMode && styles.textDark]}>{profile?.user?.full_name || user?.username}</Text>
                    <Text style={[styles.email, isDarkMode && styles.emailDark]}>{user?.email}</Text>
                </View>

                {/* Account Section */}
                <View style={[styles.menuSection, isDarkMode && styles.menuSectionDark]}>
                    <ProfileMenuItem icon="person-outline" title="Edit Profile" onPress={() => router.push('/edit-profile')} isDarkMode={isDarkMode} />
                    <ProfileMenuItem icon="stats-chart-outline" title="My Progress" onPress={() => router.push('/(tabs)/progress')} isDarkMode={isDarkMode} />
                </View>

                {/* Settings & Support Section */}
                <View style={[styles.menuSection, isDarkMode && styles.menuSectionDark]}>
                    <ProfileMenuItem icon="settings-outline" title="Settings" onPress={() => router.push('/settings')} isDarkMode={isDarkMode} />
                    <ProfileMenuItem icon="help-circle-outline" title="Help & Support" onPress={() => {}} isDarkMode={isDarkMode} />
                </View>

                {/* Logout Section */}
                <View style={[styles.menuSection, isDarkMode && styles.menuSectionDark]}>
                    <ProfileMenuItem icon="log-out-outline" title="Log Out" onPress={handleLogout} isDarkMode={isDarkMode} isDestructive={true} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f0f2f5' },
    container: { paddingVertical: 24, paddingBottom: 100 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    profileHeader: { alignItems: 'center', marginBottom: 32, paddingHorizontal: 24 },
    avatarContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
    avatar: { width: '100%', height: '100%', borderRadius: 60 },
    username: { fontSize: 24, fontWeight: 'bold', marginTop: 16, color: '#1f2937' },
    email: { fontSize: 16, color: '#6b7280', marginTop: 4 },
    menuSection: { backgroundColor: '#fff', borderRadius: 12, marginHorizontal: 16, marginBottom: 16, overflow: 'hidden' },
    menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f0f2f5' },
    menuItemText: { flex: 1, marginLeft: 16, fontSize: 16, color: '#1f2937' },
    destructiveText: { color: '#ef4444' },
    containerDark: { backgroundColor: '#121212' },
    textDark: { color: '#fff' },
    emailDark: { color: '#9ca3af' },
    avatarContainerDark: { backgroundColor: '#1f2937' },
    menuSectionDark: { backgroundColor: '#1f2937', borderColor: '#374151' },
    menuItemDark: { borderBottomColor: '#374151' },
});