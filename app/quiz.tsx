'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import useSWR from 'swr';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, SafeAreaView, BackHandler, Animated
} from 'react-native';
import { useAppContext } from '@/context/AppContext';
import apiClient from '@/lib/apiClient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

interface ResultData {
  results: { score: number; total: number; correct: number; wrong: number; unanswered: number; };
  questions: any[];
  timeTaken: number;
  userAnswers: UserAnswers;
}
interface UserAnswers { [questionId: string]: string; }
interface QuizConfig {
  timePerQuestion: number;
  showExplanations: boolean;
  shuffleQuestions: boolean;
  difficulty: string;
}
interface SavedProgress {
  examId: string;
  answers: UserAnswers;
  timeLeft: number;
  timestamp: number;
}

const Timer = ({ timeLeft, isWarning }: { timeLeft: number, isWarning: boolean }) => {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (isWarning) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isWarning, pulseAnim]);
  return (
    <Animated.View style={[
      styles.timerContainer, 
      isWarning && styles.timerWarning,
      { transform: [{ scale: pulseAnim }] }
    ]}>
      <Ionicons name="timer-outline" size={20} color={isWarning ? "#dc3545" : "#1976d2"} />
      <Text style={[styles.timerText, isWarning && styles.timerTextWarning]}>
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </Text>
    </Animated.View>
  );
};

export default function QuizPage() {
  const { fetcher, theme } = useAppContext();
  const router = useRouter();
  const params = useLocalSearchParams();
  const isDarkMode = theme === 'dark';

  const quizLimit = useMemo(() => {
    const limit = parseInt(String(params.limit || '15'), 10);
    return isNaN(limit) || limit <= 0 ? 15 : limit;
  }, [params.limit]);
  const quizConfig = useMemo<QuizConfig>(() => ({
    timePerQuestion: parseInt(String(params.timePerQuestion || '45'), 10),
    showExplanations: String(params.showExplanations) === 'true',
    shuffleQuestions: String(params.shuffleQuestions) === 'true',
    difficulty: String(params.difficulty || 'mixed'),
  }), [params]);
  const quizDuration = useMemo(() => quizLimit * quizConfig.timePerQuestion, [quizLimit, quizConfig.timePerQuestion]);

  // All state declarations INSIDE the component
  const [answers, setAnswers] = useState<UserAnswers>({});
  const [isFinished, setIsFinished] = useState(false);
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(quizDuration);
  const [hasWarned, setHasWarned] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const mainScrollRef = useRef<ScrollView>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const saveProgressRef = useRef<NodeJS.Timeout | null>(null);

  // --- RESET STATE ON PARAM CHANGE (the fix for old state sticking bug) ---
  useEffect(() => {
    setIsFinished(false);
    setResultData(null);
    setAnswers({});
    setTimeLeft(quizDuration);
    setHasWarned(false);
  }, [params.exam_id, params.topic_id, params.daily, quizDuration]);
  // ------------------------------------------------------

  const apiUrl = useMemo(() => {
    const { exam_id, topic_id, daily } = params;
    if (daily) return '/questions/daily/';
    if (!exam_id && !topic_id) return null;
    const queryParams = new URLSearchParams();
    if (exam_id) queryParams.append('exam_id', String(exam_id));
    if (topic_id) queryParams.append('topic_id', String(topic_id));
    queryParams.append('limit', String(quizLimit));
    if (quizConfig.difficulty !== 'mixed') queryParams.append('difficulty', quizConfig.difficulty);
    return `/questions/?${queryParams.toString()}`;
  }, [params, quizLimit, quizConfig.difficulty]);
  const { data: questionsData, error, isLoading } = useSWR(apiUrl, fetcher, { revalidateOnFocus: false, revalidateOnReconnect: false });
  const questions = useMemo(() => {
    if (!questionsData) return [];
    let questionsList = Array.isArray(questionsData) ? questionsData : [questionsData];
    if (quizConfig.shuffleQuestions) questionsList = [...questionsList].sort(() => Math.random() - 0.5);
    return questionsList;
  }, [questionsData, quizConfig.shuffleQuestions]);

  const saveProgress = useCallback(async () => {
    if (isFinished || Object.keys(answers).length === 0) return;
    setIsAutoSaving(true);
    try {
      const progressKey = `quiz_progress_${params.exam_id || params.topic_id || 'default'}`;
      const progressData: SavedProgress = {
        examId: String(params.exam_id || params.topic_id || 'default'),
        answers,
        timeLeft,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(progressKey, JSON.stringify(progressData));
    } catch (error) { }
    finally { setIsAutoSaving(false); }
  }, [answers, timeLeft, isFinished, params.exam_id, params.topic_id]);
  useEffect(() => {
    if (saveProgressRef.current) clearTimeout(saveProgressRef.current);
    saveProgressRef.current = setTimeout(() => { saveProgress(); }, 2000);
    return () => { if (saveProgressRef.current) clearTimeout(saveProgressRef.current); };
  }, [saveProgress]);
  useEffect(() => {
    const loadProgress = async () => {
      if (String(params.resume) === 'true') {
        try {
          const progressKey = `quiz_progress_${params.exam_id || params.topic_id || 'default'}`;
          const savedData = await AsyncStorage.getItem(progressKey);
          if (savedData) {
            const progress: SavedProgress = JSON.parse(savedData);
            setAnswers(progress.answers);
            setTimeLeft(progress.timeLeft);
          }
        } catch (error) { }
      }
    };
    loadProgress();
  }, [params.resume, params.exam_id, params.topic_id]);

  const submitQuizLogic = useCallback(async () => {
    if (isSubmitting || isFinished) return;
    setIsSubmitting(true);
    const timeTaken = quizDuration - timeLeft;
    try {
      const allQuestionIds = questions.map((q: any) => q.id);
      const response = await apiClient.post('/submit-exam/', { 
        answers,
        question_ids: allQuestionIds,
        time_taken: timeTaken
      });
      setResultData({ 
        ...response.data, 
        timeTaken, 
        userAnswers: answers,
        questions: questions
      });
      setIsFinished(true);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      const progressKey = `quiz_progress_${params.exam_id || params.topic_id || 'default'}`;
      await AsyncStorage.removeItem(progressKey);
      mainScrollRef.current?.scrollTo({ y: 0, animated: true });
    } catch (err: any) {
      Alert.alert("Submission Error", err?.response?.data?.message || "There was an error submitting your quiz. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, timeLeft, questions, quizDuration, isSubmitting, isFinished, params.exam_id, params.topic_id]);

  const handleConfirmSubmit = useCallback(() => {
    const unansweredCount = questions.length - Object.keys(answers).length;
    const message = unansweredCount > 0 
      ? `You have ${unansweredCount} unanswered questions. Are you sure you want to submit?`
      : "Are you sure you want to submit your quiz?";
    Alert.alert(
      "Submit Quiz",
      message,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Submit", style: "destructive", onPress: submitQuizLogic }
      ]
    );
  }, [answers, questions, submitQuizLogic]);
  const handleBackPress = useCallback(() => {
    if (isFinished) { router.back(); return true; }
    Alert.alert(
      "Exit Quiz",
      "Are you sure you want to exit? Your progress will be saved automatically.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Exit", style: "destructive", onPress: () => router.back() }
      ]
    );
    return true;
  }, [isFinished, router]);
  useEffect(() => {
    if (isLoading || isFinished || isSubmitting) return;
    if (timeLeft <= 0) {
      Alert.alert("Time's Up!", "Your quiz will be submitted automatically.");
      submitQuizLogic();
      return;
    }
    if (timeLeft === 120 && !hasWarned) {
      setHasWarned(true);
      Alert.alert("Time Warning", "You have 2 minutes remaining!");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  }, [isLoading, isFinished, isSubmitting, timeLeft, submitQuizLogic, hasWarned]);
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [handleBackPress]);
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (saveProgressRef.current) clearTimeout(saveProgressRef.current);
    };
  }, []);
  const handleAnswerSelect = useCallback((questionId: string, optionKey: string) => {
    if (isFinished || isSubmitting) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAnswers(prev => ({
      ...prev,
      [questionId]: prev[questionId] === optionKey ? '' : optionKey
    }));
  }, [isFinished, isSubmitting]);

  if (isLoading) {
    return (
      <View style={[styles.centered, isDarkMode && styles.containerDark]}>
        <ActivityIndicator size="large" color={isDarkMode ? '#A78BFA' : '#4A3780'} />
        <Text style={[styles.loadingText, isDarkMode && styles.textDark]}>Loading quiz...</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={[styles.centered, isDarkMode && styles.containerDark]}>
        <Ionicons name="alert-circle-outline" size={64} color="#dc3545" />
        <Text style={[styles.errorText, isDarkMode && styles.textDark]}>
          Could not load quiz questions.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (questions.length === 0) {
    return (
      <View style={[styles.centered, isDarkMode && styles.containerDark]}>
        <Ionicons name="document-outline" size={64} color="#6c757d" />
        <Text style={[styles.noQuestionsText, isDarkMode && styles.textDark]}>
          No questions available for this selection.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- RENDER THE RESULTS SCREEN: Only answers and explanations shown after submission ---
  if (isFinished && resultData) {
    const { questions: resultQuestions, userAnswers } = resultData;
    return (
      <ScrollView ref={mainScrollRef} style={[styles.container, isDarkMode && styles.containerDark]}>
        <View style={styles.reviewSection}>
          <Text style={[styles.reviewTitle, isDarkMode && styles.textDark]}>Answers & Explanations</Text>
          {resultQuestions.map((q: any, index: number) => {
            const userAnswer = userAnswers[q.id];
            return (
              <View key={q.id} style={[styles.reviewCard, isDarkMode && styles.cardDark]}>
                <Text style={[styles.questionText, isDarkMode && styles.textDark]}>
                  {index + 1}. {q.text}
                </Text>
                {Object.entries(q.options).map(([key, value]) => {
                  const isUserAnswer = key === userAnswer;
                  const isCorrectAnswer = key === q.correct_answer;
                  let optionStyle = styles.reviewOption;
                  let icon = <View style={styles.iconPlaceholder} />;
                  if (isCorrectAnswer) {
                    optionStyle = [styles.reviewOption, styles.correctOption];
                    icon = <Ionicons name="checkmark-circle" size={24} color="#28a745" />;
                  } else if (isUserAnswer && !isCorrectAnswer) {
                    optionStyle = [styles.reviewOption, styles.wrongOption];
                    icon = <Ionicons name="close-circle" size={24} color="#dc3545" />;
                  }
                  return (
                    <View key={key} style={optionStyle}>
                      {icon}
                      <Text style={[styles.optionText, {flex: 1}, isDarkMode && styles.textDark]}>
                        {key}. {value as string}
                      </Text>
                    </View>
                  );
                })}
                {!userAnswer && (
                  <Text style={[styles.unansweredText, isDarkMode && styles.textSecondaryDark]}>
                    You did not answer this question.
                  </Text>
                )}
                {q.explanation && (
                  <Text style={[styles.explanationText, isDarkMode && styles.textSecondaryDark]}>
                    <Text style={styles.explanationLabel}>Explanation: </Text>
                    {q.explanation}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>Back to Practice</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }
  // --- RENDER THE QUIZ AS SINGLE PAGE LIST (no answers/explanations until submission) ---
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;
  return (
    <SafeAreaView style={[styles.safeArea, isDarkMode && styles.containerDark]}>
      <Stack.Screen options={{headerShown: false}} />
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="close-outline" size={28} color={isDarkMode ? '#fff' : '#000'} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.progressText, isDarkMode && styles.textDark]}>
            {answeredCount}/{questions.length} answered
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>
        <View style={styles.headerRight}>
          <Timer timeLeft={timeLeft} isWarning={timeLeft <= 120} />
          {isAutoSaving && (
            <ActivityIndicator size="small" color={isDarkMode ? '#fff' : '#000'} style={styles.savingIndicator} />
          )}
        </View>
      </View>
      <ScrollView ref={mainScrollRef} style={styles.scrollView} contentContainerStyle={styles.scrollContainer}>
        <View style={styles.quizHeader}>
          <Text style={[styles.quizTitle, isDarkMode && styles.textDark]}>
            Quiz Questions
          </Text>
          <Text style={[styles.quizSubtitle, isDarkMode && styles.textSecondaryDark]}>
            Answer all questions below and submit when ready
          </Text>
        </View>
        {questions.map((question: any, index: number) => {
          const isAnswered = answers[question.id] !== undefined;
          return (
            <View key={question.id} style={[styles.questionCard, isDarkMode && styles.cardDark]}>
              <View style={styles.questionHeader}>
                <Text style={[styles.questionNumber, isDarkMode && styles.textSecondaryDark]}>
                  Question {index + 1}
                </Text>
                <View style={styles.questionStatus}>
                  {isAnswered ? (
                    <Ionicons name="checkmark-circle" size={20} color="#28a745" />
                  ) : (
                    <Ionicons name="ellipse-outline" size={20} color="#6c757d" />
                  )}
                </View>
              </View>
              <Text style={[styles.questionText, isDarkMode && styles.textDark]}>
                {question.text}
              </Text>
              {Object.entries(question.options).map(([key, value]) => {
                const isSelected = answers[question.id] === key;
                return (
                  <TouchableOpacity 
                    key={key} 
                    style={[
                      styles.optionContainer, 
                      isDarkMode && styles.optionContainerDark,
                      isSelected && styles.selectedOption
                    ]}
                    onPress={() => handleAnswerSelect(question.id, key)}
                    disabled={isSubmitting}
                  >
                    <View style={[
                      styles.optionBullet,
                      isSelected && styles.selectedBullet
                    ]}>
                      {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                    <Text style={[
                      styles.optionText, 
                      isDarkMode && styles.textDark,
                      isSelected && styles.selectedOptionText
                    ]}>
                      {key}. {value as string}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
        <View style={styles.submitSection}>
          <Text style={[styles.submitInfo, isDarkMode && styles.textSecondaryDark]}>
            Make sure you've answered all questions before submitting.
          </Text>
          <TouchableOpacity 
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
            onPress={handleConfirmSubmit} 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Submit Quiz</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f9fa', },
  container: { flex: 1, backgroundColor: '#f8f9fa', },
  containerDark: { backgroundColor: '#121212', },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, },
  scrollView: { flex: 1, },
  scrollContainer: { paddingBottom: 30, },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#e9ecef', backgroundColor: '#fff', },
  headerDark: { backgroundColor: '#1e1e1e', borderBottomColor: '#333', },
  backButton: { padding: 4, },
  headerCenter: { flex: 1, alignItems: 'center', marginHorizontal: 16, },
  headerRight: { flexDirection: 'row', alignItems: 'center', },
  progressText: { fontSize: 16, fontWeight: '600', color: '#212529', marginBottom: 4, },
  progressBar: { width: '100%', height: 4, backgroundColor: '#e9ecef', borderRadius: 2, overflow: 'hidden', },
  progressFill: { height: '100%', backgroundColor: '#4A3780', },
  savingIndicator: { marginLeft: 8, },
  timerContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e9ecef', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 16, },
  timerWarning: { backgroundColor: 'rgba(220, 53, 69, 0.1)', },
  timerText: { marginLeft: 4, fontSize: 14, fontWeight: '600', color: '#1976d2', },
  timerTextWarning: { color: '#dc3545', },
  quizHeader: { padding: 20, alignItems: 'center', },
  quizTitle: { fontSize: 24, fontWeight: '600', color: '#212529', marginBottom: 4, },
  quizSubtitle: { fontSize: 16, color: '#6c757d', textAlign: 'center', },
  questionCard: { backgroundColor: '#fff', borderRadius: 8, padding: 16, marginHorizontal: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2, },
  cardDark: { backgroundColor: '#2a2a2a', shadowColor: '#000', },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, },
  questionNumber: { fontSize: 14, color: '#6c757d', fontWeight: '500', },
  questionStatus: { width: 20, height: 20, },
  questionText: { fontSize: 18, fontWeight: '500', marginBottom: 16, color: '#212529', lineHeight: 24, },
  optionContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, marginVertical: 4, borderRadius: 8, backgroundColor: '#f8f9fa', },
  optionContainerDark: { backgroundColor: '#333', },
  selectedOption: { backgroundColor: 'rgba(74, 55, 128, 0.1)', },
  optionBullet: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#adb5bd', marginRight: 12, justifyContent: 'center', alignItems: 'center', },
  selectedBullet: { backgroundColor: '#4A3780', borderColor: '#4A3780', },
  optionText: { flex: 1, fontSize: 16, color: '#212529', },
  selectedOptionText: { color: '#4A3780', fontWeight: '500', },
  submitSection: { padding: 20, alignItems: 'center', },
  submitInfo: { fontSize: 14, color: '#6c757d', textAlign: 'center', marginBottom: 16, },
  submitButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4A3780', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, minWidth: 140, justifyContent: 'center', },
  submitButtonDisabled: { backgroundColor: '#6c757d', opacity: 0.7, },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8, },
  reviewSection: { padding: 16, },
  reviewTitle: { fontSize: 20, fontWeight: '600', color: '#212529', marginBottom: 16, textAlign: 'center', },
  reviewCard: { backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2, },
  reviewOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, marginVertical: 2, borderRadius: 6, backgroundColor: '#f8f9fa', },
  correctOption: { backgroundColor: 'rgba(40, 167, 69, 0.1)', },
  wrongOption: { backgroundColor: 'rgba(220, 53, 69, 0.1)', },
  iconPlaceholder: { width: 24, height: 24, marginRight: 12, },
  unansweredText: { fontSize: 14, color: '#6c757d', fontStyle: 'italic', marginTop: 8, },
  explanationText: { fontSize: 14, color: '#6c757d', marginTop: 12, lineHeight: 20, },
  explanationLabel: { fontWeight: '600', color: '#495057', },
  loadingText: { marginTop: 16, fontSize: 16, color: '#6c757d', },
  errorText: { fontSize: 18, color: '#dc3545', textAlign: 'center', marginTop: 16, marginBottom: 24, },
  noQuestionsText: { fontSize: 18, color: '#6c757d', textAlign: 'center', marginTop: 16, marginBottom: 24, },
  retryButton: { backgroundColor: '#4A3780', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', },
  textDark: { color: '#e0e0e0', },
  textSecondaryDark: { color: '#b0b0b0', },
  primaryButton: { backgroundColor: '#4A3780', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 8, minWidth: 160, alignItems: 'center', alignSelf: 'center', marginVertical: 24 },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', },
});