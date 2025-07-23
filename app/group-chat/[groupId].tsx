'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
    View, Text, TextInput, FlatList, StyleSheet, 
    KeyboardAvoidingView, Platform, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator 
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import useSWR from 'swr';
import { useAppContext } from '@/context/AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function GroupChatScreen() {
    const { user, fetcher, theme } = useAppContext();
    const isDarkMode = theme === 'dark';
    const { groupId } = useLocalSearchParams<{ groupId: string }>();
    
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const ws = useRef<WebSocket | null>(null);

    // Fetch group details for the header
    const { data: groupInfo } = useSWR(`/messaging/groups/${groupId}/`, fetcher);
    // Fetch the initial message history for the group
    const { data: initialMessages, isLoading } = useSWR(`/messaging/groups/${groupId}/messages/`, fetcher);

    useEffect(() => {
        if (initialMessages) {
            setMessages(initialMessages.slice().reverse());
        }
    }, [initialMessages]);

    useEffect(() => {
        const connect = async () => {
            const token = await AsyncStorage.getItem('access_token');
            if (!token) return;

            // IMPORTANT: Replace with your computer's local IP address
            const wsUrl = `ws://192.168.1.4:8000/ws/group-chat/${groupId}/?token=${token}`;
            ws.current = new WebSocket(wsUrl);

            ws.current.onopen = () => setIsConnected(true);
            ws.current.onmessage = (e) => {
                const data = JSON.parse(e.data);
                setMessages(prev => [data, ...prev]);
            };
            ws.current.onerror = (e) => Alert.alert("Connection Error", "Could not connect to the chat server.");
            ws.current.onclose = () => setIsConnected(false);
        };
        connect();
        return () => ws.current?.close();
    }, [groupId]);

    const handleSend = () => {
        if (newMessage.trim() && ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ 'message': newMessage }));
            setNewMessage('');
        } else {
            Alert.alert("Not Connected", "You are not connected to the chat. Please try again.");
        }
    };

    if (isLoading) {
        return <View style={styles.centered}><ActivityIndicator/></View>
    }

    return (
        <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
            <Stack.Screen options={{ 
                headerShown: true, 
                title: groupInfo?.name || "Group Chat",
                headerTintColor: isDarkMode ? '#fff' : '#000'
            }} />
            <FlatList
                data={messages}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                renderItem={({ item }) => (
                    <View style={[
                        styles.messageContainer, 
                        item.sender?.username === user?.username ? styles.myMessageContainer : styles.theirMessageContainer
                    ]}>
                        {item.sender?.username !== user?.username && (
                            <Text style={[styles.senderName, isDarkMode && styles.textSecondaryDark]}>{item.sender?.username}</Text>
                        )}
                        <View style={[styles.messageBubble, item.sender?.username === user?.username ? styles.myMessage : styles.theirMessage, isDarkMode && styles.theirMessageDark]}>
                            <Text style={item.sender?.username === user?.username ? styles.myMessageText : styles.theirMessageText}>
                                {item.text}
                            </Text>
                        </View>
                    </View>
                )}
                inverted
                contentContainerStyle={{paddingVertical: 10, paddingHorizontal: 10}}
            />
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"} 
                keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
            >
                <View style={[styles.inputContainer, isDarkMode && styles.inputContainerDark]}>
                    <TextInput 
                        value={newMessage} 
                        onChangeText={setNewMessage} 
                        style={[styles.input, isDarkMode && styles.inputDark]} 
                        placeholder="Type a message..." 
                        placeholderTextColor={isDarkMode ? "#888" : "#999"}
                    />
                    <TouchableOpacity style={[styles.sendButton, !isConnected && styles.sendButtonDisabled]} onPress={handleSend} disabled={!isConnected || !newMessage.trim()}>
                        <Ionicons name="send" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2f5' },
    containerDark: { backgroundColor: '#121212' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    inputContainer: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderTopColor: '#ddd', alignItems: 'center' },
    inputContainerDark: { backgroundColor: '#1f2937', borderTopColor: '#374151' },
    input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingVertical: 10, paddingHorizontal: 15, marginRight: 10, fontSize: 16 },
    inputDark: { borderColor: '#555', color: '#fff' },
    sendButton: { backgroundColor: '#4A3780', borderRadius: 22, width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    sendButtonDisabled: { backgroundColor: '#aaa' },
    messageContainer: { marginVertical: 4, },
    myMessageContainer: { alignItems: 'flex-end' },
    theirMessageContainer: { alignItems: 'flex-start' },
    messageBubble: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, maxWidth: '80%' },
    myMessage: { backgroundColor: '#4A3780' },
    theirMessage: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee' },
    theirMessageDark: { backgroundColor: '#262626', borderColor: '#333' },
    myMessageText: { fontSize: 16, color: '#fff' },
    theirMessageText: { fontSize: 16 },
    senderName: { fontSize: 12, color: '#6b7280', marginBottom: 4, marginLeft: 10 },
    textDark: { color: '#fff' },
    textSecondaryDark: { color: '#9ca3af' },
});
