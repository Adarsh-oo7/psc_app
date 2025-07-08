
// hooks/useQuizTimer.ts
import { useState, useRef, useEffect, useCallback } from 'react';
import { QUIZ_CONSTANTS } from '../constants/quizConstants';

export const useQuizTimer = (initialTime: number, onTimeUp: () => void) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isPaused, setIsPaused] = useState(false);
  const [hasWarned, setHasWarned] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    if (isPaused || timeLeft <= 0) return;
    
    clearTimer();
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearTimer();
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [isPaused, timeLeft, onTimeUp, clearTimer]);

  const pauseTimer = useCallback(() => {
    setIsPaused(true);
    clearTimer();
  }, [clearTimer]);

  const resumeTimer = useCallback(() => {
    setIsPaused(false);
  }, []);

  const resetTimer = useCallback((newTime?: number) => {
    clearTimer();
    setTimeLeft(newTime || initialTime);
    setIsPaused(false);
    setHasWarned(false);
  }, [initialTime, clearTimer]);

  // Auto-start timer when not paused
  useEffect(() => {
    if (!isPaused && timeLeft > 0) {
      startTimer();
    }
    return clearTimer;
  }, [isPaused, timeLeft, startTimer, clearTimer]);

  // Warning system
  useEffect(() => {
    if (timeLeft === QUIZ_CONSTANTS.WARNING_TIME && !hasWarned) {
      setHasWarned(true);
    }
  }, [timeLeft, hasWarned]);

  // Cleanup on unmount
  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  return {
    timeLeft,
    isPaused,
    hasWarned,
    pauseTimer,
    resumeTimer,
    resetTimer,
    isLowTime: timeLeft <= QUIZ_CONSTANTS.CRITICAL_TIME,
    isWarningTime: timeLeft <= QUIZ_CONSTANTS.WARNING_TIME
  };
};

