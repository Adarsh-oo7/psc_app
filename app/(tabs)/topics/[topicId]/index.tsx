import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import useSWR from 'swr';
import { useAppContext } from '@/context/AppContext';

const TAB_STUDY = 'study';
const TAB_QUIZ = 'quiz';

// Shuffle utility
function shuffle<T>(array: T[]): T[] {
  let arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function OptionItem({ label, value, selected, showCorrect, isCorrectOption, onPress, disabled, isDark }: {
  label: string,
  value: string,
  selected: boolean,
  showCorrect: boolean,
  isCorrectOption: boolean,
  onPress: () => void,
  disabled: boolean,
  isDark: boolean,
}) {
  let bg = isDark ? '#23233a' : '#f3f3fa';
  let border = isDark ? '#444' : '#bbb';
  let txt = isDark ? '#e7e6ff' : '#181a1b';

  if (showCorrect) {
    if (isCorrectOption) {
      bg = '#388e3c';
      txt = '#fff';
      border = '#388e3c';
    } else if (selected && !isCorrectOption) {
      bg = '#e23c3c';
      txt = '#fff';
      border = '#e23c3c';
    }
  } else if (selected) {
    bg = '#4A3780';
    txt = '#fff';
  }

  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      style={{
        backgroundColor: bg,
        borderColor: border,
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        opacity: disabled ? 0.7 : 1
      }}
    >
      <Text style={{ color: txt, fontWeight: 'bold', marginRight: 8 }}>{label}.</Text>
      <Text style={{ color: txt, flexShrink: 1 }}>{value}</Text>
      {showCorrect && isCorrectOption && (
        <Text style={{ marginLeft: 8, color: '#A3E635', fontWeight: 'bold' }}>✓</Text>
      )}
      {showCorrect && selected && !isCorrectOption && (
        <Text style={{ marginLeft: 8, color: '#F87171', fontWeight: 'bold' }}>✗</Text>
      )}
    </TouchableOpacity>
  );
}

// Quiz Section: now always keeps both the label and value, and finds the correct answer by key or value.
function QuizSection({ questions, isDark }: { questions: any[], isDark: boolean }) {
  const [current, setCurrent] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  if (!questions.length) return <Text style={[styles.noData, isDark && styles.noDataDark]}>No questions available.</Text>;
  const q = questions[current];

  // Always get options as array of {key, value}
  let optionsArr: { key: string, value: string }[] = [];
  if (Array.isArray(q.options)) {
    optionsArr = q.options.map((v: string, i: number) => ({
      key: String.fromCharCode(65 + i), // A, B, C, D...
      value: v
    }));
  } else if (typeof q.options === 'object' && q.options !== null) {
    optionsArr = Object.entries(q.options).map(([k, v]) => ({ key: k, value: v as string }));
  }

  // Find the correct answer index (by key or by value, to support both cases)
  let correctIndex = optionsArr.findIndex(
    opt => opt.key === q.correct_answer || opt.value === q.correct_answer
  );
  // fallback: if correct_answer is just a key, use that
  if (correctIndex === -1 && typeof q.correct_answer === 'string') {
    correctIndex = optionsArr.findIndex(opt => opt.key === q.correct_answer.trim());
  }

  return (
    <View style={[styles.card, isDark && styles.cardDark]}>
      <Text style={[styles.question, isDark && styles.questionDark]}>{q.text}</Text>
      <View style={{ marginTop: 12 }}>
        {optionsArr.map((opt, i) => (
          <OptionItem
            key={i}
            label={opt.key}
            value={opt.value}
            selected={selectedIndex === i}
            showCorrect={showAnswer}
            isCorrectOption={i === correctIndex}
            onPress={() => setSelectedIndex(i)}
            disabled={showAnswer}
            isDark={isDark}
          />
        ))}
      </View>
      {showAnswer ? (
        <>
          <Text style={[styles.answer, isDark && styles.answerDark]}>
            <Text style={[styles.bold, isDark && styles.boldDark]}>Correct Answer:</Text> {optionsArr[correctIndex]?.key}. {optionsArr[correctIndex]?.value}
          </Text>
          <Text style={[styles.explanation, isDark && styles.explanationDark]}>
            <Text style={[styles.bold, isDark && styles.boldDark]}>Explanation:</Text> {q.explanation}
          </Text>
          <TouchableOpacity
            style={[styles.nextButton, { marginTop: 18 }]}
            onPress={() => {
              setShowAnswer(false);
              setSelectedIndex(null);
              setCurrent(current + 1 < questions.length ? current + 1 : 0);
            }}
          >
            <Text style={styles.nextButtonText}>
              {current + 1 < questions.length ? "Next" : "Restart"}
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity
          style={[
            styles.showAnswerBtn,
            { marginTop: 20, backgroundColor: selectedIndex !== null ? '#4A3780' : '#aaa' }
          ]}
          onPress={() => selectedIndex !== null && setShowAnswer(true)}
          disabled={selectedIndex === null}
        >
          <Text style={styles.showAnswerText}>Check Answer</Text>
        </TouchableOpacity>
      )}
      <Text style={[styles.quizCount, isDark && styles.quizCountDark]}>{current + 1} / {questions.length}</Text>
    </View>
  );
}

// Study Section: Only question/answer/explanation shown
function StudyCard({ item, isDark }: { item: any, isDark: boolean }) {
  // Find the correct answer text from options if possible
  let correctText = item.correct_answer;
  if (Array.isArray(item.options)) {
    // If the correct_answer is actually a value, just use it
    if (item.options.includes(item.correct_answer)) {
      correctText = item.correct_answer;
    }
  } else if (typeof item.options === 'object' && item.options !== null) {
    // If options is an object, find the value that matches the correct_answer
    // (either by value or by key)
    const found = Object.values(item.options).find((v: string) => v === item.correct_answer);
    if (found) {
      correctText = found;
    } else if (item.options[item.correct_answer]) {
      correctText = item.options[item.correct_answer];
    }
  }

  return (
    <View style={[styles.card, isDark && styles.cardDark]}>
      <Text style={[styles.question, isDark && styles.questionDark]}>{item.text}</Text>
      <Text style={[styles.answer, isDark && styles.answerDark]}>
        <Text style={[styles.bold, isDark && styles.boldDark]}>Answer:</Text> {correctText}
      </Text>
      <Text style={[styles.explanation, isDark && styles.explanationDark]}>
        <Text style={[styles.bold, isDark && styles.boldDark]}>Explanation:</Text> {item.explanation}
      </Text>
    </View>
  );
}

export default function TopicDetailScreen() {
  const { topicId } = useLocalSearchParams();
  const { fetcher, theme } = useAppContext();
  const isDark = theme === 'dark';
  const [tab, setTab] = useState(TAB_STUDY);

  const { data: questions, isLoading, error } = useSWR(
    topicId ? `/questions/?topic_id=${topicId}` : null,
    fetcher
  );

  const quizQuestions = questions ? shuffle([...questions]).slice(0, 15) : [];

  if (isLoading) return <Text style={[styles.noData, isDark && styles.noDataDark]}>Loading...</Text>;
  if (error) return <Text style={[styles.noData, isDark && styles.noDataDark]}>Could not load questions.</Text>;
  if (!questions || questions.length === 0) return <Text style={[styles.noData, isDark && styles.noDataDark]}>No questions found for this topic.</Text>;

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Tab Header */}
      <View style={[styles.tabBar, isDark && styles.tabBarDark]}>
        <TouchableOpacity
          style={[styles.tab, tab === TAB_STUDY && (isDark ? styles.activeTabDark : styles.activeTab)]}
          onPress={() => setTab(TAB_STUDY)}
        >
          <Text style={[styles.tabText, tab === TAB_STUDY && (isDark ? styles.activeTabTextDark : styles.activeTabText)]}>Study</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === TAB_QUIZ && (isDark ? styles.activeTabDark : styles.activeTab)]}
          onPress={() => setTab(TAB_QUIZ)}
        >
          <Text style={[styles.tabText, tab === TAB_QUIZ && (isDark ? styles.activeTabTextDark : styles.activeTabText)]}>Quiz</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {tab === TAB_STUDY ? (
        <FlatList
          data={questions}
          keyExtractor={q => String(q.id)}
          renderItem={({ item }) => <StudyCard item={item} isDark={isDark} />}
        />
      ) : (
        <QuizSection questions={quizQuestions} isDark={isDark} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  containerDark: { backgroundColor: '#181A20' },
  tabBar: { flexDirection: 'row', margin: 12, borderRadius: 10, overflow: 'hidden', borderColor: '#aaa', borderWidth: 1 },
  tabBarDark: { borderColor: '#333' },
  tab: { flex: 1, padding: 14, backgroundColor: '#e5e7eb', alignItems: 'center' },
  activeTab: { backgroundColor: '#4A3780' },
  tabText: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  activeTabText: { color: '#fff' },
  activeTabDark: { backgroundColor: '#2D2463' },
  activeTabTextDark: { color: '#FFD700' },
  card: { margin: 12, padding: 16, backgroundColor: '#fff', borderRadius: 10, elevation: 2 },
  cardDark: { backgroundColor: '#23233a', borderColor: '#34344a', borderWidth: 1 },
  question: { fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: '#222' },
  questionDark: { color: '#E4E6EF' },
  answer: { color: '#388e3c', marginTop: 8 },
  answerDark: { color: '#A3E635' },
  explanation: { color: '#666', marginTop: 4, fontStyle: 'italic' },
  explanationDark: { color: '#C8C8C8' },
  bold: { fontWeight: 'bold', color: '#222' },
  boldDark: { color: '#FFD700' },
  showAnswerBtn: { marginTop: 20, backgroundColor: '#4A3780', borderRadius: 8, padding: 10 },
  showAnswerText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  nextButton: { marginTop: 16, backgroundColor: '#388e3c', borderRadius: 8, padding: 10, alignItems: 'center' },
  nextButtonText: { color: '#fff', fontWeight: 'bold' },
  quizCount: { marginTop: 16, textAlign: 'center', color: '#666' },
  quizCountDark: { color: '#AAA' },
  noData: { margin: 20, color: '#444', textAlign: 'center', fontSize: 16 },
  noDataDark: { color: '#BBB' }
});