import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import useSWR from 'swr';
import { useAppContext } from '@/context/AppContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const TopicCard = ({ item, onPress, isDarkMode }: { item: any, onPress: () => void, isDarkMode: boolean }) => (
  <TouchableOpacity style={[styles.card, isDarkMode && styles.cardDark]} onPress={onPress}>
    <Ionicons name="library-outline" size={32} color={isDarkMode ? '#64b5f6' : '#1976d2'} />
    <Text style={[styles.cardTitle, isDarkMode && styles.cardTextDark]}>{item.name}</Text>
  </TouchableOpacity>
);

export default function TopicsScreen() {
  const { fetcher, theme } = useAppContext();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: topics, error, isLoading } = useSWR('/topics/', fetcher);
  const isDarkMode = theme === 'dark';

  const handleTopicSelect = (topicId: string) => {
    router.push(`/topics/${topicId}`);
  };

  const filteredData = useMemo(() => {
    if (!topics) return [];
    if (!searchQuery.trim()) return topics;
    return topics.filter((topic: any) =>
      topic.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [topics, searchQuery]);

  if (isLoading) {
    return (
      <View style={[styles.centered, isDarkMode && styles.containerDark]}>
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }
  if (error) {
    return (
      <View style={[styles.centered, isDarkMode && styles.containerDark]}>
        <Text style={isDarkMode && styles.textDark}>Failed to load topics.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>Study by Topic</Text>
      <TextInput
        style={[styles.searchBar, isDarkMode && styles.searchBarDark]}
        placeholder="Search for a topic..."
        placeholderTextColor={isDarkMode ? "#888" : "#aaa"}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TopicCard
            item={item}
            onPress={() => handleTopicSelect(item.id.toString())}
            isDarkMode={isDarkMode}
          />
        )}
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 100 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, color: '#1f2937' },
  searchBar: { height: 44, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 16, marginHorizontal: 16, marginBottom: 16, backgroundColor: '#fff', fontSize: 16, color: '#000' },
  card: { flex: 1, margin: 8, aspectRatio: 1, backgroundColor: '#fff', borderRadius: 12, justifyContent: 'center', alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.20, shadowRadius: 1.41, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '600', textAlign: 'center', marginTop: 8, color: '#374151', paddingHorizontal: 4 },
  // Dark Mode Styles
  containerDark: { backgroundColor: '#121212' },
  headerTitleDark: { color: '#fff' },
  searchBarDark: { backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' },
  cardDark: { backgroundColor: '#1f2937' },
  cardTextDark: { color: '#fff' },
  textDark: { color: '#fff' },
});