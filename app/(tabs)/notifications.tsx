import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useSWR from 'swr';
import { useAppContext } from '@/context/AppContext';

// Reusable component for a single message/notification item
const InboxItem = ({ icon, title, body, time, isUnread, isDarkMode }: any) => (
    <View style={[styles.itemContainer, isDarkMode && styles.itemContainerDark]}>
        <View style={[styles.iconContainer, isDarkMode && styles.iconContainerDark]}>
            <Ionicons name={icon} size={24} color={isDarkMode ? '#A78BFA' : '#4A3780'} />
        </View>
        <View style={styles.itemContent}>
            <Text style={[styles.itemTitle, isDarkMode && styles.textDark]}>{title}</Text>
            <Text style={[styles.itemBody, isDarkMode && styles.textSecondaryDark]} numberOfLines={2}>{body}</Text>
            <Text style={[styles.itemTime, isDarkMode && styles.textSecondaryDark]}>{time}</Text>
        </View>
        {isUnread && <View style={styles.unreadDot} />}
    </View>
);

export default function NotificationsScreen() {
  const router = useRouter();
  const { user, fetcher, theme } = useAppContext();
  const isDarkMode = theme === 'dark';

  // Fetch messages from the backend
  const { data: messages, error, isLoading } = useSWR(user ? '/my-messages/' : null, fetcher);

  return (
    <SafeAreaView style={[styles.safeArea, isDarkMode && styles.containerDark]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Notifications Section */}
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.textDark]}>Notifications</Text>
            {/* Placeholder for notifications */}
            <InboxItem 
                icon="megaphone-outline"
                title="New Feature Available!"
                body="The new 'Exam Battle' mode is now live. Challenge your friends to a real-time quiz!"
                time="2 hours ago"
                isUnread={true}
                isDarkMode={isDarkMode}
            />
             <InboxItem 
                icon="trophy-outline"
                title="New High Score!"
                body="You achieved a new high score of 85 in the LDC Model Exam."
                time="1 day ago"
                isUnread={false}
                isDarkMode={isDarkMode}
            />
        </View>

        {/* Messages Section */}
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.textDark]}>Messages</Text>
            {isLoading && <ActivityIndicator color={isDarkMode ? '#fff' : '#000'} />}
            {error && <Text style={{color: 'red', textAlign: 'center'}}>Failed to load messages.</Text>}
            
            {messages && messages.length > 0 && messages.map((msg: any) => (
                <InboxItem
                    key={msg.id}
                    icon="chatbubble-ellipses-outline"
                    title={msg.subject}
                    body={msg.body}
                    time={new Date(msg.sent_at).toLocaleDateString()}
                    isUnread={!msg.is_read} // You can use the 'read_by' logic here
                    isDarkMode={isDarkMode}
                />
            ))}
            {messages && messages.length === 0 && <Text style={[styles.emptyText, isDarkMode && styles.textSecondaryDark]}>You have no messages from institutes.</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f0f2f5' },
  containerDark: { backgroundColor: '#121212' },
  section: { marginTop: 16, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, color: '#1f2937' },
  itemContainer: { 
      flexDirection: 'row', 
      backgroundColor: '#fff', 
      padding: 16, 
      borderRadius: 12, 
      marginBottom: 12, 
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 5,
  },
  itemContainerDark: { backgroundColor: '#1f2937' },
  iconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#eef2ff',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
  },
  iconContainerDark: { backgroundColor: '#374151' },
  itemContent: { flex: 1 },
  itemTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 4, color: '#111827' },
  itemBody: { fontSize: 14, color: '#6b7280', lineHeight: 20 },
  itemTime: { fontSize: 12, color: '#9ca3af', marginTop: 8 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1976d2', marginLeft: 10, alignSelf: 'center' },
  emptyText: { textAlign: 'center', color: 'gray', marginTop: 20, fontStyle: 'italic' },
  textDark: { color: '#fff' },
  textSecondaryDark: { color: '#9ca3af' },
});
