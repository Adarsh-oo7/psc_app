import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Video, ResizeMode } from 'expo-video';

// This is the reusable component for a single post
export const PostCard = ({ item, isDarkMode, onLike, onComment, onBookmark }: any) => {
    const router = useRouter();

    return (
        <View style={[styles.card, isDarkMode && styles.cardDark]}>
            {/* Post Header with Author Info */}
            <TouchableOpacity 
                style={styles.cardHeader} 
                onPress={() => router.push(`/community-profile/${item.author.username}`)}
            >
                <Image source={{ uri: item.author.profile_photo || 'https://via.placeholder.com/100' }} style={styles.avatar} />
                <View>
                    <Text style={[styles.authorName, isDarkMode && styles.textDark]}>{item.author.username}</Text>
                    <Text style={[styles.timestamp, isDarkMode && styles.textSecondaryDark]}>{new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
            </TouchableOpacity>

            {/* Post Title and Media */}
            <Text style={[styles.title, isDarkMode && styles.textDark]}>{item.title}</Text>
            {item.content_type === 'IMAGE' && item.file && <Image source={{ uri: item.file }} style={styles.postImage} />}
            {item.content_type === 'VIDEO' && item.file && <Video style={styles.postImage} source={{ uri: item.file }} useNativeControls resizeMode={ResizeMode.CONTAIN} />}

            {/* Action Buttons */}
            <View style={[styles.actionsContainer, isDarkMode && styles.actionsContainerDark]}>
                <TouchableOpacity style={styles.actionButton} onPress={onLike}>
                    <Ionicons name={item.is_liked_by_user ? "heart" : "heart-outline"} size={24} color={item.is_liked_by_user ? '#ef4444' : (isDarkMode ? '#9ca3af' : '#6b7280')} />
                    <Text style={[styles.actionText, isDarkMode && styles.textSecondaryDark]}>{item.likes_count}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={onComment}>
                    <Ionicons name="chatbubble-outline" size={24} color={isDarkMode ? '#9ca3af' : '#6b7280'} />
                    <Text style={[styles.actionText, isDarkMode && styles.textSecondaryDark]}>{item.comments_count}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={onBookmark}>
                    <Ionicons name={item.is_bookmarked_by_user ? "bookmark" : "bookmark-outline"} size={24} color={isDarkMode ? '#9ca3af' : '#6b7280'} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: { backgroundColor: '#fff', marginVertical: 8, borderRadius: 12, elevation: 2 },
    cardDark: { backgroundColor: '#1f2937', borderWidth: 1, borderColor: '#374151' },
    cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 12 },
    avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
    authorName: { fontWeight: 'bold', fontSize: 16 },
    timestamp: { fontSize: 12, color: '#6b7280' },
    title: { fontSize: 16, paddingHorizontal: 12, paddingBottom: 12, lineHeight: 22 },
    postImage: { width: '100%', height: Dimensions.get('window').width - 32, backgroundColor: '#000' },
    actionsContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f0f2f5' },
    actionsContainerDark: { borderTopColor: '#374151' },
    actionButton: { flexDirection: 'row', alignItems: 'center' },
    actionText: { marginLeft: 6, fontSize: 14, color: '#6b7280' },
    textDark: { color: '#fff' },
    textSecondaryDark: { color: '#9ca3af' },
});
