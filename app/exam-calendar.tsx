import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Linking } from 'react-native';
import { TabView, TabBar } from 'react-native-tab-view';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '@/context/AppContext';
import useSWR from 'swr';

// Types
interface ExamAnnouncement {
    id: number;
    title: string;
    publication_date: string;
    pdf_file_url: string | null;
}

interface SyllabusItem {
    id: number;
    exam_name: string;
    pdf_file_url: string | null;
}

export default function ExamCalendarSyllabusScreen() {
    const layout = useWindowDimensions();
    const router = useRouter();
    const { theme, fetcher } = useAppContext();
    const isDarkMode = theme === 'dark';

    const [index, setIndex] = useState(0);
    const [routes] = useState([
        { key: 'calendar', title: 'Exam Calendar' },
        { key: 'syllabus', title: 'Syllabus' },
    ]);

    // Move all hooks to the top level - this fixes the Rules of Hooks violation
    const { data: announcements, error: calendarError, isLoading: calendarLoading } = useSWR<ExamAnnouncement[]>('/exam-calendar/', fetcher);
    const { data: syllabuses, error: syllabusError, isLoading: syllabusLoading } = useSWR<SyllabusItem[]>('/syllabuses/', fetcher);

    // Safe navigation function
    const navigateToRouter = useCallback((pathname: string, params: any) => {
        try {
            if (router && typeof router.push === 'function') {
                router.push({
                    pathname,
                    params
                });
            } else {
                throw new Error('Router not available');
            }
        } catch (error) {
            console.error('Navigation error:', error);
            Alert.alert(
                'Navigation Error', 
                'Could not navigate to PDF viewer. Please try again.',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel'
                    },
                    {
                        text: 'Open in Browser',
                        onPress: () => {
                            if (params.pdfUrl) {
                                Linking.openURL(params.pdfUrl);
                            }
                        }
                    }
                ]
            );
        }
    }, [router]);

    // Safe back navigation
    const navigateBack = useCallback(() => {
        try {
            if (router && typeof router.back === 'function') {
                router.back();
            } else if (router && typeof router.push === 'function') {
                router.push('/'); // Fallback to home
            } else {
                console.warn('Router not available for back navigation');
            }
        } catch (error) {
            console.error('Back navigation error:', error);
        }
    }, [router]);

    // Memoized event handlers
    const handleOpenPDF = useCallback((item: ExamAnnouncement) => {
        console.log('Opening PDF for item:', item.title);
        console.log('Router available:', !!router);
        
        if (item.pdf_file_url) {
            navigateToRouter('/pdf-viewer', {
                pdfUrl: item.pdf_file_url,
                title: item.title
            });
        } else {
            Alert.alert('PDF Not Available', 'The PDF file for this announcement has not been uploaded yet.');
        }
    }, [navigateToRouter]);

    const handleDownload = useCallback((item: SyllabusItem) => {
        if (item.pdf_file_url) {
            Linking.openURL(item.pdf_file_url);
        } else {
            Alert.alert('Syllabus Not Available', 'The syllabus PDF for this exam has not been uploaded yet.');
        }
    }, []);

    // Memoized tab content - now using the data from hooks called at top level
    const calendarTabContent = useMemo(() => {
        if (calendarLoading) return <ActivityIndicator style={{ marginTop: 20 }} />;
        if (calendarError) return <Text style={[styles.errorText, isDarkMode && styles.textDark]}>Failed to load calendar.</Text>;

        return (
            <ScrollView style={[styles.scene, isDarkMode && styles.sceneDark]}>
                {announcements?.map((item) => (
                    <TouchableOpacity 
                        key={item.id} 
                        style={[styles.card, isDarkMode && styles.cardDark]}
                        onPress={() => handleOpenPDF(item)}
                    >
                        <View style={styles.dateColumn}>
                            <Text style={styles.dateMonth}>
                                {new Date(item.publication_date).toLocaleDateString('en-GB', { month: 'short' })}
                            </Text>
                            <Text style={[styles.dateDay, isDarkMode && styles.dateDayDark]}>
                                {new Date(item.publication_date).getDate()}
                            </Text>
                        </View>
                        <View style={styles.detailsColumn}>
                            <Text style={[styles.examName, isDarkMode && styles.textDark]}>{item.title}</Text>
                            <Text style={[styles.detailText, isDarkMode && styles.textSecondaryDark]}>
                                Published: {new Date(item.publication_date).toLocaleDateString()}
                            </Text>
                            <Text style={[styles.detailText, isDarkMode && styles.textSecondaryDark]}>
                                Tap to open PDF
                            </Text>
                        </View>
                        <Ionicons name="eye-outline" size={24} color={isDarkMode ? '#9ca3af' : '#6b7280'} />
                    </TouchableOpacity>
                ))}
            </ScrollView>
        );
    }, [announcements, calendarLoading, calendarError, isDarkMode, handleOpenPDF]);

    const syllabusTabContent = useMemo(() => {
        if (syllabusLoading) return <ActivityIndicator style={{ marginTop: 20 }} />;
        if (syllabusError) return <Text style={[styles.errorText, isDarkMode && styles.textDark]}>Failed to load syllabuses.</Text>;

        return (
            <ScrollView style={[styles.scene, isDarkMode && styles.sceneDark]}>
                {syllabuses?.map((item) => (
                    <TouchableOpacity 
                        key={item.id} 
                        style={[styles.card, isDarkMode && styles.cardDark]} 
                        onPress={() => handleDownload(item)}
                    >
                        <Ionicons name="document-text-outline" size={32} color={isDarkMode ? '#A78BFA' : '#4A3780'} />
                        <View style={styles.detailsColumn}>
                            <Text style={[styles.examName, isDarkMode && styles.textDark]}>{item.exam_name}</Text>
                            <Text style={[styles.detailText, isDarkMode && styles.textSecondaryDark]}>Tap to view/download syllabus</Text>
                        </View>
                        <Ionicons name="download-outline" size={24} color={isDarkMode ? '#9ca3af' : '#6b7280'} />
                    </TouchableOpacity>
                ))}
            </ScrollView>
        );
    }, [syllabuses, syllabusLoading, syllabusError, isDarkMode, handleDownload]);

    // Render scene function - now just returns pre-computed content
    const renderScene = useCallback(({ route }: { route: { key: string } }) => {
        switch (route.key) {
            case 'calendar':
                return calendarTabContent;
            case 'syllabus':
                return syllabusTabContent;
            default:
                return null;
        }
    }, [calendarTabContent, syllabusTabContent]);

    return (
        <SafeAreaView style={[styles.safeArea, isDarkMode && styles.containerDark]}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={[styles.header, isDarkMode && styles.headerDark]}>
                <TouchableOpacity onPress={navigateBack} style={{ padding: 8 }}>
                    <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#fff' : '#1f2937'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, isDarkMode && styles.textDark]}>Calendar & Syllabus</Text>
                <View style={{ width: 40 }} />
            </View>

            <TabView
                navigationState={{ index, routes }}
                renderScene={renderScene}
                onIndexChange={setIndex}
                initialLayout={{ width: layout.width }}
                renderTabBar={props => (
                    <TabBar
                        {...props}
                        indicatorStyle={{ backgroundColor: '#4A3780' }}
                        style={{ backgroundColor: isDarkMode ? '#1f2937' : '#fff' }}
                        labelStyle={{ color: isDarkMode ? '#fff' : '#1f2937', fontWeight: '600' }}
                    />
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    containerDark: { backgroundColor: '#121212' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    headerDark: { backgroundColor: '#1f2937', borderBottomColor: '#374151' },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    scene: { flex: 1, padding: 16 },
    sceneDark: { backgroundColor: '#121212' },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 3 },
    cardDark: { backgroundColor: '#1f2937' },
    dateColumn: { alignItems: 'center', marginRight: 16, paddingRight: 16, borderRightWidth: 1, borderRightColor: '#e5e7eb' },
    dateMonth: { fontSize: 14, color: '#6b7280', textTransform: 'uppercase' },
    dateDay: { fontSize: 28, fontWeight: 'bold', color: '#4A3780' },
    dateDayDark: { color: '#A78BFA' },
    detailsColumn: { flex: 1, marginLeft: 16 },
    examName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    detailText: { fontSize: 14, color: '#6b7280' },
    errorText: { textAlign: 'center', marginTop: 20, color: 'red' },
    textDark: { color: '#fff' },
    textSecondaryDark: { color: '#9ca3af' },
});