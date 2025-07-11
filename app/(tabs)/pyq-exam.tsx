'use client';

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import useSWR from 'swr';
import { useAppContext } from '@/context/AppContext';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PYQExamScreen() {
    const { fetcher, theme } = useAppContext();
    const router = useRouter();
    const isDarkMode = theme === 'dark';
    const { data: categories, error, isLoading } = useSWR('/exams/', fetcher);

    const handleExamSelect = (examId: string, examName: string) => {
        router.push({
            pathname: `/pyq-list/${examId}`,
            params: { examName }
        });
    };

    if (isLoading) return <View style={[styles.centered, isDarkMode && styles.containerDark]}><ActivityIndicator size="large" /></View>;
    if (error) return <View style={[styles.centered, isDarkMode && styles.containerDark]}><Text style={isDarkMode && styles.textDark}>Failed to load exams.</Text></View>;

    return (
        <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
            <Stack.Screen options={{ title: 'Previous Year Papers', headerTintColor: isDarkMode ? '#fff' : '#000' }} />
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                {categories?.map((category: any) => (
                    <View key={category.id} style={styles.categorySection}>
                        <Text style={[styles.categoryTitle, isDarkMode && styles.categoryTitleDark]}>{category.name}</Text>
                        {category.exams.map((exam: any) => (
                            <TouchableOpacity key={exam.id} style={[styles.examRow, isDarkMode && styles.examRowDark]} onPress={() => handleExamSelect(exam.id, exam.name)}>
                                <Ionicons name="document-attach-outline" size={22} color={isDarkMode ? '#A78BFA' : '#4A3780'} />
                                <Text style={[styles.examRowText, isDarkMode && styles.textDark]}>{exam.name} ({exam.year})</Text>
                                <Ionicons name="chevron-forward" size={22} color={isDarkMode ? "#555" : "#ccc"} style={{ marginLeft: 'auto' }} />
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2f5' },
    containerDark: { backgroundColor: '#121212' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    categorySection: { marginBottom: 16 },
    categoryTitle: { fontSize: 20, fontWeight: 'bold', color: '#374151', paddingHorizontal: 16, marginBottom: 12, marginTop: 10 },
    categoryTitleDark: { color: '#e5e7eb' },
    examRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        padding: 16,
        borderRadius: 10,
        marginBottom: 8,
        elevation: 2,
    },
    examRowDark: { backgroundColor: '#1f2937' },
    examRowText: { fontSize: 16, marginLeft: 16, flex: 1 },
    textDark: { color: '#fff' },
});
