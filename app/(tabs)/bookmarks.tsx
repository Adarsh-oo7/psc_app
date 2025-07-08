import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import useSWR from 'swr';
import { useAppContext } from '@/context/AppContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function BookmarksScreen() {
    const { fetcher, theme } = useAppContext();
    const isDarkMode = theme === 'dark';
    const { data: bookmarks, error, isLoading } = useSWR('/bookmarks/', fetcher);

    if (isLoading) return <View style={[styles.centered, isDarkMode && styles.containerDark]}><ActivityIndicator size="large" /></View>;
    if (error) return <View style={[styles.centered, isDarkMode && styles.containerDark]}><Text style={isDarkMode && styles.textDark}>Could not load bookmarks.</Text></View>;

    return (
        <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
            <Text style={[styles.headerTitle, isDarkMode && styles.textDark]}>Bookmarked Questions</Text>
            <FlatList
                data={bookmarks}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={[styles.bookmarkItem, isDarkMode && styles.bookmarkItemDark]}>
                        <Ionicons name="bookmark" size={22} color="#ffb300" style={{ marginRight: 8 }} />
                        <Text style={[styles.questionText, isDarkMode && styles.textDark]}>{item.question_text}</Text>
                    </View>
                )}
                contentContainerStyle={{ paddingBottom: 100 }}
                ListEmptyComponent={() => <Text style={[styles.textDark, { textAlign: 'center', marginTop: 20 }]}>No bookmarks yet.</Text>}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2f5' },
    containerDark: { backgroundColor: '#121212' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginVertical: 20, color: '#4A3780' },
    bookmarkItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 8, marginBottom: 8, padding: 12 },
    bookmarkItemDark: { backgroundColor: '#1f2937' },
    questionText: { fontSize: 16 },
    textDark: { color: '#fff' }
});