import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Platform } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '@/context/AppContext';
import { LinearGradient } from 'expo-linear-gradient';
import { DrawerActions } from '@react-navigation/native';

const sections = [
  { title: "Learn", icon: "library-outline", route: "/(tabs)/topics" },
  { title: "Practice", icon: "barbell-outline", route: "/(tabs)/practice" },
  { title: "Quiz", icon: "timer-outline", route: "/(tabs)/quiz" },
  { title: "Daily Exam", icon: "calendar-outline", route: "/(tabs)/daily-exam" },
  { title: "Model Exam", icon: "school-outline", route: "/(tabs)/model-exam" },
  { title: "PYQ Exam", icon: "document-text-outline", route: "/(tabs)/pyq-exam" },
  { title: "Game", icon: "game-controller-outline", route: "/(tabs)/game" },
  { title: "Battle", icon: "flame-outline", route: "/(tabs)/battle" },
];

const comingSoon = ["Game", "Battle"];

const ActionButton = ({ title, icon, onPress, isDarkMode }: any) => (
  <TouchableOpacity
    accessibilityRole="button"
    style={[styles.actionButton, isDarkMode && styles.actionButtonDark]}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <View style={[styles.iconContainer, isDarkMode && styles.iconContainerDark]}>
      <Ionicons name={icon} size={30} color={isDarkMode ? "#cabfff" : "#4A3780"} />
    </View>
    <Text style={[styles.actionButtonText, isDarkMode && styles.textDark]}>
      {title}
    </Text>
  </TouchableOpacity>
);

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { theme } = useAppContext();
  const isDarkMode = theme === 'dark';

  return (
    <SafeAreaView style={[styles.safeArea, isDarkMode && styles.safeAreaDark]}>
      <ScrollView
        style={[styles.container, isDarkMode && styles.containerDark]}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, isDarkMode && styles.headerDark]}>
          {/* Sidebar (drawer) button */}
          <TouchableOpacity
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            style={styles.sidebarButton}
            accessibilityRole="button"
            accessibilityLabel="Open sidebar"
          >
            <Ionicons name="menu" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>PSC <Text style={styles.headerTitleHighlight}>WINNER</Text></Text>
          <TouchableOpacity
            onPress={() => router.push('/inbox')}
            style={styles.notificationButton}
            accessibilityRole="button"
            accessibilityLabel="Open notifications"
          >
            <Ionicons name="notifications-outline" size={26} color="#fff" />
            {/* Example notification dot */}
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        {/* Banner */}
        <View style={styles.bannerContainer}>
          <Image
            source={{ uri: 'https://www.wbhrb.in/wp-content/uploads/2025/02/kpsc-kas-result-768x432.jpg' }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
          {/* Gradient overlay for readability */}
          <LinearGradient
            colors={['rgba(74,55,128,0.15)', 'rgba(74,55,128,0.60)']}
            style={styles.bannerGradient}
          />
          <Text style={styles.bannerText}>Welcome to your PSC Success Hub!</Text>
        </View>

        {/* Section Grid */}
        <View style={styles.grid}>
          {sections.map(({ title, icon, route }, i) => (
            <ActionButton
              key={title}
              title={title}
              icon={icon}
              isDarkMode={isDarkMode}
              onPress={
                comingSoon.includes(title)
                  ? () => Alert.alert(`${title} Mode`, `${title} Mode Coming Soon!`)
                  : () => router.push(route)
              }
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Replace deprecated shadow* and textShadow* props with boxShadow and textShadow for web
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#4A3780' },
  safeAreaDark: { backgroundColor: '#181828' },
  container: { flex: 1, backgroundColor: '#f6f7fb' },
  containerDark: { backgroundColor: '#181828' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 4 : 8,
    paddingBottom: 14,
    backgroundColor: '#4A3780',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 4,
    ...Platform.select({
      web: {
        boxShadow: "0px 8px 16px rgba(0,0,0,0.2)",
      },
      default: {
        shadowColor: "#000",
        shadowOpacity: 0.20,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 16,
        elevation: 12,
      }
    }),
  },
  headerDark: {
    backgroundColor: '#231c3a',
    shadowColor: "#cabfff",
    ...Platform.select({
      web: {
        boxShadow: "0px 8px 16px rgba(202,191,255,0.2)",
      }
    }),
  },
  sidebarButton: {
    padding: 8,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1.3,
    ...Platform.select({
      web: {
        textShadow: "0px 2px 6px #231c3a88",
      },
      default: {
        textShadowColor: '#231c3a88',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
      }
    }),
  },
  headerTitleHighlight: {
    color: '#cabfff',
    fontWeight: '900',
  },
  notificationButton: {
    padding: 8,
    position: 'relative',
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 5,
    backgroundColor: '#ff6d6a',
    position: 'absolute',
    top: 7,
    right: 8,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  bannerContainer: {
    marginHorizontal: 18,
    marginTop: 12,
    borderRadius: 18,
    overflow: 'hidden',
    minHeight: 138,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    position: 'relative',
    ...Platform.select({
      web: {
        boxShadow: "0px 8px 18px rgba(0,0,0,0.09)",
      },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.09,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
      }
    }),
    marginBottom: 16,
  },
  bannerImage: {
    width: '100%',
    height: 145,
    borderRadius: 0,
  },
  bannerGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 0,
  },
  bannerText: {
    position: 'absolute',
    left: 18,
    bottom: 16,
    color: '#fff',
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: 1.01,
    ...Platform.select({
      web: {
        textShadow: "0px 2px 8px #00000045",
      },
      default: {
        textShadowColor: "#00000045",
        textShadowRadius: 8,
        textShadowOffset: { width: 0, height: 2 },
      }
    }),
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: 8,
  },
  actionButton: {
    width: '47%',
    aspectRatio: 1.05,
    backgroundColor: '#fff',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 17,
    ...Platform.select({
      web: {
        boxShadow: "0px 4px 10px rgba(202,191,255,0.14)",
      },
      default: {
        shadowColor: '#cabfff',
        shadowOpacity: 0.14,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
        elevation: 5,
      }
    }),
    borderWidth: 1.2,
    borderColor: '#e5e7eb',
    ...Platform.select({
      android: { overflow: 'hidden' }
    }),
  },
  actionButtonDark: {
    backgroundColor: '#23223a',
    borderColor: '#3b3353',
    shadowColor: '#cabfff',
    ...Platform.select({
      web: {
        boxShadow: "0px 4px 10px rgba(202,191,255,0.14)",
      }
    }),
  },
  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(74, 55, 128, 0.09)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainerDark: {
    backgroundColor: 'rgba(202,191,255,0.08)',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3b3353',
    letterSpacing: 0.1,
    textAlign: 'center',
  },
  textDark: { color: '#cabfff' },
});