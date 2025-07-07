'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import useSWR from 'swr';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, SafeAreaView, Button
} from 'react-native';
import { useAppContext } from '@/context/AppContext';
import apiClient from '@/lib/apiClient';
import { Ionicons } from '@expo/vector-icons';

// --- Type Definitions ---
interface ResultData {
  results: { score: number; total: number; correct: number; wrong: number; unanswered: number; };
  questions: any[];
  timeTaken: number;
}
interface UserAnswers { [questionId: string]: string; }

// --- Timer Component ---
const Timer = ({ duration, onTimeUp }: { duration: number, onTimeUp: () => void }) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }
    const timerId = setInterval(() => setTimeLeft(prev => prev > 0 ? prev - 1 : 0), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <View style={styles.timerContainer}>
      <Ionicons name="timer-outline" size={20} color="#1976d2" />
      <Text style={styles.timerText}>
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </Text>
    </View>
  );
};

// --- Main Page Component ---
export default function QuizPage() {
  const { fetcher, setExamId, setTopicId } = useAppContext();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const quizDuration = 15 * 60;

  const [answers, setAnswers] = useState<UserAnswers>({});
  const [isFinished, setIsFinished] = useState(false);
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(quizDuration);
  
  const topOfPageRef = useRef<ScrollView>(null);

  const apiUrl = useMemo(() => {
    const examId = params.exam_id;
    const topicId = params.topic_id;
    if (examId) setExamId(String(examId));
    if (topicId) setTopicId(String(topicId));
    if (!examId && !topicId) return null;

    const queryParams = new URLSearchParams();
    if (examId) queryParams.append('exam_id', String(examId));
    if (topicId) queryParams.append('topic_id', String(topicId));
    queryParams.append('limit', '15');
    return `/questions/?${queryParams.toString()}`;
  }, [params, setExamId, setTopicId]);

  const { data: questions, error, isLoading } = useSWR(apiUrl, fetcher, { revalidateOnFocus: false });

  const submitQuizLogic = useCallback(async () => {
    setIsSubmitting(true);
    const timeTaken = quizDuration - timeLeft;
    try {
      const allQuestionIds = questions?.map((q: any) => q.id) || [];
      const response = await apiClient.post('/submit-exam/', { 
        answers,
        question_ids: allQuestionIds
      });
      setResultData({ ...response.data, timeTaken });
      setIsFinished(true);
      topOfPageRef.current?.scrollTo({ y: 0, animated: true });
    } catch (err) {
      Alert.alert("Error", "There was an error submitting your quiz.");
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, timeLeft, questions, quizDuration]);

  const handleConfirmSubmit = () => {
    // CORRECTED: Use Alert.alert for confirmation in React Native
    Alert.alert(
      "Submit Quiz",
      "Are you sure you want to finish and submit your answers?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Submit", style: "destructive", onPress: submitQuizLogic }
      ]
    );
  };

  useEffect(() => {
    if (isLoading || isFinished) return;
    if (timeLeft <= 0) {
      Alert.alert("Time's Up!", "Your quiz will be submitted automatically.");
      submitQuizLogic();
      return;
    }
    const timerId = setInterval(() => setTimeLeft(prev => prev > 0 ? prev - 1 : 0), 1000);
    return () => clearInterval(timerId);
  }, [isLoading, isFinished, timeLeft, submitQuizLogic]);

  if (isLoading) return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  if (error || !questions || questions.length === 0) return <View style={styles.centered}><Text>Could not load quiz questions.</Text></View>;

  // --- RENDER THE RESULTS SCREEN ---
  if (isFinished && resultData) {
    const { results, questions: resultQuestions } = resultData;
    const timeTakenMinutes = Math.floor(resultData.timeTaken / 60);
    const timeTakenSeconds = resultData.timeTaken % 60;
    return (
        <ScrollView ref={topOfPageRef} contentContainerStyle={styles.container}>
            <View style={styles.resultsCard}>
                <Ionicons name="trophy-outline" size={60} color="#ffc107" />
                <Text style={styles.resultsTitle}>Quiz Completed!</Text>
                <Text style={styles.scoreText}>Score: {results.score}</Text>
                <Text style={styles.totalText}>out of {results.total} questions</Text>
                
                <View style={styles.statsGrid}>
                    <View style={styles.statItem}><Text style={styles.statValueCorrect}>{results.correct}</Text><Text>Correct</Text></View>
                    <View style={styles.statItem}><Text style={styles.statValueError}>{results.wrong}</Text><Text>Wrong</Text></View>
                    <View style={styles.statItem}><Text style={styles.statValueUnanswered}>{results.unanswered}</Text><Text>Unanswered</Text></View>
                    <View style={styles.statItem}><Text style={styles.statValueTime}>{timeTakenMinutes}m {timeTakenSeconds}s</Text><Text>Time Taken</Text></View>
                </View>

                <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/(tabs)/practice')}>
                    <Text style={styles.primaryButtonText}>Try Another Challenge</Text>
                </TouchableOpacity>
            </View>
            <View style={{marginTop: 20}}>
                <Text style={styles.reviewTitle}>Review Your Answers</Text>
                {resultQuestions.map((q: any, index: number) => {
                    const userAnswer = answers[q.id];
                    const isCorrect = userAnswer === q.correct_answer;
                    return (
                        <View key={q.id} style={styles.reviewCard}>
                            <Text style={styles.questionText}>{index + 1}. {q.text}</Text>
                            {Object.entries(q.options).map(([key, value]) => {
                                const isUserAnswer = key === userAnswer;
                                const isCorrectAnswer = key === q.correct_answer;
                                return (
                                    <View key={key} style={[styles.reviewOption, isCorrectAnswer && styles.correctOption, isUserAnswer && !isCorrect && styles.wrongOption]}>
                                        <Text style={styles.optionText}>{key}. {value as string}</Text>
                                    </View>
                                );
                            })}
                            {!userAnswer && <Text style={styles.unansweredText}>You did not answer this question.</Text>}
                            {q.explanation && <Text style={styles.explanationText}>Explanation: {q.explanation}</Text>}
                        </View>
                    );
                })}
            </View>
        </ScrollView>
    );
  }

  // --- RENDER THE QUIZ IN PROGRESS ---
  return (
    <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{headerShown: false}} />
        <View style={styles.header}>
            <Text style={styles.headerTitle}>{questions.length}-Question Challenge</Text>
            <Timer duration={quizDuration} onTimeUp={submitQuizLogic} />
        </View>
        <ScrollView ref={topOfPageRef} contentContainerStyle={styles.container}>
            {questions.map((question: any, index: number) => (
                <View key={question.id} style={styles.questionCard}>
                    <Text style={styles.questionText}>{index + 1}. {question.text}</Text>
                    {Object.entries(question.options).map(([key, value]) => (
                        <TouchableOpacity 
                            key={key} 
                            style={[styles.optionContainer, answers[question.id] === key && styles.selectedOption]}
                            onPress={() => setAnswers(prev => ({...prev, [question.id]: key}))}
                        >
                            <Text style={styles.optionText}>{key}. {value as string}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            ))}
            <TouchableOpacity style={styles.submitButton} onPress={handleConfirmSubmit} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Finish & Submit</Text>}
            </TouchableOpacity>
        </ScrollView>
    </SafeAreaView>
  );
}

// --- Styles using React Native's StyleSheet ---
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f0f2f5' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    container: { padding: 16, paddingBottom: 50 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    timerContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e3f2fd', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
    timerText: { marginLeft: 6, fontSize: 16, fontWeight: 'bold', color: '#1976d2' },
    questionCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16, elevation: 2 },
    questionText: { fontSize: 16, fontWeight: '500', marginBottom: 16, lineHeight: 22 },
    optionContainer: { padding: 14, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 8 },
    selectedOption: { borderColor: '#1976d2', backgroundColor: '#e3f2fd' },
    optionText: { fontSize: 16 },
    submitButton: { backgroundColor: '#28a745', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 16 },
    submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    resultsCard: { backgroundColor: '#fff', padding: 20, borderRadius: 12, alignItems: 'center' },
    resultsTitle: { fontSize: 24, fontWeight: 'bold', marginVertical: 8 },
    scoreText: { fontSize: 32, fontWeight: 'bold', color: '#1976d2' },
    totalText: { fontSize: 16, color: 'gray', marginBottom: 20 },
    statsGrid: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 20 },
    statItem: { alignItems: 'center' },
    statValueCorrect: { fontSize: 20, fontWeight: 'bold', color: '#28a745' },
    statValueError: { fontSize: 20, fontWeight: 'bold', color: '#dc3545' },
    statValueUnanswered: { fontSize: 20, fontWeight: 'bold', color: '#6c757d' },
    statValueTime: { fontSize: 20, fontWeight: 'bold', color: '#0dcaf0' },
    primaryButton: { backgroundColor: '#1976d2', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 8 },
    primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    reviewTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, marginTop: 24 },
    reviewCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 },
    reviewOption: { padding: 10, borderRadius: 6, marginVertical: 4 },
    correctOption: { backgroundColor: 'rgba(40, 167, 69, 0.1)', borderWidth: 1, borderColor: 'rgba(40, 167, 69, 0.5)' },
    wrongOption: { backgroundColor: 'rgba(220, 53, 69, 0.1)', borderWidth: 1, borderColor: 'rgba(220, 53, 69, 0.5)' },
    unansweredText: { fontStyle: 'italic', color: 'gray', marginTop: 8 },
    explanationText: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee', color: '#6c757d' },
});
