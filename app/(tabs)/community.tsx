import React, { useState, useCallback, useRef } from 'react';
import { 
    View, Text, StyleSheet, FlatList, Image, 
    TouchableOpacity, ActivityIndicator, Dimensions, 
    TextInput, Button, Alert, Platform 
} from 'react-native';
import useSWR from 'swr';
import { useAppContext } from '@/context/AppContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '@/lib/apiClient';
import { Video } from 'expo-av';

const { width } = Dimensions.get('window');
const MEDIA_MAX_HEIGHT = width * 0.7;
const MEDIA_MAX_WIDTH = width - 32;

// --- Comment Section ---
const CommentSection = ({ postId, isDarkMode }) => {
    const { fetcher } = useAppContext();
    const commentsUrl = `/community/posts/${postId}/comments/`;
    const { data: comments, error, isLoading, mutate } = useSWR(commentsUrl, fetcher);
    const [newComment, setNewComment] = useState('');
    const [isPosting, setIsPosting] = useState(false);

    const handlePostComment = async () => {
        if (!newComment.trim()) return;
        setIsPosting(true);
        try {
            await apiClient.post(commentsUrl, { text: newComment });
            setNewComment('');
            mutate();
        } catch (err) {
            Alert.alert("Error", "Failed to post comment.");
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <View style={[styles.commentsContainer, isDarkMode && styles.commentsContainerDark]}>
            {isLoading && <ActivityIndicator />}
            {error && <Text style={styles.errorText}>Could not load comments.</Text>}
            {comments && comments.map((comment) => (
                <View key={comment.id} style={styles.comment}>
                    <Text style={[styles.authorName, isDarkMode && styles.textDark]}>{comment.author.username}</Text>
                    <Text style={[styles.commentText, isDarkMode && styles.textSecondaryDark]}>{comment.text}</Text>
                </View>
            ))}
            <View style={styles.commentInputContainer}>
                <TextInput
                    style={[styles.commentInput, isDarkMode && styles.commentInputDark]}
                    placeholder="Add a comment..."
                    placeholderTextColor={isDarkMode ? "#888" : "#aaa"}
                    value={newComment}
                    onChangeText={setNewComment}
                />
                <Button title={isPosting ? "..." : "Post"} onPress={handlePostComment} disabled={isPosting} />
            </View>
        </View>
    );
};

// --- Smart Media (Image/Video) with proper auto sizing ---
const SmartMedia = React.memo(({ type, uri, isVisible }) => {
    const [mediaDims, setMediaDims] = useState({ width: MEDIA_MAX_WIDTH, height: MEDIA_MAX_HEIGHT });
    const videoRef = useRef(null);

    React.useEffect(() => {
        if (type === 'IMAGE' && uri) {
            Image.getSize(uri, (w, h) => {
                let displayWidth, displayHeight;
                const aspectRatio = w / h;
                if (aspectRatio >= 1) {
                    // Landscape or square: fit to max width, scale height
                    displayWidth = MEDIA_MAX_WIDTH;
                    displayHeight = Math.min(MEDIA_MAX_HEIGHT, MEDIA_MAX_WIDTH / aspectRatio);
                } else {
                    // Portrait: fit to max height, scale width
                    displayHeight = MEDIA_MAX_HEIGHT;
                    displayWidth = Math.min(MEDIA_MAX_WIDTH, MEDIA_MAX_HEIGHT * aspectRatio);
                }
                setMediaDims({ width: displayWidth, height: displayHeight });
            }, () => {
                setMediaDims({ width: MEDIA_MAX_WIDTH, height: MEDIA_MAX_HEIGHT });
            });
        }
    }, [type, uri]);

    const handleVideoLoad = (status) => {
        if (status.naturalSize && status.naturalSize.width && status.naturalSize.height) {
            const { width: vW, height: vH } = status.naturalSize;
            let displayWidth, displayHeight;
            const aspectRatio = vW / vH;
            if (aspectRatio >= 1) {
                displayWidth = MEDIA_MAX_WIDTH;
                displayHeight = Math.min(MEDIA_MAX_HEIGHT, MEDIA_MAX_WIDTH / aspectRatio);
            } else {
                displayHeight = MEDIA_MAX_HEIGHT;
                displayWidth = Math.min(MEDIA_MAX_WIDTH, MEDIA_MAX_HEIGHT * aspectRatio);
            }
            setMediaDims({ width: displayWidth, height: displayHeight });
        }
    };

    // Autoplay/pause based on visibility
    React.useEffect(() => {
        if (videoRef.current) {
            if (isVisible) videoRef.current.playAsync?.();
            else videoRef.current.pauseAsync?.();
        }
    }, [isVisible]);

    if (!uri) return null;
    if (type === 'IMAGE') {
        return (
            <Image source={{ uri }} style={[styles.postImage, mediaDims]} resizeMode="cover" />
        );
    } else if (type === 'VIDEO') {
        return (
            <Video
                ref={videoRef}
                source={{ uri }}
                style={[styles.postImage, mediaDims]}
                resizeMode="contain"
                useNativeControls
                shouldPlay={isVisible}
                isLooping={false}
                paused={!isVisible}
                onLoad={handleVideoLoad}
            />
        );
    }
    return null;
});

// --- Post Card ---
const PostCard = ({ item, isDarkMode, onLike, onBookmark, isVisible }) => {
    const [commentsVisible, setCommentsVisible] = useState(false);
    const router = useRouter();

    // Avatar fallback
    const authorAvatar = item.author.profile_photo && item.author.profile_photo.startsWith('http')
        ? item.author.profile_photo
        : 'https://via.placeholder.com/100';

    return (
        <View style={[styles.card, isDarkMode && styles.cardDark]}>
            <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => router.push(`/community-profile/${item.author.username}`)}>
                <Image source={{ uri: authorAvatar }} style={styles.avatar} />
                <View>
                    <Text style={[styles.authorName, isDarkMode && styles.textDark]}>{item.author.username}</Text>
                    <Text style={[styles.timestamp, isDarkMode && styles.textSecondaryDark]}>{new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
            </TouchableOpacity>
            <Text style={[styles.title, isDarkMode && styles.textDark]}>{item.title}</Text>
            <SmartMedia type={item.content_type} uri={item.file} isVisible={!!isVisible} />
            <View style={[styles.actionsContainer, isDarkMode && styles.actionsContainerDark]}>
                <TouchableOpacity style={styles.actionButton} onPress={onLike}>
                    <Ionicons name={item.is_liked_by_user ? "heart" : "heart-outline"} size={24} color={item.is_liked_by_user ? '#ef4444' : (isDarkMode ? '#9ca3af' : '#6b7280')} />
                    <Text style={[styles.actionText, isDarkMode && styles.textSecondaryDark]}>{item.likes_count}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => setCommentsVisible(!commentsVisible)}>
                    <Ionicons name="chatbubble-outline" size={24} color={isDarkMode ? '#9ca3af' : '#6b7280'} />
                    <Text style={[styles.actionText, isDarkMode && styles.textSecondaryDark]}>{item.comments_count}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={onBookmark}>
                    <Ionicons name={item.is_bookmarked_by_user ? "bookmark" : "bookmark-outline"} size={24} color={isDarkMode ? '#9ca3af' : '#6b7280'} />
                </TouchableOpacity>
            </View>
            {commentsVisible && <CommentSection postId={item.id} isDarkMode={isDarkMode} />}
        </View>
    );
};

// --- Community Main ---
export default function CommunityScreen() {
    const { user, fetcher, theme, isContentCreator } = useAppContext();
    const router = useRouter();
    const isDarkMode = theme === 'dark';
    const { data: posts, error, isLoading, mutate } = useSWR(user ? '/community/posts/' : null, fetcher);

    const [visibleItems, setVisibleItems] = useState([]);
    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        setVisibleItems(viewableItems.map(v => v.index));
    });
    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60, waitForInteraction: true });

    const handleLike = useCallback(async (postId) => {
        if (!user) return Alert.alert("Please login to like posts.");
        mutate((currentData) => {
            if (!currentData) return currentData;
            return currentData.map((post) => {
                if (post.id === postId) {
                    return {
                        ...post,
                        is_liked_by_user: !post.is_liked_by_user,
                        likes_count: post.is_liked_by_user ? post.likes_count - 1 : post.likes_count + 1
                    };
                }
                return post;
            });
        }, false);

        try {
            await apiClient.post(`/community/posts/${postId}/like/`);
            mutate();
        } catch {
            mutate();
        }
    }, [user, mutate]);

    const handleBookmark = useCallback(async (postId) => {
        if (!user) return Alert.alert("Please login to bookmark posts.");
        mutate((data) => {
            if (!data) return data;
            return data.map((p) => p.id === postId ? { ...p, is_bookmarked_by_user: !p.is_bookmarked_by_user } : p);
        }, false);
        try {
            await apiClient.post(`/community/posts/${postId}/bookmark/`);
            mutate();
        } catch {
            mutate();
        }
    }, [user, mutate]);

    if (isLoading) return <View style={[styles.centered, isDarkMode && styles.containerDark]}><ActivityIndicator size="large" /></View>;
    if (error) return <View style={[styles.centered, isDarkMode && styles.containerDark]}><Text style={isDarkMode && styles.textDark}>Failed to load posts.</Text></View>;

    return (
        <SafeAreaView style={[styles.safeArea, isDarkMode && styles.containerDark]}>
            <FlatList
                data={posts}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item, index }) => (
                    <PostCard 
                        item={item} 
                        isDarkMode={isDarkMode} 
                        onLike={() => handleLike(item.id)}
                        onBookmark={() => handleBookmark(item.id)}
                        isVisible={visibleItems.includes(index)}
                    />
                )}
                contentContainerStyle={{ paddingBottom: 120 }}
                ListEmptyComponent={() => (
                    <View style={styles.centered}>
                        <Text style={[styles.emptyText, isDarkMode && styles.textSecondaryDark]}>No posts yet.</Text>
                    </View>
                )}
                onViewableItemsChanged={onViewableItemsChanged.current}
                viewabilityConfig={viewabilityConfig.current}
            />
            {isContentCreator && (
                <TouchableOpacity style={styles.fab} onPress={() => router.push('/create-post')}>
                    <Ionicons name="add" size={32} color="#fff" />
                </TouchableOpacity>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f0f2f5' },
    containerDark: { backgroundColor: '#121212' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },
    card: { backgroundColor: '#fff', marginVertical: 8, marginHorizontal: 16, borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 5 },
    cardDark: { backgroundColor: '#1f2937', borderWidth: 1, borderColor: '#374151' },
    cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 12 },
    avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
    authorName: { fontWeight: 'bold', fontSize: 16 },
    timestamp: { fontSize: 12, color: '#6b7280' },
    title: { fontSize: 16, paddingHorizontal: 12, paddingBottom: 12, lineHeight: 22 },
    postImage: { backgroundColor: '#000', borderRadius: 14, marginTop: 8, alignSelf: 'center', marginBottom: 10 },
    actionsContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f0f2f5' },
    actionsContainerDark: { borderTopColor: '#374151' },
    actionButton: { flexDirection: 'row', alignItems: 'center' },
    actionText: { marginLeft: 6, fontSize: 14, color: '#6b7280' },
    emptyText: { fontSize: 16, color: '#6b7280', textAlign: 'center' },
    textDark: { color: '#fff' },
    textSecondaryDark: { color: '#9ca3af' },
    fab: { position: 'absolute', bottom: 100, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#4A3780', justifyContent: 'center', alignItems: 'center', elevation: 8 },
    commentsContainer: { paddingHorizontal: 12, paddingTop: 12 },
    commentsContainerDark: { borderTopColor: '#374151' },
    comment: { marginBottom: 12, paddingLeft: 10 },
    commentText: { color: '#374151' },
    commentInputContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10, borderTopWidth: 1, borderTopColor: '#f0f2f5', paddingTop: 10 },
    commentInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12, marginRight: 8 },
    commentInputDark: { borderColor: '#555', color: '#fff' },
    errorText: { color: 'red', textAlign: 'center' },
});