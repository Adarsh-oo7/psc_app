'use client';

import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import useSWR from 'swr';
import { useAppContext } from '@/context/AppContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Reusable card component for each exam
const ExamCard = ({ item, onPress, isDarkMode }: { item: any, onPress: () => void, isDarkMode: boolean }) => (
  <TouchableOpacity style={[styles.card, isDarkMode && styles.cardDark]} onPress={onPress}>
    <Ionicons name="school-outline" size={32} color={isDarkMode ? '#64b5f6' : '#1976d2'} />
    <Text style={[styles.cardTitle, isDarkMode && styles.cardTextDark]}>{item.name}</Text>
    <Text style={[styles.cardSubtitle, isDarkMode && styles.cardSubtitleDark]}>({item.year})</Text>
  </TouchableOpacity>
);

export default function PracticeScreen() {
    const { fetcher, setExamId, theme } = useAppContext();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const { data: categories, error, isLoading } = useSWR('/exams/', fetcher);
    const isDarkMode = theme === 'dark';

    const handleExamSelect = (examId: string) => {
        setExamId(examId);
        // Navigate to the new unified practice session page
        router.push(`/practice-session?exam_id=${examId}`);
    };

    const filteredCategories = useMemo(() => {
        if (!categories) return [];
        if (!searchQuery.trim()) return categories;
        const lowercasedQuery = searchQuery.toLowerCase();
        return categories
            .map((category: any) => ({
                ...category,
                exams: category.exams.filter((exam: any) => exam.name.toLowerCase().includes(lowercasedQuery))
            }))
            .filter((category: any) => category.exams.length > 0);
    }, [categories, searchQuery]);
    
    if (isLoading) return <View style={[styles.centered, isDarkMode && styles.containerDark]}><ActivityIndicator size="large" color="#1976d2" /></View>;
    if (error) return <View style={[styles.centered, isDarkMode && styles.containerDark]}><Text style={isDarkMode && styles.textDark}>Failed to load exams.</Text></View>;

    return (
        <ScrollView style={[styles.container, isDarkMode && styles.containerDark]} contentContainerStyle={{ paddingBottom: 100 }}>
            <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>Practice by Exam</Text>
            <TextInput
                style={[styles.searchBar, isDarkMode && styles.searchBarDark]}
                placeholder="Search for an exam..."
                placeholderTextColor={isDarkMode ? "#888" : "#aaa"}
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
            {filteredCategories.map((category: any) => (
                <View key={category.id} style={styles.categorySection}>
                    <Text style={[styles.categoryTitle, isDarkMode && styles.categoryTitleDark]}>{category.name}</Text>
                    <View style={styles.grid}>
                        {category.exams.map((exam: any) => (
                            <View key={exam.id} style={styles.gridItem}>
                                <ExamCard item={exam} onPress={() => handleExamSelect(exam.id.toString())} isDarkMode={isDarkMode} />
                            </View>
                        ))}
                    </View>
                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    container: { flex: 1, backgroundColor: '#f0f2f5' },
    headerTitle: { fontSize: 28, fontWeight: 'bold', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, color: '#1f2937' },
    searchBar: { height: 44, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 16, marginHorizontal: 16, marginBottom: 16, backgroundColor: '#fff', fontSize: 16, color: '#000' },
    categorySection: { marginBottom: 24 },
    categoryTitle: { fontSize: 20, fontWeight: 'bold', color: '#374151', paddingHorizontal: 16, marginBottom: 12 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
    gridItem: { width: '50%' },
    card: { flex: 1, margin: 8, aspectRatio: 1, backgroundColor: '#fff', borderRadius: 12, justifyContent: 'center', alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.20, shadowRadius: 1.41, elevation: 2 },
    cardTitle: { fontSize: 16, fontWeight: '600', textAlign: 'center', marginTop: 8, color: '#374151', paddingHorizontal: 4 },
    cardSubtitle: { fontSize: 12, color: '#6b7280' },
    containerDark: { backgroundColor: '#121212' },
    headerTitleDark: { color: '#fff' },
    searchBarDark: { backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' },
    categoryTitleDark: { color: '#e5e7eb' },
    cardDark: { backgroundColor: '#1f2937' },
    cardTextDark: { color: '#fff' },
    cardSubtitleDark: { color: '#9ca3af' },
    textDark: { color: '#fff' },
});
