import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '@/context/AppContext';

// Reusable component for the grid buttons
const ActionButton = ({ title, icon, onPress, isDarkMode }: any) => (
  <TouchableOpacity style={[styles.actionButton, isDarkMode && styles.actionButtonDark]} onPress={onPress}>
    <View style={[styles.iconContainer, isDarkMode && styles.iconContainerDark]}>
      <Ionicons name={icon} size={28} color="#4A3780" />
    </View>
    <Text style={[styles.actionButtonText, isDarkMode && styles.textDark]}>{title}</Text>
  </TouchableOpacity>
);

export default function HomeScreen() {
  const router = useRouter();
  const { theme } = useAppContext();
  const isDarkMode = theme === 'dark';

  return (
    <SafeAreaView style={[styles.safeArea, isDarkMode && styles.safeAreaDark]}>
      <ScrollView 
        style={[styles.container, isDarkMode && styles.containerDark]}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* The header is now part of this page, not the layout */}
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
              <Ionicons name="menu" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>PSC WINNER</Text>
            <TouchableOpacity onPress={() => router.push('/inbox')}>
              <Ionicons name="notifications-outline" size={24} color="#fff" />
            </TouchableOpacity>
        </View>

        {/* Congratulations Banner */}
        <View style={styles.bannerContainer}>
          <Image 
            // You can replace this with a real image URL from your backend or assets
            source={{ uri: 'https://i.imgur.com/vHqVp1A.png' }} 
            style={styles.bannerImage} 
          />
        </View>

        {/* Action Grid */}
        <View style={styles.grid}>
          <ActionButton title="Learn" icon="library-outline" onPress={() => router.push('/(tabs)/study')} isDarkMode={isDarkMode} />
          <ActionButton title="Practice" icon="barbell-outline" onPress={() => router.push('/(tabs)/practice')} isDarkMode={isDarkMode} />
          <ActionButton title="Quiz" icon="timer-outline" onPress={() => router.push('/quiz?mode=preferred')} isDarkMode={isDarkMode} />
          <ActionButton title="Daily Exam" icon="calendar-outline" onPress={() => router.push('/quiz?daily=true')} isDarkMode={isDarkMode} />
          <ActionButton title="Model Exam" icon="school-outline" onPress={() => router.push('/(tabs)/practice')} isDarkMode={isDarkMode} />
          <ActionButton title="PYQ Exam" icon="document-text-outline" onPress={() => router.push('/(tabs)/practice')} isDarkMode={isDarkMode} />
          <ActionButton title="Game" icon="game-controller-outline" onPress={() => Alert.alert("Coming Soon!")} isDarkMode={isDarkMode} />
          <ActionButton title="Battle" icon="flame-outline" onPress={() => Alert.alert("Coming Soon!")} isDarkMode={isDarkMode} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#4A3780' },
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: '#4A3780',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  bannerContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  bannerImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    marginTop: 24,
  },
  actionButton: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(74, 55, 128, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  // Dark Mode Styles
  containerDark: { backgroundColor: '#121212' },
  textDark: { color: '#fff' },
  actionButtonDark: {
      backgroundColor: '#1f2937',
      borderColor: '#374151'
  },
});