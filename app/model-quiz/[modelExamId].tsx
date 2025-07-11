'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from 'expo-router';
import useSWR from 'swr';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, SafeAreaView, Button, BackHandler
} from 'react-native';
import { useAppContext } from '@/context/AppContext';
import apiClient from '@/lib/apiClient';
import { Ionicons } from '@expo/vector-icons';

// --- Type Definitions & Timer Component ---
// ... (These components are correct) ...

// --- Main Model Exam Quiz Component ---
export default function ModelExamQuizPage() {
    const { fetcher, theme } = useAppContext();
    const router = useRouter();
    const params = useLocalSearchParams();
    const isDarkMode = theme === 'dark';
    const { modelExamId } = params;

    const [answers, setAnswers] = useState({});
    const [isFinished, setIsFinished] = useState(false);
    const [resultData, setResultData] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { data: examData, error, isLoading } = useSWR(modelExamId ? `/model-exams/${modelExamId}/` : null, fetcher);
    
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        if (examData?.duration_minutes) {
            setTimeLeft(examData.duration_minutes * 60);
        }
    }, [examData]);

    const submitQuizLogic = useCallback(async () => {
        if (isSubmitting || isFinished) return;
        setIsSubmitting(true);
        const timeTaken = (examData?.duration_minutes * 60) - timeLeft;

        try {
            const response = await apiClient.post(`/model-exams/${modelExamId}/submit/`, { answers, time_taken: timeTaken });
            setResultData(response.data);
            setIsFinished(true);
        } catch (err: any) {
            Alert.alert("Submission Error", err.response?.data?.detail || "There was an error submitting your exam.");
        } finally {
            setIsSubmitting(false);
        }
    }, [answers, timeLeft, examData, isSubmitting, isFinished, modelExamId]);

    const handleConfirmSubmit = useCallback(() => {
        Alert.alert("Submit Exam", "Are you sure you want to finish?", [
            { text: "Cancel", style: "cancel" },
            { text: "Submit", style: "destructive", onPress: submitQuizLogic }
        ]);
    }, [submitQuizLogic]);
    
    // ... useFocusEffect for back button handling is correct ...

    if (isLoading || !examData) return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
    if (error) return <View style={styles.centered}><Text>Failed to load the model exam.</Text></View>;
    
    const { questions } = examData;

    // --- RENDER RESULTS SCREEN ---
    if (isFinished && resultData) {
        return (
            <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
                <View style={[styles.centered, {padding: 20}]}>
                    <Ionicons name="trophy-outline" size={60} color="#ffc107" />
                    <Text style={[styles.resultsTitle, isDarkMode && styles.textDark]}>Exam Complete!</Text>
                    <Text style={[styles.scoreText, isDarkMode && styles.textDark]}>Your Score: {resultData.score.toFixed(1)}%</Text>
                    <Text style={isDarkMode && styles.textSecondaryDark}>({resultData.correct_count} / {resultData.total_questions} Correct)</Text>
                    <View style={{marginTop: 30, flexDirection: 'row', gap: 20}}>
                        <Button title="Retake Exam" onPress={() => setIsFinished(false)} />
                        <Button title="Back to List" onPress={() => router.back()} />
                    </View>
                </View>
            </SafeAreaView>
        );
    }
    
    // --- RENDER QUIZ IN PROGRESS ---
    return (
        <SafeAreaView style={[styles.safeArea, isDarkMode && styles.containerDark]}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={[styles.header, isDarkMode && styles.headerDark]}>
                <TouchableOpacity onPress={() => router.back()} style={{padding: 8}}><Ionicons name="close-outline" size={28} color={isDarkMode ? '#fff' : '#000'} /></TouchableOpacity>
                <Text style={[styles.headerTitle, isDarkMode && styles.textDark]}>{examData.name}</Text>
                {/* ... Timer Component ... */}
            </View>
            <ScrollView contentContainerStyle={{paddingBottom: 100}}>
                {questions.map((q: any, idx: number) => (
                    <View key={q.id} style={[styles.questionCard, isDarkMode && styles.cardDark]}>
                        <Text style={[styles.questionText, isDarkMode && styles.textDark]}>{idx + 1}. {q.text}</Text>
                        {Object.entries(q.options).map(([key, value]) => (
                            <TouchableOpacity key={key} style={[styles.optionRow, answers[q.id] === key && styles.selectedOption]} onPress={() => setAnswers(prev => ({...prev, [q.id]: key}))}>
                                <Text style={[styles.optionValue, isDarkMode && styles.textDark]}>{key}. {value as string}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}
                <TouchableOpacity style={styles.submitButton} onPress={handleConfirmSubmit} disabled={isSubmitting}>
                    <Text style={styles.submitButtonText}>{isSubmitting ? "Submitting..." : "Submit Model Exam"}</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f0f2f5' },
    container: { flex: 1 },
    containerDark: { backgroundColor: '#121212' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingTop: 40, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    questionCard: { backgroundColor: '#fff', borderRadius: 12, margin: 16, padding: 16, elevation: 2 },
    cardDark: { backgroundColor: '#1f2937' },
    questionText: { fontSize: 16, fontWeight: '500', marginBottom: 16, lineHeight: 24 },
    optionRow: { padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 8 },
    selectedOption: { borderColor: '#4A3780', backgroundColor: 'rgba(74, 55, 128, 0.1)' },
    optionValue: { fontSize: 16 },
    submitButton: { backgroundColor: '#28a745', padding: 16, borderRadius: 8, alignItems: 'center', margin: 16 },
    submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    resultsTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
    scoreText: { fontSize: 28, fontWeight: 'bold', color: '#4A3780', marginBottom: 8 },
    textDark: { color: '#fff' },
    textSecondary: { color: '#6b7280' },
    textSecondaryDark: { color: '#9ca3af' },
    headerDark: { borderBottomColor: '#374151' },
    timerContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e3f2fd', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
    timerText: { marginLeft: 6, fontSize: 16, fontWeight: 'bold', color: '#1976d2' },
});