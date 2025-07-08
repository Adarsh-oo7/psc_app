import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import useSWR from 'swr';
import { useAppContext } from '@/context/AppContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LeaderboardScreen() {
    const { fetcher, theme } = useAppContext();
    const isDarkMode = theme === 'dark';
    const { data: leaderboard, error, isLoading } = useSWR('/leaderboard/', fetcher);

    if (isLoading) return <View style={[styles.centered, isDarkMode && styles.containerDark]}><ActivityIndicator size="large" /></View>;
    if (error) return <View style={[styles.centered, isDarkMode && styles.containerDark]}><Text style={isDarkMode && styles.textDark}>Could not load leaderboard.</Text></View>;

    return (
        <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
            <Text style={[styles.headerTitle, isDarkMode && styles.textDark]}>Leaderboard</Text>
            <FlatList
                data={leaderboard}
                keyExtractor={(item) => item.user_id.toString()}
                renderItem={({ item, index }) => (
                    <View style={[styles.row, isDarkMode && styles.rowDark]}>
                        <Text style={[styles.rank, isDarkMode && styles.textDark]}>{index + 1}</Text>
                        <Text style={[styles.name, isDarkMode && styles.textDark]}>{item.username}</Text>
                        <Text style={[styles.score, isDarkMode && styles.textDark]}>{item.score}</Text>
                    </View>
                )}
                contentContainerStyle={{ paddingBottom: 100 }}
                ListEmptyComponent={() => <Text style={[styles.textDark, { textAlign: 'center', marginTop: 20 }]}>No data</Text>}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2f5' },
    containerDark: { backgroundColor: '#121212' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginVertical: 20, color: '#4A3780' },
    row: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 8, marginBottom: 8 },
    rowDark: { backgroundColor: '#1f2937' },
    rank: { fontWeight: 'bold', fontSize: 16, width: 40 },
    name: { fontSize: 16, flex: 1 },
    score: { fontWeight: 'bold', fontSize: 16, width: 60, textAlign: 'right' },
    textDark: { color: '#fff' }
});