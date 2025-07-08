import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, TextInput, TouchableOpacity, 
    Image, ScrollView, SafeAreaView, ActivityIndicator, Alert, Button, Platform
} from 'react-native';
import { useRouter, Stack, useNavigation } from 'expo-router';
import useSWR from 'swr';
import { useAppContext } from '@/context/AppContext';
import apiClient from '@/lib/apiClient';
import * as ImagePicker from 'expo-image-picker';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';

// --- Multi-Select Modal Component ---
const MultiSelectModal = ({ isVisible, title, options, selected, onSelect, onClose, isDarkMode }: any) => {
    const [currentSelection, setCurrentSelection] = useState(new Set(selected));

    useEffect(() => {
        setCurrentSelection(new Set(selected));
    }, [selected, isVisible]);

    const handleToggle = (id: number) => {
        const newSelection = new Set(currentSelection);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            if (title.includes("Exams") && newSelection.size >= 3) {
                Alert.alert("Limit Reached", "You can select a maximum of 3 focus exams.");
                return;
            }
            newSelection.add(id);
        }
        setCurrentSelection(newSelection);
    };

    const handleConfirm = () => {
        onSelect(Array.from(currentSelection));
        onClose();
    };

    return (
        <Modal isVisible={isVisible} onBackdropPress={onClose} style={styles.modal}>
            <View style={[styles.modalContent, isDarkMode && styles.modalContentDark]}>
                <Text style={[styles.modalTitle, isDarkMode && styles.textDark]}>{title}</Text>
                <ScrollView>
                    {options?.map((item: any) => {
                        const isSelected = currentSelection.has(item.id);
                        return (
                            <TouchableOpacity key={item.id} style={styles.modalItem} onPress={() => handleToggle(item.id)}>
                                <Ionicons name={isSelected ? "checkbox" : "square-outline"} size={24} color={isSelected ? "#1976d2" : (isDarkMode ? "#fff" : "#000")} />
                                <Text style={[styles.modalItemText, isDarkMode && styles.textDark]}>{item.name}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
                <Button title="Confirm" onPress={handleConfirm} />
            </View>
        </Modal>
    );
};

export default function EditProfileScreen() {
    const { user, fetcher, theme } = useAppContext();
    const router = useRouter();
    const navigation = useNavigation();
    const isDarkMode = theme === 'dark';

    const { data: profileData, mutate } = useSWR(user ? '/auth/profile/' : null, fetcher);
    const { data: topicsData } = useSWR('/topics/', fetcher);
    const { data: examsData } = useSWR('/exams/', fetcher);

    const [formData, setFormData] = useState({
        firstName: '', lastName: '', qualifications: '', place: '', date_of_birth: '',
        preferred_difficulty: '',
        preferred_exams_ids: [] as number[],
        preferred_topics_ids: [] as number[],
    });
    const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isExamModalVisible, setExamModalVisible] = useState(false);
    const [isTopicModalVisible, setTopicModalVisible] = useState(false);

    useEffect(() => {
        if (profileData) {
            setFormData({
                firstName: profileData.user?.first_name || '',
                lastName: profileData.user?.last_name || '',
                qualifications: profileData.qualifications || '',
                place: profileData.place || '',
                date_of_birth: profileData.date_of_birth || '',
                preferred_difficulty: profileData.preferred_difficulty || '',
                preferred_exams_ids: profileData.preferred_exams?.map((e: any) => e.id) || [],
                preferred_topics_ids: profileData.preferred_topics?.map((t: any) => t.id) || [],
            });
        }
    }, [profileData]);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions.');
            return;
        }
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });
        if (!result.canceled) {
            setImage(result.assets[0]);
        }
    };

    const handleUpdate = async () => {
        setIsSubmitting(true);
        const data = new FormData();
        data.append('user', JSON.stringify({ first_name: formData.firstName, last_name: formData.lastName }));
        data.append('qualifications', formData.qualifications);
        data.append('place', formData.place);
        data.append('date_of_birth', formData.date_of_birth);
        data.append('preferred_difficulty', formData.preferred_difficulty);
        formData.preferred_exams_ids.forEach(id => data.append('preferred_exams_ids', id.toString()));
        formData.preferred_topics_ids.forEach(id => data.append('preferred_topics_ids', id.toString()));

        if (image) {
            let uriParts = image.uri.split('.');
            let fileType = uriParts[uriParts.length - 1];
            data.append('profile_photo_upload', {
                uri: image.uri,
                name: `photo.${fileType}`,
                type: `image/${fileType}`,
            } as any);
        }

        try {
            await apiClient.patch('/auth/profile/', data, { headers: { 'Content-Type': 'multipart/form-data' } });
            await mutate();
            Alert.alert("Success", "Your profile has been updated.");
            router.back();
        } catch (error) {
            Alert.alert("Error", "Failed to update profile.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!profileData) return <ActivityIndicator style={{flex: 1}} />;

    return (
        <SafeAreaView style={[styles.safeArea, isDarkMode && styles.containerDark]}>
            {/* Custom header with sidebar (drawer) button */}
            <View style={[styles.header, isDarkMode && styles.headerDark]}>
                <TouchableOpacity
                    onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                    style={styles.menuButton}
                    accessibilityRole="button"
                    accessibilityLabel="Open sidebar"
                >
                    <Ionicons name="menu" size={28} color={isDarkMode ? "#fff" : "#1f2937"} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>Edit Profile</Text>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                >
                    <Ionicons name="arrow-back-outline" size={28} color={isDarkMode ? "#fff" : "#1f2937"} />
                </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.avatarSection}>
                    <Image
                        source={{ uri: image?.uri || profileData?.profile_photo || 'https://via.placeholder.com/150' }}
                        style={styles.avatar}
                    />
                    <TouchableOpacity onPress={pickImage}>
                        <Text style={styles.changePhotoText}>Change Photo</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.form}>
                    <Text style={[styles.label, isDarkMode && styles.textDark]}>First Name</Text>
                    <TextInput style={[styles.input, isDarkMode && styles.inputDark]} value={formData.firstName} onChangeText={val => setFormData(p => ({...p, firstName: val}))} />
                    
                    <Text style={[styles.label, isDarkMode && styles.textDark]}>Last Name</Text>
                    <TextInput style={[styles.input, isDarkMode && styles.inputDark]} value={formData.lastName} onChangeText={val => setFormData(p => ({...p, lastName: val}))} />
                    
                    <Text style={[styles.label, isDarkMode && styles.textDark]}>Qualifications</Text>
                    <TextInput style={[styles.input, isDarkMode && styles.inputDark, {height: 80}]} value={formData.qualifications} onChangeText={val => setFormData(p => ({...p, qualifications: val}))} multiline />

                    <Text style={[styles.label, isDarkMode && styles.textDark]}>My Focus Exams (up to 3)</Text>
                    <TouchableOpacity style={[styles.selectButton, isDarkMode && styles.inputDark]} onPress={() => setExamModalVisible(true)}>
                        <Text style={isDarkMode && styles.textDark}>{formData.preferred_exams_ids.length} selected</Text>
                    </TouchableOpacity>

                    <Text style={[styles.label, isDarkMode && styles.textDark]}>My Preferred Topics</Text>
                    <TouchableOpacity style={[styles.selectButton, isDarkMode && styles.inputDark]} onPress={() => setTopicModalVisible(true)}>
                        <Text style={isDarkMode && styles.textDark}>{formData.preferred_topics_ids.length} selected</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.button} onPress={handleUpdate} disabled={isSubmitting}>
                    {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Changes</Text>}
                </TouchableOpacity>
            </ScrollView>

            <MultiSelectModal
                isVisible={isExamModalVisible}
                title="Select Focus Exams"
                options={examsData?.flatMap((c: any) => c.exams) || []}
                selected={formData.preferred_exams_ids}
                onSelect={(ids) => setFormData(p => ({...p, preferred_exams_ids: ids}))}
                onClose={() => setExamModalVisible(false)}
                isDarkMode={isDarkMode}
            />
            <MultiSelectModal
                isVisible={isTopicModalVisible}
                title="Select Preferred Topics"
                options={topicsData || []}
                selected={formData.preferred_topics_ids}
                onSelect={(ids) => setFormData(p => ({...p, preferred_topics_ids: ids}))}
                onClose={() => setTopicModalVisible(false)}
                isDarkMode={isDarkMode}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f0f2f5' },
    container: { padding: 24 },
    containerDark: { backgroundColor: '#121212' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 10 : 8,
        paddingBottom: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    headerDark: {
        backgroundColor: '#1f2937',
        borderBottomColor: '#374151',
    },
    menuButton: { padding: 8, marginRight: 6 },
    backButton: { padding: 8, marginLeft: 6 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', letterSpacing: 1, flex: 1, textAlign: 'center' },
    headerTitleDark: { color: '#fff' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    avatarSection: { alignItems: 'center', marginBottom: 32 },
    avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 12, backgroundColor: '#e5e7eb' },
    changePhotoText: { color: '#1976d2', fontWeight: 'bold', fontSize: 16 },
    form: { marginBottom: 24 },
    label: { fontSize: 14, fontWeight: '600', color: '#4b5563', marginBottom: 8 },
    input: { height: 50, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 16, fontSize: 16, marginBottom: 16 },
    inputDark: { backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' },
    button: { backgroundColor: '#1976d2', paddingVertical: 16, borderRadius: 8, alignItems: 'center' },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    textDark: { color: '#fff' },
    selectButton: { height: 50, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 16, marginBottom: 16, justifyContent: 'center' },
    modal: { justifyContent: 'flex-end', margin: 0 },
    modalContent: { backgroundColor: 'white', padding: 22, borderTopRightRadius: 17, borderTopLeftRadius: 17, height: '70%' },
    modalContentDark: { backgroundColor: '#1f2937' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
    modalItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    modalItemText: { marginLeft: 15, fontSize: 16 },
});