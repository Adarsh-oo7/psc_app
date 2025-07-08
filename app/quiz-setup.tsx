'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, Text, StyleSheet, TouchableOpacity, SafeAreaView, 
    Alert, Switch, ScrollView, ActivityIndicator 
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Constants and Types ---
const QUIZ_CONSTANTS = { DEFAULT_QUESTIONS: 15, TIME_PER_QUESTION: 45 };
const DIFFICULTY_LEVELS = { EASY: 'easy', MEDIUM: 'medium', HARD: 'hard', MIXED: 'mixed' } as const;
interface QuizConfig {
  numQuestions: number;
  timePerQuestion: number;
  difficulty: string;
  showExplanations: boolean;
  shuffleQuestions: boolean;
}
interface SavedProgress {
  examId: string;
  answers: Record<string, string>;
  currentQuestionIndex: number;
  timeLeft: number;
  timestamp: number;
}

// --- Reusable UI Components ---
const OptionButton = ({ label, value, selected, onPress, isDarkMode }: any) => (
  <TouchableOpacity
    style={[styles.optionButton, isDarkMode && styles.optionButtonDark, selected && styles.optionButtonSelected]}
    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(value); }}
  >
    <Text style={[styles.optionText, selected && styles.optionTextSelected, isDarkMode && styles.textDark]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const ToggleOption = ({ label, description, value, onToggle, isDarkMode }: any) => (
  <View style={[styles.toggleContainer, isDarkMode && styles.toggleContainerDark]}>
    <View style={styles.toggleTextContainer}>
      <Text style={[styles.toggleLabel, isDarkMode && styles.textDark]}>{label}</Text>
      <Text style={[styles.toggleDescription, isDarkMode && styles.textSecondaryDark]}>{description}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={(newValue) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onToggle(newValue); }}
      trackColor={{ false: '#767577', true: '#4A3780' }}
      thumbColor={value ? '#A78BFA' : '#f4f3f4'}
    />
  </View>
);

const InfoCard = ({ title, value, icon, color, isDarkMode }: any) => (
  <View style={[styles.infoCard, isDarkMode && styles.infoCardDark]}>
    <View style={[styles.infoIconContainer, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <View style={styles.infoTextContainer}>
      <Text style={[styles.infoTitle, isDarkMode && styles.textSecondaryDark]}>{title}</Text>
      <Text style={[styles.infoValue, isDarkMode && styles.textDark]}>{value}</Text>
    </View>
  </View>
);

// --- Main Quiz Setup Screen Component ---
export default function QuizSetupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme, setExamId, setTopicId } = useAppContext();
  const isDarkMode = theme === 'dark';

  const [config, setConfig] = useState<QuizConfig>({
    numQuestions: QUIZ_CONSTANTS.DEFAULT_QUESTIONS,
    timePerQuestion: QUIZ_CONSTANTS.TIME_PER_QUESTION,
    difficulty: DIFFICULTY_LEVELS.MIXED,
    showExplanations: true,
    shuffleQuestions: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [savedProgress, setSavedProgress] = useState<SavedProgress | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(true);

  // Load saved preferences and check for unsaved progress
  useEffect(() => {
    const loadData = async () => {
      setLoadingProgress(true);
      try {
        const savedPrefs = await AsyncStorage.getItem('quiz_preferences');
        if (savedPrefs) setConfig(prev => ({ ...prev, ...JSON.parse(savedPrefs) }));
        const progressKey = `quiz_progress_${params.exam_id || params.topic_id || 'default'}`;
        const savedProgressData = await AsyncStorage.getItem(progressKey);
        if (savedProgressData) {
          const progressData: SavedProgress = JSON.parse(savedProgressData);
          if (Date.now() - progressData.timestamp < 7200000) setSavedProgress(progressData);
          else await AsyncStorage.removeItem(progressKey);
        }
      } catch { } finally { setLoadingProgress(false); }
    };
    loadData();
  }, [params.exam_id, params.topic_id]);

  // Save preferences whenever config changes
  useEffect(() => { AsyncStorage.setItem('quiz_preferences', JSON.stringify(config)).catch(() => {}); }, [config]);

  const handleConfigChange = useCallback((key: keyof QuizConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const calculateEstimatedTime = useCallback(() => {
    const totalSeconds = config.numQuestions * config.timePerQuestion;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }, [config.numQuestions, config.timePerQuestion]);

  const startQuiz = async (resumeProgress: boolean = false) => {
    setIsLoading(true);
    try {
      if (params.exam_id) setExamId(String(params.exam_id));
      if (params.topic_id) setTopicId(String(params.topic_id));
      if (!resumeProgress && savedProgress) {
        const progressKey = `quiz_progress_${params.exam_id || params.topic_id || 'default'}`;
        await AsyncStorage.removeItem(progressKey);
        setSavedProgress(null);
      }
      const queryParams = new URLSearchParams({
        limit: String(config.numQuestions),
        difficulty: config.difficulty,
        timePerQuestion: String(config.timePerQuestion),
        showExplanations: String(config.showExplanations),
        shuffleQuestions: String(config.shuffleQuestions),
      });
      if (params.exam_id) queryParams.append('exam_id', String(params.exam_id));
      if (params.topic_id) queryParams.append('topic_id', String(params.topic_id));
      if (params.daily) queryParams.append('daily', 'true');
      if (resumeProgress) queryParams.append('resume', 'true');
      router.push(`/quiz?${queryParams.toString()}`);
    } catch {
      Alert.alert("Error", "Could not start the quiz. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNewQuiz = useCallback(() => {
    if (savedProgress) {
      Alert.alert(
        'Start New Quiz?',
        `You have unsaved progress (${savedProgress.currentQuestionIndex + 1}/${config.numQuestions} questions). Starting a new quiz will erase this progress.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Start New', style: 'destructive', onPress: () => startQuiz(false) }
        ]
      );
    } else startQuiz(false);
  }, [savedProgress, config.numQuestions]);
  const handleResumeQuiz = useCallback(() => { startQuiz(true); }, []);

  const questionOptions = [10, 15, 25, 50, 100];
  const timeOptions = [
    { label: '30s', value: 30 }, 
    { label: '45s', value: 45 }, 
    { label: '1m', value: 60 },
    { label: '90s', value: 90 }
  ];
  const difficultyOptions = Object.values(DIFFICULTY_LEVELS).map(v => ({ label: v.charAt(0).toUpperCase() + v.slice(1), value: v }));

  if (loadingProgress) {
    return (
      <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDarkMode ? '#A78BFA' : '#4A3780'} />
          <Text style={[styles.loadingText, isDarkMode && styles.textDark]}>Loading quiz settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      <Stack.Screen options={{ 
        title: 'Quiz Setup', 
        headerTintColor: isDarkMode ? '#fff' : '#000',
        headerStyle: { backgroundColor: isDarkMode ? '#121212' : '#fff' }
      }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <Ionicons name="options-outline" size={60} color={isDarkMode ? '#A78BFA' : '#4A3780'} />
          <Text style={[styles.title, isDarkMode && styles.textDark]}>Customize Your Practice</Text>
          <Text style={[styles.subtitle, isDarkMode && styles.textSecondaryDark]}>
            Configure your quiz settings for the best practice experience
          </Text>
        </View>
        {savedProgress && (
          <View style={[styles.progressCard, isDarkMode && styles.progressCardDark]}>
            <View style={styles.progressHeader}>
              <Ionicons name="bookmark-outline" size={24} color="#f59e0b" />
              <Text style={[styles.progressTitle, isDarkMode && styles.textDark]}>Resume Previous Quiz</Text>
            </View>
            <Text style={[styles.progressDescription, isDarkMode && styles.textSecondaryDark]}>
              You have unsaved progress from {new Date(savedProgress.timestamp).toLocaleDateString()}
            </Text>
            <View style={styles.progressStats}>
              <Text style={[styles.progressStat, isDarkMode && styles.textDark]}>
                Progress: {savedProgress.currentQuestionIndex + 1}/{config.numQuestions}
              </Text>
              <Text style={[styles.progressStat, isDarkMode && styles.textDark]}>
                Time: {Math.floor(savedProgress.timeLeft / 60)}:{(savedProgress.timeLeft % 60).toString().padStart(2, '0')}
              </Text>
            </View>
            <TouchableOpacity style={styles.resumeButton} onPress={handleResumeQuiz} disabled={isLoading}>
              <Ionicons name="play-outline" size={20} color="#fff" />
              <Text style={styles.resumeButtonText}>Resume Quiz</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.summaryGrid}>
          <InfoCard title="Questions" value={config.numQuestions} icon="document-text-outline" color="#3b82f6" isDarkMode={isDarkMode} />
          <InfoCard title="Time per Q" value={`${config.timePerQuestion}s`} icon="timer-outline" color="#10b981" isDarkMode={isDarkMode} />
          <InfoCard title="Difficulty" value={config.difficulty.charAt(0).toUpperCase() + config.difficulty.slice(1)} icon="trending-up-outline" color="#f59e0b" isDarkMode={isDarkMode} />
          <InfoCard title="Est. Time" value={calculateEstimatedTime()} icon="time-outline" color="#8b5cf6" isDarkMode={isDarkMode} />
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.textDark]}>Number of Questions</Text>
          <View style={styles.optionsGrid}>
            {questionOptions.map(option => (
              <OptionButton key={option} label={String(option)} value={option} selected={config.numQuestions === option} onPress={v => handleConfigChange('numQuestions', v)} isDarkMode={isDarkMode} />
            ))}
          </View>
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.textDark]}>Time per Question</Text>
          <View style={styles.optionsGrid}>
            {timeOptions.map(option => (
              <OptionButton key={option.value} label={option.label} value={option.value} selected={config.timePerQuestion === option.value} onPress={v => handleConfigChange('timePerQuestion', v)} isDarkMode={isDarkMode} />
            ))}
          </View>
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.textDark]}>Difficulty Level</Text>
          <View style={styles.optionsGrid}>
            {difficultyOptions.map(option => (
              <OptionButton key={option.value} label={option.label} value={option.value} selected={config.difficulty === option.value} onPress={v => handleConfigChange('difficulty', v)} isDarkMode={isDarkMode} />
            ))}
          </View>
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.textDark]}>Advanced Options</Text>
          <View style={styles.togglesContainer}>
            <ToggleOption
              label="Show Explanations"
              description="Display explanations after each question"
              value={config.showExplanations}
              onToggle={value => handleConfigChange('showExplanations', value)}
              isDarkMode={isDarkMode}
            />
            <ToggleOption
              label="Shuffle Questions"
              description="Randomize question order"
              value={config.shuffleQuestions}
              onToggle={value => handleConfigChange('shuffleQuestions', value)}
              isDarkMode={isDarkMode}
            />
          </View>
        </View>
        <TouchableOpacity
          style={[styles.startButton, isLoading && styles.startButtonDisabled]}
          onPress={handleStartNewQuiz}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="rocket-outline" size={20} color="#fff" />
              <Text style={styles.startButtonText}>Start New Quiz</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  containerDark: { backgroundColor: '#121212' },
  content: { padding: 20, paddingBottom: 50 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#6b7280' },
  headerSection: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 28, fontWeight: 'bold', marginTop: 16, textAlign: 'center' },
  subtitle: { fontSize: 16, textAlign: 'center', marginTop: 8, color: '#6b7280' },
  progressCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 24, borderLeftWidth: 4, borderLeftColor: '#f59e0b' },
  progressCardDark: { backgroundColor: '#1f2937' },
  progressHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  progressTitle: { fontSize: 18, fontWeight: '700', marginLeft: 12 },
  progressDescription: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  progressStats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  progressStat: { fontSize: 14, fontWeight: '600' },
  resumeButton: { backgroundColor: '#f59e0b', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, gap: 8 },
  resumeButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 32, gap: 12 },
  infoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, width: '48%', flexDirection: 'row', alignItems: 'center' },
  infoCardDark: { backgroundColor: '#1f2937' },
  infoIconContainer: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  infoTextContainer: { flex: 1 },
  infoTitle: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  infoValue: { fontSize: 16, fontWeight: '700' },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginBottom: 16 },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  optionButton: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 10, borderWidth: 2, borderColor: '#e5e7eb', backgroundColor: '#fff', minWidth: 80, alignItems: 'center' },
  optionButtonDark: { borderColor: '#4b5563', backgroundColor: '#374151' },
  optionButtonSelected: { borderColor: '#4A3780', backgroundColor: '#4A3780' },
  optionText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  optionTextSelected: { color: '#fff' },
  togglesContainer: { gap: 16 },
  toggleContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 20, borderRadius: 12 },
  toggleContainerDark: { backgroundColor: '#1f2937' },
  toggleTextContainer: { flex: 1, marginRight: 16 },
  toggleLabel: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 4 },
  toggleDescription: { fontSize: 14, color: '#6b7280' },
  startButton: { backgroundColor: '#16a34a', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 12, gap: 8, marginTop: 16 },
  startButtonDisabled: { backgroundColor: '#9ca3af' },
  startButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  textDark: { color: '#fff' },
  textSecondaryDark: { color: '#9ca3af' },
});