import React, { useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '@/context/AppContext';
import useSWR from 'swr';

// Reusable component for a single message/notification item
const InboxItem = ({ icon, title, body, time, isUnread, isDarkMode }: any) => (
    <View style={[styles.itemContainer, isDarkMode && styles.itemContainerDark]}>
        <View style={[styles.iconContainer, isDarkMode && styles.iconContainerDark]}>
            <Ionicons name={icon} size={24} color={isDarkMode ? '#A78BFA' : '#4A3780'} />
        </View>
        <View style={styles.itemContent}>
            <Text style={[styles.itemTitle, isDarkMode && styles.textDark]}>{title}</Text>
            <Text style={[styles.itemBody, isDarkMode ? styles.itemBodyDark : undefined]} numberOfLines={2}>{body}</Text>
            <Text style={[styles.itemTime, isDarkMode ? styles.itemTimeDark : undefined]}>{time}</Text>
        </View>
        {isUnread && <View style={styles.unreadDot} />}
    </View>
);

// --- Messages Tab ---
const MessagesRoute = () => {
    const { fetcher, theme } = useAppContext();
    const isDarkMode = theme === 'dark';
    const { data: messages, error, isLoading } = useSWR('/my-messages/', fetcher);

    if (isLoading) return <ActivityIndicator style={{marginTop: 20}} />;
    if (error) return <Text style={{color: 'red', textAlign: 'center', marginTop: 20}}>Failed to load messages.</Text>;

    return (
        <ScrollView style={[styles.scene, isDarkMode && styles.sceneDark]}>
            {messages && messages.length > 0 ? messages.map((msg: any) => (
                <InboxItem
                    key={msg.id}
                    icon="chatbubble-ellipses-outline"
                    title={msg.subject}
                    body={msg.body}
                    time={new Date(msg.sent_at).toLocaleDateString()}
                    isUnread={!msg.is_read}
                    isDarkMode={isDarkMode}
                />
            )) : <Text style={[styles.emptyText, isDarkMode && styles.textSecondaryDark]}>You have no messages.</Text>}
        </ScrollView>
    );
};

// --- Notifications Tab ---
const NotificationsRoute = () => {
    const { theme } = useAppContext();
    const isDarkMode = theme === 'dark';
    return (
        <ScrollView style={[styles.scene, isDarkMode && styles.sceneDark]}>
            <InboxItem 
                icon="megaphone-outline"
                title="New Feature Available!"
                body="The new 'Exam Battle' mode is now live. Challenge your friends!"
                time="2 hours ago"
                isUnread={true}
                isDarkMode={isDarkMode}
            />
        </ScrollView>
    );
};

const renderScene = SceneMap({
  messages: MessagesRoute,
  notifications: NotificationsRoute,
});

export default function InboxScreen() {
  const layout = useWindowDimensions();
  const router = useRouter();
  const { theme } = useAppContext();
  const isDarkMode = theme === 'dark';

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'messages', title: 'Messages' },
    { key: 'notifications', title: 'Notifications' },
  ]);

  return (
    <SafeAreaView style={[styles.safeArea, isDarkMode && styles.containerDark]}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Custom Header */}
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#fff' : '#1f2937'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDarkMode && styles.textDark]}>Inbox</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tab Navigator */}
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
            activeColor={isDarkMode ? '#A78BFA' : '#4A3780'}
            inactiveColor={isDarkMode ? '#fff' : '#1f2937'}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  containerDark: { backgroundColor: '#121212' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerDark: { backgroundColor: '#1f2937', borderBottomColor: '#374151' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  scene: { flex: 1, padding: 16 },
  sceneDark: { backgroundColor: '#121212' },
  itemContainer: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 },
  itemContainerDark: { backgroundColor: '#1f2937' },
  iconContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  iconContainerDark: { backgroundColor: '#374151' },
  itemContent: { flex: 1 },
  itemTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 4, color: '#1f2937' },
  itemBody: { fontSize: 14, color: '#6b7280' },
  itemBodyDark: { color: '#d1d5db' },
  itemTime: { fontSize: 12, color: '#9ca3af', marginTop: 8 },
  itemTimeDark: { color: '#a1a1aa' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1976d2', marginLeft: 10, alignSelf: 'center' },
  emptyText: { textAlign: 'center', color: 'gray', marginTop: 20 },
  textDark: { color: '#fff' },
  textSecondaryDark: { color: '#9ca3af' },
});