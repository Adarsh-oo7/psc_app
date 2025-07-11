import React from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import useSWR from 'swr';
import { useAppContext } from '@/context/AppContext';

export default function LeaderboardScreen() {
    const { dailyExamId } = useLocalSearchParams();
    const { fetcher, theme } = useAppContext();
    const isDarkMode = theme === 'dark';
    const { data: leaderboard, error } = useSWR(`/daily-exams/${dailyExamId}/leaderboard/`, fetcher);

    if (error) return <Text>Failed to load leaderboard.</Text>;
    if (!leaderboard) return <ActivityIndicator />;

    return (
        <View style={[styles.container, isDarkMode && styles.containerDark]}>
            <Stack.Screen options={{ title: 'Daily Leaderboard', headerTintColor: isDarkMode ? '#fff' : '#000' }} />
            <FlatList
                data={leaderboard}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item, index }) => (
                    <View style={[styles.row, isDarkMode && styles.rowDark]}>
                        <Text style={[styles.rank, isDarkMode && styles.textDark]}>{index + 1}</Text>
                        <Image source={{ uri: item.user.profile_photo || 'https://via.placeholder.com/100' }} style={styles.avatar} />
                        <Text style={[styles.username, isDarkMode && styles.textDark]}>{item.user.username}</Text>
                        <Text style={[styles.score, isDarkMode && styles.textDark]}>{item.score.toFixed(1)}%</Text>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    containerDark: { backgroundColor: '#121212' },
    row: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
    rowDark: { borderBottomColor: '#374151' },
    rank: { fontSize: 16, fontWeight: 'bold', width: 30 },
    avatar: { width: 40, height: 40, borderRadius: 20, marginHorizontal: 16 },
    username: { flex: 1, fontSize: 16, fontWeight: '500' },
    score: { fontSize: 16, fontWeight: 'bold' },
    textDark: { color: '#fff' },
});
