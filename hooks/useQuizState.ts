// hooks/useQuizState.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { UserAnswers, QuizState } from '../types/quiz';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useQuizState = (quizId: string) => {
  const [answers, setAnswers] = useState<UserAnswers>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save functionality
  const saveProgress = useCallback(async () => {
    try {
      const progressData = {
        answers,
        currentQuestionIndex,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(`quiz_progress_${quizId}`, JSON.stringify(progressData));
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }, [answers, currentQuestionIndex, quizId]);

  // Load saved progress
  const loadProgress = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(`quiz_progress_${quizId}`);
      if (saved) {
        const progressData = JSON.parse(saved);
        // Only load if saved within last hour
        if (Date.now() - progressData.timestamp < 3600000) {
          setAnswers(progressData.answers || {});
          setCurrentQuestionIndex(progressData.currentQuestionIndex || 0);
          return true;
        }
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
    return false;
  }, [quizId]);

  // Clear saved progress
  const clearProgress = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(`quiz_progress_${quizId}`);
    } catch (error) {
      console.error('Failed to clear progress:', error);
    }
  }, [quizId]);

  // Auto-save when answers change
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
      autoSaveRef.current = setTimeout(saveProgress, 2000); // Save after 2 seconds of inactivity
    }
    return () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
    };
  }, [answers, saveProgress]);

  const updateAnswer = useCallback((questionId: string, optionKey: string) => {
    if (isFinished || isSubmitting) return;
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: prev[questionId] === optionKey ? '' : optionKey
    }));
  }, [isFinished, isSubmitting]);

  const nextQuestion = useCallback(() => {
    setCurrentQuestionIndex(prev => prev + 1);
  }, []);

  const previousQuestion = useCallback(() => {
    setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
  }, []);

  const goToQuestion = useCallback((index: number) => {
    setCurrentQuestionIndex(index);
  }, []);

  return {
    answers,
    isSubmitting,
    isFinished,
    currentQuestionIndex,
    setIsSubmitting,
    setIsFinished,
    updateAnswer,
    nextQuestion,
    previousQuestion,
    goToQuestion,
    saveProgress,
    loadProgress,
    clearProgress
  };
};