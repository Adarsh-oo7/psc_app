'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView, TouchableOpacity, SafeAreaView, Button } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import useSWR, { useSWRConfig } from 'swr';
import { useAppContext } from '@/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '@/lib/apiClient';

// ===============================================================
// --- Type Definitions ---
// ===============================================================
interface ResultData {
  results: { score: number; total: number; correct: number; wrong: number; unanswered: number; };
  questions: any[];
  timeTaken: number;
  userAnswers: UserAnswers;
}
interface UserAnswers { [questionId: string]: string; }

// ===============================================================
// --- Reusable Components for this Screen ---
// ===============================================================

const StudyMode = ({ questions, isDarkMode }: { questions: any[], isDarkMode: boolean }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
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
        <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
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
                            <View key={key} style={[styles.optionRow, isDarkMode && styles.optionRowDark, key === currentQuestion.correct_answer && styles.correctOptionRow]}>
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
    );
};

const QuizMode = ({ questions, onFinish, isDarkMode }: { questions: any[], onFinish: (answers: UserAnswers) => void, isDarkMode: boolean }) => {
    const [answers, setAnswers] = useState<UserAnswers>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSelect = (qId: string, ans: string) => {
        setAnswers(prev => ({...prev, [qId]: ans}));
    };
    
    const handleSubmit = () => {
        Alert.alert("Submit Quiz", "Are you sure you want to finish?", [
            { text: "Cancel", style: "cancel" },
            { text: "Submit", style: "destructive", onPress: () => {
                setIsSubmitting(true);
                onFinish(answers);
            }}
        ]);
    };

    return (
        <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
            <Text style={[styles.infoText, isDarkMode && styles.textSecondaryDark]}>Answer all questions and submit at the bottom.</Text>
            {questions.map((q: any, index: number) => (
                <View key={q.id} style={[styles.card, isDarkMode && styles.cardDark, {marginBottom: 16}]}>
                    <Text style={[styles.questionText, isDarkMode && styles.textDark]}>{index + 1}. {q.text}</Text>
                    {Object.entries(q.options).map(([key, value]) => (
                        <TouchableOpacity key={key} onPress={() => handleSelect(String(q.id), key)} style={[styles.optionRow, answers[q.id] === key && styles.selectedOption]}>
                            <Text style={[styles.optionValue, isDarkMode && styles.textDark]}>{key}. {value as string}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            ))}
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color="#fff"/> : <Text style={styles.buttonText}>Submit Quiz</Text>}
            </TouchableOpacity>
        </ScrollView>
    );
};

const ResultsScreen = ({ resultData, isDarkMode }: { resultData: ResultData, isDarkMode: boolean }) => {
    const router = useRouter();
    const { results, questions: resultQuestions, timeTaken, userAnswers } = resultData;
    const timeTakenMinutes = Math.floor(timeTaken / 60);
    const timeTakenSeconds = timeTaken % 60;

    return (
        <ScrollView contentContainerStyle={{paddingBottom: 50}}>
            <View style={[styles.card, isDarkMode && styles.cardDark, { alignItems: 'center' }]}>
                <Ionicons name="trophy-outline" size={60} color="#ffc107" />
                <Text style={[styles.resultsTitle, isDarkMode && styles.textDark]}>Quiz Completed!</Text>
                <Text style={styles.scoreText}>{results.score}</Text>
                <Text style={[styles.totalText, isDarkMode && styles.textSecondaryDark]}>Final Score</Text>
                
                <View style={styles.statsGrid}>
                    <View style={styles.statItem}><Text style={[styles.statValue, {color: '#28a745'}]}>{results.correct}</Text><Text style={isDarkMode && styles.textSecondaryDark}>Correct</Text></View>
                    <View style={styles.statItem}><Text style={[styles.statValueError, {color: '#dc3545'}]}>{results.wrong}</Text><Text style={isDarkMode && styles.textSecondaryDark}>Wrong</Text></View>
                    <View style={styles.statItem}><Text style={[styles.statValue, isDarkMode && styles.textSecondaryDark]}>{results.unanswered}</Text><Text style={isDarkMode && styles.textSecondaryDark}>Unanswered</Text></View>
                    <View style={styles.statItem}><Text style={[styles.statValue, {color: '#0dcaf0'}]}>{timeTakenMinutes}m {timeTakenSeconds}s</Text><Text style={isDarkMode && styles.textSecondaryDark}>Time</Text></View>
                </View>
                <Button title="Try Another Challenge" onPress={() => router.back()} />
            </View>
            
            <View style={{marginTop: 20}}>
                <Text style={[styles.reviewTitle, isDarkMode && styles.textDark]}>Review Your Answers</Text>
                {resultQuestions.map((q: any, index: number) => {
                    const userAnswer = userAnswers[q.id];
                    const isCorrect = userAnswer === q.correct_answer;
                    return (
                        <View key={q.id} style={[styles.card, isDarkMode && styles.cardDark, {marginBottom: 12}]}>
                            <Text style={[styles.questionText, isDarkMode && styles.textDark]}>{index + 1}. {q.text}</Text>
                            {Object.entries(q.options).map(([key, value]) => {
                                const isUserAnswer = key === userAnswer;
                                const isCorrectAnswer = key === q.correct_answer;
                                let icon = <View style={{width: 24}}/>;
                                if (isCorrectAnswer) icon = <Ionicons name="checkmark-circle" size={24} color="#28a745" />;
                                if (isUserAnswer && !isCorrect) icon = <Ionicons name="close-circle" size={24} color="#dc3545" />;
                                
                                return (
                                    <View key={key} style={[styles.reviewOption, isCorrectAnswer && styles.correctOption, isUserAnswer && !isCorrect && styles.wrongOption]}>
                                        {icon}
                                        <Text style={[styles.optionValue, {flex: 1}, isDarkMode && styles.textDark]}>{key}. {value as string}</Text>
                                    </View>
                                );
                            })}
                            {!userAnswer && <Text style={styles.unansweredText}>You did not answer this question.</Text>}
                            {q.explanation && <Text style={[styles.explanation, isDarkMode && styles.textSecondaryDark]}>Explanation: {q.explanation}</Text>}
                        </View>
                    );
                })}
            </View>
        </ScrollView>
    );
};


// ===============================================================
// --- Main Page Component ---
// ===============================================================
export default function PracticeSessionPage() {
    const params = useLocalSearchParams();
    const { fetcher, theme } = useAppContext();
    const router = useRouter();
    const isDarkMode = theme === 'dark';
    
    const [mode, setMode] = useState('study'); 
    const [resultData, setResultData] = useState<ResultData | null>(null);
    const [isFinished, setIsFinished] = useState(false);

    const apiUrl = useMemo(() => {
        const { exam_id, topic_id } = params;
        if (!exam_id && !topic_id) return null;
        const queryParams = new URLSearchParams();
        if (exam_id) queryParams.append('exam_id', String(exam_id));
        if (topic_id) queryParams.append('topic_id', String(topic_id));
        if (mode === 'quiz') queryParams.append('limit', '15');
        return `/questions/?${queryParams.toString()}`;
    }, [params, mode]);

    const { data: questions, error, isLoading, mutate } = useSWR(apiUrl, fetcher, { revalidateOnFocus: false });
    
    useEffect(() => {
        mutate();
        setIsFinished(false);
        setResultData(null);
    }, [mode]);

    const handleQuizFinish = (answers: UserAnswers, timeTaken: number) => {
        // This logic is now inside the main page to handle submission
        const submit = async () => {
            try {
                const allQuestionIds = questions?.map((q: any) => q.id) || [];
                const response = await apiClient.post('/submit-exam/', { answers, question_ids: allQuestionIds });
                setResultData({ ...response.data, timeTaken, userAnswers: answers });
                setIsFinished(true);
            } catch (err) {
                Alert.alert("Error", "Could not submit your quiz results.");
            }
        };
        submit();
    };

    const renderContent = () => {
        if (isLoading) return <ActivityIndicator size="large" />;
        if (error) return <Text style={isDarkMode && styles.textDark}>Could not load questions.</Text>;
        if (!questions || questions.length === 0) return <Text style={isDarkMode && styles.textDark}>No questions found.</Text>;
        
        if (isFinished && resultData) {
            return <ResultsScreen resultData={resultData} isDarkMode={isDarkMode} />;
        }
        
        if (mode === 'study') {
            return <StudyMode questions={questions} isDarkMode={isDarkMode} />;
        }
        
        if (mode === 'quiz') {
            return <QuizMode questions={questions} onFinish={handleQuizFinish} isDarkMode={isDarkMode} />;
        }
        
        return null;
    };

    return (
        <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
            <Stack.Screen options={{ headerShown: false }} />
            
            <View style={[styles.header, isDarkMode && styles.headerDark]}>
                <TouchableOpacity onPress={() => router.back()} style={{padding: 8}}><Ionicons name="arrow-back" size={24} color={isDarkMode ? '#fff' : '#000'} /></TouchableOpacity>
                <View style={[styles.toggleContainer, isDarkMode && styles.toggleContainerDark]}>
                    <TouchableOpacity style={[styles.toggleButton, mode === 'study' && styles.toggleButtonActive]} onPress={() => setMode('study')}>
                        <Ionicons name="library-outline" size={20} color={mode === 'study' ? '#fff' : (isDarkMode ? '#fff' : '#1976d2')} />
                        <Text style={[styles.toggleText, mode === 'study' && styles.toggleTextActive]}>Study</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.toggleButton, mode === 'quiz' && styles.toggleButtonActive]} onPress={() => setMode('quiz')}>
                        <Ionicons name="timer-outline" size={20} color={mode === 'quiz' ? '#fff' : (isDarkMode ? '#fff' : '#1976d2')} />
                        <Text style={[styles.toggleText, mode === 'quiz' && styles.toggleTextActive]}>Quiz</Text>
                    </TouchableOpacity>
                </View>
                <View style={{width: 40}} />
            </View>

            <View style={styles.content}>
                {renderContent()}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2f5' },
    containerDark: { backgroundColor: '#121212' },
    header: { paddingTop: 40, paddingBottom: 12, alignItems: 'center', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10 },
    headerDark: { backgroundColor: '#1f2937', borderBottomColor: '#374151' },
    toggleContainer: { flexDirection: 'row', backgroundColor: '#e3f2fd', borderRadius: 20, padding: 4 },
    toggleContainerDark: { backgroundColor: '#374151' },
    toggleButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 16 },
    toggleButtonActive: { backgroundColor: '#1976d2' },
    toggleText: { marginLeft: 8, fontWeight: 'bold', color: '#1976d2' },
    toggleTextActive: { color: '#fff' },
    content: { flex: 1, padding: 16 },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1 },
    cardDark: { backgroundColor: '#1f2937' },
    progressText: { fontSize: 14, color: '#6b7280', marginBottom: 16, textAlign: 'center' },
    questionText: { fontSize: 18, fontWeight: '500', color: '#1f2937', minHeight: 100, marginBottom: 24, lineHeight: 26 },
    showAnswerButton: { backgroundColor: '#1976d2', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8 },
    buttonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
    answerContainer: { marginTop: 20, borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 20 },
    optionRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ccc' },
    optionRowDark: { borderColor: '#555' },
    selectedOption: { borderColor: '#1976d2', backgroundColor: '#e3f2fd'},
    correctOptionRow: { backgroundColor: 'rgba(46, 164, 79, 0.1)', borderColor: 'rgba(46, 164, 79, 0.5)' },
    optionKey: { fontSize: 16, fontWeight: 'bold', color: '#6b7280', marginRight: 12 },
    optionValue: { fontSize: 16, color: '#1f2937', flex: 1, lineHeight: 22 },
    correctOptionKey: { color: '#2ea44f' },
    correctOptionValue: { color: '#2ea44f', fontWeight: 'bold' },
    explanation: { fontSize: 14, color: '#6b7280', marginTop: 16, fontStyle: 'italic', lineHeight: 20 },
    navigation: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
    submitButton: { backgroundColor: '#28a745', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 16 },
    infoText: { marginBottom: 16, textAlign: 'center', fontSize: 16 },
    textDark: { color: '#fff' },
    textSecondaryDark: { color: '#9ca3af' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    resultsCard: { backgroundColor: '#fff', padding: 20, borderRadius: 12, alignItems: 'center' },
    resultsTitle: { fontSize: 24, fontWeight: 'bold', marginVertical: 8 },
    scoreText: { fontSize: 32, fontWeight: 'bold', color: '#1976d2' },
    totalText: { fontSize: 16, color: 'gray', marginBottom: 20 },
    statsGrid: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 20 },
    statItem: { alignItems: 'center' },
    statValue: { fontSize: 20, fontWeight: 'bold' },
    statValueError: { fontSize: 20, fontWeight: 'bold' },
    statValueUnanswered: { fontSize: 20, fontWeight: 'bold' },
    statValueTime: { fontSize: 20, fontWeight: 'bold' },
    reviewTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, marginTop: 24 },
    reviewOption: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 6, marginVertical: 4, borderWidth: 1, borderColor: 'transparent' },
    correctOption: { borderColor: 'rgba(40, 167, 69, 0.5)' },
    wrongOption: { borderColor: 'rgba(220, 53, 69, 0.5)' },
    unansweredText: { fontStyle: 'italic', color: 'gray', marginTop: 8 },
});
