import React, { useState } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    StyleSheet, 
    Alert, 
    ActivityIndicator, 
    KeyboardAvoidingView, 
    Platform 
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import apiClient from '@/lib/apiClient';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
    // --- State Management ---
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    // --- Form Submission Handler ---
    const handleRegister = async () => {
        if (!username || !email || !password) {
            Alert.alert("Error", "Please fill in all fields.");
            return;
        }
        
        setIsLoading(true);
        try {
            await apiClient.post('/auth/register/', { username, email, password });
            
            // On success, show a confirmation and redirect to the login page
            Alert.alert("Success!", "Your account has been created. Please log in.", [
                { text: "OK", onPress: () => router.replace('/login') }
            ]);

        } catch (error: any) {
            const errorMessage = error.response?.data?.error || "Registration failed. The username may already be taken.";
            Alert.alert("Registration Failed", errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"} 
            style={styles.container}
        >
            {/* Header Section */}
            <View style={styles.header}>
                <Ionicons name="person-add-outline" size={60} color="#1976d2" />
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Start your learning journey today</Text>
            </View>
            
            {/* Input Fields Section */}
            <View>
                <TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
                <TextInput style={styles.input} placeholder="Email Address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
            </View>

            {/* Submit Button */}
            <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={isLoading}>
                {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign Up</Text>}
            </TouchableOpacity>

            {/* Footer Link to Login */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <Link href="/login" asChild>
                    <TouchableOpacity>
                        <Text style={styles.linkText}>Log In</Text>
                    </TouchableOpacity>
                </Link>
            </View>
        </KeyboardAvoidingView>
    );
}

// --- Styles for the Screen (reused from Login) ---
const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f4f5f7' },
    header: { alignItems: 'center', marginBottom: 40 },
    title: { fontSize: 32, fontWeight: 'bold', color: '#1f2937', marginTop: 16 },
    subtitle: { fontSize: 16, color: '#6b7280', marginTop: 8 },
    input: { height: 50, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, marginBottom: 16, paddingHorizontal: 16, fontSize: 16 },
    button: { backgroundColor: '#1976d2', paddingVertical: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    footer: { marginTop: 32, flexDirection: 'row', justifyContent: 'center' },
    footerText: { color: '#6b7280', fontSize: 14 },
    linkText: { color: '#1976d2', fontWeight: 'bold', fontSize: 14 },
});
