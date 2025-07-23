import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PYQExamScreen() {
  return (
    <View style={styles.container}>
      <Text>Previous Year Questions Page</Text>
      <Text style={styles.subtitle}>This feature is coming soon!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  subtitle: { fontSize: 16, color: 'gray', marginTop: 8 }
});
