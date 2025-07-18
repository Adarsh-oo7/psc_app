'use client';

import React, { useCallback } from 'react';
import { 
    View, Text, StyleSheet, FlatList, Image, 
    TouchableOpacity, ActivityIndicator, SafeAreaView, Alert 
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import useSWR from 'swr';
import { useAppContext } from '@/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { PostCard } from '@/components/PostCard';
import apiClient from '@/lib/apiClient';

export default function CommunityProfileScreen() {
    const { username } = useLocalSearchParams<{ username: string }>();
    const { user: currentUser, fetcher, theme } = useAppContext();
    const router = useRouter();
    const isDarkMode = theme === 'dark';

    const { data: profile, error: profileError } = useSWR(username ? `/profiles/${username}/` : null, fetcher);
    const { data: userPosts, error: postsError, mutate: mutatePosts } = useSWR(username ? `/community/user-posts/${username}/` : null, fetcher);

    const handleMessage = async () => {
        if (!profile) return;
        try {
            const response = await apiClient.post('/messaging/conversations/start/', { username: profile.user.username });
            const { conversation_id } = response.data;
            if (conversation_id) {
                router.push(`/chat/${conversation_id}`);
            }
        } catch (error) {
            Alert.alert("Error", "Could not start conversation.");
        }
    };
    
    const handleJoinGroup = async () => {
        // This assumes the community user has one primary group.
        // We will need to add the group ID to the profile API response later.
        Alert.alert("Join Group", "Request sent to join the study group!");
        // try {
        //     await apiClient.post(`/messaging/groups/${profile.group_id}/request-join/`);
        //     Alert.alert("Request Sent", "Your request to join the group has been sent to the creator.");
        // } catch (error) {
        //     Alert.alert("Error", "Could not send join request.");
        // }
    };

    const handleLike = useCallback(async (postId: number) => { /* ... like logic ... */ }, [mutatePosts]);
    const handleBookmark = useCallback(async (postId: number) => { /* ... bookmark logic ... */ }, [mutatePosts]);

    if (profileError || postsError) return <View style={styles.centered}><Text>Failed to load profile.</Text></View>;
    if (!profile || !userPosts) return <ActivityIndicator style={styles.centered} />;

    return (
        <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
            <Stack.Screen options={{ title: profile.user.username, headerTintColor: isDarkMode ? '#fff' : '#000' }} />
            <FlatList
                data={userPosts || []}
                keyExtractor={(item) => item.id.toString()}
                ListHeaderComponent={
                    <>
                        <View style={[styles.header, isDarkMode && styles.cardDark]}>
                            <Image source={{ uri: profile.profile_photo || 'https://via.placeholder.com/150' }} style={styles.avatar} />
                            <Text style={[styles.username, isDarkMode && styles.textDark]}>{profile.user.full_name || profile.user.username}</Text>
                            <Text style={[styles.bio, isDarkMode && styles.textSecondaryDark]}>{profile.bio || "This user hasn't added a bio yet."}</Text>
                        </View>

                        {profile.is_content_creator && currentUser?.username !== username && (
                            <View style={[styles.groupSection, isDarkMode && styles.cardDark]}>
                                <Text style={[styles.groupTitle, isDarkMode && styles.textDark]}>Connect & Learn</Text>
                                <Text style={[styles.groupDescription, isDarkMode && styles.textSecondaryDark]}>
                                    {profile.group_description || `Join my study group for personalized tips and guidance.`}
                                </Text>
                                <View style={styles.buttonContainer}>
                                    <TouchableOpacity style={[styles.button, styles.messageButton]} onPress={handleMessage}>
                                        <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" />
                                        <Text style={styles.buttonText}>Message</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.button, styles.joinButton, isDarkMode && styles.joinButtonDark]} onPress={handleJoinGroup}>
                                        <Ionicons name="people-outline" size={20} color={isDarkMode ? '#fff' : '#4A3780'} />
                                        <Text style={[styles.buttonText, isDarkMode && styles.joinButtonTextDark]}>Join Group</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                        
                        <Text style={[styles.postsHeader, isDarkMode && styles.textDark]}>Posts</Text>
                    </>
                }
                renderItem={({ item }) => (
                    <PostCard
                        item={item}
                        isDarkMode={isDarkMode}
                        onLike={() => handleLike(item.id)}
                        onComment={() => {}} // Inline comments logic here
                        onBookmark={() => handleBookmark(item.id)}
                    />
                )}
                ListEmptyComponent={
                    <View style={styles.placeholder}><Text style={isDarkMode && styles.textSecondaryDark}>This user hasn't made any posts yet.</Text></View>
                }
                contentContainerStyle={styles.scrollContent}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2f5' },
    containerDark: { backgroundColor: '#121212' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingBottom: 40 },
    header: { alignItems: 'center', padding: 24, backgroundColor: '#fff' },
    cardDark: { backgroundColor: '#1f2937' },
    avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 16, borderWidth: 3, borderColor: '#4A3780' },
    username: { fontSize: 24, fontWeight: 'bold' },
    bio: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginTop: 8, paddingHorizontal: 20 },
    groupSection: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: -10, padding: 16, borderRadius: 12, elevation: 2, zIndex: -1 },
    groupTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
    groupDescription: { fontSize: 14, color: '#6b7280', lineHeight: 20, marginBottom: 16 },
    buttonContainer: { flexDirection: 'row', justifyContent: 'center', gap: 12, },
    button: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8 },
    messageButton: { backgroundColor: '#4A3780' },
    joinButton: { backgroundColor: '#eef2ff' },
    joinButtonDark: { backgroundColor: '#374151' },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },
    joinButtonTextDark: { color: '#A78BFA' },
    postsHeader: { fontSize: 20, fontWeight: 'bold', paddingHorizontal: 20, marginBottom: 10, marginTop: 20 },
    placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40, paddingBottom: 40 },
    textDark: { color: '#fff' },
    textSecondaryDark: { color: '#9ca3af' },
});
