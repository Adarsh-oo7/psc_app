'use client';

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView, TouchableOpacity, Button, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import useSWR from 'swr';
import { useAppContext } from '@/context/AppContext';
import { Ionicons } from '@expo/vector-icons';

export default function StudyModePage() {
    const params = useLocalSearchParams();
    const { fetcher, theme } = useAppContext();
    const router = useRouter();
    const isDarkMode = theme === 'dark';

    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);

    const apiUrl = useMemo(() => {
        const examId = params.exam_id;
        const topicId = params.topic_id;
        if (!examId && !topicId) return null;
        
        const queryParams = new URLSearchParams();
        if (examId) queryParams.append('exam_id', String(examId));
        if (topicId) queryParams.append('topic_id', String(topicId));
        
        // In study mode, we fetch all questions for the category
        return `/questions/?${queryParams.toString()}`;
    }, [params]);

    const { data: questions, error, isLoading } = useSWR(apiUrl, fetcher);

    if (isLoading) return <View style={[styles.centered, isDarkMode && styles.containerDark]}><ActivityIndicator size="large" /></View>;
    if (error || !questions || questions.length === 0) {
        return (
            <View style={[styles.centered, isDarkMode && styles.containerDark]}>
                <Text style={isDarkMode && styles.textDark}>No questions found for this selection.</Text>
                <Button title="Go Back" onPress={() => router.back()} />
            </View>
        );
    }

    const currentQuestion = questions[currentIndex];

    const goToNext = () => {
        if (currentIndex < questions.length - 1) {
            setShowAnswer(false);
            setCurrentIndex(prev => prev + 1);
        }
    };
    const goToPrev = () => {
        if (currentIndex > 0) {
            setShowAnswer(false);
            setCurrentIndex(prev => prev - 1);
        }
    };

    return (
        <SafeAreaView style={[styles.safeArea, isDarkMode && styles.containerDark]}>
            <Stack.Screen options={{ title: 'Study Mode', headerTintColor: isDarkMode ? '#fff' : '#000' }} />
            <ScrollView contentContainerStyle={styles.contentContainer}>
                <View style={[styles.card, isDarkMode && styles.cardDark]}>
                    <Text style={[styles.progressText, isDarkMode && styles.textSecondaryDark]}>Question {currentIndex + 1} of {questions.length}</Text>
                    <Text style={[styles.questionText, isDarkMode && styles.textDark]}>{currentQuestion.text}</Text>
                    
                    <TouchableOpacity style={styles.showAnswerButton} onPress={() => setShowAnswer(!showAnswer)}>
                        <Ionicons name="bulb-outline" size={20} color="#fff" />
                        <Text style={styles.buttonText}>{showAnswer ? "Hide Answer" : "Show Answer"}</Text>
                    </TouchableOpacity>

                    {showAnswer && (
                        <View style={styles.answerContainer}>
                            {Object.entries(currentQuestion.options).map(([key, value]) => (
                                <View key={key} style={[styles.optionRow, key === currentQuestion.correct_answer && styles.correctOptionRow]}>
                                    <Text style={[styles.optionKey, key === currentQuestion.correct_answer && styles.correctOptionKey]}>{key}</Text>
                                    <Text style={[styles.optionValue, isDarkMode && styles.textDark, key === currentQuestion.correct_answer && styles.correctOptionValue]}>{value as string}</Text>
                                </View>
                            ))}
                            {currentQuestion.explanation && (
                                <Text style={[styles.explanation, isDarkMode && styles.textSecondaryDark]}>
                                    Explanation: {currentQuestion.explanation}
                                </Text>
                            )}
                        </View>
                    )}
                </View>
                
                <View style={styles.navigation}>
                    <Button title="Previous" onPress={goToPrev} disabled={currentIndex === 0} />
                    <Button title="Next" onPress={goToNext} disabled={currentIndex === questions.length - 1} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    safeArea: { flex: 1, backgroundColor: '#f0f2f5' },
    container: { flex: 1 },
    containerDark: { backgroundColor: '#121212' },
    contentContainer: { padding: 16, paddingBottom: 50 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    cardDark: { backgroundColor: '#1f2937', borderWidth: 1, borderColor: '#374151' },
    progressText: { fontSize: 14, color: '#6b7280', marginBottom: 16, textAlign: 'center' },
    questionText: { fontSize: 20, fontWeight: '600', color: '#1f2937', minHeight: 100, marginBottom: 24, lineHeight: 28 },
    showAnswerButton: {
        backgroundColor: '#1976d2',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
    },
    buttonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
    answerContainer: { marginTop: 20, borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 20 },
    optionRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
    optionKey: { fontSize: 16, fontWeight: 'bold', color: '#6b7280', marginRight: 12 },
    optionValue: { fontSize: 16, color: '#1f2937', flex: 1, lineHeight: 22 },
    correctOptionRow: { backgroundColor: 'rgba(46, 164, 79, 0.1)', padding: 8, borderRadius: 6 },
    correctOptionKey: { color: '#2ea44f' },
    correctOptionValue: { color: '#2ea44f', fontWeight: 'bold' },
    explanation: { fontSize: 14, color: '#6b7280', marginTop: 16, fontStyle: 'italic', lineHeight: 20 },
    navigation: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
    textDark: { color: '#fff' },
    textSecondaryDark: { color: '#9ca3af' },
});