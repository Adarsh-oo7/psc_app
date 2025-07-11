'use client';

import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, ScrollView, SafeAreaView, Alert, Button
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '@/context/AppContext';
import useSWR from 'swr';
import apiClient from '@/lib/apiClient';

// --- Reusable Components ---

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-GB', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  });
}

const QuizComponent = ({ exam, onFinish, isDarkMode }: any) => {
    const [answers, setAnswers] = useState<{ [key: string]: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // CORRECTED: Moved the async logic into its own function
    const performSubmit = async () => {
        setIsSubmitting(true);
        try {
            const response = await apiClient.post(`/daily-exams/${exam.id}/submit/`, { answers });
            onFinish(response.data);
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.detail || "Failed to submit exam.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = () => {
        Alert.alert("Submit Exam", "Are you sure you want to submit your answers?", [
            { text: "Cancel", style: "cancel" },
            { text: "Submit", style: "destructive", onPress: performSubmit }
        ]);
    };

    return (
        <ScrollView contentContainerStyle={{ paddingBottom: 120, paddingTop: 10 }}>
            {exam.questions.map((q: any, idx: number) => (
                <View key={q.id} style={[styles.questionCard, isDarkMode && styles.cardDark]}>
                    <Text style={[styles.questionText, isDarkMode && styles.textDark]}>{idx + 1}. {q.question_text}</Text>
                    {Object.entries({ A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d }).map(([key, value]) => (
                        value ? (
                            <TouchableOpacity key={key} style={[styles.optionRow, answers[q.id] === key && styles.selectedOption]} onPress={() => setAnswers(prev => ({...prev, [q.id]: key}))}>
                                <Text style={[styles.optionValue, isDarkMode && styles.textDark]}>{key}. {value as string}</Text>
                            </TouchableOpacity>
                        ) : null
                    ))}
                </View>
            ))}
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isSubmitting}>
                <Text style={styles.submitButtonText}>{isSubmitting ? "Submitting..." : "Submit Exam"}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

// --- Main Screen ---
export default function DailyExamScreen() {
  const { fetcher, theme } = useAppContext();
  const isDarkMode = theme === 'dark';
  const router = useRouter();

  const [selectedExam, setSelectedExam] = useState<any | null>(null);
  const [results, setResults] = useState<any | null>(null);
  
  const { data: dailyExams, error, isLoading } = useSWR('/daily-exams/', fetcher);

  const handleFinishQuiz = (resultData: any) => {
      setResults(resultData);
  };
  
  const handleSelectExam = (exam: any) => {
      setResults(null); // Clear previous results
      setSelectedExam(exam);
  };

  if (isLoading) return <View style={[styles.centered, isDarkMode && styles.containerDark]}><ActivityIndicator /></View>;
  if (error) return <View style={[styles.centered, isDarkMode && styles.containerDark]}><Text style={isDarkMode && styles.textDark}>Failed to load exams.</Text></View>;

  // --- RENDER THE QUIZ OR RESULTS ---
  if (selectedExam) {
    return (
        <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={[styles.quizHeader, isDarkMode && styles.headerDark]}>
                <TouchableOpacity onPress={() => setSelectedExam(null)} style={{ padding: 8 }}>
                    <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#fff' : '#000'} />
                </TouchableOpacity>
                <Text style={[styles.examTitle, isDarkMode && styles.textDark]}>{formatDate(selectedExam.date)}</Text>
                <TouchableOpacity onPress={() => router.push(`/leaderboard/${selectedExam.id}`)} style={{ padding: 8 }}>
                    <Ionicons name="trophy-outline" size={24} color={isDarkMode ? '#fff' : '#000'} />
                </TouchableOpacity>
            </View>
            {results ? (
                <View style={[styles.centered, {padding: 20}]}>
                    <Text style={[styles.resultsTitle, isDarkMode && styles.textDark]}>Quiz Complete!</Text>
                    <Text style={[styles.scoreText, isDarkMode && styles.textDark]}>Your Score: {results.score.toFixed(1)}%</Text>
                    <Text style={isDarkMode && styles.textSecondaryDark}>({results.correct_count} / {results.total_questions} Correct)</Text>
                    <View style={{marginTop: 20}}>
                        <Button title="View Leaderboard" onPress={() => router.push(`/leaderboard/${selectedExam.id}`)} />
                    </View>
                </View>
            ) : (
                <QuizComponent exam={selectedExam} onFinish={handleFinishQuiz} isDarkMode={isDarkMode} />
            )}
        </SafeAreaView>
    );
  }

  // --- RENDER THE LIST OF DAILY EXAMS ---
  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      <FlatList
        data={dailyExams || []}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.examRow, isDarkMode && styles.examRowDark]} onPress={() => handleSelectExam(item)}>
            <Ionicons name="calendar-outline" size={22} color={isDarkMode ? "#cabfff" : "#4A3780"} style={{ marginRight: 18 }} />
            <View style={styles.examContent}>
              <Text style={[styles.examRowText, isDarkMode && styles.textDark]}>{formatDate(item.date)}</Text>
              <Text style={styles.examRowCountText}>({item.questions.length} Questions)</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? "#cabfff" : "#4A3780"} />
          </TouchableOpacity>
        )}
        ListHeaderComponent={<Text style={[styles.screenTitle, isDarkMode && styles.textDark]}>Recent Daily Exams</Text>}
        contentContainerStyle={{ padding: 18, paddingTop: 10, paddingBottom: 100 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    containerDark: { backgroundColor: '#121212' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    screenTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
    examRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, marginBottom: 12, padding: 16, elevation: 2 },
    examRowDark: { backgroundColor: '#1f2937' },
    examContent: { flex: 1 },
    examRowText: { fontSize: 16, fontWeight: '600' },
    examRowCountText: { marginTop: 4, color: '#6b7280', fontSize: 14 },
    quizHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingTop: 40, paddingBottom: 10, borderBottomWidth: 1 },
    examTitle: { fontSize: 18, fontWeight: 'bold' },
    questionCard: { backgroundColor: '#fff', borderRadius: 12, marginHorizontal: 16, marginBottom: 20, padding: 16, elevation: 2 },
    cardDark: { backgroundColor: '#1f2937' },
    questionText: { fontSize: 16, fontWeight: '600', marginBottom: 12, lineHeight: 24 },
    optionRow: { padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 8 },
    selectedOption: { borderColor: '#4A3780', backgroundColor: 'rgba(74, 55, 128, 0.1)' },
    optionValue: { fontSize: 15, flex: 1, lineHeight: 22 },
    submitButton: { backgroundColor: '#28a745', padding: 16, borderRadius: 8, alignItems: 'center', margin: 16 },
    submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    resultsTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
    scoreText: { fontSize: 28, fontWeight: 'bold', color: '#4A3780', marginBottom: 8 },
    textDark: { color: '#fff' },
    textSecondaryDark: { color: '#9ca3af' },
    headerDark: { borderBottomColor: '#374151' },
});
