import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import useSWR from 'swr';
import { useAppContext } from '@/context/AppContext';
import { Ionicons } from '@expo/vector-icons';

export default function ModelExamListScreen() {
    const { examId, examName } = useLocalSearchParams<{ examId: string, examName: string }>();
    const { fetcher, theme } = useAppContext();
    const router = useRouter();
    const isDarkMode = theme === 'dark';

    const { data: modelExams, error, isLoading } = useSWR(examId ? `/exams/${examId}/model-exams/` : null, fetcher);

    if (isLoading) return <View style={[styles.centered, isDarkMode && styles.containerDark]}><ActivityIndicator size="large" /></View>;
    if (error) return <View style={[styles.centered, isDarkMode && styles.containerDark]}><Text style={isDarkMode && styles.textDark}>Failed to load model exams.</Text></View>;

    return (
        <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
            <Stack.Screen options={{ title: examName || 'Model Exams', headerTintColor: isDarkMode ? '#fff' : '#000' }} />
            <FlatList
                data={modelExams || []}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[styles.examRow, isDarkMode && styles.examRowDark]}
                        // CORRECTED: This now navigates to the new dedicated model quiz page
                        onPress={() => router.push(`/model-quiz/${item.id}`)}
                    >
                        <View style={[styles.iconContainer, isDarkMode && styles.iconContainerDark]}>
                            <Ionicons name="document-text-outline" size={24} color={isDarkMode ? "#A78BFA" : "#4A3780"} />
                        </View>
                        <View style={styles.examContent}>
                            <Text style={[styles.examRowText, isDarkMode && styles.textDark]}>{item.name}</Text>
                            <Text style={[styles.examRowCountText, isDarkMode && styles.textSecondaryDark]}>
                                {item.duration_minutes} minutes
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={22} color={isDarkMode ? "#555" : "#ccc"} />
                    </TouchableOpacity>
                )}
                ListHeaderComponent={
                    <Text style={[styles.screenTitle, isDarkMode && styles.textDark]}>
                        Available Model Papers for {examName}
                    </Text>
                }
                ListEmptyComponent={
                    <View style={styles.centered}>
                        <Text style={[styles.noExamsText, isDarkMode && styles.textSecondaryDark]}>
                            No model exams have been added for {examName} yet.
                        </Text>
                    </View>
                }
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2f5' },
    containerDark: { backgroundColor: '#121212' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },
    screenTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, paddingHorizontal: 8 },
    examRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, padding: 16, elevation: 3 },
    examRowDark: { backgroundColor: '#1f2937', borderWidth: 1, borderColor: '#374151' },
    iconContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    iconContainerDark: { backgroundColor: 'rgba(74, 55, 128, 0.2)' },
    examContent: { flex: 1 },
    examRowText: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
    examRowCountText: { marginTop: 4, color: '#6b7280', fontSize: 14 },
    noExamsText: { color: '#6b7280', fontSize: 16, textAlign: 'center', paddingHorizontal: 20 },
    textDark: { color: '#fff' },
    textSecondaryDark: { color: '#9ca3af' },
});
