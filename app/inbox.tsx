'use client';

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, useWindowDimensions, TouchableOpacity,
  FlatList, Image, ActivityIndicator
} from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '@/context/AppContext';
import useSWR from 'swr';
import { Ionicons } from '@expo/vector-icons';

// Helper to get correct avatar URL for user profiles
const getAvatarUrl = (url) => {
  if (!url) return 'https://via.placeholder.com/100/cccccc/222222?text=U';
  if (url.startsWith('http')) return url;
  // Change this to match your backend URL if you get relative paths from backend
  return `https://your-backend.com${url}`;
};

// --- Reusable Chat/Group Row (Telegram style) ---
const ListItem = ({ title, subtitle, imageUrl, onPress, isDarkMode }) => {
  const [error, setError] = React.useState(false);

  return (
    <TouchableOpacity style={[styles.row, isDarkMode && styles.rowDark]} onPress={onPress}>
      <Image
        source={{ uri: !error ? getAvatarUrl(imageUrl) : 'https://via.placeholder.com/100/cccccc/222222?text=U' }}
        style={styles.avatar}
        resizeMode="cover"
        onError={() => setError(true)}
      />
      <View style={styles.textContainer}>
        <Text style={[styles.username, isDarkMode && styles.textDark]} numberOfLines={1}>
          {title}
        </Text>
        <Text
          style={[styles.lastMessage, isDarkMode && styles.textSecondaryDark]}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={22} color={isDarkMode ? "#9ca3af" : "#6b7280"} />
    </TouchableOpacity>
  );
};

// --- Chats Tab ---
const ChatsRoute = () => {
  const { user, fetcher, theme } = useAppContext();
  const router = useRouter();
  const isDarkMode = theme === 'dark';
  const { data: conversations, isLoading } = useSWR(user ? '/messaging/conversations/' : null, fetcher);

  const getOtherParticipant = (participants = []) => participants.find(p => p.id !== user?.id);

  if (isLoading) return <ActivityIndicator style={{ marginTop: 20 }} />;

  return (
    <FlatList
      data={conversations || []}
      keyExtractor={item => item.id.toString()}
      renderItem={({ item }) => {
        const otherUser = getOtherParticipant(item.participants);
        return (
          <ListItem
            title={otherUser?.username || 'Unknown User'}
            subtitle={item.last_message?.text || 'No messages yet'}
            imageUrl={otherUser?.profile_photo}
            onPress={() => router.push(`/chat/${item.id}`)}
            isDarkMode={isDarkMode}
          />
        );
      }}
      style={[styles.scene, isDarkMode && styles.sceneDark]}
      ListEmptyComponent={<Text style={[styles.emptyText, isDarkMode && styles.textSecondaryDark]}>No chats found.</Text>}
    />
  );
};

// --- Groups Tab ---
const GroupsRoute = () => {
  const { user, fetcher, theme } = useAppContext();
  const router = useRouter();
  const isDarkMode = theme === 'dark';
  const { data: groups, isLoading } = useSWR(user ? '/messaging/my-groups/' : null, fetcher);

  if (isLoading) return <ActivityIndicator style={{ marginTop: 20 }} />;

  return (
    <FlatList
      data={groups || []}
      keyExtractor={item => item.id.toString()}
      renderItem={({ item }) => (
        <ListItem
          title={item.name}
          subtitle={`${item.member_count} members`}
          imageUrl={'https://via.placeholder.com/100/4A3780/FFFFFF?text=G'}
          onPress={() => router.push(`/group-chat/${item.id}`)}
          isDarkMode={isDarkMode}
        />
      )}
      style={[styles.scene, isDarkMode && styles.sceneDark]}
      ListEmptyComponent={<Text style={[styles.emptyText, isDarkMode && styles.textSecondaryDark]}>You haven't joined any groups yet.</Text>}
    />
  );
};

const renderScene = SceneMap({
  chats: ChatsRoute,
  groups: GroupsRoute,
});

export default function InboxScreen() {
  const layout = useWindowDimensions();
  const router = useRouter();
  const { theme, isContentCreator } = useAppContext();
  const isDarkMode = theme === 'dark';

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'chats', title: 'Chats' },
    { key: 'groups', title: 'Groups' },
  ]);

  return (
    <SafeAreaView style={[styles.safeArea, isDarkMode && styles.containerDark]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#fff' : '#1f2937'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDarkMode && styles.textDark]}>Inbox</Text>
        <TouchableOpacity onPress={() => router.push('/groups-discover')} style={{ padding: 8 }}>
          <Ionicons name="search-outline" size={24} color={isDarkMode ? '#fff' : '#1f2937'} />
        </TouchableOpacity>
      </View>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={props => (
          <TabBar
            {...props}
            indicatorStyle={{ backgroundColor: '#4A3780' }}
            style={{ backgroundColor: isDarkMode ? '#1f2937' : '#fff' }}
            labelStyle={{ color: isDarkMode ? '#fff' : '#1f2937', fontWeight: '600' }}
          />
        )}
      />
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
    paddingHorizontal: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb'
  },
  headerDark: { backgroundColor: '#1f2937', borderBottomColor: '#374151' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  scene: { flex: 1 },
  sceneDark: { backgroundColor: '#121212' },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff'
  },
  rowDark: { borderBottomColor: '#374151', backgroundColor: '#1f2937' },
  avatar: {
    width: 50, height: 50, borderRadius: 25, marginRight: 12,
    backgroundColor: '#ddd', // fallback background
    borderWidth: 1, borderColor: '#ccc', // subtle border
  },
  textContainer: { flex: 1 },
  username: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  lastMessage: { color: '#6b7280', paddingTop: 4, fontSize: 15 },
  emptyText: { textAlign: 'center', marginTop: 50, color: 'gray', fontSize: 16 },
  textDark: { color: '#fff' },
  textSecondaryDark: { color: '#9ca3af' },
  fab: {
    position: 'absolute', bottom: 100, right: 20, width: 60, height: 60,
    borderRadius: 30, backgroundColor: '#4A3780', justifyContent: 'center',
    alignItems: 'center', elevation: 8,
  },
});