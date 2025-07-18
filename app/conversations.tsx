'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { 
    View, 
    Text, 
    FlatList, 
    TouchableOpacity, 
    StyleSheet, 
    SafeAreaView, 
    ActivityIndicator, 
    Image,
    TextInput,
    RefreshControl,
    Alert,
    Dimensions
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import useSWR from 'swr';
import { useAppContext } from '@/context/AppContext';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function ConversationsScreen() {
    const { user, fetcher, theme } = useAppContext();
    const router = useRouter();
    const isDarkMode = theme === 'dark';
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const { data: conversations, error, isLoading, mutate } = useSWR(
        user ? '/messaging/conversations/' : null, 
        fetcher
    );

    const getOtherParticipant = useCallback((participants: any[]) => {
        if (!user || !participants) return null;
        return participants.find(p => p.id !== user.id);
    }, [user]);

    const filteredConversations = useMemo(() => {
        if (!conversations || !searchQuery.trim()) return conversations || [];
        
        return conversations.filter(conversation => {
            const otherUser = getOtherParticipant(conversation.participants);
            if (!otherUser) return false;
            
            const searchLower = searchQuery.toLowerCase();
            return (
                otherUser.username.toLowerCase().includes(searchLower) ||
                otherUser.first_name?.toLowerCase().includes(searchLower) ||
                otherUser.last_name?.toLowerCase().includes(searchLower) ||
                conversation.last_message?.text?.toLowerCase().includes(searchLower)
            );
        });
    }, [conversations, searchQuery, getOtherParticipant]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await mutate();
        } catch (error) {
            Alert.alert('Error', 'Failed to refresh conversations');
        } finally {
            setRefreshing(false);
        }
    }, [mutate]);

    const formatLastMessageTime = useCallback((timestamp: string) => {
        if (!timestamp) return '';
        
        const messageDate = new Date(timestamp);
        const now = new Date();
        const diffInMs = now.getTime() - messageDate.getTime();
        const diffInHours = diffInMs / (1000 * 60 * 60);
        const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

        if (diffInHours < 1) {
            const minutes = Math.floor(diffInMs / (1000 * 60));
            return minutes < 1 ? 'now' : `${minutes}m`;
        } else if (diffInHours < 24) {
            return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffInDays < 7) {
            return messageDate.toLocaleDateString([], { weekday: 'short' });
        } else {
            return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    }, []);

    const renderConversationItem = useCallback(({ item, index }) => {
        const otherUser = getOtherParticipant(item.participants);
        if (!otherUser) return null;

        const displayName = otherUser.first_name && otherUser.last_name 
            ? `${otherUser.first_name} ${otherUser.last_name}`
            : otherUser.username;

        const hasUnreadMessages = item.unread_count > 0;
        const lastMessageTime = formatLastMessageTime(item.last_message?.timestamp);

        return (
            <TouchableOpacity 
                style={[
                    styles.conversationRow, 
                    isDarkMode && styles.conversationRowDark,
                    hasUnreadMessages && styles.conversationRowUnread,
                    index === 0 && styles.firstRow
                ]} 
                onPress={() => router.push(`/chat/${item.id}`)}
                activeOpacity={0.7}
            >
                <View style={styles.avatarContainer}>
                    <Image 
                        source={{ 
                            uri: otherUser.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=4A3780&color=fff&size=100`
                        }} 
                        style={styles.avatar} 
                    />
                    {item.is_online && <View style={styles.onlineIndicator} />}
                </View>
                
                <View style={styles.conversationContent}>
                    <View style={styles.conversationHeader}>
                        <Text 
                            style={[
                                styles.displayName, 
                                isDarkMode && styles.textDark,
                                hasUnreadMessages && styles.unreadText
                            ]}
                            numberOfLines={1}
                        >
                            {displayName}
                        </Text>
                        {lastMessageTime && (
                            <Text style={[
                                styles.timestamp, 
                                isDarkMode && styles.timestampDark,
                                hasUnreadMessages && styles.unreadTimestamp
                            ]}>
                                {lastMessageTime}
                            </Text>
                        )}
                    </View>
                    
                    <View style={styles.messageRow}>
                        <Text 
                            style={[
                                styles.lastMessage, 
                                isDarkMode && styles.lastMessageDark,
                                hasUnreadMessages && styles.unreadMessage
                            ]} 
                            numberOfLines={1}
                        >
                            {item.last_message?.sender?.id === user?.id && "You: "}
                            {item.last_message?.text || "No messages yet"}
                        </Text>
                        {hasUnreadMessages && (
                            <View style={styles.unreadBadge}>
                                <Text style={styles.unreadBadgeText}>
                                    {item.unread_count > 99 ? '99+' : item.unread_count}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    }, [getOtherParticipant, formatLastMessageTime, isDarkMode, user?.id, router]);

    const renderHeader = () => (
        <View style={styles.header}>
            <Text style={[styles.headerTitle, isDarkMode && styles.textDark]}>
                Messages
            </Text>
            <View style={[styles.searchContainer, isDarkMode && styles.searchContainerDark]}>
                <Ionicons 
                    name="search" 
                    size={20} 
                    color={isDarkMode ? '#9CA3AF' : '#6B7280'} 
                    style={styles.searchIcon}
                />
                <TextInput
                    style={[styles.searchInput, isDarkMode && styles.searchInputDark]}
                    placeholder="Search conversations..."
                    placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons 
                            name="close-circle" 
                            size={20} 
                            color={isDarkMode ? '#9CA3AF' : '#6B7280'} 
                        />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Ionicons 
                name="chatbubbles-outline" 
                size={80} 
                color={isDarkMode ? '#4B5563' : '#D1D5DB'} 
            />
            <Text style={[styles.emptyTitle, isDarkMode && styles.emptyTitleDark]}>
                No conversations yet
            </Text>
            <Text style={[styles.emptySubtitle, isDarkMode && styles.emptySubtitleDark]}>
                Start a new conversation to connect with others
            </Text>
            <TouchableOpacity 
                style={[styles.startChatButton, isDarkMode && styles.startChatButtonDark]}
                onPress={() => router.push('/users')} // Assuming you have a users screen
            >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.startChatButtonText}>Start New Chat</Text>
            </TouchableOpacity>
        </View>
    );

    const renderSearchEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Ionicons 
                name="search-outline" 
                size={60} 
                color={isDarkMode ? '#4B5563' : '#D1D5DB'} 
            />
            <Text style={[styles.emptyTitle, isDarkMode && styles.emptyTitleDark]}>
                No results found
            </Text>
            <Text style={[styles.emptySubtitle, isDarkMode && styles.emptySubtitleDark]}>
                Try adjusting your search terms
            </Text>
        </View>
    );

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centered, isDarkMode && styles.containerDark]}>
                <ActivityIndicator size="large" color={isDarkMode ? '#fff' : '#4A3780'} />
                <Text style={[styles.loadingText, isDarkMode && styles.textDark]}>
                    Loading conversations...
                </Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.container, styles.centered, isDarkMode && styles.containerDark]}>
                <Ionicons name="alert-circle-outline" size={60} color="#EF4444" />
                <Text style={[styles.errorText, isDarkMode && styles.errorTextDark]}>
                    Failed to load conversations
                </Text>
                <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={() => mutate()}
                >
                    <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
            <Stack.Screen 
                options={{ 
                    headerShown: false
                }} 
            />
            
            <FlatList
                data={filteredConversations}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderConversationItem}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={searchQuery ? renderSearchEmptyState : renderEmptyState}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#4A3780']}
                        tintColor={isDarkMode ? '#fff' : '#4A3780'}
                    />
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    containerDark: {
        backgroundColor: '#121212',
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        flexGrow: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: 'transparent',
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    searchContainerDark: {
        backgroundColor: '#1f2937',
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
    },
    searchInputDark: {
        color: '#fff',
    },
    conversationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    conversationRowDark: {
        backgroundColor: '#1f2937',
        borderBottomColor: '#374151',
    },
    conversationRowUnread: {
        backgroundColor: '#f8fafc',
    },
    firstRow: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 16,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#E5E7EB',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#10B981',
        borderWidth: 2,
        borderColor: '#fff',
    },
    conversationContent: {
        flex: 1,
    },
    conversationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    displayName: {
        fontSize: 17,
        fontWeight: '600',
        color: '#111827',
        flex: 1,
    },
    unreadText: {
        fontWeight: '700',
    },
    timestamp: {
        fontSize: 13,
        color: '#6b7280',
        marginLeft: 8,
    },
    timestampDark: {
        color: '#9ca3af',
    },
    unreadTimestamp: {
        color: '#4A3780',
        fontWeight: '600',
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    lastMessage: {
        fontSize: 15,
        color: '#6b7280',
        flex: 1,
        lineHeight: 20,
    },
    lastMessageDark: {
        color: '#9ca3af',
    },
    unreadMessage: {
        color: '#374151',
        fontWeight: '500',
    },
    unreadBadge: {
        backgroundColor: '#4A3780',
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
        marginLeft: 8,
    },
    unreadBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#374151',
        marginTop: 20,
        marginBottom: 8,
    },
    emptyTitleDark: {
        color: '#D1D5DB',
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    emptySubtitleDark: {
        color: '#9CA3AF',
    },
    startChatButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4A3780',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
    },
    startChatButtonDark: {
        backgroundColor: '#5B21B6',
    },
    startChatButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
    },
    errorText: {
        fontSize: 18,
        color: '#EF4444',
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 24,
    },
    errorTextDark: {
        color: '#F87171',
    },
    retryButton: {
        backgroundColor: '#4A3780',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    textDark: {
        color: '#fff',
    },
});