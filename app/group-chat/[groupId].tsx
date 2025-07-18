import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function GroupChatScreen() {
    const { user } = useAppContext();
    const { groupId } = useLocalSearchParams<{ groupId: string }>();
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        const connect = async () => {
            const token = await AsyncStorage.getItem('access_token');
            if (!token) return;
            
            // Connect to the new Group Chat WebSocket
            const wsUrl = `ws://192.168.1.2:8000/ws/group-chat/${groupId}/?token=${token}`;
            ws.current = new WebSocket(wsUrl);
            ws.current.onmessage = (e) => {
                const data = JSON.parse(e.data);
                setMessages(prev => [data.message, ...prev]);
            };
        };
        connect();
        return () => ws.current?.close();
    }, [groupId]);

    const handleSend = () => {
        if (newMessage.trim() && ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ 'message': newMessage }));
            setNewMessage('');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ title: "Group Chat" }} />
            <FlatList
                data={messages}
                inverted
                renderItem={({ item }) => (
                    <View style={item.sender.username === user?.username ? styles.myMessage : styles.theirMessage}>
                        <Text style={styles.senderName}>{item.sender.username}</Text>
                        <Text style={styles.messageText}>{item.text}</Text>
                    </View>
                )}
            />
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={90}>
                <View style={styles.inputContainer}>
                    <TextInput value={newMessage} onChangeText={setNewMessage} style={styles.input} placeholder="Type a message..." />
                    <Button title="Send" onPress={handleSend} />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    inputContainer: { flexDirection: 'row', padding: 8 },
    input: { flex: 1, borderWidth: 1, borderColor: 'gray', borderRadius: 20, padding: 10 },
    myMessage: { alignSelf: 'flex-end', backgroundColor: '#dcf8c6', padding: 10, borderRadius: 20, marginVertical: 4 },
    theirMessage: { alignSelf: 'flex-start', backgroundColor: '#fff', padding: 10, borderRadius: 20, marginVertical: 4 },
    senderName: { fontWeight: 'bold', fontSize: 12, color: '#4A3780' },
    messageText: { fontSize: 16 }
});
