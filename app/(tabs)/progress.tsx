import React, { useState } from 'react';
import useSWR from 'swr';
import { 
    View, Text, StyleSheet, ScrollView, ActivityIndicator, 
    Alert, Button, TouchableOpacity 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { Ionicons } from '@expo/vector-icons';

// --- Reusable Components for this Screen ---

const StatCard = ({ title, value, icon, isDarkMode }: { title: string, value: string | number, icon: any, isDarkMode: boolean }) => (
    <View style={[styles.statCard, isDarkMode && styles.cardDark]}>
        <Ionicons name={icon} size={24} color={isDarkMode ? '#A78BFA' : '#4A3780'} />
        <Text style={[styles.statValue, isDarkMode && styles.textDark]}>{value}</Text>
        <Text style={[styles.statLabel, isDarkMode && styles.textSecondaryDark]}>{title}</Text>
    </View>
);

const TopicFeedbackItem = ({ topic, isStrength, isDarkMode }: { topic: any, isStrength: boolean, isDarkMode: boolean }) => {
    const router = useRouter();
    const { setTopicId } = useAppContext();
    const handlePractice = () => {
        const topicId = topic.question__topic__id;
        if (topicId) {
            setTopicId(topicId.toString());
            router.push(`/practice-session?topic_id=${topicId}`);
        }
    };
    return (
        <View style={[styles.topicItem, isDarkMode && styles.topicItemDark]}>
            <View style={{ flex: 1 }}>
                <Text style={[styles.topicName, isDarkMode && styles.textDark]}>{topic.question__topic__name}</Text>
                <Text style={{ color: isStrength ? '#28a745' : '#dc3545', fontSize: 12 }}>
                    {isStrength ? `Accuracy: ${topic.accuracy.toFixed(0)}%` : `Marks Lost: ${topic.marks_lost.toFixed(2)}`}
                </Text>
            </View>
            {!isStrength && <Button title="Practice" onPress={handlePractice} />}
        </View>
    );
};

// --- Main Page Component ---
export default function ProgressScreen() {
    const { fetcher, theme } = useAppContext();
    const router = useRouter();
    const [mode, setMode] = useState('focus');
    const isDarkMode = theme === 'dark';

    const { data, error, isLoading } = useSWR(`/my-progress-dashboard/?mode=${mode}`, fetcher);

    if (isLoading) return <View style={[styles.centered, isDarkMode && styles.containerDark]}><ActivityIndicator size="large" /></View>;
    if (error) return <View style={[styles.centered, isDarkMode && styles.containerDark]}><Text style={isDarkMode && styles.textDark}>Could not load progress data.</Text></View>;
    
    if (!data || data.message) {
        return (
            <View style={[styles.centered, isDarkMode && styles.containerDark]}>
                <Text style={[styles.messageText, isDarkMode && styles.textSecondaryDark]}>{data?.message || "Set a focus exam to see your report."}</Text>
                <Button title="Set Focus Exam" onPress={() => router.push('/(tabs)/profile')} />
            </View>
        );
    }

    const { overall_stats, strongest_topics, weakest_topics, report_title } = data;

    return (
        <ScrollView style={[styles.container, isDarkMode && styles.containerDark]} contentContainerStyle={{ paddingBottom: 100 }}>
            {/* Header with Mode Toggle */}
            <View style={styles.header}>
                <View>
                    <Text style={[styles.headerTitle, isDarkMode && styles.textDark]}>Performance Report</Text>
                    <Text style={[styles.headerSubtitle, isDarkMode && styles.textSecondaryDark]}>{report_title}</Text>
                </View>
                <View style={[styles.toggleContainer, isDarkMode && styles.toggleContainerDark]}>
                    <TouchableOpacity onPress={() => setMode('focus')} style={[styles.toggleButton, mode === 'focus' && styles.toggleButtonActive]}>
                        <Text style={[styles.toggleText, mode === 'focus' && styles.toggleTextActive]}>Focus</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setMode('overall')} style={[styles.toggleButton, mode === 'overall' && styles.toggleButtonActive]}>
                        <Text style={[styles.toggleText, mode === 'overall' && styles.toggleTextActive]}>Overall</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Overall Stats Grid */}
            <View style={styles.grid}>
                <StatCard title="Net Marks" value={overall_stats.net_marks} icon="ribbon-outline" isDarkMode={isDarkMode} />
                <StatCard title="Accuracy" value={`${overall_stats.accuracy.toFixed(1)}%`} icon="aperture-outline" isDarkMode={isDarkMode} />
                <StatCard title="Correct" value={overall_stats.correct} icon="checkmark-circle-outline" isDarkMode={isDarkMode} />
                <StatCard title="Wrong" value={overall_stats.wrong} icon="close-circle-outline" isDarkMode={isDarkMode} />
            </View>

            {/* Personalized Study Plan */}
            <View style={[styles.studyPlan, isDarkMode && styles.cardDark]}>
                <Text style={[styles.sectionTitle, isDarkMode && styles.textDark]}>Personalized Study Plan</Text>
                <View style={styles.feedbackSection}>
                    <Text style={styles.feedbackTitle}><Ionicons name="trending-down-outline" size={18} color="#dc3545" /> Focus On These Topics</Text>
                    {weakest_topics.length > 0 ? weakest_topics.map((topic: any) => <TopicFeedbackItem key={topic.question__topic__id} topic={topic} isStrength={false} isDarkMode={isDarkMode} />) : <Text style={[styles.infoText, isDarkMode && styles.textSecondaryDark]}>No weak areas found. Great job!</Text>}
                </View>
                <View style={styles.feedbackSection}>
                    <Text style={styles.feedbackTitle}><Ionicons name="trending-up-outline" size={18} color="#28a745" /> Your Strengths</Text>
                    {strongest_topics.length > 0 ? strongest_topics.map((topic: any) => <TopicFeedbackItem key={topic.question__topic__id} topic={topic} isStrength={true} isDarkMode={isDarkMode} />) : <Text style={[styles.infoText, isDarkMode && styles.textSecondaryDark]}>Keep practicing to build your strengths!</Text>}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    container: { flex: 1, backgroundColor: '#f0f2f5' },
    containerDark: { backgroundColor: '#121212' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
    headerSubtitle: { fontSize: 16, color: '#6b7280' },
    toggleContainer: { flexDirection: 'row', backgroundColor: '#e5e7eb', borderRadius: 20 },
    toggleContainerDark: { backgroundColor: '#374151' },
    toggleButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
    toggleButtonActive: { backgroundColor: '#4A3780' },
    toggleText: { fontWeight: '600', color: '#4A3780' },
    toggleTextActive: { color: '#fff' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', padding: 16 },
    statCard: { width: '48%', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, alignItems: 'center', elevation: 2 },
    statValue: { fontSize: 22, fontWeight: 'bold', marginTop: 8 },
    statLabel: { fontSize: 14, color: '#6b7280', marginTop: 4 },
    studyPlan: { margin: 16, borderRadius: 12, padding: 16, backgroundColor: '#fff', elevation: 2 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
    feedbackSection: { marginBottom: 16 },
    feedbackTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
    topicItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    topicItemDark: { borderBottomColor: '#374151' },
    topicName: { fontSize: 16, flex: 1 },
    infoText: { fontStyle: 'italic', color: '#6b7280' },
    cardDark: { backgroundColor: '#1f2937' },
    textDark: { color: '#fff' },
    textSecondaryDark: { color: '#9ca3af' },
    messageText: { fontSize: 16, textAlign: 'center', padding: 20 },
});
