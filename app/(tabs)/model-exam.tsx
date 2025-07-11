'use client';

import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import useSWR from 'swr';
import { useAppContext } from '@/context/AppContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const ExamCard = ({ item, onPress, isDarkMode }: { item: any, onPress: () => void, isDarkMode: boolean }) => (
  <TouchableOpacity style={[styles.card, isDarkMode && styles.cardDark]} onPress={onPress}>
    <Ionicons name="school-outline" size={32} color={isDarkMode ? '#A78BFA' : '#4A3780'} />
    <Text style={[styles.cardTitle, isDarkMode && styles.textDark]}>{item.name}</Text>
    <Text style={[styles.cardSubtitle, isDarkMode && styles.textSecondaryDark]}>({item.year})</Text>
  </TouchableOpacity>
);

export default function ModelExamScreen() {
    const { fetcher, theme } = useAppContext();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const { data: categories, error, isLoading } = useSWR('/exams/', fetcher);
    const isDarkMode = theme === 'dark';

    const handleExamSelect = (examId: string, examName: string) => {
        // Navigate to the screen that lists the model papers for this exam
        router.push({
            pathname: `/model-exam-list/${examId}`,
            params: { examName: examName }
        });
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
    
    if (isLoading) return <View style={[styles.centered, isDarkMode && styles.containerDark]}><ActivityIndicator size="large" /></View>;
    if (error) return <View style={[styles.centered, isDarkMode && styles.containerDark]}><Text style={isDarkMode && styles.textDark}>Failed to load exams.</Text></View>;

    return (
        <SafeAreaView style={[styles.safeArea, isDarkMode && styles.containerDark]}>
            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
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
                                    <ExamCard item={exam} onPress={() => handleExamSelect(exam.id.toString(), exam.name)} isDarkMode={isDarkMode} />
                                </View>
                            ))}
                        </View>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f0f2f5' },
    containerDark: { backgroundColor: '#121212' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    searchBar: { height: 44, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 22, paddingHorizontal: 16, marginHorizontal: 16, marginVertical: 16, backgroundColor: '#fff', fontSize: 16 },
    categorySection: { marginBottom: 24 },
    categoryTitle: { fontSize: 20, fontWeight: 'bold', color: '#374151', paddingHorizontal: 16, marginBottom: 12 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
    gridItem: { width: '50%' },
    card: { flex: 1, margin: 8, aspectRatio: 1, backgroundColor: '#fff', borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 2 },
    cardTitle: { fontSize: 16, fontWeight: '600', textAlign: 'center', marginTop: 8, color: '#374151', paddingHorizontal: 4 },
    cardSubtitle: { fontSize: 12, color: '#6b7280' },
    searchBarDark: { backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' },
    categoryTitleDark: { color: '#e5e7eb' },
    cardDark: { backgroundColor: '#1f2937' },
    textDark: { color: '#fff' },
    textSecondaryDark: { color: '#9ca3af' },
});
