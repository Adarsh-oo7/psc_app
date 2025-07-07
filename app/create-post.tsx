import React, { useState } from 'react';
import { View, Text, TextInput, Button, Image, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '@/lib/apiClient';
import { useRouter } from 'expo-router';

export default function CreatePostScreen() {
    const [title, setTitle] = useState('');
    const [file, setFile] = useState<ImagePicker.ImagePickerAsset | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const pickFile = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need access to your photos to create a post.');
            return;
        }
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All, // Allows images and videos
        });

        if (!result.canceled) {
            setFile(result.assets[0]);
        }
    };

    const handleSubmit = async () => {
        if (!title || !file) {
            Alert.alert("Missing Info", "Please provide a title and select a file.");
            return;
        }
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('title', title);
        
        let uriParts = file.uri.split('.');
        let fileType = uriParts[uriParts.length - 1];
        formData.append('file', {
            uri: file.uri,
            name: `upload.${fileType}`,
            type: `${file.type}/${fileType}`,
        } as any);

        try {
            await apiClient.post('/community/posts/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            Alert.alert("Success", "Your post has been uploaded!");
            router.back();
        } catch (error) {
            Alert.alert("Error", "Failed to create post.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Create a New Post</Text>
            <TextInput style={styles.input} placeholder="Post Title" value={title} onChangeText={setTitle} />
            <Button title="Pick a Photo or Video" onPress={pickFile} />
            {file && <Image source={{ uri: file.uri }} style={styles.preview} />}
            <Button title={isSubmitting ? "Uploading..." : "Submit Post"} onPress={handleSubmit} disabled={isSubmitting} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    input: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    preview: {
        width: '100%',
        height: 200,
        marginVertical: 20,
    },
});