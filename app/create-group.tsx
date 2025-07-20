'use client';

import React, { useState } from 'react';
import { 
    View, Text, TextInput, StyleSheet, Alert, 
    TouchableOpacity, SafeAreaView, ActivityIndicator, ScrollView 
} from 'react-native';
import apiClient from '@/lib/apiClient';
import { useRouter, Stack } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { Ionicons } from '@expo/vector-icons';

export default function CreateGroupScreen() {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    const { theme } = useAppContext();
    const isDarkMode = theme === 'dark';

    const handleCreateGroup = async () => {
        if (!name.trim()) {
            Alert.alert("Name Required", "Please enter a name for your group.");
            return;
        }
        setIsSubmitting(true);
        try {
            await apiClient.post('/messaging/groups/create/', { name, description });
            Alert.alert("Success!", "Your group has been created successfully.");
            router.back();
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.detail || "Failed to create group. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
            <Stack.Screen options={{ title: "Create New Group", headerTintColor: isDarkMode ? '#fff' : '#000' }} />
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.headerContainer}>
                    <Ionicons name="people-circle-outline" size={60} color={isDarkMode ? '#A78BFA' : '#4A3780'} />
                    <Text style={[styles.header, isDarkMode && styles.textDark]}>Start a New Study Group</Text>
                    <Text style={[styles.subtitle, isDarkMode && styles.textSecondaryDark]}>Create a space for your followers to learn and collaborate.</Text>
                </View>
                
                <TextInput 
                    style={[styles.input, isDarkMode && styles.inputDark]} 
                    placeholder="Group Name (e.g., LDC Study Circle)" 
                    value={name} 
                    onChangeText={setName}
                    placeholderTextColor={isDarkMode ? '#888' : '#aaa'}
                />

                <TextInput 
                    style={[styles.input, styles.textArea, isDarkMode && styles.inputDark]} 
                    placeholder="Group Description (Optional)" 
                    value={description} 
                    onChangeText={setDescription}
                    placeholderTextColor={isDarkMode ? '#888' : '#aaa'}
                    multiline
                />

                <TouchableOpacity 
                    style={[styles.submitButton, (isSubmitting || !name.trim()) && styles.submitButtonDisabled]} 
                    onPress={handleCreateGroup} 
                    disabled={isSubmitting || !name.trim()}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Create Group</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2f5' },
    containerDark: { backgroundColor: '#121212' },
    scrollContainer: { padding: 20 },
    headerContainer: { alignItems: 'center', marginBottom: 30 },
    header: { fontSize: 24, fontWeight: 'bold', marginTop: 16 },
    subtitle: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginTop: 8 },
    input: {
        backgroundColor: '#fff',
        borderColor: '#ccc', borderWidth: 1,
        borderRadius: 8, marginBottom: 20, paddingHorizontal: 15, fontSize: 16,
        height: 50,
    },
    textArea: { height: 100, textAlignVertical: 'top', paddingTop: 15 },
    inputDark: { backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' },
    submitButton: { backgroundColor: '#4A3780', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 20 },
    submitButtonDisabled: { backgroundColor: '#aaa' },
    submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    textDark: { color: '#fff' },
    textSecondaryDark: { color: '#9ca3af' },
});
