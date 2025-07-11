
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  SafeAreaView 
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '@/context/AppContext';
import useSWR from 'swr';

interface Question {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
}

interface DailyExam {
  id: number;
  date: string;
  questions: Question[];
}

export default function QuizScreen() {
  const { dailyExamId } = useLocalSearchParams();
  const { fetcher, theme, apiCall } = useAppContext();
  const isDarkMode = theme === 'dark';
  const router = useRouter();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: string }>({});
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [startTime] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [showReview, setShowReview] = useState(false);

  const { data: dailyExam, error, isLoading } = useSWR<DailyExam>(`/daily-exams/${dailyExamId}/`, fetcher);

  // Timer effect
  useEffect(() => {
    if (showResults || showReview) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showResults, showReview]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (questionId: number, answer: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    
    try {
      const response = await apiCall(`/daily-exams/${dailyExamId}/submit/`, 'POST', {
        answers: selectedAnswers,
        time_taken: timeTaken
      });
      
      setResults(response);
      setShowResults(true);
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', 'Failed to submit exam. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < (dailyExam?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const getAnswerColor = (questionId: number, option: string) => {
    if (!showReview) return isDarkMode ? '#1f2937' : '#fff';
    
    const question = dailyExam?.questions.find(q => q.id === questionId);
    const userAnswer = selectedAnswers[questionId];
    const correctAnswer = question?.correct_answer;
    
    if (option === correctAnswer) {
      return '#10b981'; // Green for correct
    } else if (option === userAnswer && option !== correctAnswer) {
      return '#ef4444'; // Red for wrong selection
    }
    
    return isDarkMode ? '#1f2937' : '#fff';
  };

  const getAnswerTextColor = (questionId: number, option: string) => {
    if (!showReview) return isDarkMode ? '#fff' : '#333';
    
    const question = dailyExam?.questions.find(q => q.id === questionId);
    const userAnswer = selectedAnswers[questionId];
    const correctAnswer = question?.correct_answer;
    
    if (option === correctAnswer || (option === userAnswer && option !== correctAnswer)) {
      return '#fff';
    }
    
    return isDarkMode ? '#fff' : '#333';
  };

  if (isLoading) return <View style={[styles.centered, isDarkMode && styles.containerDark]}><ActivityIndicator /></View>;
  if (error) return <View style={[styles.centered, isDarkMode && styles.containerDark]}><Text style={isDarkMode && styles.textDark}>Failed to load exam.</Text></View>;
  if (!dailyExam) return <View style={[styles.centered, isDarkMode && styles.containerDark]}><Text style={isDarkMode && styles.textDark}>Exam not found.</Text></View>;

  // Results Screen
  if (showResults && results) {
    return (
      <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
        <Stack.Screen options={{ title: 'Quiz Results', headerBackVisible: false }} />
        <ScrollView contentContainerStyle={styles.resultsContainer}>
          <View style={[styles.resultsCard, isDarkMode && styles.cardDark]}>
            <Ionicons 
              name={results.score >= 50 ? "checkmark-circle" : "close-circle"} 
              size={80} 
              color={results.score >= 50 ? "#10b981" : "#ef4444"} 
              style={styles.resultIcon}
            />
            <Text style={[styles.resultTitle, isDarkMode && styles.textDark]}>
              {results.score >= 50 ? "Congratulations!" : "Better Luck Next Time!"}
            </Text>
            <Text style={[styles.scoreText, isDarkMode && styles.textDark]}>
              {results.score.toFixed(1)}%
            </Text>
            <Text style={[styles.resultDetails, isDarkMode && styles.textDark]}>
              {results.correct_count} out of {results.total_questions} correct
            </Text>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.reviewButton]}
                onPress={() => setShowReview(true)}
              >
                <Text style={styles.buttonText}>Review Answers</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.leaderboardButton]}
                onPress={() => router.push(`/leaderboard/${dailyExamId}`)}
              >
                <Text style={styles.buttonText}>View Leaderboard</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.homeButton]}
                onPress={() => router.push('/daily-exam')}
              >
                <Text style={styles.buttonText}>Back to Exams</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Review Screen or Quiz Screen
  const currentQuestion = dailyExam.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / dailyExam.questions.length) * 100;

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      <Stack.Screen options={{ 
        title: showReview ? 'Review Answers' : 'Daily Exam',
        headerBackVisible: showReview
      }} />
      
      {/* Timer and Progress */}
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={[styles.questionCounter, isDarkMode && styles.textDark]}>
            Question {currentQuestionIndex + 1} of {dailyExam.questions.length}
          </Text>
          {!showReview && (
            <Text style={[styles.timer, isDarkMode && styles.textDark]}>
              ⏱️ {formatTime(timeLeft)}
            </Text>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.questionCard, isDarkMode && styles.cardDark]}>
          <Text style={[styles.questionText, isDarkMode && styles.textDark]}>
            {currentQuestion.question_text}
          </Text>
          
          <View style={styles.optionsContainer}>
            {['A', 'B', 'C', 'D'].map((option) => {
              const optionValue = currentQuestion[`option_${option.toLowerCase()}` as keyof Question] as string;
              const isSelected = selectedAnswers[currentQuestion.id] === option;
              
              return (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionButton,
                    { backgroundColor: getAnswerColor(currentQuestion.id, option) },
                    isSelected && !showReview && styles.selectedOption,
                    isDarkMode && !showReview && styles.optionButtonDark
                  ]}
                  onPress={() => !showReview && handleAnswerSelect(currentQuestion.id, option)}
                  disabled={showReview}
                >
                  <Text style={[
                    styles.optionLetter,
                    { color: getAnswerTextColor(currentQuestion.id, option) }
                  ]}>
                    {option}
                  </Text>
                  <Text style={[
                    styles.optionText,
                    { color: getAnswerTextColor(currentQuestion.id, option) }
                  ]}>
                    {optionValue}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {showReview && (
            <View style={[styles.explanationCard, isDarkMode && styles.explanationCardDark]}>
              <Text style={[styles.explanationTitle, isDarkMode && styles.textDark]}>
                Explanation:
              </Text>
              <Text style={[styles.explanationText, isDarkMode && styles.textDark]}>
                {currentQuestion.explanation}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Navigation */}
      <View style={[styles.navigationContainer, isDarkMode && styles.navigationContainerDark]}>
        <TouchableOpacity
          style={[
            styles.navButton,
            currentQuestionIndex === 0 && styles.navButtonDisabled
          ]}
          onPress={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          <Ionicons name="chevron-back" size={24} color={currentQuestionIndex === 0 ? "#ccc" : "#4A3780"} />
          <Text style={[
            styles.navButtonText,
            currentQuestionIndex === 0 && styles.navButtonTextDisabled
          ]}>
            Previous
          </Text>
        </TouchableOpacity>

        {showReview ? (
          <TouchableOpacity
            style={[styles.navButton, styles.homeButton]}
            onPress={() => router.push('/daily-exam')}
          >
            <Text style={styles.buttonText}>Back to Exams</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit Exam'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.navButton,
            currentQuestionIndex === dailyExam.questions.length - 1 && styles.navButtonDisabled
          ]}
          onPress={handleNext}
          disabled={currentQuestionIndex === dailyExam.questions.length - 1}
        >
          <Text style={[
            styles.navButtonText,
            currentQuestionIndex === dailyExam.questions.length - 1 && styles.navButtonTextDisabled
          ]}>
            Next
          </Text>
          <Ionicons 
            name="chevron-forward" 
            size={24} 
            color={currentQuestionIndex === dailyExam.questions.length - 1 ? "#ccc" : "#4A3780"} 
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  containerDark: { backgroundColor: '#121212' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { 
    backgroundColor: '#fff', 
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#e5e7eb' 
  },
  headerDark: { backgroundColor: '#1f2937', borderBottomColor: '#374151' },
  
  progressContainer: { 
    height: 6, 
    backgroundColor: '#e5e7eb', 
    borderRadius: 3, 
    marginBottom: 12 
  },
  progressBar: { 
    height: '100%', 
    backgroundColor: '#4A3780', 
    borderRadius: 3 
  },
  
  headerInfo: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  questionCounter: { fontSize: 16, fontWeight: '600', color: '#333' },
  timer: { fontSize: 16, fontWeight: '600', color: '#ef4444' },
  
  content: { flex: 1 },
  
  questionCard: { 
    backgroundColor: '#fff', 
    margin: 16, 
    padding: 20, 
    borderRadius: 12, 
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  cardDark: { backgroundColor: '#1f2937' },
  
  questionText: { 
    fontSize: 18, 
    fontWeight: '600', 
    marginBottom: 20, 
    lineHeight: 24,
    color: '#333'
  },
  
  optionsContainer: { gap: 12 },
  optionButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff',
    padding: 16, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#e5e7eb' 
  },
  optionButtonDark: { backgroundColor: '#1f2937', borderColor: '#374151' },
  selectedOption: { 
    backgroundColor: '#4A3780', 
    borderColor: '#4A3780' 
  },
  
  optionLetter: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    minWidth: 24, 
    textAlign: 'center',
    color: '#333'
  },
  optionText: { 
    fontSize: 16, 
    marginLeft: 12, 
    flex: 1,
    color: '#333'
  },
  
  explanationCard: { 
    backgroundColor: '#f3f4f6', 
    padding: 16, 
    borderRadius: 8, 
    marginTop: 16 
  },
  explanationCardDark: { backgroundColor: '#374151' },
  explanationTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    marginBottom: 8,
    color: '#333'
  },
  explanationText: { 
    fontSize: 14, 
    lineHeight: 20,
    color: '#555'
  },
  
  navigationContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: 16, 
    backgroundColor: '#fff', 
    borderTopWidth: 1, 
    borderTopColor: '#e5e7eb' 
  },
  navigationContainerDark: { backgroundColor: '#1f2937', borderTopColor: '#374151' },
  
  navButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12 
  },
  navButtonDisabled: { opacity: 0.5 },
  navButtonText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#4A3780' 
  },
  navButtonTextDisabled: { color: '#ccc' },
  
  submitButton: { 
    backgroundColor: '#4A3780', 
    paddingHorizontal: 24, 
    paddingVertical: 12, 
    borderRadius: 8 
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  
  // Results Screen Styles
  resultsContainer: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    padding: 16 
  },
  resultsCard: { 
    backgroundColor: '#fff', 
    padding: 32, 
    borderRadius: 16, 
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8
  },
  resultIcon: { marginBottom: 16 },
  resultTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 8, 
    textAlign: 'center',
    color: '#333'
  },
  scoreText: { 
    fontSize: 48, 
    fontWeight: 'bold', 
    color: '#4A3780', 
    marginBottom: 8 
  },
  resultDetails: { 
    fontSize: 16, 
    color: '#666', 
    marginBottom: 32,
    textAlign: 'center'
  },
  
  buttonContainer: { 
    width: '100%', 
    gap: 12 
  },
  button: { 
    paddingVertical: 16, 
    paddingHorizontal: 24, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  reviewButton: { backgroundColor: '#10b981' },
  leaderboardButton: { backgroundColor: '#f59e0b' },
  homeButton: { backgroundColor: '#6b7280' },
  buttonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  
  textDark: { color: '#fff' },
});
