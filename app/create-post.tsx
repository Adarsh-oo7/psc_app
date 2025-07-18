'use client';

import React, { useState } from 'react';
import { 
    View, Text, StyleSheet, TextInput, Image, 
    Alert, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '@/lib/apiClient';
import { useRouter, Stack } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { Ionicons } from '@expo/vector-icons';

export default function CreatePostScreen() {
    const [title, setTitle] = useState('');
    const [file, setFile] = useState<ImagePicker.ImagePickerAsset | null>(null);
    const [tags, setTags] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    const { theme } = useAppContext();
    const isDarkMode = theme === 'dark';

    const pickFile = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need access to your photos to create a post.');
            return;
        }
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            setFile(result.assets[0]);
        }
    };

    const handleSubmit = async () => {
        if (!title.trim() || !file) {
            Alert.alert("Missing Info", "Please provide a title and select a file.");
            return;
        }
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('tags_input', tags.trim());
        
        const fileObject = {
            uri: file.uri,
            name: file.fileName || `upload.${file.uri.split('.').pop()}`,
            type: file.mimeType || 'application/octet-stream',
        };
        formData.append('file', fileObject as any);

        try {
            await apiClient.post('/community/posts/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            Alert.alert("Success", "Your post has been uploaded!");
            router.back();
        } catch (error) {
            console.error("Upload failed:", error);
            Alert.alert("Error", "Failed to create post. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
            <Stack.Screen options={{ title: "Create New Post", headerTintColor: isDarkMode ? '#fff' : '#000' }} />
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={[styles.header, isDarkMode && styles.textDark]}>Share something new</Text>
                
                <TextInput 
                    style={[styles.input, isDarkMode && styles.inputDark]} 
                    placeholder="Enter a descriptive title..." 
                    value={title} 
                    onChangeText={setTitle}
                    placeholderTextColor={isDarkMode ? '#888' : '#aaa'}
                />

                <TextInput 
                    style={[styles.input, isDarkMode && styles.inputDark]} 
                    placeholder="Add tags (e.g., maths, gk, tips)" 
                    value={tags} 
                    onChangeText={setTags}
                    placeholderTextColor={isDarkMode ? '#888' : '#aaa'}
                />

                <TouchableOpacity style={[styles.pickButton, isDarkMode && styles.pickButtonDark]} onPress={pickFile}>
                    <Ionicons name="image-outline" size={22} color={isDarkMode ? '#A78BFA' : '#4A3780'} />
                    <Text style={[styles.pickButtonText, isDarkMode && styles.textDark]}>
                        {file ? 'Change Photo or Video' : 'Pick a Photo or Video'}
                    </Text>
                </TouchableOpacity>

                {file && (
                    <View style={styles.previewContainer}>
                        <Image source={{ uri: file.uri }} style={styles.preview} />
                        <TouchableOpacity onPress={() => setFile(null)} style={styles.removeButton}>
                            <Ionicons name="close-circle" size={32} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                )}

                <TouchableOpacity 
                    style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
                    onPress={handleSubmit} 
                    disabled={isSubmitting}
                >
                    {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Submit Post</Text>}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2f5' },
    containerDark: { backgroundColor: '#121212' },
    scrollContainer: { padding: 20 },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    input: { height: 50, borderColor: '#ccc', borderWidth: 1, borderRadius: 8, marginBottom: 20, paddingHorizontal: 15, fontSize: 16 },
    inputDark: { backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' },
    pickButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#4A3780', borderStyle: 'dashed' },
    pickButtonDark: { borderColor: '#A78BFA' },
    pickButtonText: { marginLeft: 10, fontSize: 16, fontWeight: '600' },
    previewContainer: { marginVertical: 20, alignItems: 'center' },
    preview: { width: '100%', height: 200, borderRadius: 8 },
    removeButton: { position: 'absolute', top: -12, right: -12 },
    submitButton: { backgroundColor: '#4A3780', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 20 },
    submitButtonDisabled: { backgroundColor: '#aaa' },
    submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    textDark: { color: '#fff' },
});
