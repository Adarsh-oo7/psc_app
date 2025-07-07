'use client';

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, SafeAreaView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '@/context/AppContext';

// Reusable component for each setting row
// CORRECTED: It now accepts an `isDarkMode` prop to style its text correctly
const SettingRow = ({ icon, title, subtitle, onNavigate, hasSwitch, switchValue, onSwitchChange, isDarkMode }: any) => (
  <TouchableOpacity style={[styles.row, isDarkMode && styles.rowDark]} onPress={onNavigate} disabled={hasSwitch || !onNavigate}>
    <View style={[styles.iconContainer, isDarkMode && styles.iconContainerDark]}>
        <Ionicons name={icon} size={20} color={isDarkMode ? "#9ca3af" : "#4b5563"} />
    </View>
    <View style={styles.textContainer}>
        <Text style={[styles.rowTitle, isDarkMode && styles.textDark]}>{title}</Text>
        {subtitle && <Text style={[styles.rowSubtitle, isDarkMode && styles.rowSubtitleDark]}>{subtitle}</Text>}
    </View>
    {hasSwitch ? (
        <Switch value={switchValue} onValueChange={onSwitchChange} trackColor={{ false: "#767577", true: "#1976d2" }} />
    ) : (
        <Ionicons name="chevron-forward-outline" size={20} color="#9ca3af" />
    )}
  </TouchableOpacity>
);

export default function SettingsScreen() {
    const router = useRouter();
    const { logout, theme, toggleTheme } = useAppContext();
    const isDarkMode = theme === 'dark';

    const [fontSize, setFontSize] = useState('medium');

    const handleLogout = () => {
      logout();
      router.replace('/login');
    };

    const handleContactUs = () => Linking.openURL('mailto:support@yourapp.com');
    const handleRateApp = () => Linking.openURL('market://details?id=com.yourapp.package');

    return (
        <SafeAreaView style={[styles.safeArea, isDarkMode && styles.safeAreaDark]}>
            <ScrollView style={styles.container}>
                <View style={[styles.header, isDarkMode && styles.headerDark]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back-outline" size={28} color={isDarkMode ? "#fff" : "#1f2937"} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>Settings</Text>
                </View>

                <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Appearance</Text>
                <View style={[styles.section, isDarkMode && styles.sectionDark]}>
                    <SettingRow 
                        icon="contrast-outline" 
                        title="Dark Mode" 
                        hasSwitch={true}
                        switchValue={isDarkMode}
                        onSwitchChange={toggleTheme}
                        isDarkMode={isDarkMode}
                    />
                    <SettingRow 
                        icon="text-outline" 
                        title="Font Size" 
                        subtitle={fontSize.charAt(0).toUpperCase() + fontSize.slice(1)}
                        onNavigate={() => {}}
                        isDarkMode={isDarkMode}
                    />
                </View>

                <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Account</Text>
                <View style={[styles.section, isDarkMode && styles.sectionDark]}>
                    <SettingRow icon="person-outline" title="Edit Profile" onNavigate={() => router.push('/(tabs)/profile')} isDarkMode={isDarkMode} />
                    <SettingRow icon="key-outline" title="Change Password" onNavigate={() => {}} isDarkMode={isDarkMode} />
                </View>

                <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Support & Feedback</Text>
                <View style={[styles.section, isDarkMode && styles.sectionDark]}>
                    <SettingRow icon="help-circle-outline" title="Help Center" onNavigate={() => {}} isDarkMode={isDarkMode} />
                    <SettingRow icon="mail-outline" title="Contact Us" onNavigate={handleContactUs} isDarkMode={isDarkMode} />
                    <SettingRow icon="star-outline" title="Rate the App" onNavigate={handleRateApp} isDarkMode={isDarkMode} />
                </View>

                <TouchableOpacity style={[styles.logoutButton, isDarkMode && styles.logoutButtonDark]} onPress={handleLogout}>
                    <Text style={[styles.logoutButtonText, isDarkMode && styles.logoutButtonTextDark]}>Log Out</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f4f5f7' },
    safeAreaDark: { backgroundColor: '#000' },
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    headerDark: { backgroundColor: '#121212', borderBottomColor: '#374151' },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1f2937' },
    headerTitleDark: { color: '#fff' },
    backButton: { padding: 8, marginRight: 16 },
    sectionTitle: { fontSize: 14, fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', paddingHorizontal: 24, marginTop: 24, marginBottom: 8 },
    sectionTitleDark: { color: '#9ca3af' },
    section: { backgroundColor: '#fff', borderRadius: 12, marginHorizontal: 16, overflow: 'hidden' },
    sectionDark: { backgroundColor: '#1f2937', borderColor: '#374151' },
    row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f2f5' },
    rowDark: { borderBottomColor: '#374151'},
    iconContainer: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    iconContainerDark: { backgroundColor: '#374151' },
    textContainer: { flex: 1 },
    rowTitle: { fontSize: 16, fontWeight: '500', color: '#1f2937' },
    rowSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },
    rowSubtitleDark: { color: '#9ca3af' },
    textDark: { color: '#fff' },
    logoutButton: { margin: 24, marginTop: 40, padding: 16, backgroundColor: '#fee2e2', borderRadius: 8, alignItems: 'center' },
    logoutButtonDark: { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
    logoutButtonText: { color: '#ef4444', fontWeight: 'bold', fontSize: 16 },
    logoutButtonTextDark: { color: '#fca5a5' },
});