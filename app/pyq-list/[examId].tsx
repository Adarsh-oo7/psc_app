'use client';

import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import useSWR from 'swr';
import { useAppContext } from '@/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';

export default function PYQListScreen() {
    const { examId, examName } = useLocalSearchParams<{ examId: string, examName: string }>();
    const { fetcher, theme } = useAppContext();
    const isDarkMode = theme === 'dark';
    const [isDownloading, setIsDownloading] = useState<number | null>(null);

    const { data: papers, error, isLoading } = useSWR(examId ? `/exams/${examId}/pyq/` : null, fetcher);

    const handleOpenFile = async (paper: any) => {
        if (!paper.pdf_file_url) {
            Alert.alert("Error", "No file available for download.");
            return;
        }
        setIsDownloading(paper.id);
        try {
            // Define a unique local path for the file
            const fileUri = FileSystem.documentDirectory + paper.title.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf';
            const { uri } = await FileSystem.downloadAsync(paper.pdf_file_url, fileUri);
            
            // --- CORRECTED: Platform-specific logic to avoid crash ---
            if (Platform.OS === 'android') {
                // For Android, get the content URI using the FileSystem API
                const contentUri = await FileSystem.getContentUriAsync(uri);
                // Launch an intent to open the file with the secure content URI
                await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                    data: contentUri,
                    flags: 1, // Grant read URI permission
                    type: 'application/pdf',
                });
            } else if (Platform.OS === 'ios') {
                // For iOS, the Sharing API works correctly
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(uri, { dialogTitle: paper.title });
                } else {
                    Alert.alert("Download Complete", `File saved. You can find it in your device's Files app.`);
                }
            }

        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Could not open the file. You may need a PDF reader app installed.");
        } finally {
            setIsDownloading(null);
        }
    };

    if (isLoading) return <View style={[styles.centered, isDarkMode && styles.containerDark]}><ActivityIndicator size="large" /></View>;
    if (error) return <View style={[styles.centered, isDarkMode && styles.containerDark]}><Text style={isDarkMode && styles.textDark}>Failed to load papers.</Text></View>;

    return (
        <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
            <Stack.Screen options={{ title: examName || 'Previous Papers', headerTintColor: isDarkMode ? '#fff' : '#000' }} />
            <FlatList
                data={papers || []}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity style={[styles.examRow, isDarkMode && styles.examRowDark]} onPress={() => handleOpenFile(item)} disabled={isDownloading === item.id}>
                        <Ionicons name="document-text-outline" size={22} color={isDarkMode ? "#cabfff" : "#4A3780"} />
                        <View style={styles.examContent}>
                            <Text style={[styles.examRowText, isDarkMode && styles.textDark]}>{item.title}</Text>
                            <Text style={[styles.examRowCountText, isDarkMode && styles.textSecondaryDark]}>Year: {item.year}</Text>
                        </View>
                        {isDownloading === item.id 
                            ? <ActivityIndicator color={isDarkMode ? '#fff' : '#000'} /> 
                            : <Ionicons name="download-outline" size={22} color={isDarkMode ? "#555" : "#ccc"} />
                        }
                    </TouchableOpacity>
                )}
                ListHeaderComponent={<Text style={[styles.screenTitle, isDarkMode && styles.textDark]}>Available Papers</Text>}
                ListEmptyComponent={<View style={styles.centered}><Text style={[styles.noExamsText, isDarkMode && styles.textSecondaryDark]}>No PYQ papers have been added for {examName} yet.</Text></View>}
                contentContainerStyle={{ padding: 16 }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2f5' },
    containerDark: { backgroundColor: '#121212' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },
    screenTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, paddingHorizontal: 8 },
    examRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, padding: 16, elevation: 3 },
    examRowDark: { backgroundColor: '#1f2937', borderWidth: 1, borderColor: '#374151' },
    examContent: { flex: 1, marginLeft: 16 },
    examRowText: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
    examRowCountText: { marginTop: 4, color: '#6b7280', fontSize: 14 },
    noExamsText: { color: '#6b7280', fontSize: 16, textAlign: 'center', paddingHorizontal: 20 },
    textDark: { color: '#fff' },
    textSecondaryDark: { color: '#9ca3af' },
});
