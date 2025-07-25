import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import useSWR from 'swr';
import { useAppContext } from '@/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import * as Progress from 'react-native-progress';

// Reusable component for each menu item
const ProfileMenuItem = ({ icon, title, onPress, isDarkMode, isDestructive = false }) => (
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

    // Dummy values if not present in profile
    const overallProgress = profile?.overall_progress ?? 0.65;
    const studyTimeProgress = profile?.study_time_progress ?? 0.45;
    const examPrepProgress = profile?.exam_prep_progress ?? 0.75;
    const streakProgress = profile?.streak_progress ?? 0.9;

    return (
        <SafeAreaView style={[styles.safeArea, isDarkMode && styles.containerDark]}>
            <ScrollView contentContainerStyle={styles.container}>
                {/* Profile Avatar and Name */}
                <View style={styles.profileHeader}>
                    <View style={[styles.avatarContainer, isDarkMode && styles.avatarContainerDark]}>
                        <Image
                            source={{ uri: profile?.profile_photo || 'https://via.placeholder.com/150' }}
                            style={styles.avatar}
                        />
                    </View>
                    <Text style={[styles.username, isDarkMode && styles.textDark]} numberOfLines={1} ellipsizeMode="tail">
                        {profile?.user?.full_name || user?.username}
                    </Text>
                    
                    {/* Graphical progress charts */}
                    <View style={styles.graphRow}>
                      <View style={styles.graphCard}>
                        <Progress.Circle
                            size={72}
                            progress={overallProgress}
                            showsText
                            formatText={() => `${Math.round(overallProgress * 100)}%`}
                            color={isDarkMode ? "#64b5f6" : "#1976d2"}
                            unfilledColor={isDarkMode ? "#252A34" : "#e5e7eb"}
                            borderWidth={0}
                            thickness={7}
                            textStyle={{
                                color: isDarkMode ? "#fff" : "#333",
                                fontWeight: "bold",
                                fontSize: 15
                            }}
                        />
                        <Text style={[styles.graphLabel, isDarkMode && styles.textDark]}>Overall</Text>
                      </View>
                      <View style={styles.graphCard}>
                        <Progress.Circle
                            size={72}
                            progress={studyTimeProgress}
                            showsText
                            formatText={() => `${Math.round(studyTimeProgress * 100)}%`}
                            color="#f59e42"
                            unfilledColor={isDarkMode ? "#252A34" : "#fdebd3"}
                            borderWidth={0}
                            thickness={7}
                            textStyle={{
                                color: isDarkMode ? "#fff" : "#f59e42",
                                fontWeight: "bold",
                                fontSize: 15
                            }}
                        />
                        <Text style={[styles.graphLabel, isDarkMode && styles.textDark]}>Study Time</Text>
                      </View>
                      <View style={styles.graphCard}>
                        <Progress.Circle
                            size={72}
                            progress={examPrepProgress}
                            showsText
                            formatText={() => `${Math.round(examPrepProgress * 100)}%`}
                            color="#2ecc71"
                            unfilledColor={isDarkMode ? "#252A34" : "#e9fbe5"}
                            borderWidth={0}
                            thickness={7}
                            textStyle={{
                                color: isDarkMode ? "#fff" : "#2ecc71",
                                fontWeight: "bold",
                                fontSize: 15
                            }}
                        />
                        <Text style={[styles.graphLabel, isDarkMode && styles.textDark]}>Exam Prep</Text>
                      </View>
                    </View>
                    {/* Bonus: Daily streak or consistency */}
                    <View style={styles.streakContainer}>
                        <Progress.Bar
                            progress={streakProgress}
                            width={220}
                            height={12}
                            color="#fca311"
                            unfilledColor={isDarkMode ? "#252A34" : "#ffecc8"}
                            borderWidth={0}
                            style={{ marginVertical: 8, borderRadius: 8 }}
                        />
                        <Text style={[styles.streakLabel, isDarkMode && styles.textDark]}>
                            Daily Streak: {Math.round(streakProgress * 100)}%
                        </Text>
                    </View>
                    <Text style={[styles.email, isDarkMode && styles.emailDark]} numberOfLines={1} ellipsizeMode="tail">
                        {user?.email}
                    </Text>
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
    container: { paddingVertical: 28, paddingBottom: 110 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 30,
        paddingHorizontal: 26,
        paddingTop: 10,
    },
    avatarContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.11,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 60,
        borderWidth: 2,
        borderColor: '#e0e7ef'
    },
    username: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 18,
        color: '#1f2937',
        maxWidth: 240,
        textAlign: 'center'
    },
    email: {
        fontSize: 16,
        color: '#6b7280',
        marginTop: 5,
        maxWidth: 240,
        textAlign: 'center'
    },
    graphRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginVertical: 16,
        marginTop: 12
    },
    graphCard: { alignItems: 'center', marginHorizontal: 10 },
    graphLabel: {
        marginTop: 6,
        fontSize: 13,
        color: '#444',
        fontWeight: '600'
    },
    streakContainer: { alignItems: 'center', marginBottom: 6 },
    streakLabel: { fontSize: 13, color: '#fca311', fontWeight: '600' },
    menuSection: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginHorizontal: 16,
        marginBottom: 18,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.045,
        shadowRadius: 4,
        elevation: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6'
    },
    menuItemText: {
        flex: 1,
        marginLeft: 18,
        fontSize: 16,
        color: '#1f2937',
        fontWeight: '500'
    },
    destructiveText: { color: '#ef4444' },
    containerDark: { backgroundColor: '#121212' },
    textDark: { color: '#fff' },
    emailDark: { color: '#9ca3af' },
    avatarContainerDark: { backgroundColor: '#1f2937' },
    menuSectionDark: {
        backgroundColor: '#1f2937',
        borderColor: '#374151',
        shadowColor: '#23232b',
        
    },
    menuItemDark: { borderBottomColor: '#2a2c35' },
});