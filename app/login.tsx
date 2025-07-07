import React, { useState, useEffect } from 'react';
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
import { useAppContext } from '@/context/AppContext';
import apiClient from '@/lib/apiClient';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
    // --- State Management ---
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    const { login, user, isLoading } = useAppContext();

    // --- Automatic Redirection ---
    // If a user is already logged in, send them to the main app.
    useEffect(() => {
        if (!isLoading && user) {
            router.replace('/(tabs)');
        }
    }, [isLoading, user, router]);

    // --- Form Submission Handler ---
    const handleLogin = async () => {
        if (!username || !password) {
            Alert.alert("Error", "Please enter both username and password.");
            return;
        }
        
        setIsSubmitting(true);
        try {
            // 1. Get tokens from the backend
            const tokenResponse = await apiClient.post('/auth/token/', { username, password });
            const { access, refresh } = tokenResponse.data;
            
            // 2. Call the global login function, which handles saving tokens and fetching the user profile
            const profile = await login(access, refresh);

            // 3. Redirect based on the user's role
            if (profile?.is_owner) {
                Alert.alert("Institute Account", "This app is for students. Please use the web portal to access institute features.");
                // Log them out of the mobile app session
                await login('', ''); // Effectively logs them out by clearing tokens
            } else {
                router.replace('/(tabs)'); // Redirect students to the main app
            }

        } catch (error) {
            Alert.alert("Login Failed", "Please check your username and password.");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // While checking for an existing session, show nothing to avoid a flash of the login screen
    if (isLoading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#1976d2" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"} 
            style={styles.container}
        >
            {/* Header Section */}
            <View style={styles.header}>
                <Ionicons name="school-outline" size={60} color="#1976d2" />
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Log in to continue your preparation</Text>
            </View>
            
            {/* Input Fields Section */}
            <View>
                <TextInput
                    style={styles.input}
                    placeholder="Username"
                    placeholderTextColor="#888"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    returnKeyType="next"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#888"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    returnKeyType="done"
                />
            </View>

            {/* Submit Button */}
            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
            </TouchableOpacity>

            {/* Footer Link to Register */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <Link href="/register" asChild>
                    <TouchableOpacity>
                        <Text style={styles.linkText}>Sign Up</Text>
                    </TouchableOpacity>
                </Link>
            </View>
        </KeyboardAvoidingView>
    );
}

// --- Styles for the Screen ---
const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        justifyContent: 'center', 
        padding: 24, 
        backgroundColor: '#f4f5f7' 
    },
    header: { 
        alignItems: 'center', 
        marginBottom: 40 
    },
    title: { 
        fontSize: 32, 
        fontWeight: 'bold', 
        color: '#1f2937', 
        marginTop: 16 
    },
    subtitle: { 
        fontSize: 16, 
        color: '#6b7280', 
        marginTop: 8 
    },
    input: { 
        height: 50, 
        backgroundColor: '#fff', 
        borderWidth: 1, 
        borderColor: '#e5e7eb', 
        borderRadius: 8, 
        marginBottom: 16, 
        paddingHorizontal: 16, 
        fontSize: 16 
    },
    button: { 
        backgroundColor: '#1976d2', 
        paddingVertical: 16, 
        borderRadius: 8, 
        alignItems: 'center',
        marginTop: 8
    },
    buttonText: { 
        color: '#fff', 
        fontWeight: 'bold', 
        fontSize: 16 
    },
    footer: { 
        marginTop: 32, 
        flexDirection: 'row', 
        justifyContent: 'center' 
    },
    footerText: { 
        color: '#6b7280', 
        fontSize: 14 
    },
    linkText: { 
        color: '#1976d2', 
        fontWeight: 'bold', 
        fontSize: 14 
    },
});