'use client';

import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, ActivityIndicator, SafeAreaView
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import useSWR from 'swr';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '@/lib/apiClient';

// --- Reusable Chat/Group Row (WhatsApp/Telegram style) ---
const ListItem = ({ title, subtitle, imageUrl, timestamp, onPress, isDarkMode, isGroup = false }: any) => {
  const [imgError, setImgError] = useState(false);
  
  const getAvatarUrl = (url: string) => {
      if (!url) return 'https://via.placeholder.com/100';
      if (url.startsWith('http')) return url;
      const baseUrl = API_URL.endsWith('/api') ? API_URL.slice(0, -4) : API_URL;
      return `${baseUrl}${url}`;
  };
  const avatarUrl = imgError ? 'https://via.placeholder.com/100' : getAvatarUrl(imageUrl);
  
  return (
    <TouchableOpacity style={[styles.row, isDarkMode && styles.rowDark]} onPress={onPress}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} onError={() => setImgError(true)} />
          {isGroup && (
            <View style={[styles.groupBadge, isDarkMode && styles.groupBadgeDark]}>
              <Ionicons name="people" size={12} color={isDarkMode ? "#121212" : "#fff"} />
            </View>
          )}
        </View>
        <View style={styles.textContainer}>
            <Text style={[styles.username, isDarkMode && styles.textDark]} numberOfLines={1}>{title}</Text>
            <Text style={[styles.lastMessage, isDarkMode && styles.textSecondaryDark]} numberOfLines={1}>{subtitle}</Text>
        </View>
        <Text style={[styles.timestamp, isDarkMode && styles.textSecondaryDark]}>{timestamp}</Text>
    </TouchableOpacity>
  );
};

export default function InboxScreen() {
  const router = useRouter();
  const { user, fetcher, theme, isContentCreator } = useAppContext();
  const isDarkMode = theme === 'dark';

  const { data: inboxItems, error, isLoading } = useSWR(user ? '/messaging/unified-inbox/' : null, fetcher);

  const getOtherParticipant = (participants: any[] = []) => participants.find(p => p.id !== user?.id);

  const renderItem = ({ item }: any) => {
    const lastMessageTime = item.data.last_message 
      ? new Date(item.data.last_message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

    if (item.type === 'conversation') {
        const otherUser = getOtherParticipant(item.data.participants);
        return (
            <ListItem
                title={otherUser?.username || 'Unknown User'}
                subtitle={item.data.last_message?.text || 'No messages yet'}
                imageUrl={otherUser?.profile_photo}
                timestamp={lastMessageTime}
                onPress={() => router.push(`/chat/${item.data.id}`)}
                isDarkMode={isDarkMode}
            />
        );
    } else if (item.type === 'group') {
        return (
            <ListItem
                title={item.data.name}
                subtitle={item.data.last_message?.text ? `${item.data.last_message.sender.username}: ${item.data.last_message.text}` : `${item.data.member_count} members`}
                imageUrl={'https://via.placeholder.com/100/4A3780/FFFFFF?text=G'}
                timestamp={lastMessageTime}
                onPress={() => router.push(`/group-chat/${item.data.id}`)}
                isDarkMode={isDarkMode}
                isGroup={true}
            />
        );
    }
    return null;
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
        <Ionicons name="chatbubbles-outline" size={64} color={isDarkMode ? "#4b5563" : "#9ca3af"} />
        <Text style={[styles.emptyText, isDarkMode && styles.textSecondaryDark]}>Your Inbox is Empty</Text>
        <Text style={[styles.emptySubtext, isDarkMode && styles.textSecondaryDark]}>Start a conversation or join a group to get started.</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, isDarkMode && styles.containerDark]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.header, isDarkMode && styles.headerDark]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#fff' : '#1f2937'} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, isDarkMode && styles.textDark]}>Inbox</Text>
            <TouchableOpacity onPress={() => router.push('/groups-discover')} style={styles.headerButton}>
                <Ionicons name="search-outline" size={24} color={isDarkMode ? '#fff' : '#1f2937'} />
            </TouchableOpacity>
        </View>

        {isLoading ? (
            <ActivityIndicator style={styles.loader} size="large" />
        ) : (
            <FlatList
                data={inboxItems || []}
                keyExtractor={item => `${item.type}_${item.data.id}`}
                renderItem={renderItem}
                ListEmptyComponent={renderEmpty}
                contentContainerStyle={{ paddingBottom: 120 }}
            />
        )}

        {isContentCreator && (
            <TouchableOpacity style={styles.fab} onPress={() => router.push('/create-group')}>
                <Ionicons name="add" size={32} color="#fff" />
            </TouchableOpacity>
        )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    containerDark: { backgroundColor: '#121212' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, 
        borderBottomColor: '#e5e7eb', backgroundColor: '#fff'
    },
    headerDark: { backgroundColor: '#1f2937', borderBottomColor: '#374151' },
    headerButton: { padding: 8 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    row: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12,
        backgroundColor: '#fff'
    },
    rowDark: { backgroundColor: '#121212' },
    avatarContainer: { position: 'relative', marginRight: 12 },
    avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#e5e7eb' },
    groupBadge: {
        position: 'absolute', bottom: -2, right: -2, backgroundColor: '#4A3780',
        borderRadius: 10, width: 20, height: 20, justifyContent: 'center',
        alignItems: 'center', borderWidth: 2, borderColor: '#fff',
    },
    groupBadgeDark: { borderColor: '#121212' },
    textContainer: { flex: 1, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 12 },
    username: { fontSize: 16, fontWeight: 'bold' },
    lastMessage: { color: '#6b7280', paddingTop: 4, fontSize: 15 },
    timestamp: { fontSize: 12, color: '#6b7280', alignSelf: 'flex-start', paddingTop: 14 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, marginTop: 100 },
    emptyText: { textAlign: 'center', fontSize: 18, fontWeight: '600', marginBottom: 8 },
    emptySubtext: { textAlign: 'center', color: '#6b7280', fontSize: 14, lineHeight: 20 },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    textDark: { color: '#fff' },
    textSecondaryDark: { color: '#9ca3af' },
    fab: {
        position: 'absolute', bottom: 100, right: 20, width: 60, height: 60,
        borderRadius: 30, backgroundColor: '#4A3780', justifyContent: 'center',
        alignItems: 'center', elevation: 8,
    },
});
