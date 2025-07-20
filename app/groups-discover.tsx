import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, SafeAreaView } from 'react-native';
import useSWR from 'swr';
import { useAppContext } from '@/context/AppContext';
import apiClient from '@/lib/apiClient';
import { Stack } from 'expo-router';

export default function GroupDiscoveryScreen() {
    const { fetcher, theme } = useAppContext();
    const isDarkMode = theme === 'dark';
    const { data: groups, isLoading } = useSWR('/messaging/groups/discover/', fetcher);

    const handleJoinRequest = async (groupId: number) => {
        try {
            await apiClient.post(`/messaging/groups/${groupId}/request-join/`);
            Alert.alert("Request Sent", "Your request to join the group has been sent to the creator.");
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.detail || "Could not send join request.");
        }
    };

    return (
        <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
            <Stack.Screen options={{ title: 'Discover Groups' }} />
            <FlatList
                data={groups}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={[styles.row, isDarkMode && styles.rowDark]}>
                        <View style={styles.rowText}>
                            <Text style={[styles.groupName, isDarkMode && styles.textDark]}>{item.name}</Text>
                            <Text style={[styles.memberCount, isDarkMode && styles.textSecondaryDark]}>{item.member_count} members</Text>
                        </View>
                        <TouchableOpacity style={styles.joinButton} onPress={() => handleJoinRequest(item.id)}>
                            <Text style={styles.joinButtonText}>Request to Join</Text>
                        </TouchableOpacity>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    containerDark: { backgroundColor: '#121212' },
    row: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
    rowDark: { borderBottomColor: '#374151' },
    rowText: { flex: 1 },
    groupName: { fontSize: 16, fontWeight: 'bold' },
    memberCount: { color: 'gray', marginTop: 4 },
    joinButton: { backgroundColor: '#4A3780', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
    joinButtonText: { color: '#fff', fontWeight: 'bold' },
    textDark: { color: '#fff' },
    textSecondaryDark: { color: '#9ca3af' },
});
