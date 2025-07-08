import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '@/context/AppContext';

export default function GameScreen() {
    const { theme } = useAppContext();
    const isDarkMode = theme === 'dark';
    return (
        <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
            <View style={styles.centered}>
                <Ionicons name="game-controller-outline" size={100} color={isDarkMode ? "#fff" : "#4A3780"} />
                <Text style={[styles.title, isDarkMode && styles.textDark]}>Game Mode</Text>
                <Text style={[styles.subtitle, isDarkMode && styles.textSecondaryDark]}>Coming Soon!</Text>
                <TouchableOpacity style={styles.button} onPress={() => Alert.alert("Game Mode Coming Soon!")}>
                    <Text style={styles.buttonText}>Stay Tuned</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2f5' },
    containerDark: { backgroundColor: '#121212' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 28, fontWeight: 'bold', color: '#4A3780', marginTop: 20 },
    subtitle: { fontSize: 18, color: '#666', marginVertical: 10 },
    button: { backgroundColor: '#4A3780', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 20 },
    buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
    textDark: { color: '#fff' },
    textSecondaryDark: { color: '#9ca3af' },
});