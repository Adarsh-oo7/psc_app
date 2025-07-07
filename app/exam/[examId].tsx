import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
// CORRECTED: Import the correct hooks from expo-router
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import useSWR from 'swr';
import { useAppContext } from '@/context/AppContext';
import { Ionicons } from '@expo/vector-icons';

const ModeCard = ({ title, description, icon, onPress, isDarkMode }: any) => (
    <TouchableOpacity style={[styles.card, isDarkMode && styles.cardDark]} onPress={onPress}>
        <Ionicons name={icon} size={40} color={isDarkMode ? '#64b5f6' : '#1976d2'} />
        <Text style={[styles.cardTitle, isDarkMode && styles.textDark]}>{title}</Text>
        <Text style={[styles.cardDescription, isDarkMode && styles.textSecondaryDark]}>{description}</Text>
    </TouchableOpacity>
);

export default function ExamModeSelectionPage() {
    const router = useRouter();
    // CORRECTED: Use useLocalSearchParams to get the ID from the URL
    const { examId } = useLocalSearchParams<{ examId: string }>(); 
    const { fetcher, theme } = useAppContext();
    const isDarkMode = theme === 'dark';

    // The API endpoint to fetch a single exam's details
    const { data: exam, error, isLoading } = useSWR(examId ? `/exams/${examId}/` : null, fetcher);

    if (isLoading) return <View style={[styles.centered, isDarkMode && styles.containerDark]}><ActivityIndicator size="large" /></View>;
    if (error) return <View style={[styles.centered, isDarkMode && styles.containerDark]}><Text style={isDarkMode && styles.textDark}>Could not load exam details.</Text></View>;

    return (
        <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
            <Stack.Screen options={{ title: exam?.name || 'Select Mode', headerTintColor: isDarkMode ? '#fff' : '#000' }} />
            <View style={styles.header}>
                <Text style={[styles.headerTitle, isDarkMode && styles.textDark]}>{exam?.name}</Text>
                <Text style={[styles.headerSubtitle, isDarkMode && styles.textSecondaryDark]}>How would you like to practice?</Text>
            </View>
            <View style={styles.cardContainer}>
                <ModeCard
                    title="Study Mode"
                    description="Go through all questions like flashcards. See answers and explanations instantly."
                    icon="library-outline"
                    onPress={() => router.push(`/study?exam_id=${examId}`)}
                    isDarkMode={isDarkMode}
                />
                <ModeCard
                    title="Quiz Mode"
                    description="Take a timed quiz with 15 random questions from this exam."
                    icon="timer-outline"
                    onPress={() => router.push(`/quiz?exam_id=${examId}`)}
                    isDarkMode={isDarkMode}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    container: { flex: 1, backgroundColor: '#f0f2f5', padding: 16 },
    containerDark: { backgroundColor: '#121212' },
    header: { paddingVertical: 24, alignItems: 'center' },
    headerTitle: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', color: '#1f2937' },
    headerSubtitle: { fontSize: 16, color: '#6b7280', marginTop: 8, textAlign: 'center' },
    cardContainer: { flex: 1, justifyContent: 'center', gap: 20 },
    card: { backgroundColor: '#fff', padding: 24, borderRadius: 16, alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
    cardDark: { backgroundColor: '#1f2937' },
    cardTitle: { fontSize: 22, fontWeight: 'bold', marginTop: 16, marginBottom: 8, color: '#1f2937' },
    cardDescription: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
    textDark: { color: '#fff' },
    textSecondaryDark: { color: '#9ca3af' },
});